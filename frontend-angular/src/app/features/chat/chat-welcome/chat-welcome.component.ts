import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { FacilityFilterComponent } from '../facility-filter/facility-filter.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-welcome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-welcome.component.html',
  styleUrls: ['./chat-welcome.component.scss']
})
export class ChatWelcomeComponent implements OnInit, OnDestroy {
  suggestions = [
    { icon: 'bar_chart', title: 'Porter Performance',  subtitle: 'Show porter performance by facility',          query: 'Show porter performance by facility' },
    { icon: 'show_chart',  title: 'Assets Dashboard',    subtitle: 'Display active assets by department',         query: 'Display active assets by department' },
    { icon: 'schedule',       title: 'TAT Analysis',        subtitle: 'Which porter had the minimum TAT last month?',query: 'Which porter had the minimum TAT last month?' },
    { icon: 'security',      title: 'Warranty Status',     subtitle: 'Which assets have warranty expiring next 30 days?', query: 'Which assets have warranty expiring in next 30 days?' },
  ];
  inputValue = '';
  private sub?: Subscription;

  constructor(private chat: ChatService, private router: Router, private cdr: ChangeDetectorRef) {}

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
  
  send() { 
    const q = this.inputValue.trim();
    if (!q) return;
    const convId = this.chat.startConversation(q);
    this.router.navigate(['/chat', convId]);
  }
}
