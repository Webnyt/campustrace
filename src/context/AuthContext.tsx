import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from '../firebase/config';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  authError: null,
  clearAuthError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    getRedirectResult(auth).catch((err) => {
      const message = describeAuthError(err);
      if (message) setAuthError(message);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          if (!db) throw new Error('Firestore is not ready');
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || 'Campus Student',
              photoURL: currentUser.photoURL,
              role: currentUser.email?.endsWith('.edu') || currentUser.email?.includes('admin')
                ? 'staff'
                : 'student',
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.warn('Could not sync user profile to Firestore:', err);
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'Campus Student',
            photoURL: currentUser.photoURL,
            role: 'student',
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    if (!isFirebaseConfigured || !auth) {
      setAuthError(
        'Google sign-in is not linked yet. Add your Firebase web app keys to .env.local, then restart CampusTrace.'
      );
      return;
    }

    const preferRedirect = window.matchMedia('(max-width: 768px)').matches;
    try {
      if (preferRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = err instanceof FirebaseError ? err.code : '';
      if (code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          setAuthError(describeAuthError(redirectErr) || 'Google sign-in could not be completed.');
          return;
        }
      }
      console.warn('Google Sign-In Error:', err);
      setAuthError(describeAuthError(err) || 'Google sign-in could not be completed.');
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await fbSignOut(auth);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

function describeAuthError(err: unknown): string | null {
  const code = err instanceof FirebaseError ? err.code : '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return null;
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This site is not allowed to use Google sign-in. In Firebase, open Authentication → Settings → Authorized domains and add localhost.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is turned off. In Firebase, open Authentication → Sign-in method and enable Google.';
  }
  if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid') {
    return 'The Firebase API key in .env.local does not match your project. Copy the web app config again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Could not reach Firebase. Check your internet connection and try again.';
  }
  if (code === 'auth/popup-blocked') {
    return 'The browser blocked the Google sign-in window. Allow popups for this site and try again.';
  }
  return 'Google sign-in could not be completed.';
}
