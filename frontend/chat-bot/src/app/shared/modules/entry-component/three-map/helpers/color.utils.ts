import * as THREE from 'three';
import { DEFAULT_ROOM_COLOR } from '../constants/map.constants';

/**
 * Parse color string to THREE.js hex color number
 */
export function parseColor(colorStr: string | null): number {
    if (!colorStr || colorStr === 'null') return DEFAULT_ROOM_COLOR;

    colorStr = colorStr.trim();
    if (colorStr.startsWith('#')) {
        if (colorStr.length === 9) {
            colorStr = colorStr.substring(0, 7);
        }
    }

    try {
        const color = new THREE.Color(colorStr.toLowerCase());
        return color.getHex();
    } catch (e) {
        return DEFAULT_ROOM_COLOR;
    }
}

/**
 * Extract opacity from color string if it is an 8-digit hex color (#RRGGBBAA)
 */
export function parseColorOpacity(colorStr: string | null): number | undefined {
    if (!colorStr || colorStr === 'null') return undefined;

    colorStr = colorStr.trim();
    if (colorStr.startsWith('#') && colorStr.length === 9) {
        const alphaHex = colorStr.substring(7, 9);
        const alphaVal = parseInt(alphaHex, 16);
        if (!isNaN(alphaVal)) {
            return alphaVal / 255.0;
        }
    }
    return undefined;
}