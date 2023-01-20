import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowBillInformationComponent } from './show-bill-information.component';

describe('ShowBillInformationComponent', () => {
  let component: ShowBillInformationComponent;
  let fixture: ComponentFixture<ShowBillInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShowBillInformationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowBillInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
