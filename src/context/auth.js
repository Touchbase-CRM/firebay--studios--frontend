import { useState, useEffect, useContext, createContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import app, { getAuth, isUiPreviewMode } from "@/firebase";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const PREVIEW_USER = {
  uid: "preview-user",
  email: "preview@firebaystudios.com",
  emailVerified: true,
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(isUiPreviewMode ? PREVIEW_USER : null);
  const [error, setError] = useState(null);
  // Distinguish "still hydrating from Firebase" from "definitely not signed in".
  // Without this, withAuth races onAuthStateChanged and bounces persisted users
  // back to /login on every page load — breaking the Remember me promise.
  // Starts false even in UI preview mode: the server can't read the
  // localStorage-persisted store, so pages must render the auth spinner on
  // the first client pass too or React throws a hydration error on refresh.
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (isUiPreviewMode) {
      setAuthReady(true);
      return undefined;
    }
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setError(null);
        setAuthReady(true);
      },
      (error) => {
        setError(error);
        setAuthReady(true);
      }
    );

    return () => unsubscribe();
  }, []);

  const value = { user, error, authReady };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
