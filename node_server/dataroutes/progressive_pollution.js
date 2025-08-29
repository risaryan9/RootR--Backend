import { fetchWeatherApi } from "openmeteo";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

async function progressivePollutionFunction(latitude, longitude) {
    console.log("Tree 1");

    const today = new Date().toISOString().split("T")[0];

    const params = {
        latitude,
        longitude,
        start_date: "2022-01-01",
        end_date: today,
        hourly: [
            "pm10",
            "pm2_5",
            "carbon_dioxide",
            "carbon_monoxide",
            "nitrogen_dioxide",
            "sulphur_dioxide",
            "ozone"
        ]
    };

    const url = "https://air-quality-api.open-meteo.com/v1/air-quality";
    let responses;

    try {
        responses = await fetchWeatherApi(url, params);
    } catch (err) {
        console.error("Error fetching data from Pollution Open-Meteo API:", err);
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

    if (!hourly) {
        console.warn("No hourly data returned. Skipping this location.");
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
        pm10: filterVariable(0),
        pm2_5: filterVariable(1),
        carbon_dioxide: filterVariable(2),
        carbon_monoxide: filterVariable(3),
        nitrogen_dioxide: filterVariable(4),
        sulphur_dioxide: filterVariable(5),
        ozone: filterVariable(6)
    };

    const pollutionData = { hourly: hourlyData };

    const filePath = path.join(
        "C:/Users/risar/OneDrive/Documents/Desktop/Root Revival- Backend/data_preprocessing_service",
        "pollution_data.json"
    );

    try {
        fs.writeFileSync(filePath, JSON.stringify(pollutionData, null, 2));
    } catch (err) {
        console.error("Error saving pollution_data.json:", err);
        return;
    }

    console.log(`Pollution data saved to ${filePath}`);

    exec(
        `python "progressivePollutionProcessing.py"`,
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
progressivePollutionFunction(18.9582, 72.8321);
