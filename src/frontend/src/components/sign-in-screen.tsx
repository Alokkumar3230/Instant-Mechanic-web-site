import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Fingerprint, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SignInScreen() {
  const { login, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <div
        className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]"
        aria-hidden="true"
      />
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div
          data-ocid="signin.screen"
          className="flex w-full max-w-md flex-col items-center text-center"
        >
          <img
            src="/assets/generated/instant-mechanic-mark.dim_512x512.png"
            alt="Instant Mechanic emblem"
            className="size-20 rounded-2xl shadow-elevated"
          />
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
            Instant Mechanic
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Pit-wall operations console for on-demand vehicle service —
            bookings, mechanics, and customers in one live telemetry view.
          </p>

          <Button
            size="lg"
            className="mt-8 w-full"
            disabled={isLoggingIn}
            data-ocid="signin.button"
            onClick={() => login()}
          >
            {isLoggingIn ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Fingerprint />
            )}
            {isLoggingIn ? "Signing in…" : "Sign in with Internet Identity"}
          </Button>

          {isLoginError && (
            <p
              data-ocid="signin.error"
              className="mt-3 text-sm text-destructive"
              role="alert"
            >
              {loginError?.message ?? "Sign-in failed. Please try again."}
            </p>
          )}

          <p className="mt-6 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Secure sign-in · Internet Identity
          </p>
        </div>
      </div>

      <footer className="relative border-t border-border bg-muted/40 px-4 py-3 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="text-foreground underline-offset-2 hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
