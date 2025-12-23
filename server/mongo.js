import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL);

let db;
let sensorCollection;

export async function connectMongo() {
  try {
    await client.connect();
    db = client.db("water_pump_system");
    sensorCollection = db.collection("sensor_readings");
    console.log("Connected to MongoDB");
  } catch (e) {
    console.error("Mongo error:", e);
  }
}

export async function saveSensorReading(waterLevel, inputMotorState, outputMotorState) {
  try {
    const record = {
      timestamp: new Date(),
      waterLevel: parseInt(waterLevel),
      inputMotor: inputMotorState === "ON",
      outputMotor: outputMotorState === "ON",
    };
    await sensorCollection.insertOne(record);
    return record;
  } catch (e) {
    console.error("Error saving sensor reading:", e);
    return null;
  }
}

export async function getAllReadings() {
  try {
    const records = await sensorCollection.find({}).sort({ timestamp: -1 }).toArray();
    return records;
  } catch (e) {
    console.error("Error fetching sensor readings:", e);
    return [];
  }
}

export default client;
