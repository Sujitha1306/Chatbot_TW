import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageOtprocedureComponent } from './manage-otprocedure.component';

describe('ManageOtprocedureComponent', () => {
  let component: ManageOtprocedureComponent;
  let fixture: ComponentFixture<ManageOtprocedureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageOtprocedureComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageOtprocedureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
