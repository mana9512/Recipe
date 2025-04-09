const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const auth = require('../middleware/auth');

// Get all recipes
router.get('/', auth, recipeController.getAllRecipes);

// Get recipe by ID
router.get('/:id', auth, recipeController.getRecipeById);

// Get schema fields from ChatGPT
router.post('/schema', auth, recipeController.getSchemaFields);

// Add new recipe
router.post('/', auth, recipeController.addRecipe);

// Generate recipe from ChatGPT and save to database
router.post('/generate', auth, recipeController.generateAndSaveRecipe);

// Get recipe suggestions from ChatGPT
router.post('/suggestions', auth, recipeController.getRecipeSuggestions);

// Create new recipe with detailed information
router.post('/create', auth, recipeController.createRecipe);

module.exports = router; 