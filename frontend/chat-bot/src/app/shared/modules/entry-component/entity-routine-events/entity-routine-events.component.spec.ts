import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityRoutineEventsComponent } from './entity-routine-events.component';

describe('EntityRoutineEventsComponent', () => {
  let component: EntityRoutineEventsComponent;
  let fixture: ComponentFixture<EntityRoutineEventsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EntityRoutineEventsComponent]
    });
    fixture = TestBed.createComponent(EntityRoutineEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
