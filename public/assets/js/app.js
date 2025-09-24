// Global cart functionality
let cart = JSON.parse(localStorage.getItem('karnE_cart')) || [];

// Update cart count in navigation
function updateCartCount() {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('#cartCount').forEach(el => {
        el.textContent = cartCount;
    });
}

// Add to cart function
function addToCart(productId, productName, price, quantity = 1) {
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            productId,
            productName,
            price,
            quantity
        });
    }
    
    localStorage.setItem('karnE_cart', JSON.stringify(cart));
    updateCartCount();
    showAlert('Product added to cart!', 'success');
}

// Show alert message
function showAlert(message, type = 'info') {
    // Remove existing alerts
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 4000);
}

// Load featured products on homepage
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    
    // Load featured products if on homepage
    if (document.getElementById('featuredProducts')) {
        loadFeaturedProducts();
    }
});

async function loadFeaturedProducts() {
    try {
        const response = await fetch('/api/products');
        
        // Check if response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned HTML instead of JSON');
        }
        
        const products = await response.json();
        
        // Check if featuredProducts element exists
        const featuredContainer = document.getElementById('featuredProducts');
        if (!featuredContainer) {
            console.log('Featured products container not found');
            return;
        }
        
        featuredContainer.innerHTML = '';
        
        // Show first 6 products
        products.slice(0, 6).forEach(product => {
            const productCol = document.createElement('div');
            productCol.className = 'col-md-4 col-sm-6 mb-4';
            productCol.innerHTML = `
                <div class="card product-card h-100">
                    <div class="card-body text-center">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text text-danger fw-bold fs-4">₱${product.price}/${product.unit}</p>
                        <p class="card-text">
                            <small class="text-muted">Stock: ${product.stock}${product.unit}</small>
                        </p>
                        <button class="btn btn-danger btn-sm" 
                                onclick="addToCart(${product.id}, '${product.name}', ${product.price}, 1)">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
            featuredContainer.appendChild(productCol);
        });
        
    } catch (error) {
        console.error('Error loading featured products:', error);
        
        // Show user-friendly error message
        const featuredContainer = document.getElementById('featuredProducts');
        if (featuredContainer) {
            featuredContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-warning">
                        <h5>⚠️ Temporary Issue</h5>
                        <p>Products loading slowly. <a href="/products" class="alert-link">Try products page</a></p>
                        <button onclick="location.reload()" class="btn btn-sm btn-outline-danger">Retry</button>
                    </div>
                </div>
            `;
        }
    }
}

// Make functions globally available
window.addToCart = addToCart;
window.showAlert = showAlert;
window.updateCartCount = updateCartCount;