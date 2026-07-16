import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CommonService, ConfigurationService } from '../../../shared';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { AppToastService } from '../../../shared/services/toaster.service';
import { MatMenuTrigger } from '@angular/material/menu';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { connect, MqttClient } from 'mqtt';

@Component({
  selector: 'app-manage-chat-bot',
  templateUrl: './manage-chat-bot.component.html',
  styleUrls: ['./manage-chat-bot.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ManageChatBotComponent implements OnInit, OnDestroy {
  @ViewChild('imageInput') imageInput!: ElementRef;
  @ViewChild('docInput') docInput!: ElementRef;
  @ViewChild('messagesBody') messagesBody!: ElementRef;
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
  public userRequestForm: any = FormGroup;

  applyFilterValue: any;
  selectedTab: 'dm' | 'requests' = 'dm';
  showAction1 = [{ id: 'create', value: 'Create' }];
  showActions = this.showAction1;
  displayedColumns: string[] = [];
  tableData: any = [];
  permissionControl = [null];
  selectDropdown: any;
  selectedName: any = null;

  userList: any[] = [];
  allConversations: any[] = [];
  conversations: any[] = [];
  messages: any[] = [];
  activeConvId: number | null = null;
  activeConv: any = null;
  messageInput: string = '';
  searchTerm: string = '';

  currentUserId: number = parseInt(localStorage.getItem(btoa('userId')) || '0');

  isLoading = false;
  page = 0;
  size = 50;
  messagesPage = 0;
  messagesSize = 20;
  hasMoreMessages = true;
  userEnabled: boolean = false;
  isDirect: boolean = false;

  public mediaRecorder!: MediaRecorder;
  public streamRef!: MediaStream;
  public audioChunks: Blob[] = [];
  public isRecording: boolean = false;
  public showAttachMenu: boolean = false;
  public currentFileUrl: string = '';
  public previewData: any = null;
  public previewType: 'image' | 'file' | null = null;
  public showMenu: boolean = false;
  public showUnsupportedPreview: boolean = false;
  public zoomLevel = 1;
  public pollingSub!: Subscription;
  public mqttClient!: MqttClient;

  constructor(
    public datepipe: DatePipe,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    public dialog: MatDialog,
    private readonly commonService: CommonService,
    private readonly http: HttpClient,
    public sanitizer: DomSanitizer,
    public toastr: AppToastService,
    public configurationService: ConfigurationService,
    public fb: FormBuilder
  ) { }

  ngOnInit() {
    this.applyFilterValue = null;
    this.buildForm();
    this.loadConversations();
  }

  loadConversations() {
    this.isLoading = true;
    const entityType = null; // this.selectedTab === 'dm' ? 'dm' : 'request';
    this.commonService.getAllChatConversations(this.currentUserId, entityType, this.page, this.size).subscribe({
      next: (res: any) => {
        this.allConversations = (res?.results || []).map((item: any) => ({
          id: item.id,
          name: item.title || item.senderName || 'Unknown',
          title: item.title,
          lastMessage: item.lastMessage || '',
          body: item.body,
          lastMessageName: item.lastMessageName,
          lastMessageAt: item.lastMessageAt ? new Date(item.lastMessageAt) : new Date(),
          modifiedOn: item.modifiedOn,
          unreadCount: item.unreadCount || 0,
          isRequest: item.entityType === 'request',
          entityType: item.entityType,
          entityId: item.entityId,
          requestId: item.requestId,
          customerName: item.customerName,
          userName: item.userName,
          requesterName: item.requesterName,
          receiverName: item.entityType === 'dm' && item.receiverId === this.currentUserId ? 'You' : item.receiverName,
          senderName: item.senderName,
          receiverId: item.receiverId,
          senderId: item.senderId
        }));
        this.filterConversations();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  startPolling() {
    if (this.activeConvId) {
      this.loadConversations();
      this.loadMessages(this.activeConvId);
    }
  }

  connectMqtt(): void {
    const conversationId = this.activeConvId;
    if (!conversationId) return;

    if (this.mqttClient) {
      this.mqttClient.end(true);
    }

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
              clientId: 'client_chat_manage_' + Math.random().toString(16).substr(2, 8)
            };

            this.mqttClient = connect(cloudConnect);

            this.mqttClient.on('connect', () => {
              console.log('✅ ManageChatBot MQTT Connected');
              if (this.currentUserId) {
                this.mqttClient?.subscribe(`tw/chat/user/${this.currentUserId}`);
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
                console.error('ManageChatBot MQTT message parse error', e);
              }
            });

            this.mqttClient.on('error', (err) => {
              console.error('ManageChatBot MQTT error', err);
              this.startPolling();
            });
          }
        } else {
          this.startPolling();
        }
      },
      error: (err) => {
        console.error('ManageChatBot failed to get MQTT broker details', err);
        this.startPolling();
      }
    });
  }

  handleMqttMessage(item: any): void {
    if (!item) return;
    const conversationId = this.activeConvId;
    if (item.conversationId == conversationId && (item.eventType === 'NEW_MESSAGE' || item.eventType === 'MESSAGE_SENT')) {
      this.messagesPage = 0;
      this.hasMoreMessages = true;
      this.loadMessages(conversationId);
      this.loadConversations();
    }
  }

  filterConversations() {
    const search = this.searchTerm.toLowerCase().trim();

    let filtered = this.allConversations.sort((a, b) => {
      const dateA = new Date(a.lastMessageAt || a.modifiedOn).getTime();
      const dateB = new Date(b.lastMessageAt || b.modifiedOn).getTime();
      return dateB - dateA;
    });

    if (this.selectedTab === 'dm') {
      filtered = filtered.filter(c => !c.isRequest);
    } else {
      filtered = filtered.filter(c => c.isRequest);
    }

    if (search) {
      filtered = filtered.filter(c => this.getConversationSearchText(c).includes(search));
    }

    this.conversations = filtered;
  }

  onSearchChange() {
    this.filterConversations();
  }

  getConversationSearchText(conversation: any): string {
    return [
      conversation?.name,
      conversation?.title,
      conversation?.senderName,
      conversation?.receiverName,
      conversation?.customerName,
      conversation?.userName,
      conversation?.requesterName,
      conversation?.lastMessage,
      conversation?.body,
      conversation?.lastMessageName,
      conversation?.entityType,
      conversation?.entityId,
      conversation?.receiverId,
      conversation?.senderId
    ]
      .filter((value) => value !== null && value !== undefined)
      .join(' ')
      .toLowerCase();
  }

  getRequestId(conversation: any): any {
    return conversation?.title?.trim()?.charAt(0) || conversation?.entityId || conversation?.requestId || conversation?.id;
  }


  getConversationDisplayName(conversation: any): string {
    if (this.selectedTab === 'requests') {
      const requestId = this.getRequestId(conversation);
      return conversation?.title ?? `${requestId}`;
    }

    return conversation?.receiverName
      || conversation?.senderName
      || conversation?.name
      || conversation?.title
      || 'User ' + (conversation?.receiverId || conversation?.senderId || '');
  }

  selectConversation(conv: any) {
    this.activeConvId = conv.id;
    this.activeConv = conv;
    this.messagesPage = 0;
    this.messages = [];
    this.hasMoreMessages = true;
    if (conv?.unreadCount > 0) {
      const userId = Number(localStorage.getItem(btoa('userId')));
      this.commonService.markChatAsRead(conv?.id, userId).subscribe((res) => {
        if (res.statusCode == 1) {
          conv['unreadCount'] = 0;
        }
      });
    }
    this.loadMessages(conv?.id);
    this.connectMqtt();
  }

  loadMessages(convId: number) {
    if (this.isLoading || !this.hasMoreMessages) return;

    this.isLoading = true;
    this.commonService.getChatHistory(convId, this.messagesPage, this.messagesSize).subscribe({
      next: (res: any) => {
        const newMessages = (res?.results || []).map((item: any) => this.mapChatMessage(item));

        if (this.messagesPage === 0) {
          this.messages = [...newMessages.reverse()];
        } else {
          this.messages = [...newMessages.reverse(), ...this.messages];
        }

        this.messagesPage++;
        if (newMessages.length < this.messagesSize) {
          this.hasMoreMessages = false;
        }
        this.isLoading = false;
        if (this.messagesPage === 1) {
          this.scrollToBottom();
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  sendMessage() {
    if (!this.messageInput.trim() || !this.activeConv) return;
    const text = this.messageInput.trim();

    const payload: any = {
      senderId: this.currentUserId,
      body: text,
      isSent: true
    };
    const receiverId = this.getReceiverId();
    if (receiverId) {
      payload.receiverId = receiverId;
    }

    this.commonService.sendChatMessage(this.activeConvId, payload).subscribe({
      next: (res: any) => {
        this.messages.push({
          id: res?.results?.id || Date.now(),
          senderId: this.currentUserId,
          body: text,
          createdOn: new Date(),
          isRead: false,
          senderName: 'You',
          type: 'sent',
          text,
          time: this.formatTime(new Date()),
          msgOwner: 'You'
        });

        this.messageInput = '';
        this.scrollToBottom();
        this.connectMqtt();
      },
      error: () => {
        console.error('Failed to send message');
      }
    });
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    if (!this.activeConvId) return;

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
        const payload: any = {
          senderId: this.currentUserId,
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
        const receiverId = this.getReceiverId();
        if (receiverId) {
          payload.receiverId = receiverId;
        }

        this.commonService.sendChatMessage(this.activeConvId, payload).subscribe({
          next: (res: any) => {
            const audioUrl = URL.createObjectURL(blob);
            this.messages.push({
              id: res?.results?.id || Date.now(),
              senderId: this.currentUserId,
              audio: audioUrl,
              type: 'sent',
              time: this.formatTime(new Date()),
              createdOn: new Date(),
              fileName: file.name,
              msgOwner: 'You',
              isRead: false
            });
            this.scrollToBottom();
            this.connectMqtt();
          },
          error: () => {
            this.toastr.error('Audio send failed', 'Error');
          }
        });

        this.isRecording = false;
        this.stopMic();
      };

      this.mediaRecorder.start();

    } catch (err) {
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
    if (!file || !this.activeConvId) return;

    const base64Data = await this.fileToBase64(file);

    const payload: any = {
      senderId: this.currentUserId,
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
    const receiverId = this.getReceiverId();
    if (receiverId) {
      payload.receiverId = receiverId;
    }

    this.commonService.sendChatMessage(this.activeConvId, payload).subscribe({
      next: (res: any) => {
        const fileUrl = URL.createObjectURL(file);
        const isImage = file.type?.startsWith('image');
        const isAudio = file.type?.startsWith('audio');
        const isVideo = file.type?.includes('video');
        this.messages.push({
          id: res?.results?.id || Date.now(),
          senderId: this.currentUserId,
          type: 'sent',
          time: this.formatTime(new Date()),
          createdOn: new Date(),
          image: isImage ? fileUrl : null,
          audio: isAudio ? fileUrl : null,
          video: isVideo ? fileUrl : null,
          file: (!isImage && !isAudio && !isVideo) ? fileUrl : null,
          msgOwner: 'You',
          fileName: file?.name || 'File',
          isRead: false
        });
        this.scrollToBottom();
        this.connectMqtt();
      },
      error: () => {
        this.toastr.error('Error', 'Failed to send file');
      }
    });

    event.target.value = '';
  }

  openPreview(url: string, type: 'image' | 'file', fileName?: string) {
    this.currentFileUrl = url;
    this.showUnsupportedPreview = false;
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
      error: () => {
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
      error: () => { }
    });
  }

  getFileName(url: string): string {
    return url.split('/').pop() || 'download';
  }

  closePreview() {
    this.previewData = null;
    this.previewType = null;
    this.showUnsupportedPreview = false;
    this.showMenu = false;
    this.zoomLevel = 1;
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

  getFileType(name: string): string {
    if (!name) return '';
    const ext = name.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  }

  getDateLabel(dateInput: string | Date): string {
    const date = new Date(dateInput);
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

    const current = new Date(this.messages[index]?.createdOn).toDateString();
    const previous = new Date(this.messages[index - 1]?.createdOn).toDateString();

    return current !== previous;
  }

  mapChatMessage(item: any): any {
    const fileType = item.fileTypeId || '';
    const isImage = fileType.startsWith('image');
    const isAudio = fileType.includes('audio');
    const isVideo = fileType.includes('video');

    return {
      id: item.id,
      senderId: Number(item.senderId),
      body: item.body,
      createdOn: item.eventTime ? new Date(item.eventTime) : new Date(),
      isRead: item.isRead,
      senderName: item.senderName,
      receiverName: item.receiverName,
      fileTypeId: item.fileTypeId,
      attachmentUrl: item.attachmentUrl,
      fileName: item.fileName,
      type: Number(item.senderId) === Number(this.currentUserId) ? 'sent' : 'received',
      text: item.body,
      time: this.formatTime(item.eventTime),
      image: isImage ? item.attachmentUrl : null,
      video: isVideo ? item.attachmentUrl : null,
      audio: isAudio ? item.attachmentUrl : null,
      file: (!isImage && !isAudio && !isVideo) ? item.attachmentUrl : null,
      msgOwner: Number(item.senderId) === Number(this.currentUserId) ? item.receiverName : item.senderName,
      isInvited: item.isInvited
    };
  }

  isOwnMessage(msg: any): boolean {
    return msg?.type === 'sent' || Number(msg?.senderId) === Number(this.currentUserId);
  }

  isMessageRead(msg: any): boolean {
    return msg?.isRead === true;
  }

  shouldShowMessageOwner(index: number): boolean {
    const msg = this.messages[index];
    const previousMsg = this.messages[index - 1];

    return !this.isOwnMessage(msg)
      && !msg?.isInvited
      && (
        index === 0
        || this.isOwnMessage(previousMsg)
        || previousMsg?.isInvited
        || previousMsg?.msgOwner !== msg?.msgOwner
        || previousMsg?.text?.includes('were added')
      );
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesBody?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 0);
  }

  onMessagesScroll(): void {
    const el = this.messagesBody?.nativeElement;
    if (el?.scrollTop === 0 && this.activeConvId && !this.isLoading && this.hasMoreMessages) {
      const previousHeight = el.scrollHeight;
      this.loadMessages(this.activeConvId);
      setTimeout(() => {
        el.scrollTop = el.scrollHeight - previousHeight;
      }, 0);
    }
  }

  getReceiverId(): number | null {
    if (!this.activeConv) return null;

    const senderId = Number(this.activeConv.senderId);
    const receiverId = Number(this.activeConv.receiverId);

    if (senderId && senderId !== Number(this.currentUserId)) {
      return senderId;
    }

    return receiverId || null;
  }

  setActiveTab(tab: 'dm' | 'requests') {
    this.selectedTab = tab;
    this.activeConvId = null;
    this.activeConv = null;
    this.messages = [];
    this.filterConversations();
  }

  applyFilter(filterValue: string) {
    this.applyFilterValue = filterValue.trim().toLowerCase();
  }

  eventAction(event: any) {
    console.log('Event action:', event);
  }

  headerEventAction(event: any) {
    if (event.key === 'applyFilter') {
      this.applyFilter(event.data);
    } else if (event.data === 'create') {
      this.createDirectMessage('');
    } else if (event.key === 'search') {
      this.searchTerm = event.data;
      this.onSearchChange();
    } else {
      this.selectedName = null;
      this.applyFilterValue = null;
      this.refreshPage();
    }
  }

  // create(data: any) {
  //   if (this.selectedTab === 'dm') {
  //     const name = prompt('Enter user name:');
  //     if (name) {
  //       const newConv = {
  //         id: this.allConversations.length + 1,
  //         name: name,
  //         lastMessage: 'New conversation',
  //         lastMessageAt: new Date(),
  //         unreadCount: 0,
  //         isRequest: false
  //       };
  //       this.allConversations.push(newConv);
  //       this.filterConversations();
  //       this.selectConversation(newConv);
  //     }
  //   } else {
  //     const requestId = prompt('Enter request ID:');
  //     if (requestId) {
  //       const newConv = {
  //         id: this.allConversations.length + 1,
  //         name: 'Request #' + requestId,
  //         lastMessage: 'New request',
  //         lastMessageAt: new Date(),
  //         unreadCount: 0,
  //         isRequest: true
  //       };
  //       this.allConversations.push(newConv);
  //       this.filterConversations();
  //       this.selectConversation(newConv);
  //     }
  //   }
  // }

  createDirectMessage(data: any) {
    console.log(data);

  }

  refreshPage() {
    this.showActions = this.showAction1;
    this.loadConversations();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
  }

  formatTime(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  fromMsgTime(date: any): string {
    if (!date) return '';

    const d = new Date(date);
    const today = new Date();

    if (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    ) {
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()
    ) {
      return `Yesterday ${d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`;
    }

    if (d.getFullYear() === today.getFullYear()) {
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short'
      });
    }

    return d.toLocaleDateString('en-GB').replace(/\//g, '-');
  }

  directFiledClose(event: boolean) {
    if (event) {
      this.userRequestForm.reset();
      this.isDirect = false;
    }
  }

  createUserData(data: any) {
    console.log(data)
    const existingConversation = this.conversations?.find((item: any) => item.receiverId === data?.id);

    if (data && data?.id && !existingConversation) {
      const payload: any = {
        senderId: this.currentUserId,
        entityType: "dm",
        receiverId: data.id
      };
      this.isDirect = false;
      this.userRequestForm.reset();
      this.userList = [];
      this.commonService.saveChatConversation(payload).subscribe(res => {
        console.log(res)
        if (res?.statusCode === 1) {
          this.loadConversations();
        }
      })
    } else {
      this.userList = [];
      this.selectConversation(existingConversation);
      this.isDirect = false;
      this.userRequestForm.reset();
    }
  }

  searchUserNameList(event) {
    this.userEnabled = true;
    if (event.text.length >= 2) {
      this.configurationService.getUserData(event.text).subscribe(res => {
        this.userList = res.results;
      });
    }
  }

  getBindingList(id) {
    if (id) {
      const list = this as any as { id: string, firstName: string, lastName: string }[]
      const listId = list.find(obj => obj.id === id).firstName + ' ' + list.find(obj => obj.id === id).lastName;
      return listId;
    } else {
      return '';
    }
  }

  public buildForm() {
    this.userRequestForm = this.fb.group({
      userId: [null, Validators.required],
    });
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
