import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityRoutineActivityComponent } from './entity-routine-activity.component';

describe('EntityRoutineActivityComponent', () => {
  let component: EntityRoutineActivityComponent;
  let fixture: ComponentFixture<EntityRoutineActivityComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EntityRoutineActivityComponent]
    });
    fixture = TestBed.createComponent(EntityRoutineActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
