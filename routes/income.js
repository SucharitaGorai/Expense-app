const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { source, amount, description, date } = req.body;
    const userId = req.user.userId;

    if (!source || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Source, amount, and date are required'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO income (user_id, source, amount, description, date) VALUES (?, ?, ?, ?, ?)',
      [userId, source, amount, description, date]
    );

    res.status(201).json({
      success: true,
      message: 'Income added successfully',
      data: {
        id: result.insertId,
        source,
        amount,
        description,
        date,
        userId
      }
    });

  } catch (error) {
    console.error('Add income error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, source, startDate, endDate, search, limit = '50', offset = '0' } = req.query;

    console.log('Income API - Query params:', { month, source, startDate, endDate, search, limit, offset, userId });

    let query = 'SELECT * FROM income WHERE user_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM income WHERE user_id = ?';
    let params = [userId];
    let countParams = [userId];

    // Search filter
    if (search && search.trim()) {
      query += ' AND (description LIKE ? OR source LIKE ?)';
      countQuery += ' AND (description LIKE ? OR source LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm);
    }

    // Source filter
    if (source) {
      query += ' AND source = ?';
      countQuery += ' AND source = ?';
      params.push(source);
      countParams.push(source);
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

    console.log('Income API - Final query:', query);
    console.log('Income API - Final params:', params);

    const [income] = await pool.execute(query, params);
    const [totalResult] = await pool.execute(countQuery, countParams);

    res.json({
      success: true,
      data: income,
      total: totalResult[0].total
    });

  } catch (error) {
    console.error('Income API - Database error:', error);
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
        source,
        COUNT(*) as count,
        SUM(amount) as total
      FROM income 
      WHERE user_id = ?
    `;
    let params = [userId];

    if (month) {
      query += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
      params.push(month);
    }

    query += ' GROUP BY source ORDER BY total DESC';

    const [summary] = await pool.execute(query, params);

    const [totalResult] = await pool.execute(
      `SELECT SUM(amount) as grandTotal 
       FROM income 
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
    console.error('Get income summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { source, amount, description, date } = req.body;
    const userId = req.user.userId;

    const [existing] = await pool.execute(
      'SELECT id FROM income WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    const [result] = await pool.execute(
      'UPDATE income SET source = ?, amount = ?, description = ?, date = ? WHERE id = ? AND user_id = ?',
      [source, amount, description, date, id, userId]
    );

    res.json({
      success: true,
      message: 'Income updated successfully',
      data: {
        id: parseInt(id),
        source,
        amount,
        description,
        date
      }
    });

  } catch (error) {
    console.error('Update income error:', error);
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
      'SELECT id FROM income WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    await pool.execute(
      'DELETE FROM income WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Income deleted successfully'
    });

  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
