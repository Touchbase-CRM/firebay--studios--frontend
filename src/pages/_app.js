import { AuthProvider } from "../context/auth";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import Head from "next/head";
import "../styles/globals.css";

// Initialize PostHog only on the client side
if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    autocapture: false,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.debug();
    },
  });
}

function MyApp({ Component, pageProps }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(1);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <AuthProvider>
        <Head>
          <style>
            {`
              body {
                background-color: #343a40;
              }
            `}
          </style>
        </Head>
        <div
          style={{
            backgroundColor: "#343a40",
            minHeight: "100vh",
            opacity: opacity,
            transition: "opacity 0.5s ease",
          }}
        >
          <Component {...pageProps} />
        </div>
      </AuthProvider>
    </PostHogProvider>
  );
}

export default MyApp;
