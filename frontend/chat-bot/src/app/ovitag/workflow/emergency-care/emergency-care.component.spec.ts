import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EmergencyCareComponent } from './emergency-care.component';

describe('EmergencyCareComponent', () => {
  let component: EmergencyCareComponent;
  let fixture: ComponentFixture<EmergencyCareComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EmergencyCareComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmergencyCareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
