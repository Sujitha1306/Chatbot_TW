import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PwaRequestComponent } from './pwa-request.component';

describe('PwaRequestComponent', () => {
  let component: PwaRequestComponent;
  let fixture: ComponentFixture<PwaRequestComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PwaRequestComponent]
    });
    fixture = TestBed.createComponent(PwaRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
