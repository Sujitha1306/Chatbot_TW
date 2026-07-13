
export const SCENE_BACKGROUND_COLOR = '#fafafa';

export const CAMERA_FOV = 50;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 5000;
export const CAMERA_INITIAL_POSITION = { x: 50, y: 100, z: 50 };

export const RENDERER_PIXEL_RATIO_MAX = 2;

export const CONTROLS_DAMPING_FACTOR = 0.05;
export const CONTROLS_MAX_POLAR_ANGLE = Math.PI / 2.1;
export const CONTROLS_MAX_DISTANCE = 1500;
export const CONTROLS_MIN_DISTANCE = 10;

export const AMBIENT_LIGHT_COLOR = 0xFFFBF0;  // Warm White Tint
export const AMBIENT_LIGHT_INTENSITY = 0.9;
export const SUN_LIGHT_COLOR = 0xFFF9E6;      // Soft Golden Sun
export const SUN_LIGHT_INTENSITY = 0.8;
export const SUN_LIGHT_POSITION = { x: 100, y: 150, z: 100 };
export const SUN_SHADOW_MAP_SIZE = 4096;
export const SUN_SHADOW_CAMERA_SIZE = 150;
export const FILL_LIGHT_COLOR = 0xFFFBF0;
export const FILL_LIGHT_INTENSITY = 0.7;
export const FILL_LIGHT_POSITION = { x: -50, y: 100, z: -50 };

export const DEFAULT_ROOM_COLOR = 0xE8E8E8;
export const WALL_HEIGHT = 0.5;
export const WALL_THICKNESS = 0.20;
export const WALL_COLOR = '#afc7cb';               // Rich Slate Greige (Deepest depth)
export const WALL_EMISSIVE_INTENSITY = 1.0;       // Perfectly uniform self-lit state
export const WALL_OPACITY = 1.0;                  // Fully opaque
export const WALL_ROUGHNESS = 0.4;                // Slightly smoother for warm light pickup
export const WALL_METALNESS = 0.0;                // Non-metallic
export const FLOOR_OPACITY = 0.4;                // Softer, pastel look
export const POLYGON_SHRINK_OFFSET = 0.12;
export const MIN_WALL_LENGTH = 0.1;

export const FLOOR_STACK_HEIGHT = 3.5;
export const FLOOR_3D_EXTRUDE_HEIGHT = 1;

export const FLOOR_IMAGE_OPACITY = 1.0;


export const LABEL_CANVAS_WIDTH = 1024;
export const LABEL_CANVAS_HEIGHT = 384;
export const LABEL_FONT_SIZE = 140;
export const LABEL_FONT_FAMILY = '"Segoe UI", Roboto, Arial';
export const LABEL_STROKE_COLOR = 'white';
export const LABEL_STROKE_WIDTH = 14;
export const LABEL_SHADOW_COLOR = 'rgba(0, 0, 0, 0.3)';
export const LABEL_SHADOW_BLUR = 12;
export const LABEL_SHADOW_OFFSET = { x: 3, y: 3 };
export const LABEL_TEXT_COLOR = '#0F172A';        // Slate 900 (Deep contrast)
export const LABEL_HEIGHT = 1.5;
export const LABEL_SCALE = { x: 5, y: 1.8, z: 1 };

// ============================================================================
// MARKERS (3D Pins)
// ============================================================================
export const MARKER_HEIGHT_OFFSET = 1.2;
export const MARKER_PIN_RADIUS = 1.5;
export const MARKER_PIN_SEGMENTS = 16;
export const MARKER_PIN_CONE_HEIGHT = 2.5;
export const MARKER_PIN_CONE_RADIUS = 0.8;
export const MARKER_BOB_SPEED = 0.003;
export const MARKER_BOB_HEIGHT = 1.0;

// ============================================================================
// HIGHLIGHT COLORS - Dark colors for bright theme
// ============================================================================
export const HIGHLIGHT_SELECTED_COLOR = 0x4F46E5;          // Rich Indigo (Indigo 600)
export const HIGHLIGHT_SELECTED_INTENSITY = 1.0;
export const HIGHLIGHT_SELECTED_WALL_INTENSITY = 0.8;
export const HIGHLIGHT_HOVER_COLOR = 0x1D4ED8;             // Deeper Blue (Blue 700)
export const HIGHLIGHT_HOVER_INTENSITY = 1.0;
export const HIGHLIGHT_HOVER_WALL_INTENSITY = 1.0;
export const HIGHLIGHT_START_COLOR = 0x10B981;             // Emerald 500 (Start)
export const HIGHLIGHT_DESTINATION_COLOR = 0xEF4444;       // Red 500 (Destination)

// ============================================================================
// NAVIGATION/PATHFINDING
// ============================================================================
export const CORRIDOR_KEYWORDS = ['corridor', 'lobby', 'hall', 'stair', 'reception', 'entrance', 'passage'];
export const ROOM_TO_ROOM_THRESHOLD = 0;
export const CORRIDOR_TO_CORRIDOR_THRESHOLD = 30.0;
export const ROOM_TO_CORRIDOR_THRESHOLD = 40.0;

// ============================================================================
// NAVIGATION GRAPH VISUALIZATION
// ============================================================================
export const GRAPH_LINK_COLOR = 0xC8C8C8;        // Light gray — path edges
export const GRAPH_NODE_NN_COLOR = 0x9CA3AF;     // Gray-400 — normal/corridor nodes (NT-NN)
export const GRAPH_NODE_RN_COLOR = 0xF97316;     // Orange-500 — room entry nodes (NT-RN)
export const GRAPH_NODE_RADIUS = 0.6;
export const GRAPH_NODE_SEGMENTS = 8;

// ============================================================================
// ROUTE VISUALIZATION - Flat ribbon path
// ============================================================================
export const ROUTE_DOT_RADIUS = 0.8;
export const ROUTE_DOT_SEGMENTS = 12;
export const ROUTE_DOT_COLOR = 0x4F46E5;           // Legacy — kept for fallback refs
export const ROUTE_PATH_COLOR = 0x126995;           // #126995 — indigo ribbon color
export const ROUTE_RIBBON_WIDTH = 0.9;              // Ribbon width in world units
export const ROUTE_RIBBON_Y = 0.3;                  // Height above floor surface — clear of floor polygons (y=0.1)
export const ROUTE_RIBBON_SAMPLES = 500;            // Curve sample density (smoothness)
export const ROUTE_CORNER_RADIUS = 0.1;             // World-unit radius for corner rounding
export const ROUTE_DOT_EMISSIVE_INTENSITY = 1.0;
export const ROUTE_DOT_OPACITY = 0.92;
export const ROUTE_DOT_SPACING = 4;
export const ROUTE_DOT_HEIGHT = 0.6;
export const ROUTE_ANIMATION_SCALE_MIN = 0.8;
export const ROUTE_ANIMATION_SCALE_MAX = 1.2;
export const ROUTE_ANIMATION_SPEED = 0.005;
export const ROUTE_ANIMATION_OFFSET = 0.5;

// ============================================================================
// PERSON/AVATAR - Distinctive coral/orange
// ============================================================================
export const PERSON_BODY_RADIUS = 1.0;
export const PERSON_BODY_HEIGHT = 3.5;
export const PERSON_BODY_SEGMENTS = 12;
export const PERSON_BODY_COLOR = 0xFFFF00;         // Bright Yellow - Highly visible 
export const PERSON_BODY_METALNESS = 0.2;
export const PERSON_BODY_ROUGHNESS = 0.3;
export const PERSON_BODY_Y_OFFSET = 2.0;

export const PERSON_HEAD_RADIUS = 0.8;
export const PERSON_HEAD_SEGMENTS = 16;
export const PERSON_HEAD_COLOR = 0xFFFF00;
export const PERSON_HEAD_Y_OFFSET = 4.2;

export const PERSON_LIMB_RADIUS = 0.35;
export const PERSON_LIMB_HEIGHT = 1.6;
export const PERSON_LIMB_COLOR = 0xFFFF00;
export const PERSON_ARM_Y_OFFSET = 2.8;
export const PERSON_ARM_X_OFFSET = 1.3;
export const PERSON_LEG_Y_OFFSET = 0.8;
export const PERSON_LEG_X_OFFSET = 0.6;

export const PERSON_BASE_RING_RADIUS = 2.0;
export const PERSON_BASE_RING_WIDTH = 0.15;
export const PERSON_BASE_RING_COLOR = 0xFFFF00;
export const PERSON_BASE_RING_OPACITY = 0.65;

export const PERSON_BOB_AMPLITUDE = 0.15;
export const PERSON_BOB_FREQUENCY = 12;

export const PERSON_BASE_MOVE_SPEED = 0.2;
export const PERSON_MIN_MOVE_SPEED = 0.05;
export const PERSON_MAX_MOVE_SPEED = 0.5;
export const PERSON_MOVE_SPEED_REFERENCE_DISTANCE = 100;
export const PERSON_MIN_SEGMENT_LENGTH = 0.1;
export const PERSON_ROTATION_SLERP_FACTOR = 0.15;

// Camera Animation
export const CAMERA_FOCUS_DURATION = 1000;
export const CAMERA_ZOOM_DURATION = 400;
export const CAMERA_ROTATION_RESET_DURATION = 800;
export const CAMERA_ZOOM_IN_FACTOR = 0.8;
export const CAMERA_ZOOM_OUT_FACTOR = 1.25;
export const CAMERA_DISTANCE_RATIO = 0.8;
export const CAMERA_DEFAULT_POSITION_RATIO = 0.5;

// Label Visibility
export const LABEL_VISIBILITY_THRESHOLD_RATIO = 0.95;
export const LABEL_FOCUS_RADIUS_MIN = 0.4;
export const LABEL_FOCUS_RADIUS_MAX = 0.8;

// Compass Control
export const COMPASS_ROTATION_SENSITIVITY = 0.8;
export const COMPASS_TILT_SENSITIVITY = 0.01;
export const COMPASS_MIN_PHI = 0.1;
export const COMPASS_MAX_PHI = Math.PI / 2.1;
export const COMPASS_PIVOT_RADIUS = 0.6;
export const COMPASS_PIVOT_SENSITIVITY = 1.0;
export const COMPASS_DAMPING_FACTOR = 0.08;

// Floor Scaling
export const FLOOR_MAX_DISTANCE_MULTIPLIER = 2.5;
export const FLOOR_MIN_DISTANCE_MULTIPLIER = 0.05;
export const FLOOR_MIN_DISTANCE_ABSOLUTE = 10;

// Geographic Configuration (OSM Alignment)
export const BUILDING_LATITUDE = 13.049242504007953;
export const BUILDING_LONGITUDE = 80.25007001119195;

// Dual Building Locations
export const GPS_PRIMARY = {
    lat: 13.049242504007953,
    lng: 80.25007001119195
};
export const GPS_SECONDARY = {
    lat: 13.04312445254735,
    lng: 80.24877724392677
};

export const OSM_ZOOM_LEVEL = 18;
export const OSM_TILE_SIZE = 256;
export const OSM_SURROUNDINGS_SCALE = 1.0;

// Focus/Zoom Configuration
export const FOCUS_ROOM_MIN_DISTANCE = 20;
export const FOCUS_ROOM_DISTANCE_MULTIPLIER = 2;
export const FOCUS_ROOM_CAMERA_OFFSET = 0.7;

// Color Map - Balanced colors
export const COLOR_MAP: { [key: string]: number } = {
    'blue': 0x93C5FD,      // Blue 300
    'green': 0x10B981,     // Emerald 500
    'red': 0xEF4444,       // Red 500
    'yellow': 0xFFFF00     // Bright Yellow
};

