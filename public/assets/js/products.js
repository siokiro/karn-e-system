let allProducts = [];
let currentSort = 'name';
let sortDirection = 'asc';

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    loadProducts();
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', filterProducts);
    document.getElementById('categoryFilter').addEventListener('change', filterProducts);
    document.getElementById('sortSelect').addEventListener('change', sortProducts);
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

async function loadProducts() {
    try {
        showProductsLoading();
        
        const response = await fetch('/api/products');
        allProducts = await response.json();
        
        // Initialize products with additional properties
        allProducts = allProducts.map(product => ({
            ...product,
            lastOrdered: getRandomDate(), // Simulate last ordered date
            popularity: Math.floor(Math.random() * 100) // Simulate popularity score
        }));
        
        displayProducts(allProducts);
        updateProductStats(allProducts);
        
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('Failed to load products', 'danger');
        showProductsError();
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        grid.innerHTML = `
            <div class="col-12">
                <div class="empty-state text-center py-5">
                    <i class="empty-icon">🔍</i>
                    <h5>No products found</h5>
                    <p class="text-muted">Try adjusting your search or filter criteria</p>
                    <button class="btn btn-outline-danger" onclick="resetFilters()">
                        Reset Filters
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    
    products.forEach(product => {
        const stockStatus = getStockStatus(product.stock);
        const popularityClass = getPopularityClass(product.popularity);
        const isLowStock = product.stock < 5;
        
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        col.innerHTML = `
            <div class="card product-card h-100 ${isLowStock ? 'low-stock-highlight' : ''}">
                <div class="card-header bg-transparent border-0 pb-0">
                    <div class="d-flex justify-content-between align-items-start">
                        <span class="badge bg-${stockStatus.badge}">${stockStatus.text}</span>
                        <span class="popularity-badge ${popularityClass}" data-bs-toggle="tooltip" title="Popularity: ${product.popularity}%">
                            ❤️ ${product.popularity}%
                        </span>
                    </div>
                </div>
                
                <div class="card-body text-center">
                    <div class="product-icon mb-3">
                        ${getProductIcon(product.category)}
                    </div>
                    
                    <h5 class="card-title product-name">${product.name}</h5>
                    <p class="card-text text-muted text-uppercase small category-badge">${product.category}</p>
                    
                    <div class="price-section mb-3">
                        <span class="text-danger fw-bold fs-4">₱${product.price}</span>
                        <small class="text-muted">/${product.unit}</small>
                    </div>
                    
                    <div class="stock-info mb-3">
                        <div class="progress mb-2" style="height: 6px;">
                            <div class="progress-bar bg-${stockStatus.badge}" 
                                 style="width: ${Math.min((product.stock / 50) * 100, 100)}%">
                            </div>
                        </div>
                        <small class="stock-text ${stockStatus.class}">
                            <strong>Stock:</strong> ${product.stock}${product.unit}
                        </small>
                    </div>
                    
                    <div class="quantity-controls">
                        <div class="input-group mb-2">
                            <button class="btn btn-outline-secondary" type="button" 
                                onclick="adjustQuantity(${product.id}, -1)">
                                −
                            </button>
                            <input type="number" class="form-control text-center quantity-input" 
                                id="qty-${product.id}" value="1" min="1" max="${product.stock}" 
                                onchange="validateQuantity(${product.id}, this.value)">
                            <button class="btn btn-outline-secondary" type="button" 
                                onclick="adjustQuantity(${product.id}, 1)">
                                +
                            </button>
                        </div>
                        
                        <button class="btn btn-danger w-100 add-to-cart-btn" 
                            onclick="addProductToCart(${product.id})"
                            ${product.stock === 0 ? 'disabled' : ''}>
                            ${product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                        </button>
                    </div>
                </div>
                
                <div class="card-footer bg-transparent border-0 pt-0">
                    <small class="text-muted">
                        Last ordered: ${formatDate(product.lastOrdered)}
                    </small>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
    
    // Re-initialize tooltips for new elements
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function addProductToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    const quantityInput = document.getElementById(`qty-${productId}`);
    const quantity = parseInt(quantityInput.value) || 1;
    
    if (quantity < 1) {
        showAlert('Please enter a valid quantity', 'warning');
        return;
    }
    
    if (quantity > product.stock) {
        showAlert(`Only ${product.stock}${product.unit} available. Current stock is limited.`, 'warning');
        return;
    }
    
    if (product.stock === 0) {
        showAlert('This product is currently out of stock', 'danger');
        return;
    }
    
    // Add animation to button
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="loading-spinner-small"></span> Adding...';
    button.disabled = true;
    
    setTimeout(() => {
        addToCart(productId, product.name, product.price, quantity);
        button.innerHTML = '✅ Added!';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
            quantityInput.value = 1;
        }, 1000);
        
        // Show success message with product details
        showAlert(`Added ${quantity}${product.unit} of ${product.name} to cart!`, 'success');
        
    }, 500);
}

function adjustQuantity(productId, change) {
    const input = document.getElementById(`qty-${productId}`);
    const currentValue = parseInt(input.value) || 1;
    const newValue = currentValue + change;
    const product = allProducts.find(p => p.id === productId);
    
    if (newValue < 1) {
        input.value = 1;
    } else if (newValue > product.stock) {
        input.value = product.stock;
        showAlert(`Maximum available: ${product.stock}${product.unit}`, 'info');
    } else {
        input.value = newValue;
    }
}

function validateQuantity(productId, value) {
    const product = allProducts.find(p => p.id === productId);
    const quantity = parseInt(value) || 1;
    
    if (quantity < 1) {
        document.getElementById(`qty-${productId}`).value = 1;
        showAlert('Quantity must be at least 1', 'warning');
    } else if (quantity > product.stock) {
        document.getElementById(`qty-${productId}`).value = product.stock;
        showAlert(`Quantity reduced to available stock: ${product.stock}${product.unit}`, 'info');
    }
}

function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const availability = document.getElementById('availabilityFilter').value;
    
    let filtered = allProducts;
    
    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Category filter
    if (category) {
        filtered = filtered.filter(product => product.category === category);
    }
    
    // Availability filter
    if (availability === 'in-stock') {
        filtered = filtered.filter(product => product.stock > 0);
    } else if (availability === 'out-of-stock') {
        filtered = filtered.filter(product => product.stock === 0);
    } else if (availability === 'low-stock') {
        filtered = filtered.filter(product => product.stock > 0 && product.stock < 10);
    }
    
    displayProducts(filtered);
    updateProductStats(filtered);
}

function sortProducts() {
    const sortValue = document.getElementById('sortSelect').value;
    const [sortField, direction] = sortValue.split('-');
    
    currentSort = sortField;
    sortDirection = direction;
    
    const sortedProducts = [...allProducts].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        // Handle different data types
        if (sortField === 'name') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    displayProducts(sortedProducts);
}

function updateProductStats(products) {
    const totalProducts = products.length;
    const inStockProducts = products.filter(p => p.stock > 0).length;
    const outOfStockProducts = products.filter(p => p.stock === 0).length;
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10).length;
    
    // Update stats display if exists
    const statsElement = document.getElementById('productsStats');
    if (statsElement) {
        statsElement.innerHTML = `
            <small class="text-muted">
                Showing ${totalProducts} products • 
                ${inStockProducts} in stock • 
                ${lowStockProducts} low stock • 
                ${outOfStockProducts} out of stock
            </small>
        `;
    }
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('availabilityFilter').value = 'all';
    document.getElementById('sortSelect').value = 'name-asc';
    
    displayProducts(allProducts);
    updateProductStats(allProducts);
}

// Utility functions
function getStockStatus(stock) {
    if (stock === 0) return { class: 'stock-out', text: 'Out of Stock', badge: 'danger' };
    if (stock < 5) return { class: 'stock-low', text: 'Low Stock', badge: 'warning' };
    if (stock < 15) return { class: 'stock-medium', text: 'Medium Stock', badge: 'info' };
    return { class: 'stock-ok', text: 'In Stock', badge: 'success' };
}

function getPopularityClass(popularity) {
    if (popularity >= 80) return 'popularity-high';
    if (popularity >= 50) return 'popularity-medium';
    return 'popularity-low';
}

function getProductIcon(category) {
    const icons = {
        'pork': '🐖',
        'internal': '🫀',
        'face': '🐽'
    };
    return icons[category] || '🍖';
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric'
    });
}

function getRandomDate() {
    const start = new Date(2024, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function showProductsLoading() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="loading-spinner-large mx-auto"></div>
            <p class="mt-3">Loading delicious meat products...</p>
        </div>
    `;
}

function showProductsError() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = `
        <div class="col-12">
            <div class="error-state text-center py-5">
                <i class="error-icon">❌</i>
                <h5>Failed to load products</h5>
                <p class="text-muted">Please check your connection and try again</p>
                <button class="btn btn-outline-danger" onclick="loadProducts()">
                    Retry Loading
                </button>
            </div>
        </div>
    `;
}

// Make functions globally available
window.addProductToCart = addProductToCart;
window.filterProducts = filterProducts;
window.sortProducts = sortProducts;
window.adjustQuantity = adjustQuantity;
window.validateQuantity = validateQuantity;
window.resetFilters = resetFilters;