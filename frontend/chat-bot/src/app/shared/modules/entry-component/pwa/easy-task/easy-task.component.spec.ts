import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EasyTaskComponent } from './easy-task.component';

describe('EasyTaskComponent', () => {
  let component: EasyTaskComponent;
  let fixture: ComponentFixture<EasyTaskComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EasyTaskComponent]
    });
    fixture = TestBed.createComponent(EasyTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
