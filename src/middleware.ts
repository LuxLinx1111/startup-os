import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protect everything except auth API routes, the login page, static assets, and
  // the public .ics calendar feed (that route is fetched directly by external
  // calendar apps with no session — it's gated by its own secret token instead).
  matcher: [
    "/((?!api/auth|api/calendar/feed|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
