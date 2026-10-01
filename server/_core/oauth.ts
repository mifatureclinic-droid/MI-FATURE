import { COOKIE_NAME } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getOrigin(req: Request): string {
  const forwardedHost = req.headers["x-forwarded-host"];
  if (forwardedHost) {
    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
    return `${proto}://${host}`;
  }
  return `${req.protocol}://${req.get("host")}`;
}

type GoogleTokenResponse = {
  access_token: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
};

export function registerOAuthRoutes(app: Express) {
  // Step 1: redirect the browser to Google's consent screen.
  app.get("/api/oauth/login", (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res.status(500).json({ error: "GOOGLE_CLIENT_ID is not configured" });
      return;
    }

    const origin = getOrigin(req);
    const redirectUri = `${origin}/api/oauth/callback`;
    const state = Buffer.from(origin, "utf-8").toString("base64");

    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set("client_id", ENV.googleClientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("access_type", "online");
    url.searchParams.set("prompt", "select_account");
    url.searchParams.set("state", state);

    res.redirect(302, url.toString());
  });

  // Step 2: Google redirects back here with a ?code= to exchange.
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const errorParam = getQueryParam(req, "error");

    if (errorParam) {
      res.status(400).json({ error: `Google OAuth error: ${errorParam}` });
      return;
    }

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      res.status(500).json({ error: "Google OAuth is not configured" });
      return;
    }

    try {
      const origin = Buffer.from(state, "base64").toString("utf-8");
      const redirectUri = `${origin}/api/oauth/callback`;

      const tokenResp = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = (await tokenResp.json()) as GoogleTokenResponse;
      if (!tokenResp.ok || !tokenData.access_token) {
        console.error("[OAuth] Google token exchange failed", tokenData);
        res.status(400).json({
          error: tokenData.error_description || "Failed to exchange code for token",
        });
        return;
      }

      const userInfoResp = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoResp.ok) {
        res.status(400).json({ error: "Failed to fetch user info from Google" });
        return;
      }

      const userInfo = (await userInfoResp.json()) as GoogleUserInfo;
      if (!userInfo.sub) {
        res.status(400).json({ error: "sub missing from Google user info" });
        return;
      }

      // openId is namespaced so it can never collide with old Manus-issued
      // openIds if this database is ever reused/migrated.
      const openId = `google:${userInfo.sub}`;

      await db.upsertUser({
        openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(
        { openId, name: userInfo.name || "", email: userInfo.email ?? null },
        { expiresInMs: ONE_YEAR_MS }
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, origin + "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
