import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarcodeInput } from './barcode-input';

describe('BarcodeInput', () => {
  let component: BarcodeInput;
  let fixture: ComponentFixture<BarcodeInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarcodeInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarcodeInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
