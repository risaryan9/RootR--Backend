import json
import pandas as pd
from pathlib import Path

INPUT_JSON = Path("pollution_data.json")          # change if needed
OUT_HOURLY = Path("pollution_hourly.csv")

def main():
    # 1) load json
    with INPUT_JSON.open("r", encoding="utf-8") as f:
        data = json.load(f)

    # 2) build hourly dataframe
    hourly_df = build_hourly_df(data)


    # 3) drop rows with ANY nulls or zeros
    hourly_df = hourly_df.dropna(subset=["pm2_5", "nitrogen_dioxide", "sulphur_dioxide"])

    # 3a) round numeric columns to 3 decimals
    num_cols = [
        "pm2_5",
        "pm10",
        "carbon_dioxide",
        "carbon_monoxide",
        "nitrogen_dioxide",
        "sulphur_dioxide",
        "ozone",
    ]
    hourly_df[num_cols] = hourly_df[num_cols].round(3)

    # 4) sort by time & save
    hourly_df = hourly_df.sort_values("time")

    hourly_df.to_csv(OUT_HOURLY, index=False)

    print(f"saved: {OUT_HOURLY} ({len(hourly_df)} rows)")


def build_hourly_df(data: dict) -> pd.DataFrame:
    """Turn data['hourly'] into a tidy DataFrame."""
    h = data.get("hourly", {})
    if not h:
        raise ValueError("No 'hourly' section found in JSON.")

    # Only keep relevant variables
    df = pd.DataFrame({
        "time": h["time"],
        "pm2_5" : h.get("pm2_5"),
        "pm10": h.get("pm10"),
        "carbon_dioxide": h.get("carbon_dioxide"),
        "carbon_monoxide": h.get("carbon_monoxide"),
        "nitrogen_dioxide": h.get("nitrogen_dioxide"),
        "sulphur_dioxide": h.get("sulphur_dioxide"),
        "ozone" : h.get("ozone"),
    })

    df["time"] = pd.to_datetime(df["time"], errors="coerce")
    df["date"] = df["time"].dt.date

    return df


if __name__ == "__main__":
    main()
