import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinenTrackingComponent } from './linen-tracking.component';

describe('LinenTrackingComponent', () => {
  let component: LinenTrackingComponent;
  let fixture: ComponentFixture<LinenTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LinenTrackingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LinenTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
