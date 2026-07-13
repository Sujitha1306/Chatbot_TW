import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelTemplateComponent } from './channel-template.component';

describe('ChannelTemplateComponent', () => {
  let component: ChannelTemplateComponent;
  let fixture: ComponentFixture<ChannelTemplateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChannelTemplateComponent]
    });
    fixture = TestBed.createComponent(ChannelTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
