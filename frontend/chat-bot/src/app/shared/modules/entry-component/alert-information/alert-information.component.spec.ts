import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertInformationComponent } from './alert-information.component';

describe('AlertInformationComponent', () => {
  let component: AlertInformationComponent;
  let fixture: ComponentFixture<AlertInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlertInformationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AlertInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
