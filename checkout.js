// checkout.js - Handles checkout process and payment integration

class CheckoutManager {
    constructor() {
        this.cart = [];
        this.subtotal = 0;
        this.tax = 0;
        this.shipping = 0;
        this.total = 0;
        this.selectedPaymentMethod = '';
        
        // Initialize payment gateways
        this.razorpay = null;
        this.stripe = null;
        this.paypal = null;
        
        this.init();
    }
    
    init() {
        this.loadCart();
        this.setupEventListeners();
        this.initPaymentGateways();
    }
    
    async loadCart() {
        try {
            const response = await fetch('get_cart.php');
            if (response.ok) {
                const data = await response.json();
                this.cart = data.items || [];
                this.calculateTotals();
                this.renderCart();
            } else {
                this.showError('Failed to load cart. Please try again.');
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            this.showError('Failed to load cart. Please try again.');
        }
    }
    
    calculateTotals() {
        // Calculate subtotal
        this.subtotal = this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
        
        // Calculate tax (assuming 5% tax rate)
        this.tax = this.subtotal * 0.05;
        
        // Calculate shipping (free shipping over ₹500)
        this.shipping = this.subtotal > 500 ? 0 : 50;
        
        // Calculate total
        this.total = this.subtotal + this.tax + this.shipping;
        
        // Update totals in UI
        document.getElementById('subtotal').textContent = `₹${this.subtotal.toFixed(2)}`;
        document.getElementById('tax').textContent = `₹${this.tax.toFixed(2)}`;
        document.getElementById('shipping').textContent = this.shipping > 0 ? `₹${this.shipping.toFixed(2)}` : 'Free';
        document.getElementById('total').textContent = `₹${this.total.toFixed(2)}`;
    }
    
    renderCart() {
        const cartContainer = document.getElementById('cartItems');
        if (!cartContainer) return;
        
        if (this.cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <p class="lead">Your cart is empty</p>
                    <a href="index.html" class="btn btn-primary-custom">Continue Shopping</a>
                </div>
            `;
            return;
        }
        
        cartContainer.innerHTML = this.cart.map(item => `
            <div class="card mb-3 cart-item">
                <div class="row g-0">
                    <div class="col-md-2">
                        <img src="${item.image_url || 'medicine1.jpg'}" class="img-fluid rounded-start" alt="${item.name}">
                    </div>
                    <div class="col-md-10">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <h5 class="card-title">${item.name}</h5>
                                <button class="btn btn-sm text-danger remove-item" data-product-id="${item.product_id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <p class="card-text text-muted small">${item.description || 'Natural plant-based medicine'}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="input-group input-group-sm quantity-control" style="max-width: 120px;">
                                    <button class="btn btn-outline-secondary decrease-quantity" type="button" data-product-id="${item.product_id}">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <input type="text" class="form-control text-center quantity-input" value="${item.quantity}" readonly>
                                    <button class="btn btn-outline-secondary increase-quantity" type="button" data-product-id="${item.product_id}">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                                <p class="card-text fw-bold mb-0">₹${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to cart items
        this.attachCartItemListeners();
    }
    
    attachCartItemListeners() {
        // Remove item buttons
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                this.removeItem(productId);
            });
        });
        
        // Decrease quantity buttons
        document.querySelectorAll('.decrease-quantity').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                this.updateItemQuantity(productId, -1);
            });
        });
        
        // Increase quantity buttons
        document.querySelectorAll('.increase-quantity').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                this.updateItemQuantity(productId, 1);
            });
        });
    }
    
    async removeItem(productId) {
        try {
            const response = await fetch('update_cart.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ product_id: productId, action: 'remove' })
            });
            
            if (response.ok) {
                // Remove item from cart array
                this.cart = this.cart.filter(item => item.product_id != productId);
                this.calculateTotals();
                this.renderCart();
                this.showToast('Item removed from cart', 'success');
            } else {
                this.showError('Failed to remove item. Please try again.');
            }
        } catch (error) {
            console.error('Error removing item:', error);
            this.showError('Failed to remove item. Please try again.');
        }
    }
    
    async updateItemQuantity(productId, change) {
        // Find item in cart
        const item = this.cart.find(item => item.product_id == productId);
        if (!item) return;
        
        // Calculate new quantity
        const newQuantity = item.quantity + change;
        
        // Ensure quantity is at least 1
        if (newQuantity < 1) return;
        
        try {
            const response = await fetch('update_cart.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    product_id: productId, 
                    action: 'update',
                    quantity: newQuantity
                })
            });
            
            if (response.ok) {
                // Update item quantity in cart array
                item.quantity = newQuantity;
                this.calculateTotals();
                this.renderCart();
            } else {
                this.showError('Failed to update quantity. Please try again.');
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            this.showError('Failed to update quantity. Please try again.');
        }
    }
    
    setupEventListeners() {
        // Payment method selection
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                document.querySelectorAll('.payment-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Set selected payment method
                this.selectedPaymentMethod = option.dataset.method;
                
                // Show appropriate payment form
                this.showPaymentForm(this.selectedPaymentMethod);
            });
        });
        
        // Place order button
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', () => {
                this.processPayment();
            });
        }
        
        // Back to cart button
        const backToCartBtn = document.getElementById('backToCartBtn');
        if (backToCartBtn) {
            backToCartBtn.addEventListener('click', () => {
                window.location.href = 'index.html#cart';
            });
        }
    }
    
    showPaymentForm(method) {
        // Hide all payment forms
        document.querySelectorAll('.payment-form').forEach(form => {
            form.style.display = 'none';
        });
        
        // Show selected payment form
        const selectedForm = document.getElementById(`${method}Form`);
        if (selectedForm) {
            selectedForm.style.display = 'block';
        }
    }
    
    initPaymentGateways() {
        // Initialize Razorpay
        if (window.Razorpay) {
            this.razorpay = new Razorpay({
                key: 'rzp_test_YourTestKey', // Replace with your actual key
                image: 'https://i.imgur.com/n5tjHFD.png',
                theme: { color: '#1cca64' }
            });
        }
        
        // Initialize Stripe
        if (window.Stripe) {
            this.stripe = Stripe('pk_test_YourTestKey'); // Replace with your actual key
            const elements = this.stripe.elements();
            
            // Create card element
            const cardElement = elements.create('card', {
                style: {
                    base: {
                        iconColor: '#1cca64',
                        color: '#111714',
                        fontWeight: '500',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '16px',
                        '::placeholder': {
                            color: '#6c757d',
                        },
                    },
                },
            });
            
            // Mount card element
            const cardElementContainer = document.getElementById('stripe-card-element');
            if (cardElementContainer) {
                cardElement.mount('#stripe-card-element');
            }
        }
        
        // Initialize PayPal
        if (window.paypal) {
            paypal.Buttons({
                createOrder: (data, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: (this.total / 80).toFixed(2) // Convert INR to USD (approximate)
                            }
                        }]
                    });
                },
                onApprove: (data, actions) => {
                    return actions.order.capture().then(details => {
                        this.completeOrder('paypal', details.id);
                    });
                }
            }).render('#paypal-button-container');
        }
    }
    
    processPayment() {
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        // Process payment based on selected method
        switch (this.selectedPaymentMethod) {
            case 'razorpay':
                this.processRazorpayPayment();
                break;
            case 'stripe':
                this.processStripePayment();
                break;
            case 'cod':
                this.processCodPayment();
                break;
            default:
                this.showError('Please select a payment method');
        }
    }
    
    validateForm() {
        // Get form elements
        const nameInput = document.getElementById('customerName');
        const emailInput = document.getElementById('customerEmail');
        const phoneInput = document.getElementById('customerPhone');
        const addressInput = document.getElementById('customerAddress');
        
        // Validate name
        if (!nameInput || !nameInput.value.trim()) {
            this.showError('Please enter your name');
            return false;
        }
        
        // Validate email
        if (!emailInput || !emailInput.value.trim() || !this.validateEmail(emailInput.value)) {
            this.showError('Please enter a valid email address');
            return false;
        }
        
        // Validate phone
        if (!phoneInput || !phoneInput.value.trim() || !this.validatePhone(phoneInput.value)) {
            this.showError('Please enter a valid phone number');
            return false;
        }
        
        // Validate address
        if (!addressInput || !addressInput.value.trim()) {
            this.showError('Please enter your address');
            return false;
        }
        
        // Validate payment method
        if (!this.selectedPaymentMethod) {
            this.showError('Please select a payment method');
            return false;
        }
        
        return true;
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    validatePhone(phone) {
        const re = /^[0-9]{10}$/;
        return re.test(phone);
    }
    
    processRazorpayPayment() {
        if (!this.razorpay) {
            this.showError('Razorpay is not initialized');
            return;
        }
        
        // Get customer details
        const name = document.getElementById('customerName').value;
        const email = document.getElementById('customerEmail').value;
        const phone = document.getElementById('customerPhone').value;
        
        // Create order options
        const options = {
            amount: this.total * 100, // Amount in paise
            currency: 'INR',
            name: 'Esakki\'s Plant Medicine',
            description: 'Purchase of plant medicines',
            image: 'https://i.imgur.com/n5tjHFD.png',
            handler: (response) => {
                this.completeOrder('razorpay', response.razorpay_payment_id);
            },
            prefill: {
                name: name,
                email: email,
                contact: phone
            },
            theme: {
                color: '#1cca64'
            }
        };
        
        // Open Razorpay checkout
        this.razorpay.open(options);
    }
    
    async processStripePayment() {
        if (!this.stripe) {
            this.showError('Stripe is not initialized');
            return;
        }
        
        // Show loading state
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.disabled = true;
            placeOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        }
        
        try {
            // Create payment intent on server
            const response = await fetch('create_payment_intent.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ amount: this.total })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create payment intent');
            }
            
            const data = await response.json();
            
            // Confirm card payment
            const result = await this.stripe.confirmCardPayment(data.client_secret, {
                payment_method: {
                    card: this.cardElement,
                    billing_details: {
                        name: document.getElementById('customerName').value,
                        email: document.getElementById('customerEmail').value,
                        phone: document.getElementById('customerPhone').value,
                        address: {
                            line1: document.getElementById('customerAddress').value
                        }
                    }
                }
            });
            
            if (result.error) {
                throw new Error(result.error.message);
            } else if (result.paymentIntent.status === 'succeeded') {
                this.completeOrder('stripe', result.paymentIntent.id);
            }
        } catch (error) {
            console.error('Payment error:', error);
            this.showError(error.message || 'Payment failed. Please try again.');
            
            // Reset button state
            if (placeOrderBtn) {
                placeOrderBtn.disabled = false;
                placeOrderBtn.innerHTML = 'Place Order';
            }
        }
    }
    
    processCodPayment() {
        // For COD, just complete the order
        this.completeOrder('cod', 'COD-' + Date.now());
    }
    
    async completeOrder(paymentMethod, transactionId) {
        try {
            // Get customer details
            const customerData = {
                name: document.getElementById('customerName').value,
                email: document.getElementById('customerEmail').value,
                phone: document.getElementById('customerPhone').value,
                address: document.getElementById('customerAddress').value,
                payment_method: paymentMethod,
                transaction_id: transactionId,
                amount: this.total
            };
            
            // Send order to server
            const response = await fetch('place_order.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(customerData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to place order');
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Redirect to success page
                window.location.href = 'order-success.html?orderId=' + transactionId;
            } else {
                throw new Error(data.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Order error:', error);
            this.showError(error.message || 'Failed to place order. Please try again.');
        }
    }
    
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
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
        toastContainer.appendChild(toast);
        
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
            
            // Insert at top of checkout form
            const checkoutForm = document.querySelector('.checkout-form');
            if (checkoutForm) {
                checkoutForm.prepend(container);
            } else {
                document.body.prepend(container);
            }
        }
    }
}

// Initialize checkout manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add script to checkout.html
    const script = document.createElement('script');
    script.src = 'checkout.js';
    document.head.appendChild(script);
    
    new CheckoutManager();
});