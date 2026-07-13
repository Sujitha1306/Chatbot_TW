import * as THREE from 'three';

import {
    LABEL_FONT_FAMILY,
    LABEL_HEIGHT
} from '../constants/map.constants';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function splitRoomNameIntoTwoLines(text: string): [string, string?] {
    const trimmed = (text ?? '').trim();
    if (!trimmed) return [''];
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return [trimmed];
    if (words.length === 2) return [words[0], words[1]];
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

// ─────────────────────────────────────────────────────────────────────────────
// Category → Material Icons ligature name
// Uses keyword matching on the normalised category ID (LC_ / LC- prefix stripped).
// The returned string is the Material Icons ligature (e.g. "local_hospital").
// ─────────────────────────────────────────────────────────────────────────────

export function getCategoryMaterialIcon(categoryId: string | null | undefined, overrides?: { [catId: string]: string }): string {
    const raw = (categoryId ?? '').trim();
    const id = raw.toLowerCase().replace(/^lc[-_]/i, '');
    if (overrides) {
        if (overrides[raw]) return overrides[raw];
        if (overrides[id]) return overrides[id];
    }

    if (/^ot$|operat|surger/.test(id))                              return 'medical_services';
    if (/otsa|prep|sterile|pre[-_]?op/.test(id))                    return 'clean_hands';
    if (/scrub/.test(id))                                           return 'sanitizer';
    if (/recept|welcome|registr|initial|front[-_]?desk/.test(id))   return 'how_to_reg';
    if (/^co$|corridor|lobby|hall|passage|atrium/.test(id))         return 'directions_walk';
    if (/^int$|ward|intensive|icu|inpatient/.test(id))              return 'monitor_heart';
    if (/lab|laborat|pathol|specimen/.test(id))                     return 'biotech';
    if (/xray|x[-_]?ray|radiol|imag|mri|ct/.test(id))              return 'document_scanner';
    if (/casua|emerg|trauma|^er$|accident/.test(id))                return 'emergency';
    if (/nurs/.test(id))                                            return 'vaccines';
    if (/patient|bed[-_]?room/.test(id))                            return 'hotel';
    if (/cafet|canteen|food|dining/.test(id))                       return 'restaurant';
    if (/pharm|drug/.test(id))                                      return 'local_pharmacy';
    if (/park/.test(id))                                            return 'local_parking';
    if (/stair/.test(id))                                           return 'stairs';
    if (/elev|lift/.test(id))                                       return 'elevator';
    if (/toilet|bath|wc|restroom/.test(id))                         return 'wc';
    if (/record|archive|document/.test(id))                         return 'folder_shared';
    if (/store|storage|supply|inventory/.test(id))                  return 'inventory_2';
    if (/meet|conf|board/.test(id))                                 return 'meeting_room';
    if (/consult|assess|clinic|treatment/.test(id))                 return 'local_hospital';
    if (/rehab|therapy|physio/.test(id))                            return 'self_improvement';
    if (/office|admin|hr|manage/.test(id))                          return 'business_center';
    if (/security|guard/.test(id))                                  return 'security';
    if (/wait|lounge/.test(id))                                     return 'chair';
    if (/dental|tooth/.test(id))                                    return 'dentistry';
    if (/eye|ophthal|vision/.test(id))                              return 'visibility';
    if (/cardio|heart/.test(id))                                    return 'favorite';
    if (/birth|matern|deliver/.test(id))                            return 'child_care';
    if (/child|pediatr|infant/.test(id))                            return 'child_care';
    if (/elder|geriat|senior/.test(id))                             return 'elderly';
    if (/mental|psych|counsel/.test(id))                            return 'psychology';
    if (/diet|nutrit/.test(id))                                     return 'nutrition';
    if (/blood|transf/.test(id))                                    return 'bloodtype';
    if (/icu|critical|resus/.test(id))                              return 'monitor_heart';
    if (/oncol|cancer|chemo/.test(id))                              return 'health_and_safety';
    if (/usg|ultrasound|echo/.test(id))                             return 'sensors';
    if (/endoscop|scope/.test(id))                                  return 'search';

    return 'place'; // generic fallback for any unmapped category
}

// ─────────────────────────────────────────────────────────────────────────────
// Category → circle background colour
// ─────────────────────────────────────────────────────────────────────────────

export function getCategoryColor(categoryId: string | null | undefined, overrides?: { [catId: string]: string }): string {
    const raw = (categoryId ?? '').trim();
    const id = raw.toLowerCase().replace(/^lc[-_]/i, '');
    if (overrides) {
        if (overrides[raw]) return overrides[raw];
        if (overrides[id]) return overrides[id];
    }

    if (/stair|escalat/.test(id))                                          return '#8d6e63'; // brown 400    – stairs
    if (/elev|lift/.test(id))                                              return '#1e88e5'; // blue 600     – elevator
    if (/pharm|drug/.test(id))                                             return '#26a69a'; // teal 400     – pharmacy
    if (/recept|welcome|registr|initial|front[-_]?desk|opd/.test(id))     return '#ff9800'; // orange 500   – OPD / reception
    if (/casua|emerg|trauma|^er$|accident/.test(id))                       return '#e53935'; // red 600      – emergency
    if (/lab|laborat|pathol|specimen/.test(id))                            return '#8e24aa'; // purple 600   – lab
    if (/^ot$|operat|surger/.test(id))                                     return '#d81b60'; // pink 600     – OT / surgery
    if (/otsa|prep|sterile|pre[-_]?op|scrub/.test(id))                    return '#e91e63'; // pink 500     – pre-op / scrub
    if (/^int$|ward|intensive|icu|inpatient|nurs/.test(id))               return '#1e88e5'; // blue 600     – ward / ICU
    if (/xray|x[-_]?ray|radiol|imag|mri|ct|usg|ultrasound|echo/.test(id)) return '#5e35b1'; // deep-purple 600 – radiology
    if (/cafet|canteen|food|dining/.test(id))                              return '#43a047'; // green 600    – cafeteria
    if (/toilet|bath|wc|restroom/.test(id))                                return '#039be5'; // light-blue 600 – restroom
    if (/park/.test(id))                                                   return '#7cb342'; // light-green 600 – parking
    if (/meet|conf|board/.test(id))                                        return '#546e7a'; // blue-grey 600 – meeting
    if (/office|admin|hr|manage/.test(id))                                 return '#607d8b'; // blue-grey 500 – admin
    if (/security|guard/.test(id))                                         return '#546e7a'; // blue-grey 600 – security
    if (/wait|lounge/.test(id))                                            return '#29b6f6'; // light-blue 400 – waiting
    if (/consult|assess|clinic|treatment/.test(id))                        return '#00acc1'; // cyan 600     – consultation
    if (/rehab|therapy|physio/.test(id))                                   return '#66bb6a'; // green 400    – rehab
    if (/dental|tooth/.test(id))                                           return '#039be5'; // light-blue 600 – dental
    if (/eye|ophthal|vision/.test(id))                                     return '#29b6f6'; // light-blue 400 – eye
    if (/cardio|heart/.test(id))                                           return '#ef5350'; // red 400      – cardio
    if (/birth|matern|deliver|child|pediatr|infant/.test(id))             return '#ec407a'; // pink 400     – maternity
    if (/elder|geriat|senior/.test(id))                                    return '#42a5f5'; // blue 400     – geriatrics
    if (/mental|psych|counsel/.test(id))                                   return '#ab47bc'; // purple 400   – mental health
    if (/oncol|cancer|chemo/.test(id))                                     return '#ec407a'; // pink 400     – oncology
    if (/blood|transf/.test(id))                                           return '#ef5350'; // red 400      – blood bank
    if (/store|storage|supply|inventory|record|archive/.test(id))         return '#78909c'; // blue-grey 400 – storage
    if (/^co$|corridor|lobby|hall|passage|atrium/.test(id))               return '#90a4ae'; // blue-grey 300 – corridor

    return '#42a5f5'; // default blue 400
}

// ─────────────────────────────────────────────────────────────────────────────
// Material Icons font loader (loads once, shared across all sprites)
// ─────────────────────────────────────────────────────────────────────────────

const MATERIAL_ICON_FONT = 'Material Icons';
const MATERIAL_ICON_SIZE = 120; // px in the 256×256 canvas

let _materialFontPromise: Promise<boolean> | null = null;

function loadMaterialIconFont(): Promise<boolean> {
    if (!_materialFontPromise) {
        _materialFontPromise = document.fonts
            .load(`${MATERIAL_ICON_SIZE}px "${MATERIAL_ICON_FONT}"`)
            .then(() => document.fonts.check(`${MATERIAL_ICON_SIZE}px "${MATERIAL_ICON_FONT}"`))
            .catch(() => false);
    }
    return _materialFontPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined label sprite: category icon circle (left) + room name text (right)
// Both share the same canvas so icon and text are perfectly same-line aligned.
// ─────────────────────────────────────────────────────────────────────────────

export function createLabel(
    text: string,
    x: number,
    z: number,
    parent: THREE.Object3D,
    locationCategoryId: string | null = null,
    labelHeight: number = LABEL_HEIGHT,
    labelScale: number = 1.0,
    disLocLevel: number | null = null,
    categoryColors?: { [catId: string]: string },
    categoryIcons?: { [catId: string]: string },
    textSide: 'right' | 'left' = 'right'
): THREE.Sprite {
    // Whether to draw the icon circle (null categoryId means skipIcon=true in map-config)
    const showIcon = locationCategoryId !== null;

    // Canvas geometry — height is fixed; width expands to fit the full name.
    const CH = 300;
    const ICY = 150, IR = 118;
    const TS = 150;
    const ICON_TEXT_GAP = 20;
    const fontSize = TS;
    const PADDING = 16;

    // Pre-measure using bold font — bold glyphs are wider than normal, so measuring with
    // bold guarantees the canvas is large enough for both the default and selected states.
    const _mCtx = document.createElement('canvas').getContext('2d')!;
    _mCtx.font = `800 ${fontSize}px ${LABEL_FONT_FAMILY}`;
    const fullTextWidth = _mCtx.measureText((text ?? '').trim()).width;

    // The icon is always at canvas centre (CW/2) — this keeps the sprite anchored on the
    // room centroid with no X offset.  Text extends to one side of the icon, so the
    // minimum half-width needed on that side is: IR + GAP + textWidth + PADDING.
    const halfNeeded = showIcon
        ? Math.ceil(IR + ICON_TEXT_GAP + fullTextWidth + PADDING)
        : Math.ceil(fullTextWidth / 2 + PADDING);
    const CW = Math.max(halfNeeded * 2, 300);

    const ICX = CW / 2;
    const TX_START = showIcon
        ? (textSide === 'right' ? ICX + IR + ICON_TEXT_GAP : PADDING)
        : PADDING;
    const TX_END = showIcon
        ? (textSide === 'right' ? CW - PADDING : ICX - IR - ICON_TEXT_GAP)
        : CW - PADDING;
    const textAlign: CanvasTextAlign = showIcon ? (textSide === 'right' ? 'left' : 'right') : 'center';
    const TX = showIcon ? (textSide === 'right' ? TX_START : TX_END) : (CW / 2);
    const TY = CH / 2;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = CW;
    canvas.height = CH;

    const catColor = showIcon ? getCategoryColor(locationCategoryId, categoryColors) : '#1a1a1a';

    const texture = new THREE.Texture(canvas);

    let currentTextColor: string = '#1a1a1a';
    let currentBold: boolean = false;
    let resolvedGlyph: string | null = null;

    function redrawTexture(glyphName: string | null, textColor: string, bold: boolean = false) {
        ctx.clearRect(0, 0, CW, CH);

        if (showIcon) {
            // ── icon circle background — always uses catColor, never the highlight ──
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.22)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 3;
            ctx.fillStyle = catColor;
            ctx.beginPath();
            ctx.arc(ICX, ICY, IR, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.78)';
            ctx.lineWidth = 7;
            ctx.stroke();
            ctx.restore();

            // ── icon glyph (white Material Icon) ───────────────────────
            if (glyphName) {
                ctx.save();
                ctx.font = `100px "${MATERIAL_ICON_FONT}"`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'white';
                ctx.fillText(glyphName, ICX, ICY + 5);
                ctx.restore();
            }
        }

        // ── flat text fill ──
        ctx.save();
        ctx.font = `${bold ? '800 ' : '600 '}${fontSize}px ${LABEL_FONT_FAMILY}`;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textColor;
        ctx.fillText((text ?? '').trim(), TX, TY);
        ctx.restore();

        texture.needsUpdate = true;
    }

    // Initial render: circle + text, icon glyph added async after font loads
    redrawTexture(null, currentTextColor, currentBold);
    texture.needsUpdate = true;

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
    }));
    // Render after all floor/wall geometry so the transparent floor mesh can never
    // overwrite label pixels when the camera is rotated to an angled view.
    sprite.renderOrder = 999;

    // Scale X proportionally to the dynamic canvas width so pixel density stays constant.
    // Reference: 1400 canvas px = 6.84 world units  →  204.8 px/wu
    const BASE_SX = CW / 204.8;
    const BASE_SY = 1.41; // CH=300 is fixed → 300/213.3 ≈ 1.41
    // ICX = CW/2, so (0.5 - ICX/CW) = 0 — sprite centre is exactly at the room centroid (x, z).
    // No X offset needed; sprite is anchored on the room regardless of camera tilt.
    sprite.position.set(x, labelHeight, z);
    sprite.scale.set(BASE_SX * labelScale, BASE_SY * labelScale, 1);
    sprite.userData = {
        type: 'room-label',
        locationCategoryId,
        disLocLevel,
        fixedSX: BASE_SX * labelScale,
        fixedSY: BASE_SY * labelScale,
        highlightScaleActive: false,
        // Called by highlight.utils to change the name text colour and weight.
        setTextColor: (hexCss: string | null, bold?: boolean) => {
            currentTextColor = hexCss ?? '#1a1a1a';
            currentBold = bold ?? false;
            redrawTexture(resolvedGlyph, currentTextColor, currentBold);
        },
        // Called by highlight.utils to make the start/end label slightly larger.
        // Only sets sprite.scale when boosting (active=true) so that zoom-adjusted
        // scale set by LabelVisibilityService is never overridden on deactivation.
        setHighlightScale: (active: boolean) => {
            const m = active ? 1.3 : 1.0;
            sprite.userData['fixedSX'] = BASE_SX * labelScale * m;
            sprite.userData['fixedSY'] = BASE_SY * labelScale * m;
            sprite.userData['highlightScaleActive'] = active;
            sprite.scale.set(BASE_SX * labelScale * m, BASE_SY * labelScale * m, 1);
        }
    };
    parent.add(sprite);

    // Async: bake in the icon glyph once Material Icons font is ready (only when icon is shown)
    if (showIcon) {
        const glyphName = getCategoryMaterialIcon(locationCategoryId, categoryIcons);
        loadMaterialIconFont().then(loaded => {
            resolvedGlyph = loaded ? glyphName : null;
            redrawTexture(resolvedGlyph, currentTextColor, currentBold);
        });
    }

    return sprite;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon sprite (blue circle + Material Icon glyph)
// At low zoom the sprite scale is kept small so it looks like a dot.
// At high zoom it grows into the full icon (controlled by LabelVisibilityService).
// ─────────────────────────────────────────────────────────────────────────────

export function createLabelIconSprite(
    locationCategoryId: string | null,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D,
    size: number = 3.0,
    disLocLevel: number | null = null,
    categoryColors?: { [catId: string]: string },
    categoryIcons?: { [catId: string]: string }
): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 256;
    const CX = 128, CY = 128, R = 108;

    const circleColor = getCategoryColor(locationCategoryId, categoryColors);

    /** Draws the category-coloured circle base.
     *  dotOnly=true → fills the whole canvas with a solid circle (crisp dot when scaled small).
     *  dotOnly=false → adds the white ring border for the full icon style. */
    function drawBase(dotOnly = false) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.shadowColor = 'rgba(0,0,0,0.28)';
        ctx.shadowBlur = dotOnly ? 0 : 16;
        ctx.shadowOffsetY = dotOnly ? 0 : 4;
        ctx.fillStyle = circleColor;
        ctx.beginPath();
        ctx.arc(CX, CY, dotOnly ? 128 : R, 0, Math.PI * 2); // full-radius fill for dot mode
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        if (!dotOnly) {
            ctx.strokeStyle = 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 6;
            ctx.stroke();
        }
    }

    /** Overlays the Material Icon glyph in white. */
    function drawMaterialIcon(iconName: string) {
        ctx.font = `${MATERIAL_ICON_SIZE}px "${MATERIAL_ICON_FONT}"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(iconName, CX, CY + 6); // +6 for optical vertical alignment
    }

    // Initial render: solid dot (no ring, no icon) — looks crisp when sprite is tiny
    drawBase(true);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
    }));
    // Same as label sprite — must render after floor meshes to stay unaffected by camera tilt.
    sprite.renderOrder = 999;
    sprite.position.set(x, y, z);
    sprite.scale.set(size, size, 1);
    sprite.userData = { type: 'room-icon', locationCategoryId, disLocLevel, fullScale: size };
    parent.add(sprite);

    // Async: once Material Icons font is available, bake the full icon into the texture.
    // The LabelVisibilityService controls the sprite scale — at low zoom it stays
    // at ICON_DOT_SCALE so only the solid blue fill is visible (dot appearance).
    // At high zoom it grows to fullScale, revealing the icon + ring.
    const iconName = getCategoryMaterialIcon(locationCategoryId, categoryIcons);
    loadMaterialIconFont().then(loaded => {
        drawBase(false); // full style: ring border + shadow
        if (loaded) {
            drawMaterialIcon(iconName);
        }
        texture.needsUpdate = true;
    });

    return sprite;
}
