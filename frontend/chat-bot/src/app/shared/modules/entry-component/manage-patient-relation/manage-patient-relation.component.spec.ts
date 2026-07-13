import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagePatientRelationComponent } from './manage-patient-relation.component';

describe('ManagePatientRelationComponent', () => {
  let component: ManagePatientRelationComponent;
  let fixture: ComponentFixture<ManagePatientRelationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManagePatientRelationComponent]
    });
    fixture = TestBed.createComponent(ManagePatientRelationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
