import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateResourceTemplateComponent } from './create-resource-template.component';


describe('CreateResourceTempleteComponent', () => {
  let component: CreateResourceTemplateComponent;
  let fixture: ComponentFixture<CreateResourceTemplateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateResourceTemplateComponent]
    });
    fixture = TestBed.createComponent(CreateResourceTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
