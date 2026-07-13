import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagePwaTaskComponent } from './manage-pwa-task.component';

describe('ManagePwaTaskComponent', () => {
  let component: ManagePwaTaskComponent;
  let fixture: ComponentFixture<ManagePwaTaskComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManagePwaTaskComponent]
    });
    fixture = TestBed.createComponent(ManagePwaTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
