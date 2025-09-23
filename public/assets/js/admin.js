let isAuthenticated = false;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('saveStockBtn').addEventListener('click', updateStock);
});

function checkAuthentication() {
    // Check if user is already logged in (simple session check)
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    try {
        const loginBtn = e.target.querySelector('button[type="submit"]');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<span class="loading-spinner small"></span> Logging in...';
        loginBtn.disabled = true;
        
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('adminLoggedIn', 'true');
            showDashboard();
            showAlert('Login successful!', 'success');
        } else {
            throw new Error(result.error || 'Login failed');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Invalid username or password', 'danger');
        
        // Reset button
        const loginBtn = e.target.querySelector('button[type="submit"]');
        loginBtn.innerHTML = 'Login';
        loginBtn.disabled = false;
    }
}

function handleLogout() {
    localStorage.removeItem('adminLoggedIn');
    showLogin();
    showAlert('Logged out successfully', 'info');
}

function showLogin() {
    document.getElementById('loginScreen').classList.remove('d-none');
    document.getElementById('adminDashboard').classList.add('d-none');
    isAuthenticated = false;
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('d-none');
    document.getElementById('adminDashboard').classList.remove('d-none');
    isAuthenticated = true;
    
    loadDashboardData();
    
    // Set up tab change events
    const tabLinks = document.querySelectorAll('#adminTabs .nav-link');
    tabLinks.forEach(link => {
        link.addEventListener('shown.bs.tab', function(e) {
            const target = e.target.getAttribute('href');
            if (target === '#orders') {
                loadOrders();
            } else if (target === '#inventory') {
                loadInventory();
            } else if (target === '#products') {
                loadProducts();
            }
        });
    });
}

async function loadDashboardData() {
    try {
        // Load sales report
        const reportResponse = await fetch('/api/sales-report');
        const report = await reportResponse.json();
        
        document.getElementById('totalSales').textContent = report.totalSales.toLocaleString();
        document.getElementById('totalOrders').textContent = report.totalOrders;
        document.getElementById('pendingOrders').textContent = report.pendingOrders;
        document.getElementById('avgOrder').textContent = report.averageOrder;
        
        // Load initial data for active tab
        loadOrders();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Failed to load dashboard data', 'danger');
    }
}

async function loadOrders() {
    try {
        const response = await fetch('/api/orders');
        const orders = await response.json();
        
        const tableBody = document.getElementById('ordersTable');
        tableBody.innerHTML = '';
        
        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No orders found</td></tr>';
            return;
        }
        
        // Sort orders by date (newest first)
        orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        orders.forEach(order => {
            const row = document.createElement('tr');
            const orderDate = new Date(order.timestamp).toLocaleDateString();
            const orderTime = new Date(order.timestamp).toLocaleTimeString();
            
            // Format items list
            const itemsList = order.items.map(item => 
                `${item.quantity}kg ${item.productName}`
            ).join(', ');
            
            row.innerHTML = `
                <td class="fw-bold">#${order.id}</td>
                <td>
                    <div><strong>${order.customerName}</strong></div>
                    <small class="text-muted">${order.customerPhone}</small>
                </td>
                <td>
                    <small>${itemsList}</small>
                    ${order.notes ? `<br><small class="text-muted"><em>${order.notes}</em></small>` : ''}
                </td>
                <td class="fw-bold text-danger">₱${order.total.toFixed(2)}</td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                </td>
                <td>
                    <small>${orderDate}</small><br>
                    <small class="text-muted">${orderTime}</small>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <select class="form-select form-select-sm" onchange="updateOrderStatus(${order.id}, this.value)">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersTable').innerHTML = 
            '<tr><td colspan="7" class="text-center text-danger">Error loading orders</td></tr>';
    }
}

async function loadInventory() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        
        const tableBody = document.getElementById('inventoryTable');
        tableBody.innerHTML = '';
        
        products.forEach(product => {
            const row = document.createElement('tr');
            const stockStatus = product.stock < 5 ? 'Low Stock' : (product.stock < 15 ? 'Medium' : 'Good');
            const statusClass = product.stock < 5 ? 'stock-low' : (product.stock < 15 ? 'stock-medium' : 'stock-ok');
            
            row.innerHTML = `
                <td>
                    <strong>${product.name}</strong>
                    <br><small class="text-muted">${product.category}</small>
                </td>
                <td>
                    <span class="${statusClass} fw-bold">${product.stock}${product.unit}</span>
                </td>
                <td class="fw-bold">₱${product.price}/${product.unit}</td>
                <td>
                    <span class="status-badge status-${stockStatus.toLowerCase().replace(' ', '-')}">
                        ${stockStatus}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline-primary btn-sm" 
                            onclick="openUpdateStockModal(${product.id}, '${product.name}', ${product.stock})">
                        Update Stock
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading inventory:', error);
        document.getElementById('inventoryTable').innerHTML = 
            '<tr><td colspan="5" class="text-center text-danger">Error loading inventory</td></tr>';
    }
}

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        
        const tableBody = document.getElementById('productsTable');
        tableBody.innerHTML = '';
        
        products.forEach(product => {
            const row = document.createElement('tr');
            const stockStatus = product.stock < 5 ? 'Low' : (product.stock < 15 ? 'Medium' : 'Good');
            const statusClass = product.stock === 0 ? 'status-cancelled' : 
                              product.stock < 5 ? 'status-pending' : 
                              product.stock < 15 ? 'status-processing' : 'status-completed';
            
            row.innerHTML = `
                <td>${product.id}</td>
                <td><strong>${product.name}</strong></td>
                <td class="fw-bold">₱${product.price}</td>
                <td><span class="text-capitalize">${product.category}</span></td>
                <td class="fw-bold">${product.stock}${product.unit}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${stockStatus}
                    </span>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsTable').innerHTML = 
            '<tr><td colspan="6" class="text-center text-danger">Error loading products</td></tr>';
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert(`Order #${orderId} status updated to ${newStatus}`, 'success');
            // Reload orders to reflect changes
            loadOrders();
            loadDashboardData(); // Update stats
        } else {
            throw new Error(result.error || 'Failed to update order status');
        }
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showAlert('Failed to update order status', 'danger');
        // Reload orders to reset the select box
        loadOrders();
    }
}

function openUpdateStockModal(productId, productName, currentStock) {
    document.getElementById('updateProductId').value = productId;
    document.getElementById('updateProductName').value = productName;
    document.getElementById('updateStockLevel').value = currentStock;
    
    const modal = new bootstrap.Modal(document.getElementById('updateStockModal'));
    modal.show();
}

async function updateStock() {
    const productId = document.getElementById('updateProductId').value;
    const newStock = parseInt(document.getElementById('updateStockLevel').value);
    
    if (isNaN(newStock) || newStock < 0) {
        showAlert('Please enter a valid stock quantity', 'warning');
        return;
    }
    
    try {
        const saveBtn = document.getElementById('saveStockBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="loading-spinner small"></span> Updating...';
        saveBtn.disabled = true;
        
        const response = await fetch(`/api/products/${productId}/stock`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ stock: newStock })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert(`Stock updated successfully for ${result.product.name}`, 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('updateStockModal'));
            modal.hide();
            
            // Reload inventory and products
            loadInventory();
            loadProducts();
            loadDashboardData();
            
        } else {
            throw new Error(result.error || 'Failed to update stock');
        }
        
    } catch (error) {
        console.error('Error updating stock:', error);
        showAlert('Failed to update stock', 'danger');
    } finally {
        const saveBtn = document.getElementById('saveStockBtn');
        saveBtn.innerHTML = 'Update Stock';
        saveBtn.disabled = false;
    }
}

// Auto-refresh data every 30 seconds
setInterval(() => {
    if (isAuthenticated) {
        loadDashboardData();
    }
}, 30000);

// Make functions globally available
window.updateOrderStatus = updateOrderStatus;
window.openUpdateStockModal = openUpdateStockModal;
window.updateStock = updateStock;