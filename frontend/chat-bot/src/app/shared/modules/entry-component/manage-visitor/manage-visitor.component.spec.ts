import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageVisitorComponent } from './manage-visitor.component';

describe('ManageVisitorComponent', () => {
  let component: ManageVisitorComponent;
  let fixture: ComponentFixture<ManageVisitorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageVisitorComponent]
    });
    fixture = TestBed.createComponent(ManageVisitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
