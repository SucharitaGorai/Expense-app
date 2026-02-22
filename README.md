Personal Finance Tracker – Assignment Submission
Submitted By: Sucharita Gorai
Position Applied For: Software Development Apprentice/Trainee (Tech)
Date: 23rd February 2026
________________________________________

1. Project Overview
The Personal Finance Tracker is a full-stack web application designed to help users manage their personal finances efficiently. The application allows users to securely track income, record expenses, set category-wise budgets, and monitor their financial performance through visual indicators and structured reports.
The primary goal of the system is to provide users with clarity and control over their financial data, enabling better decision-making through organized tracking and meaningful comparisons.
This project demonstrates full-stack development skills including backend API design, authentication implementation, relational database modeling, and frontend user interface development.
________________________________________
2. Objectives
The main objectives of the application are:
•	Implement secure user authentication
•	Allow structured income and expense tracking
•	Enable monthly budget setting per category
•	Provide real-time budget monitoring
•	Display complete transaction history with filtering options
•	Maintain secure and scalable architecture
•	Export financial reports as PDF

________________________________________


3. Technology Stack
 Layer	    Technology Used
Frontend	HTML5, CSS3, JavaScript (ES6)
Backend	Node.js + Express.js
Database	MySQL
Authentication	JWT + bcrypt
Data Visualization	Chart.js
Environment  Config	dotenv


Why This Stack
Node.js + Express
•	Efficient for building REST APIs
•	Non-blocking architecture
•	Single language across frontend and backend
MySQL
•	Structured relational database
•	ACID compliance for financial data integrity
•	Efficient aggregation queries
JWT + bcrypt
•	Secure password hashing
•	Stateless authentication
•	Industry-standard security practice
________________________________________
4. System Architecture
The application follows a three-layer architecture:
User → Frontend → Backend API → MySQL Database
Request Flow
1.	User logs in via frontend.
2.	Backend verifies credentials using bcrypt.
3.	JWT token is generated and returned.
4.	Frontend stores token securely.
5.	Protected API routes validate JWT before processing requests.
6.	Backend interacts with MySQL database using parameterized queries.
7.	Response is returned to frontend and UI updates dynamically.
This structure ensures separation of concerns and scalability.
________________________________________
5. Core Features Implemented
5.1 User Registration & Authentication
• Email format validation using regular expressions
• Unique email check to prevent duplicate accounts
• Password hashing using bcrypt (10 salt rounds)
• JWT-based authentication
• Protected API routes using middleware
• Server-side input validation to prevent invalid data submission
This ensures secure access and data protection.
    
________________________________________

5.2 Expense Tracking
•	Add expenses with amount, category, date, description
•	Edit existing expenses
•	Delete expenses
•	View categorized expense records
Categories include:
•	Food
•	Transport
•	Entertainment
•	Healthcare
•	Education
•	Others   
 
                        
________________________________________
5.3 Income Management
•	Add multiple income sources
•	Specify frequency (monthly, weekly, yearly)
•	Edit and delete income entries
•	View total income calculations dynamically
The system aggregates income data for dashboard summaries.
 
 
________________________________________
5.4 Budget Setting and Monitoring
Users can set monthly budgets per category.
Budget Calculation Logic:
Budget Usage (%) = (Current Category Expense / Budget Limit) × 100
Color Indicators:
•	Green → Below 75%
•	Red → Above 90%
This allows users to visually understand their spending behavior.
 
________________________________________
5.5 Transaction History
The transaction history module provides:
•	Combined listing of income and expenses
•	Sorting by date
•	Filtering by category
•	Search functionality
•	Pagination for performance
This improves usability and financial transparency.

_

6. Database Design
The system uses a normalized relational database structure.
Users Table
•	id (Primary Key)
•	name
•	email (Unique)
•	password
•	created_at
 
Expenses Table
•	id (Primary Key)
•	user_id (Foreign Key)
•	category
•	amount
•	description
•	date
•	created_at
 
Income Table
•	id (Primary Key)
•	user_id (Foreign Key)
•	source
•	amount
•	frequency
•	date
•	created_at
 
Budgets Table
•	id (Primary Key)
•	user_id (Foreign Key)
•	category
•	limit_amount
•	month
•	year
 
Database Benefits
•	Data integrity through foreign keys
•	Efficient queries using indexing
•	Structured financial aggregation
•	Prevention of orphan records
________________________________________
7. Security Measures Implemented
Password Security
Passwords are hashed using bcrypt before storing in database.
This prevents exposure of raw passwords even if database is compromised.
________________________________________
JWT Authentication
•	Token generated after successful login
•	Stored on client-side
•	Middleware verifies token before allowing protected access
•	Expiration time configured
________________________________________
SQL Injection Prevention
All database queries use parameterized queries.
This prevents malicious SQL injection attacks.
________________________________________
Input Validation
Server-side validation ensures:
•	Required fields are not empty
•	Amounts are numeric and positive
•	Dates are valid
•	User ownership is verified before updates
________________________________________
Environment Security
Sensitive credentials are stored in .env file:
•	Database password
•	JWT secret
This avoids exposing secrets in source code.

________________________________________






8.	Key Logic Implementations
Month-over-Month Expense Comparison
To calculate percentage increase:
Increase (%) =((Current Month – Previous Month) / Previous Month) × 100
This helps detect significant spending growth.
________________________________________
Dashboard Aggregation
The dashboard dynamically calculates:
•	Total income
•	Total expenses
•	Net savings
•	Category-wise spending
•	Budget usage percentage
All calculations are derived from real-time database queries.

________________________________________
9. Challenges Faced & Solutions
Challenge 1: Handling JWT Expiry
Users could access protected routes after token expiration.
Solution: Implemented middleware validation and automatic logout on invalid token.
________________________________________
Challenge 2: Budget Aggregation Queries
Complex SQL joins were required to match budgets with monthly expenses.
Solution: Optimized LEFT JOIN queries and grouped by category.
________________________________________
Challenge 3: Data Consistency
Ensuring dashboard totals matched transaction history.
Solution: Centralized data fetching and synchronized date filtering.
________________________________________
10. Future Enhancements
       • Recurring automated transactions
       • Mobile-responsive enhancement
       • Cloud deployment (AWS / Render)
       • Advanced analytics dashboard
       • Multi-user shared budgets
       • Token-based email verification using verification links
       • Password reset functionality via secure email workflow
________________________________________
11. How to Run the Project
Prerequisites:
•	Node.js (v14+)
•	MySQL Server
•	Git
Steps:
1.	Clone repository
2.	Run npm install
3.	Configure .env file
4.	Create MySQL database
5.	Run npm start
6.	Open http://localhost:3001
________________________________________
12. Conclusion
The Personal Finance Tracker is a complete full-stack application that demonstrates practical understanding of:
•	RESTful API development
•	Secure authentication mechanisms
•	Relational database modeling
•	Financial data aggregation
•	Responsive frontend design
•	Security best practices
This project reflects the ability to translate functional requirements into a structured, secure, and scalable software solution.
The application is fully functional and demonstrates strong foundational knowledge in backend development, database design, and system architecture.
________________________________________

Project Status : Complete
