import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleDirectionsComponent } from './google-directions.component';

describe('GoogleDirectionsComponent', () => {
  let component: GoogleDirectionsComponent;
  let fixture: ComponentFixture<GoogleDirectionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GoogleDirectionsComponent]
    });
    fixture = TestBed.createComponent(GoogleDirectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
