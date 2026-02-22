# 🏦 Personal Finance Tracker

A comprehensive web-based personal finance management application with AI-powered insights, budget tracking, and financial health scoring.

## ✨ Features

### 🔐 **Authentication System**
- **Email Validation** (real-time format and domain checking)
- **Secure Password** hashing with bcrypt
- **JWT-based Authentication** with session management
- **No Email Verification** - instant access after registration

### 💰 **Financial Management**
- **Income & Expense Tracking** with categorization
- **Dynamic Budget Setting** with visual progress indicators
- **Transaction History** with advanced filtering and search
- **Real-time Calculations** and data updates

### 🤖 **AI-Powered Insights**
- **Financial Health Score** (0-100) with detailed breakdown
- **Smart Spending Analysis** with month-over-month comparisons
- **Trend Detection** and anomaly identification
- **Personalized Recommendations** based on spending patterns

### 📊 **Dashboard & Analytics**
- **Interactive Charts** using Chart.js
- **Glassmorphism UI** with modern design
- **Responsive Layout** for all devices
- **Real-time Data Visualization**

## 🚀 Live Demo

**🌐 URL:** https://myfinance789.loca.lt

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MySQL** database with optimized queries
- **JWT** for authentication
- **bcrypt** for password hashing

### Frontend
- **HTML5** with semantic markup
- **CSS3** with glassmorphism effects
- **Vanilla JavaScript** (ES6+)
- **Chart.js** for data visualization
- **Responsive Design** with mobile-first approach

### Security
- **Input Validation** (client & server-side)
- **SQL Injection Prevention** with parameterized queries
- **Password Strength Requirements**
- **Email Domain Validation**
- **JWT Token Security**

## 📋 Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/SucharitaGorai/Expense-Tracker.git
   cd Expense-Tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```sql
   CREATE DATABASE auth_system;
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials:
   ```env
   PORT=3001
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=auth_system
   JWT_SECRET=your_jwt_secret_key_here
   ```

5. **Start the application**
   ```bash
   node server.js
   ```

6. **Access the application**
   - Local: http://localhost:3001
   - Login: http://localhost:3001/login
   - Register: http://localhost:3001/register

## 📁 Project Structure

```
Expense-Tracker/
├── 📄 server.js              # Main server file
├── 📁 config/
│   └── 📄 database.js         # Database configuration
├── 📁 routes/
│   ├── 📄 auth.js             # Authentication routes
│   ├── 📄 expenses.js         # Expense management
│   ├── 📄 income.js           # Income management
│   ├── 📄 budgets.js          # Budget management
│   └── 📄 insights.js         # AI insights & health score
├── 📁 public/
│   ├── 📄 index.html          # Main dashboard
│   ├── 📄 login.html          # Login page
│   ├── 📄 register.html       # Registration page
│   ├── 📄 dashboard.html      # Financial dashboard
│   ├── 📄 auth.js             # Frontend authentication
│   ├── 📄 dashboard.js        # Dashboard functionality
│   ├── 📄 style.css           # Styling
│   └── 📄 dashboard.css       # Dashboard styling
├── 📄 package.json            # Dependencies
├── 📄 .gitignore             # Git ignore rules
└── 📄 README.md              # This file
```

## 🔐 Security Features

### Email Validation
- **Real-time Format Checking** with regex validation
- **Domain Whitelisting** (gmail.com, yahoo.com, outlook.com, etc.)
- **Client & Server-side Validation**

### Password Security
- **Minimum 8 characters** with complexity requirements
- **Uppercase, lowercase, and number requirements**
- **bcrypt hashing** with 10 salt rounds

### API Security
- **JWT Authentication** with 24-hour expiration
- **Protected Routes** with middleware
- **Input Sanitization** and validation

## 📊 Financial Health Score

The application calculates a comprehensive financial health score based on:

- **Savings Rate** (40% weight)
- **Expense Growth** (30% weight) 
- **Income Stability** (30% weight)

**Score Categories:**
- 🟢 **Excellent** (85-100)
- 🔵 **Good** (70-84)
- 🟡 **Fair** (55-69)
- 🟠 **Poor** (40-54)
- 🔴 **Critical** (0-39)

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Protected route

### Financial Data
- `GET /api/expenses` - Get user expenses
- `POST /api/expenses` - Add expense
- `GET /api/income` - Get user income
- `POST /api/income` - Add income
- `GET /api/budgets` - Get budgets
- `POST /api/budgets` - Set budget
- `GET /api/insights` - AI insights & health score

## 📱 Features in Detail

### Registration & Login
- **Instant Registration** - no email verification required
- **Email Validation** - format and domain checking
- **Strong Password Requirements** - enhanced security
- **JWT Sessions** - secure authentication

### Dashboard
- **Financial Overview** - income, expenses, savings
- **Budget Progress** - visual progress bars
- **Transaction History** - detailed records
- **AI Insights** - spending patterns and recommendations

### Budget Management
- **Category-wise Budgets** - Food, Transport, Entertainment, etc.
- **Progress Tracking** - visual indicators
- **Alert System** - budget warnings
- **Historical Analysis** - spending trends

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Chart.js** for beautiful data visualization
- **Express.js** for robust backend framework
- **MySQL** for reliable database management
- **bcrypt** for secure password hashing

## 📞 Contact

**Developer:** Sucharita Gorai  
**GitHub:** @SucharitaGorai  
**Project:** Personal Finance Tracker

---

**⭐ Star this repository if it helped you!**
