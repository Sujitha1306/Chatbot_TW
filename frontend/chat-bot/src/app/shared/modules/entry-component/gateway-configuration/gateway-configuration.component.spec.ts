import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GatewayConfigurationComponent } from './gateway-configuration.component';

describe('GatewayConfigurationComponent', () => {
  let component: GatewayConfigurationComponent;
  let fixture: ComponentFixture<GatewayConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GatewayConfigurationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GatewayConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
