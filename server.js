const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Add CORS for cross-device access
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Your existing API routes and functions here...
// ... [keep all your existing code]

// Start server with 0.0.0.0 for external access
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍖 Karn-E Server running on port ${PORT}`);
    console.log(`🌐 Access your system at: http://localhost:${PORT}`);
});