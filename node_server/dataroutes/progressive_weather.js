import { fetchWeatherApi } from "openmeteo";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

async function progressiveWeatherFunction(latitude, longitude) {
    console.log("Tree 1");

    const today = new Date().toISOString().split("T")[0];

    const params = {
        latitude,
        longitude,
        start_date: "2016-01-01",
        end_date: today,
        daily: [
            "temperature_2m_mean",
            "temperature_2m_max",
            "temperature_2m_min",
            "wind_speed_10m_max",
            "wind_gusts_10m_max",
            "shortwave_radiation_sum"
        ],
        hourly: [
            "temperature_2m",
            "wind_speed_10m",
            "precipitation",
            "soil_moisture_7_to_28cm",
            "soil_moisture_28_to_100cm"
        ]
    };

    const url = "https://archive-api.open-meteo.com/v1/archive";
    let responses;

    try {
        responses = await fetchWeatherApi(url, params);
    } catch (err) {
        console.error("Error fetching data from Weather Open-Meteo API:", err);
        return;
    }

    const response = responses?.[0];

    console.log("Tree 2");

    if (!response) {
        console.warn("No response from API for this location.");
        return;
    }

    const utcOffsetSeconds = response.utcOffsetSeconds?.() ?? 0;
    const hourly = response.hourly?.();
    const daily = response.daily?.();

    if (!hourly || !daily) {
        console.warn("No hourly/daily data returned. Skipping this location.");
        return;
    }


    const hourlyLength = Number(hourly.timeEnd?.() ?? 0) - Number(hourly.time?.() ?? 0);
    const hourlyInterval = hourly.interval?.() ?? 3600; 

    if (hourlyLength <= 0) {
        console.warn("Hourly time range invalid or empty.");
        return;
    }

    const fullTimes = [...Array(hourlyLength / hourlyInterval)].map(
        (_, i) => new Date((Number(hourly.time()) + i * hourlyInterval + utcOffsetSeconds) * 1000)
    );

    const chosenHour = 12;
    const chosenIndices = fullTimes
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => t.getHours() === chosenHour)
        .map(({ i }) => i);

    if (chosenIndices.length === 0) {
        console.warn("No 12:00 hourly data found.");
    }

    function filterVariable(idx) {
        const variable = hourly.variables(idx);
        if (!variable) {
            console.warn(`Hourly variable index ${idx} not available.`);
            return Array(chosenIndices.length).fill(null);
        }
        const arr = variable.valuesArray();
        return chosenIndices.map(i => arr[i]);
    }

    const hourlyData = {
        time: chosenIndices.map(i => fullTimes[i]),
        temperature_2m: filterVariable(0),
        wind_speed_10m: filterVariable(1),
        precipitation: filterVariable(2),
        soil_moisture_7_to_28cm: filterVariable(3),
        soil_moisture_28_to_100cm: filterVariable(4)
    };

    const dailyLength = Number(daily.timeEnd?.() ?? 0) - Number(daily.time?.() ?? 0);
    const dailyInterval = daily.interval?.() ?? 86400; // fallback 1 day

    const dailyTimes = [...Array(dailyLength / dailyInterval)].map(
        (_, i) => new Date((Number(daily.time()) + i * dailyInterval + utcOffsetSeconds) * 1000)
    );

    const dailyData = {
        time: dailyTimes,
        temperature_2m_mean: daily.variables(0)?.valuesArray() ?? [],
        temperature_2m_max: daily.variables(1)?.valuesArray() ?? [],
        temperature_2m_min: daily.variables(2)?.valuesArray() ?? [],
        wind_speed_10m_max: daily.variables(3)?.valuesArray() ?? [],
        wind_gusts_10m_max: daily.variables(4)?.valuesArray() ?? [],
        shortwave_radiation_sum: daily.variables(5)?.valuesArray() ?? []
    };

    const weatherData = { hourly: hourlyData, daily: dailyData };

    const filePath = path.join(
        "C:/Users/risar/OneDrive/Documents/Desktop/Root Revival- Backend/data_preprocessing_service",
        "weather_data.json"
    );

    try {
        fs.writeFileSync(filePath, JSON.stringify(weatherData, null, 2));
    } catch (err) {
        console.error("Error saving weather_data.json:", err);
        return;
    }

    console.log(`Weather data saved to ${filePath}`);

    exec(
        `python "progressiveWeatherProcessing.py"`,
        { cwd: path.dirname(filePath) },
        (err, stdout, stderr) => {
            if (err) {
                console.error("Error running Python:", err);
                return;
            }
            if (stderr) console.error("Python stderr:", stderr);
            console.log("Python output:", stdout);
        }
    );
}

// Example usage
progressiveWeatherFunction(18.9582, 72.8321);
