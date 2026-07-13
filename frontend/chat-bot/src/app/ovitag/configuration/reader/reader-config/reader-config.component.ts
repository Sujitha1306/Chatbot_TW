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

import { Component, OnInit, ViewChild, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormGroup, FormBuilder,FormArray } from '@angular/forms';
import * as L from 'leaflet';
import { ConfigurationService, CommonService } from '../../../../shared';
import { environment } from '../../../../../environments/environment';
import { CreateNewReader, UpdateNewReader } from '../../configuration.model';
import { ConfirmationDialog } from '../../../../shared/modules/entry-component/confirmation-dialog/confirmation-dialog.component';
import { ErrorStateMatcherService } from '../../../../shared/services/error-state-matcher.service';
import { StyleLoaderService } from '../../../../shared/services/style-loader.service ';
import { AppToastService } from '../../../../shared/services/toaster.service';
import { LookupTermService } from '../../../../shared/lookup-term.service';


@Component({
    selector: 'app-reader-config',
    templateUrl: './reader-config.component.html',
    styleUrls: ['./reader-config.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ReaderConfigComponent implements OnInit {
    public selectedTab: any;  // SOFTWARE VERSION UPDATE
    public swVersionList: any; // SOFTWARE VERSION UPDATE
    public verHistory: any // SOFTWARE VERSION UPDATE
    public swVersion = false // SOFTWARE VERSION UPDATE
    public selected_swVer: any // SOFTWARE VERSION UPDATE
    public current_swVer: any[] = [] // SOFTWARE VERSION UPDATE
    VerdataSource: MatTableDataSource<any>; // SOFTWARE VERSION UPDATE
    VerdisplayedColumns: string[] = ['From Version', 'To Version', 'Date', 'Status']; // SOFTWARE VERSION UPDATE
    public readerForm: FormGroup;
    public map: any;
    public mapZoomCntrl = null;
    public formFlag: boolean; //i18n
    public title: string; //i18n
    public shownTitle: string; //i18n
    public matcher = new ErrorStateMatcherService();
    iconHeader = ['ID'];
    iconColumn = ['ID'];
    sortColumn = ['ID'];
    permissionControl = ['BT_ALLE'];
    public applyFilterValue: any;
    public activityList = [];
    public supportLocations = [];
    public multiReaderInfo = {
        "id" : null,
        "readerName" : null,
        "selectedIndex" : null,
        "floorId" : null,
        "floorName" : null,
        "activityId" : null,
        "activityIndex" : null,
        "activityFloorId" : null,
        "activityFloorName" : null,
        "activityName" : null,
        "selectedReader" : null,
        "readersList"    : [],
        "locations"    : {},
        "HazardDistance"    : {},
        "showReaders"      : false,
        "showLabel"      : true,
        "updateAction"      : false,
        "enabled"   : false,
        "floorValidate" : true
    }
    public info = {
                    "facility": null,
                    "data": null,
                    "id": "",
                    "setting": null,
                    "coordinates": null,
                    "location": null,
                    "floors": [],
                    "locationDetail": [],
                    "all_reader": [],
                    "all_reader_id": {},
                    "all_reader_name": {},
                    "gateways": [],
                    "hardwarelist": [],
                    "readerIOType": [],
                    "readerType": [],
                    "readerAlgoType": [],
                    "status": false,
                    "algLink": [],
                    "relayLink": [],
                    "ioLink": [],
                    "meshLink": [],
                    "ioType": "IOC-EN",
                    "readerVersionDetails": [],
                    "readerVersion": [],
                    "verstionHint": null,
                    "meshType": null,
                    "readerConnectivityType": []
                }
    public maps = {
                    "floors": {},
                    "floor_id": null,
                    "position": null,
                    "reader_postion": {},
                    "reader_link": {},
                    "icon1": new L.Icon({ iconUrl: '/assets/Alert/common_icons/green-dot.png', iconSize: [20, 20],
                    iconAnchor: [10, 10],
                    labelAnchor: [6, 0]}),
                    "icon2": new L.Icon({ iconUrl: '/assets/Alert/common_icons/pink-dot.png', iconSize: [20, 20],
                    iconAnchor: [10, 10],
                    labelAnchor: [6, 0]}),
                    "icon3": new L.Icon({ iconUrl: '/assets/Alert/common_icons/red-dot.png', iconSize: [20, 20],
                    iconAnchor: [10, 10],
                    labelAnchor: [6, 0]}),
                    "alg_link": "algLink",
                    "relay_link": "relayLink",
                    "io_link": "ioLink",
                    "mesh_link": "meshLink",
                    "location": {},
                    "active_location": null
                }
    public config = {
                        "coordinates": false,
                        "alg_link": false,
                        "alg_link_filter": [],
                        "io_link": false,
                        "io_link_filter": [],
                        "relay_link": false,
                        "relay_link_filter": [],
                        "mesh_link": false,
                        "mesh_link_filter": [],
                        "location": false,
                        "link": {},
                        "exist_link": {},
                        "io_type": null,
                        "mesh_type": null
                    }
    public mode = {
                    "coordinates": false,
                    "alg_link": false,
                    "io_link": false,
                    "relay_link": false,
                    "location": false,
                    "active": null,
                    "alg_link_filter": "RLT-AL",
                    "io_link_filter": "RLT-IO",
                    "relay_link_filter": "RLT-RE",
                    "algLink": "RLT-AL",
                    "ioLink": "RLT-IO",
                    "relayLink": "RLT-RE",
                    "mesh_link": false,
                    "mesh_link_filter": "RLT-ML",
                    "meshLink": "RLT-ML"
                }
    @ViewChild(MatPaginator) paginator: MatPaginator; // SOFTWARE VERSION UPDATE
    @ViewChild(MatSort) sort: MatSort; // SOFTWARE VERSION UPDATE
    height: number;

    constructor(
        private readonly styleLoader: StyleLoaderService,
        public form: FormBuilder,
        public thisDialogRef: MatDialogRef<ReaderConfigComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialog: MatDialog,
        private readonly configurationServices: ConfigurationService,
        private readonly commonServices: CommonService,
        private readonly _snackBar: MatSnackBar,
        private readonly lookupService: LookupTermService,
        public toastr: AppToastService
    ) {
        this.info["facility"] = localStorage.getItem('ZmFjaWxpdHlJZA==');
        if (this.data.readerName) {
            this.info["data"] = this.data;
            this.info["id"] = this.data.id;
            this.info["coordinates"] = this.data.coordinate ? JSON.parse(this.data.coordinate) : null;
            this.info["status"] = this.data.configStatusId
            this.info["meshType"] = this.data.meshTypeId
            this.maps["floor_id"] = this.data.floorId ? this.data.floorId : null
            this.info["location"] = this.data.locationId
        } else if(this.data == 'multiReader') {
            this.multiReaderInfo.enabled = true;
            this.info["data"] = {}
            this.info["id"] = null
        } else {
            this.info["data"] = {}
            this.info["id"] = null
        }
        // console.log(this.info)
        this.getAllDetails();
    }
    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action, {
            duration: 5000,
        });
    }

    ngOnInit() {
        this.getAllFloorLocations();
        this.styleLoader.loadStyleByType('leaflet')
        if (this.data['id'] == null) {
            this.title = 'Create Reader';
            this.shownTitle = 'Create';
            this.formFlag = true;
          } else {
            this.title = 'Modify Reader';
            this.shownTitle = 'Modify';
            this.formFlag = false;
          }
          
        this.buildForm();
        if (this.maps["floor_id"] in this.maps["floors"]) {
            this.info["locationDetail"] =  this.maps["floors"][this.maps["floor_id"]].locations
        }
    }

    getAllFloorLocations() {
        const locationTypeId = 17;
        this.commonServices.getAllFloorLocations(locationTypeId).subscribe(res => {
            if(res.statusCode === 1) {
                this.supportLocations = res.results;
                if(this.data.id) {
                    this.buildForm();
                }
            }
        });
    }

    getAllDetails() {
        this.commonServices.getAllLocation().subscribe(res => {
            this.processLocationResults(res);
            if (this.maps["floor_id"] in this.maps["floors"]) {
                this.info["locationDetail"] = this.maps["floors"][this.maps["floor_id"]].locations;
            }
            this.show_map(this.maps["floor_id"]);
        });

        this.configurationServices.getAllNewReaders(this.data.id).subscribe(res => {
            this.processReaderResults(res);
        });

        if (this.multiReaderInfo.enabled) {
            this.configurationServices.getAllActivities().subscribe(res => {
                if (res.statusCode == 1) {
                    this.activityList = res.results.filter(val => val.activityCategoryId == 'AC-HAZ');
                }
            });
        } else {
            this.fetchReaderVersions();
            this.fetchReaderValidation();
            this.fetchAppTerms();
            this.getReaderType(this.data.hardwareTypeId);
            this.fetchSoftwareVersions();
            if (this.data.id) {
                this.getVersionHistory();
            }
        }
    }

    private processLocationResults(res) {
        for (let a in res.results) {
            for (let b in res.results[a].children) {
                for (let c in res.results[a].children[b].children) {
                    const floor = res.results[a].children[b].children[c];
                    const floor_id = floor.id;
                    this.multiReaderInfo.locations[floor_id] = floor;
                    this.processFloor(floor, floor_id, res.results[a].children[b].name);
                }
            }
        }
    }

    private processFloor(floor, floor_id, blockName) {
        for (let d in floor.children) {
            const child = floor.children[d];
            const locationId = child.id;
            const location = {
                id: child.id,
                name: child.name,
                locationTypeId: child.locationTypeId,
                imageUrl: child.imageUrl,
                coordinates: child.coordinates
            };

            if (floor_id in this.maps["floors"]) {
                this.maps["floors"][floor_id].locations.push(location);
            } else {
                this.maps["floors"][floor_id] = {
                    aspects: floor.aspects,
                    coordinates: floor.coordinates,
                    defaultZoom: floor.defaultZoom,
                    maxZoom: floor.maxZoom,
                    minZoom: floor.minZoom,
                    disLocLevel: floor.disLocLevel,
                    labelStyle: floor.labelStyle,
                    polygonStyle: floor.polygonStyle,
                    id: floor.id,
                    imageUrl: floor.imageUrl,
                    locationTypeId: floor.locationTypeId,
                    name: floor.name,
                    locations: [location]
                };
                this.info["floors"].push({
                    id: floor_id,
                    name: floor.name,
                    blockName: blockName
                });
            }

            this.multiReaderInfo.locations[locationId] = child;
            this.processChildLocations(child);
        }
    }

    private processChildLocations(child) {
        for (let e in child.children) {
            const loc = child.children[e];
            this.multiReaderInfo.locations[loc.id] = loc;
        }
    }

    private processReaderResults(res) {
        this.processReaderList(res);

        if (this.info["id"] != null && this.info["data"].readerLink.length > 0) {
            this.processReaderLinks(this.info["data"].readerLink);
            this.applyLinkFilters();
            console.log(this.config["exist_link"]);
        }
    }

    private processReaderList(res) {
        for (let i in res.results) {
            if (res.results[i].id != this.info["id"]) {
                res.results[i]['enableUpdate'] = false;
                this.multiReaderInfo["readersList"].push(res.results[i]);
                this.info["all_reader"].push(res.results[i]);
                this.info["all_reader_id"][res.results[i].id] = res.results[i];
                this.info["all_reader_name"][res.results[i].readerName] = res.results[i];
            }
        }
    }

    private processReaderLinks(readerLinks) {
        for (let i in readerLinks) {
            let link = readerLinks[i];
            let linkId = link.targetReaderId.toString() + link.linkTypeId;
            let targetReaderName = this.info["all_reader_id"][link.targetReaderId].readerName;

            this.handleLinkType(link.linkTypeId, targetReaderName);
            this.config["exist_link"][linkId] = link;
        }
    }

    private handleLinkType(linkTypeId: string, readerName: string) {
        switch (linkTypeId) {
            case "RLT-AL":
                if (!this.info["algLink"].includes(readerName)) {
                    this.info["algLink"].push(readerName);
                }
                break;
            case "RLT-RE":
                this.info["relayLink"].push(readerName);
                break;
            case "RLT-IO":
                this.info["ioLink"].push(readerName);
                break;
            case "RLT-ML":
                this.info["meshLink"].push(readerName);
                break;
        }
    }

    private applyLinkFilters() {
        if (this.info["algLink"].length > 0) this.link_reader_filter("alg_link_filter");
        if (this.info["relayLink"].length > 0) this.link_reader_filter("relay_link_filter");
        if (this.info["ioLink"].length > 0) this.link_reader_filter("io_link_filter");
        if (this.info["meshLink"].length > 0) this.link_reader_filter("mesh_link_filter");
    }

    private fetchReaderVersions() {
        this.configurationServices.getReaderVersions().subscribe(res => {
            if (res.results != null) {
                this.info["readerVersionDetails"] = res.results;
                if (this.info["id"] != null) {
                    if (this.info["data"].readerVersionId != null && this.info["data"].hardwareTypeId) {
                        this.info["readerVersion"] = this.info["readerVersionDetails"].filter(res =>
                            res.hardwareTypeId == this.info["data"].hardwareTypeId
                        );
                        const version = this.info["readerVersion"].filter(res =>
                            res.id == this.info["data"].readerVersionId
                        );
                        this.info["verstionHint"] = "NRF Version "+version[0].nrfVersion+", ESP Version "+version[0].espVersion+", Kernel Version " + version[0].kernelVersion;
                    }
                }
            } else {
                this.toastr.error('Error', `Software version Not Found`);
                this.thisDialogRef.close('confirm');
            }
        });
    }

    private fetchReaderValidation() {
        this.commonServices.getReaderValidation().subscribe(res => {
            if (res.results != null) {
                this.info["setting"] = res.results.contentObject;
            } else {
                this.toastr.error('Error', `Facility Reader Settings Not Found`);
                this.thisDialogRef.close('confirm');
            }
        });
    }

    private fetchAppTerms() {
        this.lookupService.getAppTermsWrapper('ReaderType,ReaderAlgoType,ReaderHardwareType,ReaderIOType,MeshType,ReaderConnectivityType').subscribe(res => {
            this.info["meshType"] = res.MeshType ?? [];
            this.info["readerAlgoType"] = res.ReaderAlgoType ?? [];
            this.info["hardwarelist"] = res.ReaderHardwareType ?? [];
            this.info["readerIOType"] = res.ReaderIOType ?? []; 
            this.info["readerConnectivityType"] = res.ReaderConnectivityType ?? [];
        });
    }

    private fetchSoftwareVersions() {
        this.configurationServices.getswVersion(this.data.hardwareTypeId).subscribe(res => {
            const software_version_id = this.data.readerVersionId;
            if (res.statusCode === 1) {
                this.swVersionList = res.results.filter(resFilter => resFilter.id !== software_version_id);
                this.current_swVer = res.results.filter(resFilter => resFilter.id === software_version_id);
            }
        });
    }

    public buildForm() {
        this.readerForm = this.form.group({
            readerName: [this.getValue(this.data.readerName)],
            hardwareTypeId: [this.getValue(this.data.hardwareTypeId)],
            readerTypeId: [this.getValue(this.data.readerTypeId)],
            macId: [this.getValue(this.data.macId)],
            modelNumber: [this.getValue(this.data.model)],
            softwarVerstion: [this.getValue(this.data.readerVersionId)],
            configStatusId: [this.info["status"]],
            floorId: [this.getValue(this.data.floorId)],
            readerAlgoTypeId: [this.getValue(this.data.readerAlgoTypeId)],
            isEnable: [this.data.hasOwnProperty('isEnable') ? this.data.isEnable : true],
            locationId: [this.getValue(this.data.locationId)],
            coordinates: [this.getValue(this.info["coordinates"])],
            readerLocation  : [this.data.readerLocation ? JSON.parse(this.data.readerLocation) : null],
            algLink         : [{ value: this.info["algLink"] ? this.info["algLink"] : null, disabled: !this.config["alg_link"] }],
            relayLink       : [{ value: this.info["relayLink"] ? this.info["relayLink"] : null, disabled: !this.config["relay_link"] }],
            ioLink          : [{ value: this.info["ioLink"] ? this.info["ioLink"] : null, disabled: !this.config["io_link"] }],
            ioType          : [{ value: this.info["ioType"] ? this.info["ioType"] : null, disabled: !this.config["io_link"] }],
            meshType          : [this.getValue(this.data?.meshTypeId)],
            meshLink          : [{ value: this.info["meshLink"] ? this.info["meshLink"] : null, disabled: !this.config["mesh_link"] }],
            linkedLocations  : [this.data.linkedLocations ? JSON.parse(this.data.linkedLocations) : null],
            readerConnectTypeId : [this.data.readerConnectivityTypeId ? this.data.readerConnectivityTypeId : 'RCT-DE'],
            activityId : [null],
            activityReaders : this.form.array([this.getReaders()])
        });
    }

    private getValue(value: any) {
        return value || null;
    }

    getReaders() {
        let res = this.form.group({
            id              :[null],
            readerName      :[null],
            readerTypeId    :[null],
            floorId         :[null],
            coordinate      :[null],
            locationId      :[null],
            readerLocation  :[null],
            enableUpdate    :[false]
        });
        return res
    }
    private bindReaders(activityId) {
        this.multiReaderInfo.id = null;
        this.multiReaderInfo.readerName = null;
        this.multiReaderInfo.selectedIndex = null;
        this.multiReaderInfo.selectedReader = null;
        this.multiReaderInfo.showLabel = true;
        this.multiReaderInfo.updateAction = false;
        
        let readers = []
        if(activityId) {
            let beacons = this.activityList[this.multiReaderInfo.activityIndex]['configValue']['b_id']
            for(let i in beacons) {
                readers.push(beacons[i][0].toString())
                this.multiReaderInfo.HazardDistance[beacons[i][0].toString()] = beacons[i][1];
            }
        }
        const filterByArrayList = (array, key, values) => {
            return array.filter((item) => values.includes(item[key]));
        };
        let readerList = JSON.parse(JSON.stringify(this.multiReaderInfo["readersList"]))
        this.info['all_reader'] = readers.length ? filterByArrayList(readerList, 'readerName', readers) : readerList.filter(val => val.floorId == this.multiReaderInfo.floorId);
        const control = <FormArray>this.readerForm.controls['activityReaders'];
        control.controls = [];
        for ( const reader of  this.info['all_reader']) {
          control.push(
            this.form.group({
                id              :[reader['id']],
                readerName      :[reader['readerName']],
                readerTypeId    :[reader['readerTypeId']],
                floorId         :[reader['floorId']],
                floorName       :[reader['floorName']],
                coordinate      :[reader['coordinate']],
                locationId      :[reader['locationId']],
                readerLocation  :[reader['readerLocation']],
                enableUpdate    :[reader.enableUpdate ? reader.enableUpdate : false]
            })
          );
        }
        this.multiReaderInfo["showReaders"] = true;
    }
    getActivityReader(activityId) {
        this.multiReaderInfo.activityIndex = this.activityList.findIndex(val => val.id == activityId)
        
        let locationDetail = this.multiReaderInfo['locations']
        let activityFloorId = locationDetail[this.activityList[this.multiReaderInfo.activityIndex]['destinationId']]['locationTypeLevel'] == 2 ? 
                        this.activityList[this.multiReaderInfo.activityIndex]['destinationId'] : 
                        locationDetail[this.activityList[this.multiReaderInfo.activityIndex]['destinationId']]['parentId'];
        this.multiReaderInfo.activityFloorId = activityFloorId;
        this.multiReaderInfo.floorValidate = true;
        this.multiReaderInfo.floorId = activityFloorId;
        this.readerForm.controls.floorId.setValue(activityFloorId);
        this.multiReaderInfo.activityId = activityId;
        this.multiReaderInfo.activityName = this.activityList[this.multiReaderInfo.activityIndex].name;
        
        if(this.multiReaderInfo.enabled) {
            if(this.multiReaderInfo.floorId) {
                this.getFloorDetail(this.multiReaderInfo.floorId)
            }
        }
    }
    ShowLabel() {
        this.multiReaderInfo.showLabel = !this.multiReaderInfo.showLabel;
        for(let i in this.info['all_reader']) {
            // this.info['all_reader'][i]['id']
            this.reader_position_hide(this.multiReaderInfo.showLabel ? 'open' : 'hide', i, null)
        }
    }
    bulkUpdate() {
        let postData = this.readerForm.controls.activityReaders.value
        postData = postData.filter(val => val.enableUpdate)
        if(postData.length) {
            this.multiReaderInfo.updateAction = false;
            this.configurationServices.updateBulkReaders(postData).subscribe(res => {
                if (res.statusCode == 1) {
                    this.toastr.success('Success', `${res.message}`);
                    this.thisDialogRef.close('confirm');
                } else {
                    this.multiReaderInfo.updateAction = true;
                    this.toastr.warning('Warning', `${res.message}`);
                }    
            })
        }
    }
    save_reader() {
        let createNewReader = new CreateNewReader(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null);
        createNewReader.readerName = this.readerForm.controls['readerName'].value;
        createNewReader.hardwareTypeId = this.readerForm.controls['hardwareTypeId'].value;
        createNewReader.readerTypeId = this.readerForm.controls['readerTypeId'].value;
        createNewReader.macId = this.readerForm.controls['macId'].value;
        createNewReader.model = this.readerForm.controls['modelNumber'].value;
        createNewReader.readerVersionId = this.readerForm.controls["softwarVerstion"].value;
        createNewReader.configStatusId = this.readerForm.controls['configStatusId'].value;
        createNewReader.floorId = this.readerForm.controls['floorId'].value;
        createNewReader.readerAlgoTypeId = this.readerForm.controls['readerAlgoTypeId'].value;
        createNewReader.isEnable = this.readerForm.controls['isEnable'].value;
        createNewReader.locationId = this.readerForm.controls['locationId'].value;
        createNewReader.coordinate = this.readerForm.controls['coordinates'].value ? JSON.stringify(this.readerForm.controls['coordinates'].value) : null;
        createNewReader.readerLocation = this.readerForm.controls['readerLocation'].value ? JSON.stringify(this.readerForm.controls['readerLocation'].value) : null;
        createNewReader.linkedLocations = this.readerForm.controls['linkedLocations'].value ? JSON.stringify(this.readerForm.controls['linkedLocations'].value) : null;
        createNewReader.meshTypeId = this.readerForm.controls['meshType'].value;
        createNewReader.readerConnectivityTypeId = this.readerForm.controls['readerConnectTypeId'].value;
        createNewReader.readerLink = [];
        for (let key in this.config["link"]) {
            console.log(this.config["link"][key])
            createNewReader.readerLink.push(this.config["link"][key])
        }
        console.log(createNewReader)
        this.configurationServices.saveReaderDevices(createNewReader).subscribe(res => {
            console.log(res)
            if (res.statusCode == 1) {
                this.toastr.success('Success', `${res.message}`);
                this.thisDialogRef.close('confirm');
            } else {
                this.toastr.warning('Warning', `${res.message}`);
            }
        },
        error => {
            this.toastr.error('Error', `${error.error.message}`);
        }
        );
    }
    update_reader() {
        let updateNewReader = new UpdateNewReader(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,null);
        updateNewReader.readerName = this.readerForm.controls['readerName'].value;
        updateNewReader.hardwareTypeId = this.readerForm.controls['hardwareTypeId'].value;
        updateNewReader.readerTypeId = this.readerForm.controls['readerTypeId'].value;
        updateNewReader.macId = this.readerForm.controls['macId'].value;
        updateNewReader.model = this.readerForm.controls['modelNumber'].value;
        updateNewReader.readerVersionId = this.readerForm.controls["softwarVerstion"].value;
        updateNewReader.configStatusId = this.readerForm.controls['configStatusId'].value;
        updateNewReader.floorId = this.readerForm.controls['floorId'].value;
        updateNewReader.readerAlgoTypeId = this.readerForm.controls['readerAlgoTypeId'].value;
        updateNewReader.isEnable = this.readerForm.controls['isEnable'].value;
        updateNewReader.locationId = this.readerForm.controls['locationId'].value;
        updateNewReader.coordinate = this.readerForm.controls['coordinates'].value ? JSON.stringify(this.readerForm.controls['coordinates'].value) : null;
        updateNewReader.readerLocation = this.readerForm.controls['readerLocation'].value ? JSON.stringify(this.readerForm.controls['readerLocation'].value) : null;
        updateNewReader.linkedLocations = this.readerForm.controls['linkedLocations'].value ? JSON.stringify(this.readerForm.controls['linkedLocations'].value) : null;
        updateNewReader.meshTypeId = this.readerForm.controls['meshType'].value;
        updateNewReader.readerConnectivityTypeId = this.readerForm.controls['readerConnectTypeId'].value;
        updateNewReader.readerLink = [];
        for (let key in this.config["link"]) {
            console.log(this.config["link"][key])
            updateNewReader.readerLink.push(this.config["link"][key])
        }
        console.log(updateNewReader)
        this.configurationServices.updateReaderDevices(updateNewReader, this.info["id"]).subscribe(result => {
            console.log(result)
            if (result.statusCode == 1) {
                this.toastr.success('Success', `${result.message}`);
                this.thisDialogRef.close('confirm');
            } else {
                this.toastr.warning('Warning', `${result.message}`);
            }
        });
    }

    link_reader(id, type) {
        console.log(this.info[type])
        console.log(id, type)

        if (this.info[type].includes(id)) {
            this.handleExistingLink(id, type);
        } else {
            this.handleNewLink(id, type);
        }

        console.log(this.config["link"]);
    }

    private handleExistingLink(id, type) {
        let linkId = this.info["all_reader_name"][id].id.toString() + this.mode[type];

        if (this.config["link"][linkId]) {
            if (this.config["link"][linkId]["event"] == "add") {
                console.log("**************** delete new link", this.config["link"][linkId])
                delete this.config["link"][linkId];
                let index = this.info[type].indexOf(id);
                this.info[type].splice(index, 1);
                console.log("delete", index, this.info[type]);
                this.readerForm.controls[type].setValue(this.info[type]);
                this.link_manager(type);
            } else {
                console.log("delete new link error");
            }
        } else {
            console.log("**************** delete old link");
            this.config["link"][linkId] = {
                event: "delete",
                linkTypeId: this.mode[type],
                sourceReaderId: this.info["id"],
                sourceReaderioId: null,
                targetReaderId: this.info["all_reader_name"][id].id
            };
            let index = this.info[type].indexOf(id);
            this.info[type].splice(index, 1);
            console.log("db delete", index, this.info[type]);
            this.readerForm.controls[type].setValue(this.info[type]);
            this.link_manager(type);
        }
    }

    private handleNewLink(id, type) {
        const setting = this.get_setting_data("link");
        console.log(setting);

        if (!setting[this.mode[type]].flag) {
            this.rejectLink(type, `Invalid Reader link Type`);
            return;
        }

        if (!this.link_length_check(setting[this.mode[type]], type)) {
            this.rejectLink(type, `Invalid Reader link Length`);
            return;
        }

        const link = setting[this.mode[type]]["link"];
        const reader = this.info["all_reader_name"][id];

        if (!link[reader.readerAlgoTypeId]) {
            this.rejectLink(type, `Invalid Reader link Algorithm`);
            return;
        }

        const node2 = JSON.parse(reader.coordinate);
        const distance = this.calculateDistance(this.info["coordinates"], node2);
        console.log(distance, link[reader.readerAlgoTypeId].min, link[reader.readerAlgoTypeId].max, link[reader.readerAlgoTypeId].min < distance && distance < link[reader.readerAlgoTypeId].max);

        if (link[reader.readerAlgoTypeId].min < distance && distance < link[reader.readerAlgoTypeId].max) {
            this.addOrRestoreLink(id, type);
        } else {
            this.rejectLink(type, `Invalid Reader link Distance Required Min`+link[reader.readerAlgoTypeId].min.toString()+`Max`+link[reader.readerAlgoTypeId].max.toString()+`Now Distance`+distance.toString());
        }
    }

    private calculateDistance(coord1, coord2) {
        return Math.sqrt(Math.pow((coord2[1] - coord1[1]), 2) + Math.pow((coord2[0] - coord1[0]), 2));
    }

    private rejectLink(type: string, message: string) {
        this.readerForm.controls[type].setValue(this.info[type]);
        this.toastr.error('Error', message);
    }

    private addOrRestoreLink(id, type) {
        const linkId = this.info["all_reader_name"][id].id.toString() + this.mode[type];

        if (this.config["link"][linkId]) {
            if (this.config["link"][linkId]["event"] == "delete") {
                console.log("**************** add old link");
                delete this.config["link"][linkId];
                this.info[type].push(id);
                console.log("create", this.info[type]);
                this.readerForm.controls[type].setValue(this.info[type]);
                this.link_manager(type);
            } else {
                console.log("add old link error");
            }
        } else {
            console.log("**************** add new link");
            this.info[type].push(id);
            console.log("create", this.info[type]);
            this.readerForm.controls[type].setValue(this.info[type]);

            let sourceReaderioId = null;
            if (this.mode[type] == "RLT-IO") {
                sourceReaderioId = this.readerForm.controls["ioType"].value;
            }

            if (!this.config["link"][linkId]) {
                this.config["link"][linkId] = {
                    event: "add",
                    linkTypeId: this.mode[type],
                    sourceReaderId: this.info["id"],
                    sourceReaderioId: sourceReaderioId,
                    targetReaderId: this.info["all_reader_name"][id].id
                };
            }

            this.link_manager(type);
        }
    }
    link_length_check(data, type) {
        console.log(data, type)
        if (type == 'meshLink' && this.readerForm.controls['meshType'].value != null) {
            console.log(this.readerForm.controls['meshType'].value, data['length'][this.readerForm.controls['meshType'].value], this.info[type].length)
            if (data['length'][this.readerForm.controls['meshType'].value] > this.info[type].length) {
                return true
            }
        } else if (data['length'] > this.info[type].length) {
            return true
        }
        return false
    }
    tabClick(event) {
        this.selectedTab = event.index;
        if(event.tab.textLabel == "Configuration" && this.mode['active'] == null) {
            this.mode['coordinates'] = true;
            this.mode['active'] = 'coordinates';
            this.show_map(this.maps["floor_id"])
       }
    }
    getFloorDetail(floor_id) {
        
        if (this.maps["floors"][floor_id]) {
            this.maps["floor_id"] = floor_id
            if(this.multiReaderInfo.enabled) {
                this.multiReaderInfo.floorId = floor_id
                this.multiReaderInfo.floorName = this.maps["floors"][floor_id].name
                this.multiReaderInfo.floorValidate = this.multiReaderInfo.activityFloorId == null || this.multiReaderInfo.activityFloorId == floor_id;
                this.multiReaderInfo.activityFloorName = this.multiReaderInfo.floorValidate ? this.multiReaderInfo.floorName : this.multiReaderInfo.activityFloorName;
                this.multiReaderInfo.updateAction = false;
                this.bindReaders(this.multiReaderInfo.activityId)
            }
            this.info["locationDetail"] = this.maps["floors"][this.maps["floor_id"]].locations
            this.readerForm.controls["coordinates"].setValue(this.info["coordinates"]);
            if(this.data.floorId != floor_id) {
                this.readerForm.controls["coordinates"].setValue(null);
            }
            this.show_map(floor_id)
        }
        
    }
    getReaderType(hwType){
        this.lookupService.getAppTermsLinkWrapper(hwType).subscribe(res => {
            this.info["readerType"] = res.ReaderType ?? [];
        });
    }
    getHardwareType(hwType) {
        this.getReaderType(hwType);
        this.info["readerVersion"] = this.info["readerVersionDetails"].filter(res => res.hardwareTypeId == hwType);
        if (this.readerForm.controls["softwarVerstion"].value != null) {
            this.readerForm.controls["softwarVerstion"].setValue(null);
            this.info["verstionHint"] = null
        }
        
    }
    reader_version_change(id) {
        
        const version = this.info["readerVersion"].filter(res => res.id == id);
        
        this.info["verstionHint"] = "NRF Version "+version[0].nrfVersion+", ESP Version "+version[0].espVersion+", Kernel Version " + version[0].kernelVersion
    }
    getfilterReader(alg_type) {
        if (this.readerForm.controls["hardwareTypeId"].value) {
            if (this.info["setting"][this.readerForm.controls["hardwareTypeId"].value][alg_type].flag) {
                console.log("validate alg type")
            } else {
                this.readerForm.controls["readerAlgoTypeId"].setValue(null);
                this.toastr.error('Error', `Unsupport Algorithm Type`);
            }
        } else {
            this.readerForm.controls["readerAlgoTypeId"].setValue(null);
            this.toastr.error('Error', `Hardware Selection Required`);
        }
    }
    change_mode(mode) {
        if (this.config_mode_allow(mode)) {
            console.log(mode, this.mode[mode])
            if (this.mode[mode]) {
                console.log("exist mode")
            } else {
                console.log("change mode")
                if (this.mode["active"]) {
                    this.mode[this.mode["active"]] = false
                    this.config[this.mode["active"]] = false
                }
                this.config[mode] = true
                this.mode[mode] = true
                this.mode["active"] = mode
                this.show_map(this.maps["floor_id"]);
                if (this.config[mode+"_filter"]) {
                    this.link_reader_filter(mode+"_filter");
                    this.link_manager(this.maps[mode])
                } else if (mode == "location") {
                    this.info["locationDetail"] = this.maps["floors"][this.maps["floor_id"]].locations
                }
            }
            console.log(this.mode)
        }
    }
    link_reader_filter(filter) {
        console.log("******************************", filter);

        const setting = this.get_setting_data("link");
        const modeKey = this.mode[filter];
        const link = setting[modeKey]["link"];

        if (setting[modeKey]["flag"]) {
            let reader = [];
            for (const i in this.info["all_reader"]) {
                const currentReader = this.info["all_reader"][i];
                if (this.shouldIncludeReader(currentReader, link, filter)) {
                    reader.push(currentReader.readerName);
                }
            }
            this.config[filter] = reader;
        } else {
            console.log(filter, "false");
        }
    }

    private shouldIncludeReader(readerObj, link, filter) {
        if (readerObj.floorId !== this.maps["floor_id"]) return false;

        const algoTypeId = readerObj.readerAlgoTypeId;
        if (!link[algoTypeId]?.flag) return false;

        if (!link[algoTypeId].h_type.includes(readerObj.hardwareTypeId)) return false;

        if (filter === 'mesh_link_filter') {
            return this.shouldIncludeMeshReader(readerObj);
        }

        return true;
    }

    private shouldIncludeMeshReader(readerObj) {
        if (readerObj.meshTypeId == null) return false;
        if (this.readerForm.controls["meshType"].value === readerObj.meshTypeId) return false;

        console.log("mesh_link_filter", readerObj.readerName, readerObj.meshTypeId);
        return true;
    }

    config_mode_allow(mode) {
        if (!this.hasBasicConfig()) {
            this.toastr.error('Error', `configuration mode not allowed`);
            return false;
        }

        const setting = this.getCurrentSetting();
        if (!setting.flag) return false;

        if (mode === "alg_link" || mode === "relay_link" || mode === "io_link") {
            return this.validateStandardLinkMode(mode, setting);
        } else if (mode === "mesh_link") {
            return this.validateMeshLinkMode(mode, setting);
        } else if (mode === "location") {
            return this.validateLocationMode();
        }

        return true;
    }
    private hasBasicConfig() {
        return (
            this.readerForm.controls["floorId"].value &&
            this.readerForm.controls["hardwareTypeId"].value &&
            this.readerForm.controls["readerAlgoTypeId"].value
        );
    }

    private getCurrentSetting() {
        return this.info["setting"][
            this.readerForm.controls["hardwareTypeId"].value
        ][this.readerForm.controls["readerAlgoTypeId"].value];
    }

    private validateStandardLinkMode(mode, setting) {
        const modeKey = this.mode[mode + "_filter"];
        if (setting["link"].hasOwnProperty(modeKey) && setting["link"][modeKey].flag) {
            if (this.readerForm.controls["coordinates"].value) {
                return true;
            } else {
                this.toastr.error('Error', `Reader Position Required`);
                return false;
            }
        } else {
            this.toastr.error('Error', `This mode not allowed`);
            return false;
        }
    }

    private validateMeshLinkMode(mode, setting) {
        const modeKey = this.mode[mode + "_filter"];
        if (setting["link"].hasOwnProperty(modeKey) && setting["link"][modeKey].flag) {
            console.log(this.readerForm.controls["meshType"].value);
            if (
                this.readerForm.controls["coordinates"].value &&
                this.readerForm.controls["meshType"].value != null
            ) {
                return true;
            } else {
                this.toastr.error('Error', `Reader Position and Mesh Type Required`);
                return false;
            }
        } else {
            this.toastr.error('Error', `This mode not allowed`);
            return false;
        }
    }

    private validateLocationMode() {
        if (this.readerForm.controls["coordinates"].value) {
            return true;
        } else {
            this.toastr.error('Error', `Reader Position Required`);
            return false;
        }
    }
    ioTypeChange(data) {
        console.log(data)
        if (this.info["ioLink"].length > 0) {
            console.log("true")
            if (data == "IOC-EN") {
                this.readerForm.controls["ioType"].setValue("IOC-EX")
            } else if (data == "IOC-EX") {
                this.readerForm.controls["ioType"].setValue("IOC-EN")
            }
            this.toastr.error('Error', `IO Type change not allowed`);
        } else {
            console.log("false")
        }
    }

    reader_config_validation() {
        console.log(this.readerForm.value)
        console.log("info", this.info)
        console.log("config", this.config)
        console.log("maps", this.maps)
        console.log("mode", this.mode)
    }

    get_setting_data(type) {
        if (this.readerForm.controls["hardwareTypeId"].value && this.readerForm.controls["readerAlgoTypeId"].value) {
            return this.info["setting"][this.readerForm.controls["hardwareTypeId"].value][this.readerForm.controls["readerAlgoTypeId"].value][type]
        } else {
            return
        }
    }

    getCoordinate(location, data) {
        if (this.mode["active"] == "coordinates" || (this.multiReaderInfo.enabled && this.multiReaderInfo.id)) {
            this.handleCoordinateMode(location, data);
        } else if (this.mode["active"] == "location") {
            console.log(this.mode["active"], location, data);
        } else {
            this.syncLocation(location);
        }
    }

    handleCoordinateMode(location, data) {
        this.syncLocation(location);

        let valid = null;
        const setting = this.get_setting_data("position");
        const node1 = this.getCoordinateNode(data);

        if (this.info["all_reader"].length > 0 && !this.multiReaderInfo.enabled) {
            valid = this.findValidReader(setting, node1);
        }

        this.handlePositionResult(valid, data, location);
    }

    private getCoordinateNode(data) {
        return JSON.parse('[' + (data.latlng.lng / 100).toFixed(3) + ',' + (data.latlng.lat / -100).toFixed(3) + ']');
    }

    private findValidReader(setting, node1) {
        for (const i in this.info["all_reader"]) {
            const reader = this.info["all_reader"][i];
            if (reader.floorId == this.maps["floor_id"]) {
                if (setting[reader.readerAlgoTypeId].flag) {
                    const node2 = JSON.parse(reader.coordinate);
                    const distance = Math.sqrt(
                        Math.pow((node2[1] - node1[1]), 2) + Math.pow((node2[0] - node1[0]), 2)
                    );
                    if (setting[reader.readerAlgoTypeId].min > distance) {
                        return reader.readerName + distance.toString();
                    }
                }
            }
        }
        return null;
    }

    private handlePositionResult(valid, data, location) {
        if (valid == null) {
            this.position_change(data.latlng, location);
        } else {
            console.log("invalid postion");
            this.toastr.error('Error', `invalid postion`);
        }
    }

    syncLocation(location) {
        if (this.maps['active_location'] != null) {
            if (this.maps['active_location'] != location) {
                this.editLocation(this.maps['active_location']);
                this.editLocation(location);
            }
        } else {
            this.editLocation(location);
        }
    }

    position_change(xy, location) {
        this.info["coordinates"] = JSON.parse('[' + (xy.lng / 100).toFixed(3) + ',' + (xy.lat / -100).toFixed(3) + ']');
        this.readerForm.controls["coordinates"].setValue(this.info["coordinates"])
        this.info["location"] = location
        let locDetail = this.multiReaderInfo['locations'][location]
        this.readerForm.controls["locationId"].setValue(this.info["location"])
        if(this.multiReaderInfo.enabled && this.multiReaderInfo.id) {
            let readerDetail = this.info['all_reader'][this.multiReaderInfo['selectedIndex']];
            if(this.maps["reader_postion"][readerDetail.id]) {
                this.map.removeLayer(this.maps["reader_postion"][readerDetail.id]);
                this.map.removeLayer(this.maps["reader_postion"][readerDetail.id+"label"]);
            }
            const readerPoints = [this.info["coordinates"][1] * -100, this.info["coordinates"][0] * 100];
            const readerPosition = L.marker(readerPoints, {icon: this.maps["icon2"]});
            readerPosition.on('click', this.reader_link.bind(this, readerDetail.readerName));
            readerPosition.addTo(this.map);
            this.maps["reader_postion"][readerDetail.id] = readerPosition;

            this.info['all_reader'][this.multiReaderInfo.selectedIndex]['coordinate'] = JSON.stringify(this.info["coordinates"])
            this.info['all_reader'][this.multiReaderInfo.selectedIndex]['locationId'] = locDetail.id
            this.info['all_reader'][this.multiReaderInfo.selectedIndex]['locationName'] = locDetail['name']
            this.info['all_reader'][this.multiReaderInfo.selectedIndex]['enableUpdate'] = true;
            this.readerForm.controls.activityReaders['controls'][this.multiReaderInfo.selectedIndex]['controls']['enableUpdate'].setValue(true);
            this.readerForm.controls.activityReaders['controls'][this.multiReaderInfo.selectedIndex]['controls']['coordinate'].setValue(JSON.stringify(this.info["coordinates"]));
            this.readerForm.controls.activityReaders['controls'][this.multiReaderInfo.selectedIndex]['controls']['locationId'].setValue(locDetail.id);
            this.readerForm.controls.activityReaders['controls'][this.multiReaderInfo.selectedIndex]['controls']['floorId'].setValue(locDetail.parentId);
            this.readerForm.controls.activityReaders['controls'][this.multiReaderInfo.selectedIndex]['controls']['readerLocation'].setValue('[' + locDetail.id + ']');

            this.info['all_reader'][this.multiReaderInfo.selectedIndex]['readerLocation'] = '[' + locDetail.id + ']'
            this.info['all_reader'][this.multiReaderInfo.selectedIndex]['floorId'] = locDetail.parentId;
            if(this.info['all_reader'].every(val => val.enableUpdate) || this.multiReaderInfo.floorValidate) {
                this.multiReaderInfo.updateAction = true;    
            } else {
                this.multiReaderInfo.updateAction = false;
            }
        } else {
        if (this.maps["position"]) {
            this.map.removeLayer(this.maps["position"]);
        }
        const readerPosition = L.marker(xy, {icon: this.maps["icon1"]});
        readerPosition.addTo(this.map);
        this.maps["position"] = readerPosition;
        }
    }
    reader_link(reader, data) {
      
        if (this.mode["active"] != null && (this.mode["active"] == "alg_link" || this.mode["active"] == "relay_link" || this.mode["active"] == "io_link")) {
            this.link_reader(reader, this.maps[this.mode["active"]])
        } else {
            const isMultiReader = this.multiReaderInfo.enabled && this.multiReaderInfo.readerName != reader;
            if(isMultiReader) {
                let readerIndex = this.info['all_reader'].findIndex(val => val.readerName == reader)
                this.multiReaderInfo.readerName = reader;
                this.multiReaderInfo.id = this.info['all_reader'][readerIndex]['id']
                this.multiReaderInfo.selectedIndex = readerIndex;
                let coordinate = JSON.parse(this.info['all_reader'][readerIndex]['coordinate'])
                
                if(this.maps["reader_postion"][this.multiReaderInfo.id]) {
                    this.map.removeLayer(this.maps["reader_postion"][this.multiReaderInfo.id]);
                }
                const readerPoints = [coordinate[1] * -100, coordinate[0] * 100];
                const readerPosition = L.marker(readerPoints, {icon: this.maps["icon1"]});
                readerPosition.on('click', this.reader_link.bind(this, this.info['all_reader'][readerIndex].readerName));
                readerPosition.addTo(this.map);
                this.maps["reader_postion"][this.multiReaderInfo.id] = readerPosition;

            } else {
                console.log("active not match")
            }
        }
    }
    link_manager(type) {
        if (this.info[type].length > 0) {
            this.clearReaderLinks();
            this.maps["reader_link"] = {};
            for (let i in this.info[type]) {
                this.drawReaderLink(type, i)
            }
        } else {
            this.clearReaderLinks();
            this.maps["reader_link"] = {};
            console.log("reader link list empty")
        }
    }
    clearReaderLinks() {
        for (let key in this.maps["reader_link"]) {
            this.map.removeLayer(this.maps["reader_link"][key]);
        }
    }
    drawReaderLink(type, i) {
        if (this.readerForm.controls["coordinates"].value != null) {
            const node1 = this.readerForm.controls["coordinates"].value
            const node2 = JSON.parse(this.info["all_reader_name"][this.info[type][i]].coordinate)
            if (node2 != null) {
                const pointList = [[node1[1] * -100, node1[0] * 100], [node2[1] * -100, node2[0] * 100]];
                const readerLink = new L.Polyline(pointList, {
                    color: 'teal', weight: 5,
                    opacity: 15, smoothFactor: 1 });
                readerLink.addTo(this.map);
                this.maps["reader_link"][this.info[type][i]] = readerLink;
            } else {
                console.log("target reader position not found")
            }
        } else {
            console.log("reader position not found")
        }
    }
    show_map(floor_id) {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }

        if (this.selectedTab == 1 || this.multiReaderInfo.enabled) {
            const floor_info = this.maps["floors"][floor_id];
            if (floor_info) {
                const { minimumZoom, maximumZoom, defaultZoom } = this.getZoomLevels(floor_info);

                this.initializeMap(minimumZoom, maximumZoom, defaultZoom);

                const bounds = this.getMapBounds(floor_info);
                const floorImage = environment.api_base_url_new + floor_info.imageUrl + '?date=' + (new Date());
                L.imageOverlay(floorImage, bounds).addTo(this.map);
                this.map.on('zoomend', this.zoomCntrlLabel.bind(this));

                this.setMapView(floor_id, bounds, defaultZoom);

                for (let i in floor_info.locations) {
                    if (floor_info.locations[i].coordinates) {
                        this.drawLocation(floor_info.locations[i], '#e0ebeb');
                    }
                }

                this.zoomCntrlLabel();
                this.reader_place(floor_id);
                this.setReaderMarker(floor_id);

                if (this.multiReaderInfo.enabled) {
                    this.ShowLabel();
                }
            }
        }
    }

    getZoomLevels(floor_info) {
        let minimumZoom = -3, maximumZoom = 0, defaultZoom = -2;
        if (floor_info.defaultZoom != null && floor_info.minZoom != null && floor_info.maxZoom != null) {
            minimumZoom = -10;
            maximumZoom = floor_info.maxZoom / 20 - 10;
            defaultZoom = floor_info.defaultZoom / 20 - 10;
        }
        return { minimumZoom, maximumZoom, defaultZoom };
    }

    initializeMap(minZoom, maxZoom, zoom) {
        this.map = L.map('locationId', {
            minZoom: minZoom,
            maxZoom: maxZoom,
            center: [10, 0],
            zoom: zoom,
            crs: L.CRS.Simple,
            zoomControl: true,
            attributionControl: false
        });
    }

    getMapBounds(floor_info) {
        let southWest = null, northEast = null;
        if (floor_info.aspects != null) {
            const e = eval;
            let aspects = e(floor_info.aspects);
            southWest = this.map.unproject([0, aspects[1] * 100], this.map.getMaxZoom());
            northEast = this.map.unproject([aspects[0] * 100, 0], this.map.getMaxZoom());
        } else {
            southWest = this.map.unproject([0, 1700], this.map.getMaxZoom());
            northEast = this.map.unproject([1500, 0], this.map.getMaxZoom());
        }
        return new L.LatLngBounds(southWest, northEast);
    }

    setMapView(floor_id, bounds, defaultZoom) {
        if (this.data.id && this.mode.active == 'coordinates' && this.data["floorId"] == floor_id) {
            let readerpos = JSON.parse(this.data['coordinate']);
            let center = { "lat": readerpos[1] * -100, "lng": readerpos[0] * 100 };
            this.map.setView(center, defaultZoom);
        } else {
            this.map.setView(bounds.getCenter(), defaultZoom);
        }
    }

    setReaderMarker(floor_id) {
        if (this.info["coordinates"] && this.data.floorId == floor_id) {
            let xy = [
                this.readerForm.controls["coordinates"].value[1] * -100,
                this.readerForm.controls["coordinates"].value[0] * 100
            ];
            if (this.maps["position"]) {
                this.map.removeLayer(this.maps["position"]);
            }
            const readerPosition = L.marker(xy, { icon: this.maps["icon1"] });
            readerPosition.addTo(this.map);
            this.maps["position"] = readerPosition;
        }
    }
    zoomCntrlLabel(){
        let zoomVal = (Math.round(this.map.getZoom()) + 10) * 20;
        if(this.mapZoomCntrl) {
          this.map.removeControl(this.mapZoomCntrl)
          this.mapZoomCntrl = null;
        }
        let showZoom = L.DomUtil.create("button");
        this.mapZoomCntrl = new L.Control();
        this.mapZoomCntrl.options = { position: "topleft" };
        this.mapZoomCntrl.onAdd = () => {
          showZoom.innerText = +zoomVal + ' %';
          return showZoom;
        };
        this.map.addControl(this.mapZoomCntrl);
    }
    editLocation(location_id) {
        console.log("edit location ", location_id)
        let color = "#ffcc99"
        
        if (location_id in this.maps['location']) {
            let locationDetail = this.maps['location'][location_id]['data']
            let area = JSON.parse(locationDetail.coordinates);
            if(area.geometry.type != "Point") {
            this.map.removeLayer(this.maps['location'][location_id]['poly']);
            if (this.maps['location'][location_id]['color'] == color) {
                color = '#e0ebeb'
            }
            let poly = area.geometry.coordinates
            let test: any = [];
            for (let i in poly) {
                test.push([poly[i][1] * -100, poly[i][0] * 100])
            }
            const polygonData = L.polygon(test, { color: color});
            let className = 'reader-tooltip';
            polygonData.on('click', this.getCoordinate.bind(this, locationDetail.id));
            polygonData.addTo(this.map)
            let name = locationDetail.name.split(" ").join("<br>")
            polygonData.bindTooltip(name, { permanent: true, direction: "center", className: className }).openTooltip();
            this.maps['location'][locationDetail.id] = {
                "color": color,
                "poly": polygonData,
                "data": locationDetail
            }
            this.maps['active_location'] = location_id
            this.readerForm.controls.readerLocation.setValue([location_id]);
            }
        }
        
    }
    drawLocation(locationDetail, color) {
        let area = JSON.parse(locationDetail.coordinates);
        if (this.mode["active"] == "location" && this.readerForm.controls['readerLocation'].value) {
            console.log("check location", this.readerForm.controls['readerLocation'].value.includes(locationDetail.id))
            if (this.readerForm.controls['readerLocation'].value.includes(locationDetail.id)) {
                color = "#ffcc99"
            }
        }
        if (area && area.geometry.type != "Point") {
            let poly = area.geometry.coordinates
            let test: any = [];
            for (let i in poly) {
                test.push([poly[i][1] * -100, poly[i][0] * 100])
            }
            const polygonData = L.polygon(test, { color: color});
            let className = 'reader-tooltip';
            polygonData.on('click', this.getCoordinate.bind(this, locationDetail.id));
            polygonData.addTo(this.map)
            let name = locationDetail.name.split(" ").join("<br>")
            polygonData.bindTooltip(name, { permanent: true, direction: "center", className: className }).openTooltip();
            this.maps['location'][locationDetail.id] = {
                "color": color,
                "poly": polygonData,
                "data": locationDetail
            }
        }
    }
    reader_place(floorId) {
        if (this.maps["reader_postion"]) {
            this.map.removeLayer(this.maps["reader_postion"]);
            this.maps["reader_postion"] = {};
        }

        let readerDetail = this.info["all_reader"];
        if (!this.multiReaderInfo.enabled || this.multiReaderInfo.activityId == null) {
            readerDetail = this.info["all_reader"].filter(res => res.floorId == floorId);
        }

        for (const reader in readerDetail) {
            if (readerDetail[reader].coordinate !== null) {
                const value = JSON.parse(readerDetail[reader].coordinate);
                const readerPoints = [value[1] * -100, value[0] * 100];

                if (this.multiReaderInfo.enabled && this.multiReaderInfo.activityId) {
                    this.addMultiReaderLabel(readerDetail[reader], readerPoints);
                } else {
                    this.addSingleReaderLabel(readerDetail[reader], readerPoints);
                }

                this.addReaderMarker(readerDetail[reader], readerPoints);
            }
        }
    }

    addMultiReaderLabel(reader, readerPoints) {
        let hazardDistance = this.multiReaderInfo.activityId
            ? this.multiReaderInfo['HazardDistance'][reader.readerName]
            : "";

        const readerPositionLabel = L.marker(readerPoints, {
            icon: L.divIcon({
                html: "<div>" + reader.readerName + " <span style='font-size: 7px; padding-left: 7px;'>Hide</span><br><span style='font-weight: 100;'>" + "HV :" + hazardDistance + "</span></div>",
                className: 'text-below-marker',
            })
        }).on('click', this.reader_position_hide.bind(this, "hide", reader.id)).addTo(this.map);

        this.maps["reader_postion"][reader.id + "label"] = readerPositionLabel;
    }

    addSingleReaderLabel(reader, readerPoints) {
        const alg_type = reader.readerAlgoTypeId ? " / " + reader.readerAlgoTypeId.split("-")[1] : "";

        const readerPositionLabel = L.marker(readerPoints, {
            icon: L.divIcon({
                html: "<div>" + reader.readerName + " <span style='font-size: 7px; padding-left: 7px;'>Hide</span><br><span style='font-weight: 100;'>" + reader.hardwareTypeName + alg_type + "</span></div>",
                className: 'text-below-marker',
            })
        }).on('click', this.reader_position_hide.bind(this, "hide", reader.id)).addTo(this.map);

        this.maps["reader_postion"][reader.id + "label"] = readerPositionLabel;
    }

    addReaderMarker(reader, readerPoints) {
        const readerPosition = L.marker(readerPoints, { icon: this.maps["icon2"] });
        readerPosition.on('click', this.reader_link.bind(this, reader.readerName));
        readerPosition.addTo(this.map);

        this.maps["reader_postion"][reader.id] = readerPosition;
    }
    reader_position_hide(type, id, data) {
        // console.log(type, id, data)
        let reader_info = this.info["all_reader_id"][id];
        let index = null;
        if(this.multiReaderInfo.enabled) {
            index = id;
            if(data) {
                index = this.info['all_reader'].findIndex(val => val.id == id);
            }
            reader_info = this.info['all_reader'][index];
            id = this.info['all_reader'][index]['id'];
        }
        const value =  JSON.parse(reader_info.coordinate)    
        const readerPoints = [value[1] * -100, value[0] * 100];
        this.removeReaderFromMap(id);
        if (type == "hide") {
            this.addHiddenReaderLabel(reader_info, readerPoints);
        } else {
            this.addVisibleReaderLabel(reader_info, readerPoints);
        }
        this.addVisibilityReaderMarker(reader_info, readerPoints);
    }
    removeReaderFromMap(id) {
        if (this.maps["reader_postion"][id+"label"]) {
            this.map.removeLayer(this.maps["reader_postion"][id+"label"]);
            this.map.removeLayer(this.maps["reader_postion"][id]);
            delete this.maps["reader_postion"][id+"label"];
            delete this.maps["reader_postion"][id];
        }
    }
    addHiddenReaderLabel(reader_info, readerPoints) {
        if(this.multiReaderInfo.enabled && this.multiReaderInfo.activityId) {
            let hazardDistance = this.multiReaderInfo.activityId ? this.multiReaderInfo['HazardDistance'][reader_info.readerName] : "";
            const readerPositionLabel = L.marker(readerPoints, {
                icon: L.divIcon({
                    html: "<div><span style='font-size: 9px; font-weight: 800;'>Open</span><br>"+ "" + hazardDistance +"</div>",
                    className: 'text-below-marker-hide',
                    })
                }).on('click', this.reader_position_hide.bind(this, "open", reader_info.id)).addTo(this.map);
                this.maps["reader_postion"][reader_info.id+"label"] = readerPositionLabel;
        } else {
        const alg_type  = reader_info.readerAlgoTypeId ? reader_info.readerAlgoTypeId.split("-")[1] : ""
        const readerPositionLabel = L.marker(readerPoints, {
            icon: L.divIcon({
                html: "<div><span style='font-size: 9px; font-weight: 800;'>Open</span><br>"+ alg_type +"</div>",
                className: 'text-below-marker-hide',
                })
            }).on('click', this.reader_position_hide.bind(this, "open", reader_info.id)).addTo(this.map);
            this.maps["reader_postion"][reader_info.id+"label"] = readerPositionLabel;
        }
    }
    addVisibleReaderLabel(reader_info, readerPoints) {
        if(this.multiReaderInfo.enabled && this.multiReaderInfo.activityId) {
            let hazardDistance = this.multiReaderInfo.activityId ? this.multiReaderInfo['HazardDistance'][reader_info.readerName] : "";
            const readerPositionLabel = L.marker(readerPoints, {
                icon: L.divIcon({
                    html: "<div>" + reader_info.readerName + " <span style='font-size: 7px; padding-left: 7px;'>Hide</span><br><span style='font-weight: 100;'>" + "HV :" + hazardDistance +"</span></div>",
                    className: 'text-below-marker',
                })
            }).on('click', this.reader_position_hide.bind(this, "hide", reader_info.id)).addTo(this.map);
            this.maps["reader_postion"][reader_info.id+"label"] = readerPositionLabel;
        } else {
        const alg_type  = reader_info.readerAlgoTypeId ? " / "+reader_info.readerAlgoTypeId.split("-")[1] : ""
        const readerPositionLabel = L.marker(readerPoints, {
            icon: L.divIcon({
                html: "<div>" + reader_info.readerName + " <span style='font-size: 7px; padding-left: 7px;'>Hide</span><br><span style='font-weight: 100;'>" + reader_info.hardwareTypeName + alg_type +"</span></div>",
                className: 'text-below-marker',
                })
            }).on('click', this.reader_position_hide.bind(this, "hide", reader_info.id)).addTo(this.map);
            this.maps["reader_postion"][reader_info.id+"label"] = readerPositionLabel;
        }
    }
    addVisibilityReaderMarker(reader_info, readerPoints) {
        let iconName = this.multiReaderInfo.enabled && this.multiReaderInfo.id == reader_info.id ? "icon1" : "icon2";
        const readerPosition = L.marker(readerPoints, {icon: this.maps[iconName]});
        readerPosition.on('click', this.reader_link.bind(this, reader_info.readerName));
        readerPosition.addTo(this.map);
        this.maps["reader_postion"][reader_info.id] = readerPosition;
    }
    rollback(typ, data) {
        console.log("rollback", typ, data)
        if (typ == 'meshType') {
            console.log("rollback meshType", typ, data)
            console.log(this.info['meshLink'])

        }
    }
    onWindowResized(size) {
        this.height = size;
    }



    
    versionSelect(value) {
        this.swVersion = true;
        this.selected_swVer = value;
    }
    update_software_version(id) {
        if (this.current_swVer.length !== 0 ) {
        const from_ver = this.current_swVer[0].swVersion;
        const version = this.selected_swVer;
        this.dialog.open(ConfirmationDialog, {
            panelClass:['confirmation-popup'], disableClose: true,
            data: {
              title: 'Version Update', message: 'Do you want to update the version from',
              buttonText: { ok: 'Yes', cancel: 'No' },
              'isRemark': 1, 'swversionUpdate': true, 'version': version, 'id': id, 'fromVersion': from_ver, 'type': 'swVerUpdate'
            }
          });
        } else {
        const version = this.selected_swVer;
        this.dialog.open(ConfirmationDialog, {
            panelClass:['confirmation-popup'], disableClose: true,
            data: {
              title: 'Version Update', message: 'Do you want to update the version',
              buttonText: { ok: 'Yes', cancel: 'No' },
              'isRemark': 1, 'swversionUpdate': true, 'version': version, 'id': id, 'type': 'newswVerUpdate'
            }
          });
        }
    }
    getVersionHistory() {
        this.configurationServices.getVersionHistory(this.data.id).subscribe(res => {
            if (res.statusCode == 1) {
                this.verHistory = res.results;
                const Columns = ['fromVersion', 'toVersion', 'startedOn', 'versionStatusName'];
                for (let i = 0; i <= Columns.length; i++) {
                    this.verHistory.map(data => {
                        data[this.VerdisplayedColumns[i]] = data[Columns[i]];
                    });
                }
                this.VerdataSource = new MatTableDataSource<any>(res.results);
            }
        });
    }

    fixClick() {
        console.log('')
    }
}
