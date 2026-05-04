import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/auth";

const ADMIN_DOMAIN = "@firebaystudios.com";

const withAdminAuth = (WrappedComponent, redirectUrl = "/login") => {
  const Wrapper = (props) => {
    const { user } = useAuth();
    const router = useRouter();
    const [authResolved, setAuthResolved] = useState(false);

    useEffect(() => {
      const t = setTimeout(() => setAuthResolved(true), 600);
      return () => clearTimeout(t);
    }, []);

    if (!authResolved) {
      return null;
    }

    if (!user) {
      router.push(redirectUrl);
      return null;
    }

    const email = (user.email || "").toLowerCase();
    const isAdmin = email.endsWith(ADMIN_DOMAIN) && user.emailVerified;

    if (!isAdmin) {
      return (
        <div
          style={{
            maxWidth: 480,
            margin: "120px auto",
            padding: 32,
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h2 style={{ marginBottom: 12 }}>Forbidden</h2>
          <p style={{ color: "#555", lineHeight: 1.5 }}>
            This page is only accessible to verified <code>{ADMIN_DOMAIN}</code>{" "}
            accounts. You're signed in as <strong>{user.email}</strong>.
          </p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  return Wrapper;
};

export default withAdminAuth;
