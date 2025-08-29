function latLngToTile(lat, lng, zoom) {
  const latRad = lat * Math.PI / 180;
  const n = Math.pow(2, zoom);

  const xTile = Math.floor((lng + 180) / 360 * n);
  const yTile = Math.floor(
    (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n
  );

  return { x: xTile, y: yTile, z: zoom };
}

export default latLngToTile;