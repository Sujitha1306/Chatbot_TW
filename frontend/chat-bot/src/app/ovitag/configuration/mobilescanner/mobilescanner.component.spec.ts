import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobilescannerComponent } from './mobilescanner.component';

describe('MobilescannerComponent', () => {
  let component: MobilescannerComponent;
  let fixture: ComponentFixture<MobilescannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MobilescannerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MobilescannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
