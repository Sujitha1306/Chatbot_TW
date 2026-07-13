import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutineManagementComponent } from './routine-management.component';

describe('RoutineManagementComponent', () => {
  let component: RoutineManagementComponent;
  let fixture: ComponentFixture<RoutineManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RoutineManagementComponent]
    });
    fixture = TestBed.createComponent(RoutineManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
