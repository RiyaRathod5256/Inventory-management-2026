from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from decimal import Decimal
from app.database import get_db
from app.models import Order, OrderItem, Product, Customer, OrderStatus
from app.schemas import OrderCreate, OrderResponse, OrderStatusUpdate
from app.auth import get_current_user

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("", response_model=List[OrderResponse])
def list_orders(
    status: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.customer),
    )
    if status:
        q = q.filter(Order.status == status)
    if customer_id:
        q = q.filter(Order.customer_id == customer_id)
    return q.order_by(Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.customer))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(body: OrderCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    # Validate customer
    customer = db.query(Customer).filter(Customer.id == str(body.customer_id)).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if not body.items:
        raise HTTPException(status_code=422, detail="Order must have at least one item")

    # Load and validate products / stock
    insufficient = []
    product_map = {}
    for item in body.items:
        p = db.query(Product).filter(Product.id == str(item.product_id)).first()
        if not p:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if p.stock_quantity < item.quantity:
            insufficient.append(
                f"'{p.name}' (SKU: {p.sku}): requested {item.quantity}, available {p.stock_quantity}"
            )
        product_map[str(item.product_id)] = p

    if insufficient:
        raise HTTPException(
            status_code=422,
            detail="Insufficient stock for: " + "; ".join(insufficient),
        )

    # Compute total server-side
    total = Decimal("0")
    for item in body.items:
        p = product_map[str(item.product_id)]
        total += Decimal(str(p.price)) * item.quantity

    # Create order + items + deduct stock atomically
    try:
        order = Order(
            customer_id=body.customer_id,
            total_amount=total,
            notes=body.notes,
        )
        db.add(order)
        db.flush()  # get order.id before adding items

        for item in body.items:
            p = product_map[str(item.product_id)]
            oi = OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=p.price,
            )
            db.add(oi)
            p.stock_quantity -= item.quantity

        db.commit()
        db.refresh(order)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create order")

    return (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.customer))
        .filter(Order.id == order.id)
        .first()
    )


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: str, body: OrderStatusUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.customer))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    prev_status = order.status

    # Restore stock when cancelling a non-cancelled order
    if body.status == OrderStatus.cancelled and prev_status != OrderStatus.cancelled:
        try:
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.stock_quantity += item.quantity
            order.status = body.status
            db.commit()
            db.refresh(order)
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to cancel order")
    else:
        order.status = body.status
        db.commit()
        db.refresh(order)

    return (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.customer))
        .filter(Order.id == order.id)
        .first()
    )
