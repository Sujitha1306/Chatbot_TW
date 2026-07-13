import { DEFAULT_ROOM_COLOR, COLOR_MAP } from '../constants/map.constants';

/**
 * Parse color string to THREE.js hex color number
 */
export function parseColor(colorStr: string | null): number {
    if (!colorStr || colorStr === 'null') return DEFAULT_ROOM_COLOR;

    colorStr = colorStr.trim();
    if (colorStr.startsWith('#')) {
        return parseInt(colorStr.substring(1), 16);
    }

    return COLOR_MAP[colorStr.toLowerCase()] || DEFAULT_ROOM_COLOR;
}