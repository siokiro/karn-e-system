const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - MUST be first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== API ROUTES MUST COME FIRST ==========

// Get all products - FIXED
app.get('/api/products', (req, res) => {
    try {
        const productsPath = path.join(__dirname, 'data', 'products.json');
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        
        // Set proper JSON header
        res.setHeader('Content-Type', 'application/json');
        res.json(products);
        
        console.log('Products API: Sent', products.length, 'products');
    } catch (error) {
        console.error('Products API Error:', error);
        res.status(500).json({ error: 'Failed to load products' });
    }
});

// Admin login - FIXED
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

// Other API routes...
app.get('/api/orders', (req, res) => {
    try {
        const ordersPath = path.join(__dirname, 'data', 'orders.json');
        const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load orders' });
    }
});

// ========== STATIC FILES COME LAST ==========

// Serve static files from public directory
app.use(express.static('public'));

// Catch-all handler for client-side routing (MUST BE LAST)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍖 Karn-E Server running on port ${PORT}`);
    console.log(`🌐 Access via: http://localhost:${PORT}`);
});