import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    initAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const initAuth = async () => {
    try {
      const [{ data }, biometricSupport, biometricPref] = await Promise.all([
        supabase.auth.getSession(),
        LocalAuthentication.hasHardwareAsync(),
        SecureStore.getItemAsync('biometric_enabled'),
      ]);
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setBiometricAvailable(biometricSupport);
      setBiometricEnabled(biometricPref === 'true');
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };


  const signOut = async () => {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync('biometric_enabled');
    setBiometricEnabled(false);
  };

  const enableBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirme ton identité pour activer la biométrie',
      cancelLabel: 'Annuler',
    });
    if (result.success) {
      await SecureStore.setItemAsync('biometric_enabled', 'true');
      setBiometricEnabled(true);
      return true;
    }
    return false;
  };

  const authenticateWithBiometric = async () => {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      Alert.alert('Aucune biométrie', 'Configure un empreinte ou Face ID dans les paramètres.');
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Connecte-toi à MealApp',
      cancelLabel: 'Annuler',
      fallbackLabel: 'Mot de passe',
    });
    return result.success;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        biometricAvailable,
        biometricEnabled,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        enableBiometric,
        authenticateWithBiometric,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
