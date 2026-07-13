import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

import { NetworkService } from './network.service';
import { RequestQueueService } from './request-queue.service';
import { NetworkDialogComponent } from './network-dialog/network-dialog.component';
import { CommonService } from '../shared';
import { forkJoin } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkPopupService {
    public active_btn: any = [];
  private dialogRef: MatDialogRef<NetworkDialogComponent> | null = null;

  constructor(
    private dialog: MatDialog,
    private networkService: NetworkService,
    private queue: RequestQueueService,
    private http: HttpClient,
    public commonService : CommonService
  ) {
    this.networkService.offline$.subscribe(isOffline => {
      console.log('%c👀 offline$ changed:', 'color:orange;font-size:14px', isOffline);
      isOffline ? this.open() : this.close();
    });
    this.preloadOfflineArt()
    this.active_btn = this.commonService.getActivePermission('button');
  }


  private open(): void {
    if(!this.active_btn.includes('BT_NOCONNECTION')) return ;
    if (this.dialogRef) return;

    this.dialogRef = this.dialog.open(NetworkDialogComponent, {
      disableClose: true,
      width: '420px'
    });

    this.dialogRef.afterClosed().subscribe(result => {
      this.dialogRef = null;
      if (result === 'RETRY') {
        this.retry();
      }
    });
  }
  private retry(): void {
    if (!this.queue.hasRequests()) return;

    const calls = this.queue.retryAll();

    forkJoin(calls).subscribe({
      next: () => {
        this.networkService.markOnline();
        this.queue.clear();
      },
      error: (err) => {
        if (err.status === 0) {
          this.networkService.markOffline();
        } else {
          this.networkService.markOnline();
          this.queue.clear(); 
        }
      }
    });
  }

  private close(): void {

    if (this.queue.hasRequests()) {
      this.retry();
    }
    
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }

  preloadOfflineArt(): void {
    const img = new Image();
    img.src = '/assets/icons/NoConnection.svg';
  }
}
