import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfigurationService } from '../../../../shared';

@Component({
  selector: 'app-door-history',
  templateUrl: './door-history.component.html',
  styleUrls: ['./door-history.component.scss']
})
export class DoorHistoryComponent {

  displayColumns = ['Event Time','Action Type', 'Status']
  tableData = []
  column = ['eventTime','entityTagId', 'entityContactStatusName']
  pageSize = 10;
  pageStart = 0;
  length
  doorLocation
  doorName
  currentStatus

  public facilityId = localStorage.getItem(btoa('facilityId'));


  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any, public configService: ConfigurationService) {
    console.log(this.data)
    const config = JSON.parse(this.data.configValue);
    this.doorName = config.name;
    this.doorLocation = config.desc;
    this.currentStatus = data.currentstatus
  }

  ngOnInit() {
    this.gethistory()
  }

  gethistory() {
    this.configService.getDoorHistory(this.facilityId, this.data.id, this.pageSize, this.pageStart).subscribe((res) => {
      this.tableData = res.results.map(item => ({
        ...item,
        eventTime: item.entityContactEventHistories?.[0]?.eventTime || null
      }));
      this.length = this.tableData.length
    })

  }
}

