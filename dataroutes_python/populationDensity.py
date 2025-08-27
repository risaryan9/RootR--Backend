import rasterio
from rasterio.transform import rowcol
import numpy as np
from math import cos, radians

# Path to WorldPop GeoTIFF (India, 2020, 1km resolution)
tif_path = "ind_ppp_2020_1km_Aggregated.tif"

# Chandni Chowk coordinates
latitude = 23.5451
longitude = 74.4405

# Radius around point (in meters)
radius_m = 50000 

with rasterio.open(tif_path) as src:
    print("Raster CRS:", src.crs)
    print("Raster resolution:", src.res)
    print("Nodata value:", src.nodata)

    # Convert lat/lon → row/col index
    row, col = rowcol(src.transform, longitude, latitude)

    # Pixel size in degrees
    pixel_width = src.transform.a
    pixel_height = -src.transform.e

    # Convert radius from meters → degrees
    meters_per_degree_lat = 111_320
    meters_per_degree_lon = 111_320 * cos(radians(latitude))

    radius_deg_x = radius_m / meters_per_degree_lon
    radius_deg_y = radius_m / meters_per_degree_lat

    # Pixels in radius
    radius_px_x = int(radius_deg_x / pixel_width)
    radius_px_y = int(radius_deg_y / pixel_height)

    # Read values in window
    window = src.read(
        1,
        window=((row - radius_px_y, row + radius_px_y),
                (col - radius_px_x, col + radius_px_x))
    )

    # Remove nodata
    nodata = src.nodata
    if nodata is not None:
        mask = window[window != nodata]
    else:
        mask = window

    if mask.size > 0:
        avg_density = np.mean(mask)   # people/km²
        total_population = np.sum(mask)  # total people in that window
        print(f"Average population density (people/km²) within {radius_m/1000:.1f} km of ({latitude}, {longitude}): {avg_density:.2f}")
        print(f"Total estimated population in {radius_m/1000:.1f} km radius: {int(total_population)}")
    else:
        print("No valid population data found in this area.")
