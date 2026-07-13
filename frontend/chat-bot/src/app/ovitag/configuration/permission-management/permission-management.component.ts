import { Component, Inject, OnInit } from '@angular/core';
import { CommonService, ConfigurationService } from '../../../shared';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { FormControl } from '@angular/forms';
import { AppToastService } from '../../../shared/services/toaster.service';

@Component({
  selector: 'app-permission-management',
  templateUrl: './permission-management.component.html',
  styleUrls: ['./permission-management.component.scss'],
})
export class PermissionManagementComponent implements OnInit {
  public showActions: any[] = [];
  public selectDropdown: any;
  public selectedName = null;
  public tableData: any
  public displayedColumns = ['Name', 'Code', 'Resources Type', 'Page', 'Permit All', 'Status'];
  public iconHeader = [];
  public iconColumn = ['Permit All', 'Status'];
  public sortColumn = [];
  public eventColumn = ['Code'];
  public permissionControl = ['BT_ALLE'];
  public applyFilterValue = null;
  public pageStart : number = 0;
  public pageSize: number = 50;
  public groupFilter = [];
  filterData = [
     {
      id: 'resourcesType',
      value: 'Resources Type',
      isAll: true,
      selectionType: 'multi',
      subFilters: [],
      defaultSelected: ['All']
    }
  ]
  length = 0
  loading: boolean = false;
  resourceList: any;
  userList: any;
  roleList: any;
  selectedTypes: any[] = [];

  constructor(public toastr: AppToastService, private readonly configurationService: ConfigurationService, 
    private readonly commonService: CommonService, public dialog: MatDialog){}

  ngOnInit(): void {
    this.getAllPermission();
    this.getappTerms();
  }

   getappTerms() {
    this.commonService.getAppTermsVerion2('ResourceType').subscribe(res=> {
      const resourceList = res.results;
      const resourcesType = this.filterData.find(f => f.id === 'resourcesType')
      if(resourcesType){
        resourcesType.subFilters = resourceList.map(({ code, value }) => ({ code, value }));
      }
      this.groupFilter = this.filterData;
    });
  }

  headerEventAction(event){
    console.log(event)
    if(event.key === 'applyFilter'){
      this.applyFilter(event.data)
    } else if(event.key === 'groupFilter'){
      const type = event.data.filter(f => f.id === 'resourcesType').map(code => code.data)
      this.selectedTypes = type.length ? type : []
      this.getAllPermission()
    } else {
      this.getAllPermission();
    }
  }

  applyFilter(value){
    let filterValue = value.trim().toLowerCase();
    this.applyFilterValue = filterValue;
    this.pageStart = 0;
    this.getAllPermission();
  }

  rowClick(event){
    console.log(event);
  }

  refresh(){
    this.getAllPermission();
  }

  eventAction(event){
    if(event.key === 'pagination'){
      this.pageSize = event.data.pageSize
      this.pageStart = event.data.pageIndex
      this.getAllPermission()
    } else if(event.key === 'Code') {
      this.resourcesPermitedBy(event.data)
    }
  }

  getAllPermission() {
    this.loading = true;
    if(this.selectedTypes?.length == 0){
      this.selectedTypes = null;
    }
    this.configurationService.getAllResource(this.pageStart, this.pageSize, this.applyFilterValue, this.selectedTypes).subscribe(res => {
      this.tableData = res.results;
      this.length = res.totalRecords;
      const Columns = ['name', 'code', 'resourceTypeName', 'page', 'permitAll', 'status'];
      this.tableData.forEach(row => {
        Columns.forEach((col, idx) => {
          row[this.displayedColumns[idx]] = row[col];
        });
      });
      this.loading = false
    }, error => {
      this.loading = false
      this.toastr.error('Error', `${error.error.message}`);
    });;
  }

  resourcesPermitedBy(data) {
    const dialogRef = this.dialog.open(PermittedPermissionComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(_result => {
      this.refresh();
    });
  }

}

@Component({
  selector: 'app-permitted-permission',
  templateUrl: './permitted-permission.component.html',
  styleUrls: ['./permission-management.component.scss'],
})
export class PermittedPermissionComponent implements OnInit {
  rolePermissions: any[] = [];
  userPermissions: any[] = [];
  departmentPermissions: any[] = [];
  groupedResources: any[] = [];
  public tableColumns = ['Id', 'Name', 'Status']
  public displayedColumns = this.tableColumns;
  public iconHeader = [];
  public iconColumn = ['Status'];
  public sortColumn = [];
  public eventColumn = ['Code'];
  public permissionControl = ['BT_ALLE'];
  public applyFilterValue = null;
  public pageStart : number = 0;
  public pageSize: number = 50;
  public groupFilter = [];
  public Columns = ['id', 'name', 'isActive'];
  selectedTabIndex = 0
  selectedType: string = 'group';
  permissionData: any[];
  


  constructor( @Inject(MAT_DIALOG_DATA) public metaData: any, private readonly configurationService: ConfigurationService,
  public dialog: MatDialog){}

  ngOnInit(): void {
    this.resourcesPermissions(this.metaData.id)
  }

  resourcesPermissions(id) {
    this.configurationService.getResourcesById(id).subscribe(res => {
      const permissionData = res.results;
      this.rolePermissions = permissionData.roles;
      this.userPermissions = permissionData.users;
      this.departmentPermissions = permissionData.departments;
      this.groupedResources = permissionData.resourceGroups;
      const datasets = [
        this.groupedResources,
        this.rolePermissions,
        this.userPermissions,
        this.departmentPermissions
      ];
      this.permissionData = datasets[this.selectedTabIndex]
      datasets[this.selectedTabIndex]?.forEach(row => {
        this.Columns.forEach((col, idx) => {
          row[this.displayedColumns[idx]] = row[col];
        })
      })
    })
  }

  tabChanged = (tabChangeEvent: MatTabChangeEvent): void => {
    this.selectedTabIndex = tabChangeEvent.index;
    if (this.selectedTabIndex === 0) {
      this.selectedType = 'group'
      this.permissionData = this.groupedResources;
      this.groupedResources?.forEach(row => {
        this.Columns.forEach((col, idx) => {
          row[this.displayedColumns[idx]] = row[col];
        })
      })
    } else if (this.selectedTabIndex === 1) {
      this.selectedType = 'role'
      this.permissionData = this.rolePermissions;
      this.rolePermissions?.forEach(row => {
        this.Columns.forEach((col, idx) => {
          row[this.displayedColumns[idx]] = row[col];
        })
      })
    } else if (this.selectedTabIndex === 2) {
      this.selectedType = 'user'
      this.permissionData = this.userPermissions;
      this.userPermissions?.forEach(row => {
        this.Columns.forEach((col, idx) => {
          row[this.displayedColumns[idx]] = row[col];
        })
      })
    } else {
      this.selectedType = 'department'
      this.permissionData = this.departmentPermissions;
      this.departmentPermissions?.forEach(row => {
        this.Columns.forEach((col, idx) => {
          row[this.displayedColumns[idx]] = row[col];
        })
      })
    }

    if (this.selectedTabIndex === 2) {
    this.displayedColumns = ['Id', 'Name', 'Username', 'Status'];
  } else {
    this.displayedColumns = [...this.tableColumns];
  }
  }

  managePermissions(rowData, type) {
    let data = {
      'type': type,
      'resourceId':this.metaData.id,
      'metaData': rowData || []
    }
    const dialogRef = this.dialog.open(ManagePermissionComponent, {
      data: data, height: '200px', panelClass: ['mdm-Confirmation-popup'],
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.resourcesPermissions(this.metaData.id)
    });
  }
  fixClick() {
    console.log('')
  }  
}

@Component({
  selector: 'app-manage-permission',
  templateUrl: './manage-permission.component.html',
  styleUrls: ['./permission-management.component.scss'],
})
export class ManagePermissionComponent implements OnInit {
  permissionIds = new FormControl([]);
  public selectionList: any[] = [];
  roleIds: any;
  userIds: any;
  departmentIds: any;
  groupIds: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly commonService: CommonService, public toastr: AppToastService,
  private readonly configurationService: ConfigurationService,  public thisDialogRef: MatDialogRef<ManagePermissionComponent>,){}

  ngOnInit(): void {
    if (this.data['type'] === 'role') {
      this.roleIds = this.data['metaData']?.map(x => x.id)
      this.permissionIds.setValue(this.roleIds)
      this.commonService.getAllRole().subscribe(res => {
        this.selectionList = res.results;
      });
    } else if (this.data['type'] === 'user') {
      this.userIds = this.data['metaData']?.map(x => x.id)
      this.permissionIds.setValue(this.userIds)
      this.configurationService.getLoginUsers().subscribe(res => {
        this.selectionList = res.results;
      });
    } else if (this.data['type'] === 'department') {
      this.departmentIds = this.data['metaData']?.map(x => x.id)
      this.permissionIds.setValue(this.departmentIds)
      this.commonService.getAllDepartments().subscribe(res =>{
        this.selectionList = res.results
      })
    } else {
      this.groupIds = this.data['metaData']
      let gIds = this.data['metaData']?.map(x => x.id)
      this.permissionIds.setValue(gIds)
      this.configurationService.getAllGroup().subscribe(res => {
      this.selectionList = res.results;
      });
    }
  }

  updatePermission(type) {
    if (type !== 'group') {
      this.handleNonGroupPermission(type);
    } else {
      this.handleGroupPermission();
    }
  }

  handleNonGroupPermission(type) {
    const typeConfig = {
      role: { existing: this.roleIds, payloadKey: 'roleId' },
      user: { existing: this.userIds, payloadKey: 'loginId' },
      department: { existing: this.departmentIds, payloadKey: 'departmentId' },
    } as const;

    const config = typeConfig[type];
    if (!config) return;

    const selectedIds = this.permissionIds.value || [];
    const newIds = selectedIds.filter(id => !config.existing.includes(id));
    const removedIds = config.existing.filter(id => !selectedIds.includes(id));

    const payload = {
      id: this.data['resourceId'],
      addPermission: {
        roleId: type === 'role' ? newIds : [],
        loginId: type === 'user' ? newIds : [],
        departmentId: type === 'department' ? newIds : []
      },
      removePermission: {
        roleId: type === 'role' ? removedIds : [],
        loginId: type === 'user' ? removedIds : [],
        departmentId: type === 'department' ? removedIds : []
      }
    };
    this.configurationService.updateResource(this.data['resourceId'], payload).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.thisDialogRef.close('confirm');
    });
  }

  handleGroupPermission() {
    const selectedIds = this.permissionIds.value || [];
    const resourceMap = []
    this.groupIds.forEach((g: any) => {
      if (selectedIds.includes(g.id)) {
        resourceMap.push({
          isActive: true,
          resourceGroupId: g.id,
          resourceId: this.data.resourceId,
          resourceGroupMapId: g.resourceGroupMapId
        });
      } else {
        resourceMap.push({
          isActive: false,
          resourceGroupId: g.id,
          resourceId: this.data.resourceId,
          resourceGroupMapId: g.resourceGroupMapId
        });
      }
    });

    selectedIds.forEach((id: number) => {
      const alreadyExists = this.groupIds.some((g: any) => g.id === id);
      if (!alreadyExists) {
        resourceMap.push({
          isActive: true,
          resourceGroupId: id,
          resourceId: this.data.resourceId
        });
      }
    });
    const groupData = {
      resourceId: this.data.resourceId,
      resourceMap
    };
    this.commonService.createGroupReso(groupData).subscribe(res => {
      if (res.statusCode !== 0) {
        this.toastr.success('Success', `${res.message}`);
        this.thisDialogRef.close('confirm');
      }
    }, error => {
      this.toastr.error('Error', `${error.error.message}`);
    })
  }
}
