export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// The server builds the Google OAuth URL (it needs the client secret,
// which must never be exposed to the frontend), so the client just
// navigates to our own /api/oauth/login route and the server redirects
// on to Google's consent screen from there.
export const getLoginUrl = () => {
  return `${window.location.origin}/api/oauth/login`;
};
