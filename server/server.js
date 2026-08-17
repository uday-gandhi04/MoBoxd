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
  origin: ['http://localhost:5173','http://localhost', 'https://moboxd.onrender.com'],
  credentials: true
}));
app.use(express.json()); 

app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/activity', activityRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve Digital Asset Links for Android App Links verification
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.moboxd.app',
        sha256_cert_fingerprints: [
          'AE:E6:1B:71:51:23:0E:62:17:BA:F5:30:D3:6A:9E:4B:44:F2:31:42:24:C8:04:8E:F6:80:EE:DD:85:DB:C5:0C'
        ]
      }
    }
  ]);
});


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});