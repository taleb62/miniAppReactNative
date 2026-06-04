import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert, Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SignUpScreen({ navigation }) {
  const { signUpWithEmail, enableBiometric, biometricAvailable } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);

  // Animations
  const logoScale    = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(30)).current;
  const cardY        = useRef(new Animated.Value(100)).current;
  const cardOpacity  = useRef(new Animated.Value(0)).current;
  const formOpacity  = useRef(new Animated.Value(0)).current;
  const btnScale     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, tension: 45, friction: 5, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(cardY, { toValue: 0, tension: 55, friction: 11, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.timing(formOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoScale, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
          Animated.timing(logoScale, { toValue: 1,    duration: 1400, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.94, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !confirm.trim()) {
      Alert.alert('Champs requis', 'Remplis tous les champs.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Trop court', 'Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password);
      Alert.alert(
        '🎉 Compte créé !',
        'Vérifie ta boîte mail pour confirmer ton adresse avant de te connecter.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Animated.View style={[styles.logoOuter, { transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoRing}>
              <View style={styles.logoInner}>
                <Text style={styles.logoEmoji}>🍽️</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }] }}>
            <Text style={styles.appName}>MealApp</Text>
            <Text style={styles.tagline}>Crée ton compte gratuitement</Text>
          </Animated.View>
        </View>

        <Animated.View style={[
          styles.card,
          { opacity: cardOpacity, transform: [{ translateY: cardY }] }
        ]}>
          <Text style={styles.cardTitle}>Créer un compte</Text>

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
                  placeholder="Minimum 6 caractères"
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

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>🔑  Confirmer le mot de passe</Text>
              <TextInput
                style={[
                  styles.input,
                  confirm && confirm !== password && styles.inputError,
                ]}
                placeholder="••••••••"
                placeholderTextColor="#C0C0C0"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              {confirm.length > 0 && confirm !== password && (
                <Text style={styles.errorText}>⚠️  Les mots de passe ne correspondent pas</Text>
              )}
            </View>

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSignUp}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={loading}
                activeOpacity={1}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryBtnText}>Créer mon compte  →</Text>
                }
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Déjà un compte ?  </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Se connecter</Text>
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
    paddingTop: 60,
    paddingBottom: 28,
    gap: 14,
  },
  backBtn: {
    position: 'absolute', left: 20, top: 55,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 22, color: '#fff' },
  logoOuter: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  logoRing: {
    width: 74, height: 74, borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 26 },
  appName: {
    fontSize: 34, fontWeight: '900', color: '#fff',
    letterSpacing: 1.5, textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 13, color: 'rgba(255,255,255,0.88)',
    textAlign: 'center', marginTop: 2,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 26,
    paddingTop: 32,
    paddingBottom: 48,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  cardTitle: {
    fontSize: 26, fontWeight: '800', color: '#1A1A1A',
    marginBottom: 24,
  },
  inputWrapper: { marginBottom: 18 },
  inputLabel: {
    fontSize: 13, fontWeight: '700', color: '#555',
    marginBottom: 8, letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 15,
    fontSize: 15, color: '#333',
    borderWidth: 1.5, borderColor: '#EFEFEF',
  },
  inputError: { borderColor: '#FF5252', backgroundColor: '#FFF5F5' },
  errorText: { color: '#FF5252', fontSize: 12, marginTop: 6 },
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
  loginRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 28,
  },
  loginText: { color: '#999', fontSize: 14 },
  loginLink: { color: '#FF6B35', fontSize: 14, fontWeight: '800' },
});
