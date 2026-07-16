import { Component, ElementRef, Inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonService } from '../../../services';
import { HttpClient } from '@angular/common/http';
import { AppToastService } from '../../../services/toaster.service';
import { interval, Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { connect, MqttClient } from 'mqtt';

@Component({
  selector: 'app-chat-bot',
  templateUrl: './chat-bot.component.html',
  styleUrls: ['./chat-bot.component.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None
})
export class ChatBotComponent {

  @ViewChild('imageInput') imageInput!: ElementRef;
  @ViewChild('docInput') docInput!: ElementRef;
  @ViewChild('chatBody') chatBody!: ElementRef;

  public mediaRecorder!: MediaRecorder;
  public streamRef!: MediaStream;
  public pollingSub!: Subscription;
  public mqttClient!: MqttClient;
  public isUpdated = false;


  public currentFileUrl: string = '';
  public messageText = '';
  public previewData: any = null;
  public userData: any = null;
  public converstionId: any;
  public previewType: 'image' | 'file' | null = null;
  public userId = localStorage.getItem('dXNlcklk');
  public currentDate = new Date();
  public zoomLevel = 1;
  public page = 0;
  public size = 10;

  public messages: any[] = [];
  public audioChunks: Blob[] = [];

  public isRecording: boolean = false;
  public showAttachMenu: boolean = false;
  public showMenu: boolean = false;
  public showUnsupportedPreview: boolean = false;
  public loading: boolean = false;
  public hasMore: boolean = true;
  public isFirstLoad: boolean = true;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public sanitizer: DomSanitizer, public commonService: CommonService, private http: HttpClient,
              public toastr: AppToastService) { }

  async ngOnInit() {
    this.getUserData();
    if (!this.data?.conversationId) {
       this.saveConversation();
    } else {
      this.getChatHistory();
      this.connectMqtt();
    }
  }

  async saveConversation() {

    const createpost = {
          "entityType": this.data?.chatType,
          "entityId": this.data?.requestId,
          "title": `${this.data?.requestCategoryName} - ${this.data?.requestId} `,
          "senderId": parseInt(this.userId),
        };

    if (this.data && this.data.hasOwnProperty('performer') && this.data.performer) {

      const ApprovalStatus = ['RQ-CR', 'RQ-AS', 'RQ-AR', 'RQ-IP', 'RQ-HLD', 'RQ-CO']
      const visitIds = this.data?.performer.filter(res => ApprovalStatus.includes(res.status)).map(item => item.id);

      if (visitIds.length) {

        if (!visitIds.includes(this.data?.userId)) {
          createpost['inviteUserIds'] = [...visitIds, this.data?.userId];
        } else {
          createpost['inviteUserIds'] = visitIds;
        }

      }

    }
    
    if (this.data['chatType'] === 'dm') {
      createpost['receiverId'] = this.data?.id;
      createpost['title'] = `${this.data?.userName} - ${this.data?.roleName}`
      createpost['entityId'] = null
    }

    this.commonService.saveChatConversation(createpost).subscribe(res => {
      this.data.conversationId = res.results?.id;
      this.connectMqtt();
    });
  }

  startPolling() {
    // this.pollingSub = interval(15000).subscribe(() => {
    //   this.getChatHistory();
    // });
    this.getChatHistory();
  }

  connectMqtt(): void {
    const conversationId = this.data?.conversationId;
    if (!conversationId) return;

    this.commonService.getmqttBroker().subscribe({
      next: (res) => {
        if (res.results != null && res.results.length) {
          const brokerInfo = res.results.find((val: any) => val.brokerTypeId === 'BT-CL');
          if (brokerInfo) {
            const cloudConnect = {
              protocol: brokerInfo.wprotocol || 'wss',
              host: brokerInfo.host,
              password: brokerInfo.password,
              username: brokerInfo.username,
              port: Number(brokerInfo.wport),
              connectTimeout: 30000,
              keepalive: 60,
              clientId: 'client_chat_' + Math.random().toString(16).substr(2, 8)
            };

            this.mqttClient = connect(cloudConnect);

            this.mqttClient.on('connect', () => {
              console.log('✅ ChatBot MQTT Connected');
              if (this.userId) {
                this.mqttClient?.subscribe(`tw/chat/user/${this.userId}`);
              } else {
                this.mqttClient?.subscribe('tw/chat/user/#');
              }
            });

            this.mqttClient.on('message', (topic: string, message: Buffer) => {
              try {
                const msgStr = message.toString();
                const payload = JSON.parse(msgStr);
                const data = payload?.data;
                this.handleMqttMessage(data);
              } catch (e) {
                console.error('ChatBot MQTT message parse error', e);
              }
            });

            this.mqttClient.on('error', (err) => {
              console.error('ChatBot MQTT error', err);
              this.startPolling();
            });
          }
        } else {
          this.startPolling();
        }
      },
      error: (err) => {
        console.error('ChatBot failed to get MQTT broker details', err);
        this.startPolling();
      }
    });
  }

  handleMqttMessage(item: any): void {
    if (!item) return;
    const conversationId = this.data?.conversationId;
    if (item.conversationId == conversationId && (item.eventType === 'NEW_MESSAGE' || item.eventType === 'MESSAGE_SENT')) {
      console.log('ChatBot MQTT message received:', item);
      this.page = 0;
      this.messages = [];
      this.getChatHistory();
    }
  }

  getChatHistory() {

    if (this.loading) return;

    this.loading = true;
    this.isUpdated = false;
    this.page = 0;
    this.messages = [];
    this.commonService.getChatHistory(this.data?.conversationId, this.page, this.size).subscribe((res: any) => {
      const newMessages = (res?.results || []).map((item: any) => ({
        id: item.id,
        text: item.body,
        time: item.eventTime ? this.getTime(item.eventTime) : '',
        type: Number(item.senderId) === Number(this.userId) ? 'sent' : 'received',
        image: item.fileTypeId?.startsWith('image') ? item.attachmentUrl : null,
        video: item.fileTypeId?.includes('video') ? item.attachmentUrl : null,
        audio: item.fileTypeId?.includes('audio') ? item.attachmentUrl : null,
        file: (!item.fileTypeId?.includes('image') && !item.fileTypeId?.includes('audio')) ? item.attachmentUrl : null,
        msgOwner: Number(item.senderId) == Number(this.userId) ? item.receiverName : item.senderName, 
        fileName: item.fileName,
        createdAt: item.eventTime,
        isRead: item.isRead,
        isInvited: item.isInvited
      }));
      const existingIds = new Set(this.messages.map(m => m.id));
      const filteredMessages = newMessages.filter((item: any) => !existingIds.has(item.id));
      // this.messages = [...filteredMessages.reverse(), ...this.messages];
      // temporary changes
      this.messages = [...filteredMessages.reverse()];
      if (this.isFirstLoad) {
        this.scrollToBottom();
        this.isFirstLoad = false;
      }
      this.page++;
      if (newMessages.length < this.size) {
        this.hasMore = false;
      }
      this.loading = false;
      this.isUpdated = true;
    });
  }

  initials(row: any): string {
    const name = row?.userName;
    if (!name) return 'NA';
    return name.trim().substring(0, 2).toUpperCase();
  }

  sendMessage() {

    if (!this.messageText.trim()) return;

    const senderId = localStorage.getItem('dXNlcklk');
    const receiverId = this.data?.userId;
    const conversationId = this.data?.conversationId;

    let sendData = {
      'senderId': senderId,
      'receiverId': receiverId,
      'body': this.messageText,
      'isSent': 'true'
    }

    this.commonService.sendChatMessage(conversationId, sendData).subscribe({
      next: (res: any) => {
        this.messages.push({
          text: this.messageText,
          type: 'sent',
          time: this.getTime(this.currentDate),
          createdAt: this.currentDate, 
          msgOwner: this.userData.firstName + ' ' + this.userData.lastName,
          isRead: false
        });
        this.messageText = '';
      },
      error: (err) => {
        this.toastr.error('Failed to send message', 'Error');
      }
    });
  }

  getTime(dateInput: string | Date): string {
    const date = new Date(dateInput);

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  getDateLabel(dateStr: string): string {

    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString();
  }

  shouldShowDate(index: number): boolean {
    if (index === 0) return true;

    const current = new Date(this.messages[index].createdAt).toDateString();
    const prev = new Date(this.messages[index - 1].createdAt).toDateString();

    return current !== prev;
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.streamRef = stream;
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {

        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });

        const file = new File(
          [blob],
          `voice-${Date.now()}.webm`,
          { type: 'audio/webm' }
        );

        const base64Data = await this.fileToBase64(file);
        const payload = {
          senderId: this.userId,
          receiverId: this.data?.userId,
          body: '',
          isSent: true,
          attachFiles: [
            {
              fileType: file.type,
              fileName: file.name,
              base64Data: base64Data
            }
          ]
        };

        const conversationId = this.data?.conversationId;

        this.commonService.sendChatMessage(conversationId, payload).subscribe({
          next: (res: any) => {

            const audioUrl = URL.createObjectURL(blob);

            this.messages.push({
              audio: audioUrl,
              type: 'sent',
              time: this.getTime(this.currentDate),
              createdAt: this.currentDate, 
              msgOwner: this.userData.firstName + ' ' + this.userData.lastName,
              isRead: false
            });

          },
          error: (err) => {
            this.toastr.error('Audio send failed', 'Error');
          }
        });

        this.isRecording = false;
        this.stopMic();
      };

      this.mediaRecorder.start();

    } catch (err) {
      // console.error('Mic permission denied', err);
      this.isRecording = false;
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  stopMic() {
    if (this.streamRef) {
      this.streamRef.getTracks().forEach(track => track.stop());
    }
  }

  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };

      reader.onerror = error => reject(error);
    });
  }


  toggleAttachMenu() {
    this.showAttachMenu = !this.showAttachMenu;
  }

  async onFileSelected(event: any, type: 'image' | 'document' | 'video') {

    this.showAttachMenu = false;

    const file = event.target.files[0];
    if (!file) return;
    const senderId = Number(localStorage.getItem('dXNlcklk'));
    const receiverId = this.data?.userId;
    const conversationId = this.data?.conversationId;

    const base64Data = await this.fileToBase64(file);

    const payload = {
      senderId: senderId,
      receiverId: receiverId,
      body: this.messageText || '',
      isSent: true,
      attachFiles: [
        {
          fileType: file.type,
          fileName: file.name,
          base64Data: base64Data
        }
      ]
    };
    
    this.commonService.sendChatMessage(conversationId, payload).subscribe({
      next: (res: any) => {

        if (!file) return;

        const fileUrl = URL.createObjectURL(file);

        this.messages.push({
          type: 'sent',
          time: this.getTime(this.currentDate),
          createdAt: this.currentDate, 

          image: file?.type?.startsWith('image') ? fileUrl : null,
          audio: file?.type?.startsWith('audio') ? fileUrl : null,
          video: file?.type?.includes('video') ? fileUrl : null,
          file: (!file?.type?.startsWith('image') && !file?.type?.startsWith('audio')) ? fileUrl : null,
          msgOwner: this.userData.firstName + ' ' + this.userData.lastName,
          fileName: file?.name || 'File',
          isRead: false
        });

        this.messageText = '';
      },
      error: (err) => {
         this.toastr.error('Error', `Failed to send message`);
      }
    });

    event.target.value = '';
  }


  openPreview(url: string, type: 'image' | 'file', fileName?: string) {
    this.currentFileUrl = url;
    if (type === 'image') {
      this.previewData = url;
      this.previewType = 'image';
      return;
    }
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        if (blob.type === 'application/pdf') {
          this.previewData = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
          this.previewType = 'file';
        } else if (blob.type.startsWith('image')) {
          this.previewData = blobUrl;
          this.previewType = 'image';
        } else {
          this.previewData = null;
          this.previewType = null;
          this.showUnsupportedPreview = true;
        }
      },
      error: (err) => {
        // console.error('Preview failed', err);
        this.showUnsupportedPreview = true;
      }
    });
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  downloadFile() {

    if (!this.currentFileUrl) return;

    this.http.get(this.currentFileUrl, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = this.getFileName(this.currentFileUrl);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        this.showMenu = false;
      },
      error: (err) => {
        // console.error('Download failed', err);
      }
    });
  }

  getFileName(url: string): string {
    return url.split('/').pop() || 'download';
  }

  closePreview() {
    this.previewData = null;
    this.previewType = null;
  }

  zoomIn() {
    this.zoomLevel += 0.2;
  }

  zoomOut() {
    if (this.zoomLevel > 0.4) {
      this.zoomLevel -= 0.2;
    }
  }

  resetZoom() {
    this.zoomLevel = 1;
  }

  onScroll(element: HTMLElement) {

    if (element.scrollTop === 0 && !this.loading) {
      const previousHeight = element.scrollHeight;
      this.getChatHistory();
      setTimeout(() => {
        element.scrollTop = element.scrollHeight - previousHeight;
      }, 0);
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const el = this.chatBody?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 0);
  }

  getFileType(name: string): string {
    if (!name) return '';

    const ext = name.split('.').pop()?.toUpperCase();

    return ext || 'FILE';
  }

  trackByMsg(index: number, item: any) {
    return item.id || index;
  }

  getUserData() {
    this.commonService.getUserLocationById(this.userId).subscribe(res => {
      this.userData = res?.results;
    })
  }

  ngOnDestroy() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
    if (this.mqttClient) {
      this.mqttClient.end(true);
    }
  }

}