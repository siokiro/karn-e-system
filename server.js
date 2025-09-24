const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Helper function to read JSON files
const readJSONFile = (filename) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data', filename), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return { [filename.replace('.json', '')]: [] };
    }
};

// Helper function to write JSON files
const writeJSONFile = (filename, data) => {
    try {
        fs.writeFileSync(path.join(__dirname, 'data', filename), JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        return false;
    }
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API Routes
app.get('/api/products', (req, res) => {
    try {
        const data = readJSONFile('products.json');
        res.json(data.products);
    } catch (error) {
        console.error('Error loading products:', error);
        res.status(500).json({ error: "Failed to load products" });
    }
});

app.get('/api/inventory', (req, res) => {
    try {
        const data = readJSONFile('inventory.json');
        res.json(data.inventory);
    } catch (error) {
        res.status(500).json({ error: "Failed to load inventory" });
    }
});

app.get('/api/orders', (req, res) => {
    try {
        const data = readJSONFile('orders.json');
        res.json(data.orders);
    } catch (error) {
        res.status(500).json({ error: "Failed to load orders" });
    }
});

app.post('/api/orders', (req, res) => {
    try {
        const newOrder = req.body;
        const data = readJSONFile('orders.json');
        
        // Generate new order ID
        newOrder.id = data.orders.length > 0 ? Math.max(...data.orders.map(o => o.id)) + 1 : 1001;
        newOrder.orderDate = new Date().toISOString();
        newOrder.status = 'pending';
        
        data.orders.push(newOrder);
        
        if (writeJSONFile('orders.json', data)) {
            res.json({ success: true, orderId: newOrder.id });
        } else {
            res.status(500).json({ error: "Failed to save order" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to create order" });
    }
});

app.put('/api/orders/:id', (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const updatedStatus = req.body.status;
        const data = readJSONFile('orders.json');
        
        const orderIndex = data.orders.findIndex(order => order.id === orderId);
        if (orderIndex === -1) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        data.orders[orderIndex].status = updatedStatus;
        if (updatedStatus === 'completed') {
            data.orders[orderIndex].completedDate = new Date().toISOString();
        }
        
        if (writeJSONFile('orders.json', data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: "Failed to update order" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to update order" });
    }
});

// Update inventory
app.put('/api/inventory/:productId', (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const { currentStock } = req.body;
        const data = readJSONFile('inventory.json');
        
        const itemIndex = data.inventory.findIndex(item => item.productId === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ error: "Product not found in inventory" });
        }
        
        data.inventory[itemIndex].currentStock = currentStock;
        data.inventory[itemIndex].lastUpdated = new Date().toISOString();
        data.inventory[itemIndex].status = currentStock <= data.inventory[itemIndex].minimumStock ? 'low-stock' : 'in-stock';
        
        if (writeJSONFile('inventory.json', data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: "Failed to update inventory" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to update inventory" });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Karn-E Server running on port ${PORT}`);
    console.log(`Access via: http://localhost:${PORT}`);
});