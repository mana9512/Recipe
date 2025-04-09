import { RecipeModel } from '../models/Recipe.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Search recipes in the database
export const searchRecipes = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Use the search method from our RecipeModel
    const recipes = await RecipeModel.search(q);
    
    res.status(200).json(recipes);
  } catch (error) {
    console.error('Search recipes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate a recipe using ChatGPT
export const generateRecipe = async (req, res) => {
  try {
    const { recipeName } = req.body;
    const googleUser = req.googleUser;
    
    if (!recipeName) {
      return res.status(400).json({ message: 'Recipe query is required' });
    }
    
    // Call ChatGPT API to generate a recipe
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: "system",
            content: `You are a culinary assistant that generates structured recipes for precisely 8 servings in JSON format.
          Only use ingredients that are commonly used for the dish and avoid vague items like "slices of onions" — instead, just say "onions". Base the ingredient selection on known traditional recipes.`
          },
          {
            role: "user",
            content: `Generate a recipe for "${recipeName}" in the following JSON format:
          
          {
            "name": "Recipe Name", // This must be a real recipe name. Strings like 'test', 'dummy', 'sample' are not allowed. DO NOT generate a recipe name that is not a real recipe name. Just return an empty object if you cannot generate a real recipe name.
            "cuisine": "Cuisine Type (e.g., Indian, Italian, Mexican)",
            "difficulty": "Easy/Medium/Hard",
            "mainIngredients": [{
                "name": "ingredient1",
                "quantity": "1/2/3/4",
                "unit": "cup/kg/ml/oz/piece"
              }, // use whole items, not forms like "slices of onions"
              {
                "name": "ingredient2",
                "quantity": "1/2/3/4",
                "unit": "cup/kg/ml/oz/piece"
              }], // use whole items, not forms like "slices of onions"
            "spices": ["spice1", "spice2", ...] // spices do not have quantity and unit.
            "servings": "8" // This must be 8. Also keep in mind to adjust the quantities of the main ingredients to 8 servings.
          }
          
          Only return the JSON object and nothing else.
          
          Here’s an example for "Sambar":
          {
            "name": "Sambar",
            "cuisine": "Indian",
            "difficulty": "Medium",
            "mainIngredients": [ // NOTE that main ingredients have quantity and unit. Do your best guess to differentiate between spices and main ingredients. But make sure that it is not duplicated.
              {
                "name": "Toor Dal",
                "quantity": "2",
                "unit": "cup"
              },
              {
                "name": "Onion",
                "quantity": "1",
                "unit": "piece"
              },
              {
                "name": "Tomato",
                "quantity": "2",
                "unit": "piece"
              },
              {
                "name": "Carrot",
                "quantity": "1",
                "unit": "piece"
              },
              {
                "name": "Green Beans",
                "quantity": "8",
                "unit": "piece"
              },
              {
                "name": "Drum Sticks",
                "quantity": "3",
                "unit": "piece"
              },
              {
                "name": "Potato",
                "quantity": "1",
                "unit": "piece"
              },
              {
                "name": "Urad Dal",
                "quantity": "5",
                "unit": "tbsp"
              },
              {
                "name": "Grated Coconut",
                "quantity": "3",
                "unit": "tbsp"
              },
              {
                "name": "Green Chilli",
                "quantity": "2",
                "unit": "piece"
              }
            ],
            "spices": [
              "Coriander Seeds", // NOTE that spices do not have quantity and unit.
              "Black Pepper",
              "Jaggery",
              "Curry leaves",
              "Tamarind concentrate",
              "Mustard seeds",
              "Dried red chilli",
              "Cumin seeds (jeera)",
              "Hing",
              "Turmeric",
              "Sambar Masala"
            ],
            "servings": "8",
          }
          `
          }          
        ],
        temperature: 0.5,
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );
    
    // Extract the JSON from the response
    const content = response.data.choices[0].message.content;
    const recipeData = JSON.parse(content);
    
    // Add user ID from Google authentication
    recipeData.userId = googleUser.sub;
    
    res.status(200).json(recipeData);
  } catch (error) {
    console.error('Generate recipe error:', error);
    res.status(500).json({ message: 'Error generating recipe' });
  }
};

// Add a new recipe to the database
export const addRecipe = async (req, res) => {
  try {
    const recipeData = req.body;
    const googleUser = req.googleUser;
    
    // Validate required fields
    if (!recipeData.name || !recipeData.cuisine || !recipeData.mainIngredients) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Add user ID from Google authentication
    recipeData.userId = googleUser.sub;
    
    // Create new recipe
    const newRecipe = await RecipeModel.create(recipeData);
    
    res.status(201).json(newRecipe);
  } catch (error) {
    console.error('Add recipe error:', error);
    res.status(500).json({ message: 'Error adding recipe' });
  }
};

// Get all recipes
export const getAllRecipes = async (req, res) => {
  try {
    const recipes = await RecipeModel.find().sort({ createdAt: -1 });
    res.status(200).json(recipes);
  } catch (error) {
    console.error('Get all recipes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recipe by ID
export const getRecipeById = async (req, res) => {
  try {
    const recipe = await RecipeModel.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete recipe
export const deleteRecipe = async (req, res) => {
  try {
    const recipe = await RecipeModel.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    if (recipe.userId !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await RecipeModel.delete(req.params.id);
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new recipe in the database
export const createRecipe = async (req, res) => {
  try {
    const {
      name,
      cuisine,
      difficulty,
      mainIngredients,
      spices,
      servings,
    } = req.body;
    
    const googleUser = req.googleUser;
    
    // Validate required fields
    if (!name || !cuisine || !mainIngredients) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, cuisine, and mainIngredients are required' 
      });
    }
    
    // Create new recipe with all fields
    const newRecipe = await RecipeModel.create({
      name,
      cuisine,
      difficulty: difficulty || 'Medium',
      mainIngredients,
      spices: spices || [],
      servings: servings || 8,
      userId: googleUser.sub // Use Google user ID
    });
    
    res.status(201).json({
      message: 'Recipe created successfully',
      recipe: newRecipe
    });
  } catch (error) {
    console.error('Create recipe error:', error);
    res.status(500).json({ message: 'Error creating recipe' });
  }
}; 


