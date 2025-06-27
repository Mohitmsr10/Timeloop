const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config(); // Load environment variables from .env
const app = express();

app.use(cors());             // Allow cross-origin requests
app.use(express.json());     // Parse incoming JSON

const journalRoutes = require('./routes/journal');
console.log("✅ Middleware loaded");

app.use('/journal', journalRoutes);


// Test route
app.get("/", (req, res) => {
  res.send("🌀 TimeLoop backend working!");
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.use((req, res) => {
  res.status(404).json({ error: '🔍 Route not found', method: req.method, path: req.path });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
