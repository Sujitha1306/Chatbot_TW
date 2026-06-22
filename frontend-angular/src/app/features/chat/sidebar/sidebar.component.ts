import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { Conversation } from '../../../shared/models/chat.model';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

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
  recommendations$: Observable<string[]>;

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
    this.recommendations$ = this.chat.recommendations$;
    
    this.filteredConvs$ = combineLatest([this.conversations$, this.searchQuery$]).pipe(
      map(([convs, query]) => {
        if (!query.trim()) return convs;
        const q = query.toLowerCase();
        return convs.filter(c => c.title.toLowerCase().includes(q));
      })
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

  fillRecommendation(rec: string) {
    this.chat.fillInput(rec);
  }

  selectConv(id: string) {
    this.chat.loadConversationMessages(id);
    this.router.navigate(['/chat', id]);
  }

  trackByConvId(_: number, c: Conversation) { return c.id; }
}
