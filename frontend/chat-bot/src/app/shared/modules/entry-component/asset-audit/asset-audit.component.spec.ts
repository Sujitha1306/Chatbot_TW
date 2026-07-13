import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetAuditComponent } from './asset-audit.component';

describe('AssetAuditComponent', () => {
  let component: AssetAuditComponent;
  let fixture: ComponentFixture<AssetAuditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssetAuditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetAuditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
