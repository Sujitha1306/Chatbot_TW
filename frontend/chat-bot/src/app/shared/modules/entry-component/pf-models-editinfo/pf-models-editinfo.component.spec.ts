import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PfModelsEditinfoComponent } from './pf-models-editinfo.component';

describe('PfModelsEditinfoComponent', () => {
  let component: PfModelsEditinfoComponent;
  let fixture: ComponentFixture<PfModelsEditinfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PfModelsEditinfoComponent]
    });
    fixture = TestBed.createComponent(PfModelsEditinfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
