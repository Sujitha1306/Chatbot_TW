import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AuditlogComponent } from './auditlog.component';

describe('LogComponent', () => {
  let component: AuditlogComponent;
  let fixture: ComponentFixture<AuditlogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AuditlogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
