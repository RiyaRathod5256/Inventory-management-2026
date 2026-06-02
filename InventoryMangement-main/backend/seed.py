"""
Seed script — run after the stack is up:
  docker compose exec backend python seed.py
"""
import os
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, Product, Customer

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()


def seed():
    # Products
    products = [
        Product(id=uuid.uuid4(), sku="LAPTOP-001", name="Pro Laptop 15\"", description="High-performance laptop", price=1299.99, stock_quantity=25),
        Product(id=uuid.uuid4(), sku="MOUSE-001", name="Wireless Mouse", description="Ergonomic wireless mouse", price=39.99, stock_quantity=120),
        Product(id=uuid.uuid4(), sku="KB-001", name="Mechanical Keyboard", description="Tactile mechanical keyboard", price=89.99, stock_quantity=60),
        Product(id=uuid.uuid4(), sku="MON-001", name="4K Monitor 27\"", description="Ultra HD IPS display", price=549.99, stock_quantity=15),
        Product(id=uuid.uuid4(), sku="USB-HUB-001", name="USB-C Hub 7-in-1", description="Multiport USB-C hub", price=49.99, stock_quantity=80),
        Product(id=uuid.uuid4(), sku="HDMI-001", name="HDMI Cable 2m", description="4K HDMI 2.0 cable", price=12.99, stock_quantity=200),
        Product(id=uuid.uuid4(), sku="WEBCAM-001", name="HD Webcam 1080p", description="Full HD webcam with mic", price=69.99, stock_quantity=45),
        Product(id=uuid.uuid4(), sku="HEADSET-001", name="Noise-Cancelling Headset", description="Over-ear Bluetooth headset", price=149.99, stock_quantity=8),
    ]

    # Customers
    customers = [
        Customer(id=uuid.uuid4(), email="alice@example.com", first_name="Alice", last_name="Johnson", phone="+1-555-0101"),
        Customer(id=uuid.uuid4(), email="bob@example.com", first_name="Bob", last_name="Smith", phone="+1-555-0102"),
        Customer(id=uuid.uuid4(), email="carol@example.com", first_name="Carol", last_name="Williams", phone="+1-555-0103"),
        Customer(id=uuid.uuid4(), email="dave@example.com", first_name="Dave", last_name="Brown", phone=None),
    ]

    for p in products:
        if not db.query(Product).filter(Product.sku == p.sku).first():
            db.add(p)

    for c in customers:
        if not db.query(Customer).filter(Customer.email == c.email).first():
            db.add(c)

    db.commit()
    print(f"Seeded {len(products)} products and {len(customers)} customers.")


if __name__ == "__main__":
    seed()
