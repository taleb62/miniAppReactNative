import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import MealDetailScreen from './src/screens/MealDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createStackNavigator();

function SplashScreen() {
  const scale   = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulse   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, tension: 40, friction: 5, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={splash.container}>
      <Animated.View style={[splash.logoOuter, { transform: [{ scale: Animated.multiply(scale, pulse) }], opacity }]}>
        <View style={splash.logoRing}>
          <View style={splash.logoInner}>
            <Text style={splash.logoEmoji}>🍽️</Text>
          </View>
        </View>
      </Animated.View>
      <Animated.Text style={[splash.appName, { opacity, transform: [{ scale }] }]}>
        MealApp
      </Animated.Text>
      <Animated.Text style={[splash.tagline, { opacity }]}>
        Chargement...
      </Animated.Text>
    </View>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
      <Stack.Screen name="Login"  component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  const { biometricAvailable, biometricEnabled, enableBiometric } = useAuth();

  useEffect(() => {
    if (biometricAvailable && !biometricEnabled) {
      setTimeout(() => {
        Alert.alert(
          'Activer la biométrie ? 🔐',
          'Utilise ton empreinte ou Face ID pour te connecter plus vite.',
          [
            { text: 'Pas maintenant', style: 'cancel' },
            { text: 'Activer',        onPress: enableBiometric },
          ]
        );
      }, 1200);
    }
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home"       component={HomeScreen} />
      <Stack.Screen name="MealDetail" component={MealDetailScreen} />
      <Stack.Screen name="Profile"    component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  return user ? <AppStack /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const splash = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#FF6B35',
    alignItems: 'center', justifyContent: 'center', gap: 18,
  },
  logoOuter: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  logoRing: {
    width: 98, height: 98, borderRadius: 49,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 36 },
  appName: {
    fontSize: 42, fontWeight: '900', color: '#fff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
});
