import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditScheduleManagementComponent } from './audit-schedule-management.component';

describe('AuditScheduleManagementComponent', () => {
  let component: AuditScheduleManagementComponent;
  let fixture: ComponentFixture<AuditScheduleManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AuditScheduleManagementComponent]
    });
    fixture = TestBed.createComponent(AuditScheduleManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
