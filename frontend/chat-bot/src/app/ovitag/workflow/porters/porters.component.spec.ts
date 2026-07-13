import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortersComponent } from './porters.component';

describe('PortersComponent', () => {
  let component: PortersComponent;
  let fixture: ComponentFixture<PortersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PortersComponent]
    });
    fixture = TestBed.createComponent(PortersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
