import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollTokenComponent } from './enroll-token.component';

describe('EnrollTokenComponent', () => {
  let component: EnrollTokenComponent;
  let fixture: ComponentFixture<EnrollTokenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnrollTokenComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnrollTokenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
