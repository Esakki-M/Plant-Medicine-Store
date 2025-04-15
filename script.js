// script.js (Enhanced)
class StoreFront {
    constructor() {
        this.cartCount = 0;
        this.init();
    }

    init() {
        this.initCarousel();
        this.loadProducts();
        this.setupEventListeners();
        this.updateCartCounter();
        this.loadCartCount();
    }
    
    setupEventListeners() {
        // Setup navigation and UI interactions
        const navbarToggler = document.querySelector('.navbar-toggler');
        if (navbarToggler) {
            navbarToggler.addEventListener('click', () => {
                document.querySelector('.navbar-collapse').classList.toggle('show');
            });
        }
        
        // Handle checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                window.location.href = 'checkout.html';
            });
        }
        
        // Handle scroll effects
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }
        });
    }
    
    async loadCartCount() {
        try {
            const response = await fetch('get_cart_count.php');
            if (response.ok) {
                const data = await response.json();
                this.cartCount = data.count || 0;
                this.updateCartCounter();
            }
        } catch (error) {
            console.error('Error loading cart count:', error);
        }
    }

    initCarousel() {
        // Fetch featured products and initialize carousel
        fetch('fetch_featured.php')
            .then(response => response.json())
            .then(featuredProducts => {
                // Initialize Swiper carousel
                const swiperContainer = document.querySelector('.swiper-container');
                if (swiperContainer) {
                    // Populate carousel with featured products
                    const swiperWrapper = swiperContainer.querySelector('.swiper-wrapper');
                    if (swiperWrapper) {
                        swiperWrapper.innerHTML = featuredProducts.map(product => `
                            <div class="swiper-slide">
                                <div class="featured-product-card">
                                    <div class="badge-container">
                                        ${product.stock > 0 ? 
                                            `<span class="badge bg-success">In Stock</span>` : 
                                            `<span class="badge bg-secondary">Out of Stock</span>`
                                        }
                                    </div>
                                    <img src="${product.image_url}" alt="${product.name}" class="img-fluid">
                                    <div class="featured-product-info">
                                        <h4>${product.name}</h4>
                                        <p class="price">₹${product.price.toFixed(2)}</p>
                                        <button class="btn btn-primary-custom btn-sm add-to-cart" 
                                                ${product.stock <= 0 ? 'disabled' : ''}
                                                data-product-id="${product.id}">
                                            ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('');
                    }
                    
                    // Initialize Swiper
                    new Swiper('.swiper-container', {
                        slidesPerView: 1,
                        spaceBetween: 20,
                        loop: true,
                        autoplay: {
                            delay: 3000,
                            disableOnInteraction: false,
                        },
                        pagination: {
                            el: '.swiper-pagination',
                            clickable: true,
                        },
                        navigation: {
                            nextEl: '.swiper-button-next',
                            prevEl: '.swiper-button-prev',
                        },
                        breakpoints: {
                            640: {
                                slidesPerView: 2,
                            },
                            992: {
                                slidesPerView: 3,
                            },
                            1200: {
                                slidesPerView: 4,
                            },
                        },
                    });
                }
            })
            .catch(error => {
                this.showError('Failed to load featured products.');
                console.error('Error loading featured products:', error);
            });
    }

    async loadProducts() {
        try {
            const response = await fetch('fetch_products.php');
            const products = await response.json();
            
            this.renderProducts(products);
            this.attachProductInteractions();
            this.initFiltering();
            
        } catch (error) {
            this.showError('Failed to load products. Please try again later.');
        }
    }

    renderProducts(products) {
        const productList = document.getElementById('productList');
        productList.innerHTML = products.map(product => `
            <div class="col-md-4 col-lg-3">
                <div class="product-card position-relative ${product.stock <= 0 ? 'out-of-stock' : ''}">
                    ${product.stock > 0 ? 
                        `<div class="stock-badge">In Stock: ${product.stock}</div>` : 
                        `<div class="stock-badge bg-secondary">Out of Stock</div>`
                    }
                    <img src="${product.image_url}" class="card-img-top" alt="${product.name}" loading="lazy">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">₹${product.price.toFixed(2)}</p>
                        <div class="d-grid gap-2">
                            <button class="btn btn-success add-to-cart" 
                                    ${product.stock <= 0 ? 'disabled' : ''}
                                    data-product-id="${product.id}">
                                ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                            <button class="btn btn-outline-secondary wishlist-btn" 
                                    data-product-id="${product.id}">
                                Wishlist
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    attachProductInteractions() {
        // Add event listeners for cart/wishlist with proper error handling
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        const wishlistButtons = document.querySelectorAll('.wishlist-btn');
        
        // Add to cart functionality
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.productId;
                if (productId) {
                    this.handleAddToCart(productId);
                    
                    // Visual feedback
                    button.innerHTML = '<i class="fas fa-check"></i> Added';
                    setTimeout(() => {
                        button.innerHTML = 'Add to Cart';
                    }, 2000);
                }
            });
        });
        
        // Wishlist functionality
        wishlistButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.productId;
                if (productId) {
                    // Toggle wishlist status
                    if (button.classList.contains('active')) {
                        button.classList.remove('active');
                        button.innerHTML = 'Wishlist';
                        this.showToast('Removed from wishlist', 'info');
                    } else {
                        button.classList.add('active');
                        button.innerHTML = '<i class="fas fa-heart"></i> Wishlisted';
                        this.showToast('Added to wishlist', 'success');
                    }
                    
                    // Update wishlist in backend (can be implemented later)
                    fetch('update_wishlist.php', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ product_id: productId })
                    }).catch(error => {
                        console.error('Error updating wishlist:', error);
                    });
                }
            });
        });
    }

    initFiltering() {
        // Implement client-side filtering/sorting
        const sortSelect = document.getElementById('sortOptions');
        const categoryFilters = document.querySelectorAll('.category-filter');
        const priceRangeSlider = document.getElementById('priceRange');
        const searchInput = document.getElementById('searchProducts');
        
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.applyFilters());
        }
        
        if (categoryFilters.length > 0) {
            categoryFilters.forEach(filter => {
                filter.addEventListener('click', () => {
                    // Toggle active class
                    if (filter.classList.contains('active')) {
                        filter.classList.remove('active');
                    } else {
                        filter.classList.add('active');
                    }
                    this.applyFilters();
                });
            });
        }
        
        if (priceRangeSlider) {
            priceRangeSlider.addEventListener('input', () => {
                const priceDisplay = document.getElementById('priceRangeValue');
                if (priceDisplay) {
                    priceDisplay.textContent = `₹${priceRangeSlider.value}`;
                }
            });
            
            priceRangeSlider.addEventListener('change', () => this.applyFilters());
        }
        
        if (searchInput) {
            // Debounce search to avoid too many filter operations
            let debounceTimer;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => this.applyFilters(), 300);
            });
        }
    }
    
    applyFilters() {
        // Get all products
        const productCards = document.querySelectorAll('.product-card');
        if (!productCards.length) return;
        
        // Get filter values
        const sortSelect = document.getElementById('sortOptions');
        const activeCategories = Array.from(document.querySelectorAll('.category-filter.active'))
            .map(el => el.dataset.category);
        const priceRange = document.getElementById('priceRange');
        const searchInput = document.getElementById('searchProducts');
        
        const sortValue = sortSelect ? sortSelect.value : 'default';
        const maxPrice = priceRange ? parseInt(priceRange.value) : 10000;
        const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
        
        // Apply filters to each product
        productCards.forEach(card => {
            const productContainer = card.closest('.col-md-4');
            if (!productContainer) return;
            
            const price = parseFloat(card.querySelector('.card-text').textContent.replace('₹', ''));
            const name = card.querySelector('.card-title').textContent.toLowerCase();
            const category = card.dataset.category || '';
            
            // Check if product passes all filters
            const passesCategory = activeCategories.length === 0 || activeCategories.includes(category);
            const passesPrice = price <= maxPrice;
            const passesSearch = searchQuery === '' || name.includes(searchQuery);
            
            // Show/hide based on filter results
            if (passesCategory && passesPrice && passesSearch) {
                productContainer.style.display = 'block';
            } else {
                productContainer.style.display = 'none';
            }
        });
        
        // Apply sorting if needed
        if (sortValue !== 'default' && sortSelect) {
            const productList = document.getElementById('productList');
            const products = Array.from(productList.children);
            
            products.sort((a, b) => {
                const priceA = parseFloat(a.querySelector('.card-text').textContent.replace('₹', ''));
                const priceB = parseFloat(b.querySelector('.card-text').textContent.replace('₹', ''));
                
                if (sortValue === 'price-low-high') {
                    return priceA - priceB;
                } else if (sortValue === 'price-high-low') {
                    return priceB - priceA;
                }
                return 0;
            });
            
            // Re-append sorted products
            products.forEach(product => productList.appendChild(product));
        }
    }

    async handleAddToCart(productId) {
        try {
            const response = await fetch('add_to_cart.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ product_id: productId })
            });
            
            if (response.ok) {
                this.cartCount++;
                this.updateCartCounter();
                this.showToast('Added to cart successfully!', 'success');
            } else {
                throw new Error('Failed to add to cart');
            }
        } catch (error) {
            this.showToast('Error adding to cart. Please try again.', 'error');
        }
    }

    updateCartCounter() {
        const counter = document.getElementById('cartCounter');
        if (counter) {
            counter.textContent = this.cartCount;
            counter.classList.add('animate__animated', 'animate__bounceIn');
            setTimeout(() => counter.classList.remove('animate__bounceIn'), 500);
        }
    }

    showToast(message, type = 'info') {
        // Implement toast notification system
        const toastContainer = document.getElementById('toastContainer');
        
        // Create toast container if it doesn't exist
        if (!toastContainer) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(container);
        }
        
        // Create toast element
        const toastId = `toast-${Date.now()}`;
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${this.getToastColorClass(type)} border-0`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        // Toast content
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="${this.getToastIcon(type)} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        // Add toast to container
        document.getElementById('toastContainer').appendChild(toast);
        
        // Initialize and show toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
    
    getToastColorClass(type) {
        switch (type) {
            case 'success': return 'success';
            case 'error': return 'danger';
            case 'warning': return 'warning';
            default: return 'info';
        }
    }
    
    getToastIcon(type) {
        switch (type) {
            case 'success': return 'fas fa-check-circle';
            case 'error': return 'fas fa-exclamation-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            default: return 'fas fa-info-circle';
        }
    }

    showError(message) {
        // Implement error display system
        const errorContainer = document.getElementById('errorContainer');
        
        if (errorContainer) {
            // Update existing error container
            errorContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
        } else {
            // Create new error container
            const container = document.createElement('div');
            container.id = 'errorContainer';
            container.className = 'container mt-3';
            container.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            
            // Insert after header or at beginning of main content
            const header = document.querySelector('header');
            if (header && header.nextElementSibling) {
                header.parentNode.insertBefore(container, header.nextElementSibling);
            } else {
                const main = document.querySelector('main');
                if (main) {
                    main.prepend(container);
                } else {
                    document.body.prepend(container);
                }
            }
        }
        
        // Scroll to error
        document.getElementById('errorContainer').scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize storefront when DOM is ready
document.addEventListener('DOMContentLoaded', () => new StoreFront());