const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes'); 
const activityRoutes = require('./routes/activityRoutes'); 
const rankingRoutes = require('./routes/rankingRoutes'); 
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://moboxd.onrender.com'],
  credentials: true
}));
app.use(express.json()); 

app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/activity', activityRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});