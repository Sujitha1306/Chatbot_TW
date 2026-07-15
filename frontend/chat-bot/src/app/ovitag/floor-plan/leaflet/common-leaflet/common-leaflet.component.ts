/*******************************************************************************
 * ======================================================================================================
 *                                     Copyright (C) 2019 Trackerwave Pvt Ltd.
 *                                             All rights reserved
 * ======================================================================================================
 * Notice:  All Rights Reserved.
 * This material contains the trade secrets and confidential business information of Trackerwave Pvt Ltd,
 * which embody substantial creative effort, design, ideas and expressions.  No part of this material may
 * be reproduced or transmitted in any form or by any means, electronic, mechanical, optical or otherwise
 * ,including photocopying and recording, or in connection with any information storage or retrieval
 * system, without written permission.
 *
 * www.trackerwave.com, Traceability and Change log maintained in Source Code Control System}
 * ======================================================================================================
 ******************************************************************************/

import { Component, OnInit,  ViewEncapsulation,  Input, OnDestroy, ViewChild, HostListener, ElementRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { connect,  MqttClient } from 'mqtt';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { debounceTime, bufferTime } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import DijkstraModel from '../../../../shared/model/dijkstra.model';
import GraphModel from '../../../../shared/model/graph.model';
import * as L from 'leaflet';
// import '../../../../../../assets/script/leaflet-heat.js';
import 'leaflet.markercluster';
import * as html2canvas from 'html2canvas';
import 'overlapping-marker-spiderfier-leaflet/dist/oms';
const OverlappingMarkerSpiderfier = (<any>window).OverlappingMarkerSpiderfier;
import 'leaflet.fullscreen';
import 'leaflet-path-transform';
import { MatDialog} from '@angular/material/dialog';
import { ManageLocationLeafletComponent } from './manage-location-leaflet/manage-location-leaflet.component';
import { MatMenuTrigger } from '@angular/material/menu';
import { decode } from 'js-base64';
import { StyleLoaderService } from '../../../../shared/services/style-loader.service ';
import { WorkflowService } from '../../../../shared/services/workflow.service';
import { CommonService } from '../../../../shared/services/common.service';
import { HospitalService } from '../../../../shared/services/hospital.service';
import { ConfigurationService } from '../../../../shared/services/configuration.service';
import { AppToastService } from '../../../../shared/services/toaster.service';
import { HazmatPdfService } from '../../../../shared/services/hazmat-pdf.service';
import { environment } from '../../../../../environments/environment';
import { ManageLocationViewComponent } from '../../../hospital/location/manage-location/manage-location-view/manage-location-view.component';
import { ConfirmDialogComponent } from '../../../../shared/modules/entry-component/layout-save/layout-save.component';
import { CreateAssetComponent } from '../../../configuration/asset/asset.component';
import { EnrollInfantComponent } from '../../../../shared/modules/entry-component/enroll-patient/enroll-patient.component';
import { CreateUserComponent } from '../../../../shared/modules/entry-component/create-user/create-user.component';
import { FilterOptions, MapFilter, MapLayers, SearchFilter, TagOptions } from './common-leaflet.model';
import { NotificationCameraViewComponent } from '../../../../core/global-notification/notification-camera-view/notification-camera-view.component';
@Component({
    selector: 'tw-common-leaflet',
    templateUrl: './common-leaflet.component.html',
    styleUrls: ['./common-leaflet.component.scss'],
    encapsulation: ViewEncapsulation.None
  })

  
export class CommonLeafletComponent implements OnInit, OnDestroy{
    // public floorMap:any;
    public blockMap:any;
    public blockImage:any;
    private client: MqttClient;
    isShowNewFeatures = false;
    isExpanded = false;
    drawnItems: L.FeatureGroup = null;
    drawControl: L.Control.Draw = null;
    coordinates: any = null;
    editPolygon: L.Polygon = null;
    featureGroup: L.FeatureGroup = new L.FeatureGroup();
    selectedpolygon =null;
    updatedPoint = null;
    rotationAngle = null;
    filterValue = null;
    public activate_btn: any = [];
    isPolygonEditing = false;

    @Input () blockSelect : any;
    @Input () floorSelect : any;
    @Input () locFlr : any;
    @Input () tagId : any;
    @Input () tagType : any;
    @Input () type: any;
    @Input () options: any;
    @Input () reqTagDetail: any;
    @Input () reqType : any;
    @Input () leafRef : any;
    public blockList = [];
    public floorList = [];
    public floorAllList = [];
    public availablePorterList = [];
    public porters = {};
    public floorDetail = null;
    public mapViewMode: '2D' | '3D' = '2D';
    blockId = new FormControl();
    floorId = new FormControl();
    fromLocation = new FormControl();
    toLocation = new FormControl();
    prevSearchValue = {
        'fromLoc' : null,
        'toLoc' : null
    }
    public markerCluster: any;
    public oms:any;
    entityDetail = {}
    public allOms:any = {};
    public allMarkerCluster: any = {};
    public allMapZoomCntrl: any = {};
    public allMapZoomToggle: any = {};
    public allFloorMap:any = {};    
    public allFloorWithChildren:any = {};
    public allClusterPopup = {}
    public allSpiderfiedMarkers = {}
    public isSpiderfyAll = {}
    public isAddLayerAll = {}    
    public blockExist : boolean = true;
    public isSubEnabled : boolean = false;
    private isMqttMessageBound: boolean = false;
    private tagMessage$: Subject<any> = new Subject();
    private tagMessageSub: Subscription = null;
    private navIndex: { [facilityId: string]: Map<string, number> } = {};

    public nodes = null;
    public subject : Subject<any> = new Subject();
    public filterOptions: FilterOptions;
    public searchFilter: SearchFilter;
    public pathData = null;
    public mapFilter: MapFilter;
    public tagOptions: TagOptions;
    public maps: MapLayers;
    public checkZoom: boolean = false;
    public removeLoc:boolean = false;
    public addLoc:boolean = false;
    public showYourLoc: boolean = false;
    public isNavigate: boolean = false;
    public isLoading: boolean = false;
    public mapZoomCntrl = null;
    public isZoomCntrl = false;
    public isShowTag = {
        "TAT-DAT" : false,
        "TAT-PA" : false,
        "TAT-AS" : false,
        "TAT-IN" : false,
    }
    public isSpiderfy = false;
    public spiderfiedMarkers = [];
    public clusterRadius = 20;
    public clusterListThreshold = 5;
    public clusterPopup = [];
    public isAddLayer = true;
    public tagInfo = {};
    public nodeArray = [];
    public linkDict = {};
    public floorNodeInfo = {};
    public nodePointDetails: Array<any> = [];
    public dijkstraModelObject:any;
    public graph:any;
    public floorGraph: any;
    public liftGraph: any;
    public stairGraph: any;
    public pathCategoryId = null;
    public shortestPathData:any = null;
    public lastShortestPath = {}
    public stepDetails = []
    public pointXY = [];
    public filterContext = {"searchOptions" : [
        {name: 'walk', iconUrl: 'gps_fixed' , show: false, toolTip: 'Locate Me'}, 
        {name: 'location', iconUrl: 'directions_walk', show: true, toolTip: 'Location search'}, 
        {name: 'filter', iconUrl: 'person_search', show: true, toolTip: 'Map filter'},
        {name: 'tag-filter', iconUrl: 'filter_alt', show: true, toolTip: 'Filter'}, 
        {name: 'navigate', iconUrl: 'near_me', show: true, toolTip: 'Navigate'},
        {name: 'search', iconUrl: 'search', show: true, toolTip: 'Search'}
    ]};
    public blockView = {
        'active' : false,
        'col' : 1,
    }
    public facilityId = localStorage.getItem(btoa('facilityId'));
    public navigationData = {};
    public wholeNavData = [];
    public tagMarkerList = {};
    public checkCtm = {};
    public circleMarker:any;
    public lastFilter = null;
    public selectedIndex = 0;
    public tabValue = [];
    public tabData = [];
    public previousTag = null;
    private tagIdHighlighted = false;
    public navigationHeatData = [];
    public floorData = {};
    public porterReqTagList = [];
    public flrBounds:any;
    public interval: any;
    public floorRef = 'floorMap';
    public blockRef = 'blockMap';
    public userPre = null;
    public polylinePoints = [];
    public distPolyline = {};
    public navConfig = {"enableTruck" : false, manualPublish : true, triggerPublish : false,  showAdvertisement : false, showLocCatIcon : false ,"idleTime" : 180, "lastSeen" : 30, "distance" : { "min" : 2, "max" : 20 }, "filterOptions" : {"show" : true}, "legend": {"show" : true}, "enableBlockView" : false, "showSteps": false, "showAlternatePath" : false ,'showPolygonBorder': false ,'strokeWidth':0.2, 'locationCategoryIds': [], 'showElevatorandStairIcons': true};
    tagRefreshInterval = null;
    // public shortPath = {"statusCode": 200, "data": {"path": ["41", "48", "47", "46", "45", "44", "43", "42", "19", "18", "17", "16", "15", "14", "13", "12", "11", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71"], "points": {"72": {"x": 2.48, "y": 2.92}, "73": {"x": 2.2, "y": 7.36}, "74": {"x": 2.2, "y": 6.36}, "75": {"x": 2.2, "y": 5.36}, "76": {"x": 2.2, "y": 4.36}, "77": {"x": 2.2, "y": 3.36}, "49": {"x": 10.36, "y": 0.64}, "50": {"x": 10.2, "y": 7.36}, "51": {"x": 10.2, "y": 6.36}, "52": {"x": 10.2, "y": 5.36}, "53": {"x": 10.2, "y": 4.36}, "54": {"x": 10.2, "y": 3.36}, "55": {"x": 10.2, "y": 2.36}, "56": {"x": 10.2, "y": 1.36}, "41": {"x": 17.24, "y": 1.2}, "42": {"x": 17.2, "y": 7.36}, "43": {"x": 17.2, "y": 6.36}, "44": {"x": 17.2, "y": 5.36}, "45": {"x": 17.2, "y": 4.36}, "46": {"x": 17.2, "y": 3.36}, "47": {"x": 17.2, "y": 2.36}, "48": {"x": 17.2, "y": 1.36}, "34": {"x": 26.24, "y": 1.4}, "35": {"x": 26.2, "y": 7.36}, "36": {"x": 26.2, "y": 6.36}, "37": {"x": 26.2, "y": 5.36}, "38": {"x": 26.2, "y": 4.36}, "39": {"x": 26.2, "y": 3.36}, "40": {"x": 26.2, "y": 2.36}, "2": {"x": 31.04, "y": 8.16}, "3": {"x": 1.2, "y": 8.36}, "4": {"x": 2.2, "y": 8.36}, "5": {"x": 3.2, "y": 8.36}, "6": {"x": 4.2, "y": 8.36}, "7": {"x": 5.2, "y": 8.36}, "8": {"x": 6.2, "y": 8.36}, "9": {"x": 7.2, "y": 8.36}, "11": {"x": 9.2, "y": 8.36}, "12": {"x": 10.2, "y": 8.36}, "13": {"x": 11.2, "y": 8.36}, "14": {"x": 12.2, "y": 8.36}, "15": {"x": 13.1, "y": 8.34}, "16": {"x": 14.2, "y": 8.36}, "17": {"x": 15.2, "y": 8.36}, "18": {"x": 16.2, "y": 8.36}, "19": {"x": 17.2, "y": 8.36}, "20": {"x": 18.2, "y": 8.36}, "21": {"x": 19.2, "y": 8.36}, "22": {"x": 20.2, "y": 8.36}, "23": {"x": 21.2, "y": 8.36}, "24": {"x": 22.2, "y": 8.36}, "25": {"x": 23.2, "y": 8.36}, "26": {"x": 24.2, "y": 8.36}, "27": {"x": 25.2, "y": 8.36}, "28": {"x": 26.2, "y": 8.36}, "29": {"x": 27.2, "y": 8.36}, "30": {"x": 28.2, "y": 8.36}, "31": {"x": 29.2, "y": 8.36}, "32": {"x": 30.2, "y": 8.36}, "33": {"x": 31.2, "y": 8.36}, "275": {"x": 8.13, "y": 8.295}, "59": {"x": 2.88, "y": 9.96}, "60": {"x": 2.68, "y": 11.24}, "57": {"x": 6.24, "y": 9.72}, "58": {"x": 6.2, "y": 11.08}, "61": {"x": 9.24, "y": 9.76}, "62": {"x": 9.32, "y": 11.08}, "63": {"x": 10.32, "y": 11.08}, "64": {"x": 11.32, "y": 11.08}, "65": {"x": 12.32, "y": 11.08}, "66": {"x": 13.32, "y": 11.08}, "67": {"x": 14.32, "y": 11.08}, "68": {"x": 15.32, "y": 11.08}, "69": {"x": 16.32, "y": 11.08}, "70": {"x": 17.32, "y": 11.08}, "71": {"x": 18.32, "y": 11.08}, "1": {"x": 0.2, "y": 8.36}, "133": {"x": 2.72, "y": 1.44}, "134": {"x": 2.52, "y": 7.32}, "135": {"x": 2.52, "y": 6.32}, "136": {"x": 2.52, "y": 5.32}, "137": {"x": 2.52, "y": 4.32}, "138": {"x": 2.52, "y": 3.32}, "139": {"x": 2.52, "y": 2.32}, "125": {"x": 8.8, "y": 1.2}, "126": {"x": 8.52, "y": 7.32}, "127": {"x": 8.52, "y": 6.32}, "128": {"x": 8.52, "y": 5.32}, "129": {"x": 8.52, "y": 4.32}, "130": {"x": 8.52, "y": 3.32}, "131": {"x": 8.52, "y": 2.32}, "132": {"x": 8.52, "y": 1.32}, "117": {"x": 18.32, "y": 1.12}, "118": {"x": 18.52, "y": 7.32}, "119": {"x": 18.52, "y": 6.32}, "120": {"x": 18.52, "y": 5.32}, "121": {"x": 18.52, "y": 4.32}, "122": {"x": 18.52, "y": 3.32}, "123": {"x": 18.52, "y": 2.32}, "124": {"x": 18.52, "y": 1.32}, "110": {"x": 26.48, "y": 1.52}, "111": {"x": 26.52, "y": 7.32}, "112": {"x": 26.52, "y": 6.32}, "113": {"x": 26.52, "y": 5.32}, "114": {"x": 26.52, "y": 4.32}, "115": {"x": 26.52, "y": 3.32}, "116": {"x": 26.52, "y": 2.32}, "234": {"x": 26.39636413574219, "y": 0.7818182373046875}, "78": {"x": 0.52, "y": 8.32}, "79": {"x": 30.8, "y": 8.0}, "80": {"x": 1.52, "y": 8.32}, "81": {"x": 2.52, "y": 8.32}, "82": {"x": 3.52, "y": 8.32}, "83": {"x": 4.52, "y": 8.32}, "84": {"x": 5.52, "y": 8.32}, "85": {"x": 6.52, "y": 8.32}, "86": {"x": 7.52, "y": 8.32}, "87": {"x": 8.52, "y": 8.32}, "88": {"x": 9.52, "y": 8.32}, "89": {"x": 10.52, "y": 8.32}, "90": {"x": 11.52, "y": 8.32}, "91": {"x": 12.52, "y": 8.32}, "92": {"x": 13.5, "y": 8.32}, "93": {"x": 14.52, "y": 8.32}, "94": {"x": 15.52, "y": 8.32}, "95": {"x": 16.52, "y": 8.32}, "96": {"x": 17.52, "y": 8.32}, "97": {"x": 18.52, "y": 8.32}, "98": {"x": 19.52, "y": 8.32}, "99": {"x": 20.52, "y": 8.32}, "100": {"x": 21.52, "y": 8.32}, "101": {"x": 22.52, "y": 8.32}, "102": {"x": 23.52, "y": 8.32}, "103": {"x": 24.52, "y": 8.32}, "104": {"x": 25.52, "y": 8.32}, "105": {"x": 26.52, "y": 8.32}, "106": {"x": 27.52, "y": 8.32}, "107": {"x": 28.52, "y": 8.32}, "108": {"x": 29.52, "y": 8.32}, "109": {"x": 30.52, "y": 8.32}, "153": {"x": 2.52, "y": 9.8}, "154": {"x": 2.48, "y": 11.24}, "151": {"x": 5.44, "y": 9.88}, "152": {"x": 5.44, "y": 11.04}, "233": {"x": 7.152728271484375, "y": 11.243636474609374}, "140": {"x": 9.56, "y": 9.84}, "141": {"x": 9.48, "y": 11.04}, "142": {"x": 17.8, "y": 11.0}, "144": {"x": 11.48, "y": 11.04}, "145": {"x": 12.48, "y": 11.04}, "146": {"x": 13.48, "y": 11.04}, "147": {"x": 14.48, "y": 11.04}, "148": {"x": 15.48, "y": 11.04}, "149": {"x": 16.48, "y": 11.04}, "150": {"x": 17.48, "y": 11.04}, "232": {"x": 10.434602355957031, "y": 10.381818237304687}, "235": {"x": 23.28, "y": 9.22}, "236": {"x": 22.96, "y": 10.22}, "237": {"x": 23.92, "y": 10.86}}}, "input": {"fid": "17942", "tid": "17947", "src": "41", "dest": "71"}, "message": "shortest path"}
    public subscription: Subscription;
    public truckEnable = false;
    public navType = 'location_nav'; // location_nav, disassociated , indoor_nav
    public hazardDetails = {
        'marker' : null,
        'label'  : [],
        'interval' : null
    };
    isOpen = false;
    // currentYear: number;
    public indoorNav:any = {};
    public hazardConfigValue = null;
    public allMapFullscreenToggle:any={}
    public iconList = {
        'red' : new L.Icon({ iconUrl: '/assets/Alert/common_icons/red-dot.png', iconSize: [16, 16],
        iconAnchor: [8, 8], popupAnchor: [-3, -76] }),
        'blue' : new L.Icon({ iconUrl: '/assets/Alert/common_icons/blue-dot.png', iconSize: [16, 16],
        iconAnchor: [8, 8], popupAnchor: [-3, -76] }),
        'green' : new L.Icon({ iconUrl: '/assets/Alert/common_icons/green-dot.png', iconSize: [16, 16],
        iconAnchor: [8, 8], popupAnchor: [-3, -76] }),
        'yellow' : new L.Icon({ iconUrl: '/assets/Alert/common_icons/yellow-dot.png', iconSize: [16, 16],
        iconAnchor: [8, 8], popupAnchor: [-3, -76] }),
        'pink' : new L.Icon({ iconUrl: '/assets/Alert/common_icons/pink-dot.png', iconSize: [16, 16],
        iconAnchor: [8, 8], popupAnchor: [-3, -76] })
    }

    @ViewChild('scrollContainer', { static: false }) scrollContainer: ElementRef;
    @ViewChild('filterContainer', { static: false }) filterContainer: ElementRef;
    @ViewChild(MatMenuTrigger) allFilterTrigger!: MatMenuTrigger; // Access the trigger
    isNewMapFilter: boolean = false;
    isEditPolygon: boolean = false;
    enableManualNav: boolean = false;
    associatedTags = [];
    associatedTagsFilters = [];
    public selectedTag = new FormControl();
    public tagSearchControl = new FormControl('');    
    filterTags: any;
    selectedColor=null;
    selectedButton=null;
    selectedButtonValue = null;
    fontSize= null;
    selectedOpacity =null;
    strokeColor=null;
    enableFloorChange =false;
    isThrottled = false;
    debounceTime =300;
    isDebouncing = false;
    enableSearch = true;
    customerLogo = null;
    customerDetail = [];
    requestBooking = [];
    currentFloor = null;
    showPolygonBorder = false;
    strokeWidth = 0.2;
    hideLabelTypeIds: number[] = [];
    @HostListener('window:resize')  onResize(): void {
    this.updateButtonVisibility();
    }

    icons = [
        { name: 'Infant', iconType: 'mIcon', iconName: 'baby_changing_station', code: 'TAT-IN' },
        { name: 'Patient', iconType: 'mIcon', iconName: 'personal_injury', code: 'TAT-PA' },
        { name: 'Asset', iconType: 'img', iconName: '/assets/Menus/SMC_asset.svg', code: 'TAT-AS' },
        { name: 'Wheelchair', iconType: 'img', iconName: '/assets/Menus/SMC_asset.svg', code: 'TAT-WH' },
        { name: 'Asset Utilization', iconType: 'img', iconName: 'assets/Menus/asset_utilization.svg', code: 'TAT-AU'},
        { name: 'Care Provider', iconType: 'img', iconName: 'assets/Menus/SMW_nurse_cell.svg', code: 'TAT-CP'},
        { name: 'Consumer', iconType: 'mIcon', iconName: 'people', code: 'TAT-CS'},
        { name: 'Employee', iconType: 'img', iconName: 'assets/Menus/SMW_employees.svg', code: 'TAT-EM'},
        { name: 'Temporary Id Card', iconType: 'img', iconName: 'assets/Menus/icons8-id-card-50.svg', code: 'TAT-ID'},
        { name: 'Medical Record', iconType: 'img', iconName: '/assets/Menus/icons8-medical-record-68.svg', code: 'TAT-MR'},
        { name: 'porter', iconType: 'img', iconName: 'assets/Menus/SMW_porter_management.svg', code: 'TAT-PO'},
        { name: 'Raw Customer', iconType: 'img', iconName: 'assets/Menus/SMH_manage_user.svg', code: 'TAT-RC'},
        { name: 'Staff', iconType: 'img', iconName: 'assets/Menus/SMW_staff.svg', code: 'TAT-ST'},
        { name: 'User', iconType: 'mIcon', iconName: 'person', code: 'TAT-US'},
        { name: 'Visitor', iconType: 'img', iconName: 'assets/Menus/icons8-waiting-room-50.svg', code: 'TAT-VS'}
    ];

    allMapFilter = [
        {
            titleName: 'Tag Filters',
            filterData: [],
            isOptionAll: true,
            isMulti: true
        },
    ];

    readonly assetIconConfig: Record<string, string> = {
        CCTV: '/assets/Menus/cctv-icon.png'
    };

    public mapOptionFilter = [
        { name: 'Readers', icon: false, img: true, mIcon: false, url: './../../../../../../assets/Menus/SMC_reader.svg', code: 'readers', disabled: false },
        { name: 'CCTV', icon: false, img: true, mIcon: false, url: '/assets/Menus/cctv-icon.png', code: 'cctv', disabled: false },
        { name: 'Dispenser', icon: false, img: true, mIcon: false, url: './../../../../../../assets/Menus/dispenser.svg', code: 'dispenser', disabled: false },
        { name: 'Heat Map', icon: false, img: false, mIcon: true, url: 'local_fire_department', code: 'heatMap', disabled: false },
        { name: 'Map Path', icon: false, img: false, mIcon: true, url: 'route', code: 'mapPath', disabled: false },
        { name: 'Distance', icon: false, img: false, mIcon: true, url: 'open_in_full', code: 'distance', disabled: false },
        { name: 'Show Label', icon: false, img: false, mIcon: true, url: 'spellcheck', code: 'lable', disabled: false },
    ];

    public EditPolygonOptions = [
        { name: 'Move', mIcon: true, iconUrl: 'drag_indicator', code: 'drawPolygon', disabled: false },
        { name: 'Redraw',  mIcon: true,iconUrl: 'edit', code: 'drawRectangle', disabled: false },
        { name: 'Edit', icon: true, iconUrl: 'edit_location_alt', code: 'drawMarker', disabled: false },
        { name: 'Style', mIcon: true, iconUrl: 'label', code: 'editLabel', disabled: false },
        { name: 'Delete', mIcon: true, iconUrl: 'delete', code: 'delete', disabled: false},
        { name: 'Manage View', mIcon: true, iconUrl: 'checklist', code: 'applyAll', disabled: false}
    ];

    showLeftButton = false;
    showRightButton = true;
    activeFilter: string | null = null
    private resizeListener: () => void;
    selectedFilters: string[] = [];
    selectedTagFilters: string[] = [];
    selectedDisassociateFilters: any[] = ['TAT-AT'];
    isSettingOpen = false;
    activeOptionCode = 'applyAll';
   
    constructor(private readonly styleLoader: StyleLoaderService,public form: FormBuilder, private readonly hospitalService: HospitalService, public datepipe: DatePipe,public dialog: MatDialog, private readonly cdr: ChangeDetectorRef,
       private readonly commonService: CommonService, private readonly workflowService: WorkflowService,private readonly activeRoute : ActivatedRoute, private readonly configurationServices: ConfigurationService, public toastr: AppToastService,public hazmatPdfService: HazmatPdfService,public hosipitalService:HospitalService, private readonly ngZone: NgZone){
        this.searchFilter = new SearchFilter();
        this.filterOptions = new FilterOptions();
        this.mapFilter = new MapFilter();
        this.tagOptions = new TagOptions();
        this.maps = new MapLayers();
        this.activate_btn = this.commonService.getActivePermission('button');
        this.getMqtt();
        this.getBlockList();
    }
    ngOnInit(){
        this.styleLoader.loadStyleByType('leaflet')
        // this.currentYear = new Date().getFullYear();
        this.navType = window.location.pathname.includes('indoor-nav') ? 'disassociated' : this.navType;
        this.getConfigFile()
        this.getRequestBooking()
        this.getAvailablePorter()
        this.checkUserPreference();
        this.subject.pipe(debounceTime(500)).subscribe(searchTextValue => {
            this.searchLocation(searchTextValue);
        });
        this.ngZone.runOutsideAngular(() => {
            this.tagMessageSub = this.tagMessage$.pipe(bufferTime(150)).subscribe(batch => {
                if(batch.length) {
                    this.processTagMessageBatch(batch);
                }
            });
        });
        this.resizeListener = () => this.updateContainerWidth();
        window.addEventListener('resize', this.resizeListener);
        this.updateContainerWidth();
        setTimeout(() => this.updateDisabledStates(), 5000);
        // this.subscription = this.commonService.notifyMsg.subscribe((msg) => {
        //     if (msg.length) {
        //       msg = msg[0];
        //       this.alertBinding(msg);
        //     }
        // });    
        this.commonService.getAppTerms('TagAssociationType').subscribe(res => {
            this.filterTags = res.results;
            const tagFilters = this.allMapFilter.find(filter => filter.titleName === 'Tag Filters');
            if (tagFilters) {
                tagFilters.filterData = res.results.map((item: any) => {
                    const icon = this.icons.find((icon: any) => icon.code === item.code);
                    return {
                        value: item.value,
                        code: item.code,
                        iconType: icon ? icon.iconType : null,
                        iconName: icon ? icon.iconName : null
                    };
                });

                let soundList = {
                    value: 'Sound Sensor',
                    code: 'TAT-SS',
                    iconType: 'mIcon',
                    iconName: 'volume_up'
                }
                tagFilters.filterData.push(soundList);
            }
            this.filterTags.forEach(tag => {
                this.selectedTagFilters.push(tag.code)
            })
        })
    }
    getCustomerDetails() {
        const customerId = localStorage.getItem('customerId');
        this.customerLogo = environment.api_base_url_new + environment.base_value.get_customer_logo + '/' + customerId ;
        this.commonService.getCustomerInfo(customerId).subscribe(res => {
            if(res.statusCode !== 0) {
                this.customerDetail = res.results
            }
        });
    }
    getRequestBooking() {
        this.commonService.getRequestBooking().subscribe(res => {
            if(res.statusCode == 1) {
                this.requestBooking = res.results;
                console.log(res.results);
            }
        })
    }

    getConfigFile() {
        this.commonService.getConfigFile('floor-nav').subscribe(res => {
            if (res.results != null) {
                this.navConfig = res.results.contentObject;
                if(this.navConfig.hasOwnProperty('manualPublish') == false) {
                    this.navConfig.manualPublish = false;
                }
                if(this.navConfig.hasOwnProperty('enableTruck') && this.navConfig.enableTruck) {
                    this.truckEnable = true
                }
                if(this.navConfig.hasOwnProperty('showAlternatePath') && this.navConfig.showAlternatePath) {
                    this.navConfig.showAlternatePath = this.navConfig.showAlternatePath;
                }
                if(this.navConfig.hasOwnProperty('showElevatorandStairIcons') == false) {
                    this.navConfig.showElevatorandStairIcons = true;
                }
                if(this.navConfig.hasOwnProperty('filterOptions')) {
                    let fltrOptions = this.navConfig['filterOptions']
                    if(fltrOptions.hasOwnProperty('walk')) {
                        let index = this.filterContext.searchOptions.findIndex(val => val['name'] == 'walk')
                        this.filterContext.searchOptions[index]['show'] = fltrOptions['walk']['show'];
                    }
                    if(fltrOptions.hasOwnProperty('location')) {
                        let index = this.filterContext.searchOptions.findIndex(val => val['name'] == 'location')
                        this.filterContext.searchOptions[index]['show'] = fltrOptions['location']['show'];
                    }
                    if(fltrOptions.hasOwnProperty('filter')) {
                        let index = this.filterContext.searchOptions.findIndex(val => val['name'] == 'filter')
                        this.filterContext.searchOptions[index]['show'] = fltrOptions['filter']['show'];
                    }
                    if(fltrOptions.hasOwnProperty('tag-filter')) {
                        let index = this.filterContext.searchOptions.findIndex(val => val['name'] == 'tag-filter')
                        this.filterContext.searchOptions[index]['show'] = fltrOptions['tag-filter']['show'];
                    }
                    if(fltrOptions.hasOwnProperty('search')) {
                        let index = this.filterContext.searchOptions.findIndex(val => val['name'] == 'search')
                        this.filterContext.searchOptions[index]['show'] = fltrOptions['search']['show'];
                    }
                    if(fltrOptions.hasOwnProperty('navigate')) {
                        let index = this.filterContext.searchOptions.findIndex(val => val['name'] == 'navigate')
                        this.filterContext.searchOptions[index]['show'] = fltrOptions['navigate']['show'];
                    }
                    this.options.show.filterOption = !fltrOptions.show;
                    this.options.show.filterOption = fltrOptions.show;
                }
                this.showPolygonBorder = this.navConfig?.showPolygonBorder ?? false;
                this.strokeWidth = this.navConfig?.strokeWidth ?? 0.2;
                this.hideLabelTypeIds = this.navConfig?.locationCategoryIds ?? [];
            }
        });
    }
    getUserPreference() {
        let preference = this.commonService.userPreference;
        let postData = {
          'key':"floorPlan",
          'roleId': localStorage.getItem('userlevel'),
          'userId': localStorage.getItem(btoa('userId')),
          'value':  JSON.stringify({
              floorId: this.floorId.value, 
              blockId: this.blockId.value,
              zoom : this.allFloorMap[this.floorId.value].getZoom(),
              center : this.allFloorMap[this.floorId.value].getCenter()
            })
        }
        if(preference != null) {
          if(preference.hasOwnProperty('floorPlan') && this.facilityId == preference?.facilityId) {
              let id = preference.floorPlan.id;
                if (preference.floorPlan.value !== postData.value) {
                    this.commonService.updateUserPreference(id, postData).subscribe(res=> {
                        this.commonService.userPreference = res.results;
                        let result = this.commonService.userPreference;
                        if(result != null && result.hasOwnProperty('floorPlan')) {
                            this.userPre = JSON.parse(result.floorPlan.value)
                            this.userPre.floorId ? this.floorSelect = this.userPre.floorId : this.floorSelect = null;
                            this.userPre.blockId ? this.blockSelect = this.userPre.blockId : this.blockSelect = null;
                        }
                    });
                }
            } else {
                this.commonService.saveUserPreference(postData).subscribe(res=> {
                this.commonService.userPreference = res.results;
                let result = this.commonService.userPreference;
                if(result != null && result.hasOwnProperty('floorPlan')) {
                    this.userPre = JSON.parse(result.floorPlan.value)
                    this.userPre.floorId ? this.floorSelect = this.userPre.floorId : this.floorSelect = null;
                    this.userPre.blockId ? this.blockSelect = this.userPre.blockId : this.blockSelect = null;
                }
              });
            }
        }
    }
    checkUserPreference() {
        if(this.leafRef) {
            this.floorRef = 'floorMap-dialog';
            this.blockRef = 'blockMap-dialog';
            this.getBasicDetail()
        } else if(localStorage.hasOwnProperty('privateUser')) { 
            this.getBasicDetail()
        }else{
            let roleId = localStorage.getItem('userlevel');
            let userId = localStorage.getItem(btoa('userId'));
            this.commonService.getPreference(userId, roleId).subscribe(res => {
                let preference = res.results;
                this.userPre = null;
                console.log(this.blockList)
                if (this.blockList.length && preference != null && preference.hasOwnProperty('floorPlan')) {
                    this.userPre = JSON.parse(preference.floorPlan.value)
                    this.userPre.floorId ? this.floorSelect = this.userPre.floorId : this.floorSelect = null;
                    this.userPre.blockId ? this.blockSelect = this.userPre.blockId : this.blockSelect = null;
                }
                this.getBasicDetail()
            });
        }
    }
    getFloorChildren(floorId) {
        if(floorId) {
            this.hospitalService.getLogicalLocationWithChildren(floorId).subscribe(res => {
                if(res.statusCode == 1){
                    let floorLocations = res.results;
                    this.allFloorWithChildren[floorId] = floorLocations;
                }
            });
        }
    }
    getBasicDetail() {
        this.activeRoute.queryParams.subscribe(params => {
            if(params.hasOwnProperty('rid')) {
                this.workflowService.getPorterRequest(params['rid']).subscribe((res) => {
                    // console.log(res)
                    if(res.results.length){
                        this.reqType = params['rtyp'];
                        this.reqTagDetail = res.results[0];
                        // this.getRequestFloor();
                        this.floorSelect = res.results[0].sourceFloorId;
                        this.getBlockList();
                    }
                })
            } else if(params.hasOwnProperty('nav')) {
                this.isLoading = true;
                let navData = JSON.parse(decode(params.nav));
                let slpId = navData.hasOwnProperty('slp') ? navData.slp : null; 
                let dlpId = navData.hasOwnProperty('dlp') ? navData.slp : null; 
                this.options.show.navMenu = false;
                this.navConfig.manualPublish = false;
                this.floorSelect = navData.sfi;
                this.searchFilter.locFromId = navData.sli;
                this.searchFilter.locToId = navData.dli;
                this.searchFilter.floorList = [navData.sfi, navData.dfi];
                this.searchFilter.src = navData.sni;
                this.searchFilter.dest = navData.dni;                
                this.pathData = {
                    "locFromId" : navData.sli,
                    "locToId" : navData.dli,
                    "floorList": [navData.sfi, navData.dfi],
                    "src": navData.sni,
                    "dest": navData.dni,
                    "marker" : null,
                    "srcLogicalParentId" : slpId,
                    "destLogicalParentId" : dlpId,                    
                    "multiFlr" : navData.dli != null &&  navData.sfi != navData.dfi
                }
                this.enableSearch = this.pathData.dest ? false : true;
                if(!this.enableSearch) {
                    this.options.show.navbar = false;
                    this.getCustomerDetails();
                }
                this.fromLocation.disable();
                if(navData.sfi != navData.dfi) {
                    this.getFloorChildren(navData.dfi);
                }
                this.getBlockList();
            } 
            // else{
            //     this.getRequestFloor();
            // }
        });
        // this.getRequestFloor();
        this.getAllPorter()
        this.getReaderList();
        this.getGraphNodePoints();
        this.interval = setInterval(val => this.setIdealIcons(), 120000);
        
    }
    getAllPorter() {
        this.hospitalService.getAllUsers(false, 'RO-PO').subscribe((res) => {
            let users = res.results;
            for(let user of users) {
                this.porters[user.id] = user;
            }
        });
    }
    getAvailablePorter() {
        let fromTime = this.datepipe.transform(new Date(),"yyyy-MM-dd HH:mm:ss");
        this.commonService.searchPorter(null,this.floorSelect,fromTime,null,null,null,null).subscribe(res => {
            this.availablePorterList = res.results;
        })
    }
    alertBinding(msg) {
        console.log(msg)
    }
    getRequestFloor(){
        // console.log(this.reqTagDetail)
        // if(this.reqType == 'porter'){
        //     const param = '/cloc=' + 1 + '&tid='+ this.reqTagDetail.nonPerformer[0].tagId + '&ttype=' + this.reqTagDetail.nonPerformer[0].tagAssociationTypeId;
        //     this.commonService.getReportData('totaltimebyloc', param).subscribe(res => {
        //         if(res.results.statusCode == 200){
        //             if(res.results.data.length){
        //             this.floorSelect = parseInt(res.results.data[0].floor_id);
        //             } else{
        //                 this.floorSelect = null;
        //             }
        //             this.getBlockList();
        //         }
        //     });
        // } else 
        if(this.reqType == 'globalSearch'){
            const param = '/cloc=' + 1 + '&tid='+ this.tagId + '&ttype=' + this.tagType;            
            this.commonService.getReportData('totaltimebyloc', param).subscribe(res => {
                if(res.results.statusCode == 200){
                    if(res.results.data.length){
                    this.floorSelect = parseInt(res.results.data[0].floor_id);
                    } else{
                        this.floorSelect = null;
                    }
                    this.getBlockList();
                }
            });
        }
    }
    getMqtt() {
        if(this.client) {
            this.client.end(true);
        }
        this.commonService.getmqttBroker().subscribe(res=> {
            if (res.results != null && res.results.length) {
                let brokerInfo = res.results.filter(val => val.brokerTypeId == "BT-CL")
                let cloudConnect = {
                    protocol        : brokerInfo[0]['wprotocol'],
                    host            : brokerInfo[0]['host'],
                    password        : brokerInfo[0]['password'],
                    username        : brokerInfo[0]['username'],
                    port            : brokerInfo[0]['wport'],
                    connectTimeout  : 30000,
                    keepalive       : 60
                }
                this.client = connect(cloudConnect);
            } else {
                res.message = 'mqtt ' + res.message;
                this.toastr.warning('Warning', `${res.message}`);
            }
        })
    }
    getBlockList(){
        if(this.reqType == 'track' && this.blockSelect == null) {
            this.commonService.getLocationById(this.floorSelect).subscribe(res => {
                if(res.statusCode == 1) {
                    this.blockSelect = res.results.parentId;
                    this.getBlockList()
                }
            });
        } else {
        this.hospitalService.getBlockWithFloors().subscribe(res => {
            // console.log(res.results)
            this.blockList = res.results.filter(resValue => (resValue.imageUrl != null) && (resValue.hasOwnProperty('children')));
            if(this.blockList.length){
                this.blockExist = true;
                if(this.blockSelect != null){
                    if(this.blockList.find(resValue => resValue.id == this.blockSelect) == undefined){
                        this.blockId.setValue(this.blockList[0].id);
                        this.floorList = this.blockList[0].children.filter(resValue => resValue.imageUrl != null || resValue.locationTypeId == 23);
                    } else{
                    this.blockId.setValue(this.blockSelect)
                    let floor = this.blockList.find(resValue => resValue.id == this.blockSelect)
                    this.floorList = floor.children.filter(resValue => resValue.imageUrl != null || resValue.locationTypeId == 23);
                    }
                }else if(this.blockSelect == null && this.floorSelect != null){
                let findBlk = this.blockList.find(res => res.children.find(resValue => resValue.id == this.floorSelect));
                this.blockId.setValue(findBlk.id);
                this.floorList = findBlk.children.filter(resValue => resValue.imageUrl != null || resValue.locationTypeId == 23);
                }else{
                    this.blockId.setValue(this.blockList[0].id);
                    this.floorList = this.blockList[0].children.filter(resValue => resValue.imageUrl != null || resValue.locationTypeId == 23);
                }
                if(this.floorSelect != null){
                    if(this.floorList.find(resValue => resValue.id == this.floorSelect) == undefined){
                        this.floorId.setValue(this.floorList[0].id);
                    } else{
                    this.floorId.setValue(this.floorSelect);
                    }
                }else{
                    this.floorId.setValue(this.floorList[0].id);
                }
                this.blockImage = environment.api_base_url_new + 'api/location/get-location-image/'+ this.blockId.value +'?date='+(new Date());
                for (let i = 0; this.blockList.length > i; i++) {
                    this.blockList[i]['children'] = this.blockList[i]['children'].map(object => {
                        return {...object, blockName: this.blockList[i]['name']};
                      });
                    this.floorAllList = this.floorAllList.concat(this.blockList[i]['children'])
                }
                if(this.reqType != 'track'){
                    this.getPath('check');
                    this.getBedspacing('check');
                }
                // this.getBlockMap(this.blockImage);
                this.getLocationsByFloor(this.floorId.value);
            } else{
                this.options.show.navbar = false;
                this.blockExist = false;
            }
        })
        }
    }
    getReaderList(){
        if(this.mapFilter.readerList.length == 0){
            this.configurationServices.getAllReaders().subscribe(res => {
                this.mapFilter.readerList = res.results.filter(val => val.readerTypeId != 'RT-DS');
                this.mapFilter.dispenserList = res.results.filter(val => val.readerTypeId == 'RT-DS');
                this.getReadercoord('check');
                this.getDispensercoord('check');
                this.getSoundSensor('check');
            });
        }
        if(this.mapFilter.injectorList.length == 0){
            this.configurationServices.getAllInjectors().subscribe(res => {
                this.mapFilter.injectorList = res.results || [];
                this.getInjectorcoord('check');
            });
        }
    }
    onBlockChange(blockid){
        // console.log(blockid)
        // this.isExpanded= false;
        this.selectedpolygon = null;
        this.editPolygon = null;
        this.blockImage = environment.api_base_url_new + 'api/location/get-location-image/'+ blockid +'?date='+(new Date());
        let floor = this.blockList.find(resValue => resValue.id == blockid)
        let floorValue = floor.children.filter(resValue => resValue.imageUrl != null || resValue.locationTypeId == 23);
        this.blockView['active'] = false;
        if(floorValue.length != 0){
            this.floorList = floorValue;
            this.floorId.setValue(this.floorList[0].id)
            // this.getBlockMap(this.blockImage)
            this.getLocationsByFloor(this.floorList[0].id)
        }else{
            this.floorList = [];
            this.allFloorMap = {};
            // need to update. temp fix
            // if (this.floorMap) {
            //     this.floorMap.remove();
            //     this.floorMap = null;
            // }
        }
    }

    onFloorChange(floorSelect){
        this.selectedpolygon = null;
        this.editPolygon = null;
        this.blockView['active'] = false;
        this.floorId.setValue(floorSelect)
        this.getLocationsByFloor(floorSelect)
        // this.isExpanded= false;
    }
    toggleMapViewMode(mode: '2D' | '3D') {
        this.mapViewMode = mode;
        if (mode === '3D') {
            // Remove existing Leaflet maps to free up resources and avoid DOM query issues
            let floors = Object.keys(this.allFloorMap);
            for(let i in floors) {
                if (this.allFloorMap[floors[i]]) {
                    try {
                        this.allFloorMap[floors[i]].remove();
                    } catch (e) {
                        console.error('Error removing map:', e);
                    }
                    delete this.allFloorMap[floors[i]];
                }
            }
        } else if (mode === '2D') {
            // Wait for DOM to render the 2D container element, then re-initialize map
            setTimeout(() => {
                if (this.floorId && this.floorId.value) {
                    this.getLocationsByFloor(this.floorId.value);
                }
            }, 100);
        }
    }
    on3DFloorChanged(floorId: number) {
        if (this.floorId.value !== floorId) {
            this.floorId.setValue(floorId);
            this.onFloorChange(floorId);
        }
    }
    on3DBlockChanged(blockId: number) {
        if (this.blockId.value !== blockId) {
            this.blockId.setValue(blockId);
            this.onBlockChange(blockId);
        }
    }
    getGraphNodePoints(){
        this.commonService.getAllNodePoints().subscribe(res => {
            // console.log(res.results)
            this.floorNodeInfo = {}
            for (let i = 0; res.results.length > i; i++) {
                if(res.results[i].nodes.length) {
                    if(this.nodes == null) {
                        this.nodes = res.results[i].nodes
                    } else {
                        this.nodes = this.nodes.concat(res.results[i].nodes)
                    }
                }
                this.floorNodeInfo[res.results[i].floor_id] = {"nodes": {}, "node": []}
                for (let j=0; res.results[i].nodes.length > j; j++) {
                    let obj = {}
                    obj['id'] = res.results[i].nodes[j].id
                    obj['location_id'] = res.results[i].nodes[j].location_id
                    obj['floor_id'] = res.results[i].nodes[j].floor_id
                    obj['locationCategoryId'] = res.results[i].nodes[j].locationCategoryId;
                    // obj['weight'] = 1;
                    obj['nType'] = 1;
                    let link = [];
                    let weight = [];
                    for (let k=0; res.results[i].nodes[j].links.length > k; k++) {
                        try {
                        link.push(res.results[i].nodes[j].links[k].link_node_id)
                        weight.push(res.results[i].nodes[j].links[k].weight)
                        this.nodeArray.push([res.results[i].nodes[j].id.toString(), res.results[i].nodes[j].links[k].link_node_id.toString()])
                        } catch(e) {
                            // console.log('node points issue')
                            // console.log(res.results[i].nodes[j])
                        }
                    }
                    obj['weight'] = weight;
                    obj['neighbors'] = link;
                    this.nodePointDetails.push(obj)
                    this.floorNodeInfo[res.results[i].floor_id]["nodes"][res.results[i].nodes[j].id] = res.results[i].nodes[j]
                    this.floorNodeInfo[res.results[i].floor_id]["node"].push(res.results[i].nodes[j])
                }
            }
            // console.log(this.floorNodeInfo)
            
            let connection = []
            for (let i = 0; this.nodeArray.length > i; i++) {
                let key = this.nodeArray[i][0]+this.nodeArray[i][1].toString()
                if (key in this.linkDict ) {
                    // console.log("true")
                } else {
                    let keys = this.nodeArray[i][1]+this.nodeArray[i][0].toString()
                    this.linkDict[keys] = i;
                    connection.push([parseInt(this.nodeArray[i][0]), parseInt(this.nodeArray[i][1])])
                }
            }
            let dataValue = {'nodes' : this.nodePointDetails,'edges' : connection}
            this.graph = new GraphModel(dataValue);
            this.floorGraph = new GraphModel({'nodes' : this.nodePointDetails.filter(val => val.floor_id == this.floorId.value),'edges' : connection});
            this.stairGraph = new GraphModel({'nodes' : this.nodePointDetails.filter(val => val.locationCategoryId != 'LC_Lift'),'edges' : connection});
            this.liftGraph = new GraphModel({'nodes' : this.nodePointDetails.filter(val => val.locationCategoryId != 'LC_Stair Case'),'edges' : connection});            
            
        });
    }
    getLocationsByFloor(floorid){
        // this.commonService.getAllLocationById(floorid).subscribe(res => {
        //     if(res.statusCode == 1){
        //         let floorLocations = res.results[0];
        //         this.getFloorMap(floorLocations, floorid)
        //     }
        //     else{
        //       this.toastr.errorToastr('Error', `${res.message}`, { animate: 'slideFromRight' });
        //     }
        // });
        if(window.location.pathname.includes('indoor-nav') == false && this.navType == 'disassociated') {
            this.unsubscribeData('disassociated', 'location_nav')
        }
        if(!this.allFloorWithChildren.hasOwnProperty(floorid)) {
        this.hospitalService.getLogicalLocationWithChildren(floorid).subscribe(res => {
          if(res.statusCode == 1){
              let floorLocations = res.results;
              this.allFloorWithChildren[floorid] = floorLocations;
              this.getFloorMap(floorLocations, floorid)
              this.currentFloor = res.results?.name;
          }
          else{
            this.toastr.error('Error', `${res.message}`);
          }
        });
        } else {
            setTimeout(() =>  this.getFloorMap(this.allFloorWithChildren[floorid], floorid), 1000);
        }
    }
    // getBlockMap(blockImage){
    //     if (this.blockMap) {
    //         this.blockMap.remove();
    //         this.blockMap = null;
    //     }
    //     this.blockMap = L.map(this.blockRef, {
    //         minZoom: -3,
    //         maxZoom: 0,
    //         center: [10, 0],
    //         zoom: -3,
    //         crs: L.CRS.Simple,
    //         zoomControl:false,
    //         attributionControl: false
    //     });
    //     this.blockMap.touchZoom.disable();
    //     this.blockMap.doubleClickZoom.disable();
    //     this.blockMap.scrollWheelZoom.disable();
    //     this.blockMap.boxZoom.disable();
    //     this.blockMap.keyboard.disable();
    //     this.blockMap.dragging.disable();

    //     let southWest = null, northEast = null 
    //     southWest = this.blockMap.unproject([0, 1700], this.blockMap.getMaxZoom());
    //     northEast = this.blockMap.unproject([1500, 0], this.blockMap.getMaxZoom());
    //     let bounds = new L.LatLngBounds(southWest, northEast);
    //     L.imageOverlay(blockImage, bounds).addTo(this.blockMap);
    //     this.blockMap.setMaxBounds(bounds);
    // }
    swapDirection() {
        let fromLoc = this.prevSearchValue['fromLoc'];
        let toLoc = this.prevSearchValue['toLoc'];
        this.searchFilter.locFromId = toLoc.id;
        this.searchFilter.locToId = fromLoc.id;
        this.fromLocation.disable();
        this.searchFilter.floorList = [];
        this.searchFilter.floorList.push(toLoc.parentId)
        this.searchFilter.floorList.push(fromLoc.parentId)
        this.fromLocation.setValue(toLoc.name+ ',' +toLoc.fullName);
        this.toLocation.setValue(fromLoc.name+ ',' +fromLoc.fullName);
        this.prevSearchValue['fromLoc'] = toLoc;
        this.prevSearchValue['toLoc'] = fromLoc;
        if(this.pathData) {        
            this.pathData.locFromId = toLoc.id;
            this.pathData.locToId = fromLoc.id;
            this.pathData.floorList = [];
            this.pathData.floorList.push(toLoc.parentId)
            this.pathData.floorList.push(fromLoc.parentId)            
        }
        if(this.pathData['destPegman']) {
            this.allFloorMap[this.floorId.value].removeLayer(this.pathData['destPegman'])
            this.pathData['destPegman'] = null;
        }
        if(this.allFloorWithChildren.hasOwnProperty(this.searchFilter.floorList[0]) == false) {
            this.isLoading = true;
            this.getFloorChildren(this.searchFilter.floorList[0]);
            setTimeout(() => {
                this.getpathDistance();
                this.isLoading = false;
            }, 1000);
        } else {
            this.getpathDistance()
        }

    }
    clearSearchInput(type) {
        if(type == 'src') {
            this.searchFilter.src = null;
            this.fromLocation.setValue(null);
            this.searchFilter.locFromId = null;
            this.prevSearchValue['fromLoc'] = null;
            this.fromLocation.enable();
            if(this.pathData) {
                this.pathData.src = null;
                this.pathData.locFromId = null;
            }
        } else if(type == 'dest') {
            this.searchFilter.dest = null;
            this.toLocation.setValue(null);
            this.prevSearchValue['toLoc'] = null;
            this.toLocation.enable();
            this.searchFilter.locToId = null;
            if(this.pathData) {
                this.pathData.dest = null;
                this.pathData.locToId = null;
            }
        }
        if(this.pathData) {
            this.searchFilter.searchLoclist = this.pathData.favLocations;
            if(this.pathData['destPegman']) {
                this.allFloorMap[this.floorId.value].removeLayer(this.pathData['destPegman'])
                this.pathData['destPegman'] = null;
            }
            if(this.pathData['marker']) {
                this.allFloorMap[this.floorId.value].removeLayer(this.pathData['marker'])
                this.pathData['marker'] = null;
            }
        }
        this.resetShortestPath(null)
    }
    resetShortestPath(pathCategoryId) {
        this.stepDetails = []
        if(this.maps.start_end_location.length > 0){
            this.allFloorMap[this.floorId.value].removeLayer(this.maps["src_shortpath_polyline"]);
            this.allFloorMap[this.floorId.value].removeLayer(this.maps["dest_shortpath_polyline"]);
            let alterlinePath = this.searchFilter.floorList.indexOf(this.floorId.value) == 0 ? 'src_alterpath_polyline' : 'dest_alterpath_polyline';
            let shortestlinePath = this.searchFilter.floorList.indexOf(this.floorId.value) == 0 ? 'src_shortpath_polyline' : 'dest_shortpath_polyline';
            if(this.maps[alterlinePath]) {
                this.pathCategoryId = pathCategoryId;
                this.allFloorMap[this.floorId.value].removeLayer(this.maps[alterlinePath]);
            }
            for(let i = 0; this.maps.start_end_location.length > i; i++){
                this.allFloorMap[this.floorId.value].removeLayer(this.maps.start_end_location[i]);
            }
            this.maps.start_end_location = [];
            this.maps.src_shortpath_polyline = {};
            this.maps.dest_shortpath_polyline = {};
        }
    }
    getFloorMap(floorLocations, floorid){
        this.floorDetail = null;
        if(!this.blockView.active) {
            this.floorDetail = floorLocations
            let floors = Object.keys(this.allFloorMap)
            for(let i in floors) {
                this.allFloorMap[floors[i]].remove();
                delete this.allFloorMap[floors[i]];
            }
            this.updateDisabledStates()
        }
        this.isZoomCntrl = false;
        if(floorLocations.locationTypeId == 23) { 
            let mapUrl:any = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            mapUrl =  'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
            this.allFloorMap[floorid] = L.map(this.leafRef+'_'+floorid, {
                center: new L.LatLng(45.78771148665357, 15.967683792394526),
                minZoom: floorLocations.minZoom/10 <= 22 ? floorLocations.minZoom/10 : 22,
                maxZoom: floorLocations.maxZoom/10 <= 22 ? floorLocations.maxZoom/10  : 22,
                zoom: floorLocations.defaultZoom/10 <= 22 ? floorLocations.defaultZoom/10  : 22,
                zoomControl: true, attributionControl: false
            });
            // L.tileLayer(mapUrl).addTo(this.allFloorMap[floorid]);
            L.tileLayer(mapUrl,{
                maxZoom : 22,
                subdomains:['mt0','mt1','mt2','mt3']
            }).addTo(this.allFloorMap[floorid]);
            this.allFloorMap[floorid].on('zoomend', this.disLocCntrl.bind(this,floorLocations));
            this.allFloorMap[floorid].on('click', this.polyLineDist.bind(this, floorLocations))            
        } else {
        let minimumZoom = -3, maximumZoom = 0, defaultZoom = -2;
        if(floorLocations.defaultZoom != null && floorLocations.minZoom != null && floorLocations.maxZoom != null){
            minimumZoom = floorLocations.minZoom/20 - 10;
            maximumZoom = floorLocations.maxZoom/20 - 10;
            defaultZoom = floorLocations.defaultZoom/20 - 10;
            this.isZoomCntrl = true;
        }
        this.allFloorMap[floorid] = L.map(this.leafRef+'_'+floorid, {
            minZoom: minimumZoom,
            maxZoom: maximumZoom,
            center: [10, 0],
            zoom: defaultZoom,
            // zoomDelta: 0.5,
            zoomSnap: 0,
            crs: L.CRS.Simple,
            attributionControl: false
        });
            
        let floorImage = environment.api_base_url_new + 'api/location/get-location-image/'+ floorid + '?date=' + (new Date());
        let southWest = null, northEast = null 
        if (floorLocations.coordinates != null && floorLocations.aspects != null) {
            const e = eval;
            let aspects = e(floorLocations.aspects)
            southWest = this.allFloorMap[floorid].unproject([0, aspects[1] * 100], this.allFloorMap[floorid].getMaxZoom());
            northEast = this.allFloorMap[floorid].unproject([aspects[0] * 100, 0], this.allFloorMap[floorid].getMaxZoom());
            if(!this.isZoomCntrl){
            this.getZoom(aspects, floorid)
            }
        } else {
            southWest = this.allFloorMap[floorid].unproject([0, 1700], this.allFloorMap[floorid].getMaxZoom());
            northEast = this.allFloorMap[floorid].unproject([1500, 0], this.allFloorMap[floorid].getMaxZoom());
        }
        this.flrBounds = new L.LatLngBounds(southWest, northEast);
        this.spiderfiedMarkersByFloor(floorid);
        L.imageOverlay(floorImage, this.flrBounds).addTo(this.allFloorMap[floorid]);
        this.allFloorMap[floorid].on('zoomend', this.disLocCntrl.bind(this,floorLocations));
        // this.floorMap.on('zoomend', this.checkZoomLevel.bind(this,floorDetail));
        this.allFloorMap[floorid].on('click', this.polyLineDist.bind(this, floorLocations))
        this.allFloorMap[floorid].on('click', (e: L.LeafletMouseEvent) => {
            const x = (e.latlng.lng/100).toFixed(5);
            const y = (e.latlng.lat/-100).toFixed(5); // Limit decimals
            // console.log('Clicked coordinates:', '[', x.toString(), ',', y.toString(), ']');
        });
        if(!this.blockView.active && this.userPre != null && floorid == this.userPre.floorId) {
            this.allFloorMap[floorid].setView(this.userPre.center, this.userPre.zoom); 
        } else {
            // this.allFloorMap[floorid].setMaxBounds(this.flrBounds);
            let center = this.flrBounds.getCenter();
            this.allFloorMap[floorid].setView(center, defaultZoom);
        }
        }
        this.zoomCntrlLabel(floorid)
        this.fullscreenLabel(floorid)
        if(this.reqType == "track") {
            this.hazardConfigValue = JSON.parse(this.reqTagDetail.configValue)                
            if(this.hazardConfigValue.hasOwnProperty('kmlDetails')) {
                this.bindKMLCoordinate(this.hazardConfigValue.kmlDetails.geoJson, floorid)
            }else if(this.hazardConfigValue.hasOwnProperty('aloho')){
                let sourcePoint,destinationPoint
                sourcePoint = this.hazardConfigValue.aloho.sourcePoint;
                destinationPoint = this.hazardConfigValue.aloho.destinationPoint;
                this.drawEllipses(sourcePoint,destinationPoint)
            }            
            this.hazardBinding()
        }
        this.filterOptions.readerFilter = false;
        this.filterOptions.sensorFilter = false;
        this.filterOptions.bedFilter = false;
        this.filterOptions.pathFilter = false;
        this.filterOptions.heatFilter = false;
        this.filterOptions.tagPAFilter = false;
        this.filterOptions.tagASFilter = false;
        this.filterOptions.tagINFilter = false;
        this.filterOptions.distFilter = false;
        this.filterOptions.labelFilter = false;
        this.filterOptions.cctvFilter = false;
        this.maps.cctv_points = [];
        this.maps.injector_points = [];
        this.maps.injector_wires = {};
        this.polylinePoints = [];
        this.distPolyline = {};
        this.maps.tooltip_polygon[floorid] = {};
        this.maps.text_polygon[floorid] = {}
        this.tabData = [];
        this.tabValue = [];
        this.lastFilter = null;
        this.tagOptions.selectedTag = null;
        this.tagOptions.lastTag = null;
        this.tagIdHighlighted = false;
        if(this.reqType != 'track' && this.navType == 'location_nav') {
            if(!this.blockView.active) {
            this.getReadercoord('check');
            this.getInjectorcoord('check');
            this.getSoundSensor('check');
            this.getDispensercoord('check');
            this.getBedspacing('check');
            this.getPath('check');
            this.loadCctvAssets(floorid);
            }
        }
        this.isShowTag = {"TAT-DAT" : false, "TAT-PA" : false,"TAT-AS" : false,"TAT-IN" : false};
        this.selectedIndex = 0;
        if(!this.navigationData[this.facilityId]){
            this.navigationData[this.facilityId] = []
        }
        if(this.pathData == null && this.reqType != 'track'){
            if(this.navType == 'location_nav') {
                this.getTagLayer(floorid)
            }
            if(this.previousTag != null){
                this.checkTag(this.previousTag);
                this.previousTag = null;
            } else{
                if(!this.isSubEnabled) {
                    this.isSubEnabled = true;
                    this.subscribeData();
                }
            }
        }
        // this.bindIndoorNav()
        if(this.reqType == 'porter'){
            this.getPorterTagList();
            if(this.floorSelect == floorid){
            this.getPorterSearchControl();
            }
        }
        let childData = floorLocations.children;
        if(this.pathData) {
            // this.pathData.favLocations = childData.filter(val => val.isSearchPriority);
            // this.pathData.favLocations = this.pathData.favLocations.map(item => ({
            //     ...item,
            //     ['fullName']: floorLocations.name
            // }));
            if(localStorage.hasOwnProperty('searchLocation')) {
                this.pathData.favLocations = JSON.parse(localStorage.getItem('searchLocation'))
            } else {
                this.pathData.favLocations = [];
            }
            this.searchFilter.searchLoclist = JSON.parse(JSON.stringify(this.pathData.favLocations));
        }
        for (let i in childData) {
            if (childData[i].coordinates) {
                this.drawLocation(childData[i], '#ffffff00', floorid);
            }
            if(childData[i].locationTypeLevel > 2 && childData[i].children.length) {
              let innerChildData = childData[i].children;
              for(let j in innerChildData) {
                if(innerChildData[j].coordinates) {
                  this.drawLocation(innerChildData[j], '#ffffff00', floorid)
                }
                if(innerChildData[j].locationTypeLevel > 2 && innerChildData[j].children.length) {
                  let level2child = innerChildData[j].children;
                  for(let k in level2child) {
                    if(level2child[k].coordinates) {
                      this.drawLocation(level2child[k], '#ffffff00', floorid)
                    }
                  } 
                }
              }        
            }
        }
        let child = floorLocations.children;
        if(this.locFlr != undefined){
            let locChild = child.find(resValue => resValue.id == this.locFlr)
                if(locChild) {
                    this.loadBuild(locChild, floorid)
                }
        }
        if(this.shortestPathData != null){
            if(this.searchFilter.alternatePath.length == 0 || this.navConfig.showAlternatePath == false) {
                this.showShortestPath(this.shortestPathData);
            } else {
                // this.showShortestPath(this.shortestPathData);
                this.generatePath(this.searchFilter.shortestPath, 'shortestPath');
                this.generatePath(this.searchFilter.alternatePath, 'alternatePath');
            }
        }
        this.disLocCntrl(floorLocations);
        this.checkZoom = true;
        this.isSettingOpen == true ? this.toggleExpand(): null;
        setTimeout(() => {
            if(this.pathData) {
                this.isNavigate = true;
                this.isLoading = false;
                if(this.pathData.dest) {
                    this.getShortestPath(this.pathData.src, this.pathData.dest);
                } else {
                    let fromLoc = [];
                    if(this.pathData.srcLogicalParentId) {
                        fromLoc = this.allFloorWithChildren[this.pathData.floorList[0]]['children'].filter(res => res.id == this.pathData.srcLogicalParentId);
                        fromLoc = fromLoc[0].children.filter(res => res.id == this.searchFilter.locFromId);
                    } else {
                        fromLoc = this.allFloorWithChildren[this.pathData.floorList[0]]['children'].filter(res => res.id == this.searchFilter.locFromId);
                    }
                    if(fromLoc.length > 0) {
                        this.prevSearchValue['fromLoc'] = fromLoc[0];
                        fromLoc[0]['fullName'] = fromLoc[0].name + ', ' + this.allFloorWithChildren[this.searchFilter.floorList[0]].name;
                        this.getLocationId(fromLoc[0], 'fromLoc', null)
                    }
                }
                // this.setPegman(null, this.pathData.src)
            }
        }, 3000);
    }
    bindKMLCoordinate(content, floorId) {
        let jsonValue = content;
        for(let i in jsonValue['features']) {
            let area = jsonValue['features'][i]
            if (area && area.geometry.type != "Point") {
                let poly = area.geometry.coordinates
                let polygonData = null;
                let color = area.properties.name.toLowerCase().includes('red') ? 'red' : 
                            area.properties.name.toLowerCase().includes('orange') ? 'orange' :
                            area.properties.name.toLowerCase().includes('yellow') ? 'yellow' : 'green';
                polygonData = L.polygon(poly, { color: color});
                polygonData.addTo(this.allFloorMap[floorId])
                if(color == 'red') {
                    this.allFloorMap[floorId].fitBounds(polygonData.getBounds());
                }
                
            }    
        }        
    }
    spiderfiedMarkersByFloor(floorid) {
        if(true || !this.allOms.hasOwnProperty(floorid)) {
            this.allOms[floorid] = new OverlappingMarkerSpiderfier(this.allFloorMap[floorid], { nearbyDistance: this.clusterRadius, keepSpiderfied: true, legWeight: 1.5 });
            this.allOms[floorid].legColors.usual = 'transparent';
            this.allOms[floorid].legColors.highlighted = 'transparent';
            this.allMarkerCluster[floorid] = L.markerClusterGroup({
                chunkedLoading: true,
                spiderfyOnMaxZoom: false,
                showCoverageOnHover: false,
                maxClusterRadius: 20,
                zoomToBoundsOnClick: true,
                disableClusteringAtZoom : this.allFloorMap[floorid].getMaxZoom()
            })
            this.allMarkerCluster[floorid].on('clustermouseover', this.getMarkersOnOver.bind(this, floorid))
            this.allMarkerCluster[floorid].on('clustermouseout', this.hideMarkersOnOut.bind(this, floorid))
            this.allOms[floorid].addListener('spiderfy' , (markers) => {
                // Spreading 5+ overlapping icons around a point clutters the map. Above the
                // threshold, collapse straight back and show the cluster's tags as a list
                // popup instead; below it, keep the existing spread-out-icons behavior.
                if(markers.length >= this.clusterListThreshold){
                    this.allOms[floorid].unspiderfy();
                    this.showClusterTagList(markers, floorid);
                    return;
                }
                this.allSpiderfiedMarkers[floorid] = markers;
                for(let i in this.allClusterPopup[floorid]){
                    this.allFloorMap[floorid].removeLayer(this.allClusterPopup[floorid][i])
                }
                this.isAddLayerAll[floorid] = false;
            });
            this.allOms[floorid].addListener('unspiderfy', (markers) => {
                this.allSpiderfiedMarkers[floorid] = [];
                for(let i in this.allClusterPopup[floorid]){
                    if(!this.allClusterPopup[floorid][i].getContent().includes('>1<') && !this.allClusterPopup[floorid][i].getContent().includes('>0<')){
                        this.allFloorMap[floorid].addLayer(this.allClusterPopup[floorid][i])
                    }
                }
                this.isAddLayerAll[floorid] = true;
            });
        }
    }
    bindIndoorNav() {
        if(this.client) {
            let topicName = 'indoor_nav/sample/' + localStorage.getItem(btoa('facilityId')) +'/' +this.floorId.value +'/#';
            this.client.subscribe(topicName);
            this.client.on('message', (topic, message, packet) => {
                let msg = message.toString();
                let tagData = JSON.parse('[' + msg + ']')
                tagData = tagData[0]
                this.bindIndoorTag(tagData);
            })
        }
    }
    bindIndoorTag(tagData) {
        if(this.indoorNav.hasOwnProperty(tagData['tid']) && this.indoorNav[tagData['tid']].length) {
            for(let i in this.indoorNav[tagData['tid']]) {
                this.allFloorMap[this.floorId.value].removeLayer(this.indoorNav[tagData['tid']][i]);
            }
        }
        if(tagData.hasOwnProperty('nodes') && tagData.nodes.length) {
            this.indoorNav[tagData['tid']] = [];
            for(let i in tagData.nodes) {
                let image = this.iconList[tagData.nodes[i]['color']]
                let points = tagData.nodes[i]['xy'];
                for(let j in points) {
                    let point = [points[j][1] * -100, points[j][0] * 100];
                    const marker = L.marker(point, { icon: image, draggable: false });
                    marker.addTo(this.allFloorMap[tagData.flr]);   
                    this.indoorNav[tagData['tid']].push(marker)                                        
                }                                
            }
        }        
    }
    playOption(type){
        if(type == 'play') {
            this.hazardDetails['marker'].start();    
            for(let i in this.hazardDetails['label']) {
                this.allFloorMap[this.floorId.value].removeLayer(this.hazardDetails['label'][i]);
            }
        } else if(type == 'pause') {
            this.hazardDetails['marker'].pause();
            for(let i in this.hazardDetails['label']) {
                this.hazardDetails['label'][i].addTo(this.allFloorMap[this.floorId.value])
            }                
        } else if(type == 'fast-fwd') {
            for(let i in this.hazardDetails['label']) {
                this.allFloorMap[this.floorId.value].removeLayer(this.hazardDetails['label'][i]);
            }
            this.hazardDetails['marker'].pause();
            this.hazardDetails['marker']._durations = this.hazardDetails['marker']._durations.map(val => val/2);
            this.hazardDetails['marker'].start();
        } else if(type == 'fast-rwd') {
            for(let i in this.hazardDetails['label']) {
                this.allFloorMap[this.floorId.value].removeLayer(this.hazardDetails['label'][i]);
            }
            this.hazardDetails['marker'].pause();
            this.hazardDetails['marker']._durations = this.hazardDetails['marker']._durations.map(val => val*2);
            this.hazardDetails['marker'].start();
        }
        
    }
    hazardPopup(data, marker) {
        marker.bindPopup(
            '<div><b>Hazard : ' + data[(marker['_currentIndex'] + 1)]['hazardValue'] +'</b></div>'+
            '<b>Time : </b>'+ (data[(marker['_currentIndex'] + 1)]['eventTime'])
        ).openPopup();
        this.hazardDetails['interval'] =  setInterval(function() {
            if(!marker.isPaused()) {
            marker.closePopup();
            marker.unbindPopup();
            marker.bindPopup(
                '<div><b>Hazard : ' + data[(marker['_currentIndex'] + 1)]['hazardValue'] +'</b></div>'+
                '<b>Time : </b>'+ (data[(marker['_currentIndex'] + 1)]['eventTime'])
            ).openPopup();
            }
        }, 1000);
    }
    hazardclosePopup(data, marker) {
        clearInterval(this.hazardDetails['interval']);
        marker.closePopup();
        marker.unbindPopup();
        for(let i in this.hazardDetails['label']) {
            this.hazardDetails['label'][i].addTo(this.allFloorMap[this.floorId.value])
        }
    }
    hazardBinding() {
        let hazardPath = [];
        let hazardPoints = [];
        let duration = [];
        // this.reqTagDetail.children = this.reqTagDetail.children.reverse()
        for(let i=0; i < this.reqTagDetail.hazards.length; i++){
            let coordinates = JSON.parse(this.reqTagDetail.hazards[i]['coordinate'])
            if(i == 0 || this.reqTagDetail.hazards[i-1]['coordinate'] !== this.reqTagDetail.hazards[i]['coordinate']) {
                if(isNaN(coordinates[1]) != true) {
                    if(this.floorDetail.locationTypeId != 23) {
                        coordinates = [coordinates[1] * -100, coordinates[0] * 100]
                    }
                    hazardPath.push(coordinates)
                    hazardPoints.push(this.reqTagDetail.hazards[i])
                    duration.push(2000);
                }
            }
        }
        const pathLine = new L.Polyline(hazardPath, { className: "leaf-path-polyline-style" });
        pathLine.addTo(this.allFloorMap[this.floorId.value])
        let hazardData = hazardPoints;
        duration.pop();
        if(hazardPath.length) {
        let marker = L.Marker.movingMarker(hazardPath, duration, {autostart: false});
        let iconData = {iconUrl: '/assets/Floorplan/pegman-final.png', iconSize: [30, 30], iconAnchor: [15, 35]};
        marker.options.icon = L.icon(iconData);
        marker.on('start', this.hazardPopup.bind(this,this.reqTagDetail.hazards, marker)) 
        marker.on('end', this.hazardclosePopup.bind(this,this.reqTagDetail.hazards, marker));
        this.hazardDetails['marker'] = marker;
        marker.addTo(this.allFloorMap[this.floorId.value]);
        let lenStr = (hazardData.length - 1).toString()
        let result1 = hazardData.reduce(function (r, a) {
            r[a['coordinate']] = r[a['coordinate']] || [];
            r[a['coordinate']].push(a);
            return r;
        }, Object.create(null));
        for (let x in result1) {
            let coordinates = JSON.parse(x)
            if(this.floorDetail.locationTypeId != 23) {
            coordinates = [coordinates[1] * -100, coordinates[0] * 100]
            }
            result1[x]['sl_list'] = result1[x].map(function(value) {
                return value.id;
            });
            let MarkerText = L.divIcon({
                // html:"<div><b style='color : blue'>"+ result1[x][0]['Reader id'] + " (" + result1[x][0]['Hazard value'] + result1[x][0]['Units'] + ") </b><div>" +
                //      "<div>"+ result1[x]['sl_list'] +"</div>",
                html:"",
                iconSize: null
            });
            let label = L.marker(coordinates, { icon: MarkerText, draggable: false });
            label.addTo(this.allFloorMap[this.floorId.value])
            this.hazardDetails['label'].push(label);
            let iconImage = new L.Icon({ iconUrl: '/assets/Alert/common_icons/blue-dot.png', iconSize: [14, 14], iconAnchor: [7, 7] });
            if(result1[x]['sl_list'].includes('0')) {
                iconImage = new L.Icon({ iconUrl: '/assets/Alert/common_icons/green-dot.png', iconSize: [14, 14], iconAnchor: [7, 7] });
            }
            if(result1[x]['sl_list'].includes(lenStr)) {
                iconImage = new L.Icon({ iconUrl: '/assets/Alert/common_icons/red-dot.png', iconSize: [14, 14], iconAnchor: [7, 7] });
            }
            let loadNodePoint = L.marker(coordinates, { icon: iconImage});
            loadNodePoint.addTo(this.allFloorMap[this.floorId.value]);            
        }
        const filteredHazardsData = this.reqTagDetail.hazards.filter(hazard => hazard.raye != null);
        const colorMap = {
            R: '/assets/icons/flag-red-icon.svg',
            A: '/assets/icons/flag-orange-icon.svg',
            Y: '/assets/icons/flag-yellow-icon.svg',
            E: '/assets/icons/flag-blue-icon.svg'
        };
        
        if (filteredHazardsData.length > 0) {
            const seenCoordinates = new Set();
            
            filteredHazardsData.forEach(({ raye, coordinate, hazardValue, hazardUnit }) => {
                let parsedCoordinates;
                
                try {
                    parsedCoordinates = JSON.parse(coordinate);
                } catch (e) {
                    console.log('Error parsing coordinates:', coordinate, e);
                    return;
                }
        
                const coordKey = `${parsedCoordinates[0]},${parsedCoordinates[1]}`;
                if (seenCoordinates.has(coordKey)) {
                    parsedCoordinates[0] -= 0.00005;
                    parsedCoordinates[1] -= 0.00005;
                } else {
                    seenCoordinates.add(coordKey);
                }
        
                const iconUrl = colorMap[raye];
                const customIcon = L.icon({
                    iconUrl,
                    iconSize: [30, 30],
                    iconAnchor: [10, 20],
                });
        
                const flag = L.marker(parsedCoordinates, { icon: customIcon });
                const tooltipContent = `
                    <div>
                        <strong>Flare:</strong> ${raye}<br>
                        <strong>Value:</strong> ${hazardValue} ${hazardUnit || ''}
                    </div>
                `;
        
                flag.bindTooltip(tooltipContent, {
                    permanent: false,
                    direction: 'top',
                    className: 'custom-tooltip',
                    offset: [0, -10],
                });
        
                this.allFloorMap[this.floorId.value].addLayer(flag);
            });
        }      
        }
    }
    getMarkersOnOver(floorid,a){
        let floorMarkers = this.tagMarkerList[floorid];
        let filteredMarkers = [];
        let keys = Object.keys(this.tagMarkerList[floorid])
        for(let i=0; i < keys.length; i++){
            filteredMarkers.push(Object.assign({}, floorMarkers[keys[i]], {tagId: keys[i]}))
        }
        let clustMarkers = a.layer.getAllChildMarkers();
        let filterTags = [];
        let markerName = '';
        let markerId;
        for(let i =0; i < clustMarkers.length; i++){
            if(i <= 9){
            let idFil = filteredMarkers.filter(res => res['_leaflet_id'] == clustMarkers[i]['_leaflet_id']);
            filterTags.push(idFil[0].tagId)
            }
        }
        if(clustMarkers.length > 9){
            let len = clustMarkers.length - 9;
            markerId = "<div style='overflow-wrap: anywhere;font-size: 13px; font-weight: 600;font-family:" + 'Open Sans' + "'>"+ 'Tag Ids: '+ filterTags.toString() + "<br> ..and " + len + ' more tags' +"</div>"
        } else if(clustMarkers.length <= 9){
            markerId = "<div style='overflow-wrap: anywhere;font-size: 13px; font-weight: 600;font-family:" + 'Open Sans' + "'>"+ 'Tag Ids: '+ filterTags.toString() + "</div>"
        }
        markerName = this.navigationData[this.facilityId].find(res=> res.tid == filterTags[0])
        let popup = L.popup().setLatLng(a.latlng).setContent("<div style='height: 100%; width:100%'>"+ markerId +"<div style='text-overflow:ellipsis;overflow:hidden; white-space:nowrap;font-size: 13px; font-weight: 600;font-family:" + 'Open Sans' + "'>" + 'Location Name: '+ markerName['lnm'] +"</div></div>").openOn(this.allFloorMap[floorid]);
    }
    hideMarkersOnOut(a,floorid){
        this.allFloorMap[floorid].closePopup()
    }
    drawLocation(locationDetail, color, floorId) {
        let area = JSON.parse(locationDetail.coordinates);
        let polygonFill,strokeColorValue,fillOpacityValue;
        if(locationDetail.polygonStyle != null && locationDetail.polygonStyle != ''){
            polygonFill = locationDetail.polygonStyle
        }
        if (locationDetail && locationDetail.labelStyle) {     
            let polygonNameStyle;
            try {
                polygonNameStyle = typeof locationDetail.labelStyle === "string" ? JSON.parse(locationDetail.labelStyle) : locationDetail.labelStyle;
            } catch (error) {
                console.log("Error parsing labelStyle:", error);
                polygonNameStyle = {};
            }
            
            let polygonLabelStyle;
            try {
                polygonLabelStyle = typeof polygonNameStyle.polygon === "string" ? JSON.parse(polygonNameStyle.polygon) : polygonNameStyle.polygon;
            } catch (error) {
                console.log("Error parsing polygon:", error);
                polygonLabelStyle = {};
            }
            const defaultColor = "blue";
            polygonFill = polygonLabelStyle?.fillColor ?? polygonFill ?? defaultColor;
            strokeColorValue = polygonLabelStyle?.color ?? polygonFill;
            fillOpacityValue = polygonLabelStyle?.fillOpacity ?? 0.2;
        if (area) {
            let poly = area.geometry.coordinates
            let test: any = [];
            if(area.geometry.type == "Point") {
                test = [poly[1], poly[0]];
            } else {  
            for (let i in poly) {
                if(area.hasOwnProperty('unit') && area.unit == 'latlng') {
                    test.push([poly[i][1],poly[i][0]])
                } else {
                    test.push([poly[i][1] * -100, poly[i][0] * 100])
                }
            }
            }
            let polygonData : any;
            let className : any;
            if(color == 'bed') {
                let image = '/assets/Alert/common_icons/bed-spacing/no-patient.svg';
                if(locationDetail.is_occupied == 1) {
                    image = '/assets/Alert/common_icons/bed-spacing/occpied-with-patient-with-tag.svg';
                }
                color = '#ffffff00';
                const imageBounds = [test[0], test[2]];
                const imageOverlays = L.layerGroup();
                L.imageOverlay(image, imageBounds).setOpacity(0.75).addTo(imageOverlays);
                this.maps.bed_space_images.push(imageOverlays)
                imageOverlays.addTo(this.allFloorMap[floorId]);
                polygonData = L.polygon(test, {color: this.showPolygonBorder ?strokeColorValue :'transparent' ,fillColor: polygonFill,fillOpacity: fillOpacityValue,opacity:fillOpacityValue,weight:this.strokeWidth,className: "leaf-bed-labels" }).bindPopup(
                    'tag id : ' + locationDetail.tag_id + '<br>' + 'bed name : ' + locationDetail.name
                );
                className = 'leaf-bed-labels';
                this.maps.bed_space_polygon.push(polygonData)
            }
            else if(locationDetail.name == 'Defender'){
                polygonData = L.polygon(test, { use: L.polygon, className: "antPath-styling"});
                className = 'leaf-tool-labels'
            } 
            else {
                if(area.geometry.type == "Point") { 
                polygonData = L.marker(test);     
                } else {            
                polygonData = L.polygon(test, {color: this.showPolygonBorder? strokeColorValue :'transparent' ,fillColor: polygonFill,fillOpacity: fillOpacityValue,weight:this.strokeWidth, className: "leaf-bed-labels" })
                }
                className = 'leaf-tool-labels'
            }
            // this.maps.tooltip_polygon.push(polygonData);
            this.maps.tooltip_polygon[floorId][locationDetail.id] = polygonData;
            polygonData.off('click').on('click', (event) => {
                this.handlePolygonClick( this.maps.tooltip_polygon[floorId][locationDetail.id], locationDetail,true, event);
            });
            // polygonData.on('click', this.getTagCoordinate.bind(this, locationDetail, floorId))
            polygonData.addTo(this.allFloorMap[floorId])
            if(true) {
            // let tooltipStyle = "style='color:#808080d9;'"
            let labelStyle, labelPoint,baseStyle = '', position;
            if (locationDetail.labelStyle) {
                try {
                    labelStyle = JSON.parse(locationDetail.labelStyle);
                } catch {
                    labelStyle = locationDetail.labelStyle;
                }
            }
            if (locationDetail.labelPoint) {
                try {
                    labelPoint = JSON.parse(locationDetail.labelPoint);
                } catch {
                    labelPoint = locationDetail.labelPoint;
                }
            }
        
            let webStyle = labelPoint?.web ?? labelStyle?.web ?? null;
            let rotate = labelPoint?.rotate ?? labelStyle?.rotate ?? 0;
            let point = labelPoint?.point ?? labelStyle?.point ?? null;
        
            if (webStyle) {
                if (typeof webStyle === "string") {
                        try {
                            webStyle = JSON.parse(webStyle);
                        } catch (error) {
                        //   console.log(error);
                        }
                }
                      
                const jsonToCssString = Object.entries(webStyle).map(([key, value]) => `${key}: ${value}`).join("; ");
                baseStyle = jsonToCssString ;

                if (!/color\s*:/i.test(baseStyle)) {
                  baseStyle += (baseStyle ? ';' : '') + 'color:#363636de';
                }

                if (!/width\s*:/i.test(baseStyle)) {
                  baseStyle += (baseStyle ? ';' : '') + 'width:max-content';
                }
                      
            }
                if (rotate) {
                    baseStyle += `; transform: rotate(${rotate}deg);`;
                }
                // tooltipStyle = `style='${baseStyle}'`;
            
                if (point != null) {
                    position = [point[1]*-100, point[0]*100];
                } else {
                    position = polygonData.getBounds().getCenter();
                }
                // tooltipStyle = `style='${baseStyle}'`;
            // let name = "<div " + tooltipStyle + ">" + locationDetail.name.split(" ").join("<br>") + "</div>"
            // let name = "<div " + tooltipStyle + ">" + locationDetail.name + "</div>"
            let textData = null;
            const shouldHideLabel = this.hideLabelTypeIds?.length && this.hideLabelTypeIds.includes(locationDetail.locationCategoryId);
            if (!shouldHideLabel) {
                if(area.geometry.type == "Point") { 
                    let labelName = locationDetail.name;
                    let labelstyle;
                    try {
                      labelstyle = JSON.parse(locationDetail.labelStyle);
                    } catch {
                      labelstyle = locationDetail.labelStyle;
                    }
                    let labelStyle = locationDetail.labelStyle ? labelstyle?.web?labelstyle.web:labelstyle : "color: #A9A9A9 !important;font-size: 12px;"
                    if (!/color\s*:/i.test(labelStyle)) {
                       labelStyle += (labelStyle ? ';' : '') + 'color:#363636de';
                    }
                    if (!/width\s*:/i.test(labelStyle)) {
                       labelStyle += (labelStyle ? ';' : '') + 'width:max-content';
                    }
                    polygonData.bindTooltip("<div style="+ labelStyle + ">"+labelName+"</div>", {permanent: true, direction: "center", className: "polytooltip"}).openTooltip()
                } else {      
                    // textData = L.polygon(test, { color: 'transparent', weight : 0.0, className: "leaf-text-labels"}).bindTooltip(name, { permanent: true, direction: "center", className: className });
                    // textData.addTo(this.allFloorMap[floorId])
                    if (!/color\s*:/i.test(baseStyle)) {
                        baseStyle += (baseStyle ? ';' : '') + 'color:#363636de';;
                    }
                    if (/transform\s*:\s*rotate\(0deg\)/i.test(baseStyle) && rotate) {
                        baseStyle = baseStyle.replace(
                            /transform\s*:\s*rotate\(0deg\)/i,
                            `transform: rotate(${rotate}deg)`
                        );
                    }
                    if (!/width\s*:\s*max-content/i.test(baseStyle)) {
                        baseStyle += ';width:max-content';
                    }
                    // else if (labelStyle.rotate) {
                    //     baseStyle += `; transform: rotate(${labelStyle.rotate}deg);`;
                    // }
                    // edit polygon label marker addition
                    textData = L.marker(position)
                    .setIcon(
                        new L.DivIcon({
                            className: "leaf-text-labels",
                            html: `<div style="${baseStyle};">${locationDetail.name}</div>`,
                        })
                    );            
                    textData.addTo(this.allFloorMap[floorId]);
                }
            
                this.maps.text_polygon[floorId][locationDetail.id] = textData;
            }
            this.locAdvertisements(locationDetail, floorId, position)
            
            }
            if(this.reqType == 'track' || this.floorDetail && this.floorDetail.locationTypeId == 23) {
                if(area.geometry.type == "Point") { 
                    let bounds = [[poly[1], poly[0]], [poly[1], poly[0]]]
                    this.allFloorMap[floorId].fitBounds(bounds);                    
                } else {                               
                    this.allFloorMap[floorId].fitBounds(polygonData.getBounds());
                }
                }
            }
        }
    }
    locAdvertisements(locationDetail, floorId, position) {
        if(this.maps.loc_icon.hasOwnProperty(floorId) == false) {
            this.maps.loc_icon[floorId] = {}
        }
        if (this.navConfig.showElevatorandStairIcons && ["LC_Stair Case", "LC_Lift"].includes(locationDetail.locationCategoryId)) {
            let iconName = locationDetail.locationCategoryId == "LC_Stair Case" ? "stairs": "elevator";
            let iconDetail = L.divIcon({
                html: `<span class="material-icons" style="font-size:24px;color:var(--primary-bg-color);"> `+ iconName +`</span>`,
                iconSize: [24, 24],
                iconAnchor: [20, 20],
                className: 'my-material-icon' // optional, to control CSS
            });
            let advertisement = L.marker(position, { icon: iconDetail });

            advertisement.addTo(this.allFloorMap[floorId]);
            this.maps.loc_icon[floorId][locationDetail.id] = advertisement;
        }
        if(locationDetail.name.includes('Pharmacy')) {
            if(this.navConfig.showLocCatIcon) {
                let iconImage = new L.Icon({ iconUrl: '/assets/Floorplan/pharmacy.svg', iconSize: [30, 30], iconAnchor: [20, 25]});
                let advertisement = L.marker(position, {icon: iconImage});
                if(this.navConfig.showAdvertisement) {
                    advertisement.bindTooltip(
                    '<b>20% OFF</b><br>Himalaya Beauty Products',
                    { permanent: false, direction: 'right', offset: [10, 0], className: 'offer-tooltip' }
                    )
                    advertisement.addTo(this.allFloorMap[floorId]);
                    this.maps.loc_icon[floorId][locationDetail.id] = advertisement;
                }
            }
            
        }
    }
    loadBuild(data, floorId){ 
        let area = JSON.parse(data.coordinates);
        if(area) {
            let poly = area.geometry.coordinates
            let test:any = [];
            if(area.geometry.type == "Point") {
                test = [poly[1], poly[0]];
            } else {  
            for(let i in poly) {
            test.push([poly[i][1]*-100,poly[i][0]*100])
            }
            }
            let flrLocHighlight = null;
            if(area.geometry.type == "Point") { 
                flrLocHighlight = L.marker(test);     
            } else {            
            flrLocHighlight = L.polygon(test, { className : 'loc-polygon-highlight'})
            }
            flrLocHighlight.addTo(this.allFloorMap[floorId])
            setTimeout(() =>  this.locMarking(flrLocHighlight, floorId), 1000);
        }
    }
    zoomCntrlLabel(floorid){
        if(this.pathData == null &&  this.navConfig?.enableBlockView && this.reqType != 'track') {
        if(this.allMapZoomToggle.hasOwnProperty(floorid)) {
            this.allFloorMap[floorid].removeControl(this.allMapZoomToggle[floorid])
            delete this.allMapZoomToggle[floorid];
        }
        let zoomtoggleIcon = this.blockView.active ? 'fit_screen' : 'dataset';
        let zoomToggle = L.DomUtil.create("div");
        this.allMapZoomToggle[floorid] = new L.Control();
        this.allMapZoomToggle[floorid].options = { position: "topleft" };
        this.allMapZoomToggle[floorid].onAdd = () => {
            zoomToggle.innerHTML = "<button style='width: 31px; height: 35px; cursor: pointer; margin-top: -5px; margin-left: 1px; background: white; border: 1px solid #b5b0b0;'>" + 
            "<span class='material-icons' style='margin-left: -4px; font-size: 25px;'>" + zoomtoggleIcon +"</span>" + "</button>";
            return zoomToggle;
        };
        L.DomEvent.on(zoomToggle, 'click', this.changeView.bind(this, floorid), this);
        this.allFloorMap[floorid].addControl(this.allMapZoomToggle[floorid]);
        }
        let zoomVal = (Math.round(this.allFloorMap[floorid].getZoom()) + 10) * 20;
        if(this.floorDetail && this.floorDetail['locationTypeId'] == 23) {
            zoomVal = Math.round(this.allFloorMap[floorid].getZoom()) * 10;
        }    
        if(this.allMapZoomCntrl.hasOwnProperty(floorid)) {
            this.allFloorMap[floorid].removeControl(this.allMapZoomCntrl[floorid])
            delete this.allMapZoomCntrl[floorid];
        }
        let showZoom = L.DomUtil.create("div");
        this.allMapZoomCntrl[floorid] = new L.Control();
        this.allMapZoomCntrl[floorid].options = { position: "topleft" };
        this.allMapZoomCntrl[floorid].onAdd = () => {
            showZoom.innerHTML = "<div style='font-size: 15px;'>" + zoomVal + "%</div>";
            return showZoom;
        };
        this.allFloorMap[floorid].addControl(this.allMapZoomCntrl[floorid]);
    }
    getTagOnInit(floorData){
        // The initial tag load can be hundreds/thousands of records. Processing them all
        // synchronously in one loop (each going through the full bindTag pipeline) is what
        // used to freeze the tab on first paint. Chunking + yielding to the browser between
        // chunks (via requestAnimationFrame) keeps the tab responsive while it populates, and
        // deferring the tabData/isShowTag recompute to once-per-chunk (instead of once per
        // record) cuts that part of the work by roughly the chunk size.
        const CHUNK_SIZE = 100;
        let i = 0;
        const processChunk = () => {
            const end = Math.min(i + CHUNK_SIZE, floorData.length);
            for(; i < end; i++){
                const epochNow = Math.floor((new Date().getTime())/1000);
                const epochBfor = Math.floor(floorData[i].fromtime);
                let res = Math.abs(epochNow - epochBfor);
                let icon;
                if(floorData[i].tagtype == 'TAT-US' && floorData[i].hasOwnProperty('userTypeId')) {
                    floorData[i].tagtype = floorData[i].userTypeId == 'UT_STUDENT' ? 'TAT-STD' : floorData[i].userTypeId == 'UT_STAFF' ? 'TAT-STF' : 'TAT-US'
                }
                if(res > 300){
                    icon = floorData[i].tagtype + '-OLD';
                } else{
                    icon = floorData[i].tagtype + '-IDL';
                }
                let tagData = {
                    'fid' : floorData[i].facility_id,
                    'ctm' : floorData[i].fromtime,
                    'etm' : floorData[i].fromtime,
                    'edt' : floorData[i].event_dt,
                    'tid' : floorData[i].tagid,
                    'ttp' : floorData[i].tagtype,
                    'tvl' : floorData[i].tag_value,
                    'cxy' : [floorData[i]['x'],floorData[i]['y']],
                    'blk' : floorData[i].blockId,
                    'bln' : floorData[i].blockName,
                    'flr' : floorData[i].floor_id,
                    'lid' : floorData[i].location_id,
                    'lnm' : floorData[i].location_name,
                    'fln' : floorData[i].floorName,
                    'tan' : floorData[i].tagAssociatedName,
                    'sat' : floorData[i].assetType,
                    'ust' : floorData[i].userTypeId,
                    'asi' : floorData[i].identifier ? floorData[i].identifier : null,
                    'icon' : icon
                };
                this.checkTag(tagData, true);
            }
            this.refreshTagVisibility();
            this.cdr.markForCheck();
            if(i < floorData.length){
                requestAnimationFrame(processChunk);
            } else {
                this.getCurrentTags();
            }
        };
        if(floorData.length){
            processChunk();
        } else {
            this.getCurrentTags();
        }
    }
    getCurrentTags() {
        if(this.navConfig.triggerPublish) {
        let data = {
            topic: 'tw/cache/gw/<fid>',
            message: {
                "typ": "cache",
                "ctx": "current_location",
                "operation": "",
                "dateTime":"2024-05-09 06:41:05",
                "data":[ 
                    {  "facility_id": this.facilityId, "floor_id": this.blockView.active ? [this.floorId.value]: [this.floorId.value], "block_id": [this.blockId.value]  }
                ],
                "event":{}
            }    
        }
        this.commonService.savePublisMqtt(data).subscribe(res => {
            // console.log(res.results)
        }, error => {
            this.toastr.error('Error', `${error.error.message}`);
        });
        }
    }
    getPorterTagList(){
        this.porterReqTagList = [...this.reqTagDetail.nonPerformer.filter(val => val.tagAssociationTypeId != 'LOC'), ...this.reqTagDetail.performer.filter(val => val.status != 'RQ-NR' && val.status != 'RQ-RJ' && val.tagAssociationTypeId != 'LOC')];
        // console.log(this.porterReqTagList)
    }
    getPorterSearchControl(){
        // if(this.reqTagDetail.statusName == 'Assigned'){
            this.commonService.getLocationSearch(this.reqTagDetail.sourceLocName).subscribe((res) => {
                let tagLocation = res.results;
                let srcLoc = null;
                if(tagLocation.length) {
                    srcLoc = tagLocation.filter(res => res.id == this.reqTagDetail.sourceId)[0]
                }
                setTimeout(() =>  this.getLocationId(srcLoc, 'fromLoc', null), 500);
            });
            this.commonService.getLocationSearch(this.reqTagDetail.destinationLocName).subscribe((res) => {
                let tagLocation = res.results;
                let destLoc = null;
                if(tagLocation.length) {
                    destLoc = tagLocation.filter(res => res.id == this.reqTagDetail.destinationId)[0]
                }
                setTimeout(() =>  this.getLocationId(destLoc, 'toLoc', null), 1000);
            });
        // }
    }
    unsubscribeData(oldTopic, newTopic?) {
        if(this.client) { 
            let topicName = 'tw/tag/' + oldTopic + '/' + localStorage.getItem(btoa('facilityId')) + '/#'
            this.client.unsubscribe(topicName);
            if(newTopic) {
                this.navType = newTopic;
                this.subscribeData()
            }
        }
    }
    subscribeData(){
        if(this.client) {
            let topicName = 'tw/tag/' + this.navType + '/' + localStorage.getItem(btoa('facilityId')) + '/#'
            if(this.reqType == 'porter') {
                this.porterReqTagList = [...this.reqTagDetail.nonPerformer.filter(val => val.tagAssociationTypeId != 'LOC'), ...this.reqTagDetail.performer.filter(val => val.status != 'RQ-NR' && val.status != 'RQ-RJ' && val.tagAssociationTypeId != 'LOC')];
                if(this.porterReqTagList.length && this.porterReqTagList[0]['tagId']) {
                    topicName = 'tw/tag/' + this.navType + '/' + localStorage.getItem(btoa('facilityId')) + '/+/' + this.porterReqTagList[0]['tagId']
                }
            }
            // this.client.subscribe(['tw/tag/location_nav/' + localStorage.getItem(btoa('facilityId')) + '/#', 'tw/cache/gw/+' + localStorage.getItem(btoa('facilityId'))]);
            this.client.subscribe(topicName);
            if(!this.isMqttMessageBound) {
                this.isMqttMessageBound = true;
                // Parsing + queueing happens outside Angular's zone so a burst of MQTT
                // messages doesn't trigger a change-detection pass per message; the
                // queued batch is drained (and CD triggered once) in processTagMessageBatch.
                this.ngZone.runOutsideAngular(() => {
                    this.client.on('message', (topic, message, packet) => {
                        if(topic.includes('tw/tag/' + this.navType + '/')){
                            let msg = message.toString();
                            let tagData = JSON.parse('[' + msg + ']')
                            tagData = tagData[0]
                            let nowTime = new Date().getTime()/1000
                            let checkTime =  (nowTime) - tagData['ctm']
                            if(this.allFloorMap.hasOwnProperty(tagData.flr) && this.blockId.value === tagData.blk && checkTime <= 120) {
                                this.tagMessage$.next(tagData);
                            }
                        }
                        // else if(topic.includes('tw/cache/gw/')){
                        //     let msg = message.toString();
                        //     let subsData = JSON.parse(msg)
                        //     console.log(subsData)
                        //     if(subsData.ctx == 'Tag' && subsData.operation == 'inactive'){
                        //         for(let i in subsData.data){
                        //             let index = this.navigationData[this.facilityId].findIndex(res => res.tid == subsData.data[i].tagId && res.tvl == subsData.event.associateId && res.ttp == subsData.event.associateTypeId)
                        //             if(index != -1){
                        //                 for(let i in this.tagMarkerList){
                        //                     if(this.tagMarkerList[i][this.navigationData[this.facilityId][index].tid] != undefined){
                        //                         this.floorMap.removeLayer(this.tagMarkerList[i][this.navigationData[this.facilityId][index].tid])
                        //                         delete this.tagMarkerList[i][this.navigationData[this.facilityId][index].tid]
                        //                         this.navigationData[this.facilityId].splice(index,1)
                        //                     }
                        //                 }
                        //             }
                        //         }
                        //     }
                        // }
                    });
                });
            }
        }
    }
    // Drains a buffered window (~150ms) of live MQTT tag messages in one pass instead of
    // reacting to each message individually. Within the window only the latest message per
    // tag id is kept (superseded positions don't need to be rendered), and the expensive
    // tabData/isShowTag recompute + filter reapply happen once for the whole batch instead of
    // once per tag - this is what prevents O(n) recompute x n-messages-per-second from
    // freezing the tab when there are hundreds/thousands of tags reporting.
    processTagMessageBatch(batch){
        let latestByTid = new Map();
        for(let i=0; i < batch.length; i++){
            latestByTid.set(batch[i].tid, batch[i]);
        }
        latestByTid.forEach(tagData => {
            if(tagData.flr != this.floorId.value){
                if(!(tagData.flr in this.tagMarkerList)){
                    this.tagMarkerList[tagData.flr] = {}
                }
                let floorList = Object.keys(this.tagMarkerList);
                for(let i in floorList) {
                    if(this.tagMarkerList[floorList[i]] && tagData.tid in this.tagMarkerList[floorList[i]] && this.allFloorMap.hasOwnProperty(floorList[i])){
                        let tagMarker = this.tagMarkerList[floorList[i]][tagData.tid];
                        if(tagData.flr != floorList[i]) {
                            this.allFloorMap[floorList[i]].closePopup();
                        }
                        this.allFloorMap[floorList[i]].removeLayer(tagMarker);
                        delete this.tagMarkerList[floorList[i]][tagData.tid]
                        this.navRemoveByTid(this.facilityId, tagData.tid)
                    }
                }
                if(this.blockView.active) {
                    this.checkTag(tagData, true)
                } else {
                    if (this.tagId == tagData.tid && this.tagType == tagData.ttp) {
                        this.previousTag = tagData;
                        this.onFloorChange(tagData.flr)
                    }
                }
            }
            else if(this.blockView.active || tagData.flr == this.floorId.value) {
                let floorList = Object.keys(this.tagMarkerList);
                for(let i in floorList) {
                    if(this.tagMarkerList[floorList[i]] && tagData.tid in this.tagMarkerList[floorList[i]] && this.allFloorMap.hasOwnProperty(floorList[i])){
                        if(tagData.flr != floorList[i]) {
                            let tagMarker = this.tagMarkerList[floorList[i]][tagData.tid];
                            this.allFloorMap[floorList[i]].closePopup();
                            this.allFloorMap[floorList[i]].removeLayer(tagMarker)
                            delete this.tagMarkerList[floorList[i]][tagData.tid]
                            this.navRemoveByTid(this.facilityId, tagData.tid)
                        }
                    }
                }
                this.checkTag(tagData, true)
            }
        });
        this.ngZone.run(() => {
            this.refreshTagVisibility();
            if(this.filterValue != null){
                this.applyFilter(this.filterValue)
            }
            this.cdr.markForCheck();
        });
    }
    checkTag(tagData, suppressRecompute: boolean = false){
        if(this.reqType == 'porter'){
            if((this.porterReqTagList.findIndex(res => res.tagId == tagData.tid) != -1) && (this.porterReqTagList.findIndex(res => res.tagAssociationTypeId == tagData.ttp) != -1)){
                this.bindTag(tagData, suppressRecompute)
            }
        }else{
            if(this.tagId != null && this.tagType != null){
                if(this.tagId == tagData.tid && this.tagType == tagData.ttp){
                    this.bindTag(tagData, suppressRecompute);
                    if(!this.tagIdHighlighted && this.tagMarkerList[tagData.flr] && this.tagMarkerList[tagData.flr][tagData.tid]){
                        this.tagIdHighlighted = true;
                        this.highlightTag(tagData);
                    }
                }
            } else{
                this.bindTag(tagData, suppressRecompute);
            }
        }
    }
    // O(1) index of tid -> position in navigationData[facilityId], lazily built and kept in
    // sync on push/splice so the hot per-message lookup in bindTag doesn't need an O(n)
    // findIndex scan over the whole tag list on every single MQTT message.
    private getNavIndex(facilityId): Map<string, number> {
        if(!this.navIndex[facilityId]){
            let map = new Map<string, number>();
            let arr = this.navigationData[facilityId] || [];
            for(let i=0; i < arr.length; i++){
                map.set(arr[i].tid, i);
            }
            this.navIndex[facilityId] = map;
        }
        return this.navIndex[facilityId];
    }
    private navFindIndex(facilityId, tid): number {
        let arr = this.navigationData[facilityId];
        if(!arr || !arr.length){
            return -1;
        }
        let map = this.getNavIndex(facilityId);
        let idx = map.has(tid) ? map.get(tid) : -1;
        if(idx === -1 || !arr[idx] || arr[idx].tid !== tid){
            idx = arr.findIndex(res => res.tid == tid);
            if(idx !== -1){
                map.set(tid, idx);
            }
        }
        return idx;
    }
    private navPush(facilityId, tagData){
        this.navigationData[facilityId].push(tagData);
        this.getNavIndex(facilityId).set(tagData.tid, this.navigationData[facilityId].length - 1);
    }
    private navRemoveByTid(facilityId, tid){
        let idx = this.navFindIndex(facilityId, tid);
        if(idx === -1){
            return;
        }
        this.navigationData[facilityId].splice(idx, 1);
        let map = this.navIndex[facilityId];
        if(map){
            map.delete(tid);
            map.forEach((v, k) => {
                if(v > idx){
                    map.set(k, v - 1);
                }
            });
        }
    }
    trackByTid(index, tag){
        return tag && tag.tid ? tag.tid : index;
    }
    // Recomputes tabData + isShowTag (both derived from the full navigationData array) once.
    // bindTag() used to do this on every single tag update; callers now pass
    // suppressRecompute=true while processing a batch/initial load and call this once at the end.
    refreshTagVisibility(){
        if(this.tabValue.length > 0){
            if(this.blockView.active) {
                this.tabData = this.navigationData[this.facilityId].filter(val => val.ttp == this.tabValue[this.selectedIndex].type);
            } else {
                this.tabData = this.navigationData[this.facilityId].filter(val => val.flr == this.floorId.value && val.ttp == this.tabValue[this.selectedIndex].type);
            }
            if(this.navigationData[this.facilityId].length > 0){
                let isShowTagKeys = Object.keys(this.isShowTag);
                for(let i=0; i < isShowTagKeys.length; i++){
                    let filterData = this.navigationData[this.facilityId].filter(res => res.flr == this.floorId.value && res.ttp == isShowTagKeys[i])
                    this.isShowTag[isShowTagKeys[i]] = filterData.length > 0;
                }
            }
        }
    }
    // addMarker(iconData, tagData,movePoints) {
    //     let marker;
    //     let duration = [500];
    //     if(this.reqType == 'porter'){
    //     //    marker = this.grpTagPosition(iconData, tagData,movePoints, duration)
    //     marker = L.Marker.movingMarker(movePoints, duration, {autostart: true});
    //     marker.options.icon = L.icon(iconData);
    //     if(tagData.ttp == 'TAT-PO'){
    //         if(this.circleMarker != undefined){
    //             this.allFloorMap[tagData.flr].removeLayer(this.circleMarker)
    //         }
    //         this.circleMarker = L.circle(movePoints[movePoints.length-1], {
    //             className : 'porter-circleMarker',
    //             radius: 300
    //         }).addTo(this.allFloorMap[tagData.flr]);
    //     }
    //     } else{
    //     marker = L.Marker.movingMarker(movePoints, duration, {autostart: true});
    //     marker.options.icon = L.icon(iconData);
    //     }
    //     if(this.tagOptions.selectedTag != null && this.tagOptions.selectedTag.tid == tagData.tid){
    //         iconData['iconSize'] = [60, 60];
    //         marker.options.icon = L.icon(iconData);
    //         this.tagOptions.lastTag = marker;
    //         if(this.isNavigate){
    //             this.navigateHighlightedTag(tagData)
    //         }
    //     }
    //     if(this.tagMarkerList[tagData.flr][tagData.tid] != undefined){
    //         this.allOms[tagData.flr].removeMarker(this.tagMarkerList[tagData.flr][tagData.tid])
    //     }
    //     this.markerCluster.clearLayers();
    //     let lastSeen = this.datepipe.transform(tagData.etm , 'h:mm:ss a');
    //     tagData.icon = this.truckEnable ? 'TAT-TR' : tagData.icon;
    //     marker.bindPopup("<div style = 'height: 80px;width: 175px'><div style = 'height: 80%; width: 100%'><div style='height: 100%; width: 25%;float:left'><img style='height: 50px; padding: 8px 0px 0px 0px;' src=" +  '/assets/Floorplan/' + tagData.icon + '.svg' + "></div><div style= 'height: 100%; width: 75%;float: right'><div style='height: 26%; width:100%; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;  text-align: center; font-size: 13px; padding-top: 3px; font-weight:700; font-family:" + 'Open Sans' + "'>" + tagData.tan.toUpperCase() + "</div><div style='height: 26%; padding-top: 2px; font-size: 13px; text-align: center; font-weight: 200; font-family:" +'Open Sans'+"'>" + tagData.tid + "</div><div style='height: 26%;font-weight: 200; font-size: 12px; text-align: center;text-overflow: ellipsis; overflow: hidden; white-space: nowrap;padding-top:2px; font-family:" +'Open Sans'+ "'>" + tagData.lnm + ', '+ tagData.fln + "</div></div></div><div style = 'height: 20%; width: 100%; text-align: center; font-family:" +'Open Sans'+ "'> Last Seen : "+ lastSeen +"</div></div>")
    //     marker.on('click', this.showTagPop.bind(this, tagData));
    //     this.tagMarkerList[this.floorId.value][tagData.tid] = marker;
    //     this.allOms[tagData.flr].addMarker(marker)
    //     for(let i in this.tagMarkerList[this.floorId.value]){
    //         // this.tagMarkerList[this.floorId.value][i].addTo(this.markerCluster)
    //         this.markerCluster.addLayer(this.tagMarkerList[this.floorId.value][i])
    //     }
    //     if(this.lastFilter == tagData.ttp){
    //         this.allFloorMap[tagData.flr].addLayer(marker)
    //     } else if(this.lastFilter == null){
    //         this.allFloorMap[tagData.flr].addLayer(marker)
    //     }
    // }
    // addMarkerOnPath(iconData, tagData,movePoints, index){
    //     // console.log(index)
    //     // console.log(movePoints)
    //     let marker;
    //     let sLast = null, dLast = null;
    //     let source = null, destination = null;
    //     let nodePath = [];
    //     if(this.leafRef != undefined && this.searchFilter.hasOwnProperty('src') && this.searchFilter.hasOwnProperty('dest') && this.reqType == 'porter'){
    //         this.dijkstraModelObject = new DijkstraModel();
    //         const searchPath = this.dijkstraModelObject.run(this.graph, 1, this.searchFilter['src'], this.searchFilter['dest']);
    //         const pathValue = this.dijkstraModelObject.getPath(searchPath.prev, searchPath.target);
    //         for(let i=0; i < pathValue.length; i++){
    //             nodePath.push(this.floorNodeInfo[this.floorId.value]['node'].find(res => res.id == pathValue[i]))
    //         }
    //     } else{
    //         nodePath = this.floorNodeInfo[this.floorId.value]['node'];
    //     }
    //     this.dijkstraModelObject = new DijkstraModel();
    //     for (let node of nodePath) {
    //         let sdistance = Math.sqrt(Math.pow((this.navigationData[this.facilityId][index].cxy[1] - node.y), 2) +
    //         Math.pow((this.navigationData[this.facilityId][index].cxy[0] - node.x), 2));
    //         let ddistance = Math.sqrt(Math.pow((tagData.cxy[1] - node.y), 2) +
    //         Math.pow((tagData.cxy[0] - node.x), 2));
    //         source = sLast == null || sLast >= sdistance ? node : source;
    //         sLast = sLast == null || sLast >= sdistance ? sdistance : sLast;
    //         destination = dLast == null || dLast >= ddistance ? node : destination;
    //         dLast = dLast == null || dLast >= ddistance ? ddistance : dLast;
    //     }
    //     const dijResults = this.dijkstraModelObject.run(this.graph, 1, source.id, destination.id);
    //     const shortestPath = this.dijkstraModelObject.getPath(dijResults.prev, dijResults.target);
    //     const path = [], duration = [100];
    //     for (let i in shortestPath) {
    //         if (parseInt(i) != 0 && parseInt(i) != (shortestPath.length-1)) {
    //             let data =  this.floorNodeInfo[this.floorId.value]['nodes'][shortestPath[i]]
    //             movePoints[1] = [data['y'] * -100, data['x'] * 100];
    //             path.push([data['y'] * -100, data['x'] * 100]);
    //             duration.push(100);
    //         }
    //     }
    //     duration.push(100);
    //     tagData["sourceNode"] = shortestPath[shortestPath.length-2];
    //     let sourceNode = shortestPath[shortestPath.length-2];
    //     if(this.reqType == 'porter'){
    //         if(path.length > 2){
    //             movePoints = path;
    //         }
    //         // marker = this.grpTagPosition(iconData, tagData,movePoints, duration)
    //         marker = L.Marker.movingMarker(movePoints, duration, {autostart: true});
    //         marker.options.icon = L.icon(iconData);
    //         if(tagData.ttp == 'TAT-PO'){
    //             if(this.circleMarker != undefined){
    //                 this.allFloorMap[tagData.flr].removeLayer(this.circleMarker)
    //             }
    //             this.circleMarker = L.circle(movePoints[movePoints.length-1], {
    //                 className : 'porter-circleMarker',
    //                 radius: 300
    //             }).addTo(this.allFloorMap[tagData.flr]);
    //         }
    //     } 
    //     else{
    //         if(path.length > 2){
    //             movePoints = path;
    //         }
    //         marker = L.Marker.movingMarker(movePoints, duration, {autostart: true});
    //         marker.options.icon = L.icon(iconData);
    //     }
    //     if(this.tagOptions.selectedTag != null && this.tagOptions.selectedTag.tid == tagData.tid){
    //         iconData['iconSize'] = [60, 60];
    //         marker.options.icon = L.icon(iconData);
    //         this.tagOptions.lastTag = marker;
    //         if(this.isNavigate){
    //             this.navigateHighlightedTag(tagData)
    //         }
    //     }
    //     if(this.tagMarkerList[tagData.flr][tagData.tid] != undefined){
    //         this.allOms[tagData.flr].removeMarker(this.tagMarkerList[tagData.flr][tagData.tid])
    //     }
    //     this.allMarkerCluster[tagData.flr].clearLayers();
    //     let lastSeen = this.datepipe.transform(tagData.etm , 'h:mm:ss a');
    //     tagData.icon = this.truckEnable ? 'TAT-TR' : tagData.icon;
    //     marker.bindPopup("<div style = 'height: 80px;width: 175px'><div style = 'height: 80%; width: 100%'><div style='height: 100%; width: 25%;float:left'><img style='height: 50px; padding: 8px 0px 0px 0px;' src=" +  '/assets/Floorplan/' + tagData.icon + '.svg' + "></div><div style= 'height: 100%; width: 75%;float: right'><div style='height: 26% ;width:100%; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; text-align: center; font-size: 13px; padding-top: 3px; font-weight:700; font-family:" + 'Open Sans' + "'>" + tagData.tan.toUpperCase() + "</div><div style='height: 26%; padding-top: 2px; font-size: 13px; text-align: center; font-weight: 200; font-family:" +'Open Sans'+"'>" + tagData.tid + "</div><div style='height: 26%;font-weight: 200; font-size: 12px; text-align: center;text-overflow: ellipsis; overflow: hidden; white-space: nowrap; padding-top:2px; font-family:" +'Open Sans'+ "'>" + tagData.lnm + ', '+ tagData.fln + "</div></div></div><div style = 'height: 20%; width: 100%; text-align: center; font-family:" +'Open Sans'+ "'> Last Seen : "+ lastSeen +"</div></div>")
    //     marker.on('click', this.showTagPop.bind(this, tagData));
    //     this.tagMarkerList[tagData.flr][tagData.tid] = marker;
    //     this.allOms[tagData.flr].addMarker(marker)
    //     for(let i in this.tagMarkerList[tagData.flr]){
    //         // this.tagMarkerList[this.floorId.value][i].addTo(this.markerCluster)
    //         this.allMarkerCluster[tagData.flr].addLayer(this.tagMarkerList[tagData.flr][i])
    //     }
    //     if(this.lastFilter == tagData.ttp){
    //         this.allFloorMap[tagData.flr].addLayer(marker)
    //     } else if(this.lastFilter == null){
    //         this.allFloorMap[tagData.flr].addLayer(marker)
    //     }
    //     return sourceNode;
    // }
    addMarkerOverlay(iconData, tagData,movePoints) {
        let marker;
        let duration = [500];
        if(this.reqType == 'porter'){
        //    marker = this.grpTagPosition(iconData, tagData,movePoints, duration)
        marker = L.Marker.movingMarker(movePoints, duration, {autostart: true});
        marker.options.icon = L.icon(iconData);
        if(tagData.ttp == 'TAT-PO'){
            if(this.circleMarker != undefined){
                this.allFloorMap[tagData.flr].removeLayer(this.circleMarker)
            }
            this.circleMarker = L.circle(movePoints[movePoints.length-1], {
                className : 'porter-circleMarker',
                radius: 300
            }).addTo(this.allFloorMap[tagData.flr]);
        }
        } else{
        marker = L.Marker.movingMarker(movePoints, duration, {autostart: true});
        marker.options.icon = L.icon(iconData);
        }
        if(this.tagOptions.selectedTag != null && this.tagOptions.selectedTag.tid == tagData.tid){
            iconData['iconSize'] = [60, 60];
            iconData['iconAnchor'] = [30, 55];
            iconData['className'] = 'highlight-icon';
            marker.options.icon = L.icon(iconData);
            marker.setZIndexOffset(250);
            this.tagOptions.lastTag = marker;
            if(this.isNavigate){
                this.navigateHighlightedTag(tagData)
            }
        }
        if(this.tagMarkerList[tagData.flr][tagData.tid] != undefined){
            this.allOms[tagData.flr].removeMarker(this.tagMarkerList[tagData.flr][tagData.tid])
        }
        // this.markerCluster.clearLayers();
        // let lastSeen = this.datepipe.transform(tagData.etm , 'h:mm:ss a');
        // marker.bindPopup("<div style = 'height: 80px;width: 175px'><div style = 'height: 80%; width: 100%'><div style='height: 100%; width: 25%;float:left'><img style='height: 50px; padding: 8px 0px 0px 0px;' src=" +  '/assets/Icons/' + tagData.icon + '.svg' + "></div><div style= 'height: 100%; width: 75%;float: right'><div style='height: 26%; width:100%; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;  text-align: center; font-size: 13px; padding-top: 3px; font-weight:700; font-family:" + 'Open Sans' + "'>" + tagData.tan.toUpperCase() + "</div><div style='height: 26%; padding-top: 2px; font-size: 13px; text-align: center; font-weight: 200; font-family:" +'Open Sans'+"'>" + tagData.tid + "</div><div style='height: 26%;font-weight: 200; font-size: 12px; text-align: center;text-overflow: ellipsis; overflow: hidden; white-space: nowrap;padding-top:2px; font-family:" +'Open Sans'+ "'>" + tagData.lnm + ', '+ tagData.fln + "</div></div></div><div style = 'height: 20%; width: 100%; text-align: center; font-family:" +'Open Sans'+ "'> Last Seen : "+ lastSeen +"</div></div>")
        marker.on('click', this.showTagPop.bind(this, tagData));
        marker.on('mouseover', this.getMarkerNearMarker.bind(this, tagData));
        // ASSET TRACKING MOUSE OVER CHANGES
        // if(tagData.ttp == "TAT-IN") {
        //     marker.on('mouseover', this.showDeviceInfo.bind(this, tagData.tid, marker));
        // }
        marker.tagId = tagData.tid;
        this.tagMarkerList[tagData.flr][tagData.tid] = marker;
        this.allOms[tagData.flr].addMarker(marker)
        // for(let i in this.tagMarkerList[this.floorId.value]){
        //     // this.tagMarkerList[this.floorId.value][i].addTo(this.markerCluster)
        //     this.markerCluster.addLayer(this.tagMarkerList[this.floorId.value][i])
        // }
        if(this.lastFilter == tagData.ttp){
            this.allFloorMap[tagData.flr].addLayer(marker)
        } else if(this.lastFilter == null){
            this.allFloorMap[tagData.flr].addLayer(marker)
        }
        this.getCountPopup(marker, tagData);
    }
    addMarkerOnPathOverlay(iconData, tagData,movePoints, index){
        // console.log(index)
        // console.log(movePoints)
        let marker;
        let sLast = null, dLast = null;
        let source = null, destination = null;
        let nodePath = [];
        if(this.leafRef != undefined && this.searchFilter.hasOwnProperty('src') && this.searchFilter.hasOwnProperty('dest') && this.reqType == 'porter'){
            this.dijkstraModelObject = new DijkstraModel();
            const searchPath = this.dijkstraModelObject.run(this.graph, 1, this.searchFilter['src'], this.searchFilter['dest']);
            const pathValue = this.dijkstraModelObject.getPath(searchPath.prev, searchPath.target);
            for(let i=0; i < pathValue.length; i++){
                nodePath.push(this.floorNodeInfo[tagData.flr]['node'].find(res => res.id == pathValue[i]))
            }
        } else{
            nodePath = this.floorNodeInfo[tagData.flr]['node'];
        }
        this.dijkstraModelObject = new DijkstraModel();
        for (let node of nodePath) {
            let sdistance = Math.sqrt(Math.pow((this.navigationData[this.facilityId][index].cxy[1] - node.y), 2) +
            Math.pow((this.navigationData[this.facilityId][index].cxy[0] - node.x), 2));
            let ddistance = Math.sqrt(Math.pow((tagData.cxy[1] - node.y), 2) +
            Math.pow((tagData.cxy[0] - node.x), 2));
            source = sLast == null || sLast >= sdistance ? node : source;
            sLast = sLast == null || sLast >= sdistance ? sdistance : sLast;
            destination = dLast == null || dLast >= ddistance ? node : destination;
            dLast = dLast == null || dLast >= ddistance ? ddistance : dLast;
        }
        const dijResults = this.dijkstraModelObject.run(this.graph, 1, source.id, destination.id);
        const shortestPath = this.dijkstraModelObject.getPath(dijResults.prev, dijResults.target);
        const path = [], duration = [100];
        for (let i in shortestPath) {
            if (parseInt(i) != 0 && parseInt(i) != (shortestPath.length-1)) {
                let data =  this.floorNodeInfo[tagData.flr]['nodes'][shortestPath[i]]
                movePoints[1] = [data['y'] * -100, data['x'] * 100];
                path.push([data['y'] * -100, data['x'] * 100]);
                duration.push(100);
            }
        }
        duration.push(100);
        tagData["sourceNode"] = shortestPath[shortestPath.length-2];
        let sourceNode = shortestPath[shortestPath.length-2];
        let algType = tagData.hasOwnProperty('alg') ? tagData['alg'] : null;
        if(this.reqType == 'porter'){
            if(path.length > 2){
                movePoints = path;
            }
            if(algType == 'RA-SP' && movePoints.length) {
                movePoints[movePoints.length-1] = [tagData.cxy[1] * -100, tagData.cxy[0] * 100]
            }
            // marker = this.grpTagPosition(iconData, tagData,movePoints, duration)
            marker = L.Marker.movingMarker(movePoints, duration, {autostart: true});
            marker.options.icon = L.icon(iconData);
            if(tagData.ttp == 'TAT-PO'){
                if(this.circleMarker != undefined){
                    this.allFloorMap[tagData.flr].removeLayer(this.circleMarker)
                }
                this.circleMarker = L.circle(movePoints[movePoints.length-1], {
                    className : 'porter-circleMarker',
                    radius: 300
                }).addTo(this.allFloorMap[tagData.flr]);
            }
        } 
        else{
            if(path.length > 2){
                movePoints = path;
            }
            if(algType == 'RA-SP' && movePoints.length) {
                movePoints[movePoints.length-1] = [tagData.cxy[1] * -100, tagData.cxy[0] * 100]
            }
            marker = L.Marker.movingMarker(movePoints, duration, {autostart: true});
            marker.options.icon = L.icon(iconData);
        }
        if(this.tagOptions.selectedTag != null && this.tagOptions.selectedTag.tid == tagData.tid){
            iconData['iconSize'] = [60, 60];
            iconData['iconAnchor'] = [30, 55];
            iconData['className'] = 'highlight-icon';
            marker.options.icon = L.icon(iconData);
            marker.setZIndexOffset(250);
            this.tagOptions.lastTag = marker;
            if(this.isNavigate){
                this.navigateHighlightedTag(tagData)
            }
        }
        if(this.tagMarkerList[tagData.flr][tagData.tid] != undefined){
            this.allOms[tagData.flr].removeMarker(this.tagMarkerList[tagData.flr][tagData.tid])
        }
        // this.markerCluster.clearLayers();
        // let lastSeen = this.datepipe.transform(tagData.etm , 'h:mm:ss a');
        // marker.bindPopup("<div style = 'height: 80px;width: 175px'><div style = 'height: 80%; width: 100%'><div style='height: 100%; width: 25%;float:left'><img style='height: 50px; padding: 8px 0px 0px 0px;' src=" +  '/assets/Icons/' + tagData.icon + '.svg' + "></div><div style= 'height: 100%; width: 75%;float: right'><div style='height: 26% ;width:100%; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; text-align: center; font-size: 13px; padding-top: 3px; font-weight:700; font-family:" + 'Open Sans' + "'>" + tagData.tan.toUpperCase() + "</div><div style='height: 26%; padding-top: 2px; font-size: 13px; text-align: center; font-weight: 200; font-family:" +'Open Sans'+"'>" + tagData.tid + "</div><div style='height: 26%;font-weight: 200; font-size: 12px; text-align: center;text-overflow: ellipsis; overflow: hidden; white-space: nowrap; padding-top:2px; font-family:" +'Open Sans'+ "'>" + tagData.lnm + ', '+ tagData.fln + "</div></div></div><div style = 'height: 20%; width: 100%; text-align: center; font-family:" +'Open Sans'+ "'> Last Seen : "+ lastSeen +"</div></div>")
        marker.on('click', this.showTagPop.bind(this, tagData));
        marker.on('mouseover', this.getMarkerNearMarker.bind(this, tagData));
        marker.tagId = tagData.tid;
        this.tagMarkerList[tagData.flr][tagData.tid] = marker;
        this.allOms[tagData.flr].addMarker(marker)
        // for(let i in this.tagMarkerList[this.floorId.value]){
        //     // this.tagMarkerList[this.floorId.value][i].addTo(this.markerCluster)
        //     this.markerCluster.addLayer(this.tagMarkerList[this.floorId.value][i])
        // }
        if(this.lastFilter == tagData.ttp){
            this.allFloorMap[tagData.flr].addLayer(marker)
        } else if(this.lastFilter == null){
            this.allFloorMap[tagData.flr].addLayer(marker)
        }
        this.getCountPopup(marker, tagData);
        return sourceNode;
    }
    getCountPopup(marker, tagData){
        let flr = tagData.flr
        let filteredTags = this.navigationData[this.facilityId].filter(val => val.flr == flr)
        let floorMapTags = this.tagMarkerList[flr]
        if(this.selectedTagFilters.length) {
            filteredTags = this.navigationData[this.facilityId].filter(val => this.selectedTagFilters.includes(val.ttp) && val.flr == flr)
            let selectedTags = filteredTags.map(val => val.tid);
            floorMapTags = Object.keys(floorMapTags)
                .filter(key => selectedTags.includes(key))
                .reduce((acc, key) => {
                    acc[key] = floorMapTags[key];
                    return acc;
            }, {});
        }
        if(!this.allClusterPopup.hasOwnProperty(flr)) {
            this.allClusterPopup[flr] = [];
        }
        let pSq = this.clusterRadius * this.clusterRadius
        let nearByMarker = [];
        let nearByClust = [];
        let markerPt = this.allFloorMap[flr].latLngToLayerPoint(marker._latlngs[1])
        nearByClust = this.allClusterPopup[flr].filter(res => this.ptReturnSq(this.allFloorMap[flr].latLngToLayerPoint(res.getLatLng()), markerPt) < pSq)
        if(this.allClusterPopup[flr].length && nearByClust.length){
                let markerListArray = Object.keys(floorMapTags).map(key => floorMapTags[key]);
                nearByMarker = markerListArray.filter(res => this.ptReturnSq(this.allFloorMap[flr].latLngToLayerPoint(res._latlngs[1]), markerPt) < pSq);
                nearByClust[0].setContent("<div style='width:32px; height:32px; border-radius:15px; background-color: rgba(110, 204, 57, 0.6); display:flex; flex-direction:row; align-items:center; justify-content:center;font-size:12px; font-weight:600; font-family:" + 'Open Sans' + "'>" + nearByMarker.length + "</div>")
        } else{
                let markerListArray = Object.keys(floorMapTags).map(key => floorMapTags[key]);
                nearByMarker = markerListArray.filter(res => this.ptReturnSq(this.allFloorMap[flr].latLngToLayerPoint(res._latlngs[1]), markerPt) < pSq)
                if(nearByMarker.length > 1){
                    this.allClusterPopup[flr].push(L.tooltip({permanent: true, direction: 'center', opacity: 0.9, className: "clusterPopup"})
                    .setLatLng(marker._latlngs[1]) 
                    .setContent("<div style='width:32px; height:32px; border-radius:15px; background-color: rgba(110, 204, 57, 0.6); display:flex; flex-direction:row; align-items:center; justify-content:center;font-size:12px; font-weight:600; font-family:" + 'Open Sans' + "'>" + nearByMarker.length + "</div>"))
                    if(this.isAddLayerAll[flr]){
                        this.allClusterPopup[flr][this.allClusterPopup[flr].length-1].addTo(this.allFloorMap[flr])
                    }
                }
            }
            for(let i in this.allClusterPopup[flr]){
                let markerPt =this.allFloorMap[flr].latLngToLayerPoint(this.allClusterPopup[flr][i].getLatLng());
                let markerListArray = Object.keys(floorMapTags).map(key => floorMapTags[key]);
                nearByMarker = markerListArray.filter(res => this.ptReturnSq(this.allFloorMap[flr].latLngToLayerPoint(res._latlngs[1]), markerPt) < pSq);
                this.allFloorMap[flr].removeLayer(this.allClusterPopup[flr][i])
                this.allClusterPopup[flr][i].setContent("<div style='width:32px; height:32px; border-radius:15px; background-color: rgba(110, 204, 57, 0.6); display:flex; flex-direction:row; align-items:center; justify-content:center;font-size:12px; font-weight:600; font-family:" + 'Open Sans' + "'>" + nearByMarker.length + "</div>")
                if(nearByMarker.length > 1){
                this.allFloorMap[flr].addLayer(this.allClusterPopup[flr][i])
                }
            }
    }
    // Shows a scrollable list (icon + name + id) of every tag in a large overlapping cluster,
    // as a map popup anchored at the cluster location - used instead of spreading the icons
    // out when a cluster has clusterListThreshold or more tags. Reuses the current
    // navigationData entry per tag (via navFindIndex) rather than the marker's tagData at
    // creation time, so the list reflects each tag's latest known name/icon.
    showClusterTagList(markers, floorid){
        let tagList = markers.map(m => {
            let idx = this.navFindIndex(this.facilityId, m.tagId);
            return idx !== -1 ? this.navigationData[this.facilityId][idx] : null;
        }).filter(res => res != null);
        if(!tagList.length){
            return;
        }
        let rows = tagList.map(tag => {
            let tan = tag.tan ? tag.tan : '';
            return "<div class='cluster-tag-list-row' data-tid='" + tag.tid + "' style='padding:4px 6px;display:flex;align-items:center;border-bottom:1px solid #ededed;cursor:pointer;'>" +
                "<img src='/assets/Floorplan/" + tag.icon + ".svg' style='width:25px;height:30px;margin-right:6px;flex-shrink:0;'>" +
                "<div style='overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-family:" + 'Open Sans' + ";'>" +
                tan + " <span style='font-size:11px;color:#888;'>(" + tag.tid + ")</span></div>" +
                "</div>";
        }).join('');
        let popup = L.popup({maxHeight: 300, className: 'cluster-tag-list-popup'})
            .setLatLng(markers[0].getLatLng())
            .setContent("<div style='width:220px;'>" +
                "<div class='cluster-tag-list-header' style='font-weight:600;font-size:13px;padding:4px 6px;border-bottom:1px solid #ccc;font-family:" + 'Open Sans' + ";'>" +
                tagList.length + " tags</div>" +
                "<div style='padding:4px 6px;border-bottom:1px solid #ccc;'>" +
                "<input class='cluster-tag-search-input' type='text' placeholder='Search tag or name' style='width:100%;box-sizing:border-box;padding:3px 5px;font-size:12px;border:1px solid #ccc;border-radius:3px;'>" +
                "</div>" +
                "<div class='cluster-tag-list-body' style='max-height:220px;overflow-y:auto;'>" + rows + "</div></div>")
            .openOn(this.allFloorMap[floorid]);
        setTimeout(() => {
            let container = popup.getElement();
            if(!container){
                return;
            }
            let header = container.querySelector('.cluster-tag-list-header');
            let rowEls = container.querySelectorAll('.cluster-tag-list-row');
            rowEls.forEach((rowEl: HTMLElement) => {
                rowEl.addEventListener('click', () => {
                    let tag = tagList.find(res => String(res.tid) === rowEl.getAttribute('data-tid'));
                    if(tag){
                        this.highlightTag(tag);
                        this.allFloorMap[floorid].closePopup(popup);
                    }
                });
            });
            let searchInput = container.querySelector('.cluster-tag-search-input') as HTMLInputElement;
            searchInput?.addEventListener('input', () => {
                let query = searchInput.value.trim().toLowerCase();
                let visibleCount = 0;
                rowEls.forEach((rowEl: HTMLElement) => {
                    let tag = tagList.find(res => String(res.tid) === rowEl.getAttribute('data-tid'));
                    let tan = tag && tag.tan ? tag.tan.toLowerCase() : '';
                    let tid = tag ? String(tag.tid).toLowerCase() : '';
                    let isMatch = !query || tan.includes(query) || tid.includes(query);
                    rowEl.style.display = isMatch ? 'flex' : 'none';
                    if(isMatch){
                        visibleCount++;
                    }
                });
                if(header){
                    header.textContent = visibleCount + ' of ' + tagList.length + ' tags';
                }
            });
        }, 100);
    }
    getMarkerNearMarker(tagData, markerLayer){
        if(!this.allSpiderfiedMarkers.hasOwnProperty(tagData.flr)) {
            this.allSpiderfiedMarkers[tagData.flr] = []
        }
        if(this.allSpiderfiedMarkers[tagData.flr].find(res => res == markerLayer.target) == undefined){
        let pSq = this.clusterRadius * this.clusterRadius
        let nearByMarker = [];
        let notNearByMarker = [];
        let markerPt = this.allFloorMap[tagData.flr].latLngToLayerPoint(markerLayer.latlng)
        let markerListArray = Object.keys(this.tagMarkerList[tagData.flr]).map(key => this.tagMarkerList[tagData.flr][key]);
        nearByMarker = markerListArray.filter(res => this.ptReturnSq(this.allFloorMap[tagData.flr].latLngToLayerPoint(res.getLatLng()), markerPt) < pSq)
        if(nearByMarker.length > 1){
            this.isSpiderfyAll[tagData.flr] = false;
            this.allOms[tagData.flr].spiderfied = false;
        } else{
            this.isSpiderfyAll[tagData.flr] = true;
        }
        }else{
            this.allOms[tagData.flr].spiderfied = true;
        }
    }
    ptReturnSq(pt1,pt2){
        let dx, dy;
        dx = pt1.x - pt2.x;
        dy = pt1.y - pt2.y;
        return dx * dx + dy * dy;
    }
    showTagPop(tagData, popLayer){
        if((this.allOms[tagData.flr].spiderfied != undefined && this.allOms[tagData.flr].spiderfied == true) || this.isSpiderfyAll[tagData.flr]){
        // let popup = popLayer.target.getPopup();
            if(tagData.ttp == 'TAT-IN' || tagData.ttp == 'TAT-PA') {
                if(this.entityDetail.hasOwnProperty(tagData.ttp+'_'+tagData.tvl)) {
                    this.getPopupContent(tagData, popLayer)
                } else {
                    this.commonService.getEntityDetail(tagData.ttp, tagData.tvl, tagData.tid).subscribe(res => {
                        if(res.statusCode == 1) {
                            this.entityDetail[tagData.ttp+'_'+tagData.tvl] = res.results[0]
                            this.getPopupContent(tagData, popLayer)
                        } else {
                            this.getPopupContent
                        }
                    })
                }
            } else {
                this.getPopupContent(tagData,popLayer)
            }                
        }
    }
    getPopupContent(tagData, popLayer) {
        let popup = L.popup()
        popup.setLatLng(popLayer.latlng)
        let updateTag = this.navigationData[this.facilityId].filter(res => res.tid == tagData.id)
        let dateDiv;
        if(this.datepipe.transform(tagData.ctm, 'dd') < this.datepipe.transform((new Date()).getTime(), 'dd')){
            let lastSeen = this.datepipe.transform(tagData.ctm , 'h:mm:ss a');
            let lastDate = this.datepipe.transform(tagData.ctm , 'dd-MM-yyyy');
            dateDiv = "<div><div style = 'height: 10%; width: 100%; text-align: center; font-family:" +'Open Sans'+ "'> Last Seen : "+ lastSeen +"</div><div style = 'height: 10%; width: 100%; text-align: center; font-family:" +'Open Sans'+ "'> Date : " + lastDate + "</div></div>"
        } else{
            let lastSeen = this.datepipe.transform(tagData.ctm , 'h:mm:ss a');
            dateDiv = "<div style='display: block; width: 100%; text-align: center; padding-top : 5px'><span style = 'height: 20%; font-family:" +'Open Sans'+ "'> Last Seen : </span><span style = 'height: 20%; font-family:" +'Open Sans'+ "'>"+ lastSeen + "</span></span>"
        }
        let porterMobileNo = tagData.ttp == 'TAT-PO' && this.porters.hasOwnProperty(tagData.tvl) && this.porters[tagData.tvl]["phoneNumber"] ? "<div style='text-align: center; width: 180px;font-size: 11px; font-weight : 600;'><a style='text-decoration: none;' href='tel:" + this.porters[tagData.tvl]["phoneNumber"] + "'>📞 " + this.porters[tagData.tvl]["phoneNumber"] + " </a></div>" : '';
        let poolLocation = tagData.ttp == 'TAT-PO' && this.porters.hasOwnProperty(tagData.tvl) && this.porters[tagData.tvl]["poolNameLocation"] ? "</div>"+ "<div style='text-align: center; color: #ff8e15; width: 180px;font-size: 11px;'>(" + this.porters[tagData.tvl]["poolNameLocation"] + ")</div>" : '';
        let uhid = this.entityDetail.hasOwnProperty(tagData.ttp+'_'+tagData.tvl) && this.entityDetail[tagData.ttp+'_'+tagData.tvl]['mainidentifier'] ? 
        "<div style='font-size: 11px; font-weight : 600; text-align: center; font-family:" +'Open Sans'+"'>(" + this.entityDetail[tagData.ttp+'_'+tagData.tvl]['mainidentifier'] + ")</div>" : '';
        tagData.icon = this.truckEnable ? 'TAT-TR': tagData.icon;
        tagData.tan = tagData.tan ? tagData.tan : '';
        let asi = tagData.asi ? '(' + tagData.asi + ')' : '';
        let tagActionsDiv = this.activate_btn && this.activate_btn.includes('BT_FPTD') ? "<div style='text-align: center; margin-top: 5px;'> <button style='float:left; background: #1e8fc8; color: #fff; font-size: 12px; cursor: pointer;' id='tagDetail-${tagData.asi}'>View Details</button> <button style='float:right; background: #1e8fc8; color: #fff; font-size: 12px; cursor: pointer;' id='showInfo-${tagData.asi}'>Show Data</button> </div>" : "";
        let tagDetailDiv = "<div style='height: auto; max-height : 35px; width:100%; overflow: hidden; white-space: pre-wrap;  text-align: center; font-size: 13px; padding-top: 3px; font-weight:700; font-family:" + 'Open Sans' + "'>" + tagData.tan.toUpperCase() + "</div><div style='height: 22%; padding-top: 5px; font-size: 13px; text-align: center; font-weight: 600; font-family:" +'Open Sans'+"'>" + tagData.tid + "</div>"
        tagDetailDiv = tagDetailDiv + uhid;
        if(asi != '') {
            tagDetailDiv = tagDetailDiv + "<div style='height: 22%; font-size: 13px; text-align: center; font-weight: 700; font-family:" +'Open Sans'+"'>" + asi + "</div>";
        }
        // popup.setContent("<div style = 'height: 120px;width: 175px'><div style = 'height: 75%; width: 100%'><div style='height: 100%; width: 5%;float:left'><img style='height: 37px; padding: 10px 0px 0px 0px;' src=" +  '/assets/Floorplan/' + tagData.icon + '.svg' + "></div><div style= 'height: 100%; width: 95%;float: right'>" + tagDetailDiv + "<div style='height: 26%;font-weight: 600; font-size: 12px; text-align: left;text-overflow: ellipsis; overflow: hidden; white-space: nowrap;padding-top:2px; font-family:" +'Open Sans'+ "'>" + tagData.lnm + ', '+ tagData.fln + "</div></div></div>" + dateDiv + poolLocation + "</div>")
        // .openOn(this.allFloorMap[tagData.flr])
        let tagContentHeight = this.entityDetail[tagData.ttp+'_'+tagData.tvl] ? '75%' : '65%';
        popup.setContent(`<div style="height: 145px; width: 175px; overflow -x : hidden"><div style="height: ${tagContentHeight}; width: 100%;"><div style="height: 100%; width: 5%; float: left;display:flex;align-items-center"><img style="height: 35px; padding: 20px 0px 0px 0px;" src="/assets/Floorplan/${tagData.icon}.svg"></div><div style="height: 100%; width: 95%; float: right;">${tagDetailDiv}<div style="height: 26%; font-weight: 600; font-size: 12px; text-align: left; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; padding-top: 5px; font-family: 'Open Sans';">${tagData.lnm}, ${tagData.fln}</div></div></div>${porterMobileNo}${dateDiv}${poolLocation} 
            ${tagActionsDiv}
            
            </div>`)
        .openOn(this.allFloorMap[tagData.flr]);
        setTimeout(() => {
            const viewDetailBtn = document.getElementById(`tagDetail-${tagData.asi}`);
            viewDetailBtn?.addEventListener('click', () => this.eventBind(tagData));
        
            // const showHistoryBtn = document.getElementById(`showHistory-${tagData.asi}`);
            // showHistoryBtn?.addEventListener('click', () => this.showHistory(tagData));
        }, 100);
    }
    eventBind(data) {
        if(data.ttp== 'TAT-AS'){
        this.configurationServices.getAllAsset(data.tvl).subscribe(res=>{
            let rowData = res.results[0];
            const dialogRef = this.dialog.open(CreateAssetComponent, {
                data: rowData,
                panelClass: ['large-popup'],
                disableClose: true,
              });
        });
        }else if (data.ttp == 'TAT-IN'){
            this.workflowService.getAllMother('',data.tan).subscribe(res => {
            let infantData =res.results.filter(response=>response.id === data.tvl)[0];
            const dialogRef = this.dialog.open(EnrollInfantComponent, {
                data: infantData,
                panelClass: ['large-popup'], disableClose: true
              });
            });  
        }else if (data.ttp == 'TAT-US'|| data.ttp == 'TAT-STD' || data.ttp =='TAT-STF'){
            this.commonService.getUserLocationById(data.tvl).subscribe(res => {
             let rowData = res.results;
             rowData['type'] =  data.ttp == 'TAT-STD' ?'student': data.ttp =='TAT-STF' ? 'staff' :'';
             let panelClass =  (data.ttp == 'TAT-STD'|| data.ttp == 'TAT-STF')? 'medium-popup':'small-popup'
            const dialogRef = this.dialog.open(CreateUserComponent,
                {data : rowData, panelClass:[panelClass], disableClose: true });
            });

        }
    }
    

    showHistory(tagDetail){
        console.log(tagDetail)
    }
    showDeviceInfo(dataId, marker, popLayer ) {
        let data = ""
        let arrayData = ["DVIT-WLV", "DVIT-FR", "DVIT-RH", "DVIT-RT", "DVIT-TDS", "DVIT-WT", "DVIT-WLE"]
        // arrayData = ["DVIT-WLV", "DVIT-FR", "DVIT-WT", "DVIT-WLE"]
        // arrayData = ["DVIT-WLE"]
        for(let i=0; i < arrayData.length; i++) {
            let deviceIcon = "<img style='height: 23px; width:23px;margin-top:5px;' alt = '' src=" +  '/assets/Floorplan/' + arrayData[i] + '.svg' + ">";
            data = data + "<div style='display: inline-block;width:35px;height:35px;float:left;margin: 2px 2px 50px 5px;background:white;border-radius:25px;'>" + deviceIcon + "</div>";
        }
        marker.bindTooltip("<div style="+ 'background:#e1e1e1;margin-top:100px;border-radius:5px;min-height:50px;padding-top:10px;border-radius:25px;width:'+ arrayData.length*45 + 'px;' + ">"+
        data+"</div>", { permanent: false, direction: "center", className: "leaf1-device-sensor" }).openTooltip();
    }
    bindTag(tagData, suppressRecompute: boolean = false) {
        tagData['status'] = ' ';
        if(!this.tagMarkerList[tagData.flr]){
            this.tagMarkerList[tagData.flr] = {}
        }
        if(!this.navigationHeatData[tagData.flr]){
            this.navigationHeatData[tagData.flr] = []
        }
        let currentDate = new Date().toISOString().slice(0, 10)
        if(tagData.ttp != '' && tagData.tvl != '' && tagData.edt == currentDate) {
        if((tagData.flr == this.floorId.value || this.blockView.active)) {
            let checkporter = this.availablePorterList.filter(val => val.tagId == tagData.tid && val.tagAssociationTypeId == tagData.ttp && val.id == parseInt(tagData.tvl));
            let checkwheelchiar = this.requestBooking.filter(val => val.tagId == tagData.tid && val.tagAssociationTypeId == "TAT-AS" && val.entityId == parseInt(tagData.tvl));
            if(tagData.ttp == 'TAT-CO' || tagData.ttp == 'TT-CO') {
                tagData.ttp = 'TAT-PA'
            }
            if (checkporter.length) {
                tagData['status'] = 'Available';
                tagData.icon = 'TAT-PO-IA'
            }
            if(this.navType == 'disassociated' || tagData.ttp == null) {
                tagData.ttp = 'TAT-DAT';
            }
            // if(tagData.ttp == 'TAT-AS' && tagData.sat == 'AT-MR') {
            //     tagData.ttp = 'TAT-MR'
            // }
            if(tagData.ttp == 'TAT-AS' && tagData.sat == 'AT-WH') {
                tagData.ttp = 'TAT-WH'
                tagData.icon = 'TAT-WH'
                if (checkwheelchiar.length) {
                    tagData['status'] = 'Available';
                    tagData.icon = 'TAT-WH-IA'
                }
            }
            if(tagData.ttp == 'TAT-US' && tagData.hasOwnProperty('ust')) {
                tagData.ttp = tagData.ust == 'UT_STUDENT' ? 'TAT-STD' : tagData.ust == 'UT_STAFF' ? 'TAT-STF' : 'TAT-US';
            }            
            tagData.ctm = tagData.ctm * 1000;
            tagData.etm = tagData.etm * 1000;
            if(!tagData.hasOwnProperty('icon')){
                tagData.icon = tagData.ttp;
            }
            let iconName =  this.truckEnable ? '/assets/Floorplan/TAT-TR.svg' :  '/assets/Floorplan/' + tagData.icon + '.svg';
            let currentTag = JSON.parse(JSON.stringify(tagData));
            // if ('old' in tagData) {
            //     iconName = '/assets/Icons/' + tagData.old + '.svg'
            // }
            let iconData = {iconUrl: iconName, iconSize: [50, 50], iconAnchor: [25, 45]};
            let index, point;
            let movePoints = [];
            index = this.navFindIndex(this.facilityId, tagData.tid);
            if(index !== -1 && this.navigationData[this.facilityId][index].flr != tagData.flr){
                index = -1;
            }
            if(this.navigationData[this.facilityId].length == 0 || index == -1 || index == 'undefined') {
                // tagData.cxy = this.getPointer(tagData);
                if(this.tabValue.find(val => val.type == tagData.ttp) == undefined && this.navType == 'location_nav'){
                    this.onTabChanged(tagData.ttp, 'newTab')
                }
                this.navPush(this.facilityId, currentTag);
                // console.log(this.navigationData[this.facilityId])
                this.wholeNavData.push(currentTag)
                this.navigationHeatData[tagData.flr].push(tagData);
                point = [tagData.cxy[1] * -100, tagData.cxy[0] * 100];
                movePoints = [point, point];
                this.mapFilter.heatData.push(point);
                // console.log('new Data', this.navigationData[this.facilityId])
                if(this.filterOptions.heatFilter == true){
                    this.getHeatmap('show',tagData)
                }
                // this.addMarker(iconData, tagData, movePoints)
                this.addMarkerOverlay(iconData, tagData, movePoints)
                // let flrList = Object.keys(this.navigationData);
                // for(let n=0; n < flrList.length; n++) {
                //     if(flrList[n] != this.floorId.value && this.navigationData[flrList[n]].length) {
                //         this.navigationData[flrList[n]] = this.navigationData[flrList[n]].filter(val =>val.tid != tagData.tid);
                //     }
                // }
            } 
            else {
                // console.log(this.navigationData)[this.facilityId]
                point = [this.navigationData[this.facilityId][index].cxy[1] * -100, this.navigationData[this.facilityId][index].cxy[0] * 100];
                if (this.navigationData[this.facilityId][index].lid == tagData.lid && this.navigationData[this.facilityId][index].cxy[1] == tagData.cxy[1] && this.navigationData[this.facilityId][index].cxy[0] == tagData.cxy[0]) {
                    let duration = tagData.ctm/1000 - this.navigationData[this.facilityId][index].ctm/1000;
                    if(duration == 0 || duration >= this.navConfig['lastSeen'] || this.navigationData[this.facilityId][index].icon != tagData.icon || this.navigationData[this.facilityId][index].tvl != tagData.tvl || this.navigationData[this.facilityId][index].ttp != tagData.ttp){
                        // let data = this.floorData[tagData.tid];
                        this.navigationData[this.facilityId][index] = tagData;
                        this.wholeNavData[index] = tagData;
                        if(this.tagMarkerList[tagData.flr][tagData.tid] != undefined){
                            // addMarkerOverlay() below replaces this marker entirely (new instance,
                            // re-registers with OMS, rebinds click/mouseover) - mutating this one first
                            // is discarded work, so only remove its layer to avoid a duplicate on the map.
                            this.allFloorMap[tagData.flr].removeLayer(this.tagMarkerList[tagData.flr][tagData.tid]);
                        }
                        movePoints = [point, [tagData.cxy[1] * -100, tagData.cxy[0] * 100]];
                        this.addMarkerOverlay(iconData, tagData, movePoints)
                    }
                    if(this.checkCtm[tagData.tid] == undefined){
                        this.checkCtm[tagData.tid] = {'ctm' : tagData['ctm']}
                    }else if(this.checkCtm[tagData.tid] != undefined){
                        let res = Math.abs(Math.floor(tagData.ctm/1000) - Math.floor(this.checkCtm[tagData.tid].ctm/1000));
                        if(res > this.navConfig['idleTime']){
                            if(this.tagMarkerList[tagData.flr][tagData.tid] != undefined){
                                let tag = this.tagMarkerList[tagData.flr][tagData.tid];
                                let iconChange = tag.options.icon
                                iconChange.options.iconUrl = this.truckEnable ? '/assets/Floorplan/TAT-TR.svg' : "/assets/Floorplan/"+ tagData.ttp + "-IDL.svg";
                                tag.setIcon(iconChange);
                            }
                            tagData.icon = tagData.ttp + "-IDL"
                            this.navigationData[this.facilityId][index] = tagData;
                        }
                    }
                    this.navigationData[this.facilityId][index]['etm'] = tagData['etm'];
                    this.navigationData[this.facilityId][index]['ctm'] = tagData['ctm'];  
                } else {
                    this.allFloorMap[tagData.flr].removeLayer(this.tagMarkerList[tagData.flr][tagData.tid]);
                    // console.log(distance)
                    // tagData.cxy = this.getPointer(tagData)
                    movePoints = [point, [tagData.cxy[1] * -100, tagData.cxy[0] * 100]];
                        // if(distance > 2 && distance < 6 && this.floorNodeInfo[this.floorId.value] != undefined && this.floorNodeInfo[this.floorId.value].node.length){
                        //     this.addMarkerOnPath(iconData, tagData, movePoints, index)
                        //     this.addMarkerOnPathOverlay(iconData, tagData, movePoints, index)
                        // } else{
                        //     this.addMarker(iconData, tagData, movePoints)
                        //     this.addMarkerOverlay(iconData, tagData, movePoints)
                        // }
                        if(this.navType == 'location_nav' && this.floorNodeInfo[tagData.flr] != undefined && this.floorNodeInfo[tagData.flr].node.length){
                            let locNode = this.floorNodeInfo[tagData.flr].node.filter(res => res.location_id == tagData.lid)
                            const distance = Math.sqrt( Math.pow((this.navigationData[this.facilityId][index].cxy[1] - tagData.cxy[1]), 2) + Math.pow((this.navigationData[this.facilityId][index].cxy[0] - tagData.cxy[0]), 2));                    
                            if(locNode.length && distance >= this.navConfig['distance']['min'] && distance <= this.navConfig['distance']['max']){
                                // let sourceNode = this.addMarkerOnPath(iconData, tagData, movePoints, index)
                                let sourceNode = this.addMarkerOnPathOverlay(iconData, tagData, movePoints, index)
                                this.navigationData[this.facilityId][index] = currentTag; 
                                this.navigationData[this.facilityId][index]["sourceNode"] = sourceNode
                            } else{
                                // this.addMarker(iconData, tagData, movePoints)
                                this.addMarkerOverlay(iconData, tagData, movePoints)
                                this.navigationData[this.facilityId][index] = currentTag; 
                            }
                        } else{
                            // this.addMarker(iconData, tagData, movePoints)
                            this.addMarkerOverlay(iconData, tagData, movePoints)
                            this.navigationData[this.facilityId][index] = currentTag; 
                        }
                    this.mapFilter.heatData.push(point);
                    if(this.filterOptions.heatFilter == true){
                            this.getHeatmap('show', tagData)
                    }
                    if(this.checkCtm[tagData.tid] != undefined){
                        delete this.checkCtm[tagData.tid]
                    }
                    // if(this.pointXY.length){
                    //     this.highlightPath(movePoints);
                    // }
                    this.wholeNavData[index] = currentTag;
                    // console.log('same data', this.navigationData[this.facilityId])
                    this.navigationHeatData[tagData.flr][index] = tagData;
                }
            }            
            if(!suppressRecompute){
                this.refreshTagVisibility();
            }
        }
        } else {
            if(tagData.edt != currentDate) {
                // console.log(tagData)
            }
        }
    }
    // getPointer( tagData ){
    //     let res = tagData.cxy;
    //     let filter = this.navigationData[this.facilityId].filter(val => val.cxy[0] == tagData.cxy[0] && val.cxy[1] == tagData.cxy[1]);
    //     // console.log(tagData.cxy)
    //     if(filter && filter.length == 1){
    //         res = [tagData.cxy[0]-0.5, tagData.cxy[1]];
    //     } else if(filter.length > 1){
    //         if(filter.length % 2 == 0){
    //             let num = filter.length / 2;
    //             if(num % 2 == 0){
    //                 res = [tagData.cxy[0]-(num*0.15), tagData.cxy[1]];
    //             } else if(num % 2 != 0){
    //                 res = [tagData.cxy[0]+(num*0.15), tagData.cxy[1]];
    //             }
    //             // console.log(res)
    //         } else if(filter.length % 2 != 0){
    //             let num = filter.length / 2;
    //             let integr = Math.floor(num)
    //             if(integr % 2 == 0){
    //                 res = [tagData.cxy[0], tagData.cxy[1]+(num*0.1)];
    //             } else if(integr % 2 != 0){
    //                 res = [tagData.cxy[0], tagData.cxy[1]-(num*0.1)];
    //             }
    //             // console.log(res)
    //         }
    //     }
    //     this.floorData[tagData.tid] = res;
    //     return res;
    // }
    // highlightPath(movePoint){
    //     if(this.maps.highlight_path){
    //             this.floorMap.removeLayer(this.maps.highlight_path);
    //             this.maps.highlight_path ={};
    //     }
    //     let index = this.pointXY.findIndex(val => (val[0] == movePoint[1][0]) && (val[1] == movePoint[1][1]))
    //     let showPath = [];
    //     for(let i =0; i <= index; i++){
    //         showPath.push(this.pointXY[i])
    //     }
    //     const pathHighlight = new L.Polyline(showPath, { className: "leaf-path-highlight" });
    //     pathHighlight.addTo(this.floorMap)
    //     this.maps["highlight_path"] = pathHighlight;
    // }
    // grpTagPosition(iconData, tagData,movePoints,duration){
    //     let marker;
    //     let tagXY;
    //     let filterTag = this.navigationData[this.facilityId].filter(res => res.flr == this.floorId.value && res.tid != tagData.tid);
    //     let grpIcon = {iconUrl: '/assets/Floorplan/TAT-VS.svg', iconSize: [50, 50], iconAnchor: [25, 45]};
    //     if(filterTag.length){
    //         if(tagData.sourceNode != undefined){
    //             tagXY = this.floorNodeInfo[this.floorId.value]['nodes'][tagData.sourceNode];
    //         } else if(tagData.sourceNode == undefined){
    //             tagXY = {'y': tagData.cxy[1], 'x': tagData.cxy[0]}
    //         }
    //         for(let i=0; i < filterTag.length; i++){
    //             let filterTagXY;
    //                 if(filterTag[i].sourceNode != undefined){
    //                     filterTagXY = this.floorNodeInfo[this.floorId.value]['nodes'][filterTag[i].sourceNode]
    //                 } else if(filterTag[i].sourceNode == undefined){
    //                     filterTagXY = {'y': filterTag[i].cxy[1], 'x': filterTag[i].cxy[0]}
    //                 }
    //                 const distance = Math.sqrt(Math.pow((filterTagXY['y'] - tagXY['y']), 2) + Math.pow((filterTagXY['x'] - tagXY['x']), 2));
    //                 if(distance < 3){
    //                     let points = [tagXY['y'] * -100, tagXY['x'] * 100]
    //                     movePoints[movePoints.length-1] = points;
    //                     marker = this.getGrpMarker(grpIcon, movePoints,duration,filterTag[i],'remove')
    //                 }else{
    //                     marker = this.getGrpMarker(iconData, movePoints,duration,filterTag[i],'add')
    //                 }
    //         }
    //     } else{
    //         marker = this.getGrpMarker(iconData, movePoints,duration,null,'new')
    //     }
    //     return marker;
    // }
    // getGrpMarker(iconData, movePoints,duration, tag, type){
    //     let marker;
    //     if(type == 'add'){
    //         marker = L.Marker.movingMarker(movePoints, duration, {autostart: true});
    //         marker.options.icon = L.icon(iconData);                
    //         let tagIcon = this.tagMarkerList[this.floorId.value][tag.tid].options.icon;
    //         tagIcon.options.iconUrl = '/assets/Floorplan/'+ tag.ttp + '.svg';
    //         this.tagMarkerList[this.floorId.value][tag.tid].setIcon(tagIcon)
    //         this.floorMap.addLayer(this.tagMarkerList[this.floorId.value][tag.tid])
    //     }else if(type == 'remove'){
    //         marker = L.Marker.movingMarker(movePoints, duration, {autostart: true});
    //         marker.options.icon = L.icon(iconData);
    //         this.floorMap.removeLayer(this.tagMarkerList[this.floorId.value][tag.tid])
    //     }else if(type == 'new'){
    //         marker = L.Marker.movingMarker(movePoints, duration, {autostart: true});
    //         marker.options.icon = L.icon(iconData);  
    //     }
    //     return marker;
    // }
    onTabChanged(event, type){
        this.tabData = [];            
        this.filterValue=null;
        this.applyFilter(null);        
        if(type == 'newTab'){
            if(event == 'TAT-PA'){
            this.tabValue.push({"name": 'Patient', "type": event})
            } else if(event == 'TAT-AS'){
                this.tabValue.push({"name": 'Asset', "type": event})
            } else if(event == 'TAT-WH'){
                this.tabValue.push({"name": 'Wheelchair', "type": event})
            } else if(event == 'TAT-IN'){
                this.tabValue.push({"name": 'Infant', "type": event})
            } else if(event == 'TAT-US'){
                this.tabValue.push({"name": 'User', "type": event})
            } else if(event == 'TAT-ST'){
                this.tabValue.push({"name": 'Staff', "type": event})
            } else if(event == 'TAT-EM'){
                this.tabValue.push({"name": 'Employee', "type": event})
            } else if(event == 'TAT-PO'){
                this.tabValue.push({"name": 'Porter', "type": event})
            } else if(event == 'TAT-MR'){
                this.tabValue.push({"name": 'MR File', "type": event})
            } else if(event == 'TAT-STF') {
                this.tabValue.push({"name": 'Staff', "type": event})
            } else if(event == 'TAT-STD') {
                this.tabValue.push({"name": 'Student', "type": event})
            } else if(event == 'TAT-DAT') {
                this.tabValue.push({"name": 'Disassociated', "type": event})
            }
            this.tabData = this.navigationData[this.facilityId].filter(val => val.ttp == this.tabValue[this.selectedIndex].type);
            if(!this.blockView.active) {
                this.tabData = this.navigationData[this.facilityId].filter(val => val.flr == this.floorId.value)
            }
            // this.tabData.sort((a, b) => a.tan.toLowerCase().localeCompare(b.tan.toLowerCase()))
        } else if( type == 'tabChange'){
            this.selectedIndex = event.index;
            if(this.tabValue.length > 0){
                if(!this.blockView.active) {
                    this.tabData = this.navigationData[this.facilityId].filter(val => val.flr == this.floorId.value && val.ttp == this.tabValue[this.selectedIndex].type)
                } else {
                    this.tabData = this.navigationData[this.facilityId].filter(val => val.ttp == this.tabValue[this.selectedIndex].type);
                }
            // this.tabData.sort((a, b) => a.tan.toLowerCase().localeCompare(b.tan.toLowerCase()))
            }
        }
    }
    getTagLayer(floor){
        let checkData = false
        if((this.navConfig.hasOwnProperty('floorRefresh') && this.navConfig['floorRefresh']) == false){
            let floorFilter = this.navigationData[this.facilityId].filter(val => val.flr == floor);
            if(floorFilter.length){
                checkData = true;
                for(let i = 0; i < floorFilter.length ; i++){
                    if(floorFilter[i].tid){
                    // let tagId = floorFilter[i].tid;
                    // this.floorMap.addLayer(this.tagMarkerList[floor][tagId])
                    let movePoints = [];
                    let point;
                    let iconName = this.tagMarkerList[floor][floorFilter[i].tid].options.icon.options.iconUrl;
                    let iconData = {iconUrl: iconName, iconSize: [50, 50], iconAnchor: [25, 45]};
                    point = [floorFilter[i].cxy[1] * -100, floorFilter[i].cxy[0] * 100];
                    movePoints = [point, point]
                    // this.addMarker(iconData, floorFilter[i], movePoints)
                    this.addMarkerOverlay(iconData, floorFilter[i], movePoints)
                    }
                    if(this.tabValue.find(val => val.type == floorFilter[i].ttp) == undefined){
                        this.onTabChanged(floorFilter[i].ttp, 'newTab')
                    }
                }
                // this.tabData = this.navigationData[this.floorId.value].filter(val => val.ttp == this.tabValue[this.selectedIndex].type);
                if(this.navigationData[this.facilityId].length > 0){
                    for(let i=0; i < Object.keys(this.isShowTag).length; i++){
                        let filterData = this.navigationData[this.facilityId].filter(res => res.flr == this.floorId.value && res.ttp == Object.keys(this.isShowTag)[i])
                        if(filterData.length > 0){
                        this.isShowTag[Object.keys(this.isShowTag)[i]] = true;
                        } else{
                            this.isShowTag[Object.keys(this.isShowTag)[i]] = false;
                        }
                    }
                }
            }
        }
        if(!checkData) {
            let param = '?cloc=' + 1+'&flr='+floor;
            if(this.reqType == 'globalSearch'){
                param = '?cloc=' + 1 + '&tid='+ this.tagId + '&ttype=' + this.tagType;
            }
            // console.log(param)
            if(this.pathData == null && this.navConfig.hasOwnProperty('tag') && this.navConfig['tag']['api']) {
                this.getCurrentNav(param);
                if(this.navConfig['tag'].hasOwnProperty('autoRefresh') &&  this.navConfig['tag']['autoRefresh'] ){
                    if(this.tagRefreshInterval) {
                        clearInterval(this.tagRefreshInterval);
                    }
                    let intervalTime = this.navConfig['tag']['intervalTime'] ? this.navConfig['tag']['intervalTime'] : 300;
                    this.tagRefreshInterval = setInterval(val => this.getCurrentNav(param), intervalTime * 1000);
                }
            } else {
                this.getCurrentTags()
            }
        }
    }
    getCurrentNav(param) {
        this.commonService.getReportData('totaltimebylocv2', param).subscribe(res => {
            if(res.results.statusCode == 200){
                const data = res.results.data.map((item: any) => {
                    if(item.comm_lost == '0') {
                        return { ...item, fromtime: (new Date().getTime() / 1000) - 60 };
                    }
                    return item;
                });
                this.getTagOnInit(data)
            }
        });
    }
    showTag(type){
        let floor = this.floorId.value;
        let tagDetails = [];
        tagDetails = this.navigationData[this.facilityId].filter(val => val.flr == this.floorId.value && val.ttp == type)
        if(tagDetails.length == 0){
            let currentFlr = this.navigationData[this.facilityId].filter(res => res.flr == this.floorId.value)
            for(let i = 0; i < currentFlr.length ; i++){
                let tagId = currentFlr[i].tid;
                this.allOms[floor].clearMarkers();
                this.allMarkerCluster[floor].clearLayers();
                this.allFloorMap[floor].removeLayer(this.tagMarkerList[floor][tagId]);
            }
        }
        if(type == this.lastFilter){
            let currentFlr = this.navigationData[this.facilityId].filter(res => res.flr == this.floorId.value)
            this.allMarkerCluster.clearLayers();
            for(let i = 0; i < currentFlr.length ; i++){
                let tagId = currentFlr[i].tid;
                if(this.tagMarkerList[floor][tagId] != undefined){
                    this.allOms[floor].removeMarker(this.tagMarkerList[floor][tagId])
                }
                this.allOms[floor].addMarker(this.tagMarkerList[floor][tagId])
                this.allMarkerCluster[floor].addLayer(this.tagMarkerList[floor][tagId])
                this.allFloorMap[floor].addLayer(this.allMarkerCluster[floor]);
            }
            if(this.filterOptions.heatFilter){
            this.getHeatmap('open', null);
            }
            this.lastFilter = null;
        } else {
            if(this.filterOptions.heatFilter){
            this.getHeatmap('open', null);
            }
            this.lastFilter = type;
            if(tagDetails && tagDetails.length > 0){
                let currentFlr = this.navigationData[this.facilityId].filter(res => res.flr == this.floorId.value)
                this.allMarkerCluster[floor].clearLayers();
                for(let i = 0; i < currentFlr.length ; i++){
                    let tagId = currentFlr[i].tid;
                    if(tagDetails.find(val => val.tid == tagId)){
                        if(this.tagMarkerList[floor][tagId] != undefined){
                            this.allOms[floor].removeMarker(this.tagMarkerList[floor][tagId])
                        }
                        this.allOms[floor].addMarker(this.tagMarkerList[floor][tagId])
                        this.allMarkerCluster[floor].addLayer(this.tagMarkerList[floor][tagId])
                        this.allFloorMap[floor].addLayer(this.allMarkerCluster[floor]);
                    } else{
                        this.allOms[floor].removeMarker(this.tagMarkerList[floor][tagId])
                        this.allFloorMap[floor].removeLayer(this.tagMarkerList[floor][tagId]);
                    }
                }
            }
        }
    }
    showTagOverlay(type){
        let floor = this.floorId.value;
        delete this.allSpiderfiedMarkers[floor];
        for(let i in this.allClusterPopup[floor]){
            this.allFloorMap[floor].removeLayer(this.allClusterPopup[floor][i])
        }
        this.isAddLayerAll[floor] = false;
        let tagDetails: any[] = [];
        if (this.navType == 'location_nav' && this.selectedDisassociateFilters.includes('TAT-DAT') && this.isShowTag['TAT-DAT'] == false ) {
            this.unsubscribeData('location_nav', 'disassociated');
        }
        if (this.navType == 'disassociated' && (!this.selectedDisassociateFilters.includes('TAT-DAT') || (this.selectedDisassociateFilters.includes('TAT-DAT') && this.isShowTag['TAT-DAT'] == true))
        ) {
            this.unsubscribeData('disassociated', 'location_nav');
        }
        tagDetails = this.navigationData[this.facilityId].filter(
            val => val.flr == this.floorId.value && this.selectedTagFilters.includes(val.ttp)
        );

        if (tagDetails.length == 0) {
            let currentFlr = this.navigationData[this.facilityId].filter(res => res.flr == this.floorId.value);
            for (let i = 0; i < currentFlr.length; i++) {
                let tagId = currentFlr[i].tid;
                this.allOms[floor].clearMarkers();
                this.allFloorMap[floor].removeLayer(this.tagMarkerList[floor][tagId]);
            }
        }
        const navigationFacilityId = this.navigationData[this.facilityId].map(x => x.ttp);
        if (this.selectedTagFilters.includes(this.lastFilter) && navigationFacilityId === this.lastFilter) {
            let currentFlr = this.navigationData[this.facilityId].filter(res => res.flr == this.floorId.value);
            for(let i = 0; i < currentFlr.length ; i++){
                let tagId = currentFlr[i].tid;
                if(this.tagMarkerList[floor][tagId] != undefined){
                    this.allOms[floor].removeMarker(this.tagMarkerList[floor][tagId])
                }
                if (!this.selectedTagFilters.includes(currentFlr[i].ttp)) {
                    this.allOms[floor].addMarker(this.tagMarkerList[floor][tagId]);
                    this.allFloorMap[floor].addLayer(this.tagMarkerList[floor][tagId]);
                    this.getCountPopup(this.tagMarkerList[floor][tagId], currentFlr[i])
                }
            }
            if(this.filterOptions.heatFilter){
            this.getHeatmap('open', null);
            }
            this.lastFilter = null;
        } else {
            if(this.filterOptions.heatFilter){
            this.getHeatmap('open', null);
            }
            this.lastFilter = this.selectedTagFilters.join(',');
            if(tagDetails && tagDetails.length > 0){
                let currentFlr = this.navigationData[this.facilityId].filter(res => res.flr == this.floorId.value)
                for(let i = 0; i < currentFlr.length ; i++){
                    let tagId = currentFlr[i].tid;
                    if(tagDetails.find(val => val.tid == tagId)){
                        if(this.tagMarkerList[floor][tagId] != undefined){
                            this.allOms[floor].removeMarker(this.tagMarkerList[floor][tagId])
                        }
                        this.allOms[floor].addMarker(this.tagMarkerList[floor][tagId])
                        this.allFloorMap[floor].addLayer(this.tagMarkerList[floor][tagId]);
                        this.getCountPopup(this.tagMarkerList[floor][tagId], currentFlr[i])
                    } else {
                        this.allOms[floor].removeMarker(this.tagMarkerList[floor][tagId])
                        this.allFloorMap[floor].removeLayer(this.tagMarkerList[floor][tagId]);
                    }
                }
            }
        }
    }
    highlightTag(tag){
        // let popLayer = { latlng : {lat : tag.cxy[1] * -100, lng : tag.cxy[0] * 100}}
        // this.showTagPop(tag, popLayer)
        if(this.tagOptions.lastTag != null){
            let iconSize = this.tagOptions.lastTag.options.icon;
            iconSize.options.iconSize = [50, 50];
            iconSize.options.className ='';
            this.tagOptions.lastTag.setIcon(iconSize);
            let iconAnchor = this.tagOptions.lastTag.options.icon;
            iconAnchor.options.iconAnchor = [25, 45];
            this.tagOptions.lastTag.setIcon(iconAnchor);
            this.tagOptions.lastTag.setZIndexOffset(0);
            this.getFilter('navigate', false);
        }
        if(this.tagOptions.selectedTag != null && tag.tid == this.tagOptions.selectedTag.tid){
            let floor = this.tagMarkerList[tag.flr][tag.tid];
            let iconSize =  floor.options.icon;
            iconSize.options.iconSize = [50, 50];
            floor.setIcon(iconSize);
            let iconAnchor =  floor.options.icon;
            iconSize.options.iconAnchor = [25, 45];
            iconSize.options.className ='';
            floor.setIcon(iconAnchor);
            floor.setZIndexOffset(250)
            this.tagOptions.selectedTag = null;
            this.getFilter('navigate', false);
        } else{
        this.tagOptions.selectedTag = tag;
        let floor = this.tagMarkerList[tag.flr][tag.tid];
        let iconSize =  floor.options.icon;
        iconSize.options.iconSize = [60, 60];
        floor.setIcon(iconSize);
        let iconAnchor =  floor.options.icon;
        iconSize.options.iconAnchor = [30, 55];
        iconSize.options.className = 'highlight-icon';
        floor.setIcon(iconAnchor);
        floor.setZIndexOffset(250)
        this.tagOptions.lastTag = floor;
        this.getFilter('navigate', true);
        }
        // if(this.reqType == null){
        //     this.commonService.getLocationSearch(tag.lnm).subscribe((res) => {
        //         let tagLocation = res.results;
        //         this.getLocationId(tagLocation[0], 'fromLoc', null);
        //     });
        // }
    }
    onSelectMonitorTag(tagData){
        if(this.reqType == 'porter'){
            if(tagData.tagId != null){
                let param = '/cloc=' + 1 + '&tid='+ tagData.tagId + '&ttype=' + tagData.tagAssociationTypeId;
                this.commonService.getReportData('totaltimebylocv2', param).subscribe(res => {
                    if(res.results.statusCode == 200){
                        let data = res.results.data[0];
                        // console.log(data)
                        let tagData = {
                            'fid' : data.facility_id,
                            'ctm' : data.fromtime,
                            'etm' : data.fromtime,
                            'edt' : data.event_dt,
                            'tid' : data.tagid,
                            'ttp' : data.tagtype,
                            'tvl' : data.tag_value,
                            'cxy' : [data['x'],data['y']],
                            'blk' : data.blockId,
                            'bln' : data.blockName,
                            'flr' : data.floor_id,
                            'lid' : data.location_id,
                            'lnm' : data.location_name,
                            'fln' : data.floorName,
                            'tan' : data.tagAssociatedName,
                            'sat' : data.assetType,
                            'ust' : data.userTypeId,
                            'asi' : data.identifier ? data.identifier : null,
                            'icon' : data.tagtype
                        };
                        if(tagData.flr != this.floorId.value) {
                            this.onFloorChange(tagData.flr)
                            // this.highlightTag(tagData);
                            // console.log(res.results);
                        }
                    } else {
                        let endDate = new Date(this.reqTagDetail.endTime)
                        let reqDate = this.datepipe.transform(endDate , 'yyyy-MM-dd');
                        let currentDate = new Date().toISOString().slice(0, 10)
                        if(reqDate == currentDate) {
                            this.onFloorChange(tagData.floorId)
                        }
                    }
                });
                // console.log(tagData)
                // let tag = {tid: tagData.tagId, lnm: tagData.locationName}
                // if(data.length) {
                //     if(data[0].flr == this.floorId.value){
                //         this.highlightTag(data[0]);
                //     } else if(data[0].flr != this.floorId.value){
                //         // this.onFloorChange(data[0].flr).then(res => this.highlightTag(tag))
                //         this.onFloorChange(data[0].flr)
                //         this.highlightTag(data[0])
                //     }
                // } else if(tagData.floorId != null) {
                //     let endDate = new Date(this.reqTagDetail.endTime)
                //     let reqDate = this.datepipe.transform(endDate , 'yyyy-MM-dd');
                //     let currentDate = new Date().toISOString().slice(0, 10)
                //     if(reqDate == currentDate) {
                //         this.onFloorChange(tagData.floorId)
                //     }
                // }
            }
        }
    }
    navigateHighlightedTag(tag){
        if(tag.flr == this.floorId.value){
            let xy = [tag.cxy[1] * -100, tag.cxy[0] * 100];
            this.allFloorMap[tag.flr].flyTo(xy, 0, {animate:true, duration:1}, 1000)
        }
    }
    setIdealIcons(){
        const epochNow = Math.floor((new Date().getTime())/1000);
        let tagDatas = this.navigationData[this.facilityId].filter(res => res.flr == this.floorId.value && !res.icon.includes('OLD') && Math.abs(epochNow - Math.floor(res.ctm/1000)) > 300)
        if(this.blockView.active) {
            tagDatas = this.navigationData[this.facilityId].filter(res => !res.icon.includes('OLD') && Math.abs(epochNow - Math.floor(res.ctm/1000)) > 300)
        }
        for(let i=0; i < tagDatas.length; i++){
           let tag = this.tagMarkerList[tagDatas[i].flr][tagDatas[i].tid];
            // if(tagDatas[i].ttp == 'TAT-AS' && tagDatas[i].sat == 'AT-MR') {
            //     tagDatas[i].ttp = 'TAT-MR'
            // }
            if(tagDatas[i].ttp == 'TAT-AS' && tagDatas[i].sat == 'AT-WH') {
                tagDatas[i].ttp = 'TAT-WH'
            }
            if(tagDatas[i].ttp == 'TAT-US' && tagDatas[i].hasOwnProperty('ust')) {
                tagDatas[i].ttp = tagDatas[i].ust == 'UT_STUDENT' ? 'TAT-STD' : tagDatas[i].ust == 'UT_STAFF' ? 'TAT-STF' : 'TAT-US'
            }                        
           let iconChange = tag.options.icon
           iconChange.options.iconUrl = this.truckEnable ? '/assets/Floorplan/TAT-TR.svg' : "/assets/Floorplan/"+ tagDatas[i].ttp + "-OLD.svg"
           tag.setIcon(iconChange);
           this.tagMarkerList[tagDatas[i].flr][tagDatas[i].tid].options.icon.options.iconUrl = this.truckEnable ? '/assets/Floorplan/TAT-TR.svg' : "/assets/Floorplan/"+ tagDatas[i].ttp + "-OLD.svg";
           let index = this.navigationData[this.facilityId].findIndex(val => val.flr == tagDatas[i].flr && val.tid == tagDatas[i].tid)
           this.navigationData[this.facilityId][index].icon = tagDatas[i].ttp + "-OLD";
        }
    }
    locMarking(data, floorId){
        // let lalan = [-388, 294.09999999999997];
        let lalan: any;
        lalan = data.getBounds().getCenter();
        let xy =[];
        xy.push(lalan.lat, lalan.lng)
        // console.log(xy)
        this.allFloorMap[floorId].flyTo(xy, 0, {animate:true, duration: 1});
    }
    getBedspacing(type){
        if(type == 'check'){
            this.mapFilter.bedSpacingDetails = [];
            this.commonService.getLocationWithBed(this.floorId.value).subscribe(val => {
                this.mapFilter.bedSpacingDetails = val.results.data;
            });
        } else if(type == 'show'){
        if(this.filterOptions.bedFilter == false){
            for (let i in this.mapFilter.bedSpacingDetails) {
                this.drawLocation(this.mapFilter.bedSpacingDetails[i], 'bed', this.floorId.value);
            }
            this.filterOptions.bedFilter = true;
        }
        else{
            for(let i = 0 ; this.maps.bed_space_images.length > i ; i++){
                this.allFloorMap[this.floorId.value].removeLayer(this.maps.bed_space_images[i]);
                this.allFloorMap[this.floorId.value].removeLayer(this.maps.bed_space_polygon[i]);
            }
            this.filterOptions.bedFilter = false;
        }
        }
    }
    getReadercoord(type, filter?){
        if(type == 'check'){
            // console.log(this.mapFilter.readerList)
            this.mapFilter.floorReaders = this.mapFilter.readerList.filter(res => res.floorId == this.floorId.value && res.readerTypeId != 'RT-POMS');
        } else if(type == 'show'){
        if(this.filterOptions.readerFilter == false){
        for (const reader in this.mapFilter.floorReaders) { 
            const value =  JSON.parse(this.mapFilter.floorReaders[reader].coordinate);
            if(value != null){
                const hwType = this.mapFilter.floorReaders[reader]['hardwareTypeId']
                const readerPoints = [value[1] * -100, value[0] * 100];
                let iconImage = new L.Icon({ iconUrl: '/assets/Floorplan/'+ hwType +'.svg', iconSize: [18, 18], iconAnchor: [7, 7]});
                if(filter && filter === 'dispenser') {
                    iconImage = new L.Icon({ iconUrl: './../../../../../../assets/Menus/hand-dispenser.svg', iconSize: [22, 22], iconAnchor: [12, 12]});
                }
                let readerPosition = L.marker(readerPoints, {icon: iconImage});
                readerPosition.on('click', this.showReaderPopup.bind(this, this.mapFilter.floorReaders[reader], "show", this.mapFilter.floorReaders[reader].id ));
                this.maps.reader_points.push(readerPosition);
                readerPosition.addTo(this.allFloorMap[this.floorId.value]);
                this.filterOptions.readerFilter =  true;
            }
        }  
        }
        else {
            for(let i = 0; this.maps.reader_points.length > i ; i++){
                this.allFloorMap[this.floorId.value].removeLayer(this.maps.reader_points[i]);
            }
            for(let i=0; i < this.mapFilter.floorReaders.length; i++){
                if(this.maps.reader_postion[this.mapFilter.floorReaders[i].id+"label"]){
                    this.allFloorMap[this.floorId.value].removeLayer(this.maps["reader_postion"][this.mapFilter.floorReaders[i].id+"label"]);
                    delete this.maps["reader_postion"][this.mapFilter.floorReaders[i].id+"label"]
                }
            }
            this.filterOptions.readerFilter = false;
            this.maps.reader_points = [];
        }
        }
    }
    getInjectorcoord(type){
        if(type == 'check'){
            this.mapFilter.floorInjectors = this.mapFilter.injectorList.filter(res => res.floorId == this.floorId.value);
        } else if(type == 'show'){
        if(this.filterOptions.readerFilter == true){
            const lanIcon = new L.Icon({ iconUrl: '/assets/icons/Lan.svg', iconSize: [18, 18], iconAnchor: [7, 7] });
            for (const injector of this.mapFilter.floorInjectors) {
                let value = null;
                try { value = JSON.parse(injector.coordinate); } catch (e) { value = null; }
                if(value != null){
                    const injectorPoint = [value[1] * -100, value[0] * 100];
                    const injectorMarker = L.marker(injectorPoint, {icon: lanIcon});
                    injectorMarker.on('click', this.toggleInjectorWires.bind(this, injector));
                    this.maps.injector_points.push(injectorMarker);
                    injectorMarker.addTo(this.allFloorMap[this.floorId.value]);
                }
            }
        }
        else {
            for(let i = 0; this.maps.injector_points.length > i ; i++){
                this.allFloorMap[this.floorId.value].removeLayer(this.maps.injector_points[i]);
            }
            this.maps.injector_points = [];
            for(const injectorId in this.maps.injector_wires){
                this.removeInjectorWires(injectorId);
            }
        }
        }
    }
    toggleInjectorWires(injector){
        if(this.maps.injector_wires[injector.id]){
            this.removeInjectorWires(injector.id);
            return;
        }
        let injectorValue = null;
        try { injectorValue = JSON.parse(injector.coordinate); } catch (e) { injectorValue = null; }
        if(injectorValue == null){ return; }
        const injectorPoint = [injectorValue[1] * -100, injectorValue[0] * 100];
        const wireColor = '#5b6ee1';
        const dot = (point) => L.circleMarker(point, {
            radius: 4, color: wireColor, weight: 2, fillColor: '#ffffff', fillOpacity: 1
        }).addTo(this.allFloorMap[this.floorId.value]);
        const lines = [];
        const dots = [dot(injectorPoint)];
        this.maps.injector_wires[injector.id] = { lines, dots, label: null };
        for (const link of (injector.injectorLinks || [])) {
            const reader = this.mapFilter.readerList.find(r => r.id === link.readerId);
            if(reader && reader.coordinate){
                let readerValue = null;
                try { readerValue = JSON.parse(reader.coordinate); } catch (e) { readerValue = null; }
                if(readerValue != null){
                    const readerPoint = [readerValue[1] * -100, readerValue[0] * 100];
                    const line = L.polyline([injectorPoint, readerPoint], {color: wireColor, weight: 2});
                    line.addTo(this.allFloorMap[this.floorId.value]);
                    lines.push(line);
                    this.animateInjectorWire(line, () => {
                        if(this.maps.injector_wires[injector.id]){
                            dots.push(dot(readerPoint));
                        }
                    });
                }
            }
        }
        const label = L.marker(injectorPoint, {
            icon: L.divIcon({
                html: "<div style='font-size: 10px;'>" + (injector.serialNumber || injector.ipAddress) + " <span style='font-size: 7px; padding-left: 7px;'>Hide</span></div>",
                className: 'reader-popup',
              })
          }).on('click', this.toggleInjectorWires.bind(this, injector));
        label.addTo(this.allFloorMap[this.floorId.value]);
        this.maps.injector_wires[injector.id].label = label;
    }
    animateInjectorWire(line, onComplete?: () => void){
        const path: any = (line as any).getElement ? (line as any).getElement() : null;
        if(!path || typeof path.getTotalLength !== 'function'){
            line.setStyle({ dashArray: '6,6', className: 'injector-wire-flow' });
            if(onComplete){ onComplete(); }
            return;
        }
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
        path.getBoundingClientRect();
        path.style.transition = 'stroke-dashoffset 0.6s ease-in-out';
        path.style.strokeDashoffset = '0';
        path.addEventListener('transitionend', () => {
            path.style.transition = '';
            path.style.strokeDasharray = '6,6';
            path.style.strokeDashoffset = '0';
            path.classList.add('injector-wire-flow');
            if(onComplete){ onComplete(); }
        }, { once: true });
    }
    removeInjectorWires(injectorId){
        const entry = this.maps.injector_wires[injectorId];
        if(!entry){ return; }
        for(const line of entry.lines){
            this.allFloorMap[this.floorId.value].removeLayer(line);
        }
        for(const dot of (entry.dots || [])){
            this.allFloorMap[this.floorId.value].removeLayer(dot);
        }
        if(entry.label){
            this.allFloorMap[this.floorId.value].removeLayer(entry.label);
        }
        delete this.maps.injector_wires[injectorId];
    }
    getDispensercoord(type){
        if(type == 'check'){
            this.mapFilter.floorDispenser = this.mapFilter.dispenserList.filter(res => res.floorId == this.floorId.value && res.readerTypeId != 'RT-POMS');
            this.updateDisabledStates()
        } else if(type == 'show'){
        if(this.filterOptions.dispenserFilter == false){
        for (const reader in this.mapFilter.floorDispenser) { 
            const value =  JSON.parse(this.mapFilter.floorDispenser[reader].coordinate);
            if(value != null){
                const hwType = this.mapFilter.floorDispenser[reader]['hardwareTypeId']
                const readerPoints = [value[1] * -100, value[0] * 100];
                let iconImage = new L.Icon({ iconUrl: '/assets/Floorplan/'+ hwType +'.svg', iconSize: [18, 18], iconAnchor: [7, 7]});
                iconImage = new L.Icon({ iconUrl: './../../../../../../assets/Menus/hand-dispenser.svg', iconSize: [22, 22], iconAnchor: [12, 12]});
                let readerPosition = L.marker(readerPoints, {icon: iconImage});
                readerPosition.on('click', this.showDispenserPopup.bind(this, this.mapFilter.floorDispenser[reader], "show", this.mapFilter.floorDispenser[reader].id ));
                this.maps.dispenser_points.push(readerPosition);
                readerPosition.addTo(this.allFloorMap[this.floorId.value]);
                this.filterOptions.dispenserFilter =  true;
            }
        }  
        }
        else {
            for(let i = 0; this.maps.dispenser_points.length > i ; i++){
                this.allFloorMap[this.floorId.value].removeLayer(this.maps.dispenser_points[i]);
            }
            for(let i=0; i < this.mapFilter.floorDispenser.length; i++){
                if(this.maps.dispenser_postion[this.mapFilter.floorDispenser[i].id+"label"]){
                    this.allFloorMap[this.floorId.value].removeLayer(this.maps["dispenser_postion"][this.mapFilter.dispenserList[i].id+"label"]);
                    delete this.maps["dispenser_postion"][this.mapFilter.floorDispenser[i].id+"label"]
                }
            }
            this.filterOptions.dispenserFilter = false;
            this.maps.dispenser_points = [];
        }
        }
    }
    loadCctvAssets(floorid: any) {
        this.mapFilter.floorCctvAssets = [];
        this.commonService.getConnectivityAssetsByFloor(floorid).subscribe(res => {
            this.mapFilter.floorCctvAssets = (res.results || []).filter((a: any) => a.assetTypeId === 'AT-CCTV');
            this.updateDisabledStates();
        });
    }

    getCctvcoord(type: string) {
        if (type !== 'show') { return; }
        if (this.filterOptions.cctvFilter === false) {
            for (const asset of this.mapFilter.floorCctvAssets) {
                try {
                    const coordObj = JSON.parse(asset.coordinates);
                    const firstCoordStr = coordObj.geometry.coordinates[0];
                    const coords = JSON.parse(firstCoordStr);
                    const cctvPoint: [number, number] = [coords[1] * -100, coords[0] * 100];
                    const iconImage = new L.Icon({
                        iconUrl: this.assetIconConfig['CCTV'],
                        iconSize: [22, 22],
                        iconAnchor: [11, 11]
                    });
                    const marker = L.marker(cctvPoint, { icon: iconImage });
                    marker.on('click', () => this.openCctvStream(asset));
                    this.maps.cctv_points.push(marker);
                    marker.addTo(this.allFloorMap[this.floorId.value]);
                } catch (e) {
                    // skip assets with invalid coordinates
                }
            }
            this.filterOptions.cctvFilter = true;
        } else {
            for (const marker of this.maps.cctv_points) {
                this.allFloorMap[this.floorId.value].removeLayer(marker);
            }
            this.maps.cctv_points = [];
            this.filterOptions.cctvFilter = false;
        }
    }

    openCctvStream(asset: any) {
        try {
            const outputData = JSON.parse(asset.outputDate);
            const streamUrl = outputData?.streamUrl;
            if (!streamUrl) {
                this.toastr.warning('Warning', 'Camera stream URL is not configured for this asset.');
                return;
            }
            this.dialog.open(NotificationCameraViewComponent, {
                width: '72vw',
                height: '90vh',
                data: {
                    cameras: [{
                        id: asset.id,
                        name: asset.name,
                        streamUrl,
                        playUrl: outputData?.playUrl,
                        streamName: outputData?.streamName || asset.name,
                        locationName: asset.locationName || ''
                    }],
                    locationName: asset.locationName || ''
                },
                disableClose: false
            });
        } catch (e) {
            this.toastr.error('Error', 'Failed to open camera stream.');
        }
    }

    showDispenserPopup(data, type, id,  val){
        const value =  JSON.parse(data.coordinate)
        const readerPoints = [value[1] * -100, value[0] * 100];  
        if (this.maps["dispenser_postion"][id+"label"]) {
            this.allFloorMap[this.floorId.value].removeLayer(this.maps["dispenser_postion"][id+"label"]);
            delete this.maps["dispenser_postion"][id+"label"];
        }
        if(type == 'show'){
        const readerPositionLabel = L.marker(readerPoints, {
            icon: L.divIcon({
                html: "<div style='font-size: 10px;'>" + data.readerName + " <span style='font-size: 7px; padding-left: 7px;'>Hide</span><br><span style='font-weight: 100;'>" + "" +"</span></div>",
                className: 'reader-popup',
              })
          }).on('click', this.showDispenserPopup.bind(this, data , "hide", data.id));
            this.maps["dispenser_postion"][data.id+"label"] = readerPositionLabel;
            readerPositionLabel.addTo(this.allFloorMap[this.floorId.value]);
        }
    }
    showReaderPopup(data, type, id,  val){
        const value =  JSON.parse(data.coordinate)
        const readerPoints = [value[1] * -100, value[0] * 100];  
        // console.log(readerPoints) 
        // this.floorMap.flyTo(readerPoints,1, {animate:true, duration: 2});
        if (this.maps["reader_postion"][id+"label"]) {
            this.allFloorMap[this.floorId.value].removeLayer(this.maps["reader_postion"][id+"label"]);
            delete this.maps["reader_postion"][id+"label"];
        }
        if(type == 'show'){
        const readerPositionLabel = L.marker(readerPoints, {
            icon: L.divIcon({
                html: "<div style='font-size: 10px;'>" + data.readerName + " <span style='font-size: 7px; padding-left: 7px;'>Hide</span><br><span style='font-weight: 100;'>" + data.hardwareTypeName +"</span></div>",
                className: 'reader-popup',
              })
          }).on('click', this.showReaderPopup.bind(this, data , "hide", data.id));
            this.maps["reader_postion"][data.id+"label"] = readerPositionLabel;
            readerPositionLabel.addTo(this.allFloorMap[this.floorId.value]);
        }
        // this.locMarking(); 
    }
    getSoundSensor(type){
        if(type == 'check'){
            this.mapFilter.floorSensors = this.mapFilter.readerList.filter(res => res.floorId == this.floorId.value && res.readerTypeId == 'RT-POMS');
        } else if(type == 'show'){
        if(this.filterOptions.sensorFilter == false){
            const createMaterialIcon = (iconName, iconSize = [30, 30], iconColor = 'black') => {
                return L.divIcon({
                    html: `<i class="material-icons" style="color:${iconColor};font-size: 22px;margin-top:15px;margin-left:5px">${iconName}</i>`,
                    className: 'material-icons-leaflet',
                    iconSize: iconSize,
                    iconAnchor: [iconSize[0] / 2, iconSize[1]], // Anchor the icon at its bottom-center
                    popupAnchor: [0, -iconSize[1]], // Position the popup above the icon
                });
            };
            this.commonService.getSensorDetails(this.floorId.value).subscribe(res => {
                const sensorDetails = res.results.reduce((acc, item) => {
                    acc[item.serialNo] = item;
                    return acc;
                }, {});
                for (const reader in this.mapFilter.floorSensors) { 
                    const value =  JSON.parse(this.mapFilter.floorSensors[reader].coordinate);
                    if(value != null){
                        const readerPoints = [value[1] * -100, value[0] * 100];
                        let rdrName = this.mapFilter.floorSensors[reader].readerName
                        let color = sensorDetails.hasOwnProperty(rdrName) ?  sensorDetails[rdrName]['status'] == 'Noisy' ? 'red' : sensorDetails[rdrName]['status'] == 'Speech' ? 'orange' : 'green' : 'grey';
                        let iconImage = createMaterialIcon('volume_up', [30, 30], color);
                        let readerPosition = L.marker(readerPoints, {icon: iconImage});
                        readerPosition.on('click', this.showSensorPopup.bind(this, this.mapFilter.floorSensors[reader], "show", this.mapFilter.floorSensors[reader].id ));
                        this.maps.sensor_points.push(readerPosition);
                        readerPosition.addTo(this.allFloorMap[this.floorId.value]);
                        this.filterOptions.sensorFilter =  true;
                    }
                }
            })
              
        }
        else {
            for(let i = 0; this.maps.sensor_points.length > i ; i++){
                this.allFloorMap[this.floorId.value].removeLayer(this.maps.sensor_points[i]);
            }
            for(let i=0; i < this.mapFilter.floorSensors.length; i++){
                if(this.maps.sensor_postion[this.mapFilter.floorSensors[i].id+"label"]){
                    this.allFloorMap[this.floorId.value].removeLayer(this.maps["sensor_postion"][this.mapFilter.floorSensors[i].id+"label"]);
                    delete this.maps["sensor_postion"][this.mapFilter.floorSensors[i].id+"label"]
                }
            }
            this.filterOptions.sensorFilter = false;
            this.maps.sensor_points = [];
        }
        }
    }
    showSensorPopup(data, type, id,  val){
        const value =  JSON.parse(data.coordinate)
        const readerPoints = [value[1] * -100, value[0] * 100];  
        if (this.maps["sensor_postion"][id+"label"]) {
            this.allFloorMap[this.floorId.value].removeLayer(this.maps["sensor_postion"][id+"label"]);
            delete this.maps["sensor_postion"][id+"label"];
        }
        if(type == 'show'){
        const readerPositionLabel = L.marker(readerPoints, {
            icon: L.divIcon({
                html: "<div style='font-size: 10px;'>" + data.readerName + " <span style='font-size: 7px; padding-left: 7px;'>Hide</span><br><span style='font-weight: 100;'>" + data.hardwareTypeName +"</span></div>",
                className: 'reader-popup',
              })
          }).on('click', this.showSensorPopup.bind(this, data , "hide", data.id));
            this.maps["sensor_postion"][data.id+"label"] = readerPositionLabel;
            readerPositionLabel.addTo(this.allFloorMap[this.floorId.value]);
        }
    }    
    showLabel(){
        if(!this.filterOptions.labelFilter){
            for(let i in this.maps.text_polygon[this.floorId.value]){
                this.allFloorMap[this.floorId.value].removeLayer(this.maps.text_polygon[this.floorId.value][i])
            }
            this.filterOptions.labelFilter = true;
        } else{
            this.disLocCntrl(this.floorDetail)
            this.filterOptions.labelFilter = false;
        }
    }
    getHeatmap(opt, position){
        let currentFlr = this.navigationData[this.facilityId].filter(res => res.flr == this.floorId.value)
        if(this.filterOptions.heatFilter == false && currentFlr.length > 0 && opt == 'open'){
                let heatFilterData = [];
                if(this.lastFilter != null){
                    heatFilterData = this.navigationHeatData[this.floorId.value].filter(val => val.ttp == this.lastFilter)
                } else if(this.lastFilter == null){
                    heatFilterData = this.navigationHeatData[this.floorId.value]
                }
                if(heatFilterData.length > 0){
                    this.mapFilter.heat = L.heatLayer([[heatFilterData[0].cxy[1]* -100, heatFilterData[0].cxy[0]* 100]],{minOpacity:0.6, max:1.0}).addTo(this.allFloorMap[this.floorId.value]);
                    for(let i = 1;i < heatFilterData.length; i++){
                        let point = [heatFilterData[i].cxy[1]* -100, heatFilterData[i].cxy[0]* 100];
                        this.mapFilter.heat.addLatLng([point[0], point[1]])
                    }
                    this.filterOptions.heatFilter = true;
                }
        } else if( this.filterOptions.heatFilter == true && opt == 'show'){
            if(this.lastFilter == null || (this.lastFilter != null && position.ttp == this.lastFilter)) {
                this.allFloorMap[this.floorId.value].removeLayer(this.mapFilter.heat)
                this.mapFilter.heat = null;
                let heatFilterData = [];
                if(this.lastFilter != null){
                    heatFilterData = this.navigationHeatData[this.floorId.value].filter(val => val.ttp == this.lastFilter)
                } else if(this.lastFilter == null){
                    heatFilterData = this.navigationHeatData[this.floorId.value]
                }
                if(heatFilterData.length > 0){
                    this.mapFilter.heat = L.heatLayer([[heatFilterData[0].cxy[1]* -100, heatFilterData[0].cxy[0]* 100]],{minOpacity:0.6, max:1.0}).addTo(this.allFloorMap[this.floorId.value]);
                    for(let i = 1;i < heatFilterData.length; i++){
                        let point = [heatFilterData[i].cxy[1]* -100, heatFilterData[i].cxy[0]* 100];
                        this.mapFilter.heat.addLatLng([point[0], point[1]])
                    }
                    this.filterOptions.heatFilter = true;
                }
            }
        } else if(this.filterOptions.heatFilter == true && opt == 'open'){
            this.allFloorMap[this.floorId.value].removeLayer(this.mapFilter.heat)
            this.filterOptions.heatFilter = false;
        }
    }
    getDistance(){
        this.filterOptions.distFilter = !this.filterOptions.distFilter;
        if(!this.filterOptions.distFilter){
            for(let i in this.distPolyline){
                this.allFloorMap[this.floorId.value].removeLayer(this.distPolyline[i])
                delete this.distPolyline[i]
            }
            this.polylinePoints = []
        }
    }
    getPath(type){
        // console.log(id)
        if(type == 'check'){
            this.hospitalService.getNodePoints(this.floorId.value).subscribe(res => {
                this.mapFilter.pathData = res.results;
                this.mapOptionFilter = this.mapOptionFilter.map((filter) => {
                    if (filter.code === 'mapPath') {
                        filter.disabled = this.mapFilter.pathData.length === 0;
                    }
                    return filter;
                });
            });
        } else if(type == 'show'){
        if(this.filterOptions.pathFilter == false){
                this.filterOptions.pathFilter = true;
                if (this.mapFilter.pathData.length != 0) {
                    let pathData = JSON.parse(JSON.stringify(this.mapFilter.pathData));
                // for (const i in this.mapFilter.pathData) {
                //     this.mapFilter.pathData[i].x = this.mapFilter.pathData[i].x * 100;
                //     this.mapFilter.pathData[i].y = this.mapFilter.pathData[i].y * -100;
                //     this.mapFilter.pathData[i].flag = false;
                //     for (const j in this.mapFilter.pathData[i].links) {
                //     const linkedNodeid = this.mapFilter.pathData[i].links[j].link_node_id;
                //     const index = this.checkIndexOfLoadData(linkedNodeid);
                //     if (index != -1) {
                //         this.mapFilter.pathData[i].links[j].flagLink = false;
                //     }
                //     }
        
                // }
                this.loadNodePoints(pathData)
                this.linkNodes(pathData)
                } else{
                    console.log('no data found')
                }
        } else{
            this.filterOptions.pathFilter = false;
            for(let i=0; i < this.maps.floor_path.length; i++){
            // console.log(this.maps.floor_path[i])
            this.allFloorMap[this.floorId.value].removeLayer(this.maps.floor_path[i])
            }
            for(let i=0;i < this.maps.node_path_point.length; i++){
                this.allFloorMap[this.floorId.value].removeLayer(this.maps.node_path_point[i])
            }
            this.maps.floor_path = [];
            this.maps.node_path_point = [];
            this.mapFilter.noOfLinks = 0;
        }
    }
    }
    loadNodePoints(pathData){
        let filterData = JSON.parse(JSON.stringify(pathData.filter(res => res.type != 'NT-NN')));
        for(const i in filterData){
            const lat = filterData[i].y * -100;
            const lng = filterData[i].x * 100;
            let MarkerText = L.divIcon(
              {className: 'countPosition',
               html:'<div>'+ filterData[i].exit +'</div>',
               iconSize: null
            });
            let iconImage = new L.Icon({ iconUrl: '/assets/Alert/common_icons/blue-dot.png', iconSize: [14, 14], iconAnchor: [7, 7] });
            let loadNodePoint = L.marker([lat,lng], { icon: iconImage});
            loadNodePoint.addTo(this.allFloorMap[this.floorId.value])
            if(filterData[i].exit != 0){
              let label = L.marker([lat, lng], { icon: MarkerText, draggable: false });
              label.addTo(this.allFloorMap[this.floorId.value])
              this.maps.node_path_point.push(label)
            }
            this.maps.node_path_point.push(loadNodePoint)
        }
    }
    linkNodes(pathData) {
      for (const i in pathData) {
        pathData[i].x = pathData[i].x * 100;
        pathData[i].y = pathData[i].y * -100;
        pathData[i].flag = false;
        for (const j in pathData[i].links) {
          const nodeid = pathData[i].id;
        //   console.log(nodeid)
          const linkedNodeid = pathData[i].links[j].link_node_id;
          const index = this.checkIndexOfLoadData(linkedNodeid);
        //   console.log(index)
          if (index != -1) {
            pathData[i].links[j].flagLink = false;
            for (const k in pathData[index].links) {
              if (pathData[index].links[k].link_node_id == nodeid) {
                //   console.log(pathData[index].links[k].flagLink)
                if (pathData[index].links[k].flagLink == false) {
                    // console.log('inside if index flaglink')
                  pathData[index].links[k].flagLink = true;
                  pathData[i].links[j].flagLink = true;
                //   console.log(this.pathData[i].x)
                  this.createLinkNodes(pathData[i].x, pathData[i].y, pathData[index].x, pathData[index].y);
                  break;
                }
              }
            }
          }
        }
      }
      for (const i in pathData) {
        for (const j in pathData[i].links) {
          const linkedNodeid = pathData[i].links[j].link_node_id;
          const index = this.checkIndexOfLoadData(linkedNodeid);
          if (index != -1) {
            delete pathData[i].links[j].flagLink;
          }
        }
      }
    }
    createLinkNodes(x1, y1, x2, y2) {
    //   console.log(x1, y1, x2, y2)
      const pointList = [[y1, x1], [y2, x2]];
    //   console.log(pointList)
      this.mapFilter.nodeLink[this.mapFilter.noOfLinks] = new L.Polyline(pointList, { className: "leaf-path-polyline-style" });
      this.mapFilter.nodeLink[this.mapFilter.noOfLinks].addTo(this.allFloorMap[this.floorId.value]);
    //   console.log(this.mapFilter.nodeLink[this.mapFilter.noOfLinks])
      this.maps.floor_path.push(this.mapFilter.nodeLink[this.mapFilter.noOfLinks])
      this.mapFilter.noOfLinks = this.mapFilter.noOfLinks + 1;
    }
    checkIndexOfLoadData(data) {
      const checkIndex = -1;
      for (const i in this.mapFilter.pathData) {
        if (this.mapFilter.pathData[i] != null) {
          if (this.mapFilter.pathData[i].id == data) {
            return i;
          }
        }
      }
      return checkIndex;
    }
    getZoom(aspects, floorid){
        // console.log(aspects)
        let minZoom;
        let maxZoom;
        let zoom;
        if(aspects[1] < 10){
            let num = aspects[1] / 4;
            let value;
            if(num <= 1.5){
                value = Math.floor(num) - 0.5;
            } else if(num > 1.5 && num < 2){
                value = Math.floor(num);
            } else if(num >= 2){
                value = num - 1;
            }
            minZoom = -2;
            maxZoom = 2;
            zoom = -value;
            this.allFloorMap[floorid].setMinZoom(minZoom);
            this.allFloorMap[floorid].setMaxZoom(maxZoom)
            if(this.leafRef != undefined || (this.userPre == null || floorid != this.userPre.floorId)) {
                this.allFloorMap[floorid].setZoom(zoom);
            }
        } else if(aspects[1] >= 10 && aspects[1] < 100){
            let num = aspects[1] / 10;
            this.getMultiZoom(num, floorid)
        } else if(aspects[1] >= 100){
            let num = aspects[1] / 10;
            let value = num/2;
            minZoom = -value
            maxZoom = value
            zoom = -value
            this.allFloorMap[floorid].setMinZoom(minZoom);
            this.allFloorMap[floorid].setMaxZoom(maxZoom)
            if(this.leafRef != undefined || (this.userPre == null || floorid != this.userPre.floorId)) {
                this.allFloorMap[floorid].setZoom(zoom);
            }
        }
        // aspects[1] = 9 ;
        // if(aspects[1] > 4 && aspects[1] <= 7){
        // this.floorMap.setMinZoom(-2)
        // this.floorMap.setMaxZoom(2)
        // this.floorMap.setZoom(0)
        // }
        // else if(aspects[1] > 7 && aspects[1] <= 11){
        //     this.floorMap.setMinZoom(-3)
        //     this.floorMap.setMaxZoom(3)
        //     this.floorMap.setZoom(-1)        
        // }
        // else if(aspects[1] > 11 && aspects[1] <= 18){
        //     this.floorMap.setMinZoom(-3)
        //     this.floorMap.setMaxZoom(3)
        //     this.floorMap.setZoom(-2)        
        // }
        // else if(aspects[1] > 35 && aspects[1] <= 42){
        //     this.floorMap.setMinZoom(-4)
        //     this.floorMap.setMaxZoom(1)
        //     this.floorMap.setZoom(-3)        
        // }
        // else{
        //     this.floorMap.setMinZoom(-3)
        //     this.floorMap.setMaxZoom(4)
        //     this.floorMap.setZoom(-2)    
        // }
        // console.log(this.floorMap.getZoom())
    }
    getMultiZoom(num, floorid){
        let minZoom;
        let maxZoom;
        let zoom;
        let value;
        if(num == 1){
            value = num + 0.5;
            minZoom = -value-1;
            zoom = -value
        } else if(num > 1 && num < 2){
            value = Math.floor(num);
            value = value + 1;
            minZoom = -value-1;
            zoom = -value;
        } else if(num >= 2 && num < 3.5){
            value = num;
            minZoom = -value-1;
            zoom = -value;
        } else if(num >= 3.5 && num < 5){
            value = num - 0.5;
            minZoom = -value-1;
            zoom = -value
        } else if(num >= 5 && num < 10){
            value = num / 2;
            if(num < 7){
                value = value+1;
            } else if(num >= 7 && num < 8){
                value = value+0.5;
            } else if(num >= 8 && num < 10){
                value = value;
            }
            minZoom = -value-2;
            zoom = -value;
        }
        maxZoom = value-1;
        this.allFloorMap[floorid].setMinZoom(minZoom);
        this.allFloorMap[floorid].setMaxZoom(maxZoom)
        if(this.leafRef != undefined || (this.userPre == null || floorid != this.userPre.floorId)) {
            this.allFloorMap[floorid].setZoom(zoom);
        }
    }
    inputText(event){
        this.subject.next(event);
    }
    searchLocation(id) {
        // if(type == "tag"){
        //     this.commonService.getLocationSearch(id).subscribe((res) => {
        //         let tagLocation = res.results;
        //         this.getLocationId(tagLocation[0], 'fromLoc', null);
        //     });
        // }
        // if (type == "search") {
            if(id.target.value != ""){
                if(true || id.keyCode >= 48 && id.keyCode <= 90){
                    this.commonService.getLocationSearch(id.target.value).subscribe((res) => {
                        this.searchFilter.searchLoclist = res.results.filter(val => this.floorList.map(flr => flr.id).includes(val.parentId));
                    });
                }
            } else {
                this.searchFilter.searchLoclist = [];
                if(this.pathData) {
                    this.searchFilter.searchLoclist = this.pathData.favLocations.filter(val => val.isSearchPriority && val.id != this.pathData.locFromId);
                }
            }
        // }
    }
    showPathline(results) {
        let nodePath = [];
        let pointArray = [];
        nodePath = results.data.path;
        let nodePoints = results.data.points;
        let floorData = [];
        for(let i=0 ; nodePath.length > i; i++ ){
            floorData.push(nodePoints[nodePath[i]])
        }
        let splitFlr = floorData.filter(res => res.floor_id == this.floorId.value)
        for(let i=0; i < splitFlr.length; i++){
            pointArray.push([splitFlr[i].y * - 100, splitFlr[i].x * 100])
        }
        const pathLine = new L.Polyline(pointArray, { className: "leaf-performer-polyline", color:'red'});
        pathLine.addTo(this.allFloorMap[this.floorId.value])
        this.maps["performer_src"] = pathLine;        
    }
    getLocation(option, type, event) {
        console.log(this.allFloorWithChildren.hasOwnProperty(option.parentId) == false)
        if(this.allFloorWithChildren.hasOwnProperty(option.parentId) == false) {
            this.isLoading = true;
            this.getFloorChildren(option.parentId);
            setTimeout(() => {
                this.getLocationId(option, type, event);
                this.isLoading = false;
            }, 1000);
        } else {
            this.getLocationId(option, type, event)        
        }
    }
    changeFloorByBlock() {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            panelClass : ['confirmation-popup'], height: '230px',
            disableClose: true,
            data: {
            title: 'Change Floor', message: '', floorChange: true, blockList: this.blockList, blockId: this.blockId?.value,
            floorList: this.floorList, floorId: this.floorId?.value,
            buttonText: { ok: 'Ok', cancel: 'Cancel' }
        }
        });
        dialogRef.afterClosed().subscribe(result => {
            if(result.confirmText === 'Ok') {
             this.onFloorChange(result?.floor?.id)
             this.currentFloor = result?.floor !== null ? result?.floor?.name : this.currentFloor;
            }
        })
    }
    getLocationId(opt, type, event){
        if(this.pathData) {
            if(this.pathData.favLocations.length) {
                let index = this.pathData.favLocations.findIndex(val => val.id == opt.id)
                if(index == -1) {
                    this.pathData.favLocations.push(opt);
                }
            } else {
                this.pathData.favLocations.push(opt);
            }
            localStorage.setItem('searchLocation', JSON.stringify(this.pathData.favLocations))
        }
        this.prevSearchValue[type]  = opt;
        if(this.nodes != null){
        if(opt.locationTypeId == 2) {
            opt.parentId = opt.id
        }
        let filterNode = this.nodes.filter(val => val.location_id == opt.id && val.floor_id == opt.parentId && (val.type == 'NT-RN' || val.type == 'NT-EE' ||  val.type == 'NT-EN' || val.type == 'NT-EX'))
        if(type == "fromLoc" && filterNode.length){
            this.fromLocation.setValue(opt.fullName);
            this.searchFilter.yourLocId = null;
            this.searchFilter.locFromId = opt.id;
            this.fromLocation.disable();
            this.searchFilter.searchLoclist = [];
            if(this.pathData) {
                this.pathData.floorList[0] = opt.parentId;
                this.pathData.locFromId = opt.id;
                this.pathData.src = filterNode[0]['id'];
                this.searchFilter.searchLoclist = this.pathData.favLocations.filter(val => val.id != this.pathData.locFromId);
            }
            this.searchFilter.floorList[0] = opt.parentId;
            this.setPegman(filterNode[0]);
            if(this.searchFilter.locToId === null) {
                this.searchFilter['src'] = filterNode[0]['id'];
            } else {
                this.getpathDistance();
            }
        } else if(type == "yourLoc"){
            this.fromLocation.setValue('Your location');
            this.searchFilter.yourLocId = opt.sourceNode;
            this.searchFilter['src'] = opt.sourceNode;
            this.searchFilter.searchLoclist = [];
        } else if(type == "toLoc" && filterNode.length){
            this.toLocation.setValue(opt.fullName);    
            this.toLocation.disable();
            this.searchFilter.locToId = opt.id;
            // this.searchLocPath()   
            this.searchFilter.searchLoclist = [];  
            if(this.pathData) {
                this.searchFilter.searchLoclist = this.pathData.favLocations.filter(val => val.id != this.pathData.locFromId);
            }
            this.searchFilter.floorList[1] = opt.parentId;
            if(this.pathData) {
                this.pathData.locToId = opt.id;
                this.pathData.floorList[1] = opt.parentId;
                this.pathData.desc = this.searchFilter['dest'];
                this.pathData.multiFlr = this.floorList.length > 1;
            }
            if(this.searchFilter.locFromId === null) {
                this.searchFilter['dest'] = filterNode[0]['id'];
            } else {
                this.getpathDistance()
            }
        }
        if(event == null && this.searchFilter.yourLocId != null && this.searchFilter.hasOwnProperty('src') && this.searchFilter.hasOwnProperty('dest')) {
            this.getShortestPath(this.searchFilter['src'], this.searchFilter['dest'])
        }
        }
    }
    getpathDistance() {
        let srcNodes = this.nodes.filter(val => val.location_id == this.searchFilter.locFromId && (val.type == 'NT-RN' || val.type == 'NT-EE' ||  val.type == 'NT-EN' || val.type == 'NT-EX'))
        let dstNodes = this.nodes.filter(val => val.location_id == this.searchFilter.locToId && (val.type == 'NT-RN' || val.type == 'NT-EE' ||  val.type == 'NT-EN' || val.type == 'NT-EX'))
        let lastDist = null;
        for (let i =0; i<srcNodes.length; i++){
            for (let j =0; j<dstNodes.length; j++){
                const distance = Math.sqrt( Math.pow((srcNodes[i]['x'] - dstNodes[j]['x']), 2)
                    + Math.pow((srcNodes[i]['y'] - dstNodes[j]['y']), 2));
                if (lastDist ==  null || distance < lastDist) {
                    lastDist = distance;
                    this.searchFilter['src'] = srcNodes[i]['id'];
                    this.searchFilter['dest'] = dstNodes[j]['id'];
                }
                if(srcNodes.length-1 == i && dstNodes.length -1 === j ) {
                    if(this.searchFilter.hasOwnProperty('src') && this.searchFilter.hasOwnProperty('dest')) {
                        this.getShortestPath(this.searchFilter['src'], this.searchFilter['dest'])
                    }
                }
            }
        }
    }
    getShortestPath(source,destination){
        if(this.pathData) {
            let fromLoc = [];
            if(this.pathData.srcLogicalParentId) {
                fromLoc = this.allFloorWithChildren[this.pathData.floorList[0]]['children'].filter(res => res.id == this.pathData.srcLogicalParentId);
                fromLoc = fromLoc[0].children.filter(res => res.id == this.searchFilter.locFromId);
            } else {
                fromLoc = this.allFloorWithChildren[this.pathData.floorList[0]]['children'].filter(res => res.id == this.searchFilter.locFromId);
            }
            if(fromLoc.length > 0) {
                this.prevSearchValue['fromLoc'] = fromLoc[0];
                this.fromLocation.setValue(fromLoc[0].name + ', ' + this.allFloorWithChildren[this.searchFilter.floorList[0]].name);
            }
            let toLoc = [];
            if(this.pathData.locToId) {
                if(this.pathData.destLogicalParentId) {
                    toLoc = this.allFloorWithChildren[this.pathData.floorList[1]]['children'].filter(res => res.id == this.pathData.destLogicalParentId);
                    toLoc = toLoc[0].children.filter(res => res.id == this.searchFilter.locToId);
                } else {
                    toLoc = this.allFloorWithChildren[this.pathData.floorList[1]]['children'].filter(res => res.id == this.searchFilter.locToId);
                }
                if(toLoc.length > 0) {
                    this.prevSearchValue['toLoc'] = toLoc[0];
                    this.toLocation.setValue(toLoc[0].name + ', ' + this.allFloorWithChildren[this.searchFilter.floorList[1]].name);
                }
            }
            this.navConfig.manualPublish = false;
        }
        this.dijkstraModelObject = new DijkstraModel();
        if(destination) {
            this.searchFilter.shortestPath = [];
            this.searchFilter.alternatePath = [];
            // let graph = this.searchFilter.floorList.every(val => val === this.floorId.value) ? this.floorGraph : this.graph;
            let graph = this.graph;
            const dijResults = this.dijkstraModelObject.run(graph, 1, source, destination);
            const shortestPath = this.dijkstraModelObject.getPath(dijResults.prev, dijResults.target);
            this.searchFilter.shortestPath = shortestPath;
            let nodePoints= {}
            this.pathCategoryId = null;
            for(let i =0; i<this.nodes.length; i++){
                if(this.searchFilter.floorList.every(val => val === this.floorId.value) == false && this.pathCategoryId == null && ["LC_Stair Case", "LC_Lift"].includes(this.nodes[i].locationCategoryId)) {
                    if(this.searchFilter.shortestPath.includes(this.nodes[i].id)) {
                        this.pathCategoryId = this.nodes[i].locationCategoryId;
                    }
                }
                nodePoints[this.nodes[i].id] = this.nodes[i]
            }
            let result = {
                data : {
                    floorList : [this.searchFilter.floorList[0], this.searchFilter.floorList[1]],
                    path : shortestPath,
                    points : nodePoints
                }
            }

            result['data']['floorList'] = [this.searchFilter.floorList[0], this.searchFilter.floorList[1]]
            result['data']['color'] = 'blue'
            result['data']['type'] = 'search'
            this.searchLocPath(result)
            if(this.navConfig.showAlternatePath && this.pathCategoryId != null) {
                this.getAlternativepath(source, destination)
            }
        }
    }
    getAlternativepath(source, destination) {
        let dijkstraModelObject = new DijkstraModel();
        let graph = this.pathCategoryId == 'LC_Lift' ? this.stairGraph : this.liftGraph;
        const dijResults = dijkstraModelObject.run(graph, 1, source, destination);
        const altestnatePath = dijkstraModelObject.getPath(dijResults.prev, dijResults.target);
        if(JSON.stringify(this.searchFilter.shortestPath) !== JSON.stringify(altestnatePath)) {
            this.searchFilter.alternatePath = altestnatePath;
            this.generatePath(altestnatePath, 'alternatePath')
        }
    }
    generatePath(path, type) {
        if(path.length) {
            let alternate = type == 'alternatePath'; 
            this.searchFilter[type] = path;
            let nodePath = [];
            let pointXY = [];
            let nodePoints= {}
            for (let i =0; i<this.nodes.length; i++) {
                nodePoints[this.nodes[i].id] = this.nodes[i]
            }
            nodePath = path;
            let floorData = [];
            for(let i=0 ; nodePath.length > i; i++ ){
                floorData.push(nodePoints[nodePath[i]])
            }
            let splitFlr = floorData.filter(res => res.floor_id == this.floorId.value)
            for(let i=0; i < splitFlr.length; i++){
                pointXY.push([splitFlr[i].y * - 100, splitFlr[i].x * 100])
            }
            let alterlinePath = this.searchFilter.floorList.indexOf(this.floorId.value) == 0 ? 'src_alterpath_polyline' : 'dest_alterpath_polyline';
            let shortestlinePath = this.searchFilter.floorList.indexOf(this.floorId.value) == 0 ? 'src_shortpath_polyline' : 'dest_shortpath_polyline';
            if(this.maps[alterlinePath]) {
                this.allFloorMap[this.floorId.value].removeLayer(this.maps[alterlinePath]);
            }
            const pathLine = new L.Polyline(pointXY, {className: alternate ? "leaf-alter-polyline-style" : "leaf-polyline-style"  });
            this.maps[alternate ? alterlinePath : shortestlinePath] = pathLine;
            pathLine.addTo(this.allFloorMap[this.floorId.value])
            if(this.maps[shortestlinePath]) {
                this.allFloorMap[this.floorId.value].removeLayer(this.maps[shortestlinePath]);
                this.maps[shortestlinePath].addTo(this.allFloorMap[this.floorId.value]) 
            }
            this.shortestPathIcons(nodePath, pointXY, floorData, false);
        }
    }
    changePathCategory(type) {
        console.log(type)
        if(this.pathCategoryId != type) {
            this.pathCategoryId = type;
            this.resetShortestPath(type);
            let shortestPath = this.searchFilter.alternatePath;
            let alternatePath = this.searchFilter.shortestPath;
            this.generatePath(shortestPath, 'shortestPath');
            this.generatePath(alternatePath, 'alternatePath');
            
        }
    }
    searchLocPath(results){
        // console.log('slid',this.searchFilter.locFromId)
        if(this.maps.start_end_location.length > 0 && results['data']['type'] == 'search'){
            this.allFloorMap[this.floorId.value].removeLayer(this.maps["src_shortpath_polyline"]);
            this.allFloorMap[this.floorId.value].removeLayer(this.maps["dest_shortpath_polyline"]);
            for(let i = 0; this.maps.start_end_location.length > i; i++){
                this.allFloorMap[this.floorId.value].removeLayer(this.maps.start_end_location[i]);
            }
            this.maps.start_end_location = [];
            this.maps.src_shortpath_polyline = {};
            this.maps.dest_shortpath_polyline = {};
        }
        this.allFloorMap[this.floorId.value].fitBounds(this.flrBounds);
        // let param;
        // if(this.searchFilter.yourLocId == null){
        //     param = '/slid=' + this.searchFilter.locFromId + '&dlid=' + this.searchFilter.locToId + '&flr=' + this.floorId.value;
        // } else if(this.searchFilter.yourLocId != null){
        //     param = '/snid=' + this.searchFilter.yourLocId + '&dlid=' + this.searchFilter.locToId + '&flr=' + this.floorId.value;
        // }
        // this.commonService.getReportData('shortestpath', param).subscribe(res => {
        // if(res.results.statusCode == 200){
        // this.shortestPathData = res.results;
        // this.lastShortestPath = {sName: this.fromLocation.value, dName: this.toLocation.value, sourceId: this.searchFilter.locFromId, destId: this.searchFilter.locToId}
        // this.showShortestPath(res.results)
        // } else{
        //     console.log('No data found')
        // }
        // });
        if(results['data']['type'] == 'search') {
        if(results.data.path.length){
        this.shortestPathData = results;
        this.lastShortestPath = {sName: this.fromLocation.value, dName: this.toLocation.value, sourceId: this.searchFilter.locFromId, destId: this.searchFilter.locToId}
        // console.log(results)
        this.showShortestPath(results)
        }else{
            console.log('no data found')
        }
        } 
        else {
            if(this.maps.performer_locs.length > 0 && results['data']['type'] == 'performer'){
                this.allFloorMap[this.floorId.value].removeLayer(this.maps["performer_src"]);
                this.allFloorMap[this.floorId.value].removeLayer(this.maps["performer_dest"]);
                for(let i = 0; this.maps.performer_locs.length > i; i++){
                    this.allFloorMap[this.floorId.value].removeLayer(this.maps.performer_locs[i]);
                }
                this.maps.performer_locs = [];
                this.maps.performer_src = {};
                this.maps.performer_dest = {};
            }    
            if(results.data.path.length){
                this.showPathline(results)
            }else{
                console.log('no data found')
            }
        }
    }
    setDestinatePegman(point) {
        if(this.pathData) {
            if(this.pathData['destPegman']) {
                this.allFloorMap[this.floorId.value].removeLayer(this.pathData['destPegman'])
                this.pathData['destPegman'] = null;
            }
            if( this.floorId.value == this.pathData.floorList[1]) {
                let marker = L.Marker.movingMarker([point,point], 500, {autostart: false});
                let iconData = {iconUrl: '/assets/Floorplan/pegman-final.png', iconSize: [30, 30], iconAnchor: [12, 40]};
                marker.options.icon = L.icon(iconData);
                this.pathData['destPegman'] = marker;
                marker.addTo(this.allFloorMap[this.floorId.value]);
            }
        }
    }
    setPegman(value?, id?) {
        if(id) {
            value = this.nodes.filter(res => res.id == id)
            if(value.length) {
                value = this.nodes.filter(res => res.id == id)[0]
            } else {
                value = this.nodes.filter(res => res.location_id == this.searchFilter.locFromId && (res.type == 'NT-RN' || res.type == 'NT-EE' ||  res.type == 'NT-EN' || res.type == 'NT-EX'))[0]
            }
        }
        if(value) {
            if(this.pathData && this.pathData['marker']) {
                this.allFloorMap[this.floorId.value].removeLayer(this.pathData['marker'])
                this.pathData['marker'] = null;
            }
            if( this.floorId.value == this.pathData?.floorList[0]) {
                let marker = L.Marker.movingMarker([[value.y * - 100, value.x * 100],[value.y * - 100, value.x * 100]], 500, {autostart: false});
                let iconData = {iconUrl: '/assets/Floorplan/pegman-final.png', iconSize: [30, 30], iconAnchor: [15, 25]};
                marker.options.icon = L.icon(iconData);
                this.pathData['marker'] = marker;
                marker.addTo(this.allFloorMap[this.floorId.value]);
            }
        }
    }
    private distance(p1, p2): number {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private angle(p1, p2, p3): number {
        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        const dot = v1.x * v2.x + v1.y * v2.y;
        const det = v1.x * v2.y - v1.y * v2.x;
        return Math.atan2(det, dot) * (180 / Math.PI);
    }
    generateSteps(path: any): any {
    if (path.length < 2) return [];

    const rawSteps: { direction: string; distance: number; target: string }[] = [];

    // 1️⃣ Generate basic steps first
    for (let i = 0; i < path.length - 1; i++) {
        const dist = this.distance(path[i], path[i + 1]);
        let direction = '';

        if (i < path.length - 2) {
            const turnAngle = this.angle(path[i], path[i + 1], path[i + 2]);
            if (turnAngle > 20) {
            direction = 'Turn right';
            } else if (turnAngle < -20) {
            direction = 'Turn left';
            } else {
            direction = 'Go straight';
            }
        } else {
            direction = 'You’ve arrived';
        }

        rawSteps.push({
            direction,
            distance: dist,
            target: path[i + 1].locationName
        });
        }

        // 2️⃣ Merge consecutive “Go straight” steps
        const mergedSteps: any[] = [];
        let accumulatedDistance = 0;
        let currentDirection = '';
        let currentTarget = '';

        for (let i = 0; i < rawSteps.length; i++) {
        const step = rawSteps[i];

        if (step.direction === 'Go straight') {
            // Continue accumulating
            accumulatedDistance += step.distance;
            currentDirection = 'Go straight';
            currentTarget = step.target;

            // If next step is NOT straight, finalize
            const nextStep = rawSteps[i + 1];
            if (!nextStep || nextStep.direction !== 'Go straight') {
            mergedSteps.push(
                {
                    direction : currentDirection,
                    distance : accumulatedDistance.toFixed(1),
                    locationName : currentTarget,
                    // message : `${currentDirection} for ${accumulatedDistance.toFixed(1)} meters toward ${currentTarget}`
                    message : `${currentDirection} for ${accumulatedDistance.toFixed(1)} meters`
                }
            );
                accumulatedDistance = 0;
            }

        } else {
            // Flush any previous straight accumulation
            if (accumulatedDistance > 0) {
            mergedSteps.push(
                {
                    direction : 'Go straight',
                    distance : accumulatedDistance.toFixed(1),
                    locationName : currentTarget,
                    // message : `Continue straight for ${accumulatedDistance.toFixed(1)} meters toward ${currentTarget}`
                    message : `Go straight for ${accumulatedDistance.toFixed(1)} meters`
                }
            );
            accumulatedDistance = 0;
            }

            // Add this non-straight step
            if (step.direction === 'You’ve arrived') {
            mergedSteps.push(
                {
                    direction : step.direction,
                    distance : step.distance.toFixed(1),
                    locationName : step.target,
                    message :`You’ve arrived at ${step.target}`
                });
            } else {
            mergedSteps.push(
                {
                    direction : step.direction,
                    distance : step.distance.toFixed(1),
                    locationName : step.target,
                    // message : `${step.direction} for ${step.distance.toFixed(1)} meters toward ${step.target}`
                    message : `${step.direction} for ${step.distance.toFixed(1)} meters`
                }
            );
            }
        }
        }

        return mergedSteps;
    }

    generateSteps2(path): any {
        if (path.length < 2) return [];

        const steps = [];

        for (let i = 0; i < path.length - 1; i++) {
        const dist = this.distance(path[i], path[i + 1]);
        let direction = '';

        if (i < path.length - 2) {
            const turnAngle = this.angle(path[i], path[i + 1], path[i + 2]);

            if (turnAngle > 20) {
            direction = 'Turn right';
            } else if (turnAngle < -20) {
            direction = 'Turn left';
            } else {
            direction = 'Go straight';
            }
        }
        // else {
        //     direction = 'You’ve arrived';
        // }
        let res = {
            direction : direction,
            distance : dist.toFixed(1),
            locationName : path[i + 1].locationName,
            // message : `${direction} for ${dist.toFixed(1)} meters toward ${path[i + 1].locationName}`   
            message : `${direction} for ${dist.toFixed(1)} meters`   
        }        
        if(i  == 0) {
            let val = {
                direction : direction,
                distance : dist.toFixed(1),
                locationName : path[i + 1].locationName,
                message : `Start at ${path[i].locationName}`   
            }   
            steps.push(val);
        }
        steps.push(res);
        if(i  == path.length - 2) {
            res = {
                direction : direction,
                distance : dist.toFixed(1),
                locationName : path[i + 1].locationName,
                message : `You’ve arrived at ${path[i + 1].locationName}`   
            }   
            steps.push(res);
        }
        }

        return steps;
    }
    showShortestPath(results){
        if(this.searchFilter.floorList.indexOf(this.floorId.value) != -1){
        this.fromLocation.setValue(this.lastShortestPath['sName']);
        this.toLocation.setValue(this.lastShortestPath['dName']);
        this.searchFilter.locFromId = this.lastShortestPath['sourceId'];
        this.searchFilter.locToId = this.lastShortestPath['destId']; 
        if(this.pathData) {
            this.pathData.locFromId = this.searchFilter.locFromId;
            this.pathData.locToId = this.searchFilter.locToId;
        }
        let nodePath = [];
        let pointXY = [];
        // for(let i=0; i < results.data.path.length; i++){
        //     let dataPath =  results.data.path[i].split(".");
        //     nodePath.push(dataPath[0])
        // }
        nodePath = results.data.path;
        let nodePoints = results.data.points;
        let floorData = [];
        // let pointXY = [];
        // console.log(nodePath)
        // console.log(nodePoints)
        for(let i=0 ; nodePath.length > i; i++ ){
            // this.pointXY.push([nodePoints[nodePath[i]].y * - 100, nodePoints[nodePath[i]].x * 100])
            floorData.push(nodePoints[nodePath[i]])
        }
        // console.log(this.pointXY)
        // console.log('floor Data :::', floorData)
        let splitFlr = floorData.filter(res => res.floor_id == this.floorId.value)
        for(let i=0; i < splitFlr.length; i++){
            pointXY.push([splitFlr[i].y * - 100, splitFlr[i].x * 100])
        }
        this.shortestPathIcons(nodePath, pointXY, floorData)
        } else{
        // this.fromLocation.setValue(null);
        // this.toLocation.setValue(null);
        // this.fromLocation.enable();
        // this.toLocation.enable();
        // this.searchFilter.locFromId = null;
        // this.searchFilter.locToId = null; 
        }
    }
    shortestPopupClick() {
        let changeFloor = this.searchFilter.floorList.find(x => x !== this.floorId.value);
        if(changeFloor) {
            if(this.pathData['destPegman']) {
                this.allFloorMap[this.floorId.value].removeLayer(this.pathData['destPegman'])
                this.pathData['destPegman'] = null;
            }
            this.isLoading = true;
            this.onFloorChange(changeFloor);
        }
    }
    shortestPathIcons(nodePath, pointXY, floorData, drawPath = true) {
        if(floorData.length) {
            this.setPegman(floorData[0])
        }
        let distanceValue = nodePath.length
        let distanceTime = Math.round ((nodePath.length * 3)/60);
        let splitFlr = floorData.filter(res => res.floor_id == this.floorId.value)
        if(this.navConfig?.showSteps) {
            this.stepDetails = this.generateSteps(splitFlr)
        }        
        // console.log(this.stepDetails)
        let brkPopupContent;
        let sdPopupContent;
        let entry;
        let fromLoc = this.fromLocation.value ? this.fromLocation.value.split(',') : [''];
        let toLoc = this.toLocation.value ? this.toLocation.value.split(',') : [''];
        let navigateFlr = this.searchFilter.floorList.filter(res => res != this.floorId.value)
        let navSrc;
        let navBrk;
        navSrc = "<div style='height:30%; width:100%; padding-top:5px; padding-left:5px;font-size:13px;font-weight:900; text-decoration:underline;font-style:italic;font-family:" + 'Open Sans' + "'>"+ 'Navigation' +"</div>"
        navBrk = "<div style='height:25%; width:100%; padding-top:5px; padding-left:5px;font-size:13px;font-weight:900; text-decoration:underline;font-style:italic;font-family:" + 'Open Sans' + "'>"+ 'Navigation' +"</div>"
        if(this.reqType == 'porter'){
            if(this.reqTagDetail.nonPerformer.length) {
            navSrc = "<div style='height:35%; width: 100%; margin-bottom:8px;'><div style='height:50%; width:100%; padding-top:2px; padding-left:5px;font-size:11px;font-weight:900; text-decoration:underline;font-family:" + 'Open Sans' + "'>"+ 'Porter Movement Request' +"</div><div style='height:50%; width:100%; padding-top:2px;'><span style='padding-left:5px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'Patient : ' + "</span><span style='padding-left:3px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;font-size:12px;font-family:" + 'Open Sans' + "'>" + this.reqTagDetail.nonPerformer[0].fullName + "</span></div></div>"
            navBrk = "<div style='height:35%; width:100%'><div style='height:50%; width:100%; padding-left:5px;font-size:11px;font-weight:900; text-decoration:underline;font-family:" + 'Open Sans' + "'>"+ 'Porter Movement Request' +"</div><div style='height:50%; width:100%;'><span style='padding-left:5px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'Patient : ' + "</span><span style='padding-left:3px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;font-size:12px;font-family:" + 'Open Sans' + "'>" + this.reqTagDetail.nonPerformer[0].fullName + "</span></div></div>"
            } else if (this.reqTagDetail['requestCategory'] == 'PR-OT') {
                navSrc = "<div style='height:35%; width: 100%; margin-bottom:8px;'><div style='height:50%; width:100%; padding-top:2px; padding-left:5px;font-size:11px;font-weight:900; text-decoration:underline;font-family:" + 'Open Sans' + "'>"+ 'Porter Movement Request' +"</div><div style='height:50%; width:100%; padding-top:2px;'><span style='padding-left:5px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'Name : ' + "</span><span style='padding-left:3px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;font-size:12px;font-family:" + 'Open Sans' + "'>" + this.reqTagDetail.comments + "</span></div></div>"
                navBrk = "<div style='height:35%; width:100%'><div style='height:50%; width:100%; padding-left:5px;font-size:11px;font-weight:900; text-decoration:underline;font-family:" + 'Open Sans' + "'>"+ 'Porter Movement Request' +"</div><div style='height:50%; width:100%;'><span style='padding-left:5px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'Name : ' + "</span><span style='padding-left:3px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;font-size:12px;font-family:" + 'Open Sans' + "'>" + this.reqTagDetail.comments + "</span></div></div>"
            }
        }
        if(navigateFlr.length){
            entry = this.floorAllList.filter(res => res.id == navigateFlr[0])
        } else{
            entry = this.floorAllList.filter(res => res.id == this.floorId.value)
        }
        let exit = this.floorAllList.filter(res => res.id == this.floorId.value)
        if(this.tagOptions.selectedTag != null){
            let lastSeen = this.datepipe.transform(this.tagOptions.selectedTag.ctm , 'h:mm:ss a');
            brkPopupContent = "<div style='height:175px;width:160px'><div style='height:30%; width:100%; background: #d9e8ff;border-radius:10px; border: 1px solid #5d87de;margin-bottom: 3px;'><div style='height:45%; width:100%;padding-top: 5px ;padding-left:2px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap'><span style='padding-left:3px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'Exit : ' + "</span><span style='padding-left:3px;font-size:12px;font-family:" + 'Open Sans' + "'>" + exit[0].name + ', ' + exit[0].blockName + "</span></div><div style='height:45%; width:100%;padding-left:2px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap'><span style='padding-left:3px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'Navigate To : ' + "</span><span style='padding-left:3px;font-size:12px;font-family:" + 'Open Sans' + "'>" + entry[0].name +', ' + entry[0].blockName + "</span></div></div><div style='height:70%; width:100%; background: #d9e8ff;border-radius:10px; border: 1px solid #5d87de;margin-bottom: 3px;'><div style='height:15%; width:100%;padding-top:3px;padding-left:2px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap'><span style='padding-left:3px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'Entry : ' + "</span><span style='padding-left:3px;font-size:12px;font-family:" + 'Open Sans' + "'>" + entry[0].name +', ' + entry[0].blockName + "</span></div>" + navBrk + "<div style='height:15%; width:100%;padding-left:2px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap'><span style='padding-left:3px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'From : ' + "</span><span style='padding-left:3px;font-size:12px;font-family:" + 'Open Sans' + "'>" + fromLoc[0] + "</span></div><div style='height:15%; width:100%;padding-left:2px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap'><span style='padding-left:3px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'To : ' + "</span><span style='padding-left:3px;font-size:12px;font-family:" + 'Open Sans' + "'>" + toLoc[0] + "</span></div><div style='height:15%; width:100%;padding-left:2px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap'><span style='padding-left:3px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'Time : ' + "</span><span style='padding-left:3px;font-size:12px;font-family:" + 'Open Sans' + "'>" + lastSeen + "</span></div></div></div>";
            sdPopupContent = "<div style='height:145px;width:160px;background: #d9e8ff;border-radius:10px; border: 1px solid #5d87de;'><div style='height:65%; width:100%'>"+ navSrc +"<div style='height:20%; width:100%;padding-left:2px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap'><span style='padding-left:3px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'From : ' + "</span><span style='padding-left:3px;font-size:12px;font-family:" + 'Open Sans' + "'>" + fromLoc[0] + "</span></div><div style='height:20%; width:100%;padding-left:2px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap'><span style='padding-left:3px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'To : ' + "</span><span style='padding-left:3px;font-size:12px;font-family:" + 'Open Sans' + "'>" + toLoc[0] + "</span></div><div style='height:20%; width:100%;padding-left:2px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap'><span style='padding-left:3px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'Time : ' + "</span><span style='padding-left:3px;font-size:12px;font-family:" + 'Open Sans' + "'>" + lastSeen + "</span></div></div><div style='height:30%; width:100%; padding-left: 3px; padding-top:4px'><span style='font-size:11px; font-weight:bold;font-family:" + 'Open Sans' + "'>" +'Current Location : '+ "</span><span style='font-size:12px;font-family:" + 'Open Sans' + "'>" + this.tagOptions.selectedTag.lnm +"</span></div></div>";
        } else if(this.tagOptions.selectedTag == null){
            brkPopupContent = "<div style='height:30px;width:78px'><div style='height:100%; width:100%; background: #d9efff9c;border-radius:10px; border: 1px solid #5d87de;margin-bottom: 3px;'><div style='margin-top:5px; height:25px; width:100%;text-overflow:ellipsis;padding-left:2px;overflow:hidden;white-space:nowrap;text-align:center;'><span id='changeFloor' style='color: blue; cursor: pointer;font-size:12px;text-decoration: underline;font-family:" + 'Open Sans' + "'>switch floor</span></div></div></div>";
            sdPopupContent = "<div style='height:80px;width:160px;background: #d9e8ff;border-radius:10px; border: 1px solid #5d87de;'><div style='height:100%; width:100%'>"+ navSrc +"<div style='height:30%; width:100%;padding-left:2px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap'><span style='padding-left:3px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'From : ' + "</span><span style='padding-left:3px;font-size:12px;font-family:" + 'Open Sans' + "'>" + fromLoc[0] + "</span></div><div style='height:30%; width:100%;padding-left:2px;text-overflow:ellipsis;overflow:hidden;white-space:nowrap'><span style='padding-left:3px;font-size:12px;font-weight:bold;font-family:" + 'Open Sans' + "'>" + 'To : ' + "</span><span style='padding-left:3px;font-size:12px;font-family:" + 'Open Sans' + "'>" + toLoc[0] + "</span></div></div></div>";
        }
        let popupOptions = {className: "customPopup"}
        let locIcon;
        let locPoint;
        if(pointXY.length == floorData.length){
                if(this.reqType == 'porter'){
                    locIcon = new L.Icon({ iconUrl: '/assets/Alert/common_icons/leaf-location-circle-green.svg', iconSize: [20, 25], iconAnchor: [10, 12], className:"leaf-start-location-icon"});
                    locPoint = pointXY[0];
                    this.setShortestPathIcon(locIcon, locPoint, sdPopupContent, popupOptions)
    
                    locIcon = new L.Icon({ iconUrl: '/assets/Alert/common_icons/leaf-location-circle-red.svg', iconSize: [20, 25], iconAnchor: [10, 12], className:"leaf-end-port-location-icon"});
                    locPoint = pointXY[pointXY.length-1];
                    this.setShortestPathIcon(locIcon, locPoint, sdPopupContent, popupOptions)
                } else{
                    locIcon = new L.Icon({ iconUrl: '/assets/Alert/common_icons/leaf-location-circle.svg', iconSize: [20, 25], iconAnchor: [10, 12], className:"leaf-location-circle-icon"});
                    locPoint = pointXY[pointXY.length-1];
                    this.setShortestPathIcon(locIcon, locPoint, null, null)
    
                    locIcon = new L.Icon({ iconUrl: '/assets/Alert/common_icons/leaf-location.png', iconSize: [30, 25], iconAnchor: [15, 25], className:"leaf-end-location-icon"});
                    locPoint = pointXY[pointXY.length-1];
                    this.setShortestPathIcon(locIcon, locPoint, sdPopupContent, popupOptions)
                }
                if(drawPath) {
                    const pathLine = new L.Polyline(pointXY, { className: "leaf-polyline-style" });
                    pathLine.addTo(this.allFloorMap[this.floorId.value])
                    if(!this.pathData) {
                        let content = "<div style='font-family:" + 'Open Sans' +
                            "'> Distance  : " + distanceValue + " m and Est. Time : " + distanceTime + " mins</div>";
                        pathLine.bindTooltip(content, { permanent: true, direction: "center"}).openTooltip();                
                    }
                    this.maps["src_shortpath_polyline"] = pathLine;
                }
        }else if(pointXY.length != floorData.length){
            let index = this.searchFilter.floorList.indexOf(this.floorId.value)
            if(index == 0){ 
                if(this.reqType == 'porter'){
                    locIcon = new L.Icon({ iconUrl: '/assets/Alert/common_icons/leaf-location-circle-green.svg', iconSize: [20, 25], iconAnchor: [10, 12], className:"leaf-start-location-icon"});
                    locPoint = pointXY[0];
                    this.setShortestPathIcon(locIcon, locPoint, sdPopupContent, popupOptions)
                    
                    locIcon = new L.Icon({ iconUrl: '/assets/Alert/common_icons/enter.svg', iconSize: [25, 25], iconAnchor: [10, 12], className:"leaf-enter-icon"});
                    locPoint = pointXY[pointXY.length-1];
                    this.setShortestPathIcon(locIcon, locPoint, brkPopupContent, popupOptions, true)
                } else{
                    locIcon = new L.Icon({ iconUrl: '/assets/Alert/common_icons/leaf-location-circle-green.svg', iconSize: [20, 25], iconAnchor: [10, 12], className:"leaf-start-location-icon"});
                    locPoint = pointXY[0];
                    this.setShortestPathIcon(locIcon, locPoint, sdPopupContent, popupOptions)
                    
                    locIcon = new L.Icon({ iconUrl: '/assets/Alert/common_icons/enter.svg', iconSize: [25, 25], iconAnchor: [10, 12], className:"leaf-enter-icon"});
                    locPoint = pointXY[pointXY.length-1];
                    this.setShortestPathIcon(locIcon, locPoint, brkPopupContent, popupOptions, true)
                }  
                if(drawPath) {
                    const pathLine = new L.Polyline(pointXY, { className: "leaf-polyline-style" });
                    pathLine.addTo(this.allFloorMap[this.floorId.value])
                    // added extra 2mins and 5mtr for other floors temporary
                    if(!this.pathData) {     
                        let content = "<div style='font-family:" + 'Open Sans' +
                        "'> Distance  : " + (distanceValue + 5) + " m and Est. Time : " + (distanceTime + 2) + " mins</div>";
                        pathLine.bindTooltip(content, { permanent: true, direction: "center"}).openTooltip();
                    }
                    this.maps["src_shortpath_polyline"] = pathLine;
                }
            } else if(index == 1){
                if(this.reqType == 'porter'){
                    locIcon = new L.Icon({ iconUrl: '/assets/Alert/common_icons/exit.svg', iconSize: [25, 25], iconAnchor: [10, 12], className:"leaf-exit-icon"});
                    locPoint = pointXY[0];
                    this.setShortestPathIcon(locIcon, locPoint, brkPopupContent, popupOptions, true)

                    locIcon = new L.Icon({ iconUrl: '/assets/Alert/common_icons/leaf-location-circle-red.svg', iconSize: [20, 25], iconAnchor: [10, 12], className:"leaf-end-port-location-icon"});
                    locPoint = pointXY[pointXY.length-1];
                    this.setShortestPathIcon(locIcon, locPoint, sdPopupContent, popupOptions)
                } else{
                    locIcon = new L.Icon({ iconUrl: '/assets/Alert/common_icons/exit.svg', iconSize: [25, 25], iconAnchor: [10, 12], className:"leaf-exit-icon"});
                    locPoint = pointXY[0];
                    this.setShortestPathIcon(locIcon, locPoint, brkPopupContent, popupOptions, true)
                    this.setDestinatePegman(locPoint)
                    locIcon = new L.Icon({ iconUrl: '/assets/Alert/common_icons/leaf-location-circle.svg', iconSize: [20, 25], iconAnchor: [10, 12], className:"leaf-location-circle-icon"});
                    locPoint = pointXY[pointXY.length-1];
                    this.setShortestPathIcon(locIcon, locPoint, null, null)
    
                    locIcon = new L.Icon({ iconUrl: '/assets/Alert/common_icons/leaf-location.png', iconSize: [30, 25], iconAnchor: [15, 25], className:"leaf-end-location-icon"});
                    locPoint = pointXY[pointXY.length-1];
                    this.setShortestPathIcon(locIcon, locPoint, sdPopupContent, popupOptions)
                }
                if(drawPath) {
                    const pathLine = new L.Polyline(pointXY, { className: "leaf-polyline-style" });
                    pathLine.addTo(this.allFloorMap[this.floorId.value])
                    // added extra 2mins and 5mtr for other floors
                    if(!this.pathData) {        
                        let content = "<div style='font-family:" + 'Open Sans' +
                            "'> Distance  : " + (distanceValue + 5) + " m and Est. Time : " + (distanceTime + 2) + " mins</div>";
                        pathLine.bindTooltip(content, { permanent: true, direction: "center"}).openTooltip();
                    }
                    this.maps["dest_shortpath_polyline"] = pathLine;
                }
            }
        }
    }
    setShortestPathIcon(icon, point, popupContent, popupOpt, isOpen = false){
        let locationPointer = L.marker(point, {icon: icon});
        locationPointer.on('popupopen', (e) => {
            const popupElement = e.popup.getElement();
            popupElement?.addEventListener('click', (event: any) => {
            if (event.target.id === 'changeFloor') {
                this.shortestPopupClick();
            }
            });
        })
        locationPointer.addTo(this.allFloorMap[this.floorId.value]);
        if(popupContent !== null && popupOpt !== null){
            if(isOpen) {
                locationPointer.bindPopup(popupContent,popupOpt).openPopup();
            } else {
                locationPointer.bindPopup(popupContent,popupOpt);
            }
        }
        this.maps.start_end_location.push(locationPointer)
    }
    getFilter(event, type){
        if(type == true){
            this.mapFilter.selectedFilter = event;
            if(event == 'navigate' && this.tagOptions.selectedTag != null){
                this.navigateHighlightedTag(this.tagOptions.selectedTag)
                this.isNavigate = true;
            }
        } else{
        this.mapFilter.selectedFilter = null;
        if(event == 'navigate'){
            this.allFloorMap[this.floorId.value].flyToBounds(this.flrBounds)
            this.isNavigate = false;
        }
        }
    }
    polyLineDist(floorLocation, pos){
        if(this.filterOptions.distFilter){
            let iconImage = new L.Icon({ iconUrl: '/assets/Alert/common_icons/blue-dot.png', iconSize: [10, 10], iconAnchor: [6, 6] });
            this.polylinePoints.push(pos.latlng);
            this.distPolyline[this.polylinePoints.length] = L.marker(pos.latlng, { icon: iconImage});
            this.distPolyline[this.polylinePoints.length].addTo(this.allFloorMap[floorLocation.id])
            if(this.polylinePoints.length == 2){
                this.distPolyline['polyLine'] = L.polyline([this.polylinePoints[0],this.polylinePoints[1]], {color: 'gray'}).addTo(this.allFloorMap[floorLocation.id]);
                let point = JSON.parse('[[' + (this.polylinePoints[0].lng / 100).toFixed(3) + ',' + (this.polylinePoints[0].lat / -100).toFixed(3) + '],[' +(this.polylinePoints[1].lng / 100).toFixed(3) + ',' +(this.polylinePoints[1].lat / -100).toFixed(3) + ']]')
                const distance = Math.sqrt(Math.pow((point[0][1] - point[1][1]), 2) + Math.pow((point[0][0] - point[1][0]), 2));
                let content = "<div style='font-family:" + 'Open Sans' + "'> Distance : " + distance.toFixed(2) + " m</div>"
                this.distPolyline['polyLine'].bindTooltip(content, { permanent: true, direction: "center"}).openTooltip();
            } else if(this.polylinePoints.length > 2){
                for(let i in this.distPolyline){
                    this.allFloorMap[floorLocation.id].removeLayer(this.distPolyline[i])
                    delete this.distPolyline[i]
                }
                this.polylinePoints = []
            }
        }
    }
    //// *** NEW CODE LOCATION SHOW/HIDE USING DISPLAY LOCATION *** ////
    disLocCntrl(flrDetail){
        this.zoomCntrlLabel(flrDetail.id)
        // this.fullscreenLabel(flrDetail.id)
        if(this.isZoomCntrl){
            let disLocation = []
            for(let i in flrDetail.children){
                    if(flrDetail.children[i].disLocLevel != null && (this.allFloorMap[flrDetail.id].getZoom() >= flrDetail.children[i].disLocLevel/20 - 10)){
                        disLocation.push(flrDetail.children[i].id)
                    }else if(flrDetail.children[i].disLocLevel == null){
                        disLocation.push(flrDetail.children[i].id)
                    }
                if(flrDetail.children[i].locationTypeLevel > 2 && flrDetail.children[i].children.length){
                    let level1Child = flrDetail.children[i].children;
                    for(let j in level1Child){
                            if(level1Child[j].disLocLevel != null && (this.allFloorMap[flrDetail.id].getZoom() >= level1Child[j].disLocLevel/20 - 10)){
                                disLocation.push(level1Child[j].id)
                            }else if(level1Child[j].disLocLevel == null){
                                disLocation.push(level1Child[j].id)
                            }
                        if(level1Child[j].locationTypeLevel > 2 && level1Child[j].children.length){
                            let level2Child = level1Child[j].children;
                            for(let k in level2Child){
                                if(level2Child[k].disLocLevel != null && (this.allFloorMap[flrDetail.id].getZoom() >= level2Child[k].disLocLevel/20 - 10)){
                                    disLocation.push(level2Child[k].id)
                                } else if(level2Child[k].disLocLevel == null){
                                    disLocation.push(level2Child[k].id)
                                }
                                if(level2Child[k].locationTypeLevel > 2 && level2Child[k].children.length){ 
                                    let level3Child = level2Child[k].children;
                                    for(let l in level3Child){
                                        if(level3Child[l].disLocLevel != null && (this.allFloorMap[flrDetail.id].getZoom() >= level3Child[l].disLocLevel/20 - 10)){
                                            disLocation.push(level3Child[l].id)
                                        } else if(level3Child[l].disLocLevel == null){
                                            disLocation.push(level3Child[l].id)
                                        }
                                    }    
                                }
                            }
                        }
                    }
                }
            }
            for(let i in this.maps.text_polygon[flrDetail.id]){
                this.allFloorMap[flrDetail.id].removeLayer(this.maps.text_polygon[flrDetail.id][i])
            }
            setTimeout(()=>{
            for(let i in disLocation){
                if(this.maps.text_polygon[flrDetail.id] != undefined && this.maps.text_polygon[flrDetail.id][disLocation[i]] != undefined){
                    let polygon = this.maps.text_polygon[flrDetail.id][disLocation[i]];
                    this.allFloorMap[flrDetail.id].addLayer(polygon);
                    //polygon = this.maps.tooltip_polygon[disLocation[i]];
                    polygon.off('click').on('click', (event) => {
                        this.handlePolygonClick( this.maps.tooltip_polygon[flrDetail.id][disLocation[i]], disLocation[i],true, event);
                    });
                } else {
                    console.log('undefined error...',i,disLocation[i])
                }
            }
            },500)
        
        } else{
            if(environment.env_key == 'twlive' && this.facilityId == '0003'){
                if(this.checkZoom == true && this.allFloorMap.hasOwnProperty(flrDetail.id) && (this.allFloorMap[flrDetail.id].getZoom() < -2.5 || this.allFloorMap[flrDetail.id].getZoom() >= 2)) {
                        for(let i in this.maps.text_polygon[flrDetail.id]){
                            if(this.maps.text_polygon[flrDetail.id][i].options.className == 'leaf-text-labels'){
                                this.allFloorMap[flrDetail.id].removeLayer(this.maps.text_polygon[flrDetail.id][i])
                            }
                        }
                } else if(this.checkZoom == true && this.allFloorMap.hasOwnProperty(flrDetail.id)){
                        for(let i in this.maps.text_polygon[flrDetail.id]){
                            if(this.maps.text_polygon[flrDetail.id][i].options.className == 'leaf-text-labels'){
                                this.allFloorMap[flrDetail.id].addLayer(this.maps.text_polygon[flrDetail.id][i])
                            }
                        }
                }
            } else{
            if(this.checkZoom == true && this.allFloorMap.hasOwnProperty(flrDetail.id) && this.allFloorMap[flrDetail.id].getZoom() >= 0 && this.removeLoc == false) {
                    for(let i in this.maps.text_polygon[flrDetail.id]){
                        try {
                        if(this.maps.text_polygon[flrDetail.id][i].options.className == 'leaf-text-labels'){
                            this.allFloorMap[flrDetail.id].removeLayer(this.maps.text_polygon[flrDetail.id][i])
                        }
                        } catch(e) {
                            console.log(e)
                        }
                    }
                this.removeLoc = true;
                this.addLoc = false;
            } else if(this.checkZoom == true && this.allFloorMap.hasOwnProperty(flrDetail.id) && this.allFloorMap[flrDetail.id].getZoom() < 0 && this.addLoc == false){
                    for(let i in this.maps.text_polygon[flrDetail.id]){
                        if(this.maps.text_polygon[flrDetail.id][i].options.className == 'leaf-text-labels'){                            
                            this.allFloorMap[flrDetail.id].addLayer(this.maps.text_polygon[flrDetail.id][i])
                        }
                    }
                    this.addLoc = true;
                    this.removeLoc = false;
            }
            }
        }
    }

    // ----------- leaflet-fullscreen package---------
    fullscreenLabel(floorid) {
        if(this.pathData == null) {
            if (this.allMapFullscreenToggle.hasOwnProperty(floorid)) {
                this.allFloorMap[floorid].removeControl(this.allMapFullscreenToggle[floorid]);
                delete this.allMapFullscreenToggle[floorid];
            }
    
            const fullscreenToggle = L.control.fullscreen({
                position: 'topleft',
            });
    
            this.allFloorMap[floorid].addControl(fullscreenToggle);
            this.allMapFullscreenToggle[floorid] = fullscreenToggle; 
        }
    }
            
    // Creating a new polygon in the floor map and saving
    toggleExpand() {
        if (this.selectedpolygon) {
            this.deselectPolygon(this.editPolygon);
        }
        this.isExpanded = true;
        this.drawnItems = new L.FeatureGroup();
        this.allFloorMap[this.floorId.value].addLayer(this.drawnItems);

        const options = {
            position: 'topright',
            shapeOptions: { showArea: true, clickable: true },
            draw: {
                circle: false,
                polyline: false,
                marker: false,
                circlemarker: false,
                rectangle: { showArea: false },
                polygon: true,
            },
            metric: true,
        };

        if (!this.drawControl) {
            this.drawControl = new L.Control.Draw(options);
        }
        if (this.isExpanded) {
            this.allFloorMap[this.floorId.value].off('draw:created');
            this.allFloorMap[this.floorId.value].addControl(this.drawControl);
            this.allFloorMap[this.floorId.value].on('draw:created', (event) => {
                const layer = event.layer;
                if (this.isPolygonWithinBounds(layer)) {
                    this.getCoordinate(this.drawnItems, event);  // Save the drawn coordinates
                }
                //  else {
                //     alert('The drawn polygon is outside the map bounds!');
                // }
            });
        } else {
            this.allFloorMap[this.floorId.value].removeControl(this.drawControl);
            this.allFloorMap[this.floorId.value].off('draw:created');
        }
    }

    getCoordinate(drawnItems, e, selectedpolygon?) {
        let layer = e.layer;
        let unit = 'metre';

        layer['unit'] = unit;
        let value = layer.toGeoJSON();
        value['unit'] = unit;

        let coordinates = [];
        if (value.geometry.type === "Point") {
            coordinates = value.geometry.coordinates;
        } else {
            const poly = value.geometry.coordinates;
            for (const subPoly of poly) {
                for (const point of subPoly) {
                    coordinates.push(unit === 'latlng' ? [point[0], point[1]] : [point[0] / 100, point[1] / -100]);
                }
            }
        }

        value.geometry.coordinates = coordinates;
        this.coordinates = JSON.stringify(value);

        drawnItems.addLayer(layer);
        if (selectedpolygon){
            this.openDialog(layer,this.coordinates,this.selectedpolygon);
        }else{
            this.openDialog(layer,this.coordinates);
        }
    }

    isPolygonWithinBounds(layer: L.Layer) {
        const mapBounds = this.allFloorMap[this.floorId.value].getBounds();
        return mapBounds.contains(layer.getBounds());
    }

    openDialog(layer,coordinates,polygon?) {
        const dialogRef = this.dialog.open(ManageLocationLeafletComponent, {
            panelClass: 'small-popup',
            width:'50%',
            minWidth:'300px',
            disableClose: true,
            data: {
                polygon :polygon,
                coordinates: coordinates,
                floorId: this.floorId.value,
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (this.selectedpolygon) {
                this.allFloorMap[this.floorId.value].removeLayer(this.selectedpolygon);
            }
            this.activeOptionCode = 'applyAll'
            this.EditPolygonOptions.forEach(option => {option.disabled = option.code !== 'applyAll'});              
            this.toggleExpand();
            this.removeIcons();
            if (layer !=null){
            this.drawnItems.removeLayer(layer);
            }
            this.coordinates = null;
            this.getUserPreference();
            this.hospitalService.getLogicalLocationWithChildren(this.floorId.value).subscribe(res => {
                if(res.statusCode == 1){
                    let floorLocations = res.results;
                    this.allFloorWithChildren[this.floorId.value] = floorLocations;
                    this.getFloorMap(floorLocations, this.floorId.value)
                }
            });
        });
    }

    //  highlights the selected polygon
    handlePolygonClick(polygon, locDetail, deselect?, event?) {
    let id = typeof locDetail === 'number' ? locDetail: typeof locDetail === 'object' && locDetail !== null? locDetail.id: null;
    if (!id) return;
    // To deselect already selected polygon again clicked and exit from function
    if (this.editPolygon === polygon) {
        this.deselectPolygon(this.editPolygon)
        this.editPolygon = null;
        return; 
    }
    if(this.isEditPolygon){
        if (this.isPolygonEditing === false){
        this.EditPolygonOptions.forEach(option => (option.disabled = false));
        if (this.editPolygon && deselect) {
            this.deselectPolygon(this.editPolygon);
        }
        if (this.editPolygon !== polygon ) {
           if(this.isEditPolygon){
            this.editPolygon = polygon;
                this.allFloorMap[this.floorId.value]?.removeControl(this.drawControl);
                polygon.setStyle({ color: 'red', weight: 3 });
                this.hospitalService.getLogicalLocationById(id).subscribe(res => {
                    this.selectedpolygon = res?.results?.[0];
                    try {
                        const labelStyle = this.selectedpolygon.labelStyle;
                        const parsedStyle = JSON.parse(labelStyle);
                        const webStyle = parsedStyle?.web || {};
                        const polygonStyle = parsedStyle?.polygon || {}; 
                        this.fontSize = webStyle?.["font-size"] ? webStyle?.["font-size"]?.replace("px", "") : "12";
                        this.selectedColor = polygonStyle?.fillColor ? polygonStyle.fillColor : this.selectedpolygon?.polygonStyle ? this.selectedpolygon.polygonStyle : 'blue';
                        this.strokeColor = polygonStyle?.color ? polygonStyle.color : this.selectedColor;
                        this.selectedOpacity = polygonStyle?.fillOpacity ? polygonStyle.fillOpacity : 0.2;
                    } catch {
                        this.fontSize = 12;
                        this.strokeColor = 'blue';
                        this.selectedColor = 'blue';
                        this.selectedOpacity = 0.2;
                    }
                });
           }
        }
    
        polygon.off('click').on('click', (event) => {
            if (id === this.selectedpolygon?.id) {
                this.deselectPolygon(polygon);
            } else {
                this.handlePolygonClick(polygon, locDetail, true, event);
            }
        });
     }
     } else if(event) {
        let floor = locDetail.parentId
        let location = this.allFloorWithChildren[floor].children.filter(val => val.id === id)[0]
        this.getTagCoordinate(location, floor, event)
     }
    }
    

    //remove style for selectedpolygon
    deselectPolygon(polygon) {
        polygon?.editing?.disable();
        polygon?.dragging?.disable();
        polygon?.transform?.disable();
        const stroke = this.strokeColor || this.selectedColor || 'blue';
        polygon?.setStyle({
            fillColor: this.selectedColor || 'blue',
            color: stroke,
            fillOpacity: this.selectedOpacity ?? 0.2,
            weight: this.strokeWidth
        });
        if (polygon && this.selectedpolygon&& this.editPolygon) {
            this.allFloorMap[this.floorId.value]?.removeLayer(this.selectedpolygon);
            this.allFloorMap[this.floorId.value]?.addLayer(this.editPolygon);
        } 
        this.editPolygon = null;
        this.selectedpolygon = null;
        this.removeIcons();
        this.selectedColor = null;
        this.strokeColor = null;
        this.selectedOpacity = null;
        this.isSettingOpen == true ?this.toggleExpand() : null;
    }

    // Enables dragging of the polygon.
    enablePolygonDrag(polygon,isLabel) {
        this.isPolygonEditing = true;
        const existingColorPicker = document.getElementById('color-picker-container');
        if (existingColorPicker) {
            existingColorPicker?.remove();
        }
        const existingStrokePicker = document.getElementById('stroke-color-picker');
        if (existingStrokePicker) {
            existingStrokePicker?.remove();
        }
        this.allFloorMap[this.floorId.value].removeLayer(polygon);
        this.allFloorMap[this.floorId.value].removeLayer(this.maps.text_polygon[this.floorId.value][this.selectedpolygon.id]);
        if(polygon?.marker){
            this.allFloorMap[this.floorId.value].removeLayer(polygon.marker);
        }
        polygon = L.polygon(polygon.getLatLngs(), { draggable: true, transform: true})
        polygon.setStyle({ color: 'red'});
        polygon.addTo(this.allFloorMap[this.floorId.value]);
        polygon.transform.enable();
        polygon.on('transformed', () => {
          this.updateDragedPolygon(polygon,isLabel);
          this.attachLabelMarker(polygon,isLabel); 
          this.updateLabelAppearance(polygon);
        });

        this.attachLabelMarker(polygon,isLabel);
        this.updateLabelAppearance(polygon);
        this.showSaveCancelIcons(polygon,polygon.updatedLabelPoint,polygon.updatedLabelAngle,isLabel);
    }

    updateDragedPolygon(polygon,isLabel){
        let updatedPoint = polygon.getBounds().getCenter();
        polygon.updatedLabelPoint = [updatedPoint.lng,updatedPoint.lat];
        if (polygon?.marker) {
            polygon.marker.setLatLng(updatedPoint);
        } else {
            this.attachLabelMarker(polygon,isLabel);
        }
    }
      
    // Enables editing of  polygon 
    handleEditClick(polygon,isLabel) {
        this.isPolygonEditing = true;
        const existingColorPicker = document.getElementById('color-picker-container');
        if (existingColorPicker) {
            existingColorPicker?.remove();
        }
        const existingStrokePicker = document.getElementById('stroke-color-picker');
        if (existingStrokePicker) {
            existingStrokePicker?.remove();
        }
        this.removeIcons();
        polygon.editing?.disable();
        polygon.dragging?.disable();
        polygon.transform?.disable();
        this.allFloorMap[this.floorId.value].removeLayer(polygon);
        this.allFloorMap[this.floorId.value].removeLayer(this.maps.text_polygon[this.floorId.value][this.selectedpolygon?.id]);
        if (polygon?.marker) {
          this.allFloorMap[this.floorId.value].removeLayer(polygon.marker);
        }
        polygon = L.polygon(polygon.getLatLngs(), {editable: true});
        polygon.addTo(this.allFloorMap[this.floorId.value]);
        polygon.editing?.enable();
        let updatedPoint = polygon.getBounds().getCenter();
        polygon.updatedLabelPoint = [updatedPoint.lng,updatedPoint.lat];
        
        polygon.on('edit', () => {
            let newCenter = polygon.getBounds().getCenter();
            polygon.updatedLabelPoint = [newCenter.lng, newCenter.lat];
            if (polygon?.marker) {
                polygon.marker.setLatLng(newCenter);
            } else {
                this.attachLabelMarker(polygon, isLabel);
            }
            this.updateLabelAppearance(polygon); 
        });
        
        this.attachLabelMarker(polygon,isLabel);
        this.updateLabelAppearance(polygon);
        this.showSaveCancelIcons(polygon,polygon.updatedLabelPoint,polygon.updatedLabelAngle,isLabel);
    }

    // Drag polygon label.
    handleLabelFunction(polygon) {
        this.isPolygonEditing = true;
        const existingColorPicker = document.getElementById('color-picker-container');
        if (existingColorPicker) {
            existingColorPicker?.remove();
        }
        const existingStrokePicker = document.getElementById('stroke-color-picker');
        if (existingStrokePicker) {
            existingStrokePicker?.remove();
        }
        let labelstyle,markerstyle;
        try {
            labelstyle = JSON.parse(this.selectedpolygon.labelStyle);
            markerstyle = JSON.parse(this.selectedpolygon.labelPoint);
            labelstyle.rotate = this.rotationAngle != null ? this.rotationAngle : labelstyle.rotate;
            markerstyle.rotate = this.rotationAngle != null ? this.rotationAngle : markerstyle.rotate;
        } catch {
            labelstyle = this.selectedpolygon.labelStyle;
        }
        let latLng = markerstyle?.point != null? L.latLng(markerstyle.point[1] * -100, markerstyle.point[0] * 100)
        : labelstyle?.point != null ? L.latLng(labelstyle.point[1] * -100, labelstyle.point[0] * 100)
        : polygon.getBounds().getCenter(); 
        polygon.updatedLabelPoint = [latLng.lng, latLng.lat]; // This stores display coordinates
        let rotationAngle = markerstyle?.rotate != null? markerstyle.rotate :  labelstyle.rotate 
        this.allFloorMap[this.floorId.value].removeLayer(this.maps.text_polygon[this.floorId.value][this.selectedpolygon.id])
        this.removeIcons(); 
        if(polygon?.marker){
            this.allFloorMap[this.floorId.value].removeLayer(polygon.marker);
        }
        try {
        this.attachLabelMarker(polygon,true);
        if (polygon.marker) polygon.marker.setLatLng(latLng);
        this.updateLabelAppearance(polygon);
        } catch (e) {
        const textMarkerIcon = L.divIcon({
            html: `<div id="${this.selectedpolygon.id}" style="display: flex; justify-content: flex-start;  transform: rotate(${rotationAngle|| 0}deg);font-size:${this.fontSize||12}px;width:max-content;color:#363636de">${this.selectedpolygon.name}</div>`,
            className: "leaflet-marker-div", 
            iconSize: [100, 20],
        });

        let currentMarker = L.marker(latLng, { className: 'leaflet-marker-div',icon: textMarkerIcon, draggable: true });
        polygon.marker = currentMarker;
        currentMarker.addTo(this.allFloorMap[this.floorId.value]);
        this.maps.text_polygon[this.floorId.value][this.selectedpolygon.id] = currentMarker;
        currentMarker.on('dragend', 
            this.updateDraggedLabel.bind(this, { polygon, latLng, textMarkerIcon }));
        };
        setTimeout(()=>{
        this.showSaveCancelIcons(polygon,this.updatedPoint, this.rotationAngle,true);
        },800)
    }

    updateDraggedLabel(markerDetail, event) {
        try {
            let newLatLng = event.target.getLatLng();
            let labelstyle,markerStyle;
            try {
                labelstyle = JSON.parse(this.selectedpolygon.labelStyle);
                markerStyle = JSON.parse(this.selectedpolygon.labelPoint)
            } catch {
                labelstyle = this.selectedpolygon.labelStyle || {};
                markerStyle = this.selectedpolygon.labelPoint || {};
            }

            this.updatedPoint = newLatLng;
            const storagePoint = [newLatLng.lng / 100, newLatLng.lat / -100];
            labelstyle = { ...labelstyle, point: storagePoint };
            this.selectedpolygon.labelStyle = JSON.stringify(labelstyle);
            markerStyle ={...markerStyle,point:storagePoint};
            this.selectedpolygon.labelPoint = JSON.stringify(markerStyle);
            if (markerDetail && markerDetail.polygon && markerDetail.polygon.marker) {
                markerDetail.polygon.marker.setLatLng(this.updatedPoint);
            }
            this.updateLabelAppearance(markerDetail.polygon);

            this.showSaveCancelIcons(markerDetail.polygon, this.updatedPoint, this.rotationAngle, true);
        } catch (e) {
            console.log(e);
        }
    }

   // rotate the label
   rotatePolygonLabel(polygon, angle, point) {
    this.isPolygonEditing = true;
    const existingColorPicker = document.getElementById('color-picker-container');
    if (existingColorPicker) {
        existingColorPicker?.remove();
    }
    const existingStrokePicker = document.getElementById('stroke-color-picker');
    if (existingStrokePicker) {
        existingStrokePicker?.remove();
    }
    try {
        let labelstyle,markerStyle;
        try {
            labelstyle = JSON.parse(this.selectedpolygon.labelStyle);
            markerStyle =JSON.parse(this.selectedpolygon.labelPoint)
        } catch {
            labelstyle = this.selectedpolygon.labelStyle || {};
            markerStyle = this.selectedpolygon.labelPoint ||{};
        }

        this.updatedPoint = point!= null? point : markerStyle?.point != null ? L.latLng(markerStyle.point[1] * -100, markerStyle.point[0] * 100) :labelstyle?.point != null ? L.latLng(labelstyle.point[1] * -100, labelstyle.point[0] * 100) : polygon.getBounds().getCenter();
        this.rotationAngle = (markerStyle?.rotate || labelstyle?.rotate || 0);
        this.rotationAngle = (this.rotationAngle + angle) % 360;
        polygon.updatedLabelAngle = this.rotationAngle;

        const storagePoint = [this.updatedPoint.lng / 100, this.updatedPoint.lat / -100];        
        labelstyle = { ...labelstyle, point: storagePoint, rotate: this.rotationAngle };
        markerStyle={point: storagePoint, rotate: this.rotationAngle };
        this.selectedpolygon.labelStyle = JSON.stringify(labelstyle);
        this.selectedpolygon.labelPoint = JSON.stringify(markerStyle);

            this.updateLabelAppearance(polygon);
        this.showSaveCancelIcons(polygon, this.updatedPoint, this.rotationAngle, true);
    } catch (e) {
        console.log(e);
    }
    }

    // increase or decrease font-size
    handlePolygonFontSize(polygon, type) {
        this.isPolygonEditing = true;
        const existingColorPicker = document.getElementById('color-picker-container');
        if (existingColorPicker) {
            existingColorPicker?.remove();
        }
        const existingStrokePicker = document.getElementById('stroke-color-picker');
        if (existingStrokePicker) {
            existingStrokePicker?.remove();
        }
        try {
            let labelstyle;
            try {
                labelstyle = JSON.parse(this.selectedpolygon.labelStyle || '{}');
            } catch {
                labelstyle = {};
            }
            if (typeof labelstyle.web === 'string') {
                try {
                    labelstyle.web = JSON.parse(labelstyle.web);
                } catch {
                    labelstyle.web = {};
                }
            } else {
                labelstyle.web = labelstyle.web || {};
            }
            let fontSize = labelstyle?.web["font-size"] ? labelstyle?.web?.["font-size"]?.replace("px", "") : "12";
            let currentSize = parseInt(fontSize, 10);
            if (type === 'increase' && currentSize < 16) {
                currentSize += 2;
            } else if (type === 'decrease' && currentSize > 8) {
                currentSize -= 2;
            }

            labelstyle.web["font-size"] = `${currentSize}px`;
            this.selectedpolygon.labelStyle = JSON.stringify(labelstyle);
            this.fontSize = currentSize;

            this.updateLabelAppearance(polygon);
        } catch (e) {
            console.log(e);
        }
    }

    // delete selectedPolygon
    handleDeleteClick() {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            panelClass: ['confirmation-popup'],
            data: {
            title: 'Confirmation',
            message: 'Are you sure you want to delete the location?',
            buttonText: {
                ok: 'Yes',
                cancel: 'No'
            }
            }
        });

        dialogRef.afterClosed().subscribe(result => {
        if (result === 'Yes') {
        this.hospitalService.deleteLocation(this.selectedpolygon?.id).subscribe({next: res => {
            this.toastr.success('Success', res.message);
            this.activeOptionCode = 'applyAll';
            this.EditPolygonOptions.forEach(option => {
                option.disabled = option.code !== 'applyAll';
            });
            this.toggleExpand();
            this.removeIcons();
            this.getUserPreference();
            this.hospitalService.getLogicalLocationWithChildren(this.floorId.value).subscribe(res => {
                if (res?.statusCode === 1 && res.results) {
                const floorLocations = res.results;
                this.allFloorWithChildren[this.floorId.value] = floorLocations;
                this.getFloorMap(floorLocations, this.floorId.value);
                }
            });
            },
            error: err => {
            this.toastr.warning('Warning', err.error?.message);
            }
        });
        }else{
            this.cancelEdit(this.editPolygon)
        }
        });
    }

    //show save and cancel icons
    showSaveCancelIcons(polygon, point?, rotateAngle?, isLabel?) {
        const map = this.allFloorMap[this.floorId.value];
        this.removeIcons(); 
        const iconContainer = L.DomUtil.create('div', 'popup-icons', document.body);
        Object.assign(iconContainer.style, {
            position: 'absolute',
            pointerEvents: 'auto',
            zIndex: '10000',
            display: 'flex',
            flexDirection: 'row',
            gap: '10px',
            alignItems: 'center',
            background: 'transparent'
        });
    
        const submenuContainer = L.DomUtil.create('div', 'submenu-icons', document.body);
        Object.assign(submenuContainer.style, {
            position: 'absolute',
            pointerEvents: 'auto',
            zIndex: '10001',
            display: 'flex',
            flexDirection: 'row',
            gap: '10px',
            alignItems: 'center',
            visibility: 'hidden'
        });
    
        const buttonStyle = {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor:'var(--primary-bg-color)',
            color: 'white',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer'
        };
    
        // Helper function to create buttons
        const createIconButton = (container, iconName, onClick) => {
            const icon = L.DomUtil.create('span', '', container);
            icon.innerHTML = `<i class="material-icons" style="font-size:15px;padding:0px">${iconName}</i>`;
            Object.assign(icon.style, buttonStyle);
            L.DomEvent.on(icon, 'click', (event) => {
                L.DomEvent.stopPropagation(event);
                    if (this.isThrottled) return;
                    this.isThrottled = true;
                    try {
                    onClick(event, icon);
                    } finally {
                    setTimeout(() => {this.isThrottled = false}, this.debounceTime);
                    }
            });
            return icon;
        };
    
        let submenuParentIconEl = null;
    
        if (isLabel) {
            createIconButton(iconContainer, 'crop_rotate', () =>
                this.rotatePolygonLabel(polygon, 15, this.updatedPoint)
            );
            createIconButton(iconContainer, 'text_increase', () =>
                this.handlePolygonFontSize(polygon, 'increase')
            );
            createIconButton(iconContainer, 'text_decrease', () =>
                this.handlePolygonFontSize(polygon, 'decrease')
            );
            createIconButton(iconContainer, 'format_color_fill', (ev) =>
                this.handlePolygoncolor(polygon, ev)
            );
            createIconButton(iconContainer, 'border_style', (ev) =>
                this.handleStrokeColor(polygon, ev)
            );
            createIconButton(iconContainer, 'drag_indicator',() =>
                this.enablePolygonDrag(polygon,isLabel)
            );
            createIconButton(iconContainer, 'edit', () =>
                this.handleEditClick(polygon,isLabel)
            );
        }
        createIconButton(iconContainer, 'save', () => {
            this.getUserPreference();
            this.savePolygon(polygon, false);
            this.removeIcons();
        });
    
        createIconButton(iconContainer, 'close', () => {
            this.getUserPreference();
            this.cancelEdit(polygon);
            this.removeIcons();
        });
    
        map.getContainer().appendChild(iconContainer);
        map.getContainer().appendChild(submenuContainer); // Append submenu container next to icon container
        const updateIconPosition = () => {
            const rect = map.getContainer().getBoundingClientRect();
            iconContainer.style.left = `${rect.width / 2 - iconContainer.offsetWidth / 2}px`;
            iconContainer.style.top = `10px`;
            if (submenuContainer.style.visibility === 'visible' && submenuParentIconEl) {
                const iconRect = submenuParentIconEl.getBoundingClientRect();
                submenuContainer.style.left = `${iconRect.left - rect.left}px`;
                submenuContainer.style.top = `${iconRect.bottom - rect.top + 5}px`;
            }
        };
    
        updateIconPosition();
        map.on('zoom move', updateIconPosition);
        polygon.on('move', updateIconPosition);
        polygon.on('edit', updateIconPosition);
        polygon.on('editvertex', updateIconPosition);
        polygon.on('transformed', updateIconPosition);
        if (point) polygon.updatedLabelPoint = [point.lng, point.lat];
        if (rotateAngle) polygon.updatedLabelAngle = rotateAngle;
        this.removeIcons = () => {
            iconContainer?.remove();
            submenuContainer?.remove();
            this.isEditPolygon = true;
            map.off('zoom move', updateIconPosition);
            polygon.off('move', updateIconPosition);
            polygon.off('edit', updateIconPosition);
            polygon.off('editvertex', updateIconPosition);
            polygon.off('transformed', updateIconPosition);
        };
        map.on('click', () => {
            submenuContainer.style.visibility = 'hidden';
        });
    }
    
    // Saves the polygon with updated coordinates.
    savePolygon(polygon, isEditPolygonInfo) {
        this.isPolygonEditing = false;
        this.selectedColor = this.selectedColor??'blue';
        this.strokeColor = this.strokeColor || this.selectedColor;
        polygon.setStyle({fillColor: this.selectedColor,color: this.showPolygonBorder ? this.strokeColor : 'transparent',fillOpacity: this.selectedOpacity||0.2,weight:this.strokeWidth});
        this.allFloorMap[this.floorId.value]?.removeLayer(this.maps?.text_polygon[this.floorId.value][this.selectedpolygon?.id]);
        this.allFloorMap[this.floorId.value]?.removeLayer(polygon);
        let labelstyle,markerStyle;
        try{
            labelstyle = this.selectedpolygon?.labelStyle ? JSON.parse(this.selectedpolygon.labelStyle) : {};
        }catch {
            labelstyle = this.selectedpolygon?.labelStyle || {};
        }
        try{
            markerStyle = this.selectedpolygon?.labelPoint ? JSON.parse(this.selectedpolygon.labelPoint) : {};
        }catch {
            markerStyle = this.selectedpolygon?.labelPoint || {};
        }
        polygon?.editing?.disable();
        polygon?.dragging?.disable();
        polygon?.transform?.disable();
        this.activeOptionCode = 'applyAll';
        this.EditPolygonOptions.forEach(option => {option.disabled = option.code !== 'applyAll';});          
        let coordinates = polygon?.getLatLngs()?.[0]? polygon?.getLatLngs()[0].map(point => [point?.lng / 100, point?.lat / -100]): null;
        let rawPoint = null;
        if (
            Array.isArray(polygon?.updatedLabelPoint) &&
            polygon.updatedLabelPoint.length === 2 &&
            polygon.updatedLabelPoint[0] != null &&
            polygon.updatedLabelPoint[1] != null &&
            !isNaN(polygon.updatedLabelPoint[0]) &&
            !isNaN(polygon.updatedLabelPoint[1])
        ) {
            rawPoint = [Number(polygon.updatedLabelPoint[0]) / 100, Number(polygon.updatedLabelPoint[1]) / -100];
        } else if (markerStyle?.point) {
            rawPoint = markerStyle.point; 
        } else if (labelstyle?.point) {
            rawPoint = labelstyle.point;
        }
        if (typeof rawPoint === "string") {
           rawPoint = JSON.parse(rawPoint);
        }

        if (rawPoint && rawPoint.lat !== undefined && rawPoint.lng !== undefined) {
            rawPoint = [rawPoint.lng, rawPoint.lat];
        }

        if (rawPoint && rawPoint.point) {
            rawPoint = rawPoint.point;
        }
        this.selectedpolygon.point = Array.isArray(rawPoint) ? rawPoint : null;
        this.selectedpolygon.rotateAngle = polygon?.updatedLabelAngle != null? polygon?.updatedLabelAngle: markerStyle ? markerStyle?.rotate: labelstyle ? labelstyle?.rotate : null;
        this.isEditPolygon = true;
        if (this.selectedpolygon && this.selectedpolygon?.coordinates) {
            try {
                let parsedCoordinates = JSON.parse(this.selectedpolygon?.coordinates);
                parsedCoordinates.geometry.coordinates = coordinates;
                this.selectedpolygon.coordinates = JSON.stringify(parsedCoordinates);
            } catch (error) {
                console.error("Error parsing coordinates:", error);
            }
        }
            if (isEditPolygonInfo) {
                this.openDialog(this.drawnItems, this.selectedpolygon?.coordinates, this.selectedpolygon);
                return;
            } 
            let labelStyleWeb, labelStyleMobile, polygonLabelStyle;
            labelStyleWeb = labelstyle?.web;
            labelStyleMobile = labelstyle?.mob;
            labelstyle.web = {...labelstyle.web,['font-size']: `${this.fontSize}px` || "12px"};
            polygonLabelStyle = {color: this.showPolygonBorder ? this.strokeColor : 'transparent',fillColor: this.selectedColor,fillOpacity: this.selectedOpacity || 0.2,opacity:1,weight:this.strokeWidth};
            let updatedLabelStyle = JSON.stringify({ web: labelStyleWeb, mob: labelStyleMobile, point: this.selectedpolygon?.point, rotate: this.selectedpolygon?.rotateAngle, polygon: polygonLabelStyle});
            let updatedLabelPoint =JSON.stringify({point: this.selectedpolygon?.point, rotate: this.selectedpolygon?.rotateAngle});
            let data = {
                locationTypeId: this.selectedpolygon?.locationTypeId,
                name: this.selectedpolygon?.name,
                status: this.selectedpolygon?.status?.value,
                polygonStyle: this.selectedColor ?? this.selectedpolygon?.polygonStyle?.value,
                locationCategoryId: this.selectedpolygon?.locationCategoryId,
                careSettingId: this.selectedpolygon?.careSettingId,
                logicalParentId: this.selectedpolygon?.logicalParentId,
                parentId: this.selectedpolygon?.parentId,
                coordinates: this.selectedpolygon?.coordinates,
                shortName: this.selectedpolygon?.shortName,
                locationIdentifier: this.selectedpolygon?.locationIdentifier,
                locationDescription: this.selectedpolygon?.locationDescription,
                labelStyle: updatedLabelStyle,
                labelPoint: updatedLabelPoint,
                id: this.selectedpolygon?.id
            };
            this.hospitalService.editLocation(data).subscribe({next: res => {
                    this.toastr.success('Success', res.message);
                    let floorData = this.allFloorWithChildren[this.floorId.value];
                    if (!floorData) return;
                    let polygonData = this.findPolygonData(floorData, this.selectedpolygon?.id);
                    if (!polygonData) return;
                    //updated the selected polygon with updated data in locally
                    polygonData.coordinates = data.coordinates;
                    polygonData.labelStyle = updatedLabelStyle;
                    polygonData.labelPoint = updatedLabelPoint;
                    Object.assign(polygonData, { 
                        ...this.selectedpolygon,
                        coordinates: data?.coordinates,
                        labelStyle: updatedLabelStyle,
                        labelPoint: updatedLabelPoint
                    });
                    let parsedCoordinates = JSON.parse(data?.coordinates);
                    let updatedCoordinates = parsedCoordinates?.geometry?.coordinates?.map(([lng, lat]) =>
                        new L.LatLng(lat * -100, lng * 100)
                    );
                    let polygon = this.maps?.tooltip_polygon[this.floorId.value][this.selectedpolygon?.id];
                    polygon.setLatLngs(updatedCoordinates);
                    polygon.setStyle({fillColor: polygon?.options?.fillColor || this.selectedColor,color:this.showPolygonBorder ? (polygon?.options?.color || this.strokeColor):'transparent',fillOpacity: polygon?.options?.fillOpacity || this.selectedOpacity,weight: this.strokeWidth});
                    let labelCoordinates;
                    if (
                        Array.isArray(this.selectedpolygon?.point) &&
                        this.selectedpolygon.point.length === 2 &&
                        !isNaN(this.selectedpolygon.point[0]) &&
                        !isNaN(this.selectedpolygon.point[1])) {
                        labelCoordinates = L.latLng(this.selectedpolygon.point[1] * -100, this.selectedpolygon.point[0] * 100);
                    } else {
                        labelCoordinates = polygon.getBounds().getCenter();
                    }
                    if (polygon?.marker) {
                        this.allFloorMap[this.floorId.value]?.removeLayer(polygon.marker);
                    }
                    let textMarkerIcon = L.divIcon({
                        html: `<div id="${this.selectedpolygon?.id}" style="display: flex; justify-content: flex-start;  transform: rotate(${this.selectedpolygon.rotateAngle || 0}deg);font-size:${this.fontSize||12}px;width:max-content;color:#363636de">${this.selectedpolygon.name}</div>`,
                        className: "leaflet-marker-div", 
                        iconSize: [100, 20],
                    });    
                    polygon.marker = L.marker(labelCoordinates, { className: 'leaflet-marker-div',icon: textMarkerIcon})
                    polygon.marker.addTo(this.allFloorMap[this.floorId.value]);
                    this.maps.text_polygon[this.floorId.value][this.selectedpolygon.id] = polygon?.marker;
                    this.editPolygon = this.maps?.tooltip_polygon[this.floorId.value][this.selectedpolygon?.id];
                    polygon.marker.off('click').on('click', (event) => {
                        this.handlePolygonClick(polygon, polygonData, true, event);
                    });
                    polygon.off('click').on('click', (event) => {
                        this.handlePolygonClick(polygon, polygonData, true, event);
                    });                   
                    this.handlePolygonClick(polygon, polygonData, true, null);
                    this.handlePolygonClick(polygon, polygonData, true, null); 
                    this.removeIcons();
                    this.coordinates = null;
                    this.selectedpolygon = null;
                    this.rotationAngle = null;
                    this.updatedPoint = null;
                    this.selectedColor = null;
                    this.strokeColor = null;
                    this.selectedOpacity = null;
                    this.isDebouncing = false;
                    this.isThrottled = false;
                },
                error: err => {
                    this.toastr.error('Error', `${err.error.message}`);
                    this.isDebouncing = false;
                    this.isThrottled = false;
                }
            });
    }
    
    // Cancels editing mode of polygon.
    cancelEdit(polygon) {
        this.isPolygonEditing = false;
        this.isEditPolygon = true;
        polygon?.editing?.disable();
        polygon?.dragging?.disable();
        polygon?.transform?.disable();
        this.allFloorMap[this.floorId.value]?.removeLayer([this.selectedpolygon?.id]);
        this.allFloorMap[this.floorId.value]?.removeLayer(this.maps?.text_polygon[this.floorId.value][this.selectedpolygon?.id]);
        this.activeOptionCode = 'applyAll';
        this.EditPolygonOptions.forEach(option => (option.disabled = false));
        this.removeIcons();
        this.updatedPoint = null;
        this.rotationAngle = null;
        if (polygon && this.selectedpolygon&& this.editPolygon) {
            this.allFloorMap[this.floorId.value]?.removeLayer(this.selectedpolygon);
        }
        const floorData = this.allFloorWithChildren[this.floorId.value];
        if (!floorData) return;
        const polygonData = this.findPolygonData(floorData,this.selectedpolygon?.id);
        let parsedCoordinates, labelStyle, markerStyle;
        try {
            parsedCoordinates = JSON.parse(polygonData?.coordinates);
            labelStyle = markerStyle = JSON.parse(polygonData?.labelStyle);
        } catch (error) {
            console.log("Error parsing polygon data:", error);
            return;
        }
        this.editPolygon = null;
        this.selectedpolygon = null;
        const updatedCoordinates = parsedCoordinates?.geometry?.coordinates.map(([lng, lat]) =>
            new L.LatLng(lat * -100, lng * 100)
        );
        polygon.setLatLngs(updatedCoordinates);
        let fontSize = labelStyle?.web?.['font-size']?.replace('px','')
        const polygonStyle = labelStyle?.polygon || {};
        polygon.setStyle({
            fillColor: polygonStyle?.fillColor ?? 'blue',
            color: this.showPolygonBorder ? (polygonStyle?.color??'blue'):'transparent' ,
            fillOpacity: polygonStyle?.fillOpacity ?? 0.2,
            weight: this.strokeWidth ?? 0.2
        });
        let point = polygon?.getBounds()?.getCenter();
        let labelCoordinates = markerStyle?.point? [markerStyle?.point[1] * -100, markerStyle?.point[0] * 100] :labelStyle?.point? [labelStyle?.point[1] * -100, labelStyle?.point[0] * 100] :[point?.lat,point?.lng] ;
        polygon.updatedLabelAngle = markerStyle ? markerStyle?.rotate :labelStyle?.rotate;
        if (polygon?.marker) {
            this.allFloorMap[this.floorId.value].removeLayer(polygon.marker);
        }
        const textMarkerIcon = L.divIcon({
            html: `<div id="${polygonData?.id}" style="display: flex; justify-content: flex-start; transform: rotate(${polygon?.updatedLabelAngle || 0}deg); font-size: ${fontSize || 12}px;width:max-content;color:#363636de">${polygonData?.name}</div>`,
            className: "leaflet-marker-div",
            iconSize: [100, 20]
        });
        polygon.marker = L.marker(labelCoordinates, {
            className: 'leaflet-marker-div',
            icon: textMarkerIcon
        });
        polygon.marker.addTo(this.allFloorMap[this.floorId.value]);
        this.maps.text_polygon[this.floorId.value][polygonData?.id] = polygon?.marker;
        polygon.marker.off('click').on('click', (event) => {
            this.handlePolygonClick(polygon,polygonData,true, event);
        });
        polygon.off('click').on('click', (event) => {
            this.handlePolygonClick(polygon,polygonData,true, event);
        });
        this.handlePolygonClick(polygon,polygonData,true, null);
        this.coordinates = null;
        this.selectedpolygon = null;
        this.rotationAngle = null;
        this.updatedPoint = null;
        this.selectedColor = null;
        this.strokeColor = null;
        this.selectedOpacity = null;
        this.isDebouncing = false;
        this.isThrottled = false;
    }
    
    // Removes Save and Cancel icons .
    removeIcons() {
        const iconContainer = document.getElementById('popupIcons');
        if (iconContainer) {
            iconContainer.remove();
        }
        const colorPicker = document.getElementById('color-picker-container');
        if (colorPicker) {
            colorPicker.remove();
        }
        const strokeColorPicker = document.getElementById('stroke-color-picker');
        if (strokeColorPicker) {
            strokeColorPicker.remove();
        }
    }

    // To find Matching Polygon Id in floorData locally when cancel  editing polygon data from local data
    findPolygonData(parent, targetId){
    if (!parent) return null;
    if (parent.id === targetId) return parent;
    if (Array.isArray(parent?.children)) {
        for (const child of parent?.children) {
            const found = this.findPolygonData(child, targetId);
            if (found) return found;
        }
    }
    return null;
    }

    applyFilter(filterValue) {
        if (filterValue != null && filterValue.trim() !== "") {
          filterValue = filterValue.trim().toLowerCase();
          const filteredData = this.tabData.filter(element =>element.tan.toLowerCase().includes(filterValue) ||element.tid.toLowerCase().includes(filterValue));
          this.tabData = filteredData.length > 0 ? filteredData :this.tabData;
        } else{
          this.tabData=this.tabData;
        }
      }


    ///// OLD CODE LOCATION SHOW/HIDE FUNCTIONALITY /////
    // checkZoomLevel(displayLoc) {
    //     // console.log('check zoom level')
    //     if(environment.env_key == 'twlive' && this.facilityId == '0003'){
    //         if(this.checkZoom == true && this.floorMap && (this.floorMap.getZoom() < -2.5 || this.floorMap.getZoom() >= 2)) {
    //             if(this.maps.text_polygon.length > 0){
    //                 for(let i=0; i < this.maps.text_polygon.length; i++){
    //                     if(this.maps.text_polygon[i].options.className == 'leaf-text-labels'){
    //                     this.floorMap.removeLayer(this.maps.text_polygon[i])
    //                     }
    //                 }
    //             }
    //         } else if(this.checkZoom == true && this.floorMap){
    //             if(this.maps.text_polygon.length > 0){
    //                 for(let i=0; i < this.maps.text_polygon.length; i++){
    //                     if(this.maps.text_polygon[i].options.className == 'leaf-text-labels'){
    //                     this.floorMap.addLayer(this.maps.text_polygon[i])
    //                     }
    //                 }
    //             }
    //         }
    //     } else{
    //     if(this.checkZoom == true && this.floorMap && this.floorMap.getZoom() >= 0 && this.removeLoc == false) {
    //         if(this.maps.text_polygon.length > 0){
    //             for(let i=0; i < this.maps.text_polygon.length; i++){
    //                 if(this.maps.text_polygon[i].options.className == 'leaf-text-labels'){
    //                 this.floorMap.removeLayer(this.maps.text_polygon[i])
    //                 }
    //             }
    //         }
    //         this.removeLoc = true;
    //         this.addLoc = false;
    //     } else if(this.checkZoom == true && this.floorMap && this.floorMap.getZoom() < 0 && this.addLoc == false){
    //         if(this.maps.text_polygon.length > 0){
    //             for(let i=0; i < this.maps.text_polygon.length; i++){
    //                 if(this.maps.text_polygon[i].options.className == 'leaf-text-labels'){
    //                 this.floorMap.addLayer(this.maps.text_polygon[i])
    //                 }
    //             }
    //             this.addLoc = true;
    //             this.removeLoc = false;
    //         }
    //     }
    //     }
    //     if(this.tagOptions.selectedTag != null){
    //         if(this.tagOptions.selectedTag['sourceNode'] != undefined){
    //             this.showYourLoc = true;
    //         } else{
    //             this.showYourLoc = false
    //         }
    //     } else if(this.tagOptions.selectedTag == null){
    //         this.showYourLoc = false;
    //     }
    // }
    changeView(floorid, a) {
        this.blockView['active'] = !this.blockView['active']
        this.tabData = [];
        this.tabValue = [];
        if(this.blockView['active']) {
            this.blockView['col'] = Math.ceil(this.floorList.length/2)
            for(let i =0; i < this.floorList.length; i++){
                this.getLocationsByFloor(this.floorList[i]['id']);
            }
        } else {
            this.onFloorChange(floorid)
        }
    }
    ngOnDestroy(): void {
        if(this.client) {
            this.client.end(true);
            console.log('client disconnected..')
        }
        if(this.tagMessageSub) {
            this.tagMessageSub.unsubscribe();
        }
        if(this.interval){
            clearInterval(this.interval);
        }
        if(this.tagRefreshInterval) {
            clearInterval(this.tagRefreshInterval);
        }
        if(this.leafRef == undefined || !this.leafRef){
            if(this.blockExist && this.allFloorMap[this.floorId.value]){
                this.getUserPreference()
            }
        }
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
        }
    }
    downloadPdf(map) {
        const mapElement = document.getElementById(map);
        let element = this.reqTagDetail;
        html2canvas(element, {
            logging: false
        });
        html2canvas(mapElement, { useCORS: true }).then(canvas => {
            const imageDataUrl = canvas.toDataURL();
            element['mapElement'] = imageDataUrl;
            this.hazmatPdfService.pdfCreate(element);
        });
    }

    updateDisabledStates(): void {
        this.mapOptionFilter = this.mapOptionFilter.map((filter) => {
            if (filter.code === 'heatMap') {
                filter.disabled = !this.navigationHeatData[this.floorId.value] || this.navigationHeatData[this.floorId.value].length === 0;
            } else if (filter.code === 'readers') {
                this.mapFilter.floorReaders = this.mapFilter.readerList.filter(res => res.floorId == this.floorId.value && res.readerTypeId != 'RT-POMS');
                this.mapFilter.floorInjectors = this.mapFilter.injectorList.filter(res => res.floorId == this.floorId.value);
                this.selectedTagFilters = this.selectedTagFilters.filter(item => item !== 'readers');
                this.selectedTagFilters = this.selectedTagFilters.filter(item => item !== 'lable');
                this.selectedTagFilters = this.selectedTagFilters.filter(item => item !== 'mapPath');
                this.selectedTagFilters = this.selectedTagFilters.filter(item => item !== 'distance');
                filter.disabled = this.mapFilter.floorReaders.length === 0;
            } else if (filter.code === 'cctv') {
                this.selectedTagFilters = this.selectedTagFilters.filter(item => item !== 'cctv');
                filter.disabled = this.mapFilter.floorCctvAssets.length === 0;
            } else if (filter.code === 'dispenser') {
                filter.disabled = this.mapFilter.floorDispenser.length === 0;
            } else if (filter.code === 'mapPath') {
                filter.disabled = this.mapFilter.pathData.length === 0;
            } else if (filter.code === 'sound'){
                filter.disabled = this.mapFilter.floorSensors.length === 0;
            }
            return filter;
        });
    }

    onFilterClick(filter: any, type: string): void {
        if (type === 'single') {
            if (filter.code === 'TAT-DAT' || filter.code === 'TAT-AT') {
                const otherCode = filter.code === 'TAT-DAT' ? 'TAT-AT' : 'TAT-DAT';
                const otherIndex = this.selectedDisassociateFilters.indexOf(otherCode);
    
                if (otherIndex > -1) {
                    this.selectedDisassociateFilters.splice(otherIndex, 1);
                }
    
                const index = this.selectedDisassociateFilters.indexOf(filter.code);
                if (index > -1) {
                    this.selectedDisassociateFilters.splice(index, 1);
                } else {
                    this.selectedDisassociateFilters.push(filter.code);
                    this.setFilterOption(filter.code, false);
                }
            }
        } else if (filter === 'All') {
            const isAllSelected =
                this.selectedTagFilters.length === this.filterTags.length + 1 &&
                this.selectedTagFilters.includes('TAT-SS');
    
            if (isAllSelected) {
                this.selectedTagFilters = [];
                this.filterTags.forEach(tag => this.setFilterOption(tag.code, true));
                this.setFilterOption('TAT-SS', true);
            } else {
                this.selectedTagFilters = this.filterTags.map(tag => tag.code);
                if (!this.selectedTagFilters.includes('TAT-SS')) {
                    this.selectedTagFilters.push('TAT-SS');
                }
                this.filterTags.forEach(tag => this.setFilterOption(tag.code, false));
                this.setFilterOption('TAT-SS', false);
            }
        } else {
            const index = this.selectedTagFilters.indexOf(filter.code);
            if (index === -1) {
                this.selectedTagFilters.push(filter.code);
                this.setFilterOption(filter.code, false);
            } else {
                this.selectedTagFilters.splice(index, 1);
                this.setFilterOption(filter.code, true);
    
                const isAllSelected =
                    this.selectedTagFilters.length === this.filterTags.length + 1 &&
                    this.selectedTagFilters.includes('TAT-SS');
                if (!isAllSelected) {
                    const allIndex = this.selectedTagFilters.indexOf('All');
                    if (allIndex !== -1) {
                        this.selectedTagFilters.splice(allIndex, 1);
                    }
                }
            }
        }
    }
    

    setFilterOption(code: string, state: boolean): void {
        if (code === 'readers') {
            this.filterOptions.readerFilter = state;
            this.getReadercoord('show');
            this.getInjectorcoord('show');
        } else if (code === 'cctv') {
            this.filterOptions.cctvFilter = state;
            this.getCctvcoord('show');
        } else  if (code === 'dispenser') {
            this.filterOptions.readerFilter = state;
            this.getDispensercoord('show');
        } else if (code === 'heatMap') {
            this.filterOptions.heatFilter = state;
            this.getHeatmap('open', null);
        } else if (code === 'mapPath') {
            this.filterOptions.pathFilter = state;
            this.getPath('show');
        } else if (code === 'distance') {
            this.filterOptions.distFilter = state;
            this.getDistance();
        } else if (code === 'lable') {
            this.filterOptions.labelFilter = state;
            this.showLabel();
        } else if (code === 'TAT-SS') {
            this.filterOptions.sensorFilter = state;
            this.getSoundSensor('show')
        } else {
            this.showTagOverlay(code);
        }
    }

    mapFilterOpen(){
        this.isNewMapFilter = !this.isNewMapFilter;
        this.resizeListener = () => this.updateContainerWidth();
        window.addEventListener('resize', this.resizeListener);
        this.updateDisabledStates;
        this.updateContainerWidth;
    }

    navigate() {
        this.isNavigate = !this.isNavigate
    }

    ngAfterViewInit(): void {
        this.updateContainerWidth();
        this.updateButtonVisibility();
        this.getAssociatedTags();
    }

    scrollLeft(): void {
        if (this.scrollContainer) {
            this.scrollContainer.nativeElement.scrollBy({ left: -200, behavior: 'smooth' });
        }
    }
    
    scrollRight(): void {
        if (this.scrollContainer) {
            this.scrollContainer.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
        }
    }

    onScroll(): void {
        this.updateButtonVisibility();
    }

    private updateContainerWidth(): void {
        if (!this.filterContainer?.nativeElement) {
            console.warn('Filter container not initialized!');
            return;
        }
        const zoomFactor = window.devicePixelRatio || 1;
        let viewportWidth = window.innerWidth;
        if (viewportWidth <= 768) {
            viewportWidth += 250;
        } else {
            viewportWidth -= 100;
        }
        const containerWidth = Math.min(viewportWidth * 0.8, 1000) / zoomFactor;
        const element = this.filterContainer.nativeElement;
        element.style.width = `${containerWidth}px`;
    
        this.updateButtonVisibility();
    }
    
    private updateButtonVisibility(): void {
        const element = this.scrollContainer.nativeElement;
        const isScrollable = element.scrollWidth > element.offsetWidth;
        const tolerance = 1;
        const isAtStart = element.scrollLeft <= 0 + tolerance;
        const isAtEnd = element.scrollLeft + element.offsetWidth >= element.scrollWidth - tolerance;
    
        this.showLeftButton = isScrollable && !isAtStart;
        this.showRightButton = isScrollable && !isAtEnd;
        this.cdr.detectChanges();
    }

    polygonEditMode(){
        this.isEditPolygon = !this.isEditPolygon;
        this.isSettingOpen == false ? this.toggleExpand() : null;
        if(this.isEditPolygon){
            setTimeout(() => {
                this.toggleEditMenu();
            }, 500);
        } else {
            this.isSettingOpen = false;
            this.allFloorMap[this.floorId.value].removeControl(this.drawControl);
            this.EditPolygonOptions.forEach(option => (option.disabled = false));
        }
    }

    toggleEditMenu() {
        this.isSettingOpen = !this.isSettingOpen;
        if(this.isSettingOpen ==false && this.selectedpolygon){
        this.deselectPolygon(this.editPolygon)
        }
        this.toggleExpand();
        this.activeOptionCode = 'applyAll';
    }

    onOptionClick(item : any) {
        if (this.isDebouncing) return;

        this.isDebouncing = true;
        setTimeout(() => (this.isDebouncing = false), this.debounceTime); 

        if (item === 'applyAll' && this.selectedpolygon) {
          return;
        }
        if (item === this.activeOptionCode && item !== 'applyAll') {
            return;
        }
            this.activeOptionCode = item;
            const actionMap = {
                drawPolygon: () => this.enablePolygonDrag(this.editPolygon,false),
                drawRectangle: () => this.handleEditClick(this.editPolygon,false),
                drawMarker: () => this.savePolygon(this.editPolygon,true),
                editLabel: () => this.handleLabelFunction(this.editPolygon),
                applyAll: () => this.mapConfig(),
                delete: () => this.handleDeleteClick()
        };
    
        if (actionMap[this.activeOptionCode]) {
            actionMap[this.activeOptionCode]();
        }
        this.EditPolygonOptions.forEach(option => {
            option.disabled = option.code !== item;
        });
    }
    
    getDisabledState(code){
    if (code === 'applyAll') {
     return this.selectedpolygon !== null;  
    }
    if (!this.selectedpolygon) return true;
    return this.activeOptionCode !== 'applyAll' && this.activeOptionCode !== code;
    }

    drawEllipses(point1, point2) {  
        let lat1,lng1,lat2,lng2
        lat1 = point1.lat,  lng1 = point1.lng
        lat2 = point2.lat,  lng2 = point2.lng
        const toRadians = (degrees) => (degrees * Math.PI) / 180; // degress to radian 
        // Earth's radius in km
        const R = 6371;
        // Calculate distance using haversine formula
        const dLat = toRadians(lat2 - lat1);
        const dLng = toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 +Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // distance between 2 points in metres
        const semiMajorAxis = distance * 0.5 ; // half of distance
        const semiMinorAxis = semiMajorAxis * 0.3; // 0.3 of semiMajor axis
        const rotationAngle = Math.atan2(lng2 - lng1, lat2 - lat1);//directionAngle
        const drawEllipse = (semiMajor, semiMinor, color) => {
            const centerLat = lat1 + (semiMajor * Math.cos(rotationAngle)) / R * (180 / Math.PI);
            const centerLng = lng1 + (semiMajor * Math.sin(rotationAngle)) / (R * Math.cos(toRadians(lat1))) * (180 / Math.PI);
            const ellipsePoints = [];
            const ellipseCount = 36;  // Number of points to draw ellipse
            for (let i = 0; i < ellipseCount; i++) {
                const ellipseAngle = (i * 2 * Math.PI) / ellipseCount; // rotation angle for each  points
                const x = semiMajor * Math.cos(ellipseAngle);
                const y = semiMinor * Math.sin(ellipseAngle);
                // Apply the rotation to the ellipse points
                const rotatedX = x * Math.cos(rotationAngle) - y * Math.sin(rotationAngle);
                const rotatedY = x * Math.sin(rotationAngle) + y * Math.cos(rotationAngle);
                const lat = centerLat + rotatedX / R * (180 / Math.PI);
                const lng = centerLng + rotatedY / (R * Math.cos(toRadians(centerLat))) * (180 / Math.PI);

                ellipsePoints.push([lat, lng]);
            }
            
            if (this.allFloorMap && this.allFloorMap[this.floorId.value]) {
                const ellipsePolygon = L.polygon(ellipsePoints, {
                    color: color,
                    fillOpacity: 0, 
                });
                ellipsePolygon.addTo( this.allFloorMap[this.floorId.value])
            }
        };
        drawEllipse(semiMajorAxis * 0.3, semiMinorAxis * 0.3, 'red');
        drawEllipse(semiMajorAxis * 0.7, semiMinorAxis * 0.7, 'orange');
        drawEllipse(semiMajorAxis, semiMinorAxis, 'yellow');
    } 

    handlePolygoncolor(polygon,event){
        const existingPicker = document.getElementById('color-picker-container');
        if (existingPicker) {
            existingPicker.remove();
        }
        const existingStrokePicker = document.getElementById('stroke-color-picker');
        if (existingStrokePicker) {
            existingStrokePicker?.remove();
        }
        const currentFillColor = this.colorToHexColorConvertor(polygon.options.fillColor || this.selectedColor);
        const currentFillOpacity = polygon.options.fillOpacity ?? 0.2;
        this.selectedColor = currentFillColor;
        this.selectedOpacity = currentFillOpacity;
    
        const pickerContainer = document.createElement('div');
        pickerContainer.id = 'color-picker-container';
        Object.assign(pickerContainer.style, {
            position: 'absolute',
            zIndex: '1000',
            padding: '10px',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '5px',
            boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            left: `${event.clientX}px`,
            top: `${event.clientY}px`
        });
    
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.style.cssText = 'border:none;background:transparent;width:40px;height:40px;cursor:pointer';
        colorPicker.value = currentFillColor;

        // Display current color hexColor code
        const colorCodeDisplay = document.createElement('div');
        colorCodeDisplay.classList.add('ovi-lbl-text-size')
        colorCodeDisplay.textContent =`Color: ${currentFillColor}`;

        const opacitySlider = document.createElement('input');
        opacitySlider.type = 'range';
        opacitySlider.min = '0';
        opacitySlider.max = '1';
        opacitySlider.step = '0.1';
        opacitySlider.value = currentFillOpacity.toString();
        opacitySlider.style.cssText = 'width:100px;cursor:pointer';

        // Display current color fillOpacity
        const opacityValueDisplay = document.createElement('div');
        opacityValueDisplay.classList.add('ovi-lbl-text-size')
        opacityValueDisplay.textContent = `Opacity: ${currentFillOpacity}`;

        const onColorInput = (event: any) => {
            this.selectedColor = event.target.value;
            this.strokeColor = event.target.value;
            colorCodeDisplay.textContent = `Color: ${this.selectedColor}`;
            polygon?.setStyle({fillColor: this.selectedColor, fillOpacity: parseFloat(opacitySlider.value),color: this.showPolygonBorder ? this.strokeColor : 'transparent',weight:this.strokeWidth});
        }
        const onOpacityInput = (event: any) => {
            this.selectedOpacity = parseFloat(event.target.value);
            opacityValueDisplay.textContent = `Opacity: ${this.selectedOpacity}`;
            polygon?.setStyle({fillColor: this.selectedColor, fillOpacity: this.selectedOpacity,color: this.showPolygonBorder ? this.strokeColor : 'transparent',weight:this.strokeWidth});
        };
        colorPicker.addEventListener('input', onColorInput);
        opacitySlider.addEventListener('input', onOpacityInput);
        pickerContainer.appendChild(colorPicker);
        pickerContainer.appendChild(colorCodeDisplay);
        pickerContainer.appendChild(opacitySlider);
        pickerContainer.appendChild(opacityValueDisplay);
        document.body.appendChild(pickerContainer);
    
        const removePicker = (e) => {
            if (!pickerContainer.contains(e.target)) {
                colorPicker.removeEventListener('input', onColorInput);
                opacitySlider.removeEventListener('input', onOpacityInput);
                pickerContainer.remove();
                document.removeEventListener('click', removePicker);
            }
        };
    
        setTimeout(() => {
            document.addEventListener('click', removePicker);
        }, 200);
    }
    
    handleStrokeColor(polygon, event) {
        const existingPicker = document.getElementById('stroke-color-picker');
        if (existingPicker) {
            existingPicker.remove();
        }
        const existingColorPicker = document.getElementById('color-picker-container');
        if (existingColorPicker) {
            existingColorPicker.remove();
        }
        const currentStrokeColor = this.colorToHexColorConvertor(this.strokeColor);
        this.strokeColor = currentStrokeColor;
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.id = 'stroke-color-picker';
        Object.assign(colorPicker.style, {
            position: 'absolute',
            zIndex: '1000',
            opacity: '0',
            width: '40px',
            height: '40px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            left: `${event.clientX}px`,
            top: `${event.clientY}px`,
        })
        colorPicker.value = currentStrokeColor;

        colorPicker.addEventListener('input', (event: any) => {
        this.strokeColor = event.target.value;
        if (polygon) {
            polygon.setStyle({fillColor: this.selectedColor,fillOpacity: this.selectedOpacity,color: this.showPolygonBorder ? this.strokeColor : 'transparent',weight: this.strokeWidth});
        }
        });
        const removePicker = (e) => {
            if (e.target !== colorPicker) {
                document.body.removeChild(colorPicker);
                document.removeEventListener('click', removePicker);
            }
        };
        document.body.appendChild(colorPicker); 
        colorPicker.click();
        setTimeout(() => {
            document.addEventListener('click', removePicker);
        }, 200);
    }
    enableTagPublish() {
        this.enableManualNav = true;
    }
    getAssociatedTags() {
        this.commonService.getAssociatedTags().subscribe(res => {
            this.associatedTags = res.results;
            this.associatedTagsFilters = this.associatedTags.slice();
        });
    }
    applyTagFilter(data: string): void{
        const filterValue = data.toLowerCase();
        this.associatedTagsFilters = this.associatedTags.filter(tag =>
            tag.tagId.toLowerCase().includes(filterValue) || tag.tagId.includes(filterValue) ||
            (tag.tagAssociationName && tag.tagAssociationName.toLowerCase().includes(filterValue.toLowerCase())));
    }
    getTagCoordinate(location, floorId, event) {
        let coordinate = [event.latlng.lng/100,event.latlng.lat/-100]
        this.tagPublish(location, coordinate, floorId)

    }
    tagChanged(event) {
        this.enableManualNav = false;
    }
    tagPublish(location, coordinate, floorId) {
        if(this.enableManualNav) {
            let tagDetail = this.associatedTags.filter(val => val.tagId == this.selectedTag.value)[0];
            let topic  = 'tw/tag/location_nav/' + this.facilityId + '/' + location.parentId + '/' + tagDetail.tagId
            let data = {
                topic: topic,
                message: {
                    "tid": tagDetail.tagId,
                    "cxy": coordinate, 
                    "rdr": [], 
                    "etm": new Date().getTime()/1000, 
                    "htp": "BLE", 
                    "alg": "RA-SP", 
                    "performance": "", 
                    "seq": null, 
                    "blk": parseInt(this.blockId.value), 
                    "bln": this.blockList.filter(val => val.id == parseInt(this.blockId.value))[0]['name'], 
                    "flr": location.parentId, 
                    "fln": this.floorList.filter(val => val.id == parseInt(location.parentId))[0]['name'], 
                    "lid": location.id, 
                    "lnm": location.name, 
                    "cst": location.careSettingId, 
                    "lct": location.locationCategoryId, 
                    "ttp": tagDetail.tagAssociationType, 
                    "tvl": tagDetail.tagAssociationId, 
                    "tan": tagDetail.tagAssociationName, 
                    "fid": this.facilityId, 
                    "edt": this.datepipe.transform(new Date(), 'yyyy-MM-dd'), 
                    "ctm": new Date().getTime()/1000, 
                    "nty": "NOT-CN", 
                    "gid": null, 
                    "role": "", 
                    "sat": "", 
                    "lli": [location.id], 
                    "dis": ""
                }    
            }
            this.commonService.commonMqttPublish(data).subscribe(res => {
            res.results;
            },
            error => {
            this.toastr.error('Error', `${error.error.message}`);
            });
        }
    }

    // for showing confirmation popup when selecting other filters then editpolygon when selected polygon is there
    actionEvent(action, value) {
        if (this.selectedButton !== action  && this.selectedpolygon !=null && action !='editPolygon' ) {
            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
                panelClass: ['confirmation-popup'],
                disableClose: true,
                data: {
                    title: 'Confirmation',
                    message: 'Do you want to switch to selected Filter?',
                    buttonText: { ok: 'Yes', cancel: 'No' },
                }
            });
    
            dialogRef.afterClosed().subscribe(result => {
                if (result === 'Yes') {
                    this.isNewMapFilter = false;
                    this.isPolygonEditing =false;
                    if (action === 'mapFilter') {
                        this.deselectPolygon(this.editPolygon);
                        this.polygonEditMode();
                        this.isEditPolygon = false;
                        this.selectedpolygon =null;                    
                    }
                    this.executeAction(action, value);
                }
            });
        } else {
            this.executeAction(action, value);
        }
    }
        
    executeAction(action, value) {
        if (action === 'editPolygon') {
            if(value == false && this.selectedpolygon){
                this.deselectPolygon(this.editPolygon);
            }
            this.polygonEditMode();
        }else if (action ==='mapFilter'){
            this.mapFilterOpen()
        }
        this.selectedButton = action;
        this.selectedButtonValue = value;
    }

    // confirmation popup for apply current style to all polygons
     mapConfig() {
        this.commonService.getConfigFile('location-config').subscribe(res => {
            if(res.statusCode == 1) {
                let locConfig = res.results.contentObject
                if(locConfig.hasOwnProperty('enableFloorChange')){
                this.enableFloorChange = locConfig.enableFloorChange;
                }
            }
        });
        if(this.selectedpolygon == null){
            this.hospitalService.getLogicalLocationById(this.floorId.value).subscribe(res => {
                this.selectedpolygon = res.results[0];
                this.openManageDialog();
            });
        }else {
            this.openManageDialog();
        }
    }
    
   openManageDialog() {
         let postData = {
           "id" : this.selectedpolygon?.id,
           "parentId" : this.floorId.value,
           "defaultZoom":this.selectedpolygon?.defaultZoom,
           "orientation": '',
           "disLocLevel": this.selectedpolygon?.disLocLevel,
           "maxZoom": this.selectedpolygon?.maxZoom,
           "minZoom": this.selectedpolygon?.minZoom,
           "labelStyle":this.selectedpolygon?.labelStyle,
        // "labelPoint": this.selectedpolygon?.labelPoint,
           "polygonStyle": this.selectedpolygon?.polygonStyle,
           "locType":this.selectedpolygon?.locationTypeId,
           "category":this.selectedpolygon?.locationCategoryId,
           "enableFloorChange":this.enableFloorChange,
           "type":'floorPlan'
         };
         const dialogRef = this.dialog.open(ManageLocationViewComponent, {
           panelClass:['small-popup'],
           data: postData,
           disableClose: true
         });
         dialogRef.afterClosed().subscribe(result => {
            this.EditPolygonOptions.forEach(option => (option.disabled = false));
            this.removeIcons();
            this.coordinates = null;
           if (result === 'Yes') {
             this.hospitalService.locationApplyAll(postData).subscribe(res => {
               this.toastr.success('Success', `${res.message}`);
               this.hospitalService.getLogicalLocationWithChildren(this.floorId.value).subscribe(res => {
                if(res.statusCode == 1){
                    let floorLocations = res.results;
                    this.allFloorWithChildren[this.floorId.value] = floorLocations;
                    this.getFloorMap(floorLocations, this.floorId.value)
                }
              });
             });
           }else{
            this.selectedpolygon =null;
            this.hospitalService.getLogicalLocationWithChildren(this.floorId.value).subscribe(res => {
                if(res.statusCode == 1){
                    let floorLocations = res.results;
                    this.allFloorWithChildren[this.floorId.value] = floorLocations;
                    this.getFloorMap(floorLocations, this.floorId.value)
                }
              });
           }
         });
       }
    fixClick() {
        console.log('')
    }    

    onCloseMenu(menuTrigger: MatMenuTrigger, event: MouseEvent) {
        event.stopPropagation();
        menuTrigger.closeMenu();
    }

    colorToHexColorConvertor(color){
        const temp = document.createElement("div");
        temp.style.color = color.trim();
        document.body.appendChild(temp);
        // Get the computed color value in RGB format
        const computedColor = getComputedStyle(temp).color;
        document.body.removeChild(temp);
        // Extract the RGB components from the computed style string
        const match = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return "#0000ff"; // default return blue color if match not found.
        const r = Number(match[1]);
        const g = Number(match[2]);
        const b = Number(match[3]);

        // convert to hex decimal color code
        const hex = "#" +[r, g, b].map(v => v.toString(16).padStart(2, "0")).join("").toLowerCase();
        return hex;
    }

    attachLabelLatLng(polygon) {
    try {
        if (Array.isArray(polygon?.updatedLabelPoint) && polygon.updatedLabelPoint.length === 2) {
            return L.latLng(polygon.updatedLabelPoint[1], polygon.updatedLabelPoint[0]);
        }
        let markerStyle;
        try {
            markerStyle = typeof this.selectedpolygon?.labelPoint === 'string'
                ? JSON.parse(this.selectedpolygon.labelPoint)
                : this.selectedpolygon?.labelPoint;
        } catch {
            markerStyle = this.selectedpolygon?.labelPoint;
        }
        if (markerStyle && Array.isArray(markerStyle.point) && markerStyle.point.length === 2) {
            return L.latLng(markerStyle.point[1] * -100, markerStyle.point[0] * 100);
        }

        let labelStyle;
        try {
            labelStyle = typeof this.selectedpolygon?.labelStyle === 'string'
                ? JSON.parse(this.selectedpolygon.labelStyle)
                : this.selectedpolygon?.labelStyle;
        } catch {
            labelStyle = this.selectedpolygon?.labelStyle;
        }
        if (labelStyle && labelStyle.point && Array.isArray(labelStyle.point) && labelStyle.point.length === 2) {
            return L.latLng(labelStyle.point[1] * -100, labelStyle.point[0] * 100);
        }
        return polygon.getBounds().getCenter();
    } catch (e) {
        return polygon.getBounds().getCenter();
    }
}

    attachLabelMarker(polygon,isLabel) {
        try {
            if (!this.selectedpolygon || !polygon) return;
            this.maps.text_polygon[this.floorId.value] = this.maps.text_polygon[this.floorId.value] || {};
            if (polygon?.marker) {
                try { this.allFloorMap[this.floorId.value]?.removeLayer(polygon.marker); } catch (e) { }
            }

            const latLng = this.attachLabelLatLng(polygon);
            let rotate = 0;
            let fontSize = this.fontSize || 12;
            let color = '#363636de';
            try {
                const ls = typeof this.selectedpolygon?.labelStyle === 'string' ? JSON.parse(this.selectedpolygon.labelStyle) : (this.selectedpolygon?.labelStyle || {});
                const ms = typeof this.selectedpolygon?.labelPoint === 'string' ? JSON.parse(this.selectedpolygon.labelPoint) : (this.selectedpolygon?.labelPoint || {});
                rotate = (polygon?.updatedLabelAngle != null) ? polygon.updatedLabelAngle : (ms?.rotate ?? ls?.rotate ?? 0);
                const webFs = ls?.web?.['font-size'] || ls?.web?.["font-size"];
                if (webFs) fontSize = String(webFs).replace('px', '') || fontSize;
                color = (ls?.polygon?.color) || (ls?.polygon?.fillColor) || (this.selectedColor) || color;
            } catch (e) { }
            const html = `<div id="${this.selectedpolygon?.id}" style="display:flex;justify-content:flex-start;transform:rotate(${rotate || 0}deg);font-size:${fontSize || 12}px;width:max-content;color:${color}">${this.selectedpolygon?.name}</div>`;
            const icon = L.divIcon({
                html,
                className: 'leaflet-marker-div',
                iconSize: [100, 20]
            });
            const marker = L.marker(latLng, { className: 'leaflet-marker-div', icon, draggable: isLabel });
            marker.addTo(this.allFloorMap[this.floorId.value]);
            marker.off && marker.off('dragend');
            marker.on && marker.on('dragend', (event) => {
                try {
                    const newLatLng = event.target.getLatLng();
                    let labelstyle = {};
                    let markerStyle = {};

                    try { labelstyle = JSON.parse(this.selectedpolygon.labelStyle); } catch { labelstyle = this.selectedpolygon.labelStyle || {}; }
                    try { markerStyle = JSON.parse(this.selectedpolygon.labelPoint); } catch { markerStyle = this.selectedpolygon.labelPoint || {}; }

                    this.updatedPoint = newLatLng;
                    labelstyle = { ...labelstyle, point: this.updatedPoint };
                    this.selectedpolygon.labelStyle = JSON.stringify(labelstyle);

                    markerStyle = { ...markerStyle, point: this.updatedPoint };
                    this.selectedpolygon.labelPoint = JSON.stringify(markerStyle);
                    this.showSaveCancelIcons(polygon, this.updatedPoint, polygon.updatedLabelAngle ?? rotate, true);
                } catch (err) {
                    console.log(err);
                }
            });

            polygon.marker = marker;
            this.maps.text_polygon[this.floorId.value][this.selectedpolygon?.id] = marker;

        } catch (e) {
            console.log('attachLabel error', e);
        }
    }

    updateLabelAppearance(polygon) {
        try {
            const marker = polygon?.marker;
            if (!marker) return;
            const el = (marker.getElement && marker.getElement()) || (marker._icon || null);
            if (!el) return;

            let rotate = polygon?.updatedLabelAngle ?? null;
            let fontSize = this.fontSize || 12;
            let color = '#363636de';

            try {
                const ls = typeof this.selectedpolygon?.labelStyle === 'string' ? JSON.parse(this.selectedpolygon.labelStyle) : (this.selectedpolygon?.labelStyle || {});
                const ms = typeof this.selectedpolygon?.labelPoint === 'string' ? JSON.parse(this.selectedpolygon.labelPoint) : (this.selectedpolygon?.labelPoint || {});

                rotate = rotate != null ? rotate : (ms?.rotate ?? ls?.rotate ?? 0);
                const webFs = ls?.web?.['font-size'] || ls?.web?.["font-size"];
                if (webFs) fontSize = String(webFs).replace('px', '');
            } catch (e) { }

            const inner = el.querySelector ? el.querySelector('div') : el;
            if (inner) {
                inner.style.transform = `rotate(${rotate || 0}deg)`;
                inner.style.fontSize = `${fontSize}px`;
                inner.style.color = color;
            }
        } catch (e) {
            console.log(e)
        }
    }
}
