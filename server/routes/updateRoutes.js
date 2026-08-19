const express = require("express");
const router = express.Router();

const {
  checkForUpdate,
} = require("../controllers/updateController");

router.post("/", checkForUpdate);

module.exports = router;