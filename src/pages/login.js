import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import app, { getAuth, isUiPreviewMode } from "@/firebase";
import { getSubscriptionStatus } from "../stripe-proxy-sdk";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";

const REMEMBER_ME_KEY = "pyro:rememberMe";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const auth = getAuth();

  // Restore the user's last preference, plus any cached email so
  // returning users only have to type a password.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(REMEMBER_ME_KEY);
    if (stored != null) setRememberMe(stored === "true");
    const cachedEmail = window.localStorage.getItem("pyro:lastEmail");
    if (cachedEmail) setEmail(cachedEmail);
  }, []);

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    if (isUiPreviewMode) {
      router.push("/home");
      return;
    }
    try {
      // Persistence has to be set BEFORE signInWithEmailAndPassword.
      // local = stays signed in across browser restarts (default).
      // session = cleared when the tab closes.
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
      window.localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));
      if (rememberMe) {
        window.localStorage.setItem("pyro:lastEmail", email);
      } else {
        window.localStorage.removeItem("pyro:lastEmail");
      }

      await signInWithEmailAndPassword(auth, email, password);
      const isSubscribed = await getSubscriptionStatus(app);
      if (!isSubscribed) {
        throw new Error("You must have an active subscription to log in.");
      }
      router.push("/home");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Couldn't sign in",
        text: error.message || "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Swal.fire({ icon: "warning", title: "Email required", text: "Enter your email above first." });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Swal.fire({ icon: "success", title: "Email sent", text: "Check your inbox for reset instructions." });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Couldn't send", text: error.message });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface-canvas)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "var(--space-7)" }}>
          <img src="/fire.png" alt="Pyro" width={48} height={48} style={{ marginBottom: "var(--space-3)" }} />
          <h1
            style={{
              fontSize: "var(--text-2xl)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "var(--letter-spacing-tight)",
            }}
          >
            Sign in to Pyro
          </h1>
          <p
            style={{
              marginTop: "var(--space-2)",
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
            }}
          >
            Welcome back. Enter your email and password to continue.
          </p>
        </div>

        <Card padding="var(--space-6)">
          <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  marginTop: "var(--space-2)",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-link)",
                  fontSize: "var(--text-xs)",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>

            <Toggle
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              label="Remember me"
              description="Stay signed in on this browser until you log out."
            />

            <Button type="submit" loading={isLoading} style={{ width: "100%", justifyContent: "center" }}>
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>

        <p
          style={{
            textAlign: "center",
            marginTop: "var(--space-5)",
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
          }}
        >
          New to Pyro?{" "}
          <a href="/signup" style={{ color: "var(--text-link)", fontWeight: "var(--font-weight-medium)" }}>
            Create an account
          </a>
        </p>

        <p
          style={{
            textAlign: "center",
            marginTop: "var(--space-7)",
            fontSize: "var(--text-xs)",
            color: "var(--text-muted)",
          }}
        >
          By Firebay Studios
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
