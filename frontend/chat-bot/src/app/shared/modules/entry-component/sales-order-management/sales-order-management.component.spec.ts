import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesOrderManagementComponent } from './sales-order-management.component';

describe('SalesOrderManagementComponent', () => {
  let component: SalesOrderManagementComponent;
  let fixture: ComponentFixture<SalesOrderManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SalesOrderManagementComponent]
    });
    fixture = TestBed.createComponent(SalesOrderManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
