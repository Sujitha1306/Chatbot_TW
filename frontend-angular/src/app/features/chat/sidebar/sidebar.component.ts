import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { Conversation } from '../../../shared/models/chat.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const isToday = (d: Date) => {
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

const isYesterday = (d: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  conversations$: Observable<Conversation[]>;
  todayConvs$: Observable<Conversation[]>;
  yesterdayConvs$: Observable<Conversation[]>;
  user$: Observable<User | null>;
  searchQuery = '';

  constructor(
    public chat: ChatService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.conversations$ = this.chat.conversations$;
    this.todayConvs$ = this.conversations$.pipe(
      map(convs => convs.filter(c => isToday(new Date(c.created_at))))
    );
    this.yesterdayConvs$ = this.conversations$.pipe(
      map(convs => convs.filter(c => isYesterday(new Date(c.created_at))))
    );
    this.user$ = this.auth.user$;
  }

  ngOnInit() {
    this.chat.loadConversations();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  newChat() {
    this.chat.newConversation();
    this.router.navigate(['/chat']);
  }

  selectConv(id: string) {
    this.chat.loadConversationMessages(id);
    this.router.navigate(['/chat', id]);
  }

  trackByConvId(_: number, c: Conversation) { return c.id; }
}
