import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Paper, 
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  Chip,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { recipeService } from '../services/recipeService';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [recipeDetails, setRecipeDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consolidatedIngredients, setConsolidatedIngredients] = useState({});
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [newRecipeIngredients, setNewRecipeIngredients] = useState(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [expandedRecipes, setExpandedRecipes] = useState({});

  // Search for recipes as user types
  useEffect(() => {
    const searchRecipes = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);
        const results = await recipeService.searchRecipes(searchQuery);
        setSuggestions(results);
      } catch (err) {
        setError('Error searching recipes');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchRecipes, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Update consolidated ingredients when selected recipes change
  useEffect(() => {
    const consolidateIngredients = () => {
      const consolidated = {};
      
      selectedRecipes.forEach(recipe => {
        const details = recipeDetails[recipe._id];
        if (!details) return;
        
        // Process main ingredients
        const mainIngredients = details.mainIngredients || [];
        mainIngredients.forEach(ingredient => {
          const key = ingredient.name.toLowerCase();
          if (!consolidated[key]) {
            consolidated[key] = {
              name: ingredient.name,
              count: 1,
              recipes: [recipe.name],
              quantity: parseFloat(ingredient.quantity) || 0,
              unit: ingredient.unit || 'piece',
              isSpice: false
            };
          } else {
            consolidated[key].count++;
            consolidated[key].recipes.push(recipe.name);
            // If quantities are numeric, add them
            if (typeof consolidated[key].quantity === 'number' && typeof ingredient.quantity === 'number') {
              consolidated[key].quantity += ingredient.quantity;
            }
          }
        });
        
        // Process spices
        const spices = details.spices || [];
        spices.forEach(spice => {
          const key = spice.toLowerCase();
          if (!consolidated[key]) {
            consolidated[key] = {
              name: spice,
              count: 1,
              recipes: [recipe.name],
              quantity: null,
              unit: null,
              isSpice: true
            };
          } else {
            consolidated[key].count++;
            if (!consolidated[key].recipes.includes(recipe.name)) {
              consolidated[key].recipes.push(recipe.name);
            }
          }
        });
      });

      setConsolidatedIngredients(consolidated);
      
      // Initialize checked state for new ingredients
      const newCheckedState = { ...checkedIngredients };
      Object.keys(consolidated).forEach(ingredient => {
        if (newCheckedState[ingredient] === undefined) {
          newCheckedState[ingredient] = false;
        }
      });
      setCheckedIngredients(newCheckedState);
    };

    if (selectedRecipes.length > 0) {
      consolidateIngredients();
    }
  }, [selectedRecipes, recipeDetails, checkedIngredients]);

  const handleRecipeSelect = async (recipe) => {
    if (selectedRecipes.length >= 4 && !selectedRecipes.find(r => r._id === recipe._id)) {
      setError('You can only select up to 4 recipes');
      return;
    }

    try {
      setLoading(true);
      // If the recipe is already in selectedRecipes, don't fetch details again
      if (!selectedRecipes.find(r => r._id === recipe._id)) {
        const details = await recipeService.getRecipeById(recipe._id);

        console.log("details", details);
        
        // Ensure the recipe details have the correct structure
        if (details) {
          // Format the recipe data to ensure consistent structure
          const formattedRecipe = {
            ...recipe,
            mainIngredients: Array.isArray(details.mainIngredients) 
              ? details.mainIngredients.map(ingredient => {
                  return {
                    name: ingredient.name || '',
                    quantity: ingredient.quantity || '1',
                    unit: ingredient.unit || 'piece'
                  };
                })
              : [],
            spices: details.spices || []
          };

          console.log(formattedRecipe);
          
          setRecipeDetails(prev => ({
            ...prev,
            [recipe._id]: formattedRecipe
          }));
          setSelectedRecipes(prev => [...prev, formattedRecipe]);
        }
      }
      setSuggestions([]); // Clear suggestions after selection
    } catch (err) {
      console.error('Error fetching recipe details:', err);
      setError('Error fetching recipe details');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRecipe = async (recipeId) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // // Delete from database
      // await recipeService.deleteRecipe(recipeId);
      
      // Remove from local state
      setSelectedRecipes(prev => prev.filter(r => r._id !== recipeId));
      
      // Update recipe details
      setRecipeDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[recipeId];
        return newDetails;
      });
      
      // Clear expanded state
      setExpandedRecipes(prev => {
        const newExpanded = { ...prev };
        delete newExpanded[recipeId];
        return newExpanded;
      });

      // Force update of consolidated ingredients
      setConsolidatedIngredients(prev => {
        const newIngredients = { ...prev };
        // Remove ingredients that are only used in the deleted recipe
        Object.keys(newIngredients).forEach(key => {
          const ingredient = newIngredients[key];
          ingredient.recipes = ingredient.recipes.filter(recipeName => 
            selectedRecipes.find(r => r._id !== recipeId && r.name === recipeName)
          );
          if (ingredient.recipes.length === 0) {
            delete newIngredients[key];
          }
        });
        return newIngredients;
      });
      
      // Clear checked state for removed ingredients
      setCheckedIngredients(prev => {
        const newChecked = { ...prev };
        Object.keys(newChecked).forEach(key => {
          if (!consolidatedIngredients[key] || 
              consolidatedIngredients[key].recipes.length === 0) {
            delete newChecked[key];
          }
        });
        return newChecked;
      });
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError(err.message || 'Error deleting recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNewRecipe = async () => {
    if (!searchQuery) {
      setError('Please enter a recipe name');
      return;
    }

    try {
      setLoading(true);
      setIsAddingRecipe(true);
      setError(null);
      
      // Generate ingredients from ChatGPT
      const generatedRecipe = await recipeService.generateRecipe(searchQuery);
      
      // Ensure ingredients have the expected structure
      if (!generatedRecipe || !generatedRecipe.mainIngredients || !generatedRecipe.mainIngredients.length) {
        setError('Failed to generate recipe');
        return;
      }
      
      setNewRecipeIngredients(generatedRecipe);
      
      // Create new recipe with all required fields
      const newRecipe = await recipeService.createRecipe({
        ...generatedRecipe,
        });

      // Check if the recipe was created successfully
      if (!newRecipe) {
        setError('Failed to create recipe');
        return;
      }

      // Add the recipe to the selected recipes
      setRecipeDetails(prev => ({
        ...prev,
        [newRecipe._id]: newRecipe
      }));
      setSelectedRecipes(prev => [...prev, newRecipe]);
      setSearchQuery('');
      setSuggestions([]);
      setNewRecipeIngredients(null);
    } catch (err) {
      console.error('Error creating new recipe:', err);
      setError(err.message || 'Error creating new recipe');
    } finally {
      setLoading(false);
      setIsAddingRecipe(false);
    }
  };

  const handleIngredientCheck = (ingredient) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [ingredient]: !prev[ingredient]
    }));
  };

  const handleCheckAll = () => {
    const allChecked = Object.values(checkedIngredients).every(value => value);
    const newCheckedState = {};
    
    Object.keys(consolidatedIngredients).forEach(ingredient => {
      newCheckedState[ingredient] = !allChecked;
    });
    
    setCheckedIngredients(newCheckedState);
  };

  const handleExpandIngredients = (recipeId) => {
    setExpandedRecipes(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
  };

  // Helper function to safely get ingredient name
  const getIngredientName = (ingredient) => {
    if (typeof ingredient === 'string') {
      return ingredient;
    }
    return ingredient.name || '';
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Recipe Search
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Search for recipes"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., Chicken curry, Pasta carbonara"
            />
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleGenerateNewRecipe}
              disabled={loading || !searchQuery.trim()}
              startIcon={<AddIcon />}
            >
              Generate New Recipe
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading && !isAddingRecipe && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {isAddingRecipe && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Generating recipe from ChatGPT...</Typography>
            </Box>
          </Box>
        )}

        {/* Recipe Suggestions */}
        {suggestions.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Suggestions
            </Typography>
            <Grid container spacing={2}>
              {suggestions.map(recipe => (
                <Grid item xs={12} sm={6} md={4} key={recipe._id}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 3 },
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>{recipe.name}</Typography>
                      
                      {recipe.cuisine && (
                        <Chip 
                          label={recipe.cuisine} 
                          size="small" 
                          sx={{ mb: 1 }}
                        />
                      )}
                      
                      {recipe.mainIngredients && recipe.mainIngredients.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Main ingredients: {recipe.mainIngredients.slice(0, 3).map(ingredient => 
                              typeof ingredient === 'string' ? ingredient : ingredient.name
                            ).join(', ')}
                            {recipe.mainIngredients.length > 3 ? '...' : ''}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRecipeSelect(recipe);
                        }}
                      >
                        Add to List
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Selected Recipes */}
        {selectedRecipes.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Selected Recipes ({selectedRecipes.length}/4)
            </Typography>
            <Grid container spacing={2}>
              {selectedRecipes.map(recipe => (
                <Grid item xs={12} sm={6} md={4} key={recipe._id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">{recipe.name}</Typography>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemoveRecipe(recipe._id)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </Box>
                      
                      {recipeDetails[recipe._id] && (
                        <>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            <Chip 
                              label={recipeDetails[recipe._id].cuisine || 'Not specified'} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                            <Chip 
                              label={`${recipeDetails[recipe._id].difficulty || 'Medium'} Difficulty`} 
                              size="small" 
                              variant="outlined"
                            />
                            <Chip 
                              label={`${recipeDetails[recipe._id].servings || 8} Servings`} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                          
                          <Divider sx={{ my: 1.5 }} />
                          
                          <Typography variant="subtitle2" gutterBottom>
                            Main Ingredients:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {recipeDetails[recipe._id]?.mainIngredients?.slice(0, expandedRecipes[recipe._id] ? undefined : 5).map((ingredient, i) => (
                              <Chip 
                                key={i} 
                                label={`${ingredient.name}${ingredient.quantity ? ` - ${ingredient.quantity} ${ingredient.unit || ''}` : ''}`} 
                                size="small" 
                              />
                            ))}
                            {recipeDetails[recipe._id]?.mainIngredients?.length > 5 && (
                              <Chip 
                                label={`${expandedRecipes[recipe._id] ? 'Show Less' : `+${recipeDetails[recipe._id]?.mainIngredients?.length - 5} more`}`} 
                                size="small" 
                                variant="outlined"
                                onClick={() => handleExpandIngredients(recipe._id)}
                                sx={{ cursor: 'pointer' }}
                              />
                            )}
                          </Box>
                          
                          {recipeDetails[recipe._id]?.spices?.length > 0 && (
                            <>
                              <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                                Spices & Seasonings:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {recipeDetails[recipe._id]?.spices?.slice(0, expandedRecipes[recipe._id] ? undefined : 5).map((spice, i) => (
                                  <Chip 
                                    key={i} 
                                    label={spice}
                                    size="small" 
                                    variant="outlined"
                                  />
                                ))}
                                {recipeDetails[recipe._id]?.spices?.length > 5 && (
                                  <Chip 
                                    label={`${expandedRecipes[recipe._id] ? 'Show Less' : `+${recipeDetails[recipe._id]?.spices?.length - 5} more`}`} 
                                    size="small" 
                                    variant="outlined"
                                    onClick={() => handleExpandIngredients(recipe._id)}
                                    sx={{ cursor: 'pointer' }}
                                  />
                                )}
                              </Box>
                            </>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Consolidated Grocery List */}
        {Object.keys(consolidatedIngredients).length > 0 && (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Grocery List
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleCheckAll}
              >
                {Object.values(checkedIngredients).every(value => value) ? 'Uncheck All' : 'Check All'}
              </Button>
            </Box>
            
            <List>
              {Object.entries(consolidatedIngredients)
                .sort((a, b) => {
                  // Sort main ingredients first, then spices
                  if (a[1].isSpice !== b[1].isSpice) {
                    return a[1].isSpice ? 1 : -1;
                  }
                  // Then sort alphabetically
                  return a[1].name.localeCompare(b[1].name);
                })
                .map(([key, data]) => (
                <ListItem 
                  key={key}
                  divider
                  sx={{ 
                    py: 1.5,
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={checkedIngredients[key] || false}
                      onChange={() => handleIngredientCheck(key)}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ 
                        textDecoration: checkedIngredients[key] ? 'line-through' : 'none',
                        color: checkedIngredients[key] ? 'text.secondary' : 'text.primary',
                        fontWeight: data.isSpice ? 'normal' : 'medium'
                      }}>
                        {data.name}
                        {data.quantity && data.unit && (
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({data.quantity} {data.unit})
                          </Typography>
                        )}
                        {data.isSpice && (
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            (to taste)
                          </Typography>
                        )}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Used in {data.count} {data.count > 1 ? 'recipes' : 'recipe'}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {data.recipes.map(recipe => (
                            <Chip 
                              key={recipe} 
                              label={recipe} 
                              size="small" 
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default HomePage;