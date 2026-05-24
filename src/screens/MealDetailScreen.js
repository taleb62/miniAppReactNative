import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Dimensions,
  StatusBar,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function MealDetailScreen({ route, navigation }) {
  const { mealId } = route.params;
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMealDetail();
  }, [mealId]);

  const fetchMealDetail = async () => {
    try {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`
      );
      const data = await res.json();
      if (data.meals?.length > 0) setMeal(data.meals[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getIngredients = (meal) => {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push({ ingredient: ingredient.trim(), measure: (measure || '').trim() });
      }
    }
    return ingredients;
  };

  const getInstructions = (instructions) => {
    if (!instructions) return [];
    return instructions
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (!meal) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Meal not found.</Text>
        <TouchableOpacity style={styles.backButtonFallback} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ingredients = getIngredients(meal);
  const instructions = getInstructions(meal.strInstructions);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: meal.strMealThumb }} style={styles.heroImage} />
          <View style={styles.imageOverlay} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backButtonText}>Go back</Text>
          </TouchableOpacity>
          <View style={styles.mealTitleContainer}>
            <Text style={styles.mealTitle}>{meal.strMeal}</Text>
            <View style={styles.tagRow}>
              {meal.strCategory ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{meal.strCategory}</Text>
                </View>
              ) : null}
              {meal.strArea ? (
                <View style={[styles.tag, styles.tagArea]}>
                  <Text style={styles.tagText}>{meal.strArea}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {meal.strYoutube ? (
            <TouchableOpacity
              style={styles.youtubeButton}
              onPress={() => Linking.openURL(meal.strYoutube)}
              activeOpacity={0.8}
            >
              <Text style={styles.youtubeIcon}>▶</Text>
              <Text style={styles.youtubeButtonText}>Watch on YouTube</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsGrid}>
              {ingredients.map((item, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientDot} />
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{item.ingredient}</Text>
                    {item.measure ? (
                      <Text style={styles.ingredientMeasure}>{item.measure}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {instructions.map((step, index) => (
              <View key={index} style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#888',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  backButtonFallback: {
    marginTop: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  heroImage: {
    width,
    height: 300,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  backArrow: {
    fontSize: 18,
    color: '#fff',
    lineHeight: 20,
  },
  backButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  mealTitleContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  mealTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagArea: {
    backgroundColor: '#4CAF50',
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  youtubeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
    gap: 10,
    elevation: 3,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  youtubeIcon: {
    fontSize: 18,
    color: '#fff',
  },
  youtubeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222',
    marginBottom: 14,
  },
  ingredientsGrid: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 10,
  },
  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    flexShrink: 0,
  },
  ingredientInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  ingredientMeasure: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
});
