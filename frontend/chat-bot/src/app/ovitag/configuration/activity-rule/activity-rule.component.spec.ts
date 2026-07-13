import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityRuleComponent } from './activity-rule.component';

describe('ActivityRuleComponent', () => {
  let component: ActivityRuleComponent;
  let fixture: ComponentFixture<ActivityRuleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActivityRuleComponent]
    });
    fixture = TestBed.createComponent(ActivityRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
