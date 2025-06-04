// DOM Elements
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const navLinks = document.querySelectorAll('.nav-links a');
const billingToggle = document.getElementById('billing-toggle');
const testimonials = document.querySelectorAll('.testimonial');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.querySelector('.slider-prev');
const nextBtn = document.querySelector('.slider-next');
const statsNumbers = document.querySelectorAll('.number');
const videoPlaceholder = document.querySelector('.video-placeholder');
const playButton = document.querySelector('.play-button');

// Mobile Menu Toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
});

// Close mobile menu when clicking a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
    });
});

// Update the checkAuthStatus function to handle roles
function checkAuthStatus() {
    const token = localStorage.getItem('blogzone_token');
    const user = JSON.parse(localStorage.getItem('blogzone_user'));
    
    const authButtons = document.querySelector('.auth-buttons');
    const mobileAuthButtons = document.querySelector('.mobile-menu ul li:last-child');
    const mobileAuthButtons2 = document.querySelector('.mobile-menu ul li:nth-last-child(2)');
    
    if (token && user) {
        // User is logged in - show appropriate dashboard based on role
        if (authButtons) {
            authButtons.innerHTML = `
                <span class="user-avatar">
                    <img src="${user.avatar || 'assets/images/default-avatar.jpg'}" alt="${user.name}">
                </span>
                <button class="btn btn-outline" id="logout-btn">Log Out</button>
                <a href="${user.role === 'writer' ? '/dashboard.html' : '/reader-dashboard.html'}" 
                   class="btn btn-primary">
                   ${user.role === 'writer' ? 'Writer Dashboard' : 'Reader Dashboard'}
                </a>
            `;
        }
        
        if (mobileAuthButtons && mobileAuthButtons2) {
            mobileAuthButtons.remove();
            mobileAuthButtons2.remove();
            
            const mobileMenuUl = document.querySelector('.mobile-menu ul');
            mobileMenuUl.innerHTML += `
                <li>
                    <span class="user-avatar-mobile">
                        <img src="${user.avatar || 'assets/images/default-avatar.jpg'}" alt="${user.name}">
                        <span>${user.name}</span>
                    </span>
                </li>
                <li><button class="btn btn-outline mobile-logout-btn">Log Out</button></li>
                <li>
                    <a href="${user.role === 'writer' ? '/dashboard.html' : '/reader-dashboard.html'}" 
                       class="btn-primary">
                       ${user.role === 'writer' ? 'Writer Dashboard' : 'Reader Dashboard'}
                    </a>
                </li>
            `;
        }
        
        // Hide the role selector if user is logged in
        const roleSelector = document.querySelector('.role-selector');
        if (roleSelector) roleSelector.style.display = 'none';
    } else {
        // Show witty microcopy based on scroll position
        window.addEventListener('scroll', () => {
            const writerCard = document.getElementById('writer-role');
            const readerCard = document.getElementById('reader-role');
            const scrollY = window.scrollY;
            
            if (scrollY > 200) {
                writerCard.querySelector('p').textContent = "Still thinking? Your future readers are waiting!";
                readerCard.querySelector('p').textContent = "The perfect article might be just one click away";
            }
        });
    }
}

// Add role selection handlers
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    
    // Role selection buttons
    document.querySelectorAll('.role-card button').forEach(button => {
        button.addEventListener('click', function() {
            const isWriter = this.closest('.role-card').id === 'writer-role';
            
            // Store intended role in localStorage temporarily
            localStorage.setItem('intended_role', isWriter ? 'writer' : 'reader');
            
            // Animate the selection
            this.closest('.role-card').classList.add('role-selected');
            setTimeout(() => {
                window.location.href = isWriter ? 'signup-writer.html' : 'signup-reader.html';
            }, 500);
        });
    });
    
    // Rest of your existing code...
});



// Logout function
function handleLogout() {
    localStorage.removeItem('blogzone_token');
    localStorage.removeItem('blogzone_user');
    window.location.href = '/index.html'; // Redirect to homepage after logout
}

// Add event listeners for logout buttons
document.addEventListener('click', (e) => {
    if (e.target.id === 'logout-btn' || e.target.classList.contains('mobile-logout-btn')) {
        handleLogout();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    
    // Rest of your existing DOMContentLoaded code...
});

// Pricing Toggle Switch
billingToggle.addEventListener('change', function() {
    const monthlyPrices = document.querySelectorAll('.price .amount');
    monthlyPrices.forEach(price => {
        if (this.checked) {
            // Switch to yearly pricing (20% discount)
            const monthlyValue = parseInt(price.textContent);
            const yearlyValue = Math.floor(monthlyValue * 12 * 0.8);
            price.textContent = yearlyValue;
            price.nextElementSibling.textContent = '/year';
        } else {
            // Switch back to monthly pricing
            if (price.textContent === '0') return;
            
            const yearlyValue = parseInt(price.textContent);
            const monthlyValue = Math.floor(yearlyValue / 12 / 0.8);
            price.textContent = monthlyValue;
            price.nextElementSibling.textContent = '/month';
        }
    });
});

// Testimonials Slider
let currentTestimonial = 0;

function showTestimonial(index) {
    testimonials.forEach(testimonial => testimonial.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    testimonials[index].classList.add('active');
    dots[index].classList.add('active');
    currentTestimonial = index;
}

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        showTestimonial(index);
    });
});

prevBtn.addEventListener('click', () => {
    currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
    showTestimonial(currentTestimonial);
});

nextBtn.addEventListener('click', () => {
    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
    showTestimonial(currentTestimonial);
});

// Auto-rotate testimonials
setInterval(() => {
    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
    showTestimonial(currentTestimonial);
}, 5000);

// Animate stats numbers
function animateStats() {
    statsNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16); // 60fps
        
        let current = 0;
        const increment = () => {
            current += step;
            if (current < target) {
                stat.textContent = Math.floor(current);
                requestAnimationFrame(increment);
            } else {
                stat.textContent = target;
            }
        };
        
        increment();
    });
}

// Video placeholder click handler
videoPlaceholder.addEventListener('click', () => {
    // In a real implementation, this would load the video player
    alert('Video player would launch here in the full implementation');
});

// Play button hover effect
playButton.addEventListener('mouseenter', () => {
    playButton.classList.add('pulse');
});

playButton.addEventListener('mouseleave', () => {
    playButton.classList.remove('pulse');
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Initialize animations when elements come into view
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            
            // Special case for stats numbers
            if (entry.target.classList.contains('stats')) {
                animateStats();
            }
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-card, .stats').forEach(el => {
    observer.observe(el);
});

// Initialize the first testimonial
showTestimonial(0);

// Scroll to top button
const scrollToTopBtn = document.createElement('button');
scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
scrollToTopBtn.classList.add('scroll-to-top');
scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

document.body.appendChild(scrollToTopBtn);

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('show');
    } else {
        scrollToTopBtn.classList.remove('show');
    }
});

// Add styles for scroll-to-top button
const scrollToTopStyles = document.createElement('style');
scrollToTopStyles.textContent = `
    .scroll-to-top {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: var(--primary-color);
        color: white;
        border: none;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 999;
    }
    
    .scroll-to-top.show {
        opacity: 1;
        visibility: visible;
    }
    
    .scroll-to-top:hover {
        background-color: var(--primary-dark);
        transform: translateY(-3px);
    }
`;

document.head.appendChild(scrollToTopStyles);