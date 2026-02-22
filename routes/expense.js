const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    const userId = req.user.userId;

    if (!category || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Category, amount, and date are required'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO expenses (user_id, category, amount, description, date) VALUES (?, ?, ?, ?, ?)',
      [userId, category, amount, description, date]
    );

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: {
        id: result.insertId,
        category,
        amount,
        description,
        date,
        userId
      }
    });

  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, category, startDate, endDate, search, limit = '50', offset = '0' } = req.query;

    console.log('Expenses API - Query params:', { month, category, startDate, endDate, search, limit, offset, userId });

    let query = 'SELECT * FROM expenses WHERE user_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM expenses WHERE user_id = ?';
    let params = [userId];
    let countParams = [userId];

    // Search filter
    if (search && search.trim()) {
      query += ' AND (description LIKE ? OR category LIKE ?)';
      countQuery += ' AND (description LIKE ? OR category LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm);
    }

    // Category filter
    if (category) {
      query += ' AND category = ?';
      countQuery += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }

    // Date range filter
    if (startDate && endDate && startDate.trim() && endDate.trim()) {
      query += ' AND date BETWEEN ? AND ?';
      countQuery += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
      countParams.push(startDate, endDate);
    } else if (month) {
      query += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
      countQuery += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
      params.push(month);
      countParams.push(month);
    }

    query += ' ORDER BY date DESC';
    // Temporarily remove LIMIT/OFFSET to isolate the issue
    // const limitNum = parseInt(limit) || 50;
    // const offsetNum = parseInt(offset) || 0;
    // params.push(limitNum, offsetNum);

    console.log('Expenses API - Final query:', query);
    console.log('Expenses API - Final params:', params);

    const [expenses] = await pool.execute(query, params);
    const [totalResult] = await pool.execute(countQuery, countParams);

    res.json({
      success: true,
      data: expenses,
      total: totalResult[0].total
    });

  } catch (error) {
    console.error('Expenses API - Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month } = req.query;

    let query = `
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total
      FROM expenses 
      WHERE user_id = ?
    `;
    let params = [userId];

    if (month) {
      query += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
      params.push(month);
    }

    query += ' GROUP BY category ORDER BY total DESC';

    const [summary] = await pool.execute(query, params);

    const [totalResult] = await pool.execute(
      `SELECT SUM(amount) as grandTotal 
       FROM expenses 
       WHERE user_id = ? ${month ? 'AND DATE_FORMAT(date, "%Y-%m") = ?' : ''}`,
      month ? [userId, month] : [userId]
    );

    res.json({
      success: true,
      data: {
        summary,
        grandTotal: totalResult[0].grandTotal || 0
      }
    });

  } catch (error) {
    console.error('Get expense summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, description, date } = req.body;
    const userId = req.user.userId;

    const [existing] = await pool.execute(
      'SELECT id FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    const [result] = await pool.execute(
      'UPDATE expenses SET category = ?, amount = ?, description = ?, date = ? WHERE id = ? AND user_id = ?',
      [category, amount, description, date, id, userId]
    );

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: {
        id: parseInt(id),
        category,
        amount,
        description,
        date
      }
    });

  } catch (error) {
    console.error('Update expense error:', error);
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
      'SELECT id FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    await pool.execute(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
