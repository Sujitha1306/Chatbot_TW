import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ErrorStateMatcher, DateAdapter } from "@angular/material/core";
import { FormGroup, FormBuilder, Validators, FormControl, FormGroupDirective, NgForm } from "@angular/forms";
import { routerTransition } from "../../../router.animations";
import { ConfigurationService, CommonService } from "../../../shared";
import { ActivatedRoute, Router } from "@angular/router";
import { CreatePoeInjector, EditPoeInjector } from "./poe-injector.model";
import { AppToastService } from "../../../shared/services/toaster.service";
import { TwColumnDef, TwPaginationConfig } from "../../../shared/modules/entry-component/tw-data-table/tw-data-table.models";

@Component({
    selector: "app-poe-injector",
    templateUrl: "./poe-injector.component.html",
    styleUrls: ["./poe-injector.component.scss"],
    animations: [routerTransition()],
})
export class PoeInjectorComponent implements OnInit {
    iconHeader = [];
    iconColumn = [];
    sortColumn = ['Serial No'];
    eventColumn = [];
    permissionControl = ['PI_ALLE'];
    permission = ['PI_ALLC'];
    displayedColumns = ['Serial No', 'MAC-Address', 'Model', 'Location', 'Floor', 'Total Ports', 'Status'];
    public tableVersion: any = null;
    public poeInjectorLength: number = 0;
    public selectedName = null;
    public rowData: any = [];
    public activate_btn: any = [];
    public applyFilterValue: any;
    public tableData: any = [];
    showAction1 = [{ id: 'create', value: 'Create' }];
    showAction2 = [{ id: 'modify', value: 'Modify' }];
    public showActions: any = this.showAction1;
    public pageIndex: number = 0;
    public pageSize: number = 10;
    public totalCount: number = 0;

    constructor(
        private readonly configurationService: ConfigurationService,
        public dialog: MatDialog,
        public commonService: CommonService,
        public router: Router,
        private readonly route: ActivatedRoute
    ) {
        this.activate_btn = this.commonService.getActivePermission("button");
    }

    ngOnInit() {
        setTimeout(() => {
            this.tableVersion = (this.commonService.facilityConfig as any)?.twTableVersion ?? 1;
            if (this.tableVersion === 2) {
                this.displayedColumns = ['Serial No', 'MAC-Address', 'Model', 'Location', 'Floor', 'Total Ports', 'Status'];
            }
            const res = this.route.snapshot.data.poeInjector;
            this.tableData = res.results || [];
            console.log(this.tableData,"tabledata")
            this.totalCount = res.totalCount || this.tableData.length;
            this.poeInjectorLength = this.totalCount;
            this.mapTableData();
        }, 500);
    }

    mapTableData() {
        for (let index = 0; index < this.tableData.length; index++) {
            this.tableData[index]['Serial No'] = this.tableData[index]['serialNumber'];
            this.tableData[index]['MAC-Address'] = this.tableData[index]['macAddress'];
            this.tableData[index]['Model'] = this.tableData[index]['model'];
            this.tableData[index]['Location'] = this.tableData[index]['locationId'];
            this.tableData[index]['Floor'] = this.tableData[index]['floor'];
            this.tableData[index]['Total Ports'] = this.tableData[index]['totalPorts'];
            this.tableData[index]['Status'] = this.tableData[index]['status'];
        }
    }

    headerEventAction(event: any) {
        if (event.key === 'applyFilter') {
            this.applyFilter(event.data);
        } else if (event.data === 'create') {
            this.createPoeInjector(null);
        } else if (event.data === 'modify') {
            this.createPoeInjector(this.selectedName);
        } else {
            this.selectedName = null;
            this.applyFilterValue = null;
            this.pageIndex = 0;
            this.refreshPage();
        }
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim();
        this.applyFilterValue = filterValue;
        this.pageIndex = 0;
        this.getAllPoeInjectors();
    }

    refreshPage() {
        this.selectedName = null;
        this.applyFilterValue = null;
        this.pageIndex = 0;
        this.showActions = this.showAction1;
        this.getAllPoeInjectors();
    }

    rowClick(data: any) {
        if (this.selectedName && data.id == this.selectedName.id) {
            this.selectedName = null;
            this.showActions = this.showAction1;
        } else {
            this.selectedName = data;
            this.showActions = this.showAction2;
        }
    }

    createPoeInjector(data: any) {
        this.showActions = null;
        if (data != null) {
            this.configurationService.getAllPoeInjectors(data.id).subscribe((res) => {
                this.rowData = res.results[0];
                const dialogRef = this.dialog.open(CreatePoeInjectorComponent,
                    { data: this.rowData, panelClass: ['medium-popup'], disableClose: true });
                dialogRef.afterClosed().subscribe(() => {
                    this.refreshPage();
                });
            });
        } else {
            const dialogRef = this.dialog.open(CreatePoeInjectorComponent,
                { data: null, panelClass: ['medium-popup'], disableClose: true });
            dialogRef.afterClosed().subscribe(() => {
                this.refreshPage();
            });
        }
    }

    getAllPoeInjectors() {
        this.configurationService.getAllPoeInjectors(undefined, this.applyFilterValue, this.pageIndex, this.pageSize).subscribe((res) => {
            this.tableData = res.results || [];
            this.totalCount = res.totalCount || this.tableData.length;
            this.poeInjectorLength = this.totalCount;
            this.mapTableData();
        });
    }

    get poeInjectorTwColumns(): TwColumnDef[] {
        return this.buildTwColumnDefs(
            this.displayedColumns, this.sortColumn, this.iconColumn, this.iconHeader, this.eventColumn, []
        );
    }

    buildTwColumnDefs(
        displayedCols: string[],
        sortCols: string[] = [],
        iconCols: string[] = [],
        iconHeader: string[] = [],
        eventCols: string[] = [],
        timeCols: string[] = [],
        statusCols: string[] = [],
    ): TwColumnDef[] {
        return (displayedCols ?? []).map(key => {
            const def: TwColumnDef = { key };
            if (sortCols.includes(key)) def.sortable = true;
            if (eventCols.includes(key)) def.clickable = true;
            if (iconCols.includes(key)) def.icon = { matIcon: '' };
            if (iconHeader.includes(key)) def.headerIcon = { matIcon: '' };
            if (timeCols.includes(key)) def.type = 'datetime';
            if (statusCols.includes(key)) def.type = 'status';
            return def;
        });
    }

    get poeInjectorPaginationConfig(): TwPaginationConfig {
        return { length: this.totalCount, pageSize: this.pageSize, pageIndex: this.pageIndex, pageSizeOptions: [10, 15, 20, 50, 100] };
    }

    onCellAction(_event: { column: string; row: any }) {
    }

    onPageChange(event: { pageIndex: number; pageSize: number }) {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.getAllPoeInjectors();
    }
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(
        control: FormControl | null,
        form: FormGroupDirective | NgForm | null
    ): boolean {
        const isSubmitted = form?.submitted;
        return !!(
            control &&
            control.invalid &&
            (control.dirty || control.touched || isSubmitted)
        );
    }
}

@Component({
    selector: "app-create-poe-injector",
    templateUrl: "./create-poe-injector.component.html",
    styleUrls: ["./poe-injector.component.scss"],
})
export class CreatePoeInjectorComponent implements OnInit {
    public poeInjectorForm!: FormGroup;
    public createPoeInjector!: CreatePoeInjector;
    public editPoeInjector!: EditPoeInjector;
    matcher = new MyErrorStateMatcher();
    public isDisabled = false;

    constructor(
        public form: FormBuilder,
        public toastr: AppToastService,
        public thisDialogRef: MatDialogRef<CreatePoeInjectorComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private readonly configurationServices: ConfigurationService,
        dateAdapter: DateAdapter<Date>,
    ) {
        dateAdapter.setLocale("en-in");
        this.buildForm();
    }

    ngOnInit() {
    }

    public buildForm() {
        this.poeInjectorForm = this.form.group({
            serialNumber: [this.data?.serialNumber || null, [Validators.required]],
            macAddress: [this.data?.macAddress || null],
            ipAddress: [this.data?.ipAddress ? String(this.data.ipAddress) : null, [Validators.pattern(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)]],
            model: [this.data?.model || null],
            totalPorts: [this.data?.totalPorts || null, [Validators.pattern(/^\d{1,3}$/)]],
            status: [this.data?.status ? this.data.status.charAt(0).toUpperCase() + this.data.status.slice(1).toLowerCase() : 'Active'],
            locationId: [this.data?.locationId ?? null],
            floorId: [this.data?.floorId ?? null],
            coordinate: [this.data?.coordinate ?? null]
        });
    }

    savePoeInjector() {
        this.createPoeInjector = new CreatePoeInjector(null, null, null, null, null, null, null, null, null);
        this.createPoeInjector.serialNumber = this.poeInjectorForm.controls['serialNumber'].value;
        this.createPoeInjector.macAddress = this.poeInjectorForm.controls['macAddress'].value;
        this.createPoeInjector.ipAddress = this.poeInjectorForm.controls['ipAddress'].value;
        this.createPoeInjector.model = this.poeInjectorForm.controls['model'].value;
        this.createPoeInjector.totalPorts = parseInt(this.poeInjectorForm.controls['totalPorts'].value);
        this.createPoeInjector.status = this.poeInjectorForm.controls['status'].value;
        this.createPoeInjector.locationId = this.poeInjectorForm.controls['locationId'].value ?? null;
        this.createPoeInjector.floorId = this.poeInjectorForm.controls['floorId'].value ?? null;
        this.createPoeInjector.coordinate = this.poeInjectorForm.controls['coordinate'].value ?? null;
        this.configurationServices.createPoeInjector(this.createPoeInjector).subscribe(
            (res) => {
                if (res.statusCode !== 1) {
                    this.isDisabled = false;
                }
                this.toastr.success("Success", `${res.message}`);
                this.thisDialogRef.close("confirm");
            },
            (error) => {
                this.isDisabled = false;
                this.toastr.error("Error", `${error.error.message}`);
            }
        );
    }

    public updatePoeInjector() {
        this.editPoeInjector = new EditPoeInjector(null, null, null, null, null, null, null, null, null);
        this.editPoeInjector.serialNumber = this.poeInjectorForm.controls['serialNumber'].value;
        this.editPoeInjector.macAddress = this.poeInjectorForm.controls['macAddress'].value;
        this.editPoeInjector.ipAddress = this.poeInjectorForm.controls['ipAddress'].value;
        this.editPoeInjector.model = this.poeInjectorForm.controls['model'].value;
        this.editPoeInjector.totalPorts = parseInt(this.poeInjectorForm.controls['totalPorts'].value);
        this.editPoeInjector.status = this.poeInjectorForm.controls['status'].value;
        this.editPoeInjector.locationId = this.poeInjectorForm.controls['locationId'].value ?? null;
        this.editPoeInjector.floorId = this.poeInjectorForm.controls['floorId'].value ?? null;
        this.editPoeInjector.coordinate = this.poeInjectorForm.controls['coordinate'].value ?? null;
        this.configurationServices.updatePoeInjector(this.editPoeInjector, this.data.id).subscribe(
            (res) => {
                if (res.statusCode !== 1) {
                    this.isDisabled = false;
                }
                this.toastr.success("Success", `${res.message}`);
                this.thisDialogRef.close("confirm");
            },
            (error) => {
                this.isDisabled = false;
                this.toastr.error("Error", `${error.error.message}`);
            }
        );
    }
}