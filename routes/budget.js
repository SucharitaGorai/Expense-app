const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { category, amount, month } = req.body;
    const userId = req.user.userId;

    if (!category || !amount || !month) {
      return res.status(400).json({
        success: false,
        message: 'Category, amount, and month are required'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO budgets (user_id, category, amount, month) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       amount = VALUES(amount), updated_at = CURRENT_TIMESTAMP`,
      [userId, category, amount, month]
    );

    res.status(201).json({
      success: true,
      message: 'Budget set successfully',
      data: {
        id: result.insertId || 0,
        category,
        amount,
        month,
        userId
      }
    });

  } catch (error) {
    console.error('Set budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month } = req.query;

    let query = 'SELECT * FROM budgets WHERE user_id = ?';
    let params = [userId];

    if (month) {
      query += ' AND month = ?';
      params.push(month);
    }

    query += ' ORDER BY category';

    const [budgets] = await pool.execute(query, params);

    res.json({
      success: true,
      data: {
        budgets
      }
    });

  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/comparison', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Month parameter is required (format: YYYY-MM)'
      });
    }

    const [budgets] = await pool.execute(
      `SELECT category, amount as budget_amount 
       FROM budgets 
       WHERE user_id = ? AND month = ?`,
      [userId, month]
    );

    const [expenses] = await pool.execute(
      `SELECT category, SUM(amount) as expense_amount 
       FROM expenses 
       WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?
       GROUP BY category`,
      [userId, month]
    );

    const comparison = budgets.map(budget => {
      const expense = expenses.find(exp => exp.category === budget.category);
      return {
        category: budget.category,
        budget: budget.budget_amount,
        spent: expense ? expense.expense_amount : 0,
        remaining: budget.budget_amount - (expense ? expense.expense_amount : 0),
        percentage: ((expense ? expense.expense_amount : 0) / budget.budget_amount * 100).toFixed(2)
      };
    });

    const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.budget_amount), 0);
    const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.expense_amount), 0);

    res.json({
      success: true,
      data: {
        month,
        comparison,
        summary: {
          totalBudget,
          totalSpent,
          totalRemaining: totalBudget - totalSpent,
          overallPercentage: totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(2) : 0
        }
      }
    });

  } catch (error) {
    console.error('Get budget comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, month } = req.body;
    const userId = req.user.userId;

    const [existing] = await pool.execute(
      'SELECT id FROM budgets WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    const [result] = await pool.execute(
      'UPDATE budgets SET category = ?, amount = ?, month = ? WHERE id = ? AND user_id = ?',
      [category, amount, month, id, userId]
    );

    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: {
        id: parseInt(id),
        category,
        amount,
        month
      }
    });

  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [existing] = await pool.execute(
      'SELECT id FROM budgets WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    await pool.execute(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });

  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
