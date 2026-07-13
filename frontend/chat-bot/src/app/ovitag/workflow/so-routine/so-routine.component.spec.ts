import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoRoutineComponent } from './so-routine.component';

describe('SoRoutineComponent', () => {
  let component: SoRoutineComponent;
  let fixture: ComponentFixture<SoRoutineComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SoRoutineComponent]
    });
    fixture = TestBed.createComponent(SoRoutineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
