import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateRoutineTemplateComponent } from './create-routine-template.component';

describe('CreateRoutineTemplateComponent', () => {
  let component: CreateRoutineTemplateComponent;
  let fixture: ComponentFixture<CreateRoutineTemplateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateRoutineTemplateComponent]
    });
    fixture = TestBed.createComponent(CreateRoutineTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
