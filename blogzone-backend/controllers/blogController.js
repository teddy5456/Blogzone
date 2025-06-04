const { connectToDatabase } = require('../db');
const { authenticate } = require('../middleware/authMiddleware');
const { ObjectId } = require('mongodb');

// Create a new blog post
async function createBlog(req, res) {
    authenticate(req, res, async (user) => {
        if (user.role !== 'blogger' && user.role !== 'admin') {
            return respond(res, 403, { message: 'Only bloggers can create posts' });
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { title, content, categories = [], tags = [] } = JSON.parse(body);
                
                if (!title || !content) {
                    return respond(res, 400, { message: 'Title and content are required' });
                }

                const db = await connectToDatabase();
                
                const newBlog = {
                    title,
                    content,
                    authorId: user.userId,
                    categories,
                    tags,
                    status: 'draft',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    stats: {
                        views: 0,
                        likes: 0,
                        shares: 0
                    }
                };

                const result = await db.collection('blogs').insertOne(newBlog);
                
                respond(res, 201, { 
                    message: 'Blog created successfully',
                    blogId: result.insertedId
                });
            } catch (error) {
                console.error('Blog creation error:', error);
                respond(res, 500, { message: 'Error creating blog', error: error.message });
            }
        });
    });
}

// Get all published blogs
async function getBlogs(req, res) {
    try {
        const { query } = require('url').parse(req.url, true);
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;

        const db = await connectToDatabase();
        const blogs = await db.collection('blogs')
            .find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        respond(res, 200, blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        respond(res, 500, { message: 'Error fetching blogs', error: error.message });
    }
}

// Get blog by ID
async function getBlogById(req, res) {
    const id = req.url.split('/')[3]; // /api/blogs/:id
    try {
        const db = await connectToDatabase();
        const blog = await db.collection('blogs').findOne({ _id: new ObjectId(id) });

        if (!blog) {
            return respond(res, 404, { message: 'Blog not found' });
        }

        respond(res, 200, blog);
    } catch (error) {
        console.error('Error fetching blog by ID:', error);
        respond(res, 500, { message: 'Error fetching blog', error: error.message });
    }
}

// Increment views (PUT)
async function incrementBlogViews(req, res) {
    const id = req.url.split('/')[3]; // /api/blogs/:id/view
    try {
        const db = await connectToDatabase();
        const result = await db.collection('blogs').updateOne(
            { _id: new ObjectId(id) },
            {
                $inc: { 'stats.views': 1 },
                $set: { updatedAt: new Date() }
            }
        );

        if (result.matchedCount === 0) {
            return respond(res, 404, { message: 'Blog not found' });
        }

        respond(res, 200, { message: 'View count updated' });
    } catch (error) {
        console.error('Error incrementing views:', error);
        respond(res, 500, { message: 'Error updating views', error: error.message });
    }
}

// Helper function
function respond(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

module.exports = {
    createBlog,
    getBlogs,
    getBlogById,
    incrementBlogViews
};
