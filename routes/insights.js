const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Calculate Financial Health Score
const calculateFinancialHealthScore = (
  currentTotalIncome, 
  currentTotalExpenses, 
  previousTotalExpenses, 
  previousTotalIncome,
  currentMonthIncome,
  previousMonthIncome
) => {
  let score = 0;
  let factors = [];

  // 1. Savings Rate (40 points)
  const currentSavings = currentTotalIncome - currentTotalExpenses;
  const savingsRate = currentTotalIncome > 0 ? (currentSavings / currentTotalIncome) * 100 : 0;
  
  if (savingsRate >= 20) {
    score += 40;
    factors.push('Savings Rate: Excellent (20%+)');
  } else if (savingsRate >= 10) {
    score += 30;
    factors.push('Savings Rate: Good (10-19%)');
  } else if (savingsRate >= 5) {
    score += 20;
    factors.push('Savings Rate: Fair (5-9%)');
  } else if (savingsRate >= 0) {
    score += 10;
    factors.push('Savings Rate: Poor (0-4%)');
  } else {
    score += 0;
    factors.push('Savings Rate: Critical (Negative)');
  }

  // 2. Expense Growth (30 points)
  let expenseGrowthScore = 15; // Start with neutral
  if (previousTotalExpenses > 0) {
    const expenseGrowthRate = ((currentTotalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100;
    
    if (expenseGrowthRate <= -10) {
      expenseGrowthScore = 30;
      factors.push('Expense Growth: Excellent (Decreasing 10%+)');
    } else if (expenseGrowthRate <= 0) {
      expenseGrowthScore = 25;
      factors.push('Expense Growth: Good (Stable/Decreasing)');
    } else if (expenseGrowthRate <= 10) {
      expenseGrowthScore = 15;
      factors.push('Expense Growth: Fair (Moderate increase)');
    } else if (expenseGrowthRate <= 25) {
      expenseGrowthScore = 5;
      factors.push('Expense Growth: Poor (High increase)');
    } else {
      expenseGrowthScore = 0;
      factors.push('Expense Growth: Critical (Very high increase)');
    }
  } else {
    expenseGrowthScore = 20;
    factors.push('Expense Growth: Good (No previous data)');
  }
  
  score += expenseGrowthScore;

  // 3. Income Stability (30 points)
  let incomeStabilityScore = 15; // Start with neutral
  
  if (previousTotalIncome > 0 && currentTotalIncome > 0) {
    const incomeGrowthRate = ((currentTotalIncome - previousTotalIncome) / previousTotalIncome) * 100;
    const incomeSourceCount = currentMonthIncome.length;
    
    if (incomeGrowthRate >= -5 && incomeGrowthRate <= 10 && incomeSourceCount >= 2) {
      incomeStabilityScore = 30;
      factors.push('Income Stability: Excellent (Stable with multiple sources)');
    } else if (incomeGrowthRate >= -10 && incomeGrowthRate <= 15 && incomeSourceCount >= 1) {
      incomeStabilityScore = 25;
      factors.push('Income Stability: Good (Reasonably stable)');
    } else if (incomeGrowthRate >= -20 && incomeGrowthRate <= 25) {
      incomeStabilityScore = 15;
      factors.push('Income Stability: Fair (Volatile but positive)');
    } else {
      incomeStabilityScore = 5;
      factors.push('Income Stability: Poor (Highly volatile)');
    }
  } else if (currentTotalIncome > 0) {
    incomeStabilityScore = 20;
    factors.push('Income Stability: Fair (Limited history)');
  } else {
    incomeStabilityScore = 0;
    factors.push('Income Stability: Critical (No income)');
  }
  
  score += incomeStabilityScore;

  // Determine rating
  let rating = 'Critical';
  if (score >= 85) rating = 'Excellent';
  else if (score >= 70) rating = 'Good';
  else if (score >= 55) rating = 'Fair';
  else if (score >= 40) rating = 'Poor';

  return {
    score: Math.min(100, Math.max(0, score)),
    rating,
    factors,
    breakdown: {
      savingsRate: Math.round(savingsRate * 10) / 10,
      expenseGrowth: previousTotalExpenses > 0 ? Math.round(((currentTotalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100 * 10) / 10 : 0,
      incomeStability: incomeStabilityScore
    }
  };
};

// Get AI-powered expense insights
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calculate previous month
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Get current month expenses by category
    const [currentMonthExpenses] = await pool.execute(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM expenses 
      WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
      GROUP BY category
      ORDER BY total DESC
    `, [userId, currentMonth + 1, currentYear]);
    
    // Get previous month expenses by category
    const [previousMonthExpenses] = await pool.execute(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM expenses 
      WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
      GROUP BY category
      ORDER BY total DESC
    `, [userId, previousMonth + 1, previousYear]);
    
    // Get current month income by source
    const [currentMonthIncome] = await pool.execute(`
      SELECT source, SUM(amount) as total, COUNT(*) as count
      FROM income 
      WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
      GROUP BY source
      ORDER BY total DESC
    `, [userId, currentMonth + 1, currentYear]);
    
    // Get previous month income by source
    const [previousMonthIncome] = await pool.execute(`
      SELECT source, SUM(amount) as total, COUNT(*) as count
      FROM income 
      WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
      GROUP BY source
      ORDER BY total DESC
    `, [userId, previousMonth + 1, previousYear]);
    
    // Calculate totals
    const currentTotalExpenses = currentMonthExpenses.reduce((sum, item) => sum + parseFloat(item.total), 0);
    const previousTotalExpenses = previousMonthExpenses.reduce((sum, item) => sum + parseFloat(item.total), 0);
    const currentTotalIncome = currentMonthIncome.reduce((sum, item) => sum + parseFloat(item.total), 0);
    const previousTotalIncome = previousMonthIncome.reduce((sum, item) => sum + parseFloat(item.total), 0);
    
    const currentSavings = currentTotalIncome - currentTotalExpenses;
    const previousSavings = previousTotalIncome - previousTotalExpenses;
    
    // Generate insights
    const insights = [];
    
    // If no data for both months, return empty insights with health score
    if (currentMonthExpenses.length === 0 && currentMonthIncome.length === 0 && 
        previousMonthExpenses.length === 0 && previousMonthIncome.length === 0) {
      
      const healthScore = calculateFinancialHealthScore(
        0, 0, 0, 0, [], []
      );
      
      return res.json({
        success: true,
        data: {
          insights: [],
          healthScore: healthScore,
          summary: {
            currentMonth: {
              totalExpenses: 0,
              totalIncome: 0,
              savings: 0,
              expensesByCategory: [],
              incomeBySource: []
            },
            previousMonth: {
              totalExpenses: 0,
              totalIncome: 0,
              savings: 0,
              expensesByCategory: [],
              incomeBySource: []
            },
            period: {
              current: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
              previous: `${previousYear}-${String(previousMonth + 1).padStart(2, '0')}`
            }
          }
        }
      });
    }
    
    // Expense category insights
    const previousExpensesByCategory = {};
    previousMonthExpenses.forEach(item => {
      previousExpensesByCategory[item.category] = parseFloat(item.total);
    });
    
    currentMonthExpenses.forEach(item => {
      const currentAmount = parseFloat(item.total);
      const previousAmount = previousExpensesByCategory[item.category] || 0;
      
      if (previousAmount > 0) {
        const changePercent = ((currentAmount - previousAmount) / previousAmount) * 100;
        
        if (changePercent > 15) {
          insights.push({
            type: 'warning',
            title: 'Spending Alert',
            message: `You spent ${Math.abs(Math.round(changePercent))}% more on ${item.category} this month.`,
            category: item.category,
            changePercent: Math.round(changePercent),
            currentAmount,
            previousAmount
          });
        } else if (changePercent < -15) {
          insights.push({
            type: 'success',
            title: 'Great Job!',
            message: `You spent ${Math.abs(Math.round(changePercent))}% less on ${item.category} this month.`,
            category: item.category,
            changePercent: Math.round(changePercent),
            currentAmount,
            previousAmount
          });
        }
      } else if (currentAmount > 500) {
        insights.push({
          type: 'info',
          title: 'New Spending Category',
          message: `You spent ₹${currentAmount.toFixed(2)} on ${item.category} this month.`,
          category: item.category,
          currentAmount,
          previousAmount: 0
        });
      }
    });
    
    // Income insights
    const previousIncomeBySource = {};
    previousMonthIncome.forEach(item => {
      previousIncomeBySource[item.source] = parseFloat(item.total);
    });
    
    currentMonthIncome.forEach(item => {
      const currentAmount = parseFloat(item.total);
      const previousAmount = previousIncomeBySource[item.source] || 0;
      
      if (previousAmount > 0) {
        const changePercent = ((currentAmount - previousAmount) / previousAmount) * 100;
        const changeAmount = currentAmount - previousAmount;
        
        if (changePercent > 10 && changeAmount > 1000) {
          insights.push({
            type: 'success',
            title: 'Income Growth',
            message: `${item.source} income increased by ₹${changeAmount.toFixed(0)} this month.`,
            source: item.source,
            changePercent: Math.round(changePercent),
            currentAmount,
            previousAmount,
            changeAmount
          });
        }
      } else if (currentAmount > 5000) {
        insights.push({
          type: 'success',
          title: 'New Income Source',
          message: `${item.source} income of ₹${currentAmount.toFixed(2)} this month.`,
          source: item.source,
          currentAmount,
          previousAmount: 0
        });
      }
    });
    
    // Savings insights
    if (previousSavings > 0 && currentSavings > 0) {
      const savingsChangePercent = ((currentSavings - previousSavings) / previousSavings) * 100;
      const savingsChange = currentSavings - previousSavings;
      
      if (savingsChangePercent < -20) {
        insights.push({
          type: 'warning',
          title: 'Savings Alert',
          message: `Your savings dropped by ${Math.abs(Math.round(savingsChangePercent))}% compared to last month.`,
          currentSavings,
          previousSavings,
          savingsChange: Math.abs(savingsChange),
          savingsChangePercent: Math.round(savingsChangePercent)
        });
      } else if (savingsChangePercent > 20) {
        insights.push({
          type: 'success',
          title: 'Savings Achievement',
          message: `Your savings increased by ${Math.round(savingsChangePercent)}% compared to last month!`,
          currentSavings,
          previousSavings,
          savingsChange,
          savingsChangePercent: Math.round(savingsChangePercent)
        });
      }
    } else if (previousSavings > 0 && currentSavings <= 0) {
      insights.push({
        type: 'warning',
        title: 'Budget Alert',
        message: `You spent more than you earned this month. Consider reviewing your expenses.`,
        currentSavings,
        previousSavings,
        savingsChange: Math.abs(currentSavings - previousSavings)
      });
    }
    
    // Top spending category insight
    if (currentMonthExpenses.length > 0) {
      const topCategory = currentMonthExpenses[0];
      const totalExpensesPercent = (topCategory.total / currentTotalExpenses) * 100;
      
      if (totalExpensesPercent > 40) {
        insights.push({
          type: 'info',
          title: 'Top Spending Category',
          message: `${topCategory.category} accounts for ${Math.round(totalExpensesPercent)}% of your monthly expenses.`,
          category: topCategory.category,
          amount: parseFloat(topCategory.total),
          percentage: Math.round(totalExpensesPercent)
        });
      }
    }
    
    // Sort insights by importance (warnings first, then success, then info)
    insights.sort((a, b) => {
      const priority = { warning: 0, success: 1, info: 2 };
      return priority[a.type] - priority[b.type];
    });
    
    // Calculate Financial Health Score
    const healthScore = calculateFinancialHealthScore(
      currentTotalIncome, 
      currentTotalExpenses, 
      previousTotalExpenses, 
      previousTotalIncome,
      currentMonthIncome,
      previousMonthIncome
    );
    
    // Limit to top 5 insights
    const topInsights = insights.slice(0, 5);
    
    res.json({
      success: true,
      data: {
        insights: topInsights,
        healthScore: healthScore,
        summary: {
          currentMonth: {
            totalExpenses: currentTotalExpenses,
            totalIncome: currentTotalIncome,
            savings: currentSavings,
            expensesByCategory: currentMonthExpenses,
            incomeBySource: currentMonthIncome
          },
          previousMonth: {
            totalExpenses: previousTotalExpenses,
            totalIncome: previousTotalIncome,
            savings: previousSavings,
            expensesByCategory: previousMonthExpenses,
            incomeBySource: previousMonthIncome
          },
          period: {
            current: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
            previous: `${previousYear}-${String(previousMonth + 1).padStart(2, '0')}`
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights'
    });
  }
});

module.exports = router;
