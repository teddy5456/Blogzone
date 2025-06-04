document.addEventListener('DOMContentLoaded', () => {
    // Common elements and functions
    const togglePasswordVisibility = (passwordInput, toggleButton) => {
        const isVisible = passwordInput.type === 'text';
        passwordInput.type = isVisible ? 'password' : 'text';
        const icon = toggleButton.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    };

    const clearErrors = (formId) => {
        const form = document.getElementById(formId);
        if (form) {
            form.querySelectorAll('.form-error').forEach(error => {
                error.textContent = '';
            });
        }
    };

    const showError = (input, message) => {
        const errorId = `${input.id}-error`;
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    };

    const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Handle successful authentication
const handleAuthSuccess = (data) => {
    localStorage.setItem('blogzone_token', data.token);
    localStorage.setItem('blogzone_user', JSON.stringify({
        userId: data.userId,
        email: data.email,
        role: data.role
    }));
    
    // Redirect based on user role
    if (data.role === 'reader') {
        window.location.href = '/reader.html';
    } else if (data.role === 'blogger') {
        window.location.href = '/writer.html';
    } else {
        // Default redirect if role doesn't match
        window.location.href = '/index.html';
    }
};

    // Signup functionality
    const setupSignupForm = () => {
        const signupForm = document.getElementById('signup-form');
        if (!signupForm) return;

        const passwordInput = document.getElementById('password');
        const togglePassword = document.querySelector('#signup-form .toggle-password');
        const strengthBars = document.querySelectorAll('.strength-bar');
        const emailInput = document.getElementById('email');
        const termsCheckbox = document.getElementById('terms');
        const nameInput = document.getElementById('name');
        const usernameInput = document.getElementById('username');

        function updateStrengthBar(strength) {
            strengthBars.forEach((bar, index) => {
                if (index < strength) {
                    bar.style.backgroundColor =
                        strength === 1 ? 'var(--danger-color)' :
                        strength === 2 ? 'var(--warning-color)' :
                        'var(--success-color)';
                } else {
                    bar.style.backgroundColor = 'var(--light-gray)';
                }
            });
        }

        function checkPasswordStrength(password) {
            const hasLetters = /[A-Za-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            const length = password.length;

            if (length < 6) return 0;
            if (hasLetters && hasNumbers && hasSymbols) return 3;
            if ((hasLetters && hasNumbers) || (hasLetters && hasSymbols) || (hasNumbers && hasSymbols)) return 2;
            return 1;
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                const strength = checkPasswordStrength(password);
                updateStrengthBar(strength);
            });
        }

        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                togglePasswordVisibility(passwordInput, togglePassword);
            });
        }

        function validateSignupForm() {
            clearErrors('signup-form');
            let isValid = true;

            if (!nameInput.value.trim()) {
                showError(nameInput, 'Name is required.');
                isValid = false;
            }

            if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
                showError(emailInput, 'Valid email is required.');
                isValid = false;
            }

            if (!usernameInput.value.trim()) {
                showError(usernameInput, 'Username is required.');
                isValid = false;
            }

            const password = passwordInput.value;
            if (!password) {
                showError(passwordInput, 'Password is required.');
                isValid = false;
            } else if (password.length < 6) {
                showError(passwordInput, 'Password must be at least 6 characters.');
                isValid = false;
            }

            if (!termsCheckbox.checked) {
                showError(termsCheckbox, 'You must agree to the terms and conditions.');
                isValid = false;
            }

            return isValid;
        }

        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!validateSignupForm()) return;

            try {
                const payload = {
                    username: usernameInput.value.trim(),
                    email: emailInput.value.trim(),
                    password: passwordInput.value,
                    name: nameInput.value.trim(),
                    role: 'blogger' 
                };

                console.log('Signup Request Payload:', payload);

                const response = await fetch('http://localhost:3000/api/users/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                console.log('Signup Response:', data);

                if (!response.ok) {
                    throw new Error(data.message || 'Registration failed');
                }

                handleAuthSuccess(data);
                
            } catch (error) {
                console.error('Signup error:', error);
                document.getElementById('email-error').textContent = error.message || 'Registration failed. Please try again.';
            }
        });
    };

    // Login functionality
    const setupLoginForm = () => {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const togglePassword = document.querySelector('#login-form .toggle-password');
        const rememberCheckbox = document.getElementById('remember');

        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', () => {
                togglePasswordVisibility(passwordInput, togglePassword);
            });
        }

        function validateLoginForm() {
            clearErrors('login-form');
            let isValid = true;

            if (!emailInput.value.trim()) {
                showError(emailInput, 'Email or username is required.');
                isValid = false;
            }

            if (!passwordInput.value.trim()) {
                showError(passwordInput, 'Password is required.');
                isValid = false;
            }

            return isValid;
        }

        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!validateLoginForm()) return;

            try {
                const payload = {
                    email: emailInput.value.trim(),
                    password: passwordInput.value
                };

                console.log('Login Request Payload:', payload);

                const response = await fetch('http://localhost:3000/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                console.log('Login Response:', data);

                if (!response.ok) {
                    throw new Error(data.message || 'Login failed');
                }

                // Store remember me preference
                if (rememberCheckbox && rememberCheckbox.checked) {
                    localStorage.setItem('blogzone_remember', 'true');
                } else {
                    localStorage.removeItem('blogzone_remember');
                }

                handleAuthSuccess(data);
                
            } catch (error) {
                console.error('Login error:', error);
                const errorElement = document.getElementById('email-error') || 
                                   document.getElementById('password-error');
                if (errorElement) {
                    errorElement.textContent = error.message || 'Login failed. Please try again.';
                }
            }
        });
    };


    // Social buttons (common to both forms)
    document.querySelectorAll('.btn-social').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            alert(`Redirecting to ${button.textContent.trim()} authentication`);
        });
    });

    // Initialize forms
    setupSignupForm();
    setupLoginForm();

    // Clear errors on input
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            const formId = input.closest('form')?.id;
            if (formId) {
                const errorId = `${input.id}-error`;
                const errorElement = document.getElementById(errorId);
                if (errorElement) {
                    errorElement.textContent = '';
                }
            }
        });
    });
});