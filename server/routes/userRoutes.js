const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, searchUsers } = require('../controllers/userController'); // <-- Import searchUsers

router.post('/register', registerUser);
router.post('/login', loginUser);

// MUST go before /:username to prevent route conflicts
router.get('/search', searchUsers); 

router.get('/:username', getUserProfile);

module.exports = router;