import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRelationComponent } from './patient-relation.component';

describe('PatientRelationComponent', () => {
  let component: PatientRelationComponent;
  let fixture: ComponentFixture<PatientRelationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PatientRelationComponent]
    });
    fixture = TestBed.createComponent(PatientRelationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
