import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfigurationService } from '../../../../../shared';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-mustering-history-v2',
  templateUrl: './mustering-history-v2.component.html',
  styleUrls: ['./mustering-history-v2.component.scss']
})
export class MusteringHistoryV2Component {

  tableData: any[] = [];
  applyFilterValue: string = null;
  pageSize = 50;
  pageStart = 0;
  drillName: string;
  isLoading = true;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    public configurationService: ConfigurationService,
    public datePipe: DatePipe
  ) {
    this.drillName = data?.Name;
  }

  ngOnInit() {
    const formatdate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.configurationService
      .getHistoryActivities(this.data.requestId, formatdate, this.pageSize, this.pageStart, 'RQT-TASK')
      .subscribe(res => {
        const table = res.results;
        this.tableData = table?.[0]?.requests ?? [];
        this.isLoading = false;
      }, () => {
        this.isLoading = false;
      });
  }

  headerEventAction(event: any) {
    if (event.key === 'applyFilter') {
      this.applyfilter(event.data);
    }
  }

  applyfilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
  }
}
