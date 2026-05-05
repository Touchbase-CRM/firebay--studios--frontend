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
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(isUiPreviewMode ? PREVIEW_USER : null);
  const [error, setError] = useState(null);
  // Distinguish "still hydrating from Firebase" from "definitely not signed in".
  // Without this, withAuth races onAuthStateChanged and bounces persisted users
  // back to /login on every page load — breaking the Remember me promise.
  const [authReady, setAuthReady] = useState(isUiPreviewMode);

  useEffect(() => {
    if (isUiPreviewMode) return undefined;
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
