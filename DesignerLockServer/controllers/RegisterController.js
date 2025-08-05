// controllers/authController.js

const db = require("../config/db");
const bcrypt = require("bcrypt");

const User = require("../models/User");

exports.register = async (req, res) => {
  const { firstname, lastname, email, phonenumber, password } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingPhone = await User.findOne({ where: { phonenumber } });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await User.create({
      firstname,
      lastname,
      email,
      phonenumber,
      password: hashedPassword,
    });

    return res.status(201).json({ message: "Registration successful!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
