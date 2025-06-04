const { connectToDatabase } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateEmail, validatePassword } = require('../utils/validation');

// User registration
async function registerUser(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const { username, email, password, role = 'reader' } = JSON.parse(body);
            
            // Validation
            if (!username || !email || !password) {
                return respond(res, 400, { message: 'All fields are required' });
            }
            
            if (!validateEmail(email)) {
                return respond(res, 400, { message: 'Invalid email format' });
            }
            
            if (!validatePassword(password)) {
                return respond(res, 400, { 
                    message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
                });
            }

            const db = await connectToDatabase();
            
            // Check if user exists
            const existingUser = await db.collection('Users').findOne({ email });
            if (existingUser) {
                return respond(res, 409, { message: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const newUser = {
                username,
                email,
                password: hashedPassword,
                role,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await db.collection('Users').insertOne(newUser);
            
            // Generate JWT
            const token = generateToken(result.insertedId, email, role);

            respond(res, 201, { 
                userId: result.insertedId, 
                email, 
                role, 
                token 
            });
        } catch (error) {
            console.error('Registration error:', error);
            respond(res, 500, { message: 'Error creating user', error: error.message });
        }
    });
}

// User login
async function loginUser(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        try {
            const { email, password } = JSON.parse(body);
            
            if (!email || !password) {
                return respond(res, 400, { message: 'Email and password are required' });
            }

            const db = await connectToDatabase();
            const user = await db.collection('Users').findOne({ email });
            
            if (!user) {
                return respond(res, 401, { message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return respond(res, 401, { message: 'Invalid credentials' });
            }

            const token = generateToken(user._id, user.email, user.role);
            
            respond(res, 200, { 
                userId: user._id, 
                email: user.email, 
                role: user.role, 
                token 
            });
        } catch (error) {
            console.error('Login error:', error);
            respond(res, 500, { message: 'Error logging in', error: error.message });
        }
    });
}

// Helper functions
function generateToken(userId, email, role) {
    return jwt.sign(
        { userId, email, role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function respond(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

module.exports = { registerUser, loginUser };