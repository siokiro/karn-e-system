const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from root directory (not 'public')
app.use(express.static(__dirname));

// ========== API ROUTES ==========

// Get all products
app.get('/api/products', (req, res) => {
    try {
        const productsPath = path.join(__dirname, 'data', 'products.json');
        
        // Check if file exists first
        if (!fs.existsSync(productsPath)) {
            // Create default products if file doesn't exist
            const defaultProducts = [
                { id: 1, name: "Kasim", price: 300, image: "images/meats/kasim.jpg", stock: 50 },
                { id: 2, name: "Pigue", price: 300, image: "images/meats/pigue.jpg", stock: 45 },
                { id: 3, name: "Liempo", price: 390, image: "images/meats/liempo.jpg", stock: 30 },
                { id: 4, name: "Laman Loob", price: 360, image: "images/meats/laman-loob.jpg", stock: 25 },
                { id: 5, name: "Pata", price: 310, image: "images/meats/pata.jpg", stock: 20 },
                { id: 6, name: "Tadyang", price: 429, image: "images/meats/tadyang.jpg", stock: 15 },
                { id: 7, name: "Lomo", price: 330, image: "images/meats/lomo.jpg", stock: 35 },
                { id: 8, name: "Maskara", price: 295, image: "images/meats/maskara.jpg", stock: 40 },
                { id: 9, name: "Tainga", price: 360, image: "images/meats/tainga.jpg", stock: 18 }
            ];
            
            // Create data directory if it doesn't exist
            const dataDir = path.join(__dirname, 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            fs.writeFileSync(productsPath, JSON.stringify(defaultProducts, null, 2));
            console.log('Created default products file');
            res.json(defaultProducts);
            return;
        }
        
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        res.setHeader('Content-Type', 'application/json');
        res.json(products);
        
        console.log('Products API: Sent', products.length, 'products');
    } catch (error) {
        console.error('Products API Error:', error);
        res.status(500).json({ error: 'Failed to load products' });
    }
});

// Save products (for inventory updates)
app.post('/api/products', (req, res) => {
    try {
        const productsPath = path.join(__dirname, 'data', 'products.json');
        const dataDir = path.join(__dirname, 'data');
        
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(productsPath, JSON.stringify(req.body, null, 2));
        res.json({ success: true, message: 'Products updated successfully' });
    } catch (error) {
        console.error('Save products error:', error);
        res.status(500).json({ error: 'Failed to save products' });
    }
});

// Get orders
app.get('/api/orders', (req, res) => {
    try {
        const ordersPath = path.join(__dirname, 'data', 'orders.json');
        
        if (!fs.existsSync(ordersPath)) {
            // Return empty array if no orders file exists
            res.json([]);
            return;
        }
        
        const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
        res.json(orders);
    } catch (error) {
        console.error('Orders API Error:', error);
        res.status(500).json({ error: 'Failed to load orders' });
    }
});

// Save new order
app.post('/api/orders', (req, res) => {
    try {
        const ordersPath = path.join(__dirname, 'data', 'orders.json');
        const dataDir = path.join(__dirname, 'data');
        
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        let orders = [];
        if (fs.existsSync(ordersPath)) {
            orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
        }
        
        const newOrder = {
            id: Date.now(),
            date: new Date().toISOString(),
            ...req.body,
            status: 'pending'
        };
        
        orders.push(newOrder);
        fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
        
        res.json({ success: true, orderId: newOrder.id, message: 'Order placed successfully' });
    } catch (error) {
        console.error('Save order error:', error);
        res.status(500).json({ error: 'Failed to save order' });
    }
});

// Admin login
app.post('/api/login', (req, res) => {
    console.log('Login attempt:', req.body);
    
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'kaedmeat2024') {
        res.json({ 
            success: true, 
            message: 'Login successful'
        });
    } else {
        res.status(401).json({ 
            success: false, 
            error: 'Invalid credentials' 
        });
    }
});

// Get sales data
app.get('/api/sales', (req, res) => {
    try {
        const salesPath = path.join(__dirname, 'data', 'sales.json');
        
        if (!fs.existsSync(salesPath)) {
            res.json([]);
            return;
        }
        
        const sales = JSON.parse(fs.readFileSync(salesPath, 'utf8'));
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load sales data' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Karn-E Server is running',
        timestamp: new Date().toISOString()
    });
});

// ========== SERVE HTML PAGES ==========

// Serve main pages with explicit routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/customer-order', (req, res) => {
    res.sendFile(path.join(__dirname, 'customer-order.html'));
});

app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

app.get('/billing', (req, res) => {
    res.sendFile(path.join(__dirname, 'billing.html'));
});

app.get('/inventory', (req, res) => {
    res.sendFile(path.join(__dirname, 'inventory.html'));
});

// Catch-all handler for client-side routing (MUST BE LAST)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍖 Karn-E Server running on port ${PORT}`);
    console.log(`🌐 Local access: http://localhost:${PORT}`);
    console.log(`🌐 Network access: http://YOUR_IP_ADDRESS:${PORT}`);
    console.log(`\n📱 To access from other devices:`);
    console.log(`1. Find your computer's IP address:`);
    console.log(`   - Windows: Open cmd and type 'ipconfig'`);
    console.log(`   - Mac/Linux: Open terminal and type 'ifconfig'`);
    console.log(`2. Look for IPv4 address (e.g., 192.168.1.100)`);
    console.log(`3. On other devices, open: http://YOUR_IP:${PORT}`);
    console.log(`4. All devices must be on the same WiFi network`);
    console.log(`\n✅ Server is ready!`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Karn-E server...');
    process.exit(0);
});