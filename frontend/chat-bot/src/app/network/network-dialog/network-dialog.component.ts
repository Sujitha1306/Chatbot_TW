import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NetworkService } from '../network.service';
import { RequestQueueService } from '../request-queue.service';
@Component({
  selector: 'app-network-dialog',
  templateUrl: './network-dialog.component.html',
  styleUrls: ['./network-dialog.component.scss']
})
export class NetworkDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<NetworkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, public networkService : NetworkService,public queue : RequestQueueService
  ) {}

  retry() {
     if (!this.queue.hasRequests()) {
    if (!navigator.onLine) {
      this.networkService.markOffline();
    }
    return;
  }

  this.dialogRef.close("RETRY")
 }


 
}
