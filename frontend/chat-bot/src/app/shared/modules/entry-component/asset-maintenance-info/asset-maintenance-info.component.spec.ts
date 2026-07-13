import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetMaintenanceInfoComponent } from './asset-maintenance-info.component';

describe('AssetMaintenanceInfoComponent', () => {
  let component: AssetMaintenanceInfoComponent;
  let fixture: ComponentFixture<AssetMaintenanceInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AssetMaintenanceInfoComponent]
    });
    fixture = TestBed.createComponent(AssetMaintenanceInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
