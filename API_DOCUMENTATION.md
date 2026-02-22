# Personal Finance Tracker - API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Authentication Routes

### POST /auth/register
Register a new user

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST /auth/login
Login user and get JWT token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

## Expense Routes

### POST /expenses
Add a new expense

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "category": "Food",
  "amount": 25.50,
  "description": "Lunch at restaurant",
  "date": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Expense added successfully",
  "data": {
    "id": 1,
    "category": "Food",
    "amount": 25.50,
    "description": "Lunch at restaurant",
    "date": "2024-01-15",
    "userId": 1
  }
}
```

### GET /expenses
Get all expenses for logged-in user

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `month` (optional): Filter by month (format: YYYY-MM)
- `category` (optional): Filter by category
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Example:** `GET /expenses?month=2024-01&category=Food&limit=10`

**Response:**
```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": 1,
        "user_id": 1,
        "category": "Food",
        "amount": 25.50,
        "description": "Lunch at restaurant",
        "date": "2024-01-15",
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "pagination": {
      "limit": 50,
      "offset": 0
    }
  }
}
```

### GET /expenses/summary
Get expense summary by category

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `month` (optional): Filter by month (format: YYYY-MM)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": [
      {
        "category": "Food",
        "count": 5,
        "total": 125.50
      }
    ],
    "grandTotal": 125.50
  }
}
```

### PUT /expenses/:id
Update an expense

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "category": "Food",
  "amount": 30.00,
  "description": "Updated lunch",
  "date": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Expense updated successfully",
  "data": {
    "id": 1,
    "category": "Food",
    "amount": 30.00,
    "description": "Updated lunch",
    "date": "2024-01-15"
  }
}
```

### DELETE /expenses/:id
Delete an expense

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

## Income Routes

### POST /income
Add new income

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "source": "Salary",
  "amount": 3000.00,
  "description": "Monthly salary",
  "date": "2024-01-31"
}
```

### GET /income
Get all income for logged-in user

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `month` (optional): Filter by month (format: YYYY-MM)
- `source` (optional): Filter by source
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

### GET /income/summary
Get income summary by source

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `month` (optional): Filter by month (format: YYYY-MM)

### PUT /income/:id
Update income entry

**Headers:** `Authorization: Bearer <token>`

### DELETE /income/:id
Delete income entry

**Headers:** `Authorization: Bearer <token>`

## Budget Routes

### POST /budgets
Set monthly budget per category

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "category": "Food",
  "amount": 500.00,
  "month": "2024-01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Budget set successfully",
  "data": {
    "id": 1,
    "category": "Food",
    "amount": 500.00,
    "month": "2024-01",
    "userId": 1
  }
}
```

### GET /budgets
Get all budgets for user

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `month` (optional): Filter by month (format: YYYY-MM)

**Response:**
```json
{
  "success": true,
  "data": {
    "budgets": [
      {
        "id": 1,
        "user_id": 1,
        "category": "Food",
        "amount": 500.00,
        "month": "2024-01",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### GET /budgets/comparison
Compare expenses vs budget

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `month` (required): Month for comparison (format: YYYY-MM)

**Response:**
```json
{
  "success": true,
  "data": {
    "month": "2024-01",
    "comparison": [
      {
        "category": "Food",
        "budget": 500.00,
        "spent": 125.50,
        "remaining": 374.50,
        "percentage": "25.10"
      }
    ],
    "summary": {
      "totalBudget": 500.00,
      "totalSpent": 125.50,
      "totalRemaining": 374.50,
      "overallPercentage": "25.10"
    }
  }
}
```

### PUT /budgets/:id
Update budget

**Headers:** `Authorization: Bearer <token>`

### DELETE /budgets/:id
Delete budget

**Headers:** `Authorization: Bearer <token>`

## Dashboard Routes

### GET /dashboard
Get dashboard data for user

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `month` (optional): Month for data (format: YYYY-MM, defaults to current month)

**Response:**
```json
{
  "success": true,
  "data": {
    "month": "2024-01",
    "totalExpenses": 125.50,
    "totalIncome": 3000.00,
    "balance": 2874.50,
    "recentExpenses": [...],
    "recentIncome": [...]
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Testing with Postman

1. **Register User:**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/register`
   - Body: JSON with name, email, password

2. **Login User:**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/login`
   - Body: JSON with email, password
   - Copy the token from response

3. **Test Protected Routes:**
   - Add Authorization header: `Bearer <your_token>`
   - Test expense, income, and budget endpoints

4. **Example Postman Collection:**
   ```json
   {
     "info": {
       "name": "Personal Finance Tracker API"
     },
     "auth": {
       "type": "bearer",
       "bearer": [
         {
           "key": "token",
           "value": "{{jwt_token}}",
           "type": "string"
         }
       ]
     }
   }
   ```

## Categories

### Expense Categories:
- Food 🍔
- Transport 🚗
- Entertainment 🎬
- Shopping 🛍️
- Bills 📄
- Healthcare 🏥
- Other 📦

### Income Sources:
- Salary 💼
- Freelance 💻
- Business 🏢
- Investment 📈
- Other 💰
