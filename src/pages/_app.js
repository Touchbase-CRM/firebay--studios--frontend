import { AuthProvider } from "../context/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
function MyApp({ Component, pageProps }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(1);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
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
          backgroundColor: '#343a40',
          minHeight: '100vh',
          opacity: opacity,
          transition: 'opacity 0.5s ease',
        }}
      >
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  );
}
export default MyApp;