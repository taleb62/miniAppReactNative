import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const CARD_WIDTH = (width - 32 - COLUMN_GAP) / 2;

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [meals, setMeals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
      const data = await res.json();
      setCategories(data.categories || []);
      if (data.categories?.length > 0) {
        handleCategorySelect(data.categories[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setSearchQuery('');
    setSearchResults([]);
    setLoadingMeals(true);
    try {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category.strCategory)}`
      );
      const data = await res.json();
      setMeals(data.meals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMeals(false);
    }
  };

  const handleSearch = useCallback(
    (text) => {
      setSearchQuery(text);
      if (searchTimeout) clearTimeout(searchTimeout);
      if (!text.trim()) {
        setSearchResults([]);
        return;
      }
      const timeout = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(text)}`
          );
          const data = await res.json();
          setSearchResults(data.meals || []);
        } catch (e) {
          console.error(e);
        }
      }, 400);
      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  const displayedMeals = searchQuery.trim() ? searchResults : meals;

  const renderCategory = ({ item }) => {
    const isSelected = selectedCategory?.idCategory === item.idCategory;
    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
        onPress={() => handleCategorySelect(item)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.strCategoryThumb }} style={styles.categoryImage} />
        <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]} numberOfLines={1}>
          {item.strCategory}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMeal = ({ item }) => (
    <TouchableOpacity
      style={styles.mealCard}
      onPress={() => navigation.navigate('MealDetail', { mealId: item.idMeal, mealName: item.strMeal })}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.strMealThumb }} style={styles.mealImage} />
      <View style={styles.mealCardOverlay}>
        <Text style={styles.mealName} numberOfLines={2}>
          {item.strMeal}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MealApp</Text>
        <Text style={styles.headerSubtitle}>Discover delicious recipes</Text>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search meals..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {!searchQuery.trim() && (
        <View style={styles.categoriesSection}>
          {loadingCategories ? (
            <ActivityIndicator color="#FF6B35" style={{ margin: 16 }} />
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.idCategory}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          )}
        </View>
      )}

      {selectedCategory && !searchQuery.trim() && (
        <Text style={styles.sectionTitle}>{selectedCategory.strCategory}</Text>
      )}
      {searchQuery.trim() && (
        <Text style={styles.sectionTitle}>
          Results for "{searchQuery}" ({displayedMeals.length})
        </Text>
      )}

      {loadingMeals ? (
        <ActivityIndicator color="#FF6B35" size="large" style={{ flex: 1 }} />
      ) : displayedMeals.length === 0 && searchQuery.trim() ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No meals found for "{searchQuery}"</Text>
        </View>
      ) : (
        <FlatList
          data={displayedMeals}
          renderItem={renderMeal}
          keyExtractor={(item) => item.idMeal}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.mealsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FF6B35',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 12,
    paddingHorizontal: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    height: 48,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 14,
    color: '#999',
  },
  categoriesSection: {
    marginTop: 18,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    width: 82,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF4F0',
  },
  categoryImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    marginTop: 6,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: '#FF6B35',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  mealsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: COLUMN_GAP,
  },
  mealCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  mealImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
  },
  mealCardOverlay: {
    padding: 10,
  },
  mealName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
});
