import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LayoutSaveComponent } from './layout-save.component';

describe('LayoutSaveComponent', () => {
  let component: LayoutSaveComponent;
  let fixture: ComponentFixture<LayoutSaveComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LayoutSaveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayoutSaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
