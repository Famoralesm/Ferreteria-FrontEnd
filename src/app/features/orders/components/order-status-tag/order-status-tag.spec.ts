import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderStatusTag } from './order-status-tag';

describe('OrderStatusTag', () => {
  let component: OrderStatusTag;
  let fixture: ComponentFixture<OrderStatusTag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderStatusTag]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderStatusTag);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
