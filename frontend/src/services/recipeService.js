// Remove the useAuth import since it can't be used in a non-component file
// import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000';

// Create a function to get the auth token
const getAuthToken = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.error('No user found in localStorage');
      return '';
    }
    
    const user = JSON.parse(userStr);
    if (!user || !user.accessToken || typeof user.accessToken !== 'string' || user.accessToken.length === 0) {
      console.error('No valid access token found in user object');
      return '';
    }
    
    return user.accessToken;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return '';
  }
};

// Helper function to handle API responses
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};

export const recipeService = {
  // Get all recipes
  async getAllRecipes(limit = 50) {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${API_URL}/api/recipes?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await handleApiResponse(response);
      return data;
    } catch (error) {
      console.error('Error fetching recipes:', error);
      throw error;
    }
  },

  // Search recipes with suggestions
  async searchRecipes(query) {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${API_URL}/api/recipes/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await handleApiResponse(response);
      return data.slice(0, 5); // Return up to 5 suggestions
    } catch (error) {
      console.error('Error searching recipes:', error);
      throw error;
    }
  },

  // Get recipe by ID
  async getRecipeById(id) {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${API_URL}/api/recipes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await handleApiResponse(response);
      
      // Ensure the recipe has the correct structure
      if (!data.mainIngredients) {
        data.mainIngredients = [];
      }
      if (!data.spices) {
        data.spices = [];
      }
      
      // Ensure mainIngredients have the correct structure
      data.mainIngredients = data.mainIngredients.map(ingredient => {
        if (typeof ingredient === 'string') {
          return {
            name: ingredient,
            quantity: '1',
            unit: 'piece'
          };
        }
        return {
          name: ingredient.name || ingredient,
          quantity: ingredient.quantity || '1',
          unit: ingredient.unit || 'piece'
        };
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching recipe:', error);
      throw error;
    }
  },

  // Get recipe ingredients from ChatGPT
  async generateRecipe(recipeName) {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${API_URL}/api/recipes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipeName })
      });
      
      const data = await handleApiResponse(response);
      return data;
    } catch (error) {
      console.error('Error getting recipe ingredients:', error);
      throw error;
    }
  },

  // Create new recipe
  async createRecipe(recipeData) {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${API_URL}/api/recipes/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recipeData)
      });
      
      const data = await handleApiResponse(response);
      
      // Check if the response contains a recipe object
      if (data && data.recipe) {
        return data.recipe;
      }
      
      // If no recipe object is found, return the entire response
      return data;
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  },

  async deleteRecipe(recipeId) {
    try {
      const response = await fetch(`${API_URL}/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }
}; 