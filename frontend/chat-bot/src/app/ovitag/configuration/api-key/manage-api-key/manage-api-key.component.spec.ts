import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageApiKeyComponent } from './manage-api-key.component';

describe('ManageApiKeyComponent', () => {
  let component: ManageApiKeyComponent;
  let fixture: ComponentFixture<ManageApiKeyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageApiKeyComponent]
    });
    fixture = TestBed.createComponent(ManageApiKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
