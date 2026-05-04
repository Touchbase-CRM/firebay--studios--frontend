import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import {
  getFirestore,
  doc,
  getDoc,
  writeBatch,
  collection,
} from "firebase/firestore";
import { getAuth } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { checkIfExistsInFirestore } from "@/utils/db-read-write-ops/deserialization-utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Spinner } from "@/components/ui/spinner";

const db = getFirestore();
const auth = getAuth();

const SignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isEmployee, setIsEmployee] = useState(false);
  const [isTrialUser, setIsTrialUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (router.query.email) setEmail(router.query.email);
  }, [router.query.email]);

  async function validateInvoiceNumber() {
    const response = await fetch("/api/Stripe/check-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceNumber }),
    });
    const data = await response.json();
    if (data.valid) return true;
    Swal.fire({ icon: "error", title: "Invalid invoice number", text: "Please check the invoice number and try again." });
    return false;
  }

  async function validateEmployeeStatus() {
    const valid = await checkIfExistsInFirestore("internal", email);
    if (valid) return true;
    Swal.fire({ icon: "error", title: "Invalid employee email", text: "Please use a valid Firebay email." });
    return false;
  }

  async function validateTrialUser() {
    const docRef = doc(db, "pyro_trial_users", email);
    const snap = await getDoc(docRef);
    if (snap.exists()) return true;
    Swal.fire({ icon: "error", title: "Not a trial user", text: "This email isn't registered for trial access." });
    return false;
  }

  const handleSignUp = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setStatusMessage("Creating your Pyro account…");

    if (password !== confirmPassword) {
      Swal.fire({ icon: "error", title: "Passwords don't match", text: "Re-enter both passwords." });
      setIsLoading(false);
      return;
    }

    const validUser = isEmployee
      ? await validateEmployeeStatus()
      : isTrialUser
      ? await validateTrialUser()
      : await validateInvoiceNumber();

    if (!validUser) {
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const batch = writeBatch(db);
      const uidToOrgRef = doc(db, "uid_to_org", user.uid);
      batch.set(uidToOrgRef, { work_email: email, monthly_downloads: -1, unit_price: 0 });

      const userDocRef = doc(db, "customers", user.uid);
      batch.set(userDocRef, { email });

      const subsRef = collection(userDocRef, "subscriptions");
      const newSubRef = doc(subsRef);
      batch.set(newSubRef, { status: "active" });

      await batch.commit();
      setStatusMessage("Account created.");
      router.push("/login");
    } catch (error) {
      console.error("Signup error", error);
      if (error.code === "auth/email-already-in-use") {
        Swal.fire({ icon: "error", title: "Email already in use", text: "Try signing in instead." });
      } else {
        Swal.fire({ icon: "error", title: "Sign up failed", text: error.message });
      }
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--surface-canvas)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-4)",
        }}
      >
        <Spinner size="lg" />
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{statusMessage}</p>
      </div>
    );
  }

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
      <div style={{ width: "100%", maxWidth: 460 }}>
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
            Create your Pyro account
          </h1>
          <p style={{ marginTop: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
            A few details and you're in.
          </p>
        </div>

        <Card padding="var(--space-6)">
          <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
            <Input
              label="Invoice number"
              type="text"
              placeholder="B51DB03D-0002"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              pattern="[A-Z0-9]{8}-[0-9]{4}"
              disabled={isEmployee || isTrialUser}
              required={!isEmployee && !isTrialUser}
              hint={isEmployee || isTrialUser ? "Not required for your account type." : "Provided in your subscription email."}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-3)", backgroundColor: "var(--surface-inset)", borderRadius: "var(--radius-md)" }}>
              <Toggle
                checked={isEmployee}
                onChange={(e) => {
                  setIsEmployee(e.target.checked);
                  if (e.target.checked) setInvoiceNumber("");
                }}
                label="Firebay Studios employee"
                description="Skip the invoice check."
              />
              <Toggle
                checked={isTrialUser}
                onChange={(e) => setIsTrialUser(e.target.checked)}
                label="Trial user"
                description="Pre-approved for the free trial."
              />
            </div>

            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.55 }}>
              By creating an account, you agree to our{" "}
              <a href="https://www.firebaystudios.com/terms-of-service" target="_blank" rel="noreferrer" style={{ color: "var(--text-link)" }}>
                terms
              </a>{" "}
              and{" "}
              <a href="https://www.firebaystudios.com/privacy-policy" target="_blank" rel="noreferrer" style={{ color: "var(--text-link)" }}>
                privacy policy
              </a>
              .
            </p>

            <Button type="submit" style={{ width: "100%", justifyContent: "center" }}>
              Create account
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
          Already have an account?{" "}
          <a href="/login" style={{ color: "var(--text-link)", fontWeight: "var(--font-weight-medium)" }}>
            Sign in
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

export default SignupPage;
