import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signInAnonymously,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import { UserProfile } from '../types';

export interface AuthErrorInfo {
  code: string;
  message: string;
  domain?: string;
  suggestion?: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: AuthErrorInfo | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleRedirectFlow: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserPreferences: (data: Partial<UserProfile>) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check for redirect sign-in result on page load
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Redirect sign-in successful:', result.user.email);
          setCurrentUser(result.user);
          setIsAuthModalOpen(false);
        }
      })
      .catch((err: any) => {
        console.warn('Redirect sign-in error:', err);
        handleAuthException(err);
      });
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setAuthError(null);
        setIsAuthModalOpen(false);
        const userRef = doc(db, 'users', user.uid);
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              id: user.uid,
              email: user.email || 'guest@chronoplan.app',
              displayName: user.displayName || (user.isAnonymous ? 'Guest User' : 'Planner User'),
              photoURL: user.photoURL || '',
              theme: 'light',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.warn('User profile sync notice:', err);
          // Fallback to local profile in memory so user session stays functional
          setUserProfile({
            id: user.uid,
            email: user.email || 'guest@chronoplan.app',
            displayName: user.displayName || (user.isAnonymous ? 'Guest User' : 'Planner User'),
            photoURL: user.photoURL || '',
            theme: 'light',
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthException = (err: any) => {
    const code = err?.code || 'unknown';
    const rawMessage = err?.message || String(err);
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'chrono-plan-alpha.vercel.app';

    let friendlyMessage = rawMessage;
    let suggestion = 'Please try again.';

    if (code === 'auth/popup-blocked') {
      friendlyMessage = 'The Google sign-in popup was blocked by your browser.';
      suggestion = 'Click the pop-up icon in your browser address bar to allow popups, or try the "Sign In with Redirect" option below.';
    } else if (code === 'auth/unauthorized-domain') {
      friendlyMessage = `This domain (${currentHost}) is not authorized in your Firebase project.`;
      suggestion = `Go to Firebase Console -> Authentication -> Settings -> Authorized Domains, click "Add domain", and paste "${currentHost}".`;
    } else if (code === 'auth/popup-closed-by-user') {
      friendlyMessage = 'The sign-in window was closed before completion.';
      suggestion = 'Click below to try signing in again.';
    } else if (code === 'auth/cancelled-popup-request') {
      friendlyMessage = 'Another sign-in request is already in progress.';
      suggestion = 'Please wait a moment and try again.';
    } else if (code === 'auth/operation-not-allowed') {
      friendlyMessage = 'Sign-in method is not enabled in Firebase Console.';
      suggestion = 'Enable Google or Anonymous sign-in in Firebase Console -> Authentication -> Sign-in method.';
    }

    setAuthError({
      code,
      message: friendlyMessage,
      domain: currentHost,
      suggestion,
    });
    setIsAuthModalOpen(true);
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      handleAuthException(err);
      throw err;
    }
  };

  const signInWithGoogleRedirectFlow = async () => {
    setAuthError(null);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      console.error('Redirect sign-in error:', err);
      handleAuthException(err);
      throw err;
    }
  };

  const signInAsGuest = async () => {
    setAuthError(null);
    try {
      await signInAnonymously(auth);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.warn('Anonymous sign in notice:', err);
      handleAuthException(err);
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (err) {
      console.error('Error signing out:', err);
      throw err;
    }
  };

  const updateUserPreferences = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    } catch (err) {
      console.warn('Update preferences warning:', err);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        authError,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signInWithGoogle,
        signInWithGoogleRedirectFlow,
        signInAsGuest,
        signOutUser,
        updateUserPreferences,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
