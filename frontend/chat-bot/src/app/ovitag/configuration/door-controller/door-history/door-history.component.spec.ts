import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoorHistoryComponent } from './door-history.component';

describe('DoorHistoryComponent', () => {
  let component: DoorHistoryComponent;
  let fixture: ComponentFixture<DoorHistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DoorHistoryComponent]
    });
    fixture = TestBed.createComponent(DoorHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
