const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes'); // <-- Import User Routes

const app = express();

app.use(cors());
app.use(express.json()); 

app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes); // <-- Mount User Routes

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});