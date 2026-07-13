import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageLocationLeafletComponent } from './manage-location-leaflet.component';

describe('ManageLocationLeafletComponent', () => {
  let component: ManageLocationLeafletComponent;
  let fixture: ComponentFixture<ManageLocationLeafletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageLocationLeafletComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageLocationLeafletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
