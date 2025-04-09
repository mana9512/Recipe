import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

export const RecipeModel = {
  collection: () => getDB().collection('recipes'),

  // Create a new recipe
  async create(recipeData) {
    const collection = this.collection();
    
    // Ensure mainIngredients is properly formatted
    const mainIngredients = recipeData.mainIngredients.map(ingredient => ({
      name: ingredient.name,
      quantity: parseFloat(ingredient.quantity) || 0,
      unit: ingredient.unit || ''
    }));
    
    const recipe = {
      name: recipeData.name,
      mainIngredients: mainIngredients,
      spices: recipeData.spices,
      servings: parseInt(recipeData.servings) || 4,
      prepTime: recipeData.prepTime || 30, // in minutes
      cookTime: recipeData.cookTime || 30, // in minutes
      difficulty: recipeData.difficulty || 'medium', // easy, medium, hard
      cuisine: recipeData.cuisine || 'indian',
      instructions: recipeData.instructions || [],
      userId: recipeData.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(recipe);
    return result.insertedId ? await this.findById(result.insertedId) : null;
  },

  // Find recipe by ID
  async findById(id) {
    const collection = this.collection();
    return await collection.findOne({ _id: new ObjectId(id) });
  },

  // Search recipes by name or ingredients
  async search(query, limit = 5) {
    const collection = this.collection();
    const searchQuery = query.toLowerCase().trim();
    
    console.log('Searching with query:', searchQuery);
    
    const searchCriteria = {
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { 'mainIngredients.name': { $regex: searchQuery, $options: 'i' } },
        { 'spices.name': { $regex: searchQuery, $options: 'i' } },
        { cuisine: { $regex: searchQuery, $options: 'i' } }
      ]
    };
    
    console.log('Search criteria:', JSON.stringify(searchCriteria, null, 2));
    
    const recipes = await collection
      .find(searchCriteria)
      .limit(limit)
      .toArray();
      
    console.log('Found recipes:', recipes.length);
    return recipes;
  },

  // Get recipes by user ID
  async findByUserId(userId) {
    const collection = this.collection();
    return await collection.find({ userId }).toArray();
  },

  // Update recipe
  async update(id, updateData) {
    const collection = this.collection();
    
    // Format main ingredients if they exist
    if (updateData.mainIngredients) {
      updateData.mainIngredients = updateData.mainIngredients.map(ingredient => ({
        name: ingredient.name,
        quantity: parseFloat(ingredient.quantity) || 0,
        unit: ingredient.unit || ''
      }));
    }

    // Format spices if they exist
    if (updateData.spices) {
      updateData.spices = updateData.spices.map(spice => ({
        name: spice.name,
        quantity: spice.quantity ? parseFloat(spice.quantity) : null,
        unit: spice.unit || ''
      }));
    }

    // Format other numeric fields
    if (updateData.servings) updateData.servings = parseInt(updateData.servings);
    if (updateData.prepTime) updateData.prepTime = parseInt(updateData.prepTime);
    if (updateData.cookTime) updateData.cookTime = parseInt(updateData.cookTime);

    // Add updated timestamp
    updateData.updatedAt = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    return result.value;
  },

  // Delete recipe
  async delete(id) {
    const collection = this.collection();
    return await collection.deleteOne({ _id: new ObjectId(id) });
  },

  // Get all recipes
  async getAllRecipes(limit = 50) {
    const collection = this.collection();
    return await collection
      .find({})
      .limit(limit)
      .toArray();
  },

  // Create indexes for the collection
  async createIndexes() {
    const collection = this.collection();
    await collection.createIndex({ name: 1 });
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ cuisine: 1 });
    await collection.createIndex({ difficulty: 1 });
    await collection.createIndex({ 
      name: "text",
      'mainIngredients.name': "text",
      'spices.name': "text"
    });
  }
}; 