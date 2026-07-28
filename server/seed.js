const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Post = require('./models/Post');

const seedDB = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // 2. Clear existing database collections to prevent duplicates
    await User.deleteMany({});
    await Post.deleteMany({});

    // 3. Create Mock Users
    const createdUsers = await User.insertMany([
      { username: 'sarah_j', email: 'sarah@test.com', password: 'password123' },
      { username: 'dave_c', email: 'dave@test.com', password: 'password123' }
    ]);

    // 4. Create Mock Posts tied to the newly created users
    await Post.insertMany([
      {
        author: createdUsers[0]._id, // References sarah_j
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000', // Mock Pizza Image
        caption: "Had an incredible dinner at Tony's Pizzeria! This pizza was pure perfection.",
        category: 'Food',
        authorRating: 4.5,
        communityAverageRating: 4.2,
        totalReviews: 12
      },
      {
        author: createdUsers[1]._id, // References dave_c
        imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000', // Mock Hike Image
        caption: 'Sunrise hike at Zion. Unbelievable view!',
        category: 'Place',
        authorRating: 5.0,
        communityAverageRating: 4.8,
        totalReviews: 64
      }
    ]);

    console.log('Database successfully seeded with mock data!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();