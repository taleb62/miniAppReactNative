import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, Image,
  StyleSheet, Dimensions, Animated, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import PressableScale from '../components/PressableScale';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

/* ─── Category pill ─── */
function CategoryPill({ item, isSelected, onPress }) {
  return (
    <PressableScale onPress={() => onPress(item)} scaleTo={0.92}>
      <View style={[styles.pill, isSelected && styles.pillSelected]}>
        <Image source={{ uri: item.strCategoryThumb }} style={styles.pillImage} />
        <Text style={[styles.pillLabel, isSelected && styles.pillLabelSelected]} numberOfLines={1}>
          {item.strCategory}
        </Text>
      </View>
    </PressableScale>
  );
}

/* ─── Meal card ─── */
function MealCard({ item, navigation }) {
  return (
    <PressableScale
      onPress={() => navigation.navigate('MealDetail', { mealId: item.idMeal, mealName: item.strMeal })}
      style={styles.card}
      scaleTo={0.96}
    >
      <Image source={{ uri: item.strMealThumb }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.strMeal}</Text>
      </View>
    </PressableScale>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();

  const [categories,    setCategories]    = useState([]);
  const [selectedCat,   setSelectedCat]   = useState(null);
  const [meals,         setMeals]         = useState([]);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingCats,   setLoadingCats]   = useState(true);
  const [loadingMeals,  setLoadingMeals]  = useState(false);
  const [listKey,       setListKey]       = useState('0');

  // Single screen fade-in on mount
  const screenOpac = useRef(new Animated.Value(0)).current;
  // Grid fade on category switch
  const gridOpac   = useRef(new Animated.Value(1)).current;

  const searchTimer = useRef(null);

  useEffect(() => {
    Animated.timing(screenOpac, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res  = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
      const data = await res.json();
      const cats = data.categories || [];
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCat(cats[0]);
        fetchMeals(cats[0]);
      }
    } finally {
      setLoadingCats(false);
    }
  };

  const fetchMeals = (category) => {
    setLoadingMeals(true);
    // Fade grid out → load → fade in
    Animated.timing(gridOpac, { toValue: 0, duration: 120, useNativeDriver: true }).start(async () => {
      try {
        const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category.strCategory)}`);
        const data = await res.json();
        setMeals(data.meals || []);
        setListKey(category.idCategory);
      } finally {
        setLoadingMeals(false);
        Animated.timing(gridOpac, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      }
    });
  };

  const handleCategoryPress = (cat) => {
    setSelectedCat(cat);
    setSearchQuery('');
    setSearchResults([]);
    fetchMeals(cat);
  };

  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(text)}`);
        const data = await res.json();
        setSearchResults(data.meals || []);
        setListKey(`s-${text}`);
      } catch {}
    }, 400);
  }, []);

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayedMeals = searchQuery.trim() ? searchResults : meals;

  /* ─── Header du FlatList (search + catégories + titre) ─── */
  const ListHeader = (
    <View>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un plat..."
          placeholderTextColor="#BBB"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <PressableScale onPress={() => handleSearch('')} scaleTo={0.85}>
            <View style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </View>
          </PressableScale>
        )}
      </View>

      {/* Catégories */}
      {!searchQuery.trim() && !loadingCats && (
        <FlatList
          data={categories}
          keyExtractor={i => i.idCategory}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
          renderItem={({ item }) => (
            <CategoryPill
              item={item}
              isSelected={selectedCat?.idCategory === item.idCategory}
              onPress={handleCategoryPress}
            />
          )}
        />
      )}

      {/* Titre section */}
      <Text style={styles.sectionTitle}>
        {searchQuery.trim()
          ? `"${searchQuery}" — ${displayedMeals.length} résultat${displayedMeals.length !== 1 ? 's' : ''}`
          : selectedCat?.strCategory ?? ''}
      </Text>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: screenOpac }]}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />

      {/* Header fixe */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MealApp 🍽️</Text>
          <Text style={styles.headerSub}>Découvre des recettes délicieuses</Text>
        </View>
        <PressableScale onPress={() => navigation.navigate('Profile')} scaleTo={0.9}>
          <View style={styles.avatarBtn}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
        </PressableScale>
      </View>

      {/* Tout dans un seul FlatList → zéro espace parasite */}
      <Animated.View style={{ flex: 1, opacity: gridOpac }}>
        {displayedMeals.length === 0 && searchQuery.trim() ? (
          /* État vide search */
          <FlatList
            data={[]}
            keyExtractor={() => 'empty'}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🍳</Text>
                <Text style={styles.emptyText}>Aucun résultat pour "{searchQuery}"</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            key={listKey}
            data={loadingMeals ? [] : displayedMeals}
            keyExtractor={i => i.idMeal}
            numColumns={2}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={
              loadingMeals
                ? <View style={styles.loadingBox}><Text style={styles.loadingText}>Chargement...</Text></View>
                : null
            }
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <MealCard item={item} navigation={navigation} />
            )}
          />
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  /* Header */
  header: {
    backgroundColor: '#FF6B35',
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: 2 },
  avatarBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  /* Search */
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    marginHorizontal: 16, marginTop: 14, marginBottom: 0,
    paddingHorizontal: 14, height: 48,
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },
  searchIcon:  { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  clearBtn: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center',
  },
  clearText: { fontSize: 10, color: '#888', fontWeight: '700' },

  /* Categories */
  pillsRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8 },
  pill: {
    alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 8, width: 72,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
    borderWidth: 2, borderColor: 'transparent',
  },
  pillSelected:      { borderColor: '#FF6B35', backgroundColor: '#FFF3EE' },
  pillImage:         { width: 42, height: 42, borderRadius: 21 },
  pillLabel:         { fontSize: 10, fontWeight: '700', color: '#666', marginTop: 4, textAlign: 'center' },
  pillLabelSelected: { color: '#FF6B35' },

  /* Section title */
  sectionTitle: {
    fontSize: 18, fontWeight: '800', color: '#1A1A1A',
    marginHorizontal: 16, marginTop: 14, marginBottom: 10,
  },

  /* Grid */
  grid: { paddingHorizontal: 16, paddingBottom: 28 },
  row:  { justifyContent: 'space-between', marginBottom: 12 },

  /* Card */
  card: {
    width: CARD_WIDTH, borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#fff', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09, shadowRadius: 6,
  },
  cardImage: { width: CARD_WIDTH, height: CARD_WIDTH },
  cardBody:  { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#333', lineHeight: 18 },

  /* States */
  loadingBox:  { paddingTop: 60, alignItems: 'center' },
  loadingText: { fontSize: 15, color: '#BBB' },
  emptyBox:    { paddingTop: 60, alignItems: 'center', gap: 12 },
  emptyEmoji:  { fontSize: 44 },
  emptyText:   { fontSize: 15, color: '#BBB', textAlign: 'center' },
});
