import express from 'express';
import { 
  searchRecipes,
  generateRecipe,
  addRecipe,
  getAllRecipes,
  getRecipeById,
  deleteRecipe,
  createRecipe
} from '../controllers/recipeController.js';
import { verifyToken, verifyGoogleToken } from '../middleware/auth.js';

const router = express.Router();

// Search recipes
router.get('/search', verifyGoogleToken, searchRecipes);

// Generate recipe using ChatGPT
router.post('/generate', verifyGoogleToken, generateRecipe);

// Add a new recipe
router.post('/', verifyGoogleToken, addRecipe);

// Get all recipes
router.get('/', verifyGoogleToken, getAllRecipes);

// Get recipe by ID
router.get('/:id', verifyGoogleToken, getRecipeById);

// Delete recipe
router.delete('/:id', verifyGoogleToken, deleteRecipe);

// Create a new recipe
router.post('/create', verifyGoogleToken, createRecipe);

export default router; 