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
const updateRoutes = require("./routes/updateRoutes");

const app = express();

app.use(cors({
  origin: ['http://localhost:5173','http://localhost','https://localhost','capacitor://localhost', 'https://moboxd.onrender.com'],
  credentials: true
}));
app.use(express.json()); 

app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/activity', activityRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/updates", updateRoutes);
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
          'D9:ED:05:B4:AF:18:53:21:EE:22:C2:EE:02:02:78:D2:29:FA:B9:4B:AB:14:9D:D4:E4:FC:7E:E0:EC:10:95:40'
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