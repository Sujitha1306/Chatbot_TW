import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicCreateAlertConfigComponent } from './dynamic-create-alert-config.component';

describe('DynamicCreateAlertConfigComponent', () => {
  let component: DynamicCreateAlertConfigComponent;
  let fixture: ComponentFixture<DynamicCreateAlertConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DynamicCreateAlertConfigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicCreateAlertConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
