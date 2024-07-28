import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password, shopCode) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.shopCode === shopCode) {
        return result;
      } else {
        await signOut(auth);
        throw new Error('Shop code does not match');
      }
    } else {
      await signOut(auth);
      throw new Error('User data not found');
    }
  };

  const signup = async (email, password, shopCode) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Store additional user info in Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      email: email,
      shopCode: shopCode,
      createdAt: new Date(),
    });
    return result;
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
