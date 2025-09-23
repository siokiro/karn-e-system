const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// In server.js, add environment detection
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    console.log('🚀 Running in production mode');
    // Add production-specific settings
} else {
    console.log('🔧 Running in development mode');
}

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