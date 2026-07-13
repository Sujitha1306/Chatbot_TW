import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NursecallViewComponent } from './nursecall-view.component';

describe('NursecallViewComponent', () => {
  let component: NursecallViewComponent;
  let fixture: ComponentFixture<NursecallViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NursecallViewComponent]
    });
    fixture = TestBed.createComponent(NursecallViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
