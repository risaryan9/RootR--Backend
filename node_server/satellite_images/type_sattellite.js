import axios from 'axios';
import dotenv from 'dotenv';
import express from "express";
import latLngToTile from '../util/latlongConversion.js';
import createSatSession from '../sessionCreate/satCreateSession.js';

dotenv.config();

//Make this Dynamic
dotenv.config({ path: 'C:/Users/risar/OneDrive/Documents/Desktop/Root Revival- Backend/node_server/.env' });


const app = express()
const API_key_google = process.env.GOOGLE_API;




const lat = 12.9716;
const lng = 77.5946;



let sessionId;

async function getSatImage(latitude,longitude){
    if(!sessionId){
        sessionId = await createSatSession();
    }
    const zoom = 15;
    const {x, y, z} = latLngToTile(latitude, longitude, zoom);
    try {
        const response = await axios.get(
        `https://tile.googleapis.com/v1/2dtiles/${z}/${x}/${y}?session=${sessionId}&key=${API_key_google}`,
        { responseType: "arraybuffer" } // ✅ binary data
        );  

        const base64Image = Buffer.from(response.data, "binary").toString("base64");
        const imageString = `data:image/png;base64,${base64Image}`;
        console.log("Image string length:", imageString.length);
        return imageString;
    }
    catch(err){
        console.error("Error fetching satellite image:", err.message);
        throw err;
    }
}

getSatImage(lat,lng);