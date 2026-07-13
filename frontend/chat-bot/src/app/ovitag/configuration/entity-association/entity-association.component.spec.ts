import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityAssociationComponent } from './entity-association.component';

describe('EntityAssociationComponent', () => {
  let component: EntityAssociationComponent;
  let fixture: ComponentFixture<EntityAssociationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EntityAssociationComponent]
    });
    fixture = TestBed.createComponent(EntityAssociationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
