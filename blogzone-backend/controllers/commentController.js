const { connectToDatabase } = require('../db');
const { authenticate } = require('../middleware/authMiddleware');
const { ObjectId } = require('mongodb');

// Helper function
function respond(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// Create a new comment
async function createComment(req, res) {
    authenticate(req, res, async (user) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { blogId, content, parentCommentId = null } = JSON.parse(body);
                
                if (!blogId || !content) {
                    return respond(res, 400, { message: 'Blog ID and content are required' });
                }

                if (content.length > 1000) {
                    return respond(res, 400, { message: 'Comment cannot exceed 1000 characters' });
                }

                const db = await connectToDatabase();
                
                const newComment = {
                    blogId: new ObjectId(blogId),
                    userId: new ObjectId(user.userId),
                    content,
                    parentCommentId: parentCommentId ? new ObjectId(parentCommentId) : null,
                    likes: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const result = await db.collection('comments').insertOne(newComment);
                
                respond(res, 201, { 
                    message: 'Comment created successfully',
                    commentId: result.insertedId
                });
            } catch (error) {
                console.error('Comment creation error:', error);
                respond(res, 500, { message: 'Error creating comment', error: error.message });
            }
        });
    });
}

// Get comments for a blog post
async function getCommentsByBlogId(req, res) {
    const blogId = req.url.split('/')[4]; // /api/comments/blog/:id
    try {
        const db = await connectToDatabase();
        
        // Get all top-level comments (no parent)
        const comments = await db.collection('comments')
            .find({ 
                blogId: new ObjectId(blogId),
                parentCommentId: null 
            })
            .sort({ createdAt: -1 })
            .toArray();

        // Get comment authors' details
        const userIds = comments.map(c => c.userId);
        const users = await db.collection('users')
            .find({ _id: { $in: userIds } })
            .project({ username: 1, avatar: 1 })
            .toArray();

        const userMap = users.reduce((map, user) => {
            map[user._id.toString()] = {
                username: user.username,
                avatar: user.avatar
            };
            return map;
        }, {});

        // Format comments with author info
        const formattedComments = comments.map(comment => ({
            ...comment,
            _id: comment._id.toString(),
            blogId: comment.blogId.toString(),
            userId: comment.userId.toString(),
            author: userMap[comment.userId.toString()] || {
                username: 'Unknown',
                avatar: null
            },
            replies: [] // Will be populated in client if needed
        }));

        respond(res, 200, formattedComments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        respond(res, 500, { message: 'Error fetching comments', error: error.message });
    }
}

// Like a comment
async function likeComment(req, res) {
    authenticate(req, res, async (user) => {
        const commentId = req.url.split('/')[3]; // /api/comments/:id/like
        try {
            const db = await connectToDatabase();
            
            // Check if user already liked this comment
            const existingLike = await db.collection('commentLikes').findOne({
                commentId: new ObjectId(commentId),
                userId: new ObjectId(user.userId)
            });

            if (existingLike) {
                return respond(res, 400, { message: 'You already liked this comment' });
            }

            // Start transaction
            const session = db.client.startSession();
            try {
                await session.withTransaction(async () => {
                    // Record the like
                    await db.collection('commentLikes').insertOne({
                        commentId: new ObjectId(commentId),
                        userId: new ObjectId(user.userId),
                        createdAt: new Date()
                    }, { session });

                    // Increment like count
                    await db.collection('comments').updateOne(
                        { _id: new ObjectId(commentId) },
                        { $inc: { likes: 1 } },
                        { session }
                    );
                });
            } finally {
                await session.endSession();
            }

            respond(res, 200, { message: 'Comment liked successfully' });
        } catch (error) {
            console.error('Error liking comment:', error);
            respond(res, 500, { message: 'Error liking comment', error: error.message });
        }
    });
}

// Delete a comment
async function deleteComment(req, res) {
    authenticate(req, res, async (user) => {
        const commentId = req.url.split('/')[3]; // /api/comments/:id
        try {
            const db = await connectToDatabase();
            
            // Verify comment exists and belongs to user (or user is admin)
            const comment = await db.collection('comments').findOne({
                _id: new ObjectId(commentId)
            });

            if (!comment) {
                return respond(res, 404, { message: 'Comment not found' });
            }

            if (comment.userId.toString() !== user.userId && user.role !== 'admin') {
                return respond(res, 403, { message: 'Not authorized to delete this comment' });
            }

            // Start transaction for deletion
            const session = db.client.startSession();
            try {
                await session.withTransaction(async () => {
                    // Delete the comment
                    await db.collection('comments').deleteOne(
                        { _id: new ObjectId(commentId) },
                        { session }
                    );

                    // Delete all likes associated with this comment
                    await db.collection('commentLikes').deleteMany(
                        { commentId: new ObjectId(commentId) },
                        { session }
                    );

                    // Delete any replies to this comment
                    await db.collection('comments').deleteMany(
                        { parentCommentId: new ObjectId(commentId) },
                        { session }
                    );
                });
            } finally {
                await session.endSession();
            }

            respond(res, 200, { message: 'Comment deleted successfully' });
        } catch (error) {
            console.error('Error deleting comment:', error);
            respond(res, 500, { message: 'Error deleting comment', error: error.message });
        }
    });
}

module.exports = {
    createComment,
    getCommentsByBlogId,
    likeComment,
    deleteComment
};