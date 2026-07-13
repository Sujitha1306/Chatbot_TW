import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientWorkListQueueComponent } from './patient-worklist-queue.component';

describe('PatientQueueComponent', () => {
  let component: PatientWorkListQueueComponent;
  let fixture: ComponentFixture<PatientWorkListQueueComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PatientWorkListQueueComponent]
    });
    fixture = TestBed.createComponent(PatientWorkListQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
