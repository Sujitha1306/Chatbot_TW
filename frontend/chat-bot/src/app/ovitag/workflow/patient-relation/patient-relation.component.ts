import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ManagePatientRelationComponent } from '../../../shared/modules/entry-component/manage-patient-relation/manage-patient-relation.component';
import { CommonService } from '../../../shared';
import { PatientRelationManagementComponent } from '../../../shared/modules/entry-component/patient-relation-management/patient-relation-management.component';
import { PatientAdmitComponent } from '../../../shared/modules/entry-component/patient-admit/patient-admit.component';

@Component({
  selector: 'app-patient-relation',
  templateUrl: './patient-relation.component.html',
  styleUrls: ['./patient-relation.component.scss']
})
export class PatientRelationComponent {
  showAction1 = [
    { id: 'create', value: 'Create Patient Relation' },
    {id : 'createPatient',value:'Create Patient'}
  ];
  public showActions = this.showAction1;
  displayedColumns: string[] = ['Patient Name','Relation Name','Relationship','D.O.B','Gender','Phone Number',"Email",'Address'];
  eventColumn = ['Patient Name','Relation Name'];
  iconHeader = ['Gender'];
  iconColumn = ['Gender'];
  sortColumn = [];
  permissionControl = [null];
  tableData: any = [];
  patientList: any;
  public applyFilterValue: any;
  selectedName: any = null;
  selectDropdown: any;
  public pageStart: number = 0;
  public pageSize: number = 50;
  public Statuscode: any[] = [];
  selectedStatus = [];

  constructor(public dialog : MatDialog , public commonService : CommonService){}

  ngOnInit(){
   this.getPatientRelation()
  }

  getPatientRelation(){
     this.commonService.getPatientRelations().subscribe((res)=>{
      this.tableData = res.results
      const Columns = [ 'patientName', 'firstName', 'relationshipValue', 'birthDate',  'gender', 'mobileNo', 'email', 'address'];
      for (let i = 0; i < Columns.length; i++) {
        this.tableData.map(data => {
  
            data[this.displayedColumns[i]] = data[Columns[i]];

        });
      }
    })
  }
  headerEventAction(event){
    if(event.data === 'create'){
      this.create(null)
    } else if (event.key === 'refreshPage'){
      this.refreshPage()
    } else if (event.data === 'createPatient'){
      this.openPatient()
    }
  }
  eventAction(event){
    if(event.key === 'Patient Name'){
        this.patientRealiontManagement(event.data)
    } else if(event.key === 'Relation Name'){
      this.create(event.data)
    }
  }

 create(data){
  this.showActions = null
  this.selectedName = null
      const dialogRef = this.dialog.open(ManagePatientRelationComponent, {
       data:data ,panelClass: ['medium-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        this.refreshPage()
        this.showActions=this.showAction1
      });
    }

    refreshPage(){
      this.getPatientRelation()
      this.showActions=this.showAction1
    }

    patientRealiontManagement(data){
       const dialogRef = this.dialog.open(PatientRelationManagementComponent,{
        data : data,panelClass:['large-popup'],disableClose : true
      })
       dialogRef.afterClosed().subscribe(result => {
        this.refreshPage()
      });
    }


    openPatient(){
      this.showActions = null
     this.selectedName = null
      const dialogRef = this.dialog.open(PatientAdmitComponent, {
       panelClass: ['small-popup'], disableClose: true
      });
      dialogRef.afterClosed().subscribe(result => {
        this.refreshPage()
        this.showActions=this.showAction1
      });

    }
}
