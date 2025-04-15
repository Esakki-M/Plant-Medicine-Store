// order-success.js - Handles order success page functionality

class OrderSuccessManager {
    constructor() {
        this.orderId = null;
        this.orderDetails = null;
        this.init();
    }
    
    init() {
        this.getOrderIdFromUrl();
        this.loadOrderDetails();
        this.setupEventListeners();
    }
    
    getOrderIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        this.orderId = urlParams.get('order_id');
        
        // Display order ID on page
        const orderIdElement = document.getElementById('orderId');
        if (orderIdElement && this.orderId) {
            orderIdElement.textContent = this.orderId;
        }
    }
    
    async loadOrderDetails() {
        if (!this.orderId) return;
        
        try {
            const response = await fetch(`get_order_details.php?order_id=${this.orderId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.orderDetails = data.order;
                    this.renderOrderDetails();
                } else {
                    this.showError(data.message || 'Failed to load order details');
                }
            } else {
                this.showError('Failed to load order details. Please try again.');
            }
        } catch (error) {
            console.error('Error loading order details:', error);
            this.showError('Failed to load order details. Please try again.');
        }
    }
    
    renderOrderDetails() {
        if (!this.orderDetails) return;
        
        // Update customer details
        document.getElementById('customerName').textContent = this.orderDetails.customer_name || 'N/A';
        document.getElementById('customerEmail').textContent = this.orderDetails.customer_email || 'N/A';
        document.getElementById('customerPhone').textContent = this.orderDetails.customer_phone || 'N/A';
        document.getElementById('shippingAddress').textContent = this.orderDetails.shipping_address || 'N/A';
        
        // Update payment details
        document.getElementById('paymentMethod').textContent = this.formatPaymentMethod(this.orderDetails.payment_method);
        document.getElementById('transactionId').textContent = this.orderDetails.transaction_id || 'N/A';
        document.getElementById('orderDate').textContent = this.formatDate(this.orderDetails.created_at);
        document.getElementById('orderStatus').textContent = this.formatOrderStatus(this.orderDetails.order_status);
        
        // Update order items
        const orderItemsContainer = document.getElementById('orderItems');
        if (orderItemsContainer && this.orderDetails.items && this.orderDetails.items.length > 0) {
            orderItemsContainer.innerHTML = this.orderDetails.items.map(item => `
                <div class="card mb-2">
                    <div class="card-body py-2">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <h6 class="mb-0">${item.product_name}</h6>
                            </div>
                            <div class="col-md-2 text-center">
                                <span class="text-muted">Qty: ${item.quantity}</span>
                            </div>
                            <div class="col-md-2 text-center">
                                <span class="text-muted">₹${parseFloat(item.price).toFixed(2)}</span>
                            </div>
                            <div class="col-md-2 text-end">
                                <span class="fw-bold">₹${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        // Update order totals
        document.getElementById('subtotal').textContent = `₹${parseFloat(this.orderDetails.subtotal || 0).toFixed(2)}`;
        document.getElementById('tax').textContent = `₹${parseFloat(this.orderDetails.tax || 0).toFixed(2)}`;
        document.getElementById('shipping').textContent = parseFloat(this.orderDetails.shipping || 0) > 0 ? 
            `₹${parseFloat(this.orderDetails.shipping).toFixed(2)}` : 'Free';
        document.getElementById('totalAmount').textContent = `₹${parseFloat(this.orderDetails.total_amount || 0).toFixed(2)}`;
    }
    
    formatPaymentMethod(method) {
        if (!method) return 'N/A';
        
        switch (method.toLowerCase()) {
            case 'razorpay': return 'Razorpay';
            case 'stripe': return 'Credit/Debit Card';
            case 'paypal': return 'PayPal';
            case 'cod': return 'Cash on Delivery';
            default: return method;
        }
    }
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    formatOrderStatus(status) {
        if (!status) return 'N/A';
        
        switch (status.toLowerCase()) {
            case 'pending': return 'Pending';
            case 'processing': return 'Processing';
            case 'shipped': return 'Shipped';
            case 'delivered': return 'Delivered';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    }
    
    setupEventListeners() {
        // Continue shopping button
        const continueShoppingBtn = document.getElementById('continueShoppingBtn');
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
        
        // Track order button
        const trackOrderBtn = document.getElementById('trackOrderBtn');
        if (trackOrderBtn) {
            trackOrderBtn.addEventListener('click', () => {
                window.location.href = 'checkout.html';
            });
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
            
            // Insert at top of page
            const mainContent = document.querySelector('main');
            if (mainContent) {
                mainContent.prepend(container);
            } else {
                document.body.prepend(container);
            }
        }
    }
}

// Initialize order success manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new OrderSuccessManager();
});