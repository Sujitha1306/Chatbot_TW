import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef, Optional } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { ChatService } from '../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-welcome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-welcome.component.html',
  styleUrls: ['./chat-welcome.component.scss']
})
export class ChatWelcomeComponent implements OnInit, OnDestroy {
  stats = [
    { icon: 'description', value: '1,982,227', label: 'Total Requests', trend: 'All time', color: 'blue' },
    { icon: 'check_circle_outline', value: '1,743,981', label: 'Completed Requests', trend: 'All time', color: 'green' },
    { icon: 'trending_up', value: '87.98%', label: 'Completion Rate', trend: 'All time', color: 'purple' },
    { icon: 'schedule', value: '28 mins', label: 'Average TAT', trend: 'All time', color: 'orange' }
  ];

  suggestions = [
    { icon: 'bar_chart', title: 'Porter Performance',  subtitle: 'Show porter performance by facility',          query: 'Show porter performance by facility' },
    { icon: 'show_chart',  title: 'Assets Dashboard',    subtitle: 'Display active assets by department',         query: 'Display active assets by department' },
    { icon: 'schedule',       title: 'TAT Analysis',        subtitle: 'Which porter had the minimum TAT last month?',query: 'Which porter had the minimum TAT last month?' },
    { icon: 'security',      title: 'Warranty Status',     subtitle: 'Which assets have warranty expiring next 30 days?', query: 'Which assets have warranty expiring in next 30 days?' },
  ];
  inputValue = '';
  showThread = false;
  activeConversationId?: string;
  sidebarCollapsed = false;
  private sub?: Subscription;

  constructor(
    private chat: ChatService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    @Optional() public dialogRef: MatDialogRef<ChatWelcomeComponent>
  ) {}

  ngOnInit() {
    this.sub = this.chat.fillInput$.subscribe(val => {
      if (val) {
        this.inputValue = val;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  selectSuggestion(query: string) { 
    this.inputValue = query; 
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }
  closePopup() {
    this.dialogRef?.close();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.cdr.markForCheck();
  }

  onSidebarSelectConversation(convId: string) {
    this.activeConversationId = convId;
    this.showThread = true;
    this.cdr.markForCheck();
  }

  onSidebarNewConversation() {
    this.activeConversationId = undefined;
    this.showThread = false;
    this.inputValue = '';
    this.cdr.markForCheck();
  }
  
  send() {
    const q = this.inputValue.trim();
    if (!q) return;
    const convId = this.chat.startConversation(q);
    if(this.dialogRef) {
      this.activeConversationId = convId;
      this.showThread = true;
      this.cdr.markForCheck();
    } else {
      this.router.navigate(['./', convId], { relativeTo: this.route });
    }
  }
}
