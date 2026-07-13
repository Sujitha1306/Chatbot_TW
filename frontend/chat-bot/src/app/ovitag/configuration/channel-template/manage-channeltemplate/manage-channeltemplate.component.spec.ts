import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageChanneltemplateComponent } from './manage-channeltemplate.component';

describe('ManageChanneltemplateComponent', () => {
  let component: ManageChanneltemplateComponent;
  let fixture: ComponentFixture<ManageChanneltemplateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageChanneltemplateComponent]
    });
    fixture = TestBed.createComponent(ManageChanneltemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
