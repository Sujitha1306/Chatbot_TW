import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewcardViewComponent } from './newcard-view.component';

describe('NewcardViewComponent', () => {
  let component: NewcardViewComponent;
  let fixture: ComponentFixture<NewcardViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NewcardViewComponent]
    });
    fixture = TestBed.createComponent(NewcardViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
