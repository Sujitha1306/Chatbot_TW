
export class FilterOptions {
    constructor(
        public isOpen: boolean = false,
        public readerFilter: boolean = false,
        public dispenserFilter: boolean = false,
        public sensorFilter: boolean = false,
        public bedFilter: boolean = false,
        public heatFilter: boolean = false,
        public pathFilter: boolean = false,
        public distFilter: boolean = false,
        public labelFilter: boolean = false,
        public navigateFilter: boolean = false,
        public tagPAFilter: boolean = false,
        public tagASFilter: boolean = false,
        public tagINFilter: boolean = false
    ) { }
}
export class SearchFilter {
    constructor(
        public searchLoclist: Array<any> = [],
        public locFromId: any = null,
        public locToId: any = null,
        public yourLocId: any = null,
        public floorList: Array<any> = [],
        public src : any = null,
        public dest : any = null,
        public shortestPath = [],
        public alternatePath = []
    ) { }
}
export class MapFilter {
    constructor(
        public readerList: Array<any> = [],
        public dispenserList: Array<any> = [],
        public floorDispenser: Array<any> = [],
        public floorReaders: Array<any> = [],
        public floorSensors: Array<any> = [],
        public bedSpacingDetails: any = null,
        public selectedFilter: any = null,
        public pathData: Array<any> = [],
        public nodeLink: Array<any> = [],
        public noOfLinks: any = 0,
        public heatData: Array<any> = [],
        public heat: any = null,
    ) { }
}
export class TagOptions {
    constructor(
        public lastTag: any = null,
        public lastTagPopup: any = null,
        public selectedTag: any = null
        
    ){}
}
export class MapLayers {
    constructor(
        public reader_postion: any = {},
        public dispenser_postion: Array<any> = [],
        public sensor_postion: any = {},
        public tag_position: any = {},
        public reader_points: Array<any> = [],
        public dispenser_points: Array<any> = [],
        public sensor_points: Array<any> = [],
        public bed_space_images: Array<any> = [],
        public bed_space_polygon: Array<any> = [],
        
        public src_shortpath_polyline: any = {},
        public dest_shortpath_polyline: any = {},

        public src_alterpath_polyline: any = null,
        public dest_alterpath_polyline: any = null,
        
        public start_end_location: Array<any> = [],
        
        public performer_src: any = {},
        public performer_dest: any = {},
        public performer_locs: Array<any> = [],
        
        public tooltip_polygon: any = {},
        public loc_icon: any = {},
        public text_polygon: any = {},
        public heat_map: any = {},
        public floor_path: Array<any> = [],
        public node_path_point: Array<any> = [],
        public highlight_path:  any = {}
    ){}
}
