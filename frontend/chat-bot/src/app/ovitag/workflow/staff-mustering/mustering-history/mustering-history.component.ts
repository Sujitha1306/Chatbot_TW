import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfigurationService } from '../../../../shared';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-mustering-history',
  templateUrl: './mustering-history.component.html',
  styleUrls: ['./mustering-history.component.scss']
})
export class MusteringHistoryComponent {
    tableData=[]
    column=[]
    applyFilterValue = null;
    pageSize = 50
    pageStart = 0
    drillName;


    dashboardData = [
    { label: 'Total People', value: 0, },
    { label: 'Employees in Campus', value: 0 },
    { label: 'Visitors in Campus', value: 0 },
    { label: 'At Assembly Points', value: 0 }
  ];
    constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any, public configurationService : ConfigurationService,public datePipe : DatePipe){
        console.log(this.data)
        this.drillName = data.Name
    }

      ngOnInit() {
        console.log(this.data)
        const now = new Date();
        const formatdate = this.datePipe.transform(now, 'yyyy-MM-dd');
        this.configurationService.getHistoryActivities(this.data.requestId, formatdate, this.pageSize, this.pageStart, "RQT-TASK").subscribe(res => {
          const table = res.results;
        this.tableData= table[0].requests
        })
      }

      headerEventAction(event){
        console.log(event)
        if(event.key='applyFilter'){
          this.applyfilter(event.data)
        }
      }

    applyfilter(filterValue) {
      filterValue = filterValue.trim();
      filterValue = filterValue.toLowerCase();
      this.applyFilterValue = filterValue;
      console.log(this.applyFilterValue)
    }
}
