const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, pool } = require('./config/database');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expense');
const incomeRoutes = require('./routes/income');
const budgetRoutes = require('./routes/budget');
const insightsRoutes = require('./routes/insights');
const { authenticateToken } = require('./middleware/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/insights', insightsRoutes);

// Explicit file serving routes
app.get('/', (req, res) => {
  console.log('Serving dashboard.html');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Serve static assets (CSS, JS, images)
app.use('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'style.css'));
});

app.use('/dashboard.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.css'));
});

app.use('/dashboard.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.js'));
});

app.use('/auth.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth.js'));
});

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to protected route!',
    user: req.user
  });
});

app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month } = req.query;
    const currentMonth = month || new Date().toISOString().slice(0, 7);

    const [expenseTotal] = await pool.execute(
      `SELECT SUM(amount) as total FROM expenses 
       WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?`,
      [userId, currentMonth]
    );

    const [incomeTotal] = await pool.execute(
      `SELECT SUM(amount) as total FROM income 
       WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?`,
      [userId, currentMonth]
    );

    const [recentExpenses] = await pool.execute(
      `SELECT * FROM expenses 
       WHERE user_id = ? ORDER BY date DESC LIMIT 5`,
      [userId]
    );

    const [recentIncome] = await pool.execute(
      `SELECT * FROM income 
       WHERE user_id = ? ORDER BY date DESC LIMIT 5`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        month: currentMonth,
        totalExpenses: expenseTotal[0].total || 0,
        totalIncome: incomeTotal[0].total || 0,
        balance: (incomeTotal[0].total || 0) - (expenseTotal[0].total || 0),
        recentExpenses,
        recentIncome
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'dashboard.html');
  console.log('=== ROUTE DEBUG ===');
  console.log('Requested path:', req.path);
  console.log('Serving file:', filePath);
  console.log('File exists:', require('fs').existsSync(filePath));
  res.sendFile(filePath);
});

app.get('/test', (req, res) => {
  res.send('<h1>TEST ROUTE WORKING</h1>');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDatabase();
});
