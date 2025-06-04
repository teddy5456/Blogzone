document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggles = document.querySelectorAll('.sidebar-toggle');
    const userDropdown = document.querySelector('.user-dropdown');
    const notificationBtn = document.querySelector('.notification-btn');
    const searchBar = document.querySelector('.search-bar input');
    const createPostBtn = document.querySelector('.welcome-content .btn-primary');
    const viewAllPostsBtn = document.querySelector('.dashboard-section .btn-outline');
    const postsTable = document.querySelector('.posts-table tbody');
    const activityFeed = document.querySelector('.activity-feed');
    const statCards = document.querySelectorAll('.stat-card');
    const welcomeContent = document.querySelector('.welcome-content h1');
    const welcomeSubtext = document.querySelector('.welcome-content p');
    const userAvatar = document.querySelector('.user-avatar img');
    const userNameElements = document.querySelectorAll('.user-name');

    // State
    let currentUser = null;
    let blogPosts = [];
    let isLoading = false;

    // Initialize the dashboard
    initDashboard();

    // Main initialization function
    async function initDashboard() {
        if (!verifyAuth()) {
            window.location.href = 'login.html';
            return;
        }

        await loadUserData();
        await fetchBlogPosts();
        updateUI();
        setupEventListeners();
    }

    // Verify user is authenticated
    function verifyAuth() {
        const token = localStorage.getItem('blogzone_token');
        const userData = localStorage.getItem('blogzone_user');
        
        if (!token || !userData) return false;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (!payload.userId) return false;
            
            currentUser = { _id: payload.userId };
            return true;
        } catch (e) {
            console.error('Token validation error:', e);
            return false;
        }
    }

    // Load user data from localStorage
    async function loadUserData() {
        try {
            const userData = JSON.parse(localStorage.getItem('blogzone_user')) || {};
            
            currentUser = {
                ...currentUser,
                name: userData.name || (userData.email ? userData.email.split('@')[0] : 'User'),
                email: userData.email || 'user@example.com',
                avatar: userData.avatar || "assets/images/user-avatar.jpg"
            };
        } catch (error) {
            console.error('Error loading user data:', error);
            currentUser = {
                ...currentUser,
                name: 'User',
                email: 'user@example.com',
                avatar: "assets/images/user-avatar.jpg"
            };
        }
    }

    // Fetch blog posts for the current user
    async function fetchBlogPosts() {
        isLoading = true;
        showLoadingState(true);
        
        try {
            const userId = currentUser._id;
            if (!userId) throw new Error('No user ID available');

            const response = await fetch(`http://localhost:3000/api/blogs`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('blogzone_token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch blog posts');
            
            const data = await response.json();
            blogPosts = Array.isArray(data) ? data.filter(post => post.authorId === userId) : [];
            
            if (blogPosts.length === 0) {
                showEmptyState();
            }
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            showErrorState('Failed to load blog posts. Please try again later.');
            
            if (error.message.includes('401')) {
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } finally {
            isLoading = false;
            showLoadingState(false);
        }
    }

    // Show empty state when no posts exist
    function showEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-pen-fancy"></i>
            <h3>No posts yet</h3>
            <p>You haven't created any blog posts. Get started by creating your first post!</p>
            <a href="create-blog.html" class="btn btn-primary">Create First Post</a>
        `;
        document.querySelector('.dashboard-content').appendChild(emptyState);
    }

    // Update all UI elements
    function updateUI() {
        updateUserInfo();
        updateStatsCards();
        updatePostsTable();
        updateActivityFeed();
        updateWelcomeMessage();
    }

    // Update user information in the header
    function updateUserInfo() {
        userNameElements.forEach(el => {
            el.textContent = currentUser.name;
        });
        
        if (userAvatar) {
            userAvatar.src = currentUser.avatar;
            userAvatar.alt = `${currentUser.name}'s avatar`;
        }
    }

    // Update the stats cards with post analytics
    function updateStatsCards() {
        if (blogPosts.length === 0) {
            statCards.forEach(card => {
                card.querySelector('h3').textContent = '0';
                card.querySelector('.stat-change').innerHTML = '<i class="fas fa-minus"></i> No data';
            });
            return;
        }
        
        const totals = blogPosts.reduce((acc, post) => {
            acc.views += post.stats?.views || 0;
            acc.likes += post.stats?.likes || 0;
            acc.comments += post.stats?.comments || 0;
            acc.shares += post.stats?.shares || 0;
            return acc;
        }, { views: 0, likes: 0, comments: 0, shares: 0 });
        
        // Update each stat card
        statCards[0].querySelector('h3').textContent = totals.views.toLocaleString();
        statCards[0].querySelector('.stat-change').innerHTML = 
            `<i class="fas fa-arrow-up"></i> ${calculatePercentageChange('views')}% from last week`;
        
        statCards[1].querySelector('h3').textContent = Math.floor(totals.views / 20).toLocaleString();
        statCards[1].querySelector('.stat-change').innerHTML = 
            `<i class="fas fa-arrow-up"></i> ${calculatePercentageChange('likes')}% from last week`;
        
        statCards[2].querySelector('h3').textContent = totals.comments.toLocaleString();
        statCards[2].querySelector('.stat-change').innerHTML = 
            `<i class="fas fa-arrow-${totals.comments > 50 ? 'up' : 'down'}"></i> ${calculatePercentageChange('comments')}% from last week`;
        
        const earnings = (totals.views * 0.02).toFixed(2);
        statCards[3].querySelector('h3').textContent = `$${earnings}`;
        statCards[3].querySelector('.stat-change').innerHTML = 
            `<i class="fas fa-arrow-up"></i> ${calculatePercentageChange('shares')}% from last month`;
    }

    // Calculate percentage change for stats
    function calculatePercentageChange() {
        return Math.floor(Math.random() * 20) + 1;
    }

    // Update the posts table
    function updatePostsTable() {
        if (!postsTable) return;
        
        postsTable.innerHTML = '';
        
        if (blogPosts.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="6" class="no-posts">
                    <i class="fas fa-pen-fancy"></i>
                    <p>You haven't created any posts yet</p>
                    <a href="create-blog.html" class="btn btn-outline">Create First Post</a>
                </td>
            `;
            postsTable.appendChild(row);
            return;
        }
        
        // Sort by most recent first
        const sortedPosts = [...blogPosts].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt));
        
        sortedPosts.forEach(post => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <a href="#" class="post-title">${post.title || 'Untitled Post'}</a>
                    ${post.categories && post.categories.length > 0 ? 
                        `<span class="post-category">${post.categories[0]}</span>` : 
                        '<span class="post-category">Uncategorized</span>'
                    }
                </td>
                <td><span class="badge ${post.status || 'draft'}">${capitalizeFirstLetter(post.status || 'draft')}</span></td>
                <td>${(post.stats?.views || 0).toLocaleString()}</td>
                <td>${(post.stats?.comments || 0).toLocaleString()}</td>
                <td>${formatDate(post.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit-post" data-id="${post._id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon view-post" data-id="${post._id}" title="View">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="btn-icon post-stats" data-id="${post._id}" title="Stats">
                            <i class="fas fa-chart-bar"></i>
                        </button>
                    </div>
                </td>
            `;
            postsTable.appendChild(row);
        });
    }

    // Update the activity feed
    function updateActivityFeed() {
        if (!activityFeed) return;
        
        activityFeed.innerHTML = '';
        
        if (blogPosts.length === 0) {
            const item = document.createElement('div');
            item.className = 'activity-item empty';
            item.innerHTML = `
                <div class="activity-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="activity-content">
                    <p>No recent activity. Create your first post to get started!</p>
                </div>
            `;
            activityFeed.appendChild(item);
            return;
        }
        
        // Get most recent 4 posts for activity feed
        const recentPosts = [...blogPosts]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4);
        
        recentPosts.forEach(post => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${post.status === 'published' ? 'fa-check-circle' : 'fa-pen'}"></i>
                </div>
                <div class="activity-content">
                    <p>${post.status === 'published' ? 
                        `Published post "${post.title || 'Untitled Post'}"` : 
                        `Created draft "${post.title || 'Untitled Post'}"`}</p>
                    <span class="activity-time">${formatActivityTime(post.createdAt)}</span>
                </div>
            `;
            activityFeed.appendChild(item);
        });
    }

    // Update the welcome message
    function updateWelcomeMessage() {
        if (welcomeContent) {
            welcomeContent.textContent = `Welcome back, ${currentUser.name}!`;
        }
        
        if (welcomeSubtext) {
            const draftCount = blogPosts.filter(post => post.status === 'draft').length;
            const publishedCount = blogPosts.filter(post => post.status === 'published').length;
            
            let latestPostViews = 0;
            if (publishedCount > 0) {
                const latestPublished = blogPosts
                    .filter(post => post.status === 'published')
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                latestPostViews = latestPublished.stats?.views || 0;
            }
            
            welcomeSubtext.innerHTML = `
                You have ${draftCount} ${draftCount === 1 ? 'draft' : 'drafts'} 
                and ${publishedCount} published ${publishedCount === 1 ? 'post' : 'posts'}.<br>
                ${publishedCount > 0 ? `Your latest post got ${latestPostViews} views.` : ''}
            `;
        }
    }

    // Helper functions
    function capitalizeFirstLetter(string) {
        return string?.charAt(0).toUpperCase() + string?.slice(1) || '';
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    function formatActivityTime(dateString) {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffHours <= 1) return 'Just now';
        if (diffHours <= 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
        return formatDate(dateString);
    }

    function showLoadingState(show) {
        const loader = document.querySelector('.loader-overlay') || createLoader();
        loader.style.display = show ? 'flex' : 'none';
    }

    function createLoader() {
        const loader = document.createElement('div');
        loader.className = 'loader-overlay';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <p>Loading your blog posts...</p>
        `;
        document.body.appendChild(loader);
        return loader;
    }

    function showErrorState(message) {
        const existingError = document.querySelector('.error-banner');
        if (existingError) existingError.remove();
        
        const errorBanner = document.createElement('div');
        errorBanner.className = 'error-banner';
        errorBanner.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button class="btn-icon close-error"><i class="fas fa-times"></i></button>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.prepend(errorBanner);
            
            errorBanner.querySelector('.close-error').addEventListener('click', () => {
                errorBanner.remove();
            });
        }
    }

    // Set up all event listeners
    function setupEventListeners() {
        // Sidebar toggle
        sidebarToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        });
        
        // User dropdown
        if (userDropdown) {
            userDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
                const menu = userDropdown.querySelector('.dropdown-menu');
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            });
        }
        
        // Post action buttons
        if (postsTable) {
            postsTable.addEventListener('click', handlePostActions);
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            const menu = document.querySelector('.dropdown-menu');
            if (menu) menu.style.display = 'none';
        });
    }

    // Handle post actions
    function handlePostActions(e) {
        const button = e.target.closest('.btn-icon');
        if (!button) return;
        
        const postId = button.dataset.id;
        const post = blogPosts.find(p => p._id === postId);
        
        if (!post) {
            showErrorState('Post not found');
            return;
        }
        
        if (button.classList.contains('edit-post')) {
            window.location.href = `edit-blog.html?id=${postId}`;
        } else if (button.classList.contains('view-post')) {
            window.open(`/blog/${post._id}`, '_blank');
        } else if (button.classList.contains('post-stats')) {
            showPostStatsModal(post);
        }
    }

    // Show post stats modal
    function showPostStatsModal(post) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Post Analytics: ${post.title || 'Untitled Post'}</h3>
                    <button class="btn-icon close-modal"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-eye"></i>
                            </div>
                            <div class="stat-info">
                                <h3>${(post.stats?.views || 0).toLocaleString()}</h3>
                                <p>Total Views</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-thumbs-up"></i>
                            </div>
                            <div class="stat-info">
                                <h3>${(post.stats?.likes || 0).toLocaleString()}</h3>
                                <p>Likes</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-comment"></i>
                            </div>
                            <div class="stat-info">
                                <h3>${(post.stats?.comments || 0).toLocaleString()}</h3>
                                <p>Comments</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-share-alt"></i>
                            </div>
                            <div class="stat-info">
                                <h3>${(post.stats?.shares || 0).toLocaleString()}</h3>
                                <p>Shares</p>
                            </div>
                        </div>
                    </div>
                    <div class="chart-placeholder">
                        <p><i class="fas fa-chart-line"></i> Engagement chart would appear here</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
});