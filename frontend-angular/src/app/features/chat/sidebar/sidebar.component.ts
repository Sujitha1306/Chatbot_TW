import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Input, Output, EventEmitter, HostBinding, HostListener } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  sidebarWidth = 256; // Default width in pixels (16rem = 256px)
  isResizing = false;

  @HostBinding('style.width') get width() {
    return this.collapsed ? '4rem' : `${this.sidebarWidth}px`;
  }

  @HostBinding('style.transition') get transition() {
    return this.isResizing ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)';
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing) return;
    let newWidth = event.clientX;
    if (newWidth < 200) newWidth = 200; // Min width 200px
    if (newWidth > 600) newWidth = 600; // Max width 600px
    this.sidebarWidth = newWidth;
    this.cdr.markForCheck();
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.isResizing) {
      this.isResizing = false;
      this.cdr.markForCheck();
    }
  }

  startResize(event: MouseEvent) {
    event.preventDefault();
    if (this.collapsed) return;
    this.isResizing = true;
  }

  conversations$: Observable<Conversation[]>;
  filteredConvs$: Observable<Conversation[]>;
  recommendations$: Observable<string[]>;

  user$: Observable<User | null>;
  searchQuery$ = new BehaviorSubject<string>('');
  
  showRecents = true;
  toggleRecents() {
    this.showRecents = !this.showRecents;
  }

  private _searchQuery = '';
  get searchQuery(): string { return this._searchQuery; }
  set searchQuery(val: string) {
    this._searchQuery = val;
    this.searchQuery$.next(val);
  }

  editingName = false;
  newName = '';
  editError = '';

  editingConvId: string | null = null;
  editConvName = '';
  showMenuConvId: string | null = null;

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

  startEditName() {
    this.editingName = true;
    this.newName = this.auth.getUser()?.name || '';
    this.editError = '';
  }

  cancelEditName() {
    this.editingName = false;
    this.editError = '';
  }

  saveName() {
    if (!this.newName.trim()) {
      this.editError = 'Name cannot be empty';
      return;
    }
    this.auth.updateName(this.newName).subscribe({
      next: () => {
        this.editingName = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.editError = err.error?.detail || 'Failed to update name';
        this.cdr.markForCheck();
      }
    });
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
    this.router.navigate(['/chat', id]);
  }

  toggleMenu(event: Event, convId: string) {
    event.stopPropagation();
    if (this.showMenuConvId === convId) {
      this.showMenuConvId = null;
    } else {
      this.showMenuConvId = convId;
    }
  }

  startEditConv(event: Event, conv: Conversation) {
    event.stopPropagation();
    this.showMenuConvId = null;
    this.editingConvId = conv.id;
    this.editConvName = conv.title;
  }

  cancelEditConv(event?: Event) {
    if (event) event.stopPropagation();
    this.editingConvId = null;
  }

  saveEditConv(event: Event, convId: string) {
    event.stopPropagation();
    if (!this.editConvName.trim()) return;
    this.chat.renameConversation(convId, this.editConvName);
    this.editingConvId = null;
  }

  deleteConv(event: Event, convId: string) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      this.chat.deleteConversation(convId);
      this.showMenuConvId = null;
    }
  }

  trackByConvId(_: number, c: Conversation) { return c.id; }
}
