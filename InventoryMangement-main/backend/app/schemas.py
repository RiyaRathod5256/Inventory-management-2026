from pydantic import BaseModel, ConfigDict, field_validator, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import uuid
from app.models import OrderStatus


# ── Products ──────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int = 0

    @field_validator("price")
    @classmethod
    def price_non_negative(cls, v):
        if v < 0:
            raise ValueError("price must be >= 0")
        return v

    @field_validator("stock_quantity")
    @classmethod
    def stock_non_negative(cls, v):
        if v < 0:
            raise ValueError("stock_quantity must be >= 0")
        return v


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sku: str
    name: str
    description: Optional[str]
    price: Decimal
    stock_quantity: int
    created_at: datetime
    updated_at: Optional[datetime]


class StockAdjustment(BaseModel):
    adjustment: int


# ── Customers ─────────────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None


class CustomerUpdate(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    created_at: datetime


# ── Orders ────────────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v):
        if v < 1:
            raise ValueError("quantity must be >= 1")
        return v


class OrderCreate(BaseModel):
    customer_id: uuid.UUID
    items: List[OrderItemCreate]
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    unit_price: Decimal
    product: Optional[ProductResponse] = None


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    customer_id: uuid.UUID
    status: OrderStatus
    total_amount: Decimal
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    customer: Optional[CustomerResponse] = None
    items: List[OrderItemResponse] = []


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# ── Auth ──────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    username: str
