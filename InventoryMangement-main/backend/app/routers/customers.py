from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.models import Customer, Order
from app.schemas import CustomerCreate, CustomerUpdate, CustomerResponse, OrderResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("", response_model=List[CustomerResponse])
def list_customers(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Customer)
    if search:
        q = q.filter(
            or_(
                Customer.email.ilike(f"%{search}%"),
                Customer.first_name.ilike(f"%{search}%"),
                Customer.last_name.ilike(f"%{search}%"),
            )
        )
    return q.all()


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return c


@router.get("/{customer_id}/orders", response_model=List[OrderResponse])
def get_customer_orders(customer_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    orders = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload("product"), joinedload(Order.customer))
        .filter(Order.customer_id == customer_id)
        .all()
    )
    return orders


@router.post("", response_model=CustomerResponse, status_code=201)
def create_customer(body: CustomerCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if db.query(Customer).filter(Customer.email == body.email).first():
        raise HTTPException(status_code=409, detail=f"Customer with email '{body.email}' already exists")
    c = Customer(**body.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: str, body: CustomerUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    updates = body.model_dump(exclude_unset=True)
    if "email" in updates and updates["email"] != c.email:
        if db.query(Customer).filter(Customer.email == updates["email"]).first():
            raise HTTPException(status_code=409, detail=f"Customer with email '{updates['email']}' already exists")
    for k, v in updates.items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{customer_id}", status_code=204)
def delete_customer(customer_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    if db.query(Order).filter(Order.customer_id == customer_id).first():
        raise HTTPException(status_code=409, detail="Cannot delete customer that has existing orders")
    db.delete(c)
    db.commit()
