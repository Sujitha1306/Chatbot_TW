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

import { ChangeDetectorRef, Component, HostListener, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MeetingService } from '../../../../ovitag/hospital/meeting.service';
import { AmbulanceComponent } from '../../../../ovitag/workflow/ambulance/ambulance.component';
import { CommonService, ConfigurationService } from '../../../services';
import { Subscription } from 'rxjs';
import { FloatNotificationManageService } from '../../../services/float-notification-manage.service';

@Component({
  selector: 'app-tw-meeting',
  templateUrl: './tw-meeting.component.html',
  styleUrls: ['./tw-meeting.component.scss'],
  providers: [MeetingService]
})
export class TwMeetingComponent {

  joined = false;
  mutedAudio = false;
  mutedVideo = false;
  channelName = null;
  token = null;
  shareLink = '';
  list: any[];
  requestDetails;
  remoteusers: [];
  uid = localStorage.getItem(btoa('userId'));
  participantList: any[] = [];
  meetingId;
  userList: any;
  userId = localStorage.getItem(btoa('userId'));
  nonperformer: any;
  isDragging = false;
  isResizing = false;
  isMinimized = false;
  isMaximized = false;
  resizeDirection: string | null = null;
  position = { top: 100, left: 100 };
  size = { width: 1000, height: 590 };
  offset = { x: 0, y: 0 };
  resizeStart = { x: 0, y: 0 };
  previousPosition = { top: 0, left: 0 };
  previousSize = { width: 0, height: 0 };
  remoteUsers: any[] = [];
  private readonly remoteUsersSubscription: Subscription;
  remotevideo;
  result;
  host: boolean;
  showDropdown: boolean;
  calling: boolean;
  showSearch: boolean = false;
  searchText: null;
  SearchUserNameList: any[];
  callingUserMap: Map<string, number> = new Map();
  constructor(public agoraService: MeetingService, private readonly cdr: ChangeDetectorRef, private readonly route: ActivatedRoute,private readonly router: Router,
 private readonly commonService: CommonService, private readonly configurationService: ConfigurationService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    @Optional() public thisDialogRef: MatDialogRef<AmbulanceComponent>, public dialog: MatDialog, private readonly fcmService: FloatNotificationManageService
  ) {

    if (data) {
      this.token = data.token
      this.channelName = data.channel
      this.meetingId = data.meetingId
    }

    // this.agoraService.client.on("user-published", (user, mediaType) => {
    //   if (mediaType === "video") {
    //     this.remotevideo=false;
    //   }
    // });
  }
  async ngOnInit() {
    this.fcmService.callerData$.subscribe(data => {
      try {
        const additionalInfoStr = data?.data?.additionalInfo;
        if (!additionalInfoStr) return;
        const additionalInfo = JSON.parse(additionalInfoStr);
        const isEnd = additionalInfo?.isEnd;
        const isRejected = additionalInfo?.isRejected;
        if (isEnd === true) {
          this.leaveCall();
        }
       if (isRejected === true) {
          const rejectedCallerName = additionalInfo?.callerName; 
          const rejectedUserId = this.callingUserMap.get(rejectedCallerName); 

          if (rejectedUserId) {
            this.userList = this.userList.map(user => {
              if (user.id === rejectedUserId) {
                return { ...user, isCalling: false, isRejected: true };
              }
              return user;
            });
            this.callingUserMap.delete(rejectedCallerName); 
          }
          this.cdr.detectChanges();
        }
      } catch (err) {
        console.error(err);
      }
    });
    await this.agoraService.initClient();
    await this.agoraService.createLocalTrack();
    this.agoraService.localVideoTrack?.play('preview-player');
    this.requestDetails = this.data
    if (this.token === null && this.channelName == null) {
      this.commonService.getAmbulanceRequestById(this.data.requestId, 'RQT-AMB').subscribe(res => {
        const list = res.results
        this.userList = list[0].nonPerformer.filter(p => p.tagAssociationTypeId != "TAT-PA")
        this.list = list[0].nonPerformer.filter(p => p.tagAssociationTypeId != "TAT-PA")
        const userIds = this.userList
          .filter(user => user.roleCode === 'RO-AMP')
          .map(user => user.id);

        this.userList = this.userList.map(user => {
          if (user.id === userIds[0]) {
            return { ...user, isCalling: true };
          }
          return user;
        });
        let postdata = {
          "callType": "video",
          "channelName": this.data.requestId,
          "eventStatusId": "CAS-ONG",
          "eventTypeId": "CET-JOI",
          "userId": this.userId,
          "identifyingId": this.data.requestId,
          "identifyingType": "RQT-AMB",
          "inviteUserIds": [
            userIds[0]
          ]
        }
        this.commonService.pushNotification(postdata).subscribe(res => {
          this.result = res.results
          this.meetingId = this.result?.meetingId
          this.channelName = this.result?.channelName
          this.token = this.result?.token
          this.joinCall().then(() => {
            this.commonService.getUser(this.channelName, this.meetingId).subscribe(res => {
              this.participantList = res.results;
              const participantIds = this.participantList.map(p => p.id);
              this.userList = this.userList.filter(user => !participantIds.includes(user.id));
              const myData = this.participantList.find(user => user.id === Number(this.userId));
              if (myData && myData.isHost === true) {
                this.host = true;
              }
            });
            setTimeout(() => {
              const isJoined = this.participantList.some(p => p.id === userIds[0]);
              if (!isJoined) {
                const missedData = {
                  "callType": "video",
                  "eventStatusId": "CAS-MIS",
                  "eventTypeId": "CET-LFT",
                  "userId": this.userId,
                  "inviteUserIds": [userIds[0]]
                };
                this.commonService.userStatus(this.channelName, this.meetingId, missedData).subscribe();
              }
              this.userList = this.userList.map(user => {
                if (user.id === userIds[0]) {
                  return { ...user, isCalling: false };
                }
                return user;
              });
            }, 30000)
          });
        })

      })
    }

    if (this.channelName != null) {
      if (this.token != null) {
        this.commonService.getAmbulanceRequestById(this.channelName, 'RQT-AMB').subscribe(res => {
          this.requestDetails = res.results[0]
          this.userList = this.requestDetails.nonPerformer.filter(p => p.tagAssociationTypeId != "TAT-PA")
          this.joinCall().then(() => {
            this.commonService.getUser(this.channelName, this.meetingId).subscribe(res => {
              this.participantList = res.results;
              const participantIds = this.participantList.map(p => p.id);
              this.userList = this.userList.filter(user => !participantIds.includes(user.id));
              const myData = this.participantList.find(user => user.id === Number(this.userId));
              if (myData && myData.isHost === true) {
                this.host = true;
              }
            });
          })
        })
      }
    }
    this.agoraService.client.on('user-published', async (user, mediaType) => {
      // this.updateUserCallStatus();
      this.commonService.getUser(this.channelName, this.meetingId).subscribe(res => {
        this.participantList = res.results
        const participantIds = new Set(this.participantList.map(p => p.id));
        this.userList = this.userList.filter(user => !participantIds.has(user.id));
      })
    });

    this.agoraService.client.on('user-left', (user) => {
  const leftUserId = String(user.uid);

  this.participantList = this.participantList.filter(
    p => String(p.id) !== leftUserId
  );

  const participantIds = new Set(this.participantList.map(p => String(p.id)));
  this.userList = this.list.filter(user => !participantIds.has(String(user.id)));

});

  }

  toggleMic() {
    this.mutedAudio = !this.mutedAudio;
    this.agoraService.toggleAudio(this.mutedAudio);
  }

  toggleCam() {
    this.mutedVideo = !this.mutedVideo;
    this.agoraService.toggleVideo(this.mutedVideo);
  }


  minimizeCall() {
    // this.thisDialogRef.close(); 
    // this.thisDialogRef.close();
    // this.dialog.open(FloatingVideoComponent, { panelClass: 'no-padding-dialog' });

  }



  async joinCall() {
    this.joined = true;
    this.cdr.detectChanges();
    this.agoraService.localAudioTrack?.stop();
    this.agoraService.localVideoTrack?.stop();
    this.agoraService.localVideoTrack?.play('local-player');
    await this.agoraService.joinChannel(this.channelName, this.token, this.uid);
    await this.agoraService.publishLocalTrack();
  }

  async leaveCall() {
    this.router.navigate([], {
  relativeTo: this.route,
  queryParams: {},
  queryParamsHandling: '',
});
  if (this.participantList.length <= 1) {
    this.endMeeting();
  }else{
    await this.agoraService.leaveChannel();
    const data = {
      "callType": "video",
      "eventTypeId": "CET-LFT",
      "userId": this.userId
    }
    this.commonService.userStatus(this.channelName, this.meetingId, data).subscribe(res => {
      // this.participantList = res.results
      // const participantIds = this.participantList.map(p => p.id);
      // this.userList = this.userList.filter(user => user.id != participantIds);
    })
    this.thisDialogRef.close('confirm');
  }
  }
  
  async endMeeting() {
    await this.agoraService.leaveChannel();
    const data = {
      "callType": "video",
      "eventTypeId": "CET-LFT",
      "eventStatusId": "CAS-END",
      "userId": this.userId
    }
    this.fcmService.updateCallerData('endCall');
    this.commonService.userStatus(this.channelName, this.meetingId, data).subscribe(res => {
      // console.log('sucessssss')
    })
    this.thisDialogRef.close('confirm');
  }
  get totalUsers() {
    return 1 + this.agoraService.remoteUsers.length;
  }
  get filteredRemoteUsers() {
    return this.agoraService.remoteUsers.filter(user => user.uid);
  }

  ngOnDestroy() {
    this.agoraService.leaveChannel();
  }
  onSelectedClose() {
    if (this.joined) {
      this.leaveCall()
    } else {
      this.dialog.closeAll()
    }
  }
  onMouseDown(event: MouseEvent) {
    if (this.isMaximized) return;
    this.isDragging = true;
    this.offset = {
      x: event.clientX - this.position.left,
      y: event.clientY - this.position.top
    };
  }

  onResizeMouseDown(event: MouseEvent, direction: string) {
    if (this.isMaximized) return;
    this.isResizing = true;
    this.resizeDirection = direction;
    this.resizeStart = { x: event.clientX, y: event.clientY };
    event.stopPropagation();
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
    this.resizeDirection = null;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const MIN_LEFT = 2;
    const MIN_TOP = 2;
    const MIN_WIDTH = 481;
    const MIN_HEIGHT = 436;

    if (this.isDragging) {
      const newLeft = event.clientX - this.offset.x;
      const newTop = event.clientY - this.offset.y;

      this.position.left = Math.max(newLeft, MIN_LEFT);
      this.position.top = Math.max(newTop, MIN_TOP);

    } else if (this.isResizing && this.resizeDirection) {
      const dx = event.clientX - this.resizeStart.x;
      const dy = event.clientY - this.resizeStart.y;

      if (this.resizeDirection.includes('right')) {
        this.size.width = Math.max(this.size.width + dx, MIN_WIDTH);
      }
      if (this.resizeDirection.includes('bottom')) {
        this.size.height = Math.max(this.size.height + dy, MIN_HEIGHT);
      }
      if (this.resizeDirection.includes('left')) {
        const newWidth = this.size.width - dx;
        const newLeft = this.position.left + dx;
        if (newWidth >= MIN_WIDTH && newLeft >= MIN_LEFT) {
          this.size.width = newWidth;
          this.position.left = newLeft;
        }
      }
      if (this.resizeDirection.includes('top')) {
        const newHeight = this.size.height - dy;
        const newTop = this.position.top + dy;
        if (newHeight >= MIN_HEIGHT && newTop >= MIN_TOP) {
          this.size.height = newHeight;
          this.position.top = newTop;
        }
      }

      this.resizeStart = { x: event.clientX, y: event.clientY };
    }
  }

  // toggleMinimize() {
  //   console.log( this.isMinimized )
  //   this.isMinimized = !this.isMinimized;
  //   if (this.isMinimized) {
  //     console.log('tst')
  //     this.isMaximized = false;
  //   }
  //   this.cdr.detectChanges();
  //   this.agoraService.localAudioTrack?.play('preview-player');
  //   this.agoraService.localVideoTrack?.play('preview-player');
  //   if(this.joined){
  //     this.agoraService.localAudioTrack?.play('local-player');
  //     this.agoraService.localVideoTrack?.play('local-player');
  //     this.agoraService.localAudioTrack?.play('user-' + this.userIds);
  //     this.agoraService.localVideoTrack?.play('user-' + this.userIds);
  //   }
  // }

  toggleMaximize() {
    if (!this.isMaximized) {
      this.previousSize = { ...this.size };
      this.previousPosition = { ...this.position };

      this.size = {
        width: window.innerWidth - 50,
        height: window.innerHeight - 0
      };
      this.position = { top: 0, left: 48, };
      this.isMaximized = true;
      this.isMinimized = false;
    } else {
      this.size = { ...this.previousSize };
      this.position = { ...this.previousPosition };
      this.isMaximized = false;
    }
  }

  callUser(user: any) {
    const targetUserId = user.id
    this.callingUserMap.set(user.name, targetUserId)
     this.userList = this.userList.map(u => {
    if (u.id === targetUserId) {
      return { ...u, isCalling: true, isRejected: false };
    }
    return u;
  });
    let postdata = {
      "callType": "video",
      "eventStatusId": "CAS-ONG",
      "eventTypeId": "CET-JOI",
      "identifyingId": this.data.requestId,
      "identifyingType": "RQT-AMB",
      "userId": this.userId,
      "meetingId": this.meetingId,
      "inviteUserIds": [
        user.id
      ]
    }
    // console.log('postt', postdata)
    this.commonService.pushNotification(postdata).subscribe(res => {
      this.result = res.results
      // console.log("resultsssss", res)
      this.channelName = this.result?.channelName
      this.token = this.result?.token
      // console.log("channel and  token ", this.token)
    })

    setTimeout(() => {
      if (!this.participantList.filter(L => L.id === targetUserId)) {
        const data = {
          "callType": "video",
          "eventStatusId": "CAS-MIS",
          "eventTypeId": "CET-LFT",
          "userId": this.userId,
          "inviteUserIds": [
            user.id
          ]
        }
        this.commonService.userStatus(this.channelName, this.meetingId, data).subscribe(res => {

        })
      }
      this.userList = this.userList.map(user => {
        if (user.id === targetUserId) {
          return { ...user, isCalling: false };
        }
        return user;
      });
    }, 30000);
  }


  updateUserCallStatus() {
    this.remoteUsers = this.filteredRemoteUsers.map(user => user.uid);
    // console.log("remoteuserrrrr", this.remoteUsers)
    this.userList = this.userList.map(user => ({
      ...user,
      inCall: this.remoteUsers.includes(user.id)
    }));
    // console.log("incallll", this.userList)
  }



  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.searchText = null;
      this.SearchUserNameList = [];
    }
  }

  onSearchChange(event) {
    const trimmedEvent = event?.trim();
    if (trimmedEvent && trimmedEvent.length >= 2) {
      this.configurationService.getTicketUser(trimmedEvent, 'RT-US').subscribe(res => {
        this.SearchUserNameList = res.results.filter(searchUser =>
          !this.userList.some(existingUser => existingUser.id === searchUser.id) &&
          (!this.participantList || !this.participantList.some(user => user.id === searchUser.id))
        );
      });
    } else {
      this.SearchUserNameList = [];
    }
  }

  getOwnerDetails(option) {
    if (option) {
      this.userList.push(option);
      this.callUser(option);
      this.clearSearch();
    }
  }

  clearSearch() {
    setTimeout(() => {
      this.searchText = null;
      this.SearchUserNameList = [];
    });
  }
  fixClick() {
    console.log('')
  }  
}
