import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RoutineHistoryComponent } from './routine-history.component';

describe('RoutineHistoryComponent', () => {
  let component: RoutineHistoryComponent;
  let fixture: ComponentFixture<RoutineHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RoutineHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoutineHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
