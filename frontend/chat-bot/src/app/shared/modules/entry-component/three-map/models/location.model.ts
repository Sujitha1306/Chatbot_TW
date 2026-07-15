export interface LocationData {

    id: number;

    name: string;

    displayName?: string;

    mapLabel?: string;

    regionalName?: string;

    coordinates: string;

    polygonStyle: string | null;

    locationCategoryId?: string | null;

    children?: LocationData[];

    locationTypeName: string;

    locationTypeLevel: number;

    aspects: string | null;
    disLocLevel?: number | null;
    labelStyle?: string | null;
    additionalCoordinates?: string | null;
}
