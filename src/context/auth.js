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

  useEffect(() => {
    if (isUiPreviewMode) return undefined;
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setError(null);
      },
      (error) => {
        setError(error);
      }
    );

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    error, // Provide error as part of the context value
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
