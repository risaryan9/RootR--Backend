import axios from 'axios';
import dotenv from 'dotenv';
import express from "express";
import path from 'path';

//Make this Dynamic
dotenv.config({ path: 'C:/Users/risar/OneDrive/Documents/Desktop/Root Revival- Backend/.env' });

const app = express()
const API_key_google = process.env.GOOGLE_API;


//Pollen API


//Elevation API

async function elevationAPI(lat,long){
    try{
        const response  = await axios.get(`https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${long}&key=${API_key_google}`)
        return response.data.results[0];
    }
    catch (err){
        console.log("Error faced in Elevation API: ",err)
    }
}

elevationAPI(12.9629,77.5775);