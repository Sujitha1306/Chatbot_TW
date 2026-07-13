import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiFloorViewerComponent } from './multi-floor-viewer.component';

describe('MultiFloorViewerComponent', () => {
  let component: MultiFloorViewerComponent;
  let fixture: ComponentFixture<MultiFloorViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiFloorViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiFloorViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
