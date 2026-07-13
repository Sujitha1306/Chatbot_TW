import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageConfigComponent } from './manage-config.component';

describe('ManageConfigComponent', () => {
  let component: ManageConfigComponent;
  let fixture: ComponentFixture<ManageConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageConfigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
