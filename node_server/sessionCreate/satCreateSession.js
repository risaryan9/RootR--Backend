import axios from 'axios';
import dotenv from 'dotenv';
import express from "express";

dotenv.config();

//Make this Dynamic
dotenv.config({ path: 'C:/Users/risar/OneDrive/Documents/Desktop/Root Revival- Backend/node_server/.env' });


const app = express()
const API_key_google = process.env.GOOGLE_API;



async function createSatSession() {
  try {
    const response = await axios.post(
      `https://tile.googleapis.com/v1/createSession?key=${API_key_google}`,
      { 
        mapType: "satellite",
        language: "en-US",
        region: "IN", 
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    let sessionId = response.data.session;
    console.log("Created session:", sessionId);
    return sessionId;
  } catch (err) {
    console.error("Error creating session:", err.response?.data || err.message);
    throw err;
  }
}


export default createSatSession ;

