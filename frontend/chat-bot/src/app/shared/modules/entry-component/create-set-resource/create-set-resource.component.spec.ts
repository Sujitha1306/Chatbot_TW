import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSetResourceComponent } from './create-set-resource.component';

describe('CreateSetResourceComponent', () => {
  let component: CreateSetResourceComponent;
  let fixture: ComponentFixture<CreateSetResourceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateSetResourceComponent]
    });
    fixture = TestBed.createComponent(CreateSetResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
