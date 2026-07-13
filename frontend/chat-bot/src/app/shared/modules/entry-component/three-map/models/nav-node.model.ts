export interface NavLink {
    id: number;
    link_node_id: number;
    weight: number;
    degree?: number;
}

export interface NavNode {
    id: number;
    x: number;
    y: number; // Maps to Z in 3D
    type: 'NT-NN' | 'NT-RN';
    links: NavLink[];
    location_id?: number;
    locationName?: string;
    blockId?: number;
    floor_id?: number;
    exit?: number;
}
