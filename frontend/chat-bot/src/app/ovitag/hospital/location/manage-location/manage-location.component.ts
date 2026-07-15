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
import { Component, OnInit, ViewEncapsulation, Inject, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTreeNestedDataSource, MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { NestedTreeControl, FlatTreeControl } from '@angular/cdk/tree';
import { of as observableOf } from 'rxjs';
import * as L from 'leaflet';
import 'leaflet-draw';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { HospitalService } from './../../../../shared/services/hospital.service';
import { CommonService } from './../../../../shared/services/common.service';
import { environment } from './../../../../../environments/environment'
import { ConfirmDialogComponent } from '../../../../shared/modules/entry-component/layout-save/layout-save.component';
import { ErrorStateMatcherService } from '../../../../shared/services/error-state-matcher.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { ManageLocationViewComponent } from './manage-location-view/manage-location-view.component';
import { StyleLoaderService } from '../../../../shared/services/style-loader.service ';
import { AppToastService } from '../../../../shared/services/toaster.service';
import 'leaflet-path-transform';
import 'leaflet-imageoverlay-rotated';

@Component({
  selector: 'common-location',
  templateUrl: './manage-location.component.html',
  styleUrls: ['./manage-location.component.scss'],
  encapsulation: ViewEncapsulation.None
})


export class ManageLocationComponent implements OnInit {
  public matcher = new ErrorStateMatcherService();
  public locationForm: FormGroup;
  public locationList: any = [];
  public locations: any = {
    'all': [],
    'parent': [],
    'logical': []
  };
  public isNestedTree: boolean = true;
  public locConfig: any = {};
  public treeControl: NestedTreeControl<any>;
  public dataSource: MatTreeNestedDataSource<any>;

  // FLAT TREE 
  private readonly transformer = (node: any, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      level: level,
      aspects: node.aspects,
      children: node.children,
      coordinates: node.coordinates,
      defaultZoom: node.defaultZoom,
      disLocLevel: node.disLocLevel,
      geoCoordinate: node.geoCoordinate,
      id: node.id,
      isLogicalParent: node.isLogicalParent,
      isQuickLocation: node.isQuickLocation,
      isSearchPriority: node.isSearchPriority,
      labelPoint: node.labelPoint,
      labelStyle: node.labelStyle,
      locationTypeId: node.locationTypeId,
      locationTypeLevel: node.locationTypeLevel,
      locationTypeName: node.locationTypeName,
      logicalParentId: node.logicalParentId,
      mapOrient: node.mapOrient,
      maxZoom: node.maxZoom,
      minZoom: node.minZoom,
      parentId: node.parentId,
      polygonStyle: node.polygonStyle,
      status: node.status
    };
  }
  treeFlatControl = new FlatTreeControl<any>(node => node.level, node => node.expandable);
  treeFlattener = new MatTreeFlattener(this.transformer, node => node.level, node => node.expandable, node => node.children);
  public flatDataSource = new MatTreeFlatDataSource(this.treeFlatControl, this.treeFlattener);

  public selectedRow = null;
  public selectedTabIndex = 0;
  public showMap = false;
  public isLoading = false;
  public showChild = false;
  public showInput = false;
  public enableSave = true;
  public isDeleted = false;
  public mapRef = 'floorMap';
  public floorMap = null;
  public parentDetail = null;
  public categoryList = [];
  public careSettingList = [];
  public locationTypes = [];
  public locallTypes = []
  public isAddlocation = null;
  public addMore = null;
  public level = 0;
  public windWidth = window.innerWidth
  public mapControl = {
    minZoom: 0,
    maxZoom: 220,
    defaultZoom: 100,
    disLocLevel: 100,
    orient: 0,
    coordinates: null,
    imageData: null,
    direction: null,
    tooltip_polygon: {},
    zoomCtrl: null,
    distance: {
      enable: false,
      scale: null,
      polylinePoints: [],
      distPolyline: {}
    }
  }

  public id = 17939;
  public parentId = 17938;
  public statusList = [{ id: 'Active', name: 'Active' }, { id: 'Inactive', name: 'Inactive' }]
  public openAutocom: boolean = false;
  public configRoom = false;
  public enableFloorChange = false;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;
  @ViewChild('autocompleteTrigger') matACTrigger: MatAutocompleteTrigger;
  workFlowList: [] = [];
  parentList: any = [];
  logicalParentList: any = [];
  blockList = [];
  floorList = [];
  blockForm: FormGroup;
  selectedBlock = [];
  selectedFloor = [];
  enableBlockInfo = true;
  isPointBasedPolygon = false;
  displayPolygonImage = true;
  isMapView = true;
  constructor(private readonly styleLoader: StyleLoaderService, private readonly clipboard: Clipboard, private readonly form: FormBuilder, private readonly hospitalService: HospitalService, private readonly commonService: CommonService,
    public toastr: AppToastService, private readonly dialog: MatDialog, private readonly thisDialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.selectedRow = this.data;
    this.getBasicDetails();
    this.getAllLocation();
  }

  ngOnInit() {
    this.blockForm = this.form.group({
      blockId: [null],
      floorId: [null]
    });
    this.styleLoader.loadStyleByType('leaflet');
  }

  getBasicDetails() {
    this.commonService.getLocations().subscribe(res => {
      this.locations['all'] = res.results;
      // will use it for parent location change
    });
    this.commonService.getConfigFile('location-config').subscribe(res => {
      if (res.statusCode == 1) {
        this.locConfig = res.results.contentObject
        if (this.locConfig.hasOwnProperty('autoCreate') && this.locConfig?.autoCreate === true) {
          this.configRoom = true;
        } else {
          this.configRoom = false;
        }
        if (this.locConfig.hasOwnProperty('treeView')) {
          this.isNestedTree = this.locConfig.treeView == 'nested';
        }
        if (this.locConfig.hasOwnProperty('enableFloorChange')) {
          this.enableFloorChange = this.locConfig.enableFloorChange;
        }
      }
    });
    this.commonService.getAppTerms('CareSetting,LocationCategory,WorkFlow').subscribe(res => {
      this.careSettingList = res.results.filter(val => val.groupName === 'CareSetting');
      this.categoryList = res.results.filter(val => val.groupName === 'LocationCategory');
      this.workFlowList = res.results.filter(val => val.groupName === 'WorkFlow');
    });

    this.hospitalService.getAllLocationType().subscribe(res => {
      this.locallTypes = res.results
    });
  }

  getBlockWithFloor(type, data?) {
    if(type === 'block') {
      const level = data?.locationTypeLevel;
      this.hospitalService.getBlockWithFloors().subscribe(res => {
        this.blockList = res.results;
        let selectedBlockId = level === 1 ? data?.id : level === 2 ? data?.parentId : this.locationList[0]?.children[0]?.id;
        this.selectedBlock = level === 1 ? data ?? this.locationList[0]?.children[0] : {} ;
        if(level === 2) {
          this.blockForm.get('blockId').setValue(selectedBlockId);
          const list = this.blockList?.filter(x=> x.id === selectedBlockId);
          this.selectedBlock = list[0];
        } else if(level === 3) {
          this.blockList?.forEach(block => {
            block?.children?.forEach(floor => {
              if(floor.id === data?.parentId) {
                this.blockForm.get('blockId').setValue(block?.id);
                this.selectedBlock = block;
              }
            }) 
          })
        } else if(level === 4) {
          this.addMore = false;
          this.getLocationType(data, false);
        } else {
          this.selectedBlock = level === 0 ? data?.children[0] : this.selectedBlock;
          this.blockForm.get('blockId').setValue(selectedBlockId);
          this.selectedBlock = this.selectedBlock;
        }
        const blockId = this.blockForm.get('blockId').value;
        const block = this.blockList?.filter(x => x.id === blockId);
        if(block?.length > 0) {
          this.floorList = block[0]?.children?.filter(x => x.locationTypeId === 2 || x.locationTypeId === 27);
          if(this.floorList?.length > 0) {
            const selectedFloorId = level === 2 ? data?.id : level === 3 ? data?.parentId : this.floorList[0].id;
            this.blockForm.get('floorId').setValue(selectedFloorId);
            this.getFilteredLocationData(this.locationList, this.selectedRow);
          } else {
            this.enableBlockInfo = false
            this.addMore = false;
            this.getLocationType(this.selectedBlock, true);
          }
        } else {
          this.floorList = [];
        }
      });
    } else {
      this.isAddlocation = null;
      this.dataSource.data = [];
      this.flatDataSource.data = [];
      const blockId = this.blockForm.get('blockId').value;
      const block = this.blockList?.filter(x => x.id === blockId);
      if(block?.length > 0) {
        this.selectedBlock = block[0];
        this.selectedRow = block[0];
        this.floorList = block[0]?.children?.filter(x => x.locationTypeId === 2 || x.locationTypeId === 27);
        if(this.floorList?.length > 0) {
          this.blockForm.get('floorId').setValue(this.floorList[0].id);
          this.getFilteredLocationData(this.locationList);
        } else {
          this.addMore = false;
          this.getLocationType(this.selectedBlock, true);
        }
      } else {
        this.floorList = [];
      }
    }
  }
  getAllLocation() {
    this.treeControl = new NestedTreeControl<any>(this.makeGetChildrenFunction());
    this.dataSource = new MatTreeNestedDataSource();
    this.flatDataSource = new MatTreeFlatDataSource(this.treeFlatControl, this.treeFlattener);
    this.flatDataSource.data = [];
    this.dataSource.data = []
    this.isLoading = true;
    this.commonService.getLogicalLoction().subscribe(res => {
      res.results = res.results ? res.results : [];
      this.locationList = res.results;
      if(this.locationList[0]?.children[0]?.children?.length > 0) {
        if(!this.selectedRow || this.selectedRow?.locationTypeLevel === 0) {
          this.addMore = false;
          this.getBlockWithFloor('block', this.locationList[0]);
          this.getLocationType(this.locationList[0], false);
        } else {
          this.getBlockWithFloor('block', this.selectedRow);
        }
      } else {
        this.dataSource.data = res.results;
        this.flatDataSource.data = res.results;
        this.isLoading = false;
        this.selectedRow = this.selectedRow ? this.selectedRow : res.results?.length ? res.results[0] : null;
        this.getLocationType(res.results[0], this.isAddlocation);
      }
    }, error => { this.isLoading = false; });
  }
  getFilteredLocationData(location, row?) {
    const level = this.selectedRow?.locationTypeLevel;
    const floorId = this.blockForm.get('floorId')?.value;
    const filtered = this.getFloorLevel(location, floorId);
    this.selectedFloor = filtered;
    if(filtered?.children?.length > 0) {
      this.dataSource.data = filtered?.children;
      this.flatDataSource.data = filtered?.children;
      this.isLoading = false;
      if(level === 2 || level === 1) {
        this.enableBlockInfo = false;
        this.addMore = false;
        const row = this.selectedFloor?.length !== 0 ? this.selectedFloor : (level === 1 ? this.selectedBlock : this.selectedRow);
        this.getLocationType(row, false);
      } else if(level === 3 || level === 4) {
        setTimeout(() => {
          const flatNodes = this.treeFlatControl.dataNodes;

          const target = flatNodes.find(n => n.id === this.selectedRow?.id);
          if (!target) return;

          this.treeFlatControl.expand(target);

          // Expand parents
          let currentLevel = target.level;

          for (let i = flatNodes.indexOf(target) - 1; i >= 0; i--) {
            const node = flatNodes[i];
            if (node.level < currentLevel) {
              this.treeFlatControl.expand(node);
              currentLevel = node.level;
            }
            if (currentLevel === 0) break;
          }
        });
        this.selectedRow = this.selectedRow ? this.selectedRow : null;
        this.getLocationType(row ? row : this.selectedFloor?.length !== 0 ? this.selectedFloor : this.selectedRow, this.isAddlocation);
      } else {
        if(level && level !== 0) {
          this.selectedRow = this.selectedRow ? this.selectedRow : filtered?.children?.length ? filtered?.children[0] : null;
          this.getLocationType(filtered?.children[0], this.isAddlocation);
        }
      }
    } else {
      this.addMore = false;
      this.getLocationType(this.selectedFloor, false);
    }
  }
  getFloorLevel(nodes: any[], floorId: number): any {
    const findFloor = (list: any[]): any => {
      for (const node of list) {
        if (node.id === floorId && node.locationTypeLevel === 2) {
          return node;
        }
        if (node.children) {
          const found = findFloor(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const floorNode = findFloor(nodes);
    if (!floorNode) return null;

    const filterL3L4 = (list: any[]): any[] => {
      const result: any[] = [];
      list.forEach(node => {
        const children = node.children ? filterL3L4(node.children) : [];
        if (node.locationTypeLevel === 3 || node.locationTypeLevel === 4) {
          result.push({ ...node, children });
        }
      });
      return result;
    };
    return { ...floorNode, children: filterL3L4(floorNode.children || []) };
  }
  getLocationType(data, isAdd) {
    if (this.openAutocom) {
      this.matACTrigger.closePanel();
      this.openAutocom = false;
    }
    this.enableSave = true;
    this.selectedTabIndex = isAdd ? 0 : this.selectedTabIndex;
    if (this.isDeleted || this.addMore || this.selectedRow != data || (isAdd == null || isAdd != this.isAddlocation)) {
      this.isAddlocation = isAdd == null ? false : isAdd;
      this.selectedRow = data;
      this.isDeleted = false;
      let locationId = this.isAddlocation ? data.id : (data ? data.parentId : null);

      this.hospitalService.getAllLogicalLocationType(locationId).subscribe(res => {
        this.locationTypes = res.results;
        if((data?.locationTypeId === 26 && isAdd) || (data?.locationTypeId === 27 && !isAdd)) {
          const list = this.locationTypes?.filter(x => x.id === 27);
          this.locationTypes = list;
        }
        if (this.selectedRow && !this.isAddlocation) {
          this.level = this.selectedRow.locationTypeLevel
        } else if (this.locationTypes.length) {
          this.level = this.locationTypes[0].level
        }
        this.buildForm(data);
        this.getLocationDetail(data);
      });
    } else {
      // console.log('same location')
      this.getTreeview(data)
    }
  }
  getLocationTypeConfig(locTypeId) {
    if (this.isAddlocation) {
      if (this.locConfig.hasOwnProperty('polygonColor') && this.locConfig.polygonColor.hasOwnProperty(locTypeId)) {
        this.locationForm.controls.polygonColor.setValue(this.locConfig.polygonColor[locTypeId])
      }
      if (this.locConfig.hasOwnProperty('labelStyle') && this.locConfig.labelStyle.hasOwnProperty(locTypeId)) {
        this.locationForm.controls.labelStyle.setValue(this.locConfig.labelStyle[locTypeId])
      }
    }
  }
  getCategoryConfig(categoryId) {
    if (this.isAddlocation) {
      if (this.locConfig.hasOwnProperty('polygonColor') && this.locConfig.polygonColor.hasOwnProperty(categoryId)) {
        this.locationForm.controls.polygonColor.setValue(this.locConfig.polygonColor[categoryId])
      }
    }
  }
  localcopy(value) {
    this.clipboard.copy(value)
  }
  getLocationDetail(locData) {
    this.showChild = false;
    if (locData) {
      this.getTreeview(locData)
      let parentId = null;
      parentId = this.isAddlocation ? locData.id : this.level == 0 ? locData.id : locData.parentId
      let typeDetail = this.locallTypes?.filter(val => val.id == locData.locationTypeId)[0]
      if (this.isAddlocation && typeDetail?.isLogicalParent) {
        parentId = locData.parentId
        if (this.isAddlocation) {
          this.getLocationTypeConfig(typeDetail.id)
        }
      }
      this.enableSave = false;
      this.isLoading = true;
      this.hospitalService.getLogicalLocationById(parentId).subscribe(res => {
        this.parentDetail = res.results[0];
        if(this.selectedRow?.locationTypeLevel === 4) {
          if(res.results?.length > 0) {
            const data = res.results[0];
            data['locationTypleLevel'] = 3;
            this.getBlockWithFloor('block', data)
          }
        }
        if (this.level == 0) {
          this.selectedRow = this.parentDetail;
          this.buildForm(this.parentDetail)
        }
        if ([1, 2, 3].includes(this.level)) {
          let data = this.parentDetail?.children.filter(val => val.id == this.selectedRow.id)
          if (data.length) {
            if (!data[0].coordinates && locData.coordinates) {
              data[0].coordinates = locData.coordinates;
            }
            if (data[0]?.coordinates) {
              try {
                const coordData = JSON.parse(data[0].coordinates);
                this.isMapView = coordData?.unit === 'latlng';
              } catch {
                this.isMapView = false;
              }
            } else {
              this.isMapView = true;
            }
            this.selectedRow = data[0];
            this.buildForm(data[0])
          } else {
            data = this.parentDetail?.children.filter(val => val.id == this.selectedRow.logicalParentId)
            if (data.length && data[0]['children'].length) {
              data = data[0].children.filter(val => val.id == this.selectedRow.id)
              if (data.length) {
                if (!data[0].coordinates && locData.coordinates) {
                  data[0].coordinates = locData.coordinates;
                }
                this.selectedRow = data[0];
                this.buildForm(data[0])
              }
            }
          }
        }
        if (this.level === 3) {
          this.locationForm.get('parentId').setValidators(Validators.required);
          this.locationForm.get('logicalParentId').setValidators(Validators.required);
          this.getParentAndLogicalParent(this.parentDetail, parentId, locData);
        } else {
          this.locationForm.get('parentId').setValidators(null);
          this.locationForm.get('logicalParentId').setValidators(null);
        }
        // console.log(this.level)
        if (this.level === 4) {
          let data = this.parentDetail?.children.filter(val => val.id == this.selectedRow.id)
          if (data?.length) {
            if (!data[0].coordinates && locData.coordinates) {
              data[0].coordinates = locData.coordinates;
            }
            this.selectedRow = data[0];
            this.buildForm(data[0])
          }
          parentId = this.isAddlocation ? locData.parentId : this.parentDetail?.parentId
          this.hospitalService.getLogicalLocationById(parentId).subscribe(res => {
            this.parentDetail = res.results[0];
            this.enableSave = true;
            this.isLoading = false;
            if (this.showMap) { this.getMap(); }
          }, error => { this.isLoading = false; });
        } else {
          this.enableSave = true;
          this.isLoading = false;
          if (this.showMap) { this.getMap(); }
        }
      }, error => { this.isLoading = false; });
    }
  }
  hasChild = (_: number, node: any) => node.expandable;
  hasChildren = (_: number, node: any) => { return node.children && node.children.length > 0 }
  private makeGetChildrenFunction() {
    return node => observableOf(node.children)
  }
  
  toggleMapView(checked) {
    this.isMapView = checked;
    if (this.isMapView && this.mapControl.coordinates) {
      try {
        const coordData = JSON.parse(this.mapControl.coordinates);
        if (coordData?.unit !== 'latlng') {
          this.mapControl.coordinates = null;
        }
      } catch {
        this.mapControl.coordinates = null;
      }
    }
    this.getMap();
  }

  getMap() {
    let isMapView = this.isMapView;
    if(this.showChild){
      this.isMapView = false;
    }else{
      this.isMapView = isMapView;
    }
    if (this.floorMap) {
      this.floorMap.remove();
      this.floorMap = null
    }
    let locTypeId = this.locationForm.controls.locationTypeId.value;
    let mapData = this.parentDetail;
    if (this.selectedRow == null || this.level == 0 || (this.level == 1 && !this.showChild) || (locTypeId == 23 || this.parentDetail?.locationTypeId == 23)
    || locTypeId == 26 || locTypeId == 27 ||(locTypeId == 2 && this.isMapView)) {
      const mapUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      this.floorMap = L.map(this.mapRef, {
        center: new L.LatLng(45.78771148665357, 15.967683792394526),
        minZoom: this.mapControl.minZoom / 10 <= 19 ? this.mapControl.minZoom / 10 : 19,
        maxZoom: this.mapControl.maxZoom / 10 <= 19 ? this.mapControl.maxZoom / 10 : 19,
        zoom: this.mapControl.defaultZoom / 10 <= 19 ? this.mapControl.defaultZoom / 10 : 19,
        zoomControl: true, attributionControl: false
      });
      if (true) {
        L.tileLayer(mapUrl, {
          maxZoom: 19,
          subdomains: 'abc'
        }).addTo(this.floorMap);
      } else if (false) {
        const customTileLayer = L.TileLayer.extend({
          createTile: function (coords, done) {
            const tileUrl = mapUrl
              .replace('{z}', coords.z.toString())
              .replace('{x}', coords.x.toString())
              .replace('{y}', coords.y.toString());
            const tile = document.createElement('img');
            tile.setAttribute('role', 'presentation');
            tile.crossOrigin = 'Anonymous';
            tile.src = '';
            const path = tileUrl.replace("https://tile.openstreetmap.org/", "OviTag/").replace(".png", "")
            this.getTileFromDB(path)
              .then((cachedTile) => {
                if (cachedTile) {
                  tile.src = URL.createObjectURL(cachedTile);
                  done(null, tile);
                } else {
                  fetch(tileUrl)
                    .then((response) => response.blob())
                    .then((blob) => {
                      this.saveTileToDB(path, blob);
                      tile.src = URL.createObjectURL(blob);
                      done(null, tile);
                    })
                    .catch((err) => {
                      console.error(`Error fetching tile: ${path}`, err);
                      done(err, tile);
                    });
                }
              })
              .catch((err) => {
                console.error(`Error accessing IndexedDB: ${path}`, err);
                done(err, tile);
              });
            return tile;
          },

          getTileFromDB(url: string): Promise<Blob | null> {
            return new Promise((resolve, reject) => {
              const request = indexedDB.open('offlineMapCache', 1);
              request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('tiles')) {
                  db.createObjectStore('tiles', { keyPath: 'url' });
                }
              };
              request.onsuccess = (event: any) => {
                const db = event.target.result;
                const transaction = db.transaction('tiles', 'readonly');
                const store = transaction.objectStore('tiles');

                const getRequest = store.get(url);
                getRequest.onsuccess = () => {
                  if (getRequest.result) {
                    resolve(getRequest.result.blob);
                  } else {
                    resolve(null);
                  }
                };
                getRequest.onerror = (error) => {
                  console.error(`Error fetching tile from cache: ${url}`, error);
                  reject(error);
                };
              };
              request.onerror = (error) => {
                console.error(`IndexedDB open error: ${url}`, error);
                reject(error);
              }
              request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('tiles')) {
                  db.createObjectStore('tiles', { keyPath: 'url' });
                }
              };
              request.onsuccess = (event: any) => {
                const db = event.target.result;
                const transaction = db.transaction('tiles', 'readonly');
                const store = transaction.objectStore('tiles');

                const getRequest = store.get(url);
                console.log(`Checking cache for: ${url}`);
                getRequest.onsuccess = () => {
                  if (getRequest.result) {
                    console.log(`Tile found in cache: ${url}`);
                    resolve(getRequest.result.blob);
                  } else {
                    console.log(`Tile not found in cache: ${url}`);
                    resolve(null);
                  }
                };
                getRequest.onerror = (error) => {
                  console.error(`Error fetching tile from cache: ${url}`, error);
                  reject(error);
                };
              };
              request.onerror = (error) => {
                console.error(`IndexedDB open error: ${url}`, error);
                reject(error);
              };
            });
          },

          saveTileToDB(url: string, blob: Blob): void {
            const request = indexedDB.open('offlineMapCache', 1);
            request.onupgradeneeded = (event: any) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains('tiles')) {
                db.createObjectStore('tiles', { keyPath: 'url' });
              }
            };
            request.onsuccess = (event: any) => {
              const db = event.target.result;
              const transaction = db.transaction('tiles', 'readwrite');
              const store = transaction.objectStore('tiles');
              const tileData = { url, blob };
              const putRequest = store.put(tileData);
              putRequest.onsuccess = () => {
                console.log(`Tile cached successfully: ${url}`);
              };
              putRequest.onerror = (error) => {
                console.error(`Error caching tile: ${url}`, error);
              };
              transaction.oncomplete = () => {
                console.log('Transaction completed successfully.');
              };
              transaction.onerror = (error) => {
                console.error('Transaction error:', error);
              };
            };
            request.onerror = (error) => {
              console.error(`Error opening IndexedDB for saving tile: ${url}`, error);
            };
          },

        });
        const layer = new customTileLayer(mapUrl, {
          maxZoom: 22,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        });
        layer.addTo(this.floorMap);
      }
      const provider = new class extends OpenStreetMapProvider {
        endpoint({ query }) {
          return super.endpoint({ query, protocol: 'https:' });
        }
      };
      const searchControl = new GeoSearchControl({
        provider: provider,
        position: 'topleft'
      });
      this.floorMap.addControl(searchControl);
      this.floorMap.on('geosearch/showlocation', function (e) {
      });
      this.floorMap.on('geosearch/marker/dragend', function (e) {
      });

    } else {
      let locationId = this.isAddlocation ? this.selectedRow.id : (this.selectedRow ? this.selectedRow.parentId : null);
      if (this.showChild) {
        mapData = this.selectedRow
        this.floorMap = L.map(this.mapRef, {
          center: [0, 0],
          minZoom: this.mapControl.minZoom ? this.mapControl.minZoom / 20 - 10 : -4,
          maxZoom: this.mapControl.maxZoom ? this.mapControl.maxZoom / 20 - 10 : 0,
          zoom: this.mapControl.defaultZoom ? this.mapControl.defaultZoom / 20 - 10 : -2,
          zoomControl: true,
          crs: L.CRS.Simple, attributionControl: false
        });
      } else {
        this.floorMap = L.map(this.mapRef, {
          center: [0, 0],
          minZoom: mapData.minZoom ? mapData.minZoom / 20 - 10 : -4,
          maxZoom: mapData.maxZoom ? mapData.maxZoom / 20 - 10 : 0,
          zoom: mapData.defaultZoom ? mapData.defaultZoom / 20 - 10 : -2,
          zoomControl: true,
          crs: L.CRS.Simple, attributionControl: false
        });
      }

      let width = 1500; let height = 1700;
      if (mapData.aspects) {
        let coodata = JSON.parse(mapData.aspects);
        width = coodata[0] * 100
        height = coodata[1] * 100
      }
      let imageUrl = environment.api_base_url_new + 'api/location/get-location-image/' + mapData.id + '?date=' + (new Date());
      let sw = this.floorMap.unproject([0, height], this.floorMap.getMaxZoom());
      let ne = this.floorMap.unproject([width, 0], this.floorMap.getMaxZoom());
      let bounds = new L.LatLngBounds(sw, ne);
      L.imageOverlay(imageUrl, bounds).addTo(this.floorMap);
      this.floorMap.setMaxBounds(bounds);
      this.zoomLabel()
    }
    this.floorMap.on('zoomend', this.displayLocation.bind(this, mapData));
    this.floorMap.on('click', this.polyLineDist.bind(this))
    if (!this.showChild) {
      this.mapDraw()
    }
    this.getDistanceControl()
    this.getchildDetail(mapData)
  }
  getchildDetail(data) {    
    if (data) {
      this.mapControl.tooltip_polygon = {};
      if ((this.level != 1 || (this.level == 1 && !this.showChild)) && (this.level != 2 || (this.level == 2 && !this.showChild)) && this.level != 3 && this.level != 4) {
        if (data.coordinates) {
          this.bindPolygon(data)
        }
      }
      if ((this.showChild || this.parentDetail.locationTypeId == 23 || this.locationForm.controls.locationTypeId.value === 23) && data.coordinates) {
        this.bindPolygon(data)
      }
      let childData = data.children;
      for (let i in childData) {
        if (childData[i].coordinates) {
          this.bindPolygon(childData[i])
        }
        console.log(childData[i].locationTypeLevel)
        if (childData[i].locationTypeLevel > 2 && childData[i].children.length) {
          let innerChildData = childData[i].children
          for (let j in innerChildData) {
            if (innerChildData[j].coordinates) {
              this.bindPolygon(innerChildData[j])
            }
            if (innerChildData[j].locationTypeLevel > 2 && innerChildData[j].children.length) {
              let level2child = innerChildData[j].children;
              for (let k in level2child) {
                if (level2child[k].coordinates) {
                  this.bindPolygon(level2child[k])
                }
              }
            }
          }
        }
      }
    }
  }
  bindPolygon(data) {
    const locTypeId = this.locationForm?.controls?.locationTypeId?.value;
    if ((locTypeId == 27 || (locTypeId == 2 && this.isMapView)) && data.id !== this.selectedRow?.id) {
      return;
    }
    let area = JSON.parse(data.coordinates);
    if (area) {
      const coordUnit = area.unit || 'metre';
      if (this.isMapView && coordUnit !== 'latlng') return;
      let poly = area.geometry.coordinates
      let polyValue = []
      if (area.geometry.type == "Point") {
        polyValue = [poly[1], poly[0]];
      } else {
        for (let i in poly) {
          if (area.hasOwnProperty('unit') && area.unit == 'latlng') {
            polyValue.push([poly[i][1], poly[i][0]])
          } else {
            polyValue.push([poly[i][1] * -100, poly[i][0] * 100])
          }
        }
      }
      let polyBound = null;
      if (area.geometry.type == "Point") {
        polyBound = L.marker(polyValue);
      } else {
        polyBound = L.polygon(polyValue, { color: data.polygonStyle ? data.polygonStyle : '#ffa500cc' });
      }
      if (data.id === this.selectedRow.id) {
        if (this.mapControl.coordinates) {
          area = JSON.parse(this.mapControl.coordinates);
          let poly = area.geometry.coordinates
          let polyValue = [];
          if (area.geometry.type == "Point") {
            polyValue = [poly[1], poly[0]];
          } else {
            for (let i in poly) {
              if (area.hasOwnProperty('unit') && area.unit == 'latlng') {
                polyValue.push([poly[i][1], poly[i][0]])
              } else {
                polyValue.push([poly[i][1] * -100, poly[i][0] * 100])
              }
            }
          }
          if (area.geometry.type == "Point") {
            polyBound = L.marker(polyValue);
          } else {
            polyBound = L.polygon(polyValue, { color: data.polygonStyle ? data.polygonStyle : '#ffa500cc', dashArray: "10 10", weight: 5 });
          }
        } else {
          if (area.geometry.type == "Point") {
            polyBound = L.marker(polyValue);
          } else {
            polyBound = L.polygon(polyValue, { color: data.polygonStyle ? data.polygonStyle : '#ffa500cc', dashArray: "10 10", weight: 5 });
          }
        }
      }
      if (polyBound != null) {
        if (polyBound instanceof L.Polygon && !this.hasValidLatLngs(polyBound)) {
          return;
        }
        polyBound.addTo(this.floorMap)
      }
      let labelName = data.name;
      let labelstyle;
      if (data) {
        try {
          labelstyle = JSON.parse(data.labelStyle);
        } catch {
          labelstyle = data.labelStyle;
        }
      }
      let labelStyle = data.labelStyle ? labelstyle : "color: #A9A9A9 !important;font-size: 12px;"
      if (!(polyBound instanceof L.Polygon) || this.hasValidLatLngs(polyBound)) {
        polyBound?.bindTooltip("<div style=" + labelStyle + ">" + labelName + "</div>", { permanent: true, direction: "center", className: "polytooltip" }).openTooltip()
      }
      this.mapControl.tooltip_polygon[data.id] = polyBound;
      if (data.id == this.selectedRow.id) {
        if (this.level == 0 || this.level == 1 || (this.parentDetail?.locationTypeId == 23 || this.locationForm.controls.locationTypeId.value == 23 || this.locationForm.controls.locationTypeId.value == 27)||(this.locationForm.controls.locationTypeId.value == 2 && this.isMapView)) {
          if (area.geometry.type == "Point") {
            let bounds = [[poly[1], poly[0]], [poly[1], poly[0]]]
            this.floorMap.fitBounds(bounds);
          } else {
            this.floorMap.fitBounds(polyBound?.getBounds());
          }
          // during outdoor Navigation image binding logic based on locationTypeId and for locaitontypeid 2 with flag isMapview
          if(this.locationForm.controls.locationTypeId.value == 27 ||(this.locationForm.controls.locationTypeId.value == 2 && this.isMapView && !this.isAddlocation && area?.unit === 'latlng')){
              const latLngs = polyBound?.getLatLngs();
              if (!latLngs?.length) return;
              const corners = latLngs[0];
              if (polyBound?._imageOverlay) {
                this.floorMap.removeLayer(polyBound._imageOverlay);
              }
              if (!this.hasValidLatLngs(polyBound)) {
                return;
              }
              this.onImageDisplay(polyBound);
              polyBound?.setStyle({fillOpacity: 0,opacity: 1});
              polyBound = this.enablePolygonEditMode(polyBound);
              if (polyBound) {
                this.mapControl.tooltip_polygon[data.id] = polyBound;
              }
          }
        }
      }
    }
  }
  zoomLabel() {
    let zoomVal = (this.floorMap.getZoom()) * 10;
    if (this.parentDetail?.locationTypeId != 23 && this.locationForm.controls?.locationTypeId.value != 23) {
      if (this.level > 1 || (this.level == 1 && this.showChild)) {
        zoomVal = (this.floorMap.getZoom() + 10) * 20
      }
    }

    if (this.mapControl.zoomCtrl) {
      this.floorMap.removeControl(this.mapControl.zoomCtrl)
      this.mapControl.zoomCtrl = null;
    }

    let showZoom = L.DomUtil.create("button");
    this.mapControl.zoomCtrl = new L.Control();
    this.mapControl.zoomCtrl.options = { position: "topleft" };
    this.mapControl.zoomCtrl.onAdd = () => {
      showZoom.innerText = +zoomVal + ' %';
      return showZoom;
    };
    this.floorMap.addControl(this.mapControl.zoomCtrl);
  }
  polyLineDist(pos) {
    if (this.mapControl.distance.enable) {
      let iconImage = new L.Icon({ iconUrl: '/assets/Alert/common_icons/blue-dot.png', iconSize: [10, 10], iconAnchor: [6, 6] });
      this.mapControl.distance.polylinePoints.push(pos.latlng);
      this.mapControl.distance.distPolyline[this.mapControl.distance.polylinePoints.length] = L.marker(pos.latlng, { icon: iconImage });
      this.mapControl.distance.distPolyline[this.mapControl.distance.polylinePoints.length].addTo(this.floorMap)
      if (this.mapControl.distance.polylinePoints.length == 2) {
        this.mapControl.distance.distPolyline['polyLine'] = L.polyline([this.mapControl.distance.polylinePoints[0], this.mapControl.distance.polylinePoints[1]], { color: 'gray' }).addTo(this.floorMap);

        let point = JSON.parse('[[' + (this.mapControl.distance.polylinePoints[0].lng / 100).toFixed(3) + ',' + (this.mapControl.distance.polylinePoints[0].lat / -100).toFixed(3) + '],[' + (this.mapControl.distance.polylinePoints[1].lng / 100).toFixed(3) + ',' + (this.mapControl.distance.polylinePoints[1].lat / -100).toFixed(3) + ']]')
        if (this.level > 1 || (this.level == 1 && this.showChild)) {
        } else {
          this.getDistance()
        }

        const distance = Math.sqrt(Math.pow((point[0][1] - point[1][1]), 2) + Math.pow((point[0][0] - point[1][0]), 2));
        let content = "<div class='" + 'ovi-font-family' + "'> Distance : " + distance.toFixed(2) + " m</div>"
        this.mapControl.distance.distPolyline['polyLine'].bindTooltip(content, { permanent: true, direction: "center" }).openTooltip();
      } else if (this.mapControl.distance.polylinePoints.length > 2) {
        for (let i in this.mapControl.distance.distPolyline) {
          this.floorMap.removeLayer(this.mapControl.distance.distPolyline[i])
          delete this.mapControl.distance.distPolyline[i]
        }
        this.mapControl.distance.polylinePoints = []
      }
    }
  }
  getDistance() {
    let lat1 = this.mapControl.distance.polylinePoints[0]['lat']
    let lon1 = this.mapControl.distance.polylinePoints[1]['lat']
    let lat2 = this.mapControl.distance.polylinePoints[0]['lng']
    let lon2 = this.mapControl.distance.polylinePoints[1]['lng']
    let unit = 'K'
    let radlat1 = Math.PI * lat1 / 180
    let radlat2 = Math.PI * lat2 / 180
    let theta = lon1 - lon2
    let radtheta = Math.PI * theta / 180
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180 / Math.PI
    dist = dist * 60 * 1.1515
    if (unit == "K") { dist = dist * 1.609344 }
    if (unit == "N") { dist = dist * 0.8684 }
    return dist
  }
  getDistanceControl() {
    if (this.mapControl.distance.scale) {
      this.floorMap.removeControl(this.mapControl.distance.scale)
      this.mapControl.distance.scale = null;
    }
    if (this.level >= 2) {
      let distanceControl = L.DomUtil.create("button");
      this.mapControl.distance.scale = new L.Control();
      this.mapControl.distance.scale.options = { position: "topright" };
      this.mapControl.distance.scale.onAdd = () => {
        distanceControl.innerText = 'distance';
        return distanceControl;
      };
      distanceControl.onclick = () => {
        this.mapControl.distance.enable = !this.mapControl.distance.enable
        if (!this.mapControl.distance.enable) {
          for (let i in this.mapControl.distance.distPolyline) {
            this.floorMap.removeLayer(this.mapControl.distance.distPolyline[i])
            delete this.mapControl.distance.distPolyline[i]
          }
          this.mapControl.distance.polylinePoints = []
        }
      };
      this.floorMap.addControl(this.mapControl.distance.scale);
    }
  }

  displayLocation(mapData, e) {
    this.zoomLabel()
    let disLocation = []
    if (mapData) {
      for (let i in mapData.children) {
        mapData.children[i].disLocLevel = mapData.children[i].disLocLevel == null ? 100 : mapData.children[i].disLocLevel;
        if (mapData.children[i].disLocLevel != null) {
          let locLevel = this.level > 1 || (this.level == 1 && this.showChild) ?
            mapData.children[i].disLocLevel / 20 - 10 : mapData.children[i].disLocLevel / 10 <= 18 ? mapData.children[i].disLocLevel / 10 : 18
          if (this.floorMap.getZoom() >= locLevel) {
            disLocation.push(mapData.children[i].id)
          }
          let childLocation = mapData.children[i]
          for (let j in childLocation.children) {
            let locLvl = this.level > 1 || (this.level == 1 && this.showChild) ?
              childLocation.children[j].disLocLevel / 20 - 10 : childLocation.children[j].disLocLevel / 10 <= 18 ? childLocation.children[j].disLocLevel / 10 : 18
            if (this.floorMap.getZoom() >= locLvl) {
              disLocation.push(childLocation.children[j].id)
            }
            let child2location = childLocation.children[j]
            for (let k in child2location.children) {
              let locLvl = this.level > 1 || (this.level == 1 && this.showChild) ?
                child2location.children[k].disLocLevel / 20 - 10 : child2location.children[k].disLocLevel / 10 <= 18 ? child2location.children[k].disLocLevel / 10 : 18
              if (this.floorMap.getZoom() >= locLvl) {
                disLocation.push(child2location.children[k].id)
              }
            }
          }
        }
      }
      mapData.disLocLevel = mapData.disLocLevel == null ? 100 : mapData.disLocLevel;
      if (mapData.disLocLevel != null) {
        let locLevel = this.level > 1 || (this.level == 1 && this.showChild) ?
          mapData.disLocLevel / 20 - 10 : mapData.disLocLevel / 10 <= 18 ? mapData.disLocLevel / 10 : 18;
        if (this.floorMap.getZoom() >= locLevel) {
          disLocation.push(mapData.id)
        }
      }
      for (let i in this.mapControl.tooltip_polygon) {
        this.floorMap.removeLayer(this.mapControl.tooltip_polygon[i])
      }
      for (let i in disLocation) {
        if (this.mapControl.tooltip_polygon[disLocation[i]] != undefined) {
          this.floorMap.addLayer(this.mapControl.tooltip_polygon[disLocation[i]])
        }
      }
    }
  }
  mapDraw() {
    let drawnItems = new L.FeatureGroup();
    this.floorMap.addLayer(drawnItems);
    let options = {
      position: 'topright',
      shapeOptions: { showArea: true, clickable: true },
      draw: {
        circle: false,
        polyline: false,
        marker: true,
        circlemarker: false,
        rectangle: { showArea: false },
      },
      metric: true,
      edit: { edit: false, remove: false, featureGroup: drawnItems }
    }
    let drawControl = new L.Control.Draw(options);
    this.floorMap.addControl(drawControl);

    this.floorMap.on('draw:created', this.getCoordinate.bind(this, drawnItems));
  }
  public getCoordinate(drawnItems, e) {
    let layer = e.layer
    let unit = 'metre'
    if (this.level == 0 || this.level == 1 || (this.level == 2 && this.locationForm.controls.locationTypeId.value == 23) || this.parentDetail?.locationTypeId == 23 ||this.locationForm.controls.locationTypeId.value == 26 || this.locationForm.controls.locationTypeId.value == 27) {
      unit = 'latlng'
    }
    layer['unit'] = unit;
    let value = e.layer.toGeoJSON();
    value['unit'] = unit;
    let poly = value.geometry.coordinates
    let coordinates = [];
    if (value.geometry.type == "Point") {
      coordinates = value.geometry.coordinates;
      if(this.locationForm.controls.locationTypeId.value === 27 || (this.locationForm.controls.locationTypeId.value === 2 && this.isMapView)){
        this.isPointBasedPolygon = true;
        this.drawAspectBasedPolygon(drawnItems, layer, coordinates, this.locationForm.controls.aspects.value);
        return
      }
    } else {
      for (let i in poly) {
        let value1 = poly[i]
        for (let j in value1) {
          if (unit == 'latlng') {
            coordinates.push([value1[j][0], value1[j][1]])
          } else {
             coordinates.push([value1[j][0] / 100, value1[j][1] / -100])
          }
        }
      }
    }
    value.geometry.coordinates = coordinates
    this.mapControl.coordinates = JSON.stringify(value);
    drawnItems.addLayer(layer);
  }

  drawAspectBasedPolygon(drawnItems, layer, point, aspects) {
    if (!point || !aspects) return;
    // remove marker
    drawnItems.removeLayer(layer);
    this.floorMap.eachLayer((l: any) => {
      if (l instanceof L.Polygon) {
        l.transform?.disable();
        l.editing?.disable?.();
        l.dragging?.disable?.();

        if (l._uiControl) {
          this.floorMap.removeControl(l._uiControl);
          l._uiControl = null;
        }

        if (l._imageOverlay) {
          this.floorMap.removeLayer(l._imageOverlay);
        }
        this.floorMap.removeLayer(l);
      }
    });
    let lng = point[0];
    let lat = point[1];
    if (typeof aspects === 'string') {
      aspects = JSON.parse(aspects);
    }
    const length = Number(aspects[1]);
    const breadth = Number(aspects[0]);
    if (!isFinite(length) || !isFinite(breadth)) return;
    const metersPerDegLat = 111320; // 1° lat = 111.32km
    const metersPerDegLng = 111320 * Math.cos(lat * Math.PI / 180); //1° lon ≈ 111.32 × cos(latitude)
    const latOffset = length / metersPerDegLat;
    const lngOffset = breadth / metersPerDegLng;
    const corners = [
      [lat, lng],
      [lat, lng + lngOffset],
      [lat - latOffset, lng + lngOffset],
      [lat - latOffset, lng]
    ];
    let polygon = L.polygon(corners, {
      weight: 1,
      fillColor: '#ff00000a',
      renderer: L.svg() 
    }).addTo(this.floorMap);
    if (!this.hasValidLatLngs(polygon)) {
      return;
    }
    this.onImageDisplay(polygon)
    // store backup ONCE
    polygon._backupLatLngs = JSON.parse(JSON.stringify(polygon.getLatLngs()));
    polygon = this.enablePolygonEditMode(polygon) || polygon;
  }

  private hasValidLatLngs(polygon: any): boolean {
    if (!polygon) return false;
    try {
      const latlngs = polygon.getLatLngs();
      if (!latlngs?.length || !latlngs[0]?.length) return false;
      return latlngs[0].every((ll: any) => ll && isFinite(ll.lat) && isFinite(ll.lng));
    } catch {
      return false;
    }
  }

  enablePolygonEditMode(polygon) {
    if (!polygon || !this.hasValidLatLngs(polygon)) return polygon;
    if (polygon._uiControl) {
      this.floorMap.removeControl(polygon._uiControl);
      polygon._uiControl = null;
    }
    polygon.options.interactive = true;
    if (!polygon.transform) {
      const latlngs = polygon.getLatLngs();
      this.floorMap.removeLayer(polygon);
      polygon = L.polygon(latlngs, {
        draggable: true,
        transform: {
          boundsOptions: { interactive: false, color: 'transparent', weight: 0, fillOpacity: 0 }
        }
      }).addTo(this.floorMap);
      polygon.setStyle({ fillColor: '#ff00000a', weight: 1 });
      polygon._backupLatLngs = JSON.parse(JSON.stringify(latlngs));
    }
    polygon._isEditing = true;
    polygon.transform?.disable();
    setTimeout(() => {
      polygon.transform?.enable();
    }, 50);
    polygon.dragging?.enable();

    const control = L.control({ position: 'topright' });
    control.onAdd = () => {
      const div = L.DomUtil.create('div');
      const render = () => {
        div.innerHTML = '';

        if (polygon._isEditing) {
          const wrapper = L.DomUtil.create('div', '', div);
          wrapper.style.display = 'flex';
          wrapper.style.gap = '5px';

          const saveBtn = L.DomUtil.create('button', '', wrapper);
          saveBtn.innerText = 'Save';
          saveBtn.style.background = '#1976d2';
          saveBtn.style.color = '#fff';

          const cancelBtn = L.DomUtil.create('button', '', wrapper);
          cancelBtn.innerText = 'Cancel';
          cancelBtn.style.background = '#1976d2';
          cancelBtn.style.color = '#fff';

          L.DomEvent.on(saveBtn, 'click', () => {
            this.handlePolygonAction(polygon, 'save');
            render();
          });

          L.DomEvent.on(cancelBtn, 'click', () => {
            this.handlePolygonAction(polygon, 'cancel');
            render();
          });
        } else {
          const editBtn = L.DomUtil.create('button', '', div);
          editBtn.innerText = 'Edit';
          editBtn.style.background = '#1976d2';
          editBtn.style.color = '#fff';

          L.DomEvent.on(editBtn, 'click', () => {
            this.handlePolygonAction(polygon, 'edit');
            render();
          });
        }
      }
      render();
      return div;
    };
    control.addTo(this.floorMap);
    polygon._uiControl = control;
    return polygon;
  }

  handlePolygonAction(polygon, action) {
    if (!polygon) return;
    this.isPointBasedPolygon = false;
    if (action === 'edit') {
      if (!this.hasValidLatLngs(polygon)) return;
      polygon?.transform?.enable();
      polygon?.dragging?.enable();
      polygon._isEditing = true;
      if (polygon?.transform) {
        polygon.transform.disable();
      }
      setTimeout(() => {
        polygon?.transform?.enable();
        polygon?.dragging?.enable();
      }, 0);
      return;
    }
    // save / cancel → disable editing and dragging
    polygon?.editing?.disable();
    polygon?.dragging?.disable();
    polygon?.transform?.disable();
    let activePolygon = polygon;
    if(action === 'cancel' && polygon._backupLatLngs) {
      if(polygon?._imageOverlay) {
        this.floorMap.removeLayer(polygon._imageOverlay);
      }
      if(polygon?._uiControl) {
        this.floorMap.removeControl(polygon._uiControl);
      }
      this.floorMap.removeLayer(polygon);
      activePolygon = L.polygon(polygon._backupLatLngs, {
        draggable: true,
        transform: {
          boundsOptions: { interactive: false, color: 'transparent', weight: 0, fillOpacity: 0 }
        }
      }).addTo(this.floorMap);
      this.onImageDisplay(polygon)
      activePolygon.setStyle({ fillColor: '#ff00000a', weight: 1 });
      activePolygon._backupLatLngs = JSON.parse(JSON.stringify(polygon._backupLatLngs));
    }
    if (action === 'save') {
      const latLngs = polygon.getLatLngs();
      polygon._backupLatLngs = JSON.parse(JSON.stringify(latLngs));
    }
    this.applyRotatedImage(activePolygon);
    activePolygon._isEditing = false;
    this.enablePolygonEditMode(activePolygon);
  }

  applyRotatedImage(polygon){
    const latLngs = polygon.getLatLngs();
    if (!latLngs?.length || !this.hasValidLatLngs(polygon)) return;
    const corners = latLngs[0];
    this.floorMap.eachLayer((layer: any) => {
      if (layer instanceof L.ImageOverlay) {
        this.floorMap.removeLayer(layer);
      }
    });
    if (polygon._imageOverlay) {
      this.floorMap.removeLayer(polygon._imageOverlay);
      polygon._imageOverlay = null;
    }
    this.onImageDisplay(polygon)
    polygon.setStyle({fillOpacity: this.displayPolygonImage ? 0 : 0.3,opacity: 1});
    const coordinates = corners.map((p: any) => [p.lng, p.lat]);
    this.mapControl.coordinates = JSON.stringify({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: coordinates
      },
      unit: 'latlng'
    })
  }

  uploadImage($event): void {
    const file: File = $event.target.files[0];
    const uploadImage: FileReader = new FileReader();
    uploadImage.readAsDataURL(file);
    uploadImage.onloadend = (e) => {
      if (file.size < 2 * 1000000) { //less than 1MB
        this.mapControl.imageData = uploadImage.result;
      } else {
        this.mapControl.imageData = !this.isAddlocation ? environment.api_base_url_new + 'api/location/get-location-image/' + this.selectedRow.id + '?date=' + (new Date()) : null;
        this.toastr.warning('Warning', `Upload image file should be less that 2MB`);
      }
    };
  }

  tabClick(event) {
    this.selectedTabIndex = event.index;
    if (this.showMap == false && event.tab.textLabel == 'Map') {
      this.showMap = true;
      this.isMapView = this.selectedRow ? this.isMapView : true;
      this.getMap()
    } else {
      this.showMap = false;
    }
  }

  zoomControl(type, value) {
    value = (value / 10) - 10;
    if (type == 'min') {
      this.floorMap.setMinZoom(value);
    } else if (type == 'max') {
      this.floorMap.setMaxZoom(value)
    } else {
      this.floorMap.setZoom(value);
    }

  }

  buildForm(data) {
    let labelstyle;
    if (!this.isAddlocation && data && data?.labelStyle != '') {
      try {
        labelstyle = JSON.parse(data.labelStyle);
      } catch {
        labelstyle = data.labelStyle;
      }
    }
    this.locationForm = this.form.group({
      logicalParentName: [!this.isAddlocation && data ? data.logicalParentName : this.isAddlocation ? data.name : null],
      locationTypeId: [!this.isAddlocation && data ? data.locationTypeId : this.locationTypes.length ? this.locationTypes[0].id : null, [Validators.required]],
      name: [!this.isAddlocation && data ? data.name : null, [Validators.required, Validators.maxLength(64)]],
      careSettingId: [!this.isAddlocation && data ? data.careSettingId : null],
      locationCategoryId: [!this.isAddlocation && data ? data.locationCategoryId : null],
      shortName: [!this.isAddlocation && data ? data.shortName : null, [Validators.maxLength(11)]],
      labelStyle: [labelstyle?.web ? labelstyle.web : labelstyle],
      floorNo: [!this.isAddlocation && data ? data.floorNo : null, [Validators.maxLength(3)]],
      locationIdentifier: [!this.isAddlocation && data ? data.locationIdentifier : null, [Validators.maxLength(32)]],
      locationDescription: [!this.isAddlocation && data ? data.locationDescription : null, [Validators.maxLength(64)]],
      status: [!this.isAddlocation && data ? data.status : 'Active', [Validators.required]],
      imageUrl: [!this.isAddlocation && data ? data.imageUrl : null],
      aspects: [!this.isAddlocation && data ? data.aspects : null, [Validators.pattern(/^\[\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*\]$/)]],
      minZoom: [!this.isAddlocation && data ? data.minZoom : null],
      maxZoom: [!this.isAddlocation && data ? data.maxZoom : null],
      defaultZoom: [!this.isAddlocation && data ? data.defaultZoom : null],
      polygonColor: [!this.isAddlocation && data ? data.polygonStyle : null],
      disLocLevel: [!this.isAddlocation && data ? data.disLocLevel : null],
      orient: [!this.isAddlocation && data ? data.mapOrient : null],
      logicalParentId: [!this.isAddlocation && data ? data.logicalParentId : null],
      parentId: [!this.isAddlocation && data ? data.parentId : null],
      coordinates: [!this.isAddlocation && data ? data.coordinates : null],
      labelPoint: [!this.isAddlocation && data ? data.labelPoint : null],
      isQuickLocation: [!this.isAddlocation && data ? data.isQuickLocation : false],
      isSearchPriority: [!this.isAddlocation && data ? data.isSearchPriority : true],
      labelStyleMobile: [labelstyle?.mob ? JSON.stringify(labelstyle.mob) : null, [this.customValidateMobile()]],
      labelNamePoint: [labelstyle?.point ? labelstyle.point : null],
      labelRotate: [labelstyle?.rotate ? labelstyle.rotate : null],
      workFlowId: [!this.isAddlocation && data ? data.workFlowId : null]
    },
      { validator: this.customValidate }
    );
    if (this.level == 2) {
      this.locationForm.controls.aspects.setValidators(Validators.required);
      this.locationForm.controls.floorNo.setValidators(Validators.required);
    } else if (this.level == 3) {
      this.locationForm.controls.locationCategoryId.setValidators(Validators.required);
      this.locationForm.controls.careSettingId.setValidators(Validators.required);
    }
    this.locationForm.updateValueAndValidity();
    if (this.isAddlocation && this.level === 3) {
      // set room name for level 3 location type
      this.locationForm.controls.locationTypeId.setValue(17);
      this.getLocationTypeConfig(17)
    }
    this.showInput = true;
    if (!this.isAddlocation && data) {
      this.getMapControl(data)
    } else {
      this.mapControl.imageData = null;
      this.mapControl.coordinates = null;
    }
    if (data?.locationTypeId === 17 && data?.children?.length > 0) {
      this.locationForm.controls.locationTypeId.disable();
    } else {
      this.locationForm.controls.locationTypeId.enable();
    }
  }
  onAspectsChange() {
    const control = this.locationForm.get('aspects');
    if (!control) return;
    control.setValidators([Validators.pattern(/^\[\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*\]$/)]);
    control.updateValueAndValidity({ onlySelf: true });
    control.markAsDirty();
    control.markAsTouched();
  }
  customValidate(g: FormGroup) {
    let error = null;
    if (g.get('polygonColor').value != null && g.get('polygonColor').value != '') {
      let styleOption = new Option().style
      styleOption.color = g.get('polygonColor').value;
      if (styleOption.color == '') {
        error = g.controls['polygonColor'].setErrors({ mismatch: true })
      }
    }
    return error
  }
  customValidateMobile(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      try {
        JSON.parse(value);
        return null;
      } catch {
        return { invalidJson: true };
      }
    };
  }
  getMapControl(data) {
    try {
      this.mapControl.imageData = !this.isAddlocation ? environment.api_base_url_new + 'api/location/get-location-image/' + data.id + '?date=' + (new Date()) : null;
    } catch (e) {
      this.mapControl.imageData = null;
    }
    this.mapControl.minZoom = data.minZoom != null ? data.minZoom : this.mapControl.minZoom;
    this.mapControl.maxZoom = data.maxZoom != null ? data.maxZoom : this.mapControl.maxZoom;
    this.mapControl.defaultZoom = data.defaultZoom != null ? data.defaultZoom : this.mapControl.defaultZoom;
    this.mapControl.orient = data.mapOrient != null ? data.mapOrient : this.mapControl.orient;
    this.mapControl.disLocLevel = data.disLocLevel != null ? data.disLocLevel : this.mapControl.disLocLevel;
    this.mapControl.coordinates = data.coordinates;
    this.mapControl.direction = null;
    this.mapControl.tooltip_polygon = {}
    this.mapControl.zoomCtrl = null;
    this.mapControl.distance = {
      enable: false,
      scale: null,
      polylinePoints: [],
      distPolyline: {}
    }
  }

  saveLocation(addNew) {
    this.enableSave = false;
    const labelStyleWeb = this.locationForm.controls.labelStyle.value;
    let labelStyleMobile = JSON.parse(this.locationForm.controls.labelStyleMobile.value);
    const labelStyle = JSON.stringify({ web: labelStyleWeb, mob: labelStyleMobile, point: this.locationForm.controls.labelNamePoint.value, rotate: this.locationForm.controls.labelRotate.value });
    let postData = {
      "aspects": this.locationForm.controls['aspects'].value,
      "careSettingId": this.locationForm.controls['careSettingId'].value,
      "coordinates": this.mapControl.coordinates,
      "defaultZoom": this.mapControl.defaultZoom,
      "mapOrient": this.mapControl.orient,
      "disLocLevel": this.mapControl.disLocLevel,
      "floorNo": this.locationForm.controls['floorNo'].value,
      "imageData": this.mapControl.imageData,
      "labelPoint": this.locationForm.controls['labelPoint'].value,
      "labelStyle": labelStyle,
      "locationCategoryId": this.locationForm.controls['locationCategoryId'].value,
      "locationDescription": this.locationForm.controls['locationDescription'].value,
      "locationIdentifier": this.locationForm.controls['locationIdentifier'].value,
      "locationTypeId": this.locationForm.controls['locationTypeId'].value,
      "logicalParentId": this.locationForm.controls['logicalParentId'].value,
      "maxZoom": 200,
      "minZoom": this.mapControl.minZoom,
      "name": this.locationForm.controls['name'].value,
      "parentId": this.locationForm.controls['parentId'].value,
      "polygonStyle": this.locationForm.controls['polygonColor'].value,
      "shortName": this.locationForm.controls['shortName'].value,
      "isQuickLocation": this.locationForm.controls['isQuickLocation'].value,
      "isSearchPriority": this.locationForm.controls['isSearchPriority'].value,
      "status": this.locationForm.controls['status'].value,
      "workFlowId": this.locationForm.controls['workFlowId'].value,
    };
    let locTypeId = this.locationForm.controls.locationTypeId.value;
    if (locTypeId == 23 || this.parentDetail && this.parentDetail?.locationTypeId == 23) {
      postData['maxZoom'] = 220
    }


    postData['locationTypeLevel'] = this.level;
    if (this.locationList.length == 0 || this.isAddlocation) {

      postData['parentId'] = this.selectedRow ? this.selectedRow.id : null;
      postData['logicalParentId'] = this.selectedRow ? this.selectedRow.id : null;
      if (this.selectedRow) {
        let typeDetail = this.locallTypes.filter(val => val.id == this.selectedRow.locationTypeId)[0]
        if (typeDetail.isLogicalParent) {
          postData['parentId'] = this.selectedRow ? this.selectedRow.parentId : null;
        }
      }
      if (this.locationForm.controls.locationTypeId.value != 23) {
        if ((this.level == 1 || this.level == 2) && postData.imageData == null) {
          this.toastr.warning('Warning', `Please upload the image file to load floor plan`);
          this.getLocationDetail(this.selectedRow);
          this.enableSave = true;
          return;
        }
      }
      if (postData.coordinates == null) {
        this.toastr.warning('Warning', `Please draw location in map`);
        this.getLocationDetail(this.selectedRow);
        this.enableSave = true;
        return;
      }
      this.hospitalService.saveLocation(postData).subscribe(res => {
        this.enableSave = true;
        this.toastr.success('Success', `${res.message}`);
        if (res.results?.locationTypeId === 2 && this.configRoom) { // config based auto createroom
          this.createRoom(res.results);
        }
        if (addNew == false) {
          this.selectedRow = res.results;
          this.isAddlocation = null;
        } else {
          this.addMore = true
        }
        this.getAllLocation()
      });
    } else {
      postData['id'] = this.selectedRow.id;

      let preImageUrl = environment.api_base_url_new + 'api/location/get-location-image/' + (this.selectedRow ? this.selectedRow.id : '');
      if (preImageUrl != this.mapControl.imageData) {
        postData.imageData = this.mapControl.imageData;
      }
      if (postData.imageData) {
        let imageCheck = postData.imageData.split(':');
        if (imageCheck.length > 0 && imageCheck[0] != 'data') {
          delete postData['imageData'];
        }
      }
      if (postData['id'] === postData['parentId']) {
        this.toastr.warning('Warning', `Location and parent location Id should not be same`);
        this.getLocationDetail(this.selectedRow);
        this.enableSave = true;
        return;
      }
      this.hospitalService.editLocation(postData).subscribe(res => {
        this.enableSave = true;
        this.toastr.success('Success', `${res.message}`);
        res.results['children'] = this.selectedRow.children
        this.selectedRow = res.results;
        this.isAddlocation = null;
        this.getAllLocation()
      }, error => {
        this.enableSave = true;
        this.toastr.error('Error', `${error.error.message}`);
      });
    }
  }
  locStyling() {
    this.openAutocom = true;
    this.matACTrigger.openPanel()
  }
  changeStyle(event) {
    this.openAutocom = false;
    this.matACTrigger.closePanel()
    this.locationForm.controls['labelStyle'].setValue(event)
  }
  closeStyle(event) {
    this.openAutocom = false;
    this.matACTrigger.closePanel()
  }
  mapConfigAll() {
    const labelStyleWeb = this.locationForm.controls.labelStyle.value;
    let labelStyleMobile = JSON.parse(this.locationForm.controls.labelStyleMobile.value);
    const labelStyle = JSON.stringify({ web: labelStyleWeb, mob: labelStyleMobile, point: this.locationForm.controls.labelNamePoint.value, rotate: this.locationForm.controls.labelRotate.value });
    if (this.level >= 3) {
      let postData = {
        "id": this.selectedRow.id,
        "parentId": this.selectedRow.parentId,
        "defaultZoom": this.mapControl.defaultZoom,
        "orientation": this.mapControl.orient,
        "disLocLevel": this.mapControl.disLocLevel,
        "maxZoom": this.mapControl.maxZoom,
        "minZoom": this.mapControl.minZoom,
        "labelStyle": labelStyle,
        "polygonStyle": this.locationForm.controls['polygonColor'].value,
        "locType": this.locationForm.controls['locationTypeId'].value,
        "category": this.locationForm.controls['locationCategoryId'].value,
        "enableFloorChange": this.enableFloorChange
      };
      this.dialog.open(ManageLocationViewComponent, {
        panelClass: ['small-popup'],
        data: postData
      });
    } else {
      let postData = {
        "id": this.selectedRow.id,
        "parentId": this.selectedRow.parentId,
        "defaultZoom": this.mapControl.defaultZoom,
        "orientation": this.mapControl.orient,
        "disLocLevel": this.mapControl.disLocLevel,
        "maxZoom": this.mapControl.maxZoom,
        "minZoom": this.mapControl.minZoom,
        "labelStyle": labelStyle,
        "polygonStyle": this.locationForm.controls['polygonColor'].value,
        "enableFloorChange": this.enableFloorChange,
      };
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        panelClass: ['confirmation-popup'],
        data: {
          title: 'Confirmation',
          message: 'Are you sure you want to apply locations?',
          buttonText: {
            ok: 'Yes',
            cancel: 'No'
          }
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'Yes') {
          this.hospitalService.locationApplyAll(postData).subscribe(res => {
            this.toastr.success('Success', `${res.message}`);
            this.getAllLocation();
          });
        }
      });
    }

  }
  deleteLocation() {
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
        this.isLoading = true;
        this.hospitalService.deleteLocation(this.selectedRow.id).subscribe(res => {
          this.toastr.success('Success', `${res.message}`);
          this.selectedRow = this.parentDetail ? this.parentDetail : null;
          this.isLoading = false;
          this.isDeleted = true;
          this.getAllLocation();
        }, err => {
          this.isLoading = false;
          this.toastr.warning('Warning', `${err.error.message}`);
        });
      }
    });
  }
  getTreeview(locData) {
    const expandNodeRecursive = (node, targetId) => {
      if (node.id === targetId) {
        this.selectedRow = node;
        if (node?.children[0]?.labelPoint !== 'false') { // for not to expand config based auto createroom
          this.treeControl.expand(node);
          return true; // Target found, no need to search further
        }
      }

      if (node.children && node.children.length > 0) {
        for (let child of node.children) {
          if (child?.children[0]?.labelPoint !== 'false') { // for not to expand config based auto createroom
            if (expandNodeRecursive(child, targetId)) {
              this.treeControl.expand(node); // Expand parent if target is found in the child
              return true; // Stop further traversal if the target is found
            }
          }
        }
      }

      return false; // Continue searching
    };

    // Loop through the top-level nodes and start the recursive expansion
    for (let node of this.dataSource.data) {
      if (expandNodeRecursive(node, locData.id)) {
        break; // Exit the loop if the target is found
      }
    }
  }

  getFlatTreeview(locData) {
    const expandNodeRecursive = (node, targetId) => {
      if (node.id === targetId) {
        this.treeFlatControl.expand(node);
        return true; // Target found, no need to search further
      }

      if (node.children && node.children.length > 0) {
        for (let child of node.children) {
          if (expandNodeRecursive(child, targetId)) {
            this.treeFlatControl.expand(node); // Expand parent if target is found in the child
            return true; // Stop further traversal if the target is found
          }
        }
      }

      return false; // Continue searching
    };

    // Loop through the top-level nodes and start the recursive expansion
    for (let node of this.flatDataSource.data) {
      if (expandNodeRecursive(node, locData.id)) {
        break; // Exit the loop if the target is found
      }
    }
  }

  ngDoCheck() {
    this.windWidth = window.innerWidth;
    if (this.openAutocom) {
      this.matACTrigger.openPanel()
    }
  }
  createRoom(data) {
    let roomAspects = null;
    if (data?.aspects !== null) {
      const aspectArray = JSON.parse(data?.aspects);
      if (aspectArray[0] >= aspectArray[1]) {
        roomAspects = ([Math.round(aspectArray[1] / 2), Math.round(aspectArray[1] / 2)]);
      } else {
        roomAspects = ([Math.round(aspectArray[0] / 2), Math.round(aspectArray[0] / 2)]);
      }
    }
    let postRoomData = {
      "aspects": JSON.stringify(roomAspects),
      "careSettingId": 'CS-GE',
      "coordinates": "pending",
      "defaultZoom": 100,
      "mapOrient": 0,
      "disLocLevel": 100,
      "floorNo": null,
      "imageData": null,
      "labelPoint": 'false',
      "labelStyle": null,
      "locationCategoryId": 'LC_Other',
      "locationDescription": null,
      "locationIdentifier": null,
      "locationTypeId": 17,
      "logicalParentId": data?.id,
      "maxZoom": null,
      "minZoom": null,
      "name": data?.name,
      "parentId": data?.id,
      "polygonStyle": 'blue',
      "shortName": null,
      "isQuickLocation": null,
      "isSearchPriority": null,
      "status": "Active",
    };
    this.hospitalService.saveLocation(postRoomData).subscribe(res => {
    });
  }
  getParentAndLogicalParent(parentDetail, parentId, locData) {
    this.hospitalService.getLogicalLocationById(parentDetail?.parentId).subscribe(res => {
      this.parentList = parentId ? res.results[0]?.children : this.parentList;
      const children = parentDetail?.children?.filter(x => x.locationTypeId === 3 || x.locationTypeId === 22 || x.locationTypeId === 21);
      if (parentId === locData.logicalParentId) {
        const parentList = this.parentList.filter(x => x.id === locData.logicalParentId);
        this.logicalParentList = this.isAddlocation ? children : parentList;
      } else {
        const parentList = this.parentList.filter(x => x.id === locData.id);
        this.logicalParentList = !this.isAddlocation ? children : parentList;
      }
      if (this.isAddlocation) {
        this.locationForm.get('parentId').setValue(parentId);
        this.locationForm.get('logicalParentId').setValue(locData.id);
      }
    });
  }

  manageLogicaParent(data) {
    if (this.logicalParentList?.length <= 1) {
      this.logicalParentList = this.parentList.filter(x => x.id === data.id);
      this.locationForm.get('logicalParentId').setValue(data.id);
    } else {
      this.logicalParentList = data.children?.filter(x => x.locationTypeId === 3 || x.locationTypeId === 22 || x.locationTypeId === 21);
      this.locationForm.get('logicalParentId').setValue(data.children[0]?.id);
    }
  }
  fixClick() {
    console.log('')
  }

  onImageDisplay(polyBound?) {

    if (!polyBound) return;
    const latLngs = polyBound.getLatLngs();
    if (!latLngs?.length) return;
    const corners = latLngs[0];

    // Remove existing overlay
    if (polyBound._imageOverlay) {
      this.floorMap.removeLayer(polyBound._imageOverlay);
      polyBound._imageOverlay = null;
      return;
    }
    if(this.displayPolygonImage && this.mapControl?.imageData){ // flag based overlay display or not
      // Add overlay directly
      if ((L as any).imageOverlay?.rotated) {
        polyBound._imageOverlay =
          (L as any).imageOverlay.rotated(
            this.mapControl.imageData,
            corners[0],
            corners[1],
            corners[3],
            { opacity: 0.7 }
          ).addTo(this.floorMap);

      } else {
        const bounds = L.latLngBounds(corners);
        polyBound._imageOverlay =
          L.imageOverlay(
            this.mapControl.imageData,
            bounds,
            { opacity: 0.7 }
          ).addTo(this.floorMap);
      }
    }
  }
}
