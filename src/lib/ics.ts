// Minimal RFC 5545 (iCalendar) writer — just enough to publish a read-only, all-day
// events feed that Apple Calendar / iCloud, Google Calendar, and Outlook can all
// "subscribe" to via a plain HTTPS (or webcal://) URL. No OAuth needed on this path;
// the feed URL's secret token stands in for authentication (see the /api/calendar/feed
// route and the calendarFeedToken field on User).

export interface IcsEvent {
  id: string;
  title: string;
  date: string; // ISO date/time string
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

function formatIcsDate(dateStr: string): string {
  return dateStr.slice(0, 10).replace(/-/g, "");
}

function formatIcsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildIcsFeed(events: IcsEvent[], calendarName = "Startup OS"): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Startup OS//Shared Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    "X-WR-TIMEZONE:UTC",
  ];

  const stamp = formatIcsTimestamp(new Date());

  for (const event of events) {
    const dateValue = formatIcsDate(event.date);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@startup-os`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dateValue}`,
      `DTEND;VALUE=DATE:${dateValue}`,
      `SUMMARY:${escapeIcsText(event.title)}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  // iCalendar requires CRLF line endings.
  return lines.join("\r\n");
}
