import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiComponent } from './ai.component';

describe('AiComponent', () => {
  let component: AiComponent;
  let fixture: ComponentFixture<AiComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AiComponent]
    });
    fixture = TestBed.createComponent(AiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
