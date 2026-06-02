from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from alembic.config import Config
from alembic import command
import os

from app.routers import products, customers, orders, auth as auth_router

app = FastAPI(title="Inventory Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)


@app.on_event("startup")
def run_migrations():
    import logging
    try:
        alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
        alembic_cfg.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "..", "alembic"))
        command.upgrade(alembic_cfg, "head")
    except Exception as e:
        logging.getLogger("alembic").error("Migration failed: %s", e)


@app.get("/api/health")
def health():
    return {"status": "ok"}
