import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export interface User {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  isGuest: boolean;
}

const AUTH_STORAGE_KEY = '@mindflux_auth';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsedUser = JSON.parse(stored) as User;
        setUser(parsedUser);
        console.log('Loaded stored user:', parsedUser.name);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      const googleUser: User = {
        id: `google_${Date.now()}`,
        name: 'Google User',
        email: 'user@gmail.com',
        photo: null,
        isGuest: false,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(googleUser));
      setUser(googleUser);
      console.log('Google sign-in successful:', googleUser.name);
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const signInAsGuest = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      const guestUser: User = {
        id: `guest_${Date.now()}`,
        name: 'Guest',
        email: '',
        photo: null,
        isGuest: true,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(guestUser));
      setUser(guestUser);
      console.log('Guest sign-in successful');
    } catch (error) {
      console.error('Guest sign-in error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAuthenticating,
    signInWithGoogle,
    signInAsGuest,
    signOut,
    googleAuthReady: true,
  };
});
