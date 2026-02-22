const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auth_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    await connection.execute(`
      CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'auth_system'}
    `);
    
    await connection.end();
    
    const poolConnection = await pool.getConnection();
    
    await poolConnection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await poolConnection.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await poolConnection.execute(`
      CREATE TABLE IF NOT EXISTS income (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        source VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await poolConnection.execute(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        month VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_category_month (user_id, category, month),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    poolConnection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

module.exports = { pool, initDatabase };
