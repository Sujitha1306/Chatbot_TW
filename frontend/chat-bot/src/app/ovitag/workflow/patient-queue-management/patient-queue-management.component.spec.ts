import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientQueueManagementComponent } from './patient-queue-management.component';

describe('PatientQueueManagementComponent', () => {
  let component: PatientQueueManagementComponent;
  let fixture: ComponentFixture<PatientQueueManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PatientQueueManagementComponent]
    });
    fixture = TestBed.createComponent(PatientQueueManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
