import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverallQueueComponent } from './overall-queue.component';

describe('OverallQueueComponent', () => {
  let component: OverallQueueComponent;
  let fixture: ComponentFixture<OverallQueueComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OverallQueueComponent]
    });
    fixture = TestBed.createComponent(OverallQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
