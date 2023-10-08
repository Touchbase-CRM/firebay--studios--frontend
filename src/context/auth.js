import { useState, useEffect, useContext, createContext } from "react";
import firebase from "../firebase";
import "firebase/compat/auth";

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null); 

    useEffect(() => {
        const unsubscribe = firebase.auth().onAuthStateChanged(
            (user) => {
                setUser(user);
                setError(null);  // Reset error on user change
            },
            (error) => {
                setError(error);
            }
        );

        return () => {
            unsubscribe();
        };
    }, []);

    const value = {
        user,
        error  // Provide error as part of the context value
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};