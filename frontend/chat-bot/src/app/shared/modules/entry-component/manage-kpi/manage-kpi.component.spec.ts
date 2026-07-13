import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageKpiComponent } from './manage-kpi.component';

describe('ManageKpiComponent', () => {
  let component: ManageKpiComponent;
  let fixture: ComponentFixture<ManageKpiComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageKpiComponent]
    });
    fixture = TestBed.createComponent(ManageKpiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
