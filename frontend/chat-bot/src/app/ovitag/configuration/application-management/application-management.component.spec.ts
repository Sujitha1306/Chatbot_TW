import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationManagementComponent } from './application-management.component';

describe('ApplicationManagementComponent', () => {
  let component: ApplicationManagementComponent;
  let fixture: ComponentFixture<ApplicationManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ApplicationManagementComponent]
    });
    fixture = TestBed.createComponent(ApplicationManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
