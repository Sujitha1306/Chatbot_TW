import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatescannerdetailsComponent } from './createscannerdetails.component';

describe('CreatescannerdetailsComponent', () => {
  let component: CreatescannerdetailsComponent;
  let fixture: ComponentFixture<CreatescannerdetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreatescannerdetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatescannerdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
