import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloorPlanComponent } from './floor-plan.component';

describe('FloorPlanComponent', () => {
  let component: FloorPlanComponent;
  let fixture: ComponentFixture<FloorPlanComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FloorPlanComponent]
    });
    fixture = TestBed.createComponent(FloorPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
