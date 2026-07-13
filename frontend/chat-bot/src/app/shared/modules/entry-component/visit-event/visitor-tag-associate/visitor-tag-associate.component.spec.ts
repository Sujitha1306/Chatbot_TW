import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorTagAssociateComponent } from './visitor-tag-associate.component';

describe('VisitorTagAssociateComponent', () => {
  let component: VisitorTagAssociateComponent;
  let fixture: ComponentFixture<VisitorTagAssociateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisitorTagAssociateComponent]
    });
    fixture = TestBed.createComponent(VisitorTagAssociateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
