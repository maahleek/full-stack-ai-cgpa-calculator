import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { DEFAULT_SCALE } from "@/lib/grades";

const STATE_COOKIE = "google_oauth_state";

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const baseUrl = process.env.APP_URL || url.origin;
  const failUrl = (msg: string) => `${baseUrl}/login?error=${encodeURIComponent(msg)}`;

  if (error) {
    return NextResponse.redirect(failUrl("Google sign-in was cancelled."));
  }

  const cookieState = req.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.split("=")[1];

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(failUrl("Invalid or expired sign-in attempt. Please try again."));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(failUrl("Google sign-in isn't configured on this server yet."));
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
    }
    const tokenData = await tokenRes.json();

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userInfoRes.ok) {
      throw new Error(`Failed to fetch Google profile: ${await userInfoRes.text()}`);
    }
    const profile: GoogleUserInfo = await userInfoRes.json();

    if (!profile.email || !profile.email_verified) {
      return NextResponse.redirect(failUrl("Your Google email isn't verified. Please use a verified account."));
    }
    const email = profile.email.toLowerCase();

    // Link by Google ID first, then fall back to matching an existing email
    // (e.g. someone who originally signed up with a password), then create new.
    let [user] = await db.select().from(users).where(eq(users.googleId, profile.sub)).limit(1);

    if (!user) {
      const [existingByEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingByEmail) {
        [user] = await db
          .update(users)
          .set({ googleId: profile.sub })
          .where(eq(users.id, existingByEmail.id))
          .returning();
      } else {
        [user] = await db
          .insert(users)
          .values({
            email,
            name: profile.name || profile.given_name || email.split("@")[0],
            googleId: profile.sub,
            passwordHash: null,
            targetCgpa: "3.50",
            scale: DEFAULT_SCALE === "5.0" ? "5.00" : "4.00",
          })
          .returning();
      }
    }

    const sessionToken = await createSessionToken({ userId: user.id, email: user.email });
    await setSessionCookie(sessionToken);

    const res = NextResponse.redirect(`${baseUrl}/dashboard`);
    res.cookies.delete(STATE_COOKIE);
    return res;
  } catch (err) {
    console.error("google oauth callback error", err);
    return NextResponse.redirect(failUrl("Something went wrong signing in with Google. Please try again."));
  }
}
