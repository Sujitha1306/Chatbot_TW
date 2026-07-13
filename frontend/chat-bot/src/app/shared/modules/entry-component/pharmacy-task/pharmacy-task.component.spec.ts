import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyTaskComponent } from './pharmacy-task.component';

describe('PharmacyTaskComponent', () => {
  let component: PharmacyTaskComponent;
  let fixture: ComponentFixture<PharmacyTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PharmacyTaskComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PharmacyTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
