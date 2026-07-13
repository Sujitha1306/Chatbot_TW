import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KynMediaReportsComponent } from './kyn-media-reports.component';

describe('KynMediaReportsComponent', () => {
  let component: KynMediaReportsComponent;
  let fixture: ComponentFixture<KynMediaReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KynMediaReportsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KynMediaReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
