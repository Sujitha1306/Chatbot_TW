import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppOtNewComponent } from './app-ot-new.component';

describe('AppOtNewComponent', () => {
  let component: AppOtNewComponent;
  let fixture: ComponentFixture<AppOtNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppOtNewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppOtNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
