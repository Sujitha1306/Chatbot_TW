import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRelationManagementComponent } from './patient-relation-management.component';

describe('PatientRelationManagementComponent', () => {
  let component: PatientRelationManagementComponent;
  let fixture: ComponentFixture<PatientRelationManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PatientRelationManagementComponent]
    });
    fixture = TestBed.createComponent(PatientRelationManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
