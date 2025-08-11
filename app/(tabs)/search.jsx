import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { MealAPI } from "../../services/mealAPI";
import { useDebounce } from "../../hooks/usedebounce";
import { searchStyles } from "../../assets/styles/search.styles";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import RecipeCard from "../../components/RecipeCard";
import { NoResultsFound } from "../../components/NotFound";
const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const debounceSearchQuery = useDebounce(searchQuery, 2000);
  const performSearch = async (query) => {
    if (!query.trim()) {
      const randomMeals = await MealAPI.getRandomMeals(12);

      return randomMeals
        .map((meal) => MealAPI.transformMealData(meal))
        .filter((meal) => meal !== null);
    }

    const nameResult = await MealAPI.searchMealsByName(query);
    let result = nameResult;
    if (result.length === 0) {
      const ingredientResult = await MealAPI.filterByIngredient(query);
      result = ingredientResult;
    }

    return result
      .slice(0, 12)
      .map((meal) => MealAPI.transformMealData(meal))
      .filter((meal) => meal !== null);
  };
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const result = await performSearch("");
        setRecipes(result);
      } catch (error) {
        console.error(error);
      } finally {
        setInitialLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (initialLoading) return;
    const handleSearch = async () => {
      setLoading(true);
      try {
        const result = await performSearch(debounceSearchQuery);
        setRecipes(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    handleSearch();
  }, [debounceSearchQuery, initialLoading]);

  if (initialLoading) return <LoadingSpinner message="Loading recipes ..." />;

  return (
    <View style={searchStyles.container}>
      <View style={searchStyles.searchSection}>
        <View style={searchStyles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.textLight}
            style={searchStyles.searchIcon}
          />
          <TextInput
            style={searchStyles.searchInput}
            placeholder="Search recipes, ingredients..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={searchStyles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={searchStyles.resultsSection}>
        <View style={searchStyles.resultsHeader}>
          <Text style={searchStyles.resultsTitle}>
            {searchQuery ? `Results for "${searchQuery}"` : "Popular Recipes"}
          </Text>
          <Text style={searchStyles.resultsCount}>{recipes.length} found</Text>
        </View>
        {loading ? (
          <View style={searchStyles.loadingContainer}>
            <LoadingSpinner message="Searching recipes..." size="small" />
          </View>
        ) : (
          <FlatList
            data={recipes}
            renderItem={({ item }) => <RecipeCard recipe={item} />}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={searchStyles.row}
            contentContainerStyle={searchStyles.recipesGrid}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<NoResultsFound />}
          />
        )}
      </View>
    </View>
  );
};

export default SearchScreen;
