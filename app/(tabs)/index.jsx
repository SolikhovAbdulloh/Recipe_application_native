import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Ionicons } from "@expo/vector-icons";
import { MealAPI } from "../../services/mealAPI";
import { homeStyles } from "../../assets/styles/home.styles";
import { COLORS } from "../../constants/colors";
import CategoryFilter from "../../components/CategoryFilter";
import RecipeCard from "../../components/RecipeCard";
const HomeScreen = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredRecipe, setFeaturedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [apiCategories, randomMeals, featuredMeal] = await Promise.all([
        MealAPI.getCategories(),
        MealAPI.getRandomMeals(12),
        MealAPI.getRandomMeal(),
      ]);

      const transformedCategories = apiCategories.map((cat, index) => ({
        id: index + 1,
        name: cat.strCategory,
        image: cat.strCategoryThumb,
        description: cat.strCategoryDescription,
      }));
      setCategories(transformedCategories);

      if (!selectedCategory) setSelectedCategory(transformedCategories[0].name);

      const transformedMeals = randomMeals
        .map((meal) => {
          return MealAPI.transformMealData(meal);
        })
        .filter((meal) => meal !== null);
      setRecipes(transformedMeals);

      const transformedFeatured = MealAPI.transformMealData(featuredMeal);
      setFeaturedRecipe(transformedFeatured);
    } catch (error) {
      console.log("Error loading the data", error);
    } finally {
      setLoading(false);
    }
  };
  const loadCategoryData = async (category) => {
    try {
      const meals = await MealAPI.filterByCategory(category);
      const transformedMeals = meals
        .map((meal) => MealAPI.transformMealData(meal))
        .filter((meal) => meal !== null);
      setRecipes(transformedMeals);
    } catch (error) {
      console.error("Error loading category data:", error);
      setRecipes([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    await loadCategoryData(category);
  };
  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading delicions recipes..." />;
  }
  return (
    <View style={homeStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={homeStyles.scrollContent}
      >
        <View style={homeStyles.welcomeSection}>
          <Image
            style={{ width: 100, height: 100 }}
            source={require("../../assets/images/lamb.png")}
          />
          <Image
            style={{ width: 100, height: 100 }}
            source={require("../../assets/images/chicken.png")}
          />
          <Image
            style={{ width: 100, height: 100 }}
            source={require("../../assets/images/lamb.png")}
          />
        </View>
        {featuredRecipe && (
          <View style={homeStyles.featuredSection}>
            <TouchableOpacity
              onPress={() => router.push(`/recipe/${featuredRecipe.id}`)}
            >
              <View style={homeStyles.featuredImageContainer}>
                <Image
                  source={{ uri: featuredRecipe.image }}
                  style={homeStyles.featuredImage}
                  contentFit="cover"
                  transition={500}
                />
              </View>
              <View style={homeStyles.featuredOverlay}>
                <View style={homeStyles.featuredBadge}>
                  <Text style={homeStyles.featuredBadgeText}>Featured</Text>
                </View>

                <View style={homeStyles.featuredContent} numberOfLines={2}>
                  <Text style={homeStyles.featuredTitle}>
                    {featuredRecipe.title}
                  </Text>

                  <View style={homeStyles.featuredMeta}>
                    <View style={homeStyles.metaItem}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={COLORS.white}
                      />
                      <Text style={homeStyles.metaText}>
                        {featuredRecipe.cookTime}
                      </Text>
                    </View>
                    <View style={homeStyles.metaItem}>
                      <Ionicons
                        name="people-outline"
                        size={16}
                        color={COLORS.white}
                      />
                      <Text style={homeStyles.metaText}>
                        {featuredRecipe.servings}
                      </Text>
                    </View>
                    {featuredRecipe.area && (
                      <View style={homeStyles.metaItem}>
                        <Ionicons
                          name="location-outline"
                          size={16}
                          color={COLORS.white}
                        />
                        <Text style={homeStyles.metaText}>
                          {featuredRecipe.area}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        )}
        <View style={homeStyles.recipesSection}>
          <View style={homeStyles.sectionHeader}>
            <Text style={homeStyles.sectionTitle}>{selectedCategory}</Text>
          </View>
          {recipes.length > 0 ? (
            <FlatList
              data={recipes}
              renderItem={({ item }) => <RecipeCard recipe={item} />}
              keyExtractor={(item, index) =>
                item.id ? item.id.toString() : index.toString()
              }
              numColumns={2}
              columnWrapperStyle={homeStyles.row}
              contentContainerStyle={homeStyles.recipesGrid}
              scrollEnabled={false}
            />
          ) : (
            <View style={homeStyles.emptyState}>
              <Ionicons
                name="restaurant-outline"
                size={64}
                color={COLORS.textLight}
              />
              <Text style={homeStyles.emptyTitle}>No recipes found</Text>
              <Text style={homeStyles.emptyDescription}>
                Try a different category
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
