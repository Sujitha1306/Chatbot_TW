import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleMovementComponent } from './sample-movement.component';

describe('SampleMovementComponent', () => {
  let component: SampleMovementComponent;
  let fixture: ComponentFixture<SampleMovementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SampleMovementComponent]
    });
    fixture = TestBed.createComponent(SampleMovementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
