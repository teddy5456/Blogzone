const jwt = require('jsonwebtoken');

function authenticate(req, res, callback) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'Authentication required' }));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'Invalid or expired token' }));
        }
        
        // Add user to request object
        req.user = user;
        callback(user);
    });
}

function authorize(roles = []) {
    return function(req, res, callback) {
        authenticate(req, res, (user) => {
            if (roles.length && !roles.includes(user.role)) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ message: 'Unauthorized access' }));
            }
            callback(user);
        });
    };
}

module.exports = { authenticate, authorize };