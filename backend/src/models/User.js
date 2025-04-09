import { getDB } from '../config/db.js';

export const UserModel = {
  collection: () => getDB().collection('users'),

  // Create a new user
  async create(userData) {
    const collection = this.collection();
    const result = await collection.insertOne({
      ...userData,
      createdAt: new Date()
    });
    return result.ops ? result.ops[0] : await this.findById(result.insertedId);
  },

  // Find user by Google ID
  async findByGoogleId(googleId) {
    const collection = this.collection();
    return await collection.findOne({ googleId });
  },

  // Find user by ID
  async findById(id) {
    const collection = this.collection();
    return await collection.findOne({ _id: id });
  },

  // Find user by email
  async findByEmail(email) {
    const collection = this.collection();
    return await collection.findOne({ email });
  },

  // Update user
  async update(id, updateData) {
    const collection = this.collection();
    const result = await collection.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    return result.value;
  }
}; 