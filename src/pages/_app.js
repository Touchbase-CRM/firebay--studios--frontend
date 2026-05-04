import { AuthProvider } from "../context/auth";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { Inter, Poppins } from "next/font/google";
import { useEffect, useState } from "react";
import Head from "next/head";

import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/tokens.css";
import "../styles/bootstrap-overrides.css";
import "../styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-display",
});

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    autocapture: false,
    capture_pageleave: false,
    capture_pageview: false,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.debug();
    },
  });
}

function MyApp({ Component, pageProps }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), 60);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <AuthProvider>
        <Head>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css"
          />
        </Head>
        <div
          className={`${inter.className} ${poppins.variable}`}
          style={{
            backgroundColor: "var(--surface-canvas)",
            minHeight: "100vh",
            opacity,
            transition: "opacity 200ms ease-out",
          }}
        >
          <Component {...pageProps} />
        </div>
      </AuthProvider>
    </PostHogProvider>
  );
}

export default MyApp;
