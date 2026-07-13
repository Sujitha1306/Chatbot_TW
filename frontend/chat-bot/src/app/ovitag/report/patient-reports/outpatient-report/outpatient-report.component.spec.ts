import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OutpatientReportComponent } from './outpatient-report.component';

describe('OutpatientReportComponent', () => {
  let component: OutpatientReportComponent;
  let fixture: ComponentFixture<OutpatientReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OutpatientReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutpatientReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
