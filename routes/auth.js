const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
require('dotenv').config();

const router = express.Router();

const saltRounds = 10;

// Email validation function
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  // Additional domain validation
  const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'company.com'];
  const domain = email.split('@')[1];
  if (!allowedDomains.includes(domain)) {
    throw new Error('Email domain not allowed');
  }
  
  return true;
};

// Password validation function
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
  
  return true;
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Validate email format
    try {
      validateEmail(email);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }

    // Validate password strength
    try {
      validatePassword(password);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user without verification columns
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    // Get the created user
    const [newUser] = await pool.execute(
      'SELECT id, name, email FROM users WHERE id = ?',
      [result.insertId]
    );

    // Generate token
    const token = generateToken(newUser[0]);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: {
        user: {
          id: newUser[0].id,
          name: newUser[0].name,
          email: newUser[0].email
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.' 
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Validate email format
    try {
      validateEmail(email);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }

    // Find user
    const [users] = await pool.execute(
      'SELECT id, name, email, password FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
});

module.exports = router;
