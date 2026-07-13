import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MusteringHistoryComponent } from './mustering-history.component';

describe('MusteringHistoryComponent', () => {
  let component: MusteringHistoryComponent;
  let fixture: ComponentFixture<MusteringHistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MusteringHistoryComponent]
    });
    fixture = TestBed.createComponent(MusteringHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
