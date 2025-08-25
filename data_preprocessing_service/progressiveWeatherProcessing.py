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

    # 4) drop rows with ANY nulls or zeros
    hourly_df = hourly_df[(hourly_df[["temperature_2m", "precipitation"]] != 0).all(axis=1)]
    daily_df = daily_df[(daily_df != 0.0).all(axis=1)]

    # 4a) keep only every 3rd day
    daily_df = daily_df.iloc[::3].reset_index(drop=True)

    # 4b) round numeric columns to 3 decimals
    num_cols = [
        "temperature_2m_mean",
        "temperature_2m_max",
        "temperature_2m_min",
        "wind_speed_10m_max",
        "wind_gusts_10m_max",
        "shortwave_radiation_sum"
    ]
    daily_df[num_cols] = daily_df[num_cols].round(3)

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

    # Only keep relevant variables
    df = pd.DataFrame({
        "time": h["time"],
        "temperature_2m": h.get("temperature_2m"),
        "wind_speed_10m": h.get("wind_speed_10m"),
        "precipitation": h.get("precipitation"),
        "soil_moisture_7_to_28cm": h.get("soil_moisture_7_to_28cm"),
        "soil_moisture_28_to_100cm": h.get("soil_moisture_28_to_100cm"),
    })

    df["time"] = pd.to_datetime(df["time"], errors="coerce")
    df["date"] = df["time"].dt.date

    return df

def build_daily_df(data: dict) -> pd.DataFrame:
    """Trimmed daily DataFrame for AI modeling."""
    d = data.get("daily", {})
    if not d:
        raise ValueError("No 'daily' section found in JSON.")

    # Keep essential variables
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
