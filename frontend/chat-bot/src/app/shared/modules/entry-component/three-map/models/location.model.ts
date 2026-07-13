export interface LocationData {

    id: number;

    name: string;

    coordinates: string;

    polygonStyle: string | null;

    locationCategoryId?: string | null;

    children?: LocationData[];

    locationTypeName: string;

    locationTypeLevel: number;

    aspects: string | null;
    disLocLevel?: number | null;
    labelStyle?: string | null;
}