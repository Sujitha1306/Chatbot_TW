import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ErrorlogComponent } from './errorlog.component';

describe('LogComponent', () => {
  let component: ErrorlogComponent;
  let fixture: ComponentFixture<ErrorlogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ErrorlogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
