import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreeMapComponent } from './three-map.component';

describe('ThreeMapComponent', () => {
  let component: ThreeMapComponent;
  let fixture: ComponentFixture<ThreeMapComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ThreeMapComponent]
    });
    fixture = TestBed.createComponent(ThreeMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
