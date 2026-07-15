export function latLonToMeters(lat: number, lon: number): [number, number] {
    const x = lon * 20037508.34 / 180;
    let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * 20037508.34 / 180;
    return [x, y];
}

export function getTileXy(lat: number, lon: number, zoom: number): { x: number, y: number } {
    const n = Math.pow(2, zoom);
    const xtile = Math.floor((lon + 180) / 360 * n);
    const ytile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x: xtile, y: ytile };
}

export function getTileBounds(xtile: number, ytile: number, zoom: number): {
    north: number, south: number, east: number, west: number,
    centerX: number, centerY: number,
    width: number, height: number
} {
    const n = Math.pow(2, zoom);
    const lonWest = xtile / n * 360 - 180;
    const lonEast = (xtile + 1) / n * 360 - 180;
    const latNorth = Math.atan(Math.sinh(Math.PI * (1 - 2 * ytile / n))) * 180 / Math.PI;
    const latSouth = Math.atan(Math.sinh(Math.PI * (1 - 2 * (ytile + 1) / n))) * 180 / Math.PI;

    const [west, north] = latLonToMeters(latNorth, lonWest);
    const [east, south] = latLonToMeters(latSouth, lonEast);

    return {
        north, south, east, west,
        centerX: (west + east) / 2,
        centerY: (north + south) / 2,
        width: Math.abs(east - west),
        height: Math.abs(north - south)
    };
}

/**
 * Build a map tile URL for the given provider type.
 * tileType values: 'osm'
 */
export function getTileUrl(xtile: number, ytile: number, zoom: number, tileType: string = 'osm'): string {
    // const sub = (xtile + ytile) % 4; // 0-3 load-balance across Google tile servers
    switch (tileType) {
        /*
        case 'google_satellite':
            return `https://mt${sub}.google.com/vt/lyrs=s&x=${xtile}&y=${ytile}&z=${zoom}`;
        case 'google_hybrid':
            return `https://mt${sub}.google.com/vt/lyrs=y&x=${xtile}&y=${ytile}&z=${zoom}`;
        case 'google_terrain':
            return `https://mt${sub}.google.com/vt/lyrs=p&x=${xtile}&y=${ytile}&z=${zoom}`;
        */
        case 'osm':
        default:
            return `https://tile.openstreetmap.org/${zoom}/${xtile}/${ytile}.png`;
        /*
        case 'google_road':
        default:
            return `https://mt${sub}.google.com/vt/lyrs=r&x=${xtile}&y=${ytile}&z=${zoom}`;
        */
    }
}

/**
 * Gets a 21x21 grid of tiles around a target Lat/Long
 */
export function getTileGrid(lat: number, lon: number, zoom: number, tileType: string = 'osm') {
    const centerTile = getTileXy(lat, lon, zoom);
    const tiles = [];

    for (let dy = -10; dy <= 10; dy++) {
        for (let dx = -10; dx <= 10; dx++) {
            const x = centerTile.x + dx;
            const y = centerTile.y + dy;
            const bounds = getTileBounds(x, y, zoom);
            const url = getTileUrl(x, y, zoom, tileType);
            tiles.push({ x, y, url, bounds });
        }
    }

    return tiles;
}
