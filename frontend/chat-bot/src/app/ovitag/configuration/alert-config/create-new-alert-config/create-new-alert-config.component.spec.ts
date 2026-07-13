import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewAlertConfigComponent } from './create-new-alert-config.component';

describe('CreateNewAlertConfigComponent', () => {
  let component: CreateNewAlertConfigComponent;
  let fixture: ComponentFixture<CreateNewAlertConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateNewAlertConfigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewAlertConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
