const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes'); // <-- Import User Routes
const activityRoutes = require('./routes/activityRoutes'); // <-- Import Activity Routes

const app = express();

app.use(cors());
app.use(express.json()); 

app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes); // <-- Mount User Routes
app.use('/api/activity', activityRoutes); // <-- Mount Activity Routes

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});