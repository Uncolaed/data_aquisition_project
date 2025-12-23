import express from "express";
import cors from "cors";
import "./wsServer.js";   // starts WebSocket server
import "./serial.js";     // starts serial communication
import { connectMongo, getAllReadings } from "./mongo.js";

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

// API endpoint to get all sensor readings
app.get("/api/readings", async (req, res) => {
  try {
    const readings = await getAllReadings();
    res.json(readings);
  } catch (error) {
    console.error("Error fetching readings:", error);
    res.status(500).json({ error: "Failed to fetch readings" });
  }
});

connectMongo();

app.listen(PORT, () => {
  console.log(`HTTP API server running on port ${PORT}`);
});

console.log("Node.js server initialized...");
