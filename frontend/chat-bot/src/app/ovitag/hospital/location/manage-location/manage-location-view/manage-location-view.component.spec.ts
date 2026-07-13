import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageLocationViewComponent } from './manage-location-view.component';

describe('ManageLocationViewComponent', () => {
  let component: ManageLocationViewComponent;
  let fixture: ComponentFixture<ManageLocationViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageLocationViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageLocationViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
