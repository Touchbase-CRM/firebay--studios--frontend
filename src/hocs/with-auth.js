import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/auth";
import { Spinner } from "@/components/ui/spinner";

const withAuth = (WrappedComponent, redirectUrl = "/login") => {
  const Wrapped = (props) => {
    const { user, authReady } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Only redirect once Firebase has finished hydrating from storage.
      // Without this guard, returning visitors with a persisted session get
      // bounced to /login while Firebase is still restoring it.
      if (authReady && user === null) {
        router.push(redirectUrl);
      }
    }, [authReady, user, router, redirectUrl]);

    if (!authReady) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--surface-canvas)",
          }}
        >
          <Spinner size="lg" />
        </div>
      );
    }

    if (user) {
      return <WrappedComponent {...props} />;
    }

    return null;
  };

  return Wrapped;
};

export default withAuth;
