import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitEventComponent } from './visit-event.component';

describe('VisitEventComponent', () => {
  let component: VisitEventComponent;
  let fixture: ComponentFixture<VisitEventComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisitEventComponent]
    });
    fixture = TestBed.createComponent(VisitEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
