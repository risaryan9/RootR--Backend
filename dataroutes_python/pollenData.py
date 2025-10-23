import rasterio
from rasterio.transform import rowcol
import numpy as np
from math import cos, radians

# Path to your pollen data raster
tif_path = "pollen_concentration_2020_1km.tif"

# Example location (latitude, longitude)
latitude = 23.5451
longitude = 74.4405

# Radius (in meters) around the given point
radius_m = 50_000  # 50 km

# --- Open and read raster ---
with rasterio.open(tif_path) as src:
    print("Raster CRS:", src.crs)
    print("Raster resolution (deg/pixel):", src.res)
    print("Nodata value:", src.nodata)

    # Convert geographic coordinates (lon, lat) to raster row/col
    row, col = rowcol(src.transform, longitude, latitude)

    # Get pixel size in degrees
    pixel_width = src.transform.a
    pixel_height = -src.transform.e

    # --- Convert meters to degrees ---
    meters_per_degree_lat = 111_320
    meters_per_degree_lon = 111_320 * cos(radians(latitude))

    radius_deg_x = radius_m / meters_per_degree_lon
    radius_deg_y = radius_m / meters_per_degree_lat

    # --- Convert degrees to pixels ---
    radius_px_x = int(radius_deg_x / pixel_width)
    radius_px_y = int(radius_deg_y / pixel_height)


    window = src.read(
        1,
        window=((row - radius_px_y, row + radius_px_y),
                (col - radius_px_x, col + radius_px_x))
    )


    nodata = src.nodata
    if nodata is not None:
        valid_data = window[window != nodata]
    else:
        valid_data = window

    # --- Calculate metrics ---
    if valid_data.size > 0:
        avg_pollen = np.mean(valid_data)      # average pollen concentration
        total_pollen = np.sum(valid_data)     # total pollen load in area
        max_pollen = np.max(valid_data)       # optional: peak pollen
        min_pollen = np.min(valid_data)       # optional: lowest pollen

        print(f"\n📍 Location: ({latitude}, {longitude})")
        print(f"📏 Radius: {radius_m/1000:.1f} km")
        print(f"🌿 Average pollen concentration: {avg_pollen:.2f} (units depend on dataset)")
        print(f"🌿 Total pollen load: {total_pollen:.2f}")
        print(f"🌿 Peak pollen: {max_pollen:.2f}, Lowest pollen: {min_pollen:.2f}")
    else:
        print("⚠️ No valid pollen data found in this area.")
