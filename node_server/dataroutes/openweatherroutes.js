import axios from 'axios';
import dotenv from 'dotenv';
import express from "express";
import path from 'path';

//Make this Dynamic
dotenv.config({ path: 'C:/Users/risar/OneDrive/Documents/Desktop/Root Revival- Backend/.env' });

const app = express()
const API_key_openweather = process.env.OPEN_WEATHER;


//Pollution API
async function pollutionDataFunction(lat,long){
    try{
        const response  = await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${long}&appid=${API_key_openweather}`);
        const pollutionData = response.data.list[0].components;
        return pollutionData;   
    }
    catch (err){
        console.log('Error faced with Pollution API: ',err);
    }
}



//Weather API
async function weatherDataFunction(lat,long){
    try{
        const response  = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${API_key_openweather}`);
        const weatherData = response.data.main;
        weatherData.wind_speed = response.data.wind.speed;
        weatherData.wind_degree = response.data.wind.deg;
        weatherData.wind_gust = response.data.wind.gust;

        console.log(weatherData);
    }
    catch (err){
        console.log('Error faced with Weather API: ',err);
    }
}
