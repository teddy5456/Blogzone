const { parse } = require('url');
const { 
    registerUser, 
    loginUser 
} = require('./controllers/userController');
const { 
    createBlog, 
    getBlogs, 
    getBlogById, 
    incrementBlogViews 
} = require('./controllers/blogController');
const {
    createComment,
    getCommentsByBlogId,
    likeComment,
    deleteComment
} = require('./controllers/commentController');

function handleRequest(req, res) {
    const { pathname } = parse(req.url, true);
    const method = req.method.toUpperCase();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // User routes
    if (pathname === '/api/users/register' && method === 'POST') {
        registerUser(req, res);
    } else if (pathname === '/api/users/login' && method === 'POST') {
        loginUser(req, res);
    }

    // Blog routes
    else if (pathname === '/api/blogs' && method === 'GET') {
        getBlogs(req, res);
    } else if (pathname === '/api/blogs' && method === 'POST') {
        createBlog(req, res);
    } else if (/^\/api\/blogs\/[a-fA-F0-9]{24}$/.test(pathname) && method === 'GET') {
        getBlogById(req, res);
    } else if (/^\/api\/blogs\/[a-fA-F0-9]{24}\/view$/.test(pathname) && method === 'PUT') {
        incrementBlogViews(req, res);
    }

    // Comment routes
    else if (pathname === '/api/comments' && method === 'POST') {
        createComment(req, res);
    } else if (/^\/api\/comments\/blog\/[a-fA-F0-9]{24}$/.test(pathname) && method === 'GET') {
        getCommentsByBlogId(req, res);
    } else if (/^\/api\/comments\/[a-fA-F0-9]{24}\/like$/.test(pathname) && method === 'PUT') {
        likeComment(req, res);
    } else if (/^\/api\/comments\/[a-fA-F0-9]{24}$/.test(pathname) && method === 'DELETE') {
        deleteComment(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Route not found' }));
    }
}

module.exports = { handleRequest };