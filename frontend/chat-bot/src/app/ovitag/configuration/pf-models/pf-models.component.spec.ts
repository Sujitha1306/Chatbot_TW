import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PfModelsComponent } from './pf-models.component';

describe('PfModelsComponent', () => {
  let component: PfModelsComponent;
  let fixture: ComponentFixture<PfModelsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PfModelsComponent]
    });
    fixture = TestBed.createComponent(PfModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
