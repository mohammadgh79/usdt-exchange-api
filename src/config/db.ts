import mongoose from 'mongoose';

  /** * Establishes a connection between the application and MongoDB Atlas.
   *  * * Reads the connection string from the MONGODB_URI environment variable.
   *  * If this variable is not defined, or if the connection fails, * an error message is logged to the console and the entire application * is terminated, since continuing without a database connection is not logical. 
   * * * @returns {Promise<void>} Waits until the connection is either established or rejected. */

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI در فایل .env تعریف نشده');
    }

    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
