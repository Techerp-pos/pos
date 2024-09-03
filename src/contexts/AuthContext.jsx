// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    setCurrentUser({ ...user, ...userDoc.data() });
                } else {
                    setCurrentUser(user);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signup = async (email, password, shopCode) => {
        // Capture the current user's auth token before creating a new account
        const currentUser = auth.currentUser;

        // Create a new user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store the new user's information in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email,
            shopCode,
            role: 'user', // Default role
            createdAt: new Date(),
        });

        // Re-authenticate the current user (SuperAdmin) to ensure they stay logged in
        if (currentUser) {
            // Refresh the authentication token for the current user
            await signInWithEmailAndPassword(auth, currentUser.email, password); // assuming you know the current password
        }

        // Alert the SuperAdmin that the account was created successfully
        alert('User account created successfully. You remain logged in as SuperAdmin.');
    };


    const login = async (email, password, shopCode) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().shopCode === shopCode) {
            setCurrentUser({ ...user, ...userDoc.data() });
        } else {
            throw new Error('Invalid shop code');
        }
    };

    const logout = async () => {
        await signOut(auth);
        setCurrentUser(null);
    };

    const isSuperAdmin = currentUser?.role === 'superAdmin';

    const value = {
        currentUser,
        signup,
        login,
        logout,
        isSuperAdmin,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
