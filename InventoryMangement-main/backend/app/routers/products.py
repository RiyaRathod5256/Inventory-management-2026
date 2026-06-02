from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.models import Product, OrderItem
from app.schemas import ProductCreate, ProductUpdate, ProductResponse, StockAdjustment
from app.auth import get_current_user

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=List[ProductResponse])
def list_products(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Product)
    if search:
        q = q.filter(or_(Product.name.ilike(f"%{search}%"), Product.sku.ilike(f"%{search}%")))
    return q.offset(skip).limit(limit).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@router.post("", response_model=ProductResponse, status_code=201)
def create_product(body: ProductCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if db.query(Product).filter(Product.sku == body.sku).first():
        raise HTTPException(status_code=409, detail=f"Product with SKU '{body.sku}' already exists")
    p = Product(**body.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, body: ProductUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    updates = body.model_dump(exclude_unset=True)
    if "sku" in updates and updates["sku"] != p.sku:
        if db.query(Product).filter(Product.sku == updates["sku"]).first():
            raise HTTPException(status_code=409, detail=f"Product with SKU '{updates['sku']}' already exists")
    for k, v in updates.items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    if db.query(OrderItem).filter(OrderItem.product_id == product_id).first():
        raise HTTPException(status_code=409, detail="Cannot delete product that has existing order items")
    db.delete(p)
    db.commit()


@router.patch("/{product_id}/stock", response_model=ProductResponse)
def adjust_stock(product_id: str, body: StockAdjustment, db: Session = Depends(get_db), _=Depends(get_current_user)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    new_qty = p.stock_quantity + body.adjustment
    if new_qty < 0:
        raise HTTPException(status_code=422, detail=f"Adjustment would result in negative stock ({new_qty})")
    p.stock_quantity = new_qty
    db.commit()
    db.refresh(p)
    return p
