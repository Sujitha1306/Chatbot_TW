import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InfantsecurityReportComponent } from './infantsecurity-report.component';

describe('InfantsecurityReportComponent', () => {
  let component: InfantsecurityReportComponent;
  let fixture: ComponentFixture<InfantsecurityReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InfantsecurityReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfantsecurityReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
