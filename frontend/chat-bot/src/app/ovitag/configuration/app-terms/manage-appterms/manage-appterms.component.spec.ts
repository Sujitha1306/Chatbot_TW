import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageApptermsComponent } from './manage-appterms.component';

describe('ManageApptermsComponent', () => {
  let component: ManageApptermsComponent;
  let fixture: ComponentFixture<ManageApptermsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageApptermsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageApptermsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
