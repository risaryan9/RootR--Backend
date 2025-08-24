import dotenv from 'dotenv';
import express from "express";
import path from 'path';




//Make this Dynamic
dotenv.config({ path: 'C:/Users/risar/OneDrive/Documents/Desktop/Root Revival- Backend/.env' });

const app = express()
const API_openweather = process.env.OPEN_WEATHER;

console.log(API_openweather);