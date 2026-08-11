const express = require('express');
const router = express.Router();
const { subscribeUser } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/subscribe', protect, subscribeUser);

module.exports = router;