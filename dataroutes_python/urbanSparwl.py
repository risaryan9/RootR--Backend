import rasterio
import numpy as np
import matplotlib.pyplot as plt

urban_2000_path = "urban_2000.tif"
urban_2020_path = "urban_2020.tif"

with rasterio.open(urban_2000_path) as src1, rasterio.open(urban_2020_path) as src2:
    if src1.shape != src2.shape:
        raise ValueError("Rasters have different shapes. They must be aligned grids.")

    print("CRS:", src1.crs)
    print("Resolution:", src1.res)

    urban_2000 = src1.read(1)
    urban_2020 = src2.read(1)

    nodata1 = src1.nodata
    nodata2 = src2.nodata

    mask_2000 = (urban_2000 != nodata1) if nodata1 is not None else np.ones_like(urban_2000, dtype=bool)
    mask_2020 = (urban_2020 != nodata2) if nodata2 is not None else np.ones_like(urban_2020, dtype=bool)
    valid_mask = mask_2000 & mask_2020

    base = np.where(valid_mask, urban_2000, 0)
    recent = np.where(valid_mask, urban_2020, 0)

    change_map = np.zeros_like(base, dtype=np.int8)
    change_map[(base == 0) & (recent == 1)] = 1
    change_map[(base == 1) & (recent == 1)] = 2
    change_map[(base == 1) & (recent == 0)] = -1

    total_pixels = np.sum(valid_mask)
    urban_2000_count = np.sum(base == 1)
    urban_2020_count = np.sum(recent == 1)
    new_urban = np.sum(change_map == 1)
    lost_urban = np.sum(change_map == -1)

    pixel_area_km2 = src1.res[0] * src1.res[1]
    urban_2000_area = urban_2000_count * pixel_area_km2
    urban_2020_area = urban_2020_count * pixel_area_km2
    new_urban_area = new_urban * pixel_area_km2

    growth_rate = ((urban_2020_area - urban_2000_area) / urban_2000_area) * 100 if urban_2000_area > 0 else 0

    print("\n===== 🏙️ Urban Sprawl Report =====")
    print(f"Urban area in 2000: {urban_2000_area:.2f} km²")
    print(f"Urban area in 2020: {urban_2020_area:.2f} km²")
    print(f"Newly urbanized area: {new_urban_area:.2f} km²")
    print(f"Lost urban area: {lost_urban * pixel_area_km2:.2f} km²")
    print(f"Urban growth rate (2000–2020): {growth_rate:.2f}%")
    print("===================================")

plt.figure(figsize=(8, 6))
plt.title("Urban Sprawl Change Map (2000–2020)")
plt.imshow(change_map, cmap="bwr", interpolation="none")
plt.colorbar(label="Change Legend\n-1=Lost, 0=Non-urban, 1=New Urban, 2=Stable Urban")
plt.xlabel("X Pixels")
plt.ylabel("Y Pixels")
plt.show()
