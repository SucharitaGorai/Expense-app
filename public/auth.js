document.addEventListener('DOMContentLoaded', function() {
    const messageDiv = document.getElementById('message');
    
    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
    
    // Email validation function
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, message: 'Invalid email format' };
        }
        
        const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'company.com'];
        const domain = email.split('@')[1];
        if (!allowedDomains.includes(domain)) {
            return { valid: false, message: 'Email domain not allowed' };
        }
        
        return { valid: true };
    }
    
    // Password validation function
    function validatePassword(password) {
        if (!password || password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters long' };
        }
        
        if (!/(?=.*[a-z])/.test(password)) {
            return { valid: false, message: 'Password must contain at least one lowercase letter' };
        }
        
        if (!/(?=.*[A-Z])/.test(password)) {
            return { valid: false, message: 'Password must contain at least one uppercase letter' };
        }
        
        if (!/(?=.*\d)/.test(password)) {
            return { valid: false, message: 'Password must contain at least one number' };
        }
        
        return { valid: true };
    }
    
    function setLoading(form, isLoading) {
        const button = form.querySelector('.btn');
        if (isLoading) {
            button.disabled = true;
            button.textContent = 'Loading...';
            form.classList.add('loading');
        } else {
            button.disabled = false;
            button.textContent = form.id === 'registerForm' ? 'Register' : 'Login';
            form.classList.remove('loading');
        }
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(registerForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password')
            };
            
            // Client-side validation
            const emailValidation = validateEmail(data.email);
            if (!emailValidation.valid) {
                showMessage(emailValidation.message, 'error');
                return;
            }
            
            const passwordValidation = validatePassword(data.password);
            if (!passwordValidation.valid) {
                showMessage(passwordValidation.message, 'error');
                return;
            }
            
            setLoading(registerForm, true);
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('Registration successful! Redirecting to login...', 'success');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1500);
                } else {
                    showMessage(result.message || 'Registration failed', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showMessage('Network error. Please try again.', 'error');
            } finally {
                setLoading(registerForm, false);
            }
        });
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(loginForm);
            const data = {
                email: formData.get('email'),
                password: formData.get('password')
            };
            
            // Client-side validation
            const emailValidation = validateEmail(data.email);
            if (!emailValidation.valid) {
                showMessage(emailValidation.message, 'error');
                return;
            }
            
            setLoading(loginForm, true);
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    localStorage.setItem('token', result.data.token);
                    localStorage.setItem('user', JSON.stringify(result.data.user));
                    showMessage('Login successful! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                } else {
                    showMessage(result.message || 'Login failed', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage('Network error. Please try again.', 'error');
            } finally {
                setLoading(loginForm, false);
            }
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        });
    }
});
