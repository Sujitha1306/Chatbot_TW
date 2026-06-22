import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { Conversation } from '../../../shared/models/chat.model';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

const parseDate = (d: string | Date) => {
  if (d instanceof Date) return d;
  if (!d) return new Date();
  
  let ds = typeof d === 'string' ? d.replace(' ', 'T') : String(d);
  
  if (!ds.endsWith('Z') && !ds.includes('+') && !ds.match(/-\d\d:\d\d$/)) {
    ds += 'Z';
  }
  
  const parsed = new Date(ds);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

const isToday = (dateStr: string | Date) => {
  const d = parseDate(dateStr);
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

const isYesterday = (dateStr: string | Date) => {
  const d = parseDate(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
};

const isOlder = (dateStr: string | Date) => {
  return !isToday(dateStr) && !isYesterday(dateStr);
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
  filteredConvs$: Observable<Conversation[]>;
  todayConvs$: Observable<Conversation[]>;
  yesterdayConvs$: Observable<Conversation[]>;
  olderConvs$: Observable<Conversation[]>;
  user$: Observable<User | null>;
  searchQuery$ = new BehaviorSubject<string>('');
  
  private _searchQuery = '';
  get searchQuery(): string { return this._searchQuery; }
  set searchQuery(val: string) {
    this._searchQuery = val;
    this.searchQuery$.next(val);
  }

  constructor(
    public chat: ChatService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.conversations$ = this.chat.conversations$;
    
    this.filteredConvs$ = combineLatest([this.conversations$, this.searchQuery$]).pipe(
      map(([convs, query]) => {
        if (!query.trim()) return convs;
        const q = query.toLowerCase();
        return convs.filter(c => c.title.toLowerCase().includes(q));
      })
    );

    this.todayConvs$ = this.filteredConvs$.pipe(
      map(convs => convs.filter(c => isToday(c.created_at)))
    );
    this.yesterdayConvs$ = this.filteredConvs$.pipe(
      map(convs => convs.filter(c => isYesterday(c.created_at)))
    );
    this.olderConvs$ = this.filteredConvs$.pipe(
      map(convs => convs.filter(c => isOlder(c.created_at)))
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
