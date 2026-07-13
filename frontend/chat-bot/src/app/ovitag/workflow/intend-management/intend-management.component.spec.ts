import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntendManagementComponent } from './intend-management.component';

describe('IntendManagementComponent', () => {
  let component: IntendManagementComponent;
  let fixture: ComponentFixture<IntendManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IntendManagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IntendManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
