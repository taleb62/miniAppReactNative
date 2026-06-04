import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet,
  Linking, Dimensions, Animated, StatusBar,
} from 'react-native';
import AnimatedCard from '../components/AnimatedCard';
import PressableScale from '../components/PressableScale';

const { width } = Dimensions.get('window');

function AnimatedSection({ children, delay = 0 }) {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 450, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 60, friction: 11, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function IngredientRow({ ingredient, measure, index }) {
  const slideX  = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const delay = Math.min(index * 50, 600);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.spring(slideX,  { toValue: 0, tension: 70, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.ingredientRow, { opacity, transform: [{ translateX: slideX }] }]}>
      <View style={styles.ingredientDot} />
      <Text style={styles.ingredientName}>{ingredient}</Text>
      {measure ? <Text style={styles.ingredientMeasure}>{measure}</Text> : null}
    </Animated.View>
  );
}

export default function MealDetailScreen({ route, navigation }) {
  const { mealId } = route.params;
  const [meal,    setMeal]    = useState(null);
  const [loading, setLoading] = useState(true);

  const imgOpac    = useRef(new Animated.Value(0)).current;
  const imgScale   = useRef(new Animated.Value(1.08)).current;
  const backSlideX = useRef(new Animated.Value(-60)).current;
  const backOpac   = useRef(new Animated.Value(0)).current;
  const titleY     = useRef(new Animated.Value(30)).current;
  const titleOpac  = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchMeal(); }, []);

  const fetchMeal = async () => {
    try {
      const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
      const data = await res.json();
      if (data.meals?.[0]) {
        setMeal(data.meals[0]);
        // Trigger entrance animations after data loads
        setTimeout(runEntranceAnims, 50);
      }
    } finally {
      setLoading(false);
    }
  };

  const runEntranceAnims = () => {
    // Image fade + slight dezoom
    Animated.parallel([
      Animated.timing(imgOpac,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(imgScale, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    // Back button slides in
    Animated.parallel([
      Animated.spring(backSlideX, { toValue: 0, tension: 70, friction: 10, delay: 150, useNativeDriver: true }),
      Animated.timing(backOpac,   { toValue: 1, duration: 300, delay: 150, useNativeDriver: true }),
    ]).start();
    // Title slides up
    Animated.parallel([
      Animated.spring(titleY,    { toValue: 0, tension: 65, friction: 10, delay: 250, useNativeDriver: true }),
      Animated.timing(titleOpac, { toValue: 1, duration: 350, delay: 250, useNativeDriver: true }),
    ]).start();
  };

  const getIngredients = (meal) => {
    const list = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const mea = meal[`strMeasure${i}`];
      if (ing?.trim()) list.push({ ingredient: ing.trim(), measure: (mea || '').trim() });
    }
    return list;
  };

  const getSteps = (instructions) => {
    if (!instructions) return [];
    return instructions.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" />
        <Animated.Text style={styles.loadingEmoji}>🍳</Animated.Text>
        <Text style={styles.loadingText}>Préparation de la recette...</Text>
      </View>
    );
  }

  if (!meal) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Recette introuvable</Text>
        <PressableScale onPress={() => navigation.goBack()}>
          <View style={styles.fallbackBack}><Text style={styles.fallbackBackText}>← Retour</Text></View>
        </PressableScale>
      </View>
    );
  }

  const ingredients = getIngredients(meal);
  const steps       = getSteps(meal.strInstructions);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ── Hero image ── */}
        <View style={styles.heroContainer}>
          <Animated.Image
            source={{ uri: meal.strMealThumb }}
            style={[styles.heroImage, { opacity: imgOpac, transform: [{ scale: imgScale }] }]}
          />
          <View style={styles.heroOverlay} />

          {/* Back button */}
          <Animated.View style={[styles.backBtn, { opacity: backOpac, transform: [{ translateX: backSlideX }] }]}>
            <PressableScale onPress={() => navigation.goBack()} scaleTo={0.9}>
              <View style={styles.backBtnInner}>
                <Text style={styles.backArrow}>←</Text>
                <Text style={styles.backText}>Retour</Text>
              </View>
            </PressableScale>
          </Animated.View>

          {/* Title + tags */}
          <Animated.View style={[styles.heroBottom, { opacity: titleOpac, transform: [{ translateY: titleY }] }]}>
            <Text style={styles.heroTitle}>{meal.strMeal}</Text>
            <View style={styles.tagsRow}>
              {meal.strCategory && <View style={styles.tag}><Text style={styles.tagText}>{meal.strCategory}</Text></View>}
              {meal.strArea     && <View style={[styles.tag, styles.tagGreen]}><Text style={styles.tagText}>🌍 {meal.strArea}</Text></View>}
            </View>
          </Animated.View>
        </View>

        {/* ── Content ── */}
        <View style={styles.content}>

          {/* YouTube */}
          {meal.strYoutube && (
            <AnimatedSection delay={0}>
              <PressableScale onPress={() => Linking.openURL(meal.strYoutube)} scaleTo={0.97}>
                <View style={styles.youtubeBtn}>
                  <Text style={styles.youtubeBtnText}>▶  Voir la recette sur YouTube</Text>
                </View>
              </PressableScale>
            </AnimatedSection>
          )}

          {/* Ingrédients */}
          <AnimatedSection delay={100}>
            <Text style={styles.sectionTitle}>🛒  Ingrédients</Text>
            <View style={styles.ingredientsCard}>
              {ingredients.map((item, i) => (
                <IngredientRow
                  key={i}
                  ingredient={item.ingredient}
                  measure={item.measure}
                  index={i}
                />
              ))}
            </View>
          </AnimatedSection>

          {/* Instructions */}
          <AnimatedSection delay={200}>
            <Text style={styles.sectionTitle}>📋  Instructions</Text>
            {steps.map((step, i) => (
              <AnimatedCard key={i} index={i} style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </AnimatedCard>
            ))}
          </AnimatedSection>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F5F5F5' },
  loadingScreen: {
    flex: 1, backgroundColor: '#FF6B35',
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  loadingEmoji: { fontSize: 50 },
  loadingText:  { fontSize: 16, color: '#fff', fontWeight: '600' },
  fallbackBack: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
  },
  fallbackBackText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Hero
  heroContainer: { height: 320, position: 'relative' },
  heroImage:     { width, height: 320, resizeMode: 'cover' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  backBtn: { position: 'absolute', top: 52, left: 16 },
  backBtnInner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 9,
  },
  backArrow: { fontSize: 18, color: '#fff' },
  backText:  { fontSize: 14, color: '#fff', fontWeight: '600' },
  heroBottom: { position: 'absolute', bottom: 20, left: 16, right: 16 },
  heroTitle:  {
    fontSize: 26, fontWeight: '900', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    marginBottom: 10,
  },
  tagsRow:  { flexDirection: 'row', gap: 8 },
  tag:      { backgroundColor: '#FF6B35', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  tagGreen: { backgroundColor: '#388E3C' },
  tagText:  { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Content
  content: { padding: 18 },
  youtubeBtn: {
    backgroundColor: '#FF0000',
    borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginBottom: 22,
    elevation: 5,
    shadowColor: '#FF0000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10,
  },
  youtubeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 14, marginTop: 6 },

  ingredientsCard: {
    backgroundColor: '#fff', borderRadius: 18,
    padding: 6, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8,
    marginBottom: 24,
  },
  ingredientRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: '#F4F4F4', gap: 12,
  },
  ingredientDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FF6B35', flexShrink: 0,
  },
  ingredientName:    { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  ingredientMeasure: { fontSize: 13, color: '#FF6B35', fontWeight: '700' },

  stepCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 14, marginBottom: 14,
  },
  stepNumber: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FF6B35',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
    elevation: 3,
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4,
  },
  stepNumberText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepText: { flex: 1, fontSize: 14, color: '#555', lineHeight: 22 },
});
