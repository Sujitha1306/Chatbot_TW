import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PWATaskdetailsComponent } from './pwa-taskdetails.component';

describe('PWATaskdetailsComponent', () => {
  let component: PWATaskdetailsComponent;
  let fixture: ComponentFixture<PWATaskdetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PWATaskdetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PWATaskdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
