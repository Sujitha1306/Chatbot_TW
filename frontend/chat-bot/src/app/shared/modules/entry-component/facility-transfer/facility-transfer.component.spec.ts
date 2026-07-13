import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacilityTransferComponent } from './facility-transfer.component';

describe('FacilityTransferComponent', () => {
  let component: FacilityTransferComponent;
  let fixture: ComponentFixture<FacilityTransferComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FacilityTransferComponent]
    });
    fixture = TestBed.createComponent(FacilityTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
