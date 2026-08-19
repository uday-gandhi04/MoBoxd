const express = require("express");
const router = express.Router();

const {
  subscribeUser,
  unsubscribeUser,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

router.post("/subscribe", protect, subscribeUser);
router.post("/unsubscribe", protect, unsubscribeUser);

module.exports = router;