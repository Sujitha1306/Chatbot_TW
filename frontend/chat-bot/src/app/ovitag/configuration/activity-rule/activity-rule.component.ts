import { Component, OnInit } from '@angular/core';
import { CommonService, ConfigurationService } from '../../../shared';
import { MatDialog } from '@angular/material/dialog';
import { CreateActivityRuleComponent } from '../../../shared/modules/entry-component/create-activity-rule/create-activity-rule.component';

@Component({
  selector: 'app-activity-rule',
  templateUrl: './activity-rule.component.html',
  styleUrls: ['./activity-rule.component.scss']
})
export class ActivityRuleComponent implements OnInit {
  public showAction1 = [{ id: 'create', value: 'Create' }]
  public showActions = this.showAction1;
  public displayedColumns: string[] = ['Type', 'Activity', 'Activity Rule', 'Rule Group', 'Step Type', 'Duration'];
  public eventColumn = ['Activity Rule'];
  public iconHeader = [];
  public iconColumn = [];
  public sortColumn = [];
  public permissionControl = ['BT_ALLE'];
  public permission = ['BT_ALLEN'];
  selectedName: any = null;
  selectDropdown: any;
  groupFilter = []
  applyFilterValue: string;
  tableData: any;

  constructor(private readonly commonService: CommonService, public dialog: MatDialog){ }

  ngOnInit(): void {
    this.getActivityRule()
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.applyFilterValue = filterValue;
  }

  refreshPage(){
    this.showActions = this.showAction1;
    this.getActivityRule()
  }

  headerEventAction(event) {
    console.log(event)
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createActivityRule('')
    } else {
      this.refreshPage()
    }
  }

  eventAction(event) {
    if (event.key === 'Activity Rule') {
      this.createActivityRule(event.data)
    } 
  }

  getActivityRule(){
     this.commonService.getActivityRule().subscribe(res => {
      this.tableData = res.results;
      if (this.applyFilterValue !== null) {
        this.applyFilterValue = this.applyFilterValue + ' ';
      }
      const Columns = ['value', 'identifyingName', 'ruleActivityName', 'ruleGroupNo', 'stepType', 'duration'];
      for (let i = 0; i <= Columns.length; i++) {
        this.tableData.map(data => {
          data[this.displayedColumns[i]] = data[Columns[i]];
        });
      }
    });
  }

  createActivityRule(data) {
    this.showActions = null;
    if (data === '') {
      data = {
        modeType: 'create',
        identifyingType: 'pf_activity',
        view: 'activityRule'
      }
    } else {
      data['modeType'] = 'modify';
      data['view'] = 'activityRule';
    }
    const dialogRef = this.dialog.open(CreateActivityRuleComponent,
      { data: data, panelClass: ['medium-popup'], disableClose: true });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshPage();
      this.selectDropdown = null;
    });
  }
}
