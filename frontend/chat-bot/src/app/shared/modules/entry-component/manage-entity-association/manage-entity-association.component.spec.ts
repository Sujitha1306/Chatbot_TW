import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageEntityAssociationComponent } from './manage-entity-association.component';

describe('ManageEntityAssociationComponent', () => {
  let component: ManageEntityAssociationComponent;
  let fixture: ComponentFixture<ManageEntityAssociationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageEntityAssociationComponent]
    });
    fixture = TestBed.createComponent(ManageEntityAssociationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
