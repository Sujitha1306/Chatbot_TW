import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleMapComponent } from './multiple-map.component';

describe('MultipleMapComponent', () => {
  let component: MultipleMapComponent;
  let fixture: ComponentFixture<MultipleMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultipleMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultipleMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
