let cartItems = JSON.parse(localStorage.getItem('karnE_cart')) || [];

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    displayCartItems();
    updateOrderSummary();
    
    document.getElementById('checkoutBtn').addEventListener('click', openCheckoutModal);
    document.getElementById('confirmOrderBtn').addEventListener('click', confirmOrder);
});

function displayCartItems() {
    const container = document.getElementById('cartItems');
    
    if (cartItems.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <h4>Your cart is empty</h4>
                <p>Start adding some delicious meat products!</p>
                <a href="/products" class="btn btn-danger">Browse Products</a>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    cartItems.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        cartItemDiv.innerHTML = `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <h5 class="mb-1">${item.productName}</h5>
                            <p class="text-muted mb-0">₱${item.price}/kg</p>
                        </div>
                        <div class="col-md-3">
                            <div class="input-group">
                                <button class="btn btn-outline-secondary" type="button" 
                                    onclick="updateQuantity(${index}, -1)">-</button>
                                <input type="number" class="form-control text-center" 
                                    value="${item.quantity}" min="1" 
                                    onchange="updateQuantityInput(${index}, this.value)">
                                <button class="btn btn-outline-secondary" type="button" 
                                    onclick="updateQuantity(${index}, 1)">+</button>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <h5 class="text-danger mb-0">₱${itemTotal.toFixed(2)}</h5>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-outline-danger btn-sm" 
                                onclick="removeFromCart(${index})">
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(cartItemDiv);
    });
}

function updateQuantity(itemIndex, change) {
    const newQuantity = cartItems[itemIndex].quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(itemIndex);
        return;
    }
    
    cartItems[itemIndex].quantity = newQuantity;
    saveCart();
    displayCartItems();
    updateOrderSummary();
}

function updateQuantityInput(itemIndex, newValue) {
    const quantity = parseInt(newValue);
    
    if (isNaN(quantity) || quantity < 1) {
        displayCartItems(); // Reset to current value
        return;
    }
    
    cartItems[itemIndex].quantity = quantity;
    saveCart();
    updateOrderSummary();
}

function removeFromCart(itemIndex) {
    const itemName = cartItems[itemIndex].productName;
    cartItems.splice(itemIndex, 1);
    saveCart();
    displayCartItems();
    updateOrderSummary();
    showAlert(`${itemName} removed from cart`, 'warning');
}

function updateOrderSummary() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('totalAmount').textContent = subtotal.toFixed(2);
    
    // Enable/disable checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = cartItems.length === 0;
    checkoutBtn.textContent = checkoutBtn.disabled ? 'Cart is Empty' : 'Proceed to Checkout';
}

function saveCart() {
    localStorage.setItem('karnE_cart', JSON.stringify(cartItems));
    updateCartCount();
}

function openCheckoutModal() {
    if (cartItems.length === 0) {
        showAlert('Your cart is empty!', 'warning');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    modal.show();
}

async function confirmOrder() {
    const form = document.getElementById('checkoutForm');
    const formData = new FormData(form);
    
    const customerName = formData.get('customerName');
    const customerPhone = formData.get('customerPhone');
    const notes = formData.get('notes');
    
    // Basic validation
    if (!customerName || !customerPhone) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    if (customerPhone.length < 10) {
        showAlert('Please enter a valid phone number', 'warning');
        return;
    }
    
    // Prepare order data
    const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes?.trim() || '',
        items: cartItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price
        })),
        total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    try {
        const confirmBtn = document.getElementById('confirmOrderBtn');
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<span class="loading-spinner small"></span> Placing Order...';
        confirmBtn.disabled = true;
        
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Clear cart
            cartItems = [];
            saveCart();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
            modal.hide();
            
            // Reset form
            form.reset();
            
            // Show success message
            showAlert(`Order placed successfully! Order ID: #${result.orderId}`, 'success');
            
            // Redirect to home after delay
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
            
        } else {
            throw new Error(result.error || 'Failed to place order');
        }
        
    } catch (error) {
        console.error('Order error:', error);
        showAlert('Failed to place order. Please try again.', 'danger');
        
        // Reset button
        const confirmBtn = document.getElementById('confirmOrderBtn');
        confirmBtn.innerHTML = 'Place Order';
        confirmBtn.disabled = false;
    }
}

function clearCart() {
    if (cartItems.length === 0) return;
    
    if (confirm('Are you sure you want to clear your cart?')) {
        cartItems = [];
        saveCart();
        displayCartItems();
        updateOrderSummary();
        showAlert('Cart cleared', 'info');
    }
}

// Export functions for global access
window.updateQuantity = updateQuantity;
window.updateQuantityInput = updateQuantityInput;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;