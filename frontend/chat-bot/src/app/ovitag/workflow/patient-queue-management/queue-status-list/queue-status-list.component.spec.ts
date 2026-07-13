import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueueStatusListComponent } from './queue-status-list.component';

describe('QueueStatusListComponent', () => {
  let component: QueueStatusListComponent;
  let fixture: ComponentFixture<QueueStatusListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QueueStatusListComponent]
    });
    fixture = TestBed.createComponent(QueueStatusListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
