import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PwaPatientComponent } from './pwa-patient.component';

describe('PwaPatientComponent', () => {
  let component: PwaPatientComponent;
  let fixture: ComponentFixture<PwaPatientComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PwaPatientComponent]
    });
    fixture = TestBed.createComponent(PwaPatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
