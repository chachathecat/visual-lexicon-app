import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { TrackBAppShell, TrackBPageHeader } from "@/components/track-b";
import {
  AUTH_DEFAULT_REDIRECT_PATH,
  normalizeAuthRedirectTarget,
} from "@/lib/auth/redirects";
import {
  getCanonicalLoginRedirect,
  getSupabaseAuthAvailability,
} from "@/lib/auth/session-flow";

import { requestMagicLinkAction } from "./actions";

export const metadata: Metadata = {
  title: "Login",
};

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function readSearchParam(
  searchParams: LoginPageProps["searchParams"],
  key: string
) {
  const value = searchParams?.[key];

  return Array.isArray(value) ? value[0] : value;
}

function getLoginStatusMessage(status: string | undefined) {
  if (status === "sent") {
    return {
      tone: "success",
      title: "Check your email.",
      body: "If this address can receive a Visual Lexicon Magic Link, open the newest email and confirm once more in Visual Lexicon.",
    };
  }

  if (status === "invalid-email") {
    return {
      tone: "neutral",
      title: "Request not completed.",
      body: "Use a valid email address and try again. The response will not reveal whether an account exists.",
    };
  }

  if (status === "confirmation-error") {
    return {
      tone: "neutral",
      title: "Sign-in link not accepted.",
      body: "Request a new Magic Link, open the newest email once, then use the confirmation button in Visual Lexicon.",
    };
  }

  if (status === "canonical-host") {
    return {
      tone: "neutral",
      title: "Secure login address ready.",
      body: "No email was sent from the other Vercel address. Enter your approved email once here to continue securely.",
    };
  }

  if (status === "unavailable") {
    return {
      tone: "neutral",
      title: "Login is unavailable here.",
      body: "This environment is missing Supabase configuration, so no login request was sent.",
    };
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const requestHeaders = await headers();
  const canonicalLoginRedirect = getCanonicalLoginRedirect({
    headers: requestHeaders,
    next: readSearchParam(searchParams, "next"),
  });

  if (canonicalLoginRedirect) {
    redirect(canonicalLoginRedirect);
  }

  const availability = getSupabaseAuthAvailability();
  const safeNext = normalizeAuthRedirectTarget(
    readSearchParam(searchParams, "next")
  );
  const statusMessage = getLoginStatusMessage(
    readSearchParam(searchParams, "status")
  );
  const isUnavailable = availability === "unconfigured";

  return (
    <TrackBAppShell currentPath="/login" workspaceLabel="Private dogfood">
      <div className="page auth-page">
        <TrackBPageHeader
          eyebrow="Private dogfood"
          title="Sign in with a Magic Link."
          description="Existing Visual Lexicon learners can open a private session without creating a new account."
        />

        <section className="auth-card" aria-labelledby="login-heading">
          <div className="auth-card__copy">
            <h2 className="section-title" id="login-heading">
              Email Magic Link
            </h2>
            <p className="settings-panel__body">
              Public signup is off. Enter the email already approved for private
              unpaid dogfood access.
            </p>
          </div>

          {isUnavailable ? (
            <div className="auth-status auth-status--neutral" role="status">
              <strong>Auth unavailable</strong>
              <span>
                Supabase URL or publishable key is not configured. No fake login
                state is shown.
              </span>
            </div>
          ) : null}

          {statusMessage ? (
            <div
              className={`auth-status auth-status--${statusMessage.tone}`}
              role="status"
            >
              <strong>{statusMessage.title}</strong>
              <span>{statusMessage.body}</span>
            </div>
          ) : null}

          <form action={requestMagicLinkAction} className="auth-form">
            <input
              name="next"
              type="hidden"
              value={safeNext === AUTH_DEFAULT_REDIRECT_PATH ? "" : safeNext}
            />
            <div className="auth-form__field">
              <label htmlFor="email">Email address</label>
              <input
                autoComplete="email"
                disabled={isUnavailable}
                id="email"
                inputMode="email"
                name="email"
                placeholder="Approved learner email"
                required
                type="email"
              />
            </div>
            <button
              className="track-b-button track-b-button--primary"
              disabled={isUnavailable}
              type="submit"
            >
              Send Magic Link
            </button>
          </form>
        </section>
      </div>
    </TrackBAppShell>
  );
}
