import fs from 'fs';
import { parse } from 'csv-parse';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.DATABASE_NAME || 'recipe_app';
const COLLECTION_NAME = 'recipes';

// Path to the CSV file (relative to the project root)
const CSV_FILE_PATH = path.resolve(__dirname, '../../data/full_stack_project_grocery_list.csv');

async function importRecipes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Clear existing recipes
    await collection.deleteMany({});
    console.log('Cleared existing recipes');
    
    // Check if file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV file not found at: ${CSV_FILE_PATH}`);
    }
    
    console.log(`Reading CSV file from: ${CSV_FILE_PATH}`);
    
    // Read and parse CSV file
    const parser = fs
      .createReadStream(CSV_FILE_PATH)
      .pipe(parse({ columns: true, skip_empty_lines: true }));
    
    const recipes = new Map();
    
    for await (const record of parser) {
      const { 'Dish name': dishName, Quantity, 'Unit of Measure': unit, Ingredients } = record;
      
      if (!dishName) continue;
      
      if (!recipes.has(dishName)) {
        recipes.set(dishName, {
          name: dishName,
          mainIngredients: [],
          spices: [],
          servings: 8, // Default servings
          userId: null, // Will be set when user creates/updates
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      const recipe = recipes.get(dishName);
      
      // Skip if no ingredient
      if (!Ingredients) continue;
      
      // Clean up ingredient name
      const ingredientName = Ingredients.trim();
      
      // Skip if empty ingredient
      if (!ingredientName) continue;
      
      // Determine if it's a spice (no quantity) or main ingredient
      if (!Quantity) {
        if (!recipe.spices.includes(ingredientName)) {
          recipe.spices.push(ingredientName);
        }
      } else {
        const quantity = parseFloat(Quantity);
        if (!isNaN(quantity)) {
          recipe.mainIngredients.push({
            name: ingredientName,
            quantity,
            unit: unit || 'piece'
          });
        }
      }
    }
    
    // Insert all recipes
    const recipesArray = Array.from(recipes.values());
    if (recipesArray.length > 0) {
      await collection.insertMany(recipesArray);
      console.log(`Imported ${recipesArray.length} recipes`);
    }
    
    // Create indexes
    await collection.createIndex({ name: 1 });
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ 
      name: 'text',
      'mainIngredients.name': 'text',
      'spices': 'text'
    });
    console.log('Created indexes');
    
  } catch (error) {
    console.error('Error importing recipes:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the import
importRecipes(); 