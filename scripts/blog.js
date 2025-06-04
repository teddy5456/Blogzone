document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const blogGrid = document.getElementById('blogGrid');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const blogModal = document.getElementById('blogModal');
    const closeModal = document.querySelector('.close-modal');
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');

    // State
    let allBlogs = [];
    let filteredBlogs = [];
    let currentCategory = 'all';
    let currentPage = 1;
    const blogsPerPage = 6;
    let isLoggedIn = false;
    let currentBlogId = null;

    // Initialize
    checkAuthStatus();
    fetchAllBlogs();
    setupEventListeners();

    function setupEventListeners() {
        // Category filter
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = btn.dataset.category;
                currentPage = 1;
                filterBlogs();
            });
        });

        // Pagination
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayBlogs();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            if (currentPage < Math.ceil(filteredBlogs.length / blogsPerPage)) {
                currentPage++;
                displayBlogs();
            }
        });

        // Modal
        closeModal.addEventListener('click', closeBlogModal);
        blogModal.addEventListener('click', (e) => {
            if (e.target === blogModal) {
                closeBlogModal();
            }
        });

        // Search functionality
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });

        // Event delegation for dynamic elements
        document.addEventListener('click', (e) => {
            if (e.target.closest('.read-more-btn')) {
                const btn = e.target.closest('.read-more-btn');
                currentBlogId = btn.dataset.id;
                viewBlogDetails(currentBlogId);
            }
            
            if (e.target.closest('.like-btn')) {
                const btn = e.target.closest('.like-btn');
                const blogId = btn.dataset.id || currentBlogId;
                if (!isLoggedIn) return showLoginPrompt();
                likeBlog(blogId, btn);
            }
            
            if (e.target.closest('.bookmark-btn')) {
                const btn = e.target.closest('.bookmark-btn');
                const blogId = btn.dataset.id || currentBlogId;
                if (!isLoggedIn) return showLoginPrompt();
                toggleBookmark(blogId, btn);
            }

            if (e.target.closest('.share-btn')) {
                const blogId = e.target.closest('.share-btn').dataset.id || currentBlogId;
                shareBlog(blogId);
            }

            // Comment like button
            if (e.target.closest('.comment-like-btn')) {
                const btn = e.target.closest('.comment-like-btn');
                const commentId = btn.dataset.commentId;
                if (!isLoggedIn) return showLoginPrompt();
                likeComment(commentId, btn);
            }
        });
    }

    async function checkAuthStatus() {
        try {
            const response = await fetch('http://localhost:3000/api/auth/status', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                isLoggedIn = data.authenticated;
                updateAuthDependentElements();
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }

    function updateAuthDependentElements() {
        // Update comment form visibility
        const commentForms = document.querySelectorAll('.comment-form');
        commentForms.forEach(form => {
            form.style.display = isLoggedIn ? 'block' : 'none';
        });

        // Show login prompts where needed
        const loginPrompts = document.querySelectorAll('.login-prompt');
        loginPrompts.forEach(prompt => {
            prompt.style.display = isLoggedIn ? 'none' : 'block';
        });
    }

    async function fetchAllBlogs() {
        try {
            showLoadingSkeleton();
            
            const response = await fetch('http://localhost:3000/api/blogs');
            if (!response.ok) throw new Error('Failed to fetch blogs');
            
            allBlogs = await response.json();
            filterBlogs();
        } catch (error) {
            console.error('Error fetching blogs:', error);
            showErrorState();
        } finally {
            hideLoadingSkeleton();
        }
    }

    function showLoadingSkeleton() {
        blogGrid.innerHTML = Array(6).fill().map(() => `
            <div class="blog-card skeleton">
                <div class="blog-image"></div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-category"></span>
                        <span class="blog-date"></span>
                    </div>
                    <h3 class="blog-title"></h3>
                    <p class="blog-excerpt"></p>
                    <div class="blog-stats"></div>
                </div>
            </div>
        `).join('');
    }

    function hideLoadingSkeleton() {
        const skeletons = document.querySelectorAll('.skeleton');
        skeletons.forEach(s => s.remove());
    }

    function showErrorState() {
        blogGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load blogs. Please try again later.</p>
                <button class="retry-btn">Retry</button>
            </div>
        `;
        
        document.querySelector('.retry-btn').addEventListener('click', fetchAllBlogs);
    }

    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            filterBlogs();
            return;
        }
        
        filteredBlogs = allBlogs.filter(blog => 
            blog.title.toLowerCase().includes(query) || 
            (blog.content && blog.content.toLowerCase().includes(query)) ||
            (blog.categories && blog.categories.some(cat => cat.toLowerCase().includes(query)))
        );
        
        currentPage = 1;
        displayBlogs();
    }

    function filterBlogs() {
        if (currentCategory === 'all') {
            filteredBlogs = [...allBlogs];
        } else {
            filteredBlogs = allBlogs.filter(blog => 
                blog.categories && blog.categories.includes(currentCategory)
            );
        }
        
        filteredBlogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        displayBlogs();
    }

    function displayBlogs() {
        const startIndex = (currentPage - 1) * blogsPerPage;
        const endIndex = startIndex + blogsPerPage;
        const blogsToDisplay = filteredBlogs.slice(startIndex, endIndex);

        blogGrid.innerHTML = blogsToDisplay.length > 0 
            ? blogsToDisplay.map(blog => createBlogCard(blog)).join('')
            : '<div class="no-results"><i class="far fa-newspaper"></i><p>No blogs found matching your criteria.</p></div>';

        updatePagination();
    }

    function createBlogCard(blog) {
        const categories = blog.categories && blog.categories.length > 0
            ? blog.categories.map(cat => `<span class="blog-category">${cat}</span>`).join('')
            : '<span class="blog-category">Uncategorized</span>';

        return `
            <div class="blog-card" data-id="${blog._id}">
                <div class="blog-image">
                    ${blog.featuredImage 
                        ? `<img src="${blog.featuredImage}" alt="${blog.title}" loading="lazy">`
                        : `<div class="image-placeholder"><i class="fas fa-image"></i></div>`
                    }
                    ${isLoggedIn ? `<button class="bookmark-btn" data-id="${blog._id}">
                        <i class="far fa-bookmark"></i>
                    </button>` : ''}
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        ${categories}
                        <span class="blog-date">${formatDate(blog.createdAt)}</span>
                    </div>
                    <h3 class="blog-title">${blog.title || 'Untitled Blog'}</h3>
                    <p class="blog-excerpt">${truncateText(blog.content || '', 150)}</p>
                    <button class="read-more-btn" data-id="${blog._id}">Read More</button>
                    <div class="blog-stats">
                        <button class="like-btn" data-id="${blog._id}">
                            <i class="far fa-heart"></i>
                            <span>${blog.stats?.likes || 0}</span>
                        </button>
                        <span class="view-count"><i class="far fa-eye"></i> ${blog.stats?.views || 0}</span>
                        <span class="comment-count"><i class="far fa-comment"></i> ${blog.stats?.comments || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }

    async function viewBlogDetails(blogId) {
        try {
            // Show loading state in modal
            blogModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Track view
            try {
                await fetch(`http://localhost:3000/api/blogs/${blogId}/view`, {
                    method: 'PUT'
                });
            } catch (e) {
                console.log("View tracking failed, continuing anyway");
            }

            // Get blog details
            const blogResponse = await fetch(`http://localhost:3000/api/blogs/${blogId}`);
            if (!blogResponse.ok) throw new Error('Failed to fetch blog details');
            
            const blog = await blogResponse.json();
            
            // Get author details
            let author = null;
            if (blog.authorId) {
                try {
                    const authorResponse = await fetch(`http://localhost:3000/api/authors/${blog.authorId}`);
                    if (authorResponse.ok) {
                        author = await authorResponse.json();
                    }
                } catch (e) {
                    console.error("Failed to fetch author details", e);
                }
            }
            
            displayBlogDetails({
                ...blog,
                author: author || { name: "Unknown Author" }
            });
        } catch (error) {
            console.error('Error viewing blog:', error);
            showModalErrorState('Failed to load blog details');
        }
    }

    function displayBlogDetails(blog) {
        currentBlogId = blog._id;
        
        // Enhanced loading state with progress simulation
        const loadingState = document.querySelector('.loading-state');
        const articleContent = document.querySelector('.article-content');
        loadingState.style.display = 'flex';
        articleContent.style.display = 'none';
        
        // Animate progress bar during loading
        const progressBar = loadingState.querySelector('.progress-bar');
        progressBar.style.width = '0%';
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            progressBar.style.width = `${Math.min(progress, 90)}%`;
        }, 100);
        
        // Show modal with enhanced animation
        blogModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Simulate loading with more realistic timing
        setTimeout(() => {
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            
            setTimeout(() => {
                updateArticleContent(blog);
                setupModalInteractions();
                
                // Hide loading with fade out, show content with fade in
                loadingState.style.opacity = '0';
                setTimeout(() => {
                    loadingState.style.display = 'none';
                    loadingState.style.opacity = '1';
                    articleContent.style.display = 'block';
                    articleContent.style.animation = 'fadeIn 0.4s ease';
                }, 300);
            }, 200);
        }, 1000 + Math.random() * 500);
    }

    function updateArticleContent(blog) {
        const articleContent = document.querySelector('.article-content');
        
        // Update categories
        const categoriesEl = articleContent.querySelector('.categories');
        const categoryColors = {
            'technology': '#4a6bdf',
            'design': '#e91e63',
            'business': '#00bcd4',
            'lifestyle': '#8bc34a',
            'default': '#9c27b0'
        };
        
        categoriesEl.innerHTML = blog.categories?.map(cat => {
            const color = categoryColors[cat.toLowerCase()] || categoryColors.default;
            return `<span class="category-tag" style="background-color: ${color}20; color: ${color}">${cat}</span>`;
        }).join('') || '';

        // Update date with relative time
        const publishDateEl = articleContent.querySelector('.publish-date');
        publishDateEl.innerHTML = `
            <span>${formatDate(blog.createdAt)}</span>
            <span class="relative-time">(${getRelativeTime(blog.createdAt)})</span>
        `;

        // Update title with reading progress indicator
        const articleTitleEl = articleContent.querySelector('.article-title');
        articleTitleEl.innerHTML = `
            ${blog.title || 'Untitled Blog'}
            <span class="reading-progress" data-content-length="${blog.content?.length || 0}"></span>
        `;

        // Update author info
        const author = blog.author || {};
        const authorAvatarEl = articleContent.querySelector('.author-avatar');
        authorAvatarEl.src = author.avatar || 'assets/images/default-avatar.jpg';
        authorAvatarEl.alt = author.name || 'Author';

        const authorNameEl = articleContent.querySelector('.author-name');
        authorNameEl.textContent = author.name || 'Unknown Author';

        const authorBioEl = articleContent.querySelector('.author-bio');
        authorBioEl.textContent = author.bio || 'No bio available';

        const authorSocialEl = articleContent.querySelector('.author-social');
        authorSocialEl.innerHTML = author.social ? `
            ${author.social.twitter ? `<a href="${author.social.twitter}" target="_blank"><i class="fab fa-twitter"></i></a>` : ''}
            ${author.social.linkedin ? `<a href="${author.social.linkedin}" target="_blank"><i class="fab fa-linkedin"></i></a>` : ''}
            ${author.social.github ? `<a href="${author.social.github}" target="_blank"><i class="fab fa-github"></i></a>` : ''}
        ` : '<span>No social links</span>';

        // Update stats
        const readTimeEl = articleContent.querySelector('.read-time');
        readTimeEl.innerHTML = `<i class="far fa-clock"></i> ${calculateReadTime(blog.content)} min read`;

        const viewsCountEl = articleContent.querySelector('.views-count');
        viewsCountEl.innerHTML = `<i class="far fa-eye"></i> ${formatNumber(blog.stats?.views || 0)}`;

        // Update featured image
        const featuredImageEl = articleContent.querySelector('.featured-image');
        if (blog.featuredImage) {
            featuredImageEl.innerHTML = `
                <div class="image-container">
                    <img src="${blog.featuredImage}" alt="${blog.title}" loading="lazy">
                    ${blog.imageCaption ? `<div class="image-caption">${blog.imageCaption}</div>` : ''}
                </div>
                <button class="zoom-image-btn"><i class="fas fa-expand"></i></button>
            `;
        } else {
            featuredImageEl.innerHTML = '<div class="image-placeholder"><i class="fas fa-image"></i></div>';
        }

        // Process and update article content
        const articleBodyEl = articleContent.querySelector('.article-body');
        if (!blog.content) {
            articleBodyEl.innerHTML = '<p>No content available.</p>';
        } else {
            // Create temporary div to parse HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = blog.content;
            
            // Remove unwanted attributes
            const elementsWithDataAttrs = tempDiv.querySelectorAll('[data-start], [data-end]');
            elementsWithDataAttrs.forEach(el => {
                el.removeAttribute('data-start');
                el.removeAttribute('data-end');
            });
            
            // Remove empty paragraphs
            const paragraphs = tempDiv.querySelectorAll('p');
            paragraphs.forEach(p => {
                if (!p.textContent.trim() && !p.innerHTML.includes('<img') && !p.innerHTML.includes('<iframe')) {
                    p.remove();
                }
            });
            
            // Fix list styling
            const lists = tempDiv.querySelectorAll('ol, ul');
            lists.forEach(list => {
                list.style.listStylePosition = 'inside';
                list.style.paddingLeft = '0';
            });
            
            // Add proper spacing between elements
            const contentElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ol, ul, hr');
            contentElements.forEach(el => {
                if (!el.classList.contains('processed')) {
                    el.style.marginTop = '1.5rem';
                    el.style.marginBottom = '1rem';
                    el.classList.add('processed');
                }
            });
            
            // Handle emojis in headings
            const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(heading => {
                heading.innerHTML = heading.innerHTML.replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, 
                    '<span class="emoji">$1</span>');
            });
            
            articleBodyEl.innerHTML = tempDiv.innerHTML;
        }

        // Update tags
        const tagsContainerEl = articleContent.querySelector('.article-tags');
        tagsContainerEl.innerHTML = blog.tags?.map(tag => {
            const popularity = Math.floor(Math.random() * 3); // Simulate tag popularity
            return `<span class="tag tag-popularity-${popularity}">${tag}</span>`;
        }).join('') || '<span class="no-tags">No tags</span>';

        // Update like count
        const likeCountEl = articleContent.querySelector('.like-count');
        likeCountEl.textContent = formatNumber(blog.stats?.likes || 0);

        // Update comment count
        const commentCountEl = articleContent.querySelector('.comment-count');
        commentCountEl.textContent = formatNumber(blog.stats?.comments || 0);

        // Initialize reading progress tracker
        setupReadingProgress();

        // Initialize image zoom functionality
        setupImageZoom();
    }

    function setupModalInteractions() {
        // Like button
        const likeBtn = document.querySelector('.article-actions .like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                if (!isLoggedIn) return showLoginPrompt();
                likeBlog(currentBlogId, likeBtn);
            });
        }

        // Bookmark button
        const bookmarkBtn = document.querySelector('.article-actions .bookmark-btn');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => {
                if (!isLoggedIn) return showLoginPrompt();
                toggleBookmark(currentBlogId, bookmarkBtn);
            });
        }

        // Share button
        const shareBtn = document.querySelector('.article-actions .share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                shareBlog(currentBlogId);
            });
        }

        // Comment form
        const commentForm = document.querySelector('.comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const textarea = commentForm.querySelector('textarea');
                const content = textarea.value.trim();
                
                if (!content) {
                    showToast('Please enter a comment', 'error');
                    return;
                }
                
                try {
                    const response = await fetch('http://localhost:3000/api/comments', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                        },
                        body: JSON.stringify({
                            blogId: currentBlogId,
                            content: content
                        })
                    });
                    
                    if (response.ok) {
                        textarea.value = '';
                        showToast('Comment posted successfully');
                        await fetchComments(currentBlogId); // Refresh comments
                    } else {
                        throw new Error('Failed to post comment');
                    }
                } catch (error) {
                    console.error('Error posting comment:', error);
                    showToast('Failed to post comment', 'error');
                }
            });
        }

        // Fetch comments
        fetchComments(currentBlogId);
    }

    async function fetchComments(blogId) {
        try {
            const response = await fetch(`http://localhost:3000/api/comments/blog/${blogId}`);
            if (!response.ok) throw new Error('Failed to fetch comments');
            
            const comments = await response.json();
            displayComments(comments);
        } catch (error) {
            console.error('Error fetching comments:', error);
            displayComments([]); // Show empty state
        }
    }

    function displayComments(comments) {
        const commentsContainer = document.querySelector('.comments-section');
        if (!commentsContainer) return;
        
        const commentsList = commentsContainer.querySelector('.comments-list');
        const commentForm = commentsContainer.querySelector('.comment-form');
        
        // Update comment count
        const commentCount = commentsContainer.querySelector('.comment-count');
        if (commentCount) {
            commentCount.textContent = comments.length;
        }
        
        // Display comments
        if (comments.length > 0) {
            commentsList.innerHTML = comments.map(comment => `
                <div class="comment" data-comment-id="${comment._id}">
                    <div class="comment-header">
                        <img src="${comment.user?.avatar || 'assets/images/default-avatar.jpg'}" 
                             alt="${comment.user?.name || 'User'}" 
                             class="comment-avatar">
                        <div class="comment-meta">
                            <span class="comment-author">${comment.user?.name || 'Anonymous'}</span>
                            <span class="comment-date">${formatDate(comment.createdAt)}</span>
                        </div>
                        ${isLoggedIn ? `
                        <div class="comment-actions">
                            <button class="comment-like-btn" data-comment-id="${comment._id}">
                                <i class="far fa-heart"></i> ${comment.likes || 0}
                            </button>
                            <button class="comment-reply-btn">Reply</button>
                        </div>` : ''}
                    </div>
                    <div class="comment-content">${comment.content}</div>
                </div>
            `).join('');
        } else {
            commentsList.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
        }
        
        // Update form visibility based on auth status
        if (commentForm) {
            commentForm.style.display = isLoggedIn ? 'block' : 'none';
            if (!isLoggedIn) {
                const loginPrompt = document.createElement('div');
                loginPrompt.className = 'login-prompt';
                loginPrompt.innerHTML = `
                    <p>Please <a href="/login">login</a> to leave a comment</p>
                `;
                commentsContainer.appendChild(loginPrompt);
            }
        }
    }

    async function likeComment(commentId, likeBtn) {
        try {
            const response = await fetch(`http://localhost:3000/api/comments/${commentId}/like`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                const icon = likeBtn.querySelector('i');
                
                // Update like count and icon
                likeBtn.innerHTML = `
                    <i class="${result.liked ? 'fas' : 'far'} fa-heart"></i> ${result.likes}
                `;
                
                showToast(result.liked ? 'Comment liked' : 'Like removed');
            }
        } catch (error) {
            console.error('Error liking comment:', error);
            showToast('Failed to like comment', 'error');
        }
    }

    function closeBlogModal() {
        blogModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        currentBlogId = null;
    }

    async function likeBlog(blogId, likeBtn) {
        try {
            const response = await fetch(`http://localhost:3000/api/blogs/${blogId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to like blog');
            
            const result = await response.json();
            
            // Update like count in all instances
            document.querySelectorAll(`.like-btn[data-id="${blogId}"] span, .like-count`).forEach(span => {
                span.textContent = result.likes;
            });

            // Change icon to solid heart
            const icon = likeBtn.querySelector('i');
            if (icon) {
                icon.className = result.liked ? 'fas fa-heart' : 'far fa-heart';
                likeBtn.classList.toggle('liked', result.liked);
            }
        } catch (error) {
            console.error('Error liking blog:', error);
        }
    }

    async function toggleBookmark(blogId, bookmarkBtn) {
        try {
            const response = await fetch(`http://localhost:3000/api/blogs/${blogId}/bookmark`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to bookmark blog');
            
            const result = await response.json();
            
            // Update bookmark icon
            const icon = bookmarkBtn.querySelector('i');
            if (icon) {
                icon.className = result.bookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
                bookmarkBtn.classList.toggle('bookmarked', result.bookmarked);
            }
            
            // Show feedback
            showToast(result.bookmarked ? 'Blog saved to your bookmarks' : 'Blog removed from bookmarks');
        } catch (error) {
            console.error('Error bookmarking blog:', error);
        }
    }

    function shareBlog(blogId) {
        const blog = allBlogs.find(b => b._id === blogId);
        if (!blog) return;
        
        const shareUrl = `${window.location.origin}/blogs/${blogId}`;
        const shareText = `Check out this blog: ${blog.title}`;
        
        if (navigator.share) {
            navigator.share({
                title: blog.title,
                text: shareText,
                url: shareUrl
            }).catch(err => {
                console.log('Error sharing:', err);
                fallbackShare(shareUrl, shareText);
            });
        } else {
            fallbackShare(shareUrl, shareText);
        }
    }

    function fallbackShare(url, text) {
        // Copy to clipboard as fallback
        navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
            showToast('Link copied to clipboard!');
        }).catch(err => {
            console.error('Could not copy text: ', err);
            showToast('Could not share. Please copy the URL manually.', 'error');
        });
    }

    function showLoginPrompt() {
        showToast('Please login to perform this action', 'warning');
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3000);
        }, 100);
    }

    function updatePagination() {
        const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
        
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage >= totalPages;
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    function showModalErrorState(message) {
        const blogDetail = document.querySelector('.blog-detail');
        blogDetail.innerHTML = `
            <div class="modal-error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message || 'Failed to load content'}</p>
                <button class="retry-btn">Try Again</button>
            </div>
        `;
        
        document.querySelector('.retry-btn').addEventListener('click', () => {
            if (currentBlogId) {
                viewBlogDetails(currentBlogId);
            }
        });
    }

    // Helper functions
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    function getRelativeTime(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (minutes < 1440) return `${Math.floor(minutes/60)} hours ago`;
        return `${Math.floor(minutes/1440)} days ago`;
    }

    function truncateText(text, maxLength) {
        if (!text) return '';
        const strippedText = text.replace(/<[^>]*>/g, '');
        return strippedText.length > maxLength 
            ? strippedText.substring(0, maxLength) + '...' 
            : strippedText;
    }

    function calculateReadTime(content) {
        if (!content) return 0;
        const text = content.replace(/<[^>]*>/g, '');
        const wordCount = text.split(/\s+/).length;
        return Math.ceil(wordCount / 200); // 200 words per minute
    }

    function formatNumber(num) {
        return num >= 1000 ? (num/1000).toFixed(1) + 'k' : num;
    }

    function setupReadingProgress() {
        const progressElement = document.querySelector('.reading-progress');
        if (!progressElement) return;
        
        const contentLength = parseInt(progressElement.dataset.contentLength);
        const words = contentLength / 5; // Approximate word count
        progressElement.title = `About ${Math.round(words)} words`;
        
        window.addEventListener('scroll', () => {
            const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            progressElement.style.width = `${scrollPercentage}%`;
        });
    }

    function setupImageZoom() {
        document.querySelectorAll('.zoom-image-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const imgContainer = btn.closest('.featured-image-container');
                imgContainer.classList.toggle('zoomed');
                btn.innerHTML = imgContainer.classList.contains('zoomed') 
                    ? '<i class="fas fa-compress"></i>' 
                    : '<i class="fas fa-expand"></i>';
            });
        });
    }
});