import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert, Dimensions, Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { height } = Dimensions.get('window');

function AppLogo({ scaleAnim }) {
  return (
    <Animated.View style={[styles.logoOuter, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.logoRing}>
        <View style={styles.logoInner}>
          <Text style={styles.logoEmoji}>🍽️</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function LoginScreen({ navigation }) {
  const { signInWithEmail, authenticateWithBiometric, biometricAvailable, biometricEnabled } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation refs
  const logoScale    = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(30)).current;
  const cardY        = useRef(new Animated.Value(100)).current;
  const cardOpacity  = useRef(new Animated.Value(0)).current;
  const formOpacity  = useRef(new Animated.Value(0)).current;
  const btnScale     = useRef(new Animated.Value(1)).current;
  const bioScale     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1, tension: 45, friction: 5, useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(cardY, { toValue: 0, tension: 55, friction: 11, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(formOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start(() => {
      // Pulse logo en continu après l'entrée
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoScale, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
          Animated.timing(logoScale, { toValue: 1,    duration: 1400, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const pressIn  = (anim) => Animated.spring(anim, { toValue: 0.94, useNativeDriver: true }).start();
  const pressOut = (anim) => Animated.spring(anim, { toValue: 1,    useNativeDriver: true }).start();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Remplis l\'email et le mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (e) {
      Alert.alert('Erreur de connexion', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    const success = await authenticateWithBiometric();
    if (!success) Alert.alert('Échec', 'Authentification biométrique échouée.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Zone header animée */}
        <View style={styles.header}>
          <AppLogo scaleAnim={logoScale} />
          <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }] }}>
            <Text style={styles.appName}>MealApp</Text>
            <Text style={styles.tagline}>Des milliers de recettes t'attendent</Text>
          </Animated.View>
        </View>

        {/* Carte formulaire animée */}
        <Animated.View style={[
          styles.card,
          { opacity: cardOpacity, transform: [{ translateY: cardY }] }
        ]}>
          <Text style={styles.cardTitle}>Connexion</Text>

          <Animated.View style={{ opacity: formOpacity }}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>📧  Email</Text>
              <TextInput
                style={styles.input}
                placeholder="ton@email.com"
                placeholderTextColor="#C0C0C0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>🔒  Mot de passe</Text>
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#C0C0C0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleLogin}
                onPressIn={() => pressIn(btnScale)}
                onPressOut={() => pressOut(btnScale)}
                disabled={loading}
                activeOpacity={1}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryBtnText}>Se connecter  →</Text>
                }
              </TouchableOpacity>
            </Animated.View>

            {biometricAvailable && biometricEnabled && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Animated.View style={{ transform: [{ scale: bioScale }] }}>
                  <TouchableOpacity
                    style={styles.biometricBtn}
                    onPress={handleBiometric}
                    onPressIn={() => pressIn(bioScale)}
                    onPressOut={() => pressOut(bioScale)}
                    activeOpacity={1}
                  >
                    <Text style={styles.biometricIcon}>🔐</Text>
                    <Text style={styles.biometricBtnText}>Utiliser la biométrie</Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Pas encore de compte ?  </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupLink}>Créer un compte</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FF6B35' },
  scroll: { flexGrow: 1 },
  header: {
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 32,
    gap: 16,
  },
  // Logo
  logoOuter: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  logoRing: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: {
    width: 66, height: 66, borderRadius: 33,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 30 },
  appName: {
    fontSize: 38, fontWeight: '900', color: '#fff',
    letterSpacing: 1.5, textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 14, color: 'rgba(255,255,255,0.88)',
    textAlign: 'center', marginTop: 4,
  },
  // Carte
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 26,
    paddingTop: 34,
    paddingBottom: 48,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  cardTitle: {
    fontSize: 26, fontWeight: '800', color: '#1A1A1A',
    marginBottom: 26,
  },
  inputWrapper: { marginBottom: 18 },
  inputLabel: {
    fontSize: 13, fontWeight: '700', color: '#555',
    marginBottom: 8, letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 15, color: '#333',
    borderWidth: 1.5, borderColor: '#EFEFEF',
  },
  eyeBtn: {
    position: 'absolute', right: 14,
    top: 0, bottom: 0, justifyContent: 'center',
  },
  eyeText: { fontSize: 18 },
  primaryBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 16, paddingVertical: 17,
    alignItems: 'center', marginTop: 6,
    elevation: 6,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  primaryBtnText: {
    color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 22,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEE' },
  dividerText: { marginHorizontal: 14, color: '#BBB', fontSize: 13 },
  biometricBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0FFF4',
    borderRadius: 16, paddingVertical: 16,
    borderWidth: 2, borderColor: '#81C784',
    gap: 10,
  },
  biometricIcon: { fontSize: 22 },
  biometricBtnText: { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
  signupRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 28,
  },
  signupText: { color: '#999', fontSize: 14 },
  signupLink: { color: '#FF6B35', fontSize: 14, fontWeight: '800' },
});
