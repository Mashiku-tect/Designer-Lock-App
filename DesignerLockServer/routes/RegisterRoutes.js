// routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/RegisterController");

router.post("/register", authController.register);

module.exports = router;
