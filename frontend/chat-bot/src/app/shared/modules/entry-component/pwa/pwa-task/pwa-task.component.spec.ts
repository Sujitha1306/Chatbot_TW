import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PwaTaskComponent } from './pwa-task.component';

describe('PwaContainerComponent', () => {
  let component: PwaTaskComponent;
  let fixture: ComponentFixture<PwaTaskComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PwaTaskComponent]
    });
    fixture = TestBed.createComponent(PwaTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
