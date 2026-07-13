import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HazardTrackComponent } from './hazard-track.component';

describe('HazardTrackComponent', () => {
  let component: HazardTrackComponent;
  let fixture: ComponentFixture<HazardTrackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HazardTrackComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HazardTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
