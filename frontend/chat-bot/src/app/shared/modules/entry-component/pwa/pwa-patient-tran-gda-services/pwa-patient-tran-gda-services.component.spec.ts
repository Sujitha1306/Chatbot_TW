import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PwaPatientTranGDAServicesComponent } from './pwa-patient-tran-gda-services.component';

describe('PwaPatientTranGDAServicesComponent', () => {
  let component: PwaPatientTranGDAServicesComponent;
  let fixture: ComponentFixture<PwaPatientTranGDAServicesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PwaPatientTranGDAServicesComponent]
    });
    fixture = TestBed.createComponent(PwaPatientTranGDAServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
