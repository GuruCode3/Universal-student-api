const express = require('express');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// First endpoint
app.get('/', (req, res) => {
  res.json({
    message: "Universal Student API",
    version: "1.0.0",
    status: "Running ✅",
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});