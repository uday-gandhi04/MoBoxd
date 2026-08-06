const express = require('express');
const router = express.Router();
const { getActivityFeed,getUnreadActivityCount, markActivityAsRead } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getActivityFeed);
router.get('/unread', protect, getUnreadActivityCount);
router.put('/mark-read', protect, markActivityAsRead);

module.exports = router;