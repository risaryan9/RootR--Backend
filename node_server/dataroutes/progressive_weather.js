import { fetchWeatherApi } from 'openmeteo';

async function progressiveWeatherFunction(latitude, longitude) {
    const params = {
        latitude,
        longitude,
        start_date: "2016-08-09",
        end_date: "2024-08-23", 
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
            "wind_direction_10m",
            "wind_gusts_10m",
            "soil_temperature_0_to_7cm",
            "soil_temperature_7_to_28cm",
            "soil_moisture_7_to_28cm",
            "soil_moisture_28_to_100cm",
            "pressure_msl",
            "rain",
            "precipitation",
            "relative_humidity_2m",
            "dew_point_2m",
            "apparent_temperature"
        ]
    };

    const url = "https://archive-api.open-meteo.com/v1/archive";
    const responses = await fetchWeatherApi(url, params);
    const response = responses[0];

    if (!response) {
        console.error("No response from API");
        return;
    }

    const utcOffsetSeconds = response.utcOffsetSeconds();
    const hourly = response.hourly();
    const daily = response.daily();

    if (!hourly || !daily) {
        console.error("No hourly/daily data returned. Check date range or variables.");
        return;
    }

    // --- Construct full hourly timestamps ---
    const fullTimes = [...Array((Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval())].map(
        (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
    );

    // Pick only 12:00 (local noon) entries
    const chosenHour = 12; // 12:00
    const chosenIndices = fullTimes
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => t.getHours() === chosenHour)
        .map(({ i }) => i);

    // Extract filtered data for just 12:00
    function filterVariable(idx) {
        const arr = hourly.variables(idx).valuesArray();
        return chosenIndices.map(i => arr[i]);
    }

    const weatherData = {
        hourly: {
            time: chosenIndices.map(i => fullTimes[i]),
            temperature_2m: filterVariable(0),
            wind_speed_10m: filterVariable(1),
            wind_direction_10m: filterVariable(2),
            wind_gusts_10m: filterVariable(3),
            soil_temperature_0_to_7cm: filterVariable(4),
            soil_temperature_7_to_28cm: filterVariable(5),
            soil_moisture_7_to_28cm: filterVariable(6),
            soil_moisture_28_to_100cm: filterVariable(7),
            pressure_msl: filterVariable(8),
            rain: filterVariable(9),
            precipitation: filterVariable(10),
            relative_humidity_2m: filterVariable(11),
            dew_point_2m: filterVariable(12),
            apparent_temperature: filterVariable(13)
        },
        daily: {
            time: [...Array((Number(daily.timeEnd()) - Number(daily.time())) / daily.interval())].map(
                (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
            ),
            temperature_2m_mean: daily.variables(0).valuesArray(),
            temperature_2m_max: daily.variables(1).valuesArray(),
            temperature_2m_min: daily.variables(2).valuesArray(),
            wind_speed_10m_max: daily.variables(3).valuesArray(),
            wind_gusts_10m_max: daily.variables(4).valuesArray(),
            shortwave_radiation_sum: daily.variables(5).valuesArray()
        }
    };

    console.log("\nHourly", weatherData.hourly);
    console.log("\nDaily data", weatherData.daily);
}

progressiveWeatherFunction(12.9629, 77.5775);