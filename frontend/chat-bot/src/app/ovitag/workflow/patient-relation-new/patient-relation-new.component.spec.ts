import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRelationNewComponent } from './patient-relation-new.component';

describe('PatientRelationNewComponent', () => {
  let component: PatientRelationNewComponent;
  let fixture: ComponentFixture<PatientRelationNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientRelationNewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientRelationNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
