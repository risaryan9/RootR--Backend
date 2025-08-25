import json
import pandas as pd
from pathlib import Path

INPUT_JSON = Path("weather_data.json")          # change if needed
OUT_HOURLY = Path("weather_hourly.csv")
OUT_DAILY = Path("weather_daily.csv")

def main():
    # 1) load json
    with INPUT_JSON.open("r", encoding="utf-8") as f:
        data = json.load(f)

    # 2) build hourly dataframe
    hourly_df = build_hourly_df(data)

    # 3) build daily dataframe
    daily_df = build_daily_df(data)

    # 4) drop rows with ANY nulls
    hourly_df = hourly_df.dropna(how="any")
    daily_df = daily_df.dropna(how="any")

    # 5) sort by time & save
    hourly_df = hourly_df.sort_values("time")
    daily_df = daily_df.sort_values("time")

    hourly_df.to_csv(OUT_HOURLY, index=False)
    daily_df.to_csv(OUT_DAILY, index=False)

    print(f"saved: {OUT_HOURLY} ({len(hourly_df)} rows)")
    print(f"saved: {OUT_DAILY} ({len(daily_df)} rows)")


def normalize_values(val):
    """Convert dicts with numeric keys into lists."""
    if isinstance(val, dict):
        try:
            # sort by numeric key just in case
            return [v for k, v in sorted(val.items(), key=lambda x: int(x[0]))]
        except:
            return list(val.values())  # fallback
    return val


def build_hourly_df(data: dict) -> pd.DataFrame:
    """Turn data['hourly'] into a tidy DataFrame."""
    h = data.get("hourly", {})
    if not h:
        raise ValueError("No 'hourly' section found in JSON.")

    # Construct a dict-of-lists -> DataFrame
    df = pd.DataFrame({
        "time": h["time"],
        "temperature_2m": h.get("temperature_2m"),
        "wind_speed_10m": h.get("wind_speed_10m"),
        "wind_direction_10m": h.get("wind_direction_10m"),
        "wind_gusts_10m": h.get("wind_gusts_10m"),
        "soil_temperature_0_to_7cm": h.get("soil_temperature_0_to_7cm"),
        "soil_temperature_7_to_28cm": h.get("soil_temperature_7_to_28cm"),
        "soil_moisture_7_to_28cm": h.get("soil_moisture_7_to_28cm"),
        "soil_moisture_28_to_100cm": h.get("soil_moisture_28_to_100cm"),
        "pressure_msl": h.get("pressure_msl"),
        "rain": h.get("rain"),
        "precipitation": h.get("precipitation"),
        "relative_humidity_2m": h.get("relative_humidity_2m"),
        "dew_point_2m": h.get("dew_point_2m"),
        "apparent_temperature": h.get("apparent_temperature"),
    })

    # parse time to datetime; ensure timezone-naive or aware consistently
    df["time"] = pd.to_datetime(df["time"], errors="coerce")

    # (optional) keep a date column for grouping/joins later
    df["date"] = df["time"].dt.date

    return df

def build_daily_df(data: dict) -> pd.DataFrame:
    """Turn data['daily'] into a tidy DataFrame."""
    d = data.get("daily", {})
    if not d:
        raise ValueError("No 'daily' section found in JSON.")

    safe_dict = {}
    for key in ["time", "temperature_2m_mean", "temperature_2m_max",
                "temperature_2m_min", "wind_speed_10m_max",
                "wind_gusts_10m_max", "shortwave_radiation_sum"]:
        val = d.get(key)
        safe_dict[key] = normalize_values(val)

    df = pd.DataFrame(safe_dict)
    df["time"] = pd.to_datetime(df["time"], errors="coerce")
    df["date"] = df["time"].dt.date
    return df

if __name__ == "__main__":
    main()