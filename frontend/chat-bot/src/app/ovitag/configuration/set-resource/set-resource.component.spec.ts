import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetResourceComponent } from './set-resource.component';

describe('SetResourceComponent', () => {
  let component: SetResourceComponent;
  let fixture: ComponentFixture<SetResourceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SetResourceComponent]
    });
    fixture = TestBed.createComponent(SetResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
