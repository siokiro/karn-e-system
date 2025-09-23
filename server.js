const express = require("express");
const path = require("path");

const app = express();

// Serve static files (HTML, CSS, JS from /public or similar)
app.use(express.static(path.join(__dirname, "public")));

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Use Render's assigned PORT (fallback to 3000 for local dev)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});