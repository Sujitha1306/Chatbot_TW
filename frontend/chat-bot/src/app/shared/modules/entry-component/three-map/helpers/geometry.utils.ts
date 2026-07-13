/**
 * Shrink polygon coordinates towards its center
 */
export function shrinkPolygon(coords: number[][], offset: number): number[][] {
    if (coords.length < 3) return coords;

    // Calculate centroid
    let cx = 0, cz = 0;
    coords.forEach(([x, z]) => {
        cx += x;
        cz += z;
    });
    cx /= coords.length;
    cz /= coords.length;

    return coords.map(([x, z]) => {
        const dx = x - cx;
        const dz = z - cz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.001) return [x, z];

        // Move point towards centroid
        const scale = Math.max(0, dist - offset) / dist;
        return [cx + dx * scale, cz + dz * scale];
    });
}