import { SerialPort, ReadlineParser } from "serialport";
import { broadcast } from "./wsServer.js";
import { saveSensorReading } from "./mongo.js";

const serialPath = process.env.SERIAL_PORT || "/dev/ttyACM1";

const port = new SerialPort({
  path: serialPath,
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

parser.on("data", async (data) => {
  console.log("Received from Arduino:", data);
  
  // Parse water pump data format: "WATER LEVEL SENSOR:425|MOTOR MODES:IN= ON,OUT= OFF"
  const waterLevelMatch = data.match(/WATER LEVEL SENSOR:(\d+)/);
  const inputMotorMatch = data.match(/IN=\s*(ON|OFF)/);
  const outputMotorMatch = data.match(/OUT=\s*(ON|OFF)/);
  
  if (waterLevelMatch && inputMotorMatch && outputMotorMatch) {
    const waterLevel = waterLevelMatch[1];
    const inputMotorState = inputMotorMatch[1];
    const outputMotorState = outputMotorMatch[1];
    
    // Save to MongoDB
    const record = await saveSensorReading(waterLevel, inputMotorState, outputMotorState);
    
    // Broadcast to React clients
    if (record) {
      broadcast(JSON.stringify(record));
    }
  } else {
    console.warn("Invalid sensor data format:", data);
  }
});

// // Optional: send message to Arduino every 2 seconds
// setInterval(() => {
//   const timestamp = new Date().toLocaleString();
//   port.write(`Hello Arduino - ${timestamp}\n`);
// }, 2000);

console.log("Arduino serial running...");

export default port;
