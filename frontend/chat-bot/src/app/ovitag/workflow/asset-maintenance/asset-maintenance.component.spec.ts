import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetMaintenanceComponent } from './asset-maintenance.component';

describe('AssetMaintenanceComponent', () => {
  let component: AssetMaintenanceComponent;
  let fixture: ComponentFixture<AssetMaintenanceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AssetMaintenanceComponent]
    });
    fixture = TestBed.createComponent(AssetMaintenanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
