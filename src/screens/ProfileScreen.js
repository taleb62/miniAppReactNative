import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, Switch, Animated, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import AnimatedCard from '../components/AnimatedCard';
import PressableScale from '../components/PressableScale';

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, signOut, biometricAvailable, biometricEnabled, enableBiometric, authenticateWithBiometric } = useAuth();
  const [signingOut,  setSigningOut]  = useState(false);
  const [togglingBio, setTogglingBio] = useState(false);

  // Entrance animations
  const avatarScale = useRef(new Animated.Value(0)).current;
  const avatarOpac  = useRef(new Animated.Value(0)).current;
  const headerY     = useRef(new Animated.Value(-30)).current;
  const headerOpac  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Header slides down
    Animated.parallel([
      Animated.spring(headerY,   { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.timing(headerOpac, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    // Avatar bounces in
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(avatarScale, { toValue: 1, tension: 40, friction: 5, useNativeDriver: true }),
        Animated.timing(avatarOpac,  { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Gentle pulse on avatar
      Animated.loop(
        Animated.sequence([
          Animated.timing(avatarScale, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
          Animated.timing(avatarScale, { toValue: 1,    duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const getProvider = () => {
    const p = user?.app_metadata?.provider;
    return p === 'google' ? '🔵 Google' : '📧 Email';
  };

  const getMemberSince = () => {
    if (!user?.created_at) return '—';
    return new Date(user.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Es-tu sûr de vouloir te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter', style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try { await signOut(); }
          catch (e) { Alert.alert('Erreur', e.message); setSigningOut(false); }
        },
      },
    ]);
  };

  const handleBiometricToggle = async (value) => {
    setTogglingBio(true);
    try {
      if (value) {
        const ok = await enableBiometric();
        if (!ok) Alert.alert('Échec', 'Impossible d\'activer la biométrie.');
      } else {
        const ok = await authenticateWithBiometric();
        if (ok) {
          const SecureStore = await import('expo-secure-store');
          await SecureStore.deleteItemAsync('biometric_enabled');
          Alert.alert('Désactivée', 'La connexion biométrique a été désactivée.');
        }
      }
    } finally {
      setTogglingBio(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />

      {/* ── Header animé ── */}
      <Animated.View style={[styles.header, { opacity: headerOpac, transform: [{ translateY: headerY }] }]}>
        <PressableScale onPress={() => navigation.goBack()} scaleTo={0.9}>
          <View style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </View>
        </PressableScale>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Avatar animé ── */}
        <View style={styles.avatarSection}>
          <Animated.View style={[styles.avatarOuter, { opacity: avatarOpac, transform: [{ scale: avatarScale }] }]}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          </Animated.View>
          <AnimatedCard index={0}>
            <Text style={styles.displayName}>
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur'}
            </Text>
            <View style={styles.providerBadge}>
              <Text style={styles.providerText}>{getProvider()}</Text>
            </View>
          </AnimatedCard>
        </View>

        {/* ── Informations ── */}
        <AnimatedCard index={1} style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS</Text>
          <View style={styles.card}>
            <InfoRow icon="✉️" label="Email"          value={user?.email || '—'} />
            <View style={styles.sep} />
            <InfoRow icon="📅" label="Membre depuis"  value={getMemberSince()} />
            <View style={styles.sep} />
            <InfoRow icon="🔑" label="Connexion via"  value={getProvider()} />
            <View style={styles.sep} />
            <InfoRow icon="🆔" label="ID"             value={(user?.id || '').slice(0, 12) + '...'} />
          </View>
        </AnimatedCard>

        {/* ── Sécurité ── */}
        {biometricAvailable && (
          <AnimatedCard index={2} style={styles.section}>
            <Text style={styles.sectionTitle}>SÉCURITÉ</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <Text style={styles.switchIcon}>🔐</Text>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Connexion biométrique</Text>
                  <Text style={styles.switchDesc}>Empreinte digitale ou Face ID</Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  disabled={togglingBio}
                  trackColor={{ false: '#DDD', true: '#FF6B35' }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </AnimatedCard>
        )}

        {/* ── Sign out ── */}
        <AnimatedCard index={3} style={styles.section}>
          <PressableScale onPress={handleSignOut} scaleTo={0.97}>
            <View style={styles.signOutBtn}>
              <Text style={styles.signOutIcon}>🚪</Text>
              <Text style={styles.signOutText}>
                {signingOut ? 'Déconnexion...' : 'Se déconnecter'}
              </Text>
            </View>
          </PressableScale>
        </AnimatedCard>

        <AnimatedCard index={4}>
          <Text style={styles.version}>MealApp v1.0.0</Text>
        </AnimatedCard>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#FF6B35',
    paddingTop: 52, paddingBottom: 18, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow:   { fontSize: 20, color: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  scroll:      { paddingBottom: 40 },

  // Avatar
  avatarSection: {
    backgroundColor: '#FF6B35',
    alignItems: 'center', paddingBottom: 36, paddingTop: 8,
    gap: 12,
  },
  avatarOuter: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10,
  },
  avatarInner: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { fontSize: 30, fontWeight: '900', color: '#FF6B35' },
  displayName:  { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center' },
  providerBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
    marginTop: 4,
  },
  providerText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  section:      { paddingHorizontal: 16, marginTop: 22 },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: '#AAA',
    letterSpacing: 1, marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 18,
    overflow: 'hidden', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  sep:          { height: 1, backgroundColor: '#F2F2F2', marginLeft: 52 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  infoIcon:     { fontSize: 20, width: 26, textAlign: 'center' },
  infoContent:  { flex: 1 },
  infoLabel:    { fontSize: 12, color: '#AAA', fontWeight: '600' },
  infoValue:    { fontSize: 15, color: '#333', fontWeight: '500', marginTop: 2 },

  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, gap: 14,
  },
  switchIcon:   { fontSize: 22 },
  switchInfo:   { flex: 1 },
  switchLabel:  { fontSize: 15, color: '#333', fontWeight: '700' },
  switchDesc:   { fontSize: 12, color: '#AAA', marginTop: 2 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    borderRadius: 18, paddingVertical: 18,
    borderWidth: 1.5, borderColor: '#FFCDD2',
    gap: 10,
  },
  signOutIcon: { fontSize: 22 },
  signOutText: { fontSize: 16, fontWeight: '800', color: '#C62828' },
  version:     { textAlign: 'center', color: '#CCC', fontSize: 12, marginTop: 28 },
});
