class Dashboard {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        this.currentMonth = new Date().toISOString().slice(0, 7);
        
        // Transaction history properties
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.totalPages = 1;
        this.allTransactions = [];
        this.filteredTransactions = [];
        
        this.init();
    }

    init() {
        if (!this.token) {
            window.location.href = '/login';
            return;
        }

        this.setupEventListeners();
        this.loadUserData();
        this.loadDashboardData();
    }

    setupEventListeners() {
        document.getElementById('userName').textContent = this.user.name;
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        });

        document.getElementById('monthSelect').value = this.currentMonth;
        document.getElementById('monthSelect').addEventListener('change', (e) => {
            this.currentMonth = e.target.value;
            this.loadDashboardData();
        });

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        document.getElementById('addExpenseBtn').addEventListener('click', () => {
            this.openModal('expenseModal');
        });

        document.getElementById('addIncomeBtn').addEventListener('click', () => {
            this.openModal('incomeModal');
        });

        document.getElementById('addBudgetBtn').addEventListener('click', () => {
            this.openModal('budgetModal');
            document.getElementById('budgetMonth').value = this.currentMonth;
        });

        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        document.getElementById('incomeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addIncome();
        });

        document.getElementById('budgetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.setBudget();
        });

        // Insights event listeners
        document.getElementById('refreshInsights').addEventListener('click', () => {
            this.refreshInsights();
        });

        // Transaction history event listeners
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Add real-time search
        document.getElementById('transactionSearch').addEventListener('input', () => {
            this.applyFilters();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportTransactions();
        });

        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTransactions();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.renderTransactions();
            }
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
    }

    switchSection(sectionName) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        document.getElementById(sectionName).classList.add('active');

        if (sectionName === 'expenses') {
            this.loadExpenses();
        } else if (sectionName === 'income') {
            this.loadIncome();
        } else if (sectionName === 'budgets') {
            this.loadBudgets();
        } else if (sectionName === 'transactions') {
            this.loadTransactions();
        } else if (sectionName === 'insights') {
            this.loadInsights();
        }
    }

    async loadUserData() {
        try {
            console.log('Loading user data with token:', this.token ? 'Token exists' : 'No token');
            const response = await fetch('/api/dashboard', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            console.log('Dashboard API response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Dashboard data received:', data);
                this.updateDashboard(data.data);
            } else {
                const errorData = await response.json();
                console.error('Dashboard API error:', errorData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async loadDashboardData() {
        try {
            console.log('Loading dashboard data for month:', this.currentMonth);
            const response = await fetch(`/api/dashboard?month=${this.currentMonth}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            console.log('Dashboard API response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Dashboard data received:', data);
                this.updateDashboard(data.data);
            } else {
                const errorData = await response.json();
                console.error('Dashboard API error:', errorData);
                this.showMessage(errorData.message || 'Failed to load dashboard data', 'error');
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    updateDashboard(data) {
        console.log('Updating dashboard with data:', data);
        console.log('Total Income:', data.totalIncome);
        console.log('Total Expenses:', data.totalExpenses);
        console.log('Balance:', data.balance);
        
        // Convert strings to numbers
        const totalIncome = parseFloat(data.totalIncome) || 0;
        const totalExpenses = parseFloat(data.totalExpenses) || 0;
        const balance = parseFloat(data.balance) || 0;
        
        document.getElementById('totalIncome').textContent = `₹${totalIncome.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toFixed(2)}`;
        document.getElementById('balance').textContent = `₹${balance.toFixed(2)}`;

        console.log('DOM elements updated');
        this.updateRecentTransactions(data.recentExpenses, 'recentExpenses', 'expense');
        this.updateRecentTransactions(data.recentIncome, 'recentIncome', 'income');
    }

    updateRecentTransactions(transactions, containerId, type) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (transactions.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center;">No recent transactions</p>';
            return;
        }

        transactions.forEach(transaction => {
            const item = document.createElement('div');
            item.className = `transaction-item ${type}`;
            item.innerHTML = `
                <div class="transaction-content">
                    <div class="transaction-category">${transaction.category || transaction.source}</div>
                    ${transaction.description ? `<div class="transaction-description">${transaction.description}</div>` : ''}
                </div>
                <div class="transaction-meta">
                    <div class="transaction-amount ${type}">₹${parseFloat(transaction.amount).toFixed(2)}</div>
                    <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div class="transaction-actions">
                    <button class="btn-delete" onclick="dashboard.deleteTransaction('${transaction.type}', ${transaction.id})">Delete</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    async loadExpenses() {
        try {
            const response = await fetch(`/api/expenses?month=${this.currentMonth}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayExpenses(data.data.expenses);
            }
        } catch (error) {
            console.error('Error loading expenses:', error);
        }
    }

    displayExpenses(expenses) {
        const container = document.getElementById('expensesList');
        container.innerHTML = '';

        if (expenses.length === 0) {
            container.innerHTML = '<div class="data-item"><p style="color: #666;">No expenses found</p></div>';
            return;
        }

        expenses.forEach(expense => {
            const item = document.createElement('div');
            item.className = 'data-item';
            item.innerHTML = `
                <div class="data-info">
                    <div class="data-category">${expense.category}</div>
                    <div class="data-description">${expense.description || 'No description'}</div>
                    <div class="transaction-date">${new Date(expense.date).toLocaleDateString()}</div>
                </div>
                <div class="data-amount expense">₹${expense.amount.toFixed(2)}</div>
                <div class="data-actions">
                    <button class="btn-edit" onclick="dashboard.editExpense(${expense.id})">Edit</button>
                    <button class="btn-delete" onclick="dashboard.deleteExpense(${expense.id})">Delete</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    async loadIncome() {
        try {
            const response = await fetch(`/api/income?month=${this.currentMonth}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayIncome(data.data.income);
            }
        } catch (error) {
            console.error('Error loading income:', error);
        }
    }

    displayIncome(income) {
        const container = document.getElementById('incomeList');
        container.innerHTML = '';

        if (income.length === 0) {
            container.innerHTML = '<div class="data-item"><p style="color: #666;">No income found</p></div>';
            return;
        }

        income.forEach(item => {
            const incomeItem = document.createElement('div');
            incomeItem.className = 'data-item';
            incomeItem.innerHTML = `
                <div class="data-info">
                    <div class="data-category">${item.source}</div>
                    <div class="data-description">${item.description || 'No description'}</div>
                    <div class="transaction-date">${new Date(item.date).toLocaleDateString()}</div>
                </div>
                <div class="data-amount income">₹${item.amount.toFixed(2)}</div>
                <div class="data-actions">
                    <button class="btn-edit" onclick="dashboard.editIncome(${item.id})">Edit</button>
                    <button class="btn-delete" onclick="dashboard.deleteIncome(${item.id})">Delete</button>
                </div>
            `;
            container.appendChild(incomeItem);
        });
    }

    async loadBudgets() {
        try {
            const response = await fetch(`/api/budgets/comparison?month=${this.currentMonth}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayBudgets(data.data.comparison);
            }
        } catch (error) {
            console.error('Error loading budgets:', error);
        }
    }

    displayBudgets(budgets) {
        const container = document.getElementById('budgetsList');
        container.innerHTML = '';

        if (budgets.length === 0) {
            container.innerHTML = '<div class="budget-item"><p style="color: #666;">No budgets set</p></div>';
            return;
        }

        budgets.forEach(budget => {
            const item = document.createElement('div');
            item.className = 'budget-item';
            
            const percentage = parseFloat(budget.percentage);
            const progressClass = percentage < 70 ? 'low' : percentage < 90 ? 'medium' : 'high';
            
            item.innerHTML = `
                <div class="budget-info">
                    <div class="budget-category">${budget.category}</div>
                    <div class="budget-description">Budget: ₹${parseFloat(budget.budget).toFixed(2)} | Spent: ₹${parseFloat(budget.spent).toFixed(2)}</div>
                </div>
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="progress-text">${percentage}% used</div>
                </div>
                <div class="budget-actions">
                    <button class="btn-edit" onclick="dashboard.editBudget(${budget.id})">Edit</button>
                    <button class="btn-delete" onclick="dashboard.deleteBudget(${budget.id})">Delete</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    async addExpense() {
        const formData = new FormData(document.getElementById('expenseForm'));
        const data = {
            category: formData.get('category') || document.getElementById('expenseCategory').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            description: document.getElementById('expenseDescription').value,
            date: document.getElementById('expenseDate').value
        };

        try {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showMessage('Expense added successfully', 'success');
                this.closeModal(document.getElementById('expenseModal'));
                this.loadDashboardData();
                if (document.getElementById('expenses').classList.contains('active')) {
                    this.loadExpenses();
                }
                document.getElementById('expenseForm').reset();
                document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to add expense', 'error');
            }
        } catch (error) {
            console.error('Error adding expense:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    async addIncome() {
        const data = {
            source: document.getElementById('incomeSource').value,
            amount: parseFloat(document.getElementById('incomeAmount').value),
            description: document.getElementById('incomeDescription').value,
            date: document.getElementById('incomeDate').value
        };

        try {
            const response = await fetch('/api/income', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showMessage('Income added successfully', 'success');
                this.closeModal(document.getElementById('incomeModal'));
                this.loadDashboardData();
                if (document.getElementById('income').classList.contains('active')) {
                    this.loadIncome();
                }
                document.getElementById('incomeForm').reset();
                document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to add income', 'error');
            }
        } catch (error) {
            console.error('Error adding income:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    async setBudget() {
        const data = {
            category: document.getElementById('budgetCategory').value,
            amount: parseFloat(document.getElementById('budgetAmount').value),
            month: document.getElementById('budgetMonth').value
        };

        try {
            const response = await fetch('/api/budgets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showMessage('Budget set successfully', 'success');
                this.closeModal(document.getElementById('budgetModal'));
                if (document.getElementById('budgets').classList.contains('active')) {
                    this.loadBudgets();
                }
                document.getElementById('budgetForm').reset();
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to set budget', 'error');
            }
        } catch (error) {
            console.error('Error setting budget:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    async deleteExpense(id) {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        try {
            const response = await fetch(`/api/expenses/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.showMessage('Expense deleted successfully', 'success');
                this.loadExpenses();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to delete expense', 'error');
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    async deleteIncome(id) {
        if (!confirm('Are you sure you want to delete this income?')) return;

        try {
            const response = await fetch(`/api/income/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.showMessage('Income deleted successfully', 'success');
                this.loadIncome();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to delete income', 'error');
            }
        } catch (error) {
            console.error('Error deleting income:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    // Transaction History Methods
    async loadTransactions() {
        try {
            console.log('Loading transactions...');
            
            // Get filter values
            const search = document.getElementById('transactionSearch').value;
            const dateFrom = document.getElementById('dateFrom').value;
            const dateTo = document.getElementById('dateTo').value;
            
            console.log('Current month:', this.currentMonth);
            console.log('Token exists:', !!this.token);
            console.log('Filters:', { search, dateFrom, dateTo });
            
            // Build API URLs with parameters
            let expensesUrl = '/api/expenses';
            let incomeUrl = '/api/income';
            
            const params = new URLSearchParams();
            if (search && search.trim()) params.append('search', search.trim());
            if (dateFrom && dateTo) {
                params.append('startDate', dateFrom);
                params.append('endDate', dateTo);
            }
            
            if (params.toString()) {
                expensesUrl += '?' + params.toString();
                incomeUrl += '?' + params.toString();
            }
            
            // Fetch both expenses and income
            const [expensesResponse, incomeResponse] = await Promise.all([
                fetch(expensesUrl, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                }),
                fetch(incomeUrl, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                })
            ]);

            console.log('Expenses response status:', expensesResponse.status);
            console.log('Income response status:', incomeResponse.status);

            if (!expensesResponse.ok) {
                console.error('Expenses API error:', await expensesResponse.text());
            }
            if (!incomeResponse.ok) {
                console.error('Income API error:', await incomeResponse.text());
            }

            const expensesData = expensesResponse.ok ? await expensesResponse.json() : { data: [] };
            const incomeData = incomeResponse.ok ? await incomeResponse.json() : { data: [] };

            console.log('Expenses data:', expensesData);
            console.log('Income data:', incomeData);

            console.log('Final expenses count:', expensesData.data.length);
            console.log('Final income count:', incomeData.data.length);

            // Combine and format transactions
            this.allTransactions = [
                ...expensesData.data.map(expense => ({
                    ...expense,
                    type: 'expense',
                    category: expense.category,
                    source: null
                })),
                ...incomeData.data.map(income => ({
                    ...income,
                    type: 'income',
                    category: null,
                    source: income.source
                }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            console.log('Combined transactions count:', this.allTransactions.length);
            console.log('Combined transactions:', this.allTransactions);

            this.filteredTransactions = [...this.allTransactions];
            this.currentPage = 1;
            this.renderTransactions();
            
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showMessage('Failed to load transactions', 'error');
        }
    }

    async applyFilters() {
        const search = document.getElementById('transactionSearch').value;
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;

        console.log('Applying filters:', { search, dateFrom, dateTo });

        try {
            // Build API URLs with parameters
            let expensesUrl = '/api/expenses';
            let incomeUrl = '/api/income';
            
            const params = new URLSearchParams();
            if (search && search.trim()) params.append('search', search.trim());
            if (dateFrom && dateTo) {
                params.append('startDate', dateFrom);
                params.append('endDate', dateTo);
            }
            
            if (params.toString()) {
                expensesUrl += '?' + params.toString();
                incomeUrl += '?' + params.toString();
            }

            // Call backend with search and date parameters
            const [expensesResponse, incomeResponse] = await Promise.all([
                fetch(expensesUrl, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                }),
                fetch(incomeUrl, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                })
            ]);

            if (!expensesResponse.ok) {
                throw new Error(`Expenses API error: ${expensesResponse.status}`);
            }
            if (!incomeResponse.ok) {
                throw new Error(`Income API error: ${incomeResponse.status}`);
            }

            const expensesData = await expensesResponse.json();
            const incomeData = await incomeResponse.json();

            // Combine and format transactions
            this.allTransactions = [
                ...expensesData.data.map(expense => ({
                    ...expense,
                    type: 'expense',
                    category: expense.category,
                    source: null
                })),
                ...incomeData.data.map(income => ({
                    ...income,
                    type: 'income',
                    category: null,
                    source: income.source
                }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            this.filteredTransactions = [...this.allTransactions];
            this.currentPage = 1;
            this.renderTransactions();

        } catch (error) {
            console.error('Error filtering transactions:', error);
            this.showMessage('Failed to filter transactions', 'error');
        }
    }

    clearFilters() {
        document.getElementById('transactionSearch').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        
        this.loadTransactions();
    }

    renderTransactions() {
        console.log('=== RENDER TRANSACTIONS START ===');
        console.log('Current page:', this.currentPage);
        console.log('Total filtered transactions:', this.filteredTransactions.length);
        console.log('All transactions available:', this.allTransactions.length);
        
        const container = document.getElementById('transactionsList');
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageTransactions = this.filteredTransactions.slice(startIndex, endIndex);

        console.log('Page transactions to render:', pageTransactions.length);

        // Calculate pagination
        this.totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);

        // Update pagination info
        const pageInfoEl = document.getElementById('pageInfo');
        const prevPageEl = document.getElementById('prevPage');
        const nextPageEl = document.getElementById('nextPage');
        
        if (pageInfoEl) pageInfoEl.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        if (prevPageEl) prevPageEl.disabled = this.currentPage === 1;
        if (nextPageEl) nextPageEl.disabled = this.currentPage === this.totalPages;

        // Update statistics
        this.updateTransactionStats();

        // Clear and render transactions
        container.innerHTML = '';

        if (pageTransactions.length === 0) {
            console.log('No transactions to display');
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #6b7280;">No transactions found</div>';
            return;
        }

        console.log('Rendering transactions...');
        pageTransactions.forEach((transaction, index) => {
            console.log(`Rendering transaction ${index + 1}:`, transaction);
            
            const item = document.createElement('div');
            item.className = `transaction-item ${transaction.type}`;
            
            const categoryOrSource = transaction.type === 'expense' ? transaction.category : transaction.source;
            const categoryIcon = this.getCategoryIcon(categoryOrSource);
            
            item.innerHTML = `
                <div class="transaction-content">
                    <div class="transaction-category">${categoryIcon} ${categoryOrSource}</div>
                    <div class="transaction-description">${transaction.description || 'No description'}</div>
                </div>
                <div class="transaction-meta">
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'expense' ? '-' : '+'}₹${(parseFloat(transaction.amount) || 0).toFixed(2)}
                    </div>
                    <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div class="transaction-actions">
                    <button class="btn-delete" onclick="dashboard.deleteTransaction('${transaction.type}', ${transaction.id})">Delete</button>
                </div>
            `;
            
            container.appendChild(item);
        });
        
        console.log('=== RENDER TRANSACTIONS END ===');
    }

    updateTransactionStats() {
        const totalRecords = this.filteredTransactions.length;
        const totalAmount = this.filteredTransactions.reduce((sum, t) => {
            const amount = parseFloat(t.amount) || 0;
            return sum + (t.type === 'income' ? amount : -amount);
        }, 0);

        // Safely update DOM elements
        const totalRecordsEl = document.getElementById('totalRecords');
        const totalAmountEl = document.getElementById('totalAmount');
        
        if (totalRecordsEl) totalRecordsEl.textContent = totalRecords;
        if (totalAmountEl) totalAmountEl.textContent = `₹${Math.abs(totalAmount).toFixed(2)}`;
    }

    getCategoryIcon(category) {
        const icons = {
            'Food': '🍔',
            'Transport': '🚗',
            'Entertainment': '🎬',
            'Shopping': '🛍️',
            'Bills': '📄',
            'Healthcare': '🏥',
            'Salary': '💼',
            'Freelance': '💻',
            'Business': '🏢',
            'Investment': '📈',
            'Other': '📦'
        };
        return icons[category] || '📦';
    }

    async editTransaction(type, id) {
        // Implementation for editing transactions
        console.log(`Editing ${type} with ID: ${id}`);
        // This would open the appropriate modal with pre-filled data
        if (type === 'expense') {
            // Load expense data and open expense modal
            await this.loadExpenseForEdit(id);
        } else {
            // Load income data and open income modal
            await this.loadIncomeForEdit(id);
        }
    }

    async deleteTransaction(type, id) {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) {
            return;
        }

        try {
            const endpoint = type === 'expense' ? `/api/expenses/${id}` : `/api/income/${id}`;
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                this.showMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`, 'success');
                this.loadTransactions(); // Reload transactions
                this.loadDashboardData(); // Refresh dashboard
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to delete transaction', 'error');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    exportTransactions() {
        if (this.filteredTransactions.length === 0) {
            this.showMessage('No transactions to export', 'error');
            return;
        }

        // Create CSV content
        const headers = ['Date', 'Type', 'Category/Source', 'Description', 'Amount'];
        const csvContent = [
            headers.join(','),
            ...this.filteredTransactions.map(t => [
                t.date,
                t.type,
                t.type === 'expense' ? t.category : t.source,
                `"${t.description || ''}"`,
                t.amount
            ].join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showMessage('Transactions exported successfully', 'success');
    }

    async deleteBudget(id) {
        if (!confirm('Are you sure you want to delete this budget?')) return;

        try {
            const response = await fetch(`/api/budgets/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.showMessage('Budget deleted successfully', 'success');
                this.loadBudgets();
            } else {
                const error = await response.json();
                this.showMessage(error.message || 'Failed to delete budget', 'error');
            }
        } catch (error) {
            console.error('Error deleting budget:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    closeModal(modal) {
        modal.style.display = 'none';
    }

    showMessage(message, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    // AI Insights functionality
    calculateClientHealthScore = function(
      currentTotalIncome, 
      currentTotalExpenses, 
      previousTotalExpenses, 
      previousTotalIncome,
      currentMonthIncome,
      previousMonthIncome
    ) {
      let score = 0;
      let factors = [];

      // 1. Savings Rate (40 points)
      const currentSavings = currentTotalIncome - currentTotalExpenses;
      const savingsRate = currentTotalIncome > 0 ? (currentSavings / currentTotalIncome) * 100 : 0;
      
      console.log('Client calculation - Current Income:', currentTotalIncome);
      console.log('Client calculation - Current Expenses:', currentTotalExpenses);
      console.log('Client calculation - Current Savings:', currentSavings);
      console.log('Client calculation - Savings Rate:', savingsRate + '%');
      
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
    }

    async loadInsights() {
        try {
            const response = await fetch('/api/insights', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            console.log('Insights response status:', response.status);
            console.log('Insights response headers:', response.headers);

            if (response.ok) {
                const data = await response.json();
                console.log('Insights data:', data);
                console.log('Health score:', data.data.healthScore);
                console.log('Insights:', data.data.insights);
                
                // If healthScore is missing, calculate it from summary data
                let healthScore = data.data.healthScore;
                if (!healthScore && data.data.summary) {
                    console.log('Health score missing, calculating from summary data...');
                    const summary = data.data.summary;
                    console.log('Summary data:', summary);
                    console.log('Current income:', summary.currentMonth.totalIncome);
                    console.log('Current expenses:', summary.currentMonth.totalExpenses);
                    console.log('Previous income:', summary.previousMonth.totalIncome);
                    console.log('Previous expenses:', summary.previousMonth.totalExpenses);
                    
                    healthScore = this.calculateClientHealthScore(
                        summary.currentMonth.totalIncome,
                        summary.currentMonth.totalExpenses,
                        summary.previousMonth.totalExpenses,
                        summary.previousMonth.totalIncome,
                        summary.currentMonth.incomeBySource,
                        summary.previousMonth.incomeBySource
                    );
                    console.log('Calculated health score:', healthScore);
                }
                
                this.displayInsights(data.data.insights, healthScore);
            } else {
                const errorText = await response.text();
                console.error('Insights error response:', errorText);
                
                // Try to parse as JSON, fallback to text
                let error;
                try {
                    error = JSON.parse(errorText);
                } catch (e) {
                    error = { message: errorText };
                }
                
                this.showMessage(error.message || 'Failed to load insights', 'error');
                this.displayNoInsights();
            }
        } catch (error) {
            console.error('Error loading insights:', error);
            this.showMessage('Network error. Please try again.', 'error');
            this.displayNoInsights();
        }
    }

    displayInsights(insights, healthScore) {
        const container = document.getElementById('insightsContainer');
        
        // Display Financial Health Score
        this.displayHealthScore(healthScore);
        
        if (!insights || insights.length === 0) {
            container.innerHTML = `
                <div class="no-insights">
                    <h3>📊 No Insights Available</h3>
                    <p>Start adding transactions to receive personalized spending insights and recommendations.</p>
                </div>
            `;
            return;
        }

        const insightsHTML = insights.map(insight => this.createInsightCard(insight)).join('');
        container.innerHTML = insightsHTML;
    }

    displayHealthScore(healthScore) {
        const scoreValue = document.getElementById('healthScoreValue');
        const scoreRating = document.getElementById('healthScoreRating');
        const scoreFactors = document.getElementById('healthScoreFactors');
        
        console.log('Displaying health score:', healthScore);
        
        if (healthScore && healthScore.score !== undefined) {
            scoreValue.textContent = `${healthScore.score}/100`;
            scoreRating.textContent = healthScore.rating || 'Unknown';
            scoreRating.className = `health-score-rating ${(healthScore.rating || '').toLowerCase()}`;
            
            if (healthScore.factors && healthScore.factors.length > 0) {
                const factorsHTML = healthScore.factors.map(factor => 
                    `<div class="factor-item">${factor}</div>`
                ).join('');
                scoreFactors.innerHTML = factorsHTML;
            } else {
                scoreFactors.innerHTML = '<div class="factor-item">📊 No factors calculated</div>';
            }
        } else {
            scoreValue.textContent = '--/100';
            scoreRating.textContent = 'Calculating...';
            scoreRating.className = 'health-score-rating';
            scoreFactors.innerHTML = '<div class="factor-item">📊 Analyzing your financial patterns...</div>';
        }
    }

    createInsightCard(insight) {
        const iconMap = {
            warning: '⚠️',
            success: '✅',
            info: 'ℹ️'
        };

        const icon = iconMap[insight.type] || 'ℹ️';
        
        let detailsHTML = '';
        
        if (insight.changeAmount) {
            const changeClass = insight.changeAmount > 0 ? 'positive' : 'negative';
            const changeSymbol = insight.changeAmount > 0 ? '+' : '';
            detailsHTML = `
                <div class="insight-details">
                    <span class="insight-change ${changeClass}">
                        ${changeSymbol}₹${Math.abs(insight.changeAmount).toFixed(0)}
                    </span>
                    <span class="insight-amount">
                        Current: ₹${insight.currentAmount.toFixed(2)}
                    </span>
                </div>
            `;
        } else if (insight.currentAmount && insight.previousAmount !== undefined) {
            const changeClass = insight.currentAmount > insight.previousAmount ? 'negative' : 'positive';
            const changePercent = Math.abs(insight.changePercent || 0);
            detailsHTML = `
                <div class="insight-details">
                    <span class="insight-change ${changeClass}">
                        ${changePercent}% change
                    </span>
                    <span class="insight-amount">
                        ₹${insight.currentAmount.toFixed(2)}
                    </span>
                </div>
            `;
        } else if (insight.percentage) {
            detailsHTML = `
                <div class="insight-details">
                    <span class="insight-change">
                        ${insight.percentage}% of expenses
                    </span>
                    <span class="insight-amount">
                        ₹${insight.amount.toFixed(2)}
                    </span>
                </div>
            `;
        }

        return `
            <div class="insight-card">
                <div class="insight-header">
                    <div class="insight-icon ${insight.type}">
                        ${icon}
                    </div>
                    <h3 class="insight-title">${insight.title}</h3>
                </div>
                <p class="insight-message">${insight.message}</p>
                ${detailsHTML}
            </div>
        `;
    }

    displayNoInsights() {
        const container = document.getElementById('insightsContainer');
        container.innerHTML = `
            <div class="no-insights">
                <h3>📊 No Insights Available</h3>
                <p>Start adding transactions to receive personalized spending insights and recommendations.</p>
            </div>
        `;
    }

    async refreshInsights() {
        const container = document.getElementById('insightsContainer');
        const scoreValue = document.getElementById('healthScoreValue');
        const scoreRating = document.getElementById('healthScoreRating');
        const scoreFactors = document.getElementById('healthScoreFactors');
        
        // Reset health score display
        scoreValue.textContent = '--/100';
        scoreRating.textContent = 'Calculating...';
        scoreRating.className = 'health-score-rating';
        scoreFactors.innerHTML = '<div class="factor-item">📊 Analyzing your financial patterns...</div>';
        
        container.innerHTML = `
            <div class="loading-insights">
                <div class="spinner"></div>
                <p>Analyzing your spending patterns...</p>
            </div>
        `;
        
        await this.loadInsights();
    }
}

const dashboard = new Dashboard();
