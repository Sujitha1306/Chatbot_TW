import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DaycareReportComponent } from './daycare-report.component';

describe('DaycareReportComponent', () => {
  let component: DaycareReportComponent;
  let fixture: ComponentFixture<DaycareReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DaycareReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DaycareReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
