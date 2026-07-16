import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

// Thin wrapper around the Google Calendar API for the one thing this app needs:
// pushing our internal due dates/target dates/meetings into a connected user's
// real Google Calendar as all-day events, so their phone/Mac get reminders through
// Google's own notification system rather than one we'd have to build ourselves.

function getOAuthClient() {
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
}

export async function isGoogleCalendarConnected(userId: string): Promise<boolean> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { refresh_token: true },
  });
  return !!account?.refresh_token;
}

async function getGoogleCalendarClientForUser(userId: string) {
  const account = await prisma.account.findFirst({ where: { userId, provider: "google" } });
  if (!account || !account.refresh_token) return null;

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: account.access_token ?? undefined,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // When the access token is expired, the googleapis client library automatically
  // uses the refresh_token to get a new one before making the API call, and emits
  // this event with the new token. We persist it (our Prisma middleware encrypts it
  // transparently) so the next sync doesn't have to re-authenticate from scratch.
  oauth2Client.on("tokens", (tokens) => {
    void prisma.account
      .update({
        where: { id: account.id },
        data: {
          ...(tokens.access_token ? { access_token: tokens.access_token } : {}),
          ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
          ...(tokens.expiry_date ? { expires_at: Math.floor(tokens.expiry_date / 1000) } : {}),
        },
      })
      .catch(() => {
        // Best-effort refresh persistence — worst case, the next sync just refreshes again.
      });
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export interface SyncableEvent {
  sourceType: "task" | "milestone" | "meeting" | "marketing";
  sourceId: string;
  title: string;
  date: Date;
}

export interface SyncResult {
  synced: number;
  failed: number;
  failedTitles: string[];
}

// Creates or updates one all-day event per item on the user's primary Google Calendar.
// All-day (date-only, no specific time) is a deliberate choice — it sidesteps timezone
// bugs entirely, and "Task X is due July 20th" reads fine as an all-day reminder.
export async function syncEventsToGoogle(
  userId: string,
  events: SyncableEvent[]
): Promise<SyncResult> {
  const calendar = await getGoogleCalendarClientForUser(userId);
  if (!calendar) {
    throw new Error("Google Calendar is not connected for this user.");
  }

  let synced = 0;
  const failedTitles: string[] = [];

  for (const event of events) {
    try {
      const dateStr = event.date.toISOString().slice(0, 10);
      const existing = await prisma.externalCalendarEvent.findUnique({
        where: {
          userId_provider_sourceType_sourceId: {
            userId,
            provider: "google",
            sourceType: event.sourceType,
            sourceId: event.sourceId,
          },
        },
      });

      const requestBody = {
        summary: event.title,
        start: { date: dateStr },
        end: { date: dateStr },
        reminders: { useDefault: true },
      };

      if (existing) {
        await calendar.events.update({
          calendarId: "primary",
          eventId: existing.externalEventId,
          requestBody,
        });
      } else {
        const created = await calendar.events.insert({ calendarId: "primary", requestBody });
        if (created.data.id) {
          await prisma.externalCalendarEvent.create({
            data: {
              userId,
              provider: "google",
              sourceType: event.sourceType,
              sourceId: event.sourceId,
              externalEventId: created.data.id,
            },
          });
        }
      }
      synced++;
    } catch {
      failedTitles.push(event.title);
    }
  }

  return { synced, failed: failedTitles.length, failedTitles };
}

export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  await prisma.account.deleteMany({ where: { userId, provider: "google" } });
  await prisma.externalCalendarEvent.deleteMany({ where: { userId, provider: "google" } });
}
