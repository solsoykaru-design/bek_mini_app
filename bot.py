#!/usr/bin/env python3
"""
╔═══════════════════════════════════════════════════════════════════════════════╗
║  FOODCHAIN — ПОЛНАЯ ЭКОСИСТЕМА РЕСТОРАННОЙ СЕТИ                              ║
║  Бэкенд: FastAPI + aiogram 3.x + SQLAlchemy + Redis + Celery + WebSocket     ║
║  Единый файл: bot.py                                                         ║
║                                                                               ║
║  Запуск:                                                                      ║
║    1. Установите зависимости: pip install -r requirements.txt                 ║
║    2. Настройте .env файл (см. КОНФИГУРАЦИЯ ниже)                            ║
║    3. Запустите: python bot.py                                                ║
║                                                                               ║
║  Или через Docker:                                                            ║
║    docker-compose up --build                                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import json
import csv
import io
import hashlib
import hmac
import secrets
import asyncio
import logging
import re
from datetime import datetime, timedelta, date
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Dict, Any, Set
from contextlib import asynccontextmanager
from pathlib import Path
from functools import wraps
from dataclasses import dataclass, field

# ============================================================================
#                              КОНФИГУРАЦИЯ
# ============================================================================

class Config:
    """
    Все настройки приложения. В продакшене загружаются из .env
    """
    # === Telegram ===
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "8986951654:AAEw6EGQFaavsjQuwVP_hFgCaCGEjbqY53M")
    WEBAPP_URL_GUEST: str = os.getenv("WEBAPP_URL_GUEST", "https://solsoykaru-design.github.io/mini_bot/")
    WEBAPP_URL_ADMIN: str = os.getenv("WEBAPP_URL_ADMIN", "https://solsoykaru-design.github.io/mini_bot/")

    # === База данных ===
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://foodchain:foodchain@localhost:5432/foodchain")
    DATABASE_URL_SYNC: str = os.getenv("DATABASE_URL_SYNC", "postgresql://foodchain:foodchain@localhost:5432/foodchain")

    # === Redis ===
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # === Платежи ===
    YUKASSA_SHOP_ID: str = os.getenv("YUKASSA_SHOP_ID", "test_shop_id")
    YUKASSA_SECRET_KEY: str = os.getenv("YUKASSA_SECRET_KEY", "test_secret_key")
    TINKOFF_TERMINAL_KEY: str = os.getenv("TINKOFF_TERMINAL_KEY", "test_terminal")
    TINKOFF_SECRET_KEY: str = os.getenv("TINKOFF_SECRET_KEY", "test_secret")

    # === Яндекс.Карты ===
    YANDEX_MAPS_API_KEY: str = os.getenv("YANDEX_MAPS_API_KEY", "test_yandex_key")

    # === S3 / MinIO ===
    S3_ENDPOINT: str = os.getenv("S3_ENDPOINT", "http://localhost:9000")
    S3_ACCESS_KEY: str = os.getenv("S3_ACCESS_KEY", "minioadmin")
    S3_SECRET_KEY: str = os.getenv("S3_SECRET_KEY", "minioadmin")
    S3_BUCKET: str = os.getenv("S3_BUCKET", "foodchain")

    # === Безопасность ===
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_hex(32))
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 30

    # === Celery ===
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

    # === Приложение ===
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    BACKUP_DIR: str = os.getenv("BACKUP_DIR", "./backups")
    NETWORK_NAME: str = os.getenv("NETWORK_NAME", "FoodChain")

config = Config()

# ============================================================================
#                         ЛОГИРОВАНИЕ
# ============================================================================

logging.basicConfig(
    level=logging.DEBUG if config.DEBUG else logging.INFO,
    format="%(asctime)s | %(name)-20s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("foodchain")


# ============================================================================
#                    МОДЕЛИ БАЗЫ ДАННЫХ (SQLAlchemy 2.0)
# ============================================================================
# В реальном проекте используйте Alembic для миграций

try:
    from sqlalchemy import (
        Column, Integer, BigInteger, String, Text, Float, Boolean, DateTime,
        ForeignKey, Numeric, JSON, Enum as SAEnum, Date, Time, UniqueConstraint,
        Index, CheckConstraint, Table, func, select, update, delete, and_, or_
    )
    from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False
    logger.warning("SQLAlchemy не установлен. Используется in-memory хранилище.")


# --- Enum типы ---
class UserRoleEnum(str, Enum):
    GUEST = "guest"
    SUPERADMIN = "superadmin"
    OWNER = "owner"
    MANAGER = "manager"
    CHEF = "chef"
    WAITER = "waiter"
    COURIER = "courier"
    ACCOUNTANT = "accountant"
    ANALYST = "analyst"

class OrderTypeEnum(str, Enum):
    DELIVERY = "delivery"
    PICKUP = "pickup"
    DINE_IN = "dine_in"

class OrderStatusEnum(str, Enum):
    NEW = "new"
    ACCEPTED = "accepted"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERING = "delivering"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentMethodEnum(str, Enum):
    TELEGRAM_STARS = "telegram_stars"
    YUKASSA = "yukassa"
    TINKOFF = "tinkoff"
    CASH = "cash"
    CARD = "card"

class BookingStatusEnum(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class TableStatusEnum(str, Enum):
    FREE = "free"
    RESERVED = "reserved"
    OCCUPIED = "occupied"

class LoyaltyLevelEnum(str, Enum):
    NEWBIE = "newbie"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"

class PromoTypeEnum(str, Enum):
    PERCENT = "percent"
    FIXED = "fixed"

class CampaignStatusEnum(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"

class PurchaseOrderStatusEnum(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


if HAS_SQLALCHEMY:
    class Base(DeclarativeBase):
        pass

    # ==================== ПОЛЬЗОВАТЕЛЬ ====================
    class User(Base):
        __tablename__ = "users"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False, index=True)
        username: Mapped[Optional[str]] = mapped_column(String(100))
        first_name: Mapped[str] = mapped_column(String(100), nullable=False)
        last_name: Mapped[Optional[str]] = mapped_column(String(100))
        phone: Mapped[Optional[str]] = mapped_column(String(20))
        email: Mapped[Optional[str]] = mapped_column(String(200))
        role: Mapped[str] = mapped_column(String(20), default=UserRoleEnum.GUEST.value)
        branch_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("branches.id"))
        avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
        loyalty_level: Mapped[str] = mapped_column(String(20), default=LoyaltyLevelEnum.NEWBIE.value)
        bonus_balance: Mapped[float] = mapped_column(Float, default=0.0)
        total_spent: Mapped[float] = mapped_column(Float, default=0.0)
        referral_code: Mapped[str] = mapped_column(String(20), unique=True)
        referred_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
        birthday: Mapped[Optional[date]] = mapped_column(Date)
        is_active: Mapped[bool] = mapped_column(Boolean, default=True)
        is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)
        login_attempts: Mapped[int] = mapped_column(Integer, default=0)
        locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime)
        two_fa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
        two_fa_code: Mapped[Optional[str]] = mapped_column(String(10))
        two_fa_expires: Mapped[Optional[datetime]] = mapped_column(DateTime)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
        updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

        # Relationships
        orders = relationship("Order", back_populates="user", foreign_keys="Order.user_id")
        bookings = relationship("Booking", back_populates="user")
        reviews = relationship("Review", back_populates="user")
        favorites = relationship("FavoriteDish", back_populates="user")

    # ==================== ФИЛИАЛ ====================
    class Branch(Base):
        __tablename__ = "branches"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        name: Mapped[str] = mapped_column(String(200), nullable=False)
        address: Mapped[str] = mapped_column(String(500), nullable=False)
        phone: Mapped[Optional[str]] = mapped_column(String(20))
        latitude: Mapped[Optional[float]] = mapped_column(Float)
        longitude: Mapped[Optional[float]] = mapped_column(Float)
        working_hours: Mapped[Optional[dict]] = mapped_column(JSON)
        is_active: Mapped[bool] = mapped_column(Boolean, default=True)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

        # Relationships
        tables = relationship("RestaurantTable", back_populates="branch")
        dishes = relationship("Dish", back_populates="branch")

    # ==================== КАТЕГОРИЯ МЕНЮ ====================
    class MenuCategory(Base):
        __tablename__ = "menu_categories"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        name: Mapped[str] = mapped_column(String(100), nullable=False)
        icon: Mapped[Optional[str]] = mapped_column(String(10))
        parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("menu_categories.id"))
        display_order: Mapped[int] = mapped_column(Integer, default=0)
        branch_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("branches.id"))
        is_active: Mapped[bool] = mapped_column(Boolean, default=True)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

        dishes = relationship("Dish", back_populates="category")

    # ==================== БЛЮДО ====================
    class Dish(Base):
        __tablename__ = "dishes"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        name: Mapped[str] = mapped_column(String(200), nullable=False)
        description: Mapped[Optional[str]] = mapped_column(Text)
        price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
        old_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
        image_url: Mapped[Optional[str]] = mapped_column(String(500))
        category_id: Mapped[int] = mapped_column(Integer, ForeignKey("menu_categories.id"))
        branch_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("branches.id"))
        weight: Mapped[Optional[int]] = mapped_column(Integer)  # граммы
        calories: Mapped[Optional[int]] = mapped_column(Integer)
        proteins: Mapped[Optional[float]] = mapped_column(Float)
        fats: Mapped[Optional[float]] = mapped_column(Float)
        carbs: Mapped[Optional[float]] = mapped_column(Float)
        allergens: Mapped[Optional[list]] = mapped_column(JSON, default=[])
        tags: Mapped[Optional[list]] = mapped_column(JSON, default=[])
        is_available: Mapped[bool] = mapped_column(Boolean, default=True)
        is_new: Mapped[bool] = mapped_column(Boolean, default=False)
        is_popular: Mapped[bool] = mapped_column(Boolean, default=False)
        stop_listed: Mapped[bool] = mapped_column(Boolean, default=False)
        stop_listed_until: Mapped[Optional[datetime]] = mapped_column(DateTime)
        rating: Mapped[float] = mapped_column(Float, default=0.0)
        review_count: Mapped[int] = mapped_column(Integer, default=0)
        order_count: Mapped[int] = mapped_column(Integer, default=0)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
        updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

        category = relationship("MenuCategory", back_populates="dishes")
        branch = relationship("Branch", back_populates="dishes")
        customizations = relationship("DishCustomization", back_populates="dish")
        recipe_items = relationship("RecipeItem", back_populates="dish")
        reviews = relationship("Review", back_populates="dish")

    # ==================== КАСТОМИЗАЦИЯ БЛЮДА ====================
    class DishCustomization(Base):
        __tablename__ = "dish_customizations"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        dish_id: Mapped[int] = mapped_column(Integer, ForeignKey("dishes.id"), nullable=False)
        name: Mapped[str] = mapped_column(String(100), nullable=False)
        required: Mapped[bool] = mapped_column(Boolean, default=False)
        multiple: Mapped[bool] = mapped_column(Boolean, default=False)

        dish = relationship("Dish", back_populates="customizations")
        options = relationship("CustomizationOption", back_populates="customization")

    class CustomizationOption(Base):
        __tablename__ = "customization_options"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        customization_id: Mapped[int] = mapped_column(Integer, ForeignKey("dish_customizations.id"), nullable=False)
        name: Mapped[str] = mapped_column(String(100), nullable=False)
        price: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
        is_default: Mapped[bool] = mapped_column(Boolean, default=False)

        customization = relationship("DishCustomization", back_populates="options")

    # ==================== ЗАКАЗ ====================
    class Order(Base):
        __tablename__ = "orders"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
        branch_id: Mapped[int] = mapped_column(Integer, ForeignKey("branches.id"), nullable=False)
        order_type: Mapped[str] = mapped_column(String(20), nullable=False)
        status: Mapped[str] = mapped_column(String(20), default=OrderStatusEnum.NEW.value, index=True)
        subtotal: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
        delivery_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
        discount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
        bonus_used: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
        total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
        promo_code: Mapped[Optional[str]] = mapped_column(String(50))
        payment_method: Mapped[str] = mapped_column(String(20))
        payment_id: Mapped[Optional[str]] = mapped_column(String(200))
        is_paid: Mapped[bool] = mapped_column(Boolean, default=False)
        address: Mapped[Optional[str]] = mapped_column(Text)
        delivery_lat: Mapped[Optional[float]] = mapped_column(Float)
        delivery_lng: Mapped[Optional[float]] = mapped_column(Float)
        delivery_time: Mapped[Optional[datetime]] = mapped_column(DateTime)
        table_number: Mapped[Optional[int]] = mapped_column(Integer)
        courier_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
        waiter_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
        comment: Mapped[Optional[str]] = mapped_column(Text)
        rating: Mapped[Optional[int]] = mapped_column(Integer)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), index=True)
        updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
        delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

        user = relationship("User", back_populates="orders", foreign_keys=[user_id])
        items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    class OrderItem(Base):
        __tablename__ = "order_items"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        order_id: Mapped[int] = mapped_column(Integer, ForeignKey("orders.id"), nullable=False)
        dish_id: Mapped[int] = mapped_column(Integer, ForeignKey("dishes.id"), nullable=False)
        name: Mapped[str] = mapped_column(String(200), nullable=False)
        price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
        quantity: Mapped[int] = mapped_column(Integer, nullable=False)
        options: Mapped[Optional[list]] = mapped_column(JSON, default=[])
        comment: Mapped[Optional[str]] = mapped_column(Text)

        order = relationship("Order", back_populates="items")

    # ==================== БРОНИРОВАНИЕ ====================
    class Booking(Base):
        __tablename__ = "bookings"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
        branch_id: Mapped[int] = mapped_column(Integer, ForeignKey("branches.id"), nullable=False)
        table_id: Mapped[int] = mapped_column(Integer, ForeignKey("restaurant_tables.id"), nullable=False)
        booking_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
        booking_time: Mapped[str] = mapped_column(String(5), nullable=False)
        duration_minutes: Mapped[int] = mapped_column(Integer, default=120)
        guest_count: Mapped[int] = mapped_column(Integer, nullable=False)
        status: Mapped[str] = mapped_column(String(20), default=BookingStatusEnum.PENDING.value)
        deposit: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
        comment: Mapped[Optional[str]] = mapped_column(Text)
        reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

        user = relationship("User", back_populates="bookings")
        table = relationship("RestaurantTable")

    # ==================== СТОЛИК ====================
    class RestaurantTable(Base):
        __tablename__ = "restaurant_tables"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        branch_id: Mapped[int] = mapped_column(Integer, ForeignKey("branches.id"), nullable=False)
        name: Mapped[str] = mapped_column(String(50), nullable=False)
        capacity: Mapped[int] = mapped_column(Integer, nullable=False)
        zone: Mapped[Optional[str]] = mapped_column(String(50))
        position_x: Mapped[Optional[float]] = mapped_column(Float)
        position_y: Mapped[Optional[float]] = mapped_column(Float)
        status: Mapped[str] = mapped_column(String(20), default=TableStatusEnum.FREE.value)
        is_active: Mapped[bool] = mapped_column(Boolean, default=True)

        branch = relationship("Branch", back_populates="tables")

    # ==================== ИНГРЕДИЕНТ ====================
    class Ingredient(Base):
        __tablename__ = "ingredients"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        name: Mapped[str] = mapped_column(String(200), nullable=False)
        unit: Mapped[str] = mapped_column(String(20), nullable=False)  # кг, шт, л
        price_per_unit: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
        current_stock: Mapped[float] = mapped_column(Float, default=0)
        min_stock: Mapped[float] = mapped_column(Float, default=0)
        supplier_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("suppliers.id"))
        branch_id: Mapped[int] = mapped_column(Integer, ForeignKey("branches.id"), nullable=False)
        expiry_date: Mapped[Optional[date]] = mapped_column(Date)
        is_active: Mapped[bool] = mapped_column(Boolean, default=True)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # ==================== РЕЦЕПТУРА (блюдо -> ингредиенты) ====================
    class RecipeItem(Base):
        __tablename__ = "recipe_items"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        dish_id: Mapped[int] = mapped_column(Integer, ForeignKey("dishes.id"), nullable=False)
        ingredient_id: Mapped[int] = mapped_column(Integer, ForeignKey("ingredients.id"), nullable=False)
        quantity: Mapped[float] = mapped_column(Float, nullable=False)

        dish = relationship("Dish", back_populates="recipe_items")

    # ==================== ПОСТАВЩИК ====================
    class Supplier(Base):
        __tablename__ = "suppliers"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        name: Mapped[str] = mapped_column(String(200), nullable=False)
        contact_person: Mapped[Optional[str]] = mapped_column(String(200))
        phone: Mapped[Optional[str]] = mapped_column(String(20))
        email: Mapped[Optional[str]] = mapped_column(String(200))
        address: Mapped[Optional[str]] = mapped_column(Text)
        is_active: Mapped[bool] = mapped_column(Boolean, default=True)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # ==================== ЗАКАЗ НА ЗАКУПКУ ====================
    class PurchaseOrder(Base):
        __tablename__ = "purchase_orders"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        supplier_id: Mapped[int] = mapped_column(Integer, ForeignKey("suppliers.id"), nullable=False)
        branch_id: Mapped[int] = mapped_column(Integer, ForeignKey("branches.id"), nullable=False)
        status: Mapped[str] = mapped_column(String(20), default=PurchaseOrderStatusEnum.DRAFT.value)
        items: Mapped[Optional[list]] = mapped_column(JSON, default=[])
        total: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
        notes: Mapped[Optional[str]] = mapped_column(Text)
        created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # ==================== ПРОМОКОД ====================
    class PromoCode(Base):
        __tablename__ = "promo_codes"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
        promo_type: Mapped[str] = mapped_column(String(20), nullable=False)  # percent / fixed
        value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
        min_order: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
        max_uses: Mapped[int] = mapped_column(Integer, default=0)  # 0 = unlimited
        used_count: Mapped[int] = mapped_column(Integer, default=0)
        branch_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("branches.id"))
        dish_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("dishes.id"))
        expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
        is_active: Mapped[bool] = mapped_column(Boolean, default=True)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # ==================== ОТЗЫВ ====================
    class Review(Base):
        __tablename__ = "reviews"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
        dish_id: Mapped[int] = mapped_column(Integer, ForeignKey("dishes.id"), nullable=False)
        order_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("orders.id"))
        rating: Mapped[int] = mapped_column(Integer, nullable=False)
        text: Mapped[Optional[str]] = mapped_column(Text)
        photo_url: Mapped[Optional[str]] = mapped_column(String(500))
        is_moderated: Mapped[bool] = mapped_column(Boolean, default=False)
        is_visible: Mapped[bool] = mapped_column(Boolean, default=True)
        response: Mapped[Optional[str]] = mapped_column(Text)  # ответ от ресторана
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

        user = relationship("User", back_populates="reviews")
        dish = relationship("Dish", back_populates="reviews")

    # ==================== ИЗБРАННОЕ ====================
    class FavoriteDish(Base):
        __tablename__ = "favorite_dishes"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
        dish_id: Mapped[int] = mapped_column(Integer, ForeignKey("dishes.id"), nullable=False)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

        user = relationship("User", back_populates="favorites")
        __table_args__ = (UniqueConstraint("user_id", "dish_id"),)

    # ==================== ЗОНА ДОСТАВКИ ====================
    class DeliveryZone(Base):
        __tablename__ = "delivery_zones"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        branch_id: Mapped[int] = mapped_column(Integer, ForeignKey("branches.id"), nullable=False)
        name: Mapped[str] = mapped_column(String(100), nullable=False)
        radius_km: Mapped[float] = mapped_column(Float, nullable=False)
        min_order: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
        delivery_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
        estimated_time_min: Mapped[int] = mapped_column(Integer, default=30)
        is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # ==================== СМЕНА ====================
    class Shift(Base):
        __tablename__ = "shifts"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
        branch_id: Mapped[int] = mapped_column(Integer, ForeignKey("branches.id"), nullable=False)
        shift_date: Mapped[date] = mapped_column(Date, nullable=False)
        start_time: Mapped[str] = mapped_column(String(5), nullable=False)
        end_time: Mapped[str] = mapped_column(String(5), nullable=False)
        is_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
        actual_start: Mapped[Optional[datetime]] = mapped_column(DateTime)
        actual_end: Mapped[Optional[datetime]] = mapped_column(DateTime)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # ==================== РАССЫЛКА / КАМПАНИЯ ====================
    class Campaign(Base):
        __tablename__ = "campaigns"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        name: Mapped[str] = mapped_column(String(200), nullable=False)
        campaign_type: Mapped[str] = mapped_column(String(20), nullable=False)  # manual / trigger
        trigger_type: Mapped[Optional[str]] = mapped_column(String(50))  # inactive / birthday / after_review
        message: Mapped[str] = mapped_column(Text, nullable=False)
        button_text: Mapped[Optional[str]] = mapped_column(String(100))
        button_url: Mapped[Optional[str]] = mapped_column(String(500))
        segment: Mapped[Optional[dict]] = mapped_column(JSON)  # фильтры аудитории
        sent_count: Mapped[int] = mapped_column(Integer, default=0)
        open_count: Mapped[int] = mapped_column(Integer, default=0)
        status: Mapped[str] = mapped_column(String(20), default=CampaignStatusEnum.DRAFT.value)
        ab_variant: Mapped[Optional[str]] = mapped_column(String(1))  # A / B
        ab_parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("campaigns.id"))
        scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # ==================== ЖУРНАЛ АУДИТА ====================
    class AuditLog(Base):
        __tablename__ = "audit_logs"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
        action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
        entity_type: Mapped[Optional[str]] = mapped_column(String(50))
        entity_id: Mapped[Optional[int]] = mapped_column(Integer)
        details: Mapped[Optional[str]] = mapped_column(Text)
        ip_address: Mapped[Optional[str]] = mapped_column(String(50))
        user_agent: Mapped[Optional[str]] = mapped_column(String(500))
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), index=True)

    # ==================== ЧАТ ПОДДЕРЖКИ ====================
    class SupportMessage(Base):
        __tablename__ = "support_messages"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
        from_user: Mapped[bool] = mapped_column(Boolean, nullable=False)
        text: Mapped[str] = mapped_column(Text, nullable=False)
        is_read: Mapped[bool] = mapped_column(Boolean, default=False)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # ==================== УВЕДОМЛЕНИЕ ====================
    class Notification(Base):
        __tablename__ = "notifications"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
        title: Mapped[str] = mapped_column(String(200), nullable=False)
        text: Mapped[str] = mapped_column(Text, nullable=False)
        notification_type: Mapped[str] = mapped_column(String(50))  # order_status, booking, promo, etc.
        is_read: Mapped[bool] = mapped_column(Boolean, default=False)
        data: Mapped[Optional[dict]] = mapped_column(JSON)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # ==================== НАСТРОЙКИ ПРИЛОЖЕНИЯ ====================
    class AppSetting(Base):
        __tablename__ = "app_settings"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
        value: Mapped[str] = mapped_column(Text, nullable=False)
        updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    # ==================== ГЕОЛОКАЦИЯ КУРЬЕРА ====================
    class CourierLocation(Base):
        __tablename__ = "courier_locations"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        courier_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
        latitude: Mapped[float] = mapped_column(Float, nullable=False)
        longitude: Mapped[float] = mapped_column(Float, nullable=False)
        order_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("orders.id"))
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # ==================== ИСПОЛЬЗОВАНИЕ ПРОМОКОДА ====================
    class PromoCodeUsage(Base):
        __tablename__ = "promo_code_usages"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        promo_code_id: Mapped[int] = mapped_column(Integer, ForeignKey("promo_codes.id"), nullable=False)
        user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
        order_id: Mapped[int] = mapped_column(Integer, ForeignKey("orders.id"), nullable=False)
        discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())


# ============================================================================
#                        IN-MEMORY ХРАНИЛИЩЕ (ЗАГЛУШКА)
# ============================================================================
# Используется если SQLAlchemy недоступен или для быстрого запуска

class InMemoryStore:
    """Простое хранилище в памяти для демо"""
    def __init__(self):
        self.users: Dict[int, dict] = {}
        self.orders: Dict[int, dict] = {}
        self.bookings: Dict[int, dict] = {}
        self.dishes: Dict[int, dict] = {}
        self.categories: Dict[int, dict] = {}
        self.branches: Dict[int, dict] = {}
        self.tables: Dict[int, dict] = {}
        self.ingredients: Dict[int, dict] = {}
        self.promo_codes: Dict[str, dict] = {}
        self.reviews: List[dict] = []
        self.audit_logs: List[dict] = []
        self.campaigns: List[dict] = []
        self.shifts: List[dict] = []
        self.support_messages: Dict[int, List[dict]] = {}  # user_id -> messages
        self.courier_locations: Dict[int, dict] = {}  # courier_id -> location
        self.admin_ids: Set[int] = set()
        self._counter = 10000  # для генерации ID

    def next_id(self) -> int:
        self._counter += 1
        return self._counter

    # --- Пользователи ---
    def get_or_create_user(self, telegram_id: int, first_name: str, last_name: str = "",
                          username: str = "") -> dict:
        if telegram_id in self.users:
            return self.users[telegram_id]
        user = {
            "id": self.next_id(),
            "telegram_id": telegram_id,
            "first_name": first_name,
            "last_name": last_name,
            "username": username,
            "phone": None,
            "role": UserRoleEnum.GUEST.value,
            "branch_id": None,
            "loyalty_level": LoyaltyLevelEnum.NEWBIE.value,
            "bonus_balance": 0,
            "total_spent": 0,
            "referral_code": secrets.token_hex(4).upper(),
            "is_active": True,
            "created_at": datetime.now().isoformat(),
        }
        self.users[telegram_id] = user
        return user

    def set_user_role(self, telegram_id: int, role: str, branch_id: int = None):
        if telegram_id in self.users:
            self.users[telegram_id]["role"] = role
            self.users[telegram_id]["branch_id"] = branch_id
            if role != UserRoleEnum.GUEST.value:
                self.admin_ids.add(telegram_id)

    def is_admin(self, telegram_id: int) -> bool:
        return telegram_id in self.admin_ids

    # --- Заказы ---
    def create_order(self, **kwargs) -> dict:
        order_id = self.next_id()
        order = {"id": order_id, **kwargs, "created_at": datetime.now().isoformat()}
        self.orders[order_id] = order
        return order

    def update_order_status(self, order_id: int, status: str) -> Optional[dict]:
        if order_id in self.orders:
            self.orders[order_id]["status"] = status
            self.orders[order_id]["updated_at"] = datetime.now().isoformat()
            return self.orders[order_id]
        return None

    # --- Бронирования ---
    def create_booking(self, **kwargs) -> dict:
        booking_id = self.next_id()
        booking = {"id": booking_id, **kwargs, "created_at": datetime.now().isoformat()}
        self.bookings[booking_id] = booking
        return booking

    # --- Аудит ---
    def log_action(self, user_id: int, action: str, details: str = ""):
        self.audit_logs.append({
            "id": self.next_id(),
            "user_id": user_id,
            "action": action,
            "details": details,
            "created_at": datetime.now().isoformat(),
        })


store = InMemoryStore()


# ============================================================================
#                         WEBSOCKET МЕНЕДЖЕР
# ============================================================================

class WebSocketManager:
    """
    Менеджер WebSocket соединений для real-time уведомлений.
    Админы получают обновления о новых заказах, изменениях статусов и т.д.
    """
    def __init__(self):
        self.active_connections: Dict[int, Any] = {}  # user_id -> websocket
        self.channel_connections: Dict[str, Set[int]] = {
            "orders": set(),
            "bookings": set(),
            "kitchen": set(),
            "delivery": set(),
            "support": set(),
        }

    async def connect(self, websocket, user_id: int, channels: List[str] = None):
        """Подключить пользователя"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        if channels:
            for channel in channels:
                if channel in self.channel_connections:
                    self.channel_connections[channel].add(user_id)
        logger.info(f"WebSocket connected: user_id={user_id}, channels={channels}")

    def disconnect(self, user_id: int):
        """Отключить пользователя"""
        self.active_connections.pop(user_id, None)
        for channel in self.channel_connections.values():
            channel.discard(user_id)
        logger.info(f"WebSocket disconnected: user_id={user_id}")

    async def send_personal(self, user_id: int, message: dict):
        """Отправить сообщение конкретному пользователю"""
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(user_id)

    async def broadcast_channel(self, channel: str, message: dict):
        """Отправить сообщение всем подписчикам канала"""
        if channel in self.channel_connections:
            disconnected = []
            for user_id in self.channel_connections[channel]:
                ws = self.active_connections.get(user_id)
                if ws:
                    try:
                        await ws.send_json(message)
                    except Exception:
                        disconnected.append(user_id)
            for uid in disconnected:
                self.disconnect(uid)

    async def broadcast_all(self, message: dict):
        """Отправить всем подключённым"""
        disconnected = []
        for user_id, ws in self.active_connections.items():
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(user_id)
        for uid in disconnected:
            self.disconnect(uid)


ws_manager = WebSocketManager()


# ============================================================================
#                      ПЛАТЁЖНАЯ СИСТЕМА (ЗАГЛУШКИ)
# ============================================================================

class PaymentService:
    """
    Сервис для работы с платежами.
    В текущей реализации — заглушки.
    Для подключения реальных платежей раскомментируйте соответствующие методы.
    """

    @staticmethod
    async def create_payment_yukassa(order_id: int, amount: float, description: str) -> dict:
        """
        Создание платежа через ЮKassa.
        Документация: https://yookassa.ru/developers/api

        В реальном проекте:
        from yookassa import Payment, Configuration
        Configuration.account_id = config.YUKASSA_SHOP_ID
        Configuration.secret_key = config.YUKASSA_SECRET_KEY
        payment = Payment.create({
            "amount": {"value": str(amount), "currency": "RUB"},
            "confirmation": {"type": "redirect", "return_url": f"{config.WEBAPP_URL_GUEST}/order/{order_id}"},
            "description": description,
            "metadata": {"order_id": order_id},
        })
        return {"payment_id": payment.id, "confirmation_url": payment.confirmation.confirmation_url}
        """
        logger.info(f"[ЗАГЛУШКА] Создание платежа ЮKassa: order={order_id}, amount={amount}")
        return {
            "payment_id": f"yookassa_{secrets.token_hex(8)}",
            "confirmation_url": f"https://yookassa.ru/test/payment/{order_id}",
            "status": "pending",
        }

    @staticmethod
    async def create_payment_tinkoff(order_id: int, amount: float, description: str) -> dict:
        """
        Создание платежа через Tinkoff.
        Документация: https://www.tinkoff.ru/kassa/develop/api/payments/

        В реальном проекте используется HTTP запрос к API Тинькофф.
        """
        logger.info(f"[ЗАГЛУШКА] Создание платежа Tinkoff: order={order_id}, amount={amount}")
        return {
            "payment_id": f"tinkoff_{secrets.token_hex(8)}",
            "payment_url": f"https://securepay.tinkoff.ru/test/{order_id}",
            "status": "pending",
        }

    @staticmethod
    async def create_payment_telegram_stars(order_id: int, amount: int) -> dict:
        """
        Оплата через Telegram Stars.
        Используется Telegram Bot API метод sendInvoice.
        """
        logger.info(f"[ЗАГЛУШКА] Создание платежа Telegram Stars: order={order_id}, stars={amount}")
        return {
            "payment_id": f"stars_{secrets.token_hex(8)}",
            "stars_amount": amount,
            "status": "pending",
        }

    @staticmethod
    async def process_webhook_yukassa(data: dict) -> dict:
        """Обработка вебхука от ЮKassa"""
        event = data.get("event", "")
        payment_id = data.get("object", {}).get("id", "")
        status = data.get("object", {}).get("status", "")
        order_id = data.get("object", {}).get("metadata", {}).get("order_id")

        logger.info(f"ЮKassa webhook: event={event}, payment={payment_id}, status={status}")

        if event == "payment.succeeded":
            if order_id:
                store.update_order_status(int(order_id), OrderStatusEnum.ACCEPTED.value)
                order = store.orders.get(int(order_id))
                if order:
                    order["is_paid"] = True
                    order["payment_id"] = payment_id

        return {"status": "ok"}

    @staticmethod
    async def process_webhook_tinkoff(data: dict) -> dict:
        """Обработка вебхука от Tinkoff"""
        status = data.get("Status", "")
        order_id = data.get("OrderId")
        payment_id = data.get("PaymentId")

        logger.info(f"Tinkoff webhook: status={status}, order={order_id}, payment={payment_id}")

        if status == "CONFIRMED" and order_id:
            store.update_order_status(int(order_id), OrderStatusEnum.ACCEPTED.value)

        return {"status": "ok"}

    @staticmethod
    async def refund_payment(payment_id: str, amount: float) -> dict:
        """
        Возврат средств.
        В реальном проекте вызывает соответствующий API платёжной системы.
        """
        logger.info(f"[ЗАГЛУШКА] Возврат платежа: payment={payment_id}, amount={amount}")
        return {"refund_id": f"refund_{secrets.token_hex(8)}", "status": "succeeded"}


payment_service = PaymentService()


# ============================================================================
#                      СЕРВИС ГЕОЛОКАЦИИ (ЗАГЛУШКА)
# ============================================================================

class GeoService:
    """
    Сервис для работы с геолокацией.
    В реальном проекте использует Яндекс.Карты или OpenStreetMap.
    """

    @staticmethod
    async def geocode(address: str) -> Optional[dict]:
        """
        Геокодирование: адрес -> координаты.
        Яндекс.Карты API: https://yandex.ru/dev/geocode/doc/
        """
        logger.info(f"[ЗАГЛУШКА] Геокодирование: {address}")
        return {"lat": 55.7558, "lng": 37.6173, "formatted_address": address}

    @staticmethod
    async def reverse_geocode(lat: float, lng: float) -> Optional[str]:
        """Обратное геокодирование: координаты -> адрес"""
        logger.info(f"[ЗАГЛУШКА] Обратное геокодирование: {lat}, {lng}")
        return "ул. Тверская, 15, Москва"

    @staticmethod
    async def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Расчёт расстояния между двумя точками (км)"""
        import math
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    @staticmethod
    async def find_nearest_branch(lat: float, lng: float, branches: list) -> Optional[dict]:
        """Найти ближайший филиал"""
        min_dist = float('inf')
        nearest = None
        for branch in branches:
            dist = await GeoService.calculate_distance(lat, lng, branch.get("lat", 0), branch.get("lng", 0))
            if dist < min_dist:
                min_dist = dist
                nearest = branch
        return nearest

    @staticmethod
    async def calculate_delivery_fee(branch_lat: float, branch_lng: float,
                                     delivery_lat: float, delivery_lng: float,
                                     zones: list) -> dict:
        """Расчёт стоимости доставки по зонам"""
        distance = await GeoService.calculate_distance(branch_lat, branch_lng, delivery_lat, delivery_lng)
        for zone in sorted(zones, key=lambda z: z.get("radius_km", 0)):
            if distance <= zone.get("radius_km", 0):
                return {
                    "zone": zone.get("name", ""),
                    "distance_km": round(distance, 1),
                    "delivery_fee": zone.get("delivery_price", 0),
                    "estimated_time": zone.get("estimated_time", 30),
                    "min_order": zone.get("min_order", 0),
                }
        return {"zone": None, "distance_km": round(distance, 1), "error": "Адрес за пределами зоны доставки"}


geo_service = GeoService()


# ============================================================================
#                         CELERY ЗАДАЧИ
# ============================================================================
# В реальном проекте запускаются через: celery -A bot worker -l info

try:
    from celery import Celery
    celery_app = Celery("foodchain", broker=config.CELERY_BROKER_URL, backend=config.CELERY_RESULT_BACKEND)

    @celery_app.task(name="send_notification")
    def task_send_notification(user_telegram_id: int, text: str):
        """Фоновая отправка уведомления через бота"""
        logger.info(f"[CELERY] Отправка уведомления: user={user_telegram_id}, text={text[:50]}...")
        # В реальном проекте: asyncio.run(bot.send_message(user_telegram_id, text))

    @celery_app.task(name="send_booking_reminder")
    def task_send_booking_reminder(booking_id: int):
        """Напоминание о бронировании за 2 часа"""
        logger.info(f"[CELERY] Напоминание о бронировании: booking_id={booking_id}")

    @celery_app.task(name="process_mass_mailing")
    def task_process_mass_mailing(campaign_id: int, user_ids: list, message: str):
        """Массовая рассылка"""
        logger.info(f"[CELERY] Массовая рассылка: campaign={campaign_id}, users={len(user_ids)}")
        for uid in user_ids:
            task_send_notification.delay(uid, message)

    @celery_app.task(name="auto_writeoff_ingredients")
    def task_auto_writeoff_ingredients(order_id: int, items: list):
        """Автоматическое списание ингредиентов при создании заказа"""
        logger.info(f"[CELERY] Списание ингредиентов для заказа #{order_id}")

    @celery_app.task(name="check_low_stock")
    def task_check_low_stock():
        """Проверка низких остатков и создание заявок на закупку"""
        logger.info("[CELERY] Проверка остатков на складе")

    @celery_app.task(name="database_backup")
    def task_database_backup():
        """Резервное копирование базы данных"""
        logger.info("[CELERY] Создание резервной копии БД")
        backup_path = Path(config.BACKUP_DIR) / f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
        # В реальном проекте: subprocess.run(["pg_dump", config.DATABASE_URL_SYNC, "-f", str(backup_path)])
        return str(backup_path)

    @celery_app.task(name="trigger_inactive_users")
    def task_trigger_inactive_users():
        """Триггерная рассылка неактивным пользователям"""
        logger.info("[CELERY] Поиск неактивных пользователей для рассылки")

    @celery_app.task(name="trigger_birthday_users")
    def task_trigger_birthday_users():
        """Триггерная рассылка на день рождения"""
        logger.info("[CELERY] Поиск именинников для рассылки")

    HAS_CELERY = True
except ImportError:
    HAS_CELERY = False
    logger.warning("Celery не установлен. Фоновые задачи будут выполняться синхронно.")

    # Заглушки для Celery задач
    class FakeTask:
        @staticmethod
        def delay(*args, **kwargs):
            logger.info(f"[FAKE CELERY] Задача: args={args[:2]}")

    class task_send_notification(FakeTask): pass
    class task_send_booking_reminder(FakeTask): pass
    class task_process_mass_mailing(FakeTask): pass
    class task_database_backup(FakeTask): pass


# ============================================================================
#                         FASTAPI ПРИЛОЖЕНИЕ
# ============================================================================

try:
    from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request, UploadFile, File, Query, Body, Header
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
    from fastapi.staticfiles import StaticFiles
    from pydantic import BaseModel, Field
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False
    logger.warning("FastAPI не установлен.")


if HAS_FASTAPI:

    # --- Pydantic модели (схемы API) ---

    class UserSchema(BaseModel):
        telegram_id: int
        first_name: str
        last_name: str = ""
        username: str = ""

    class OrderCreateSchema(BaseModel):
        branch_id: int
        order_type: str
        items: list  # [{"dish_id": 1, "quantity": 2, "options": [...]}]
        payment_method: str
        address: Optional[str] = None
        delivery_lat: Optional[float] = None
        delivery_lng: Optional[float] = None
        table_number: Optional[int] = None
        promo_code: Optional[str] = None
        bonus_used: float = 0
        comment: Optional[str] = None

    class OrderStatusUpdateSchema(BaseModel):
        status: str
        courier_id: Optional[int] = None

    class BookingCreateSchema(BaseModel):
        branch_id: int
        table_id: int
        date: str
        time: str
        guest_count: int
        duration: int = 120
        deposit: float = 0
        comment: Optional[str] = None

    class DishCreateSchema(BaseModel):
        name: str
        description: str = ""
        price: float
        category_id: int
        weight: Optional[int] = None
        calories: Optional[int] = None
        allergens: list = []
        tags: list = []
        branch_id: Optional[int] = None

    class PromoCodeCreateSchema(BaseModel):
        code: str
        promo_type: str  # percent / fixed
        value: float
        min_order: float = 0
        max_uses: int = 0
        expires_at: Optional[str] = None
        branch_id: Optional[int] = None
        dish_id: Optional[int] = None

    class CampaignCreateSchema(BaseModel):
        name: str
        campaign_type: str
        trigger_type: Optional[str] = None
        message: str
        button_text: Optional[str] = None

    class ReviewCreateSchema(BaseModel):
        dish_id: int
        rating: int
        text: str = ""

    class StaffSchema(BaseModel):
        telegram_id: int
        first_name: str
        last_name: str
        role: str
        branch_id: int
        phone: str = ""

    class MessageSchema(BaseModel):
        text: str

    class DeliveryZoneSchema(BaseModel):
        branch_id: int
        name: str
        radius_km: float
        min_order: float = 0
        delivery_price: float = 0
        estimated_time: int = 30


    # --- Зависимости ---

    def validate_telegram_init_data(init_data: str = Header(None, alias="X-Telegram-Init-Data")) -> dict:
        """
        Валидация Telegram WebApp init data.
        В реальном проекте проверяет подпись данных с помощью BOT_TOKEN.
        https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
        """
        if not init_data:
            # В демо-режиме возвращаем заглушку
            return {"user": {"id": 0, "first_name": "Demo"}}

        try:
            # Парсинг init_data
            from urllib.parse import parse_qs
            parsed = parse_qs(init_data)

            # Проверка подписи
            check_string = "\n".join(
                f"{k}={v[0]}" for k, v in sorted(parsed.items()) if k != "hash"
            )
            secret_key = hmac.new(b"WebAppData", config.BOT_TOKEN.encode(), hashlib.sha256).digest()
            expected_hash = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()

            if parsed.get("hash", [None])[0] != expected_hash:
                logger.warning("Invalid Telegram init data signature")
                # В демо пропускаем
                pass

            user_data = json.loads(parsed.get("user", ['{}'])[0])
            return {"user": user_data}
        except Exception as e:
            logger.error(f"Error validating init data: {e}")
            return {"user": {"id": 0, "first_name": "Demo"}}


    # --- Создание FastAPI приложения ---

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        """Жизненный цикл приложения"""
        logger.info(f"🚀 FoodChain Backend запускается на {config.HOST}:{config.PORT}")
        # Создание директорий
        Path(config.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
        Path(config.BACKUP_DIR).mkdir(parents=True, exist_ok=True)

        # Инициализация БД (если SQLAlchemy доступен)
        if HAS_SQLALCHEMY:
            try:
                engine = create_async_engine(config.DATABASE_URL, echo=config.DEBUG)
                async with engine.begin() as conn:
                    await conn.run_sync(Base.metadata.create_all)
                logger.info("✅ База данных инициализирована")
            except Exception as e:
                logger.warning(f"⚠️ Не удалось подключиться к PostgreSQL: {e}. Используется in-memory.")

        yield

        logger.info("🛑 FoodChain Backend остановлен")


    app = FastAPI(
        title="FoodChain API",
        description="Полная API экосистемы ресторанной сети",
        version="1.0.0",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


    # ==================== API ЭНДПОИНТЫ ====================

    # --- Здоровье ---
    @app.get("/api/health")
    async def health_check():
        return {
            "status": "ok",
            "version": "1.0.0",
            "network": config.NETWORK_NAME,
            "modules": {
                "sqlalchemy": HAS_SQLALCHEMY,
                "celery": HAS_CELERY,
                "redis": False,  # TODO: проверить подключение
            }
        }

    # --- Пользователи ---
    @app.post("/api/users/auth")
    async def auth_user(data: UserSchema):
        """Авторизация / регистрация пользователя через Telegram"""
        user = store.get_or_create_user(
            telegram_id=data.telegram_id,
            first_name=data.first_name,
            last_name=data.last_name,
            username=data.username,
        )
        store.log_action(data.telegram_id, "user.auth", f"Авторизация: {data.first_name}")
        return {"user": user, "is_admin": store.is_admin(data.telegram_id)}

    @app.get("/api/users/{telegram_id}")
    async def get_user(telegram_id: int):
        user = store.users.get(telegram_id)
        if not user:
            raise HTTPException(404, "Пользователь не найден")
        return user

    @app.get("/api/users/{telegram_id}/loyalty")
    async def get_loyalty(telegram_id: int):
        user = store.users.get(telegram_id)
        if not user:
            raise HTTPException(404, "Пользователь не найден")
        return {
            "level": user["loyalty_level"],
            "balance": user["bonus_balance"],
            "total_spent": user["total_spent"],
            "next_level": {
                "newbie": {"name": "Серебро", "required": 5000},
                "silver": {"name": "Золото", "required": 15000},
                "gold": {"name": "Платина", "required": 50000},
                "platinum": {"name": "Максимум", "required": 0},
            }.get(user["loyalty_level"], {}),
        }

    # --- Филиалы ---
    @app.get("/api/branches")
    async def get_branches():
        return list(store.branches.values()) or [
            {"id": 1, "name": "FoodChain Центр", "address": "ул. Тверская, 15", "lat": 55.764, "lng": 37.606, "is_active": True},
            {"id": 2, "name": "FoodChain Арбат", "address": "ул. Арбат, 24", "lat": 55.751, "lng": 37.592, "is_active": True},
            {"id": 3, "name": "FoodChain Сити", "address": "Пресненская наб., 8", "lat": 55.749, "lng": 37.537, "is_active": True},
        ]

    @app.get("/api/branches/nearest")
    async def get_nearest_branch(lat: float = Query(...), lng: float = Query(...)):
        branches = await get_branches()
        nearest = await geo_service.find_nearest_branch(lat, lng, branches)
        return nearest or branches[0]

    # --- Меню ---
    @app.get("/api/menu/categories")
    async def get_categories(branch_id: int = Query(None)):
        return list(store.categories.values()) or [
            {"id": 1, "name": "Бургеры", "icon": "🍔", "order": 1},
            {"id": 2, "name": "Пицца", "icon": "🍕", "order": 2},
            {"id": 3, "name": "Роллы", "icon": "🍣", "order": 3},
            {"id": 4, "name": "Салаты", "icon": "🥗", "order": 4},
            {"id": 5, "name": "Супы", "icon": "🍜", "order": 5},
            {"id": 6, "name": "Паста", "icon": "🍝", "order": 6},
            {"id": 7, "name": "Десерты", "icon": "🍰", "order": 7},
            {"id": 8, "name": "Напитки", "icon": "🥤", "order": 8},
        ]

    @app.get("/api/menu/dishes")
    async def get_dishes(
        category_id: int = Query(None),
        branch_id: int = Query(None),
        search: str = Query(None),
        sort: str = Query("default"),
        available_only: bool = Query(True),
    ):
        # Возвращаем заглушку или данные из store
        return list(store.dishes.values()) or []

    @app.get("/api/menu/dishes/{dish_id}")
    async def get_dish(dish_id: int):
        dish = store.dishes.get(dish_id)
        if not dish:
            raise HTTPException(404, "Блюдо не найдено")
        return dish

    @app.post("/api/menu/dishes")
    async def create_dish(data: DishCreateSchema):
        dish_id = store.next_id()
        dish = {
            "id": dish_id,
            **data.model_dump(),
            "is_available": True, "is_new": True,
            "rating": 0, "review_count": 0,
            "created_at": datetime.now().isoformat(),
        }
        store.dishes[dish_id] = dish
        store.log_action(0, "dish.create", f"Создано блюдо: {data.name}")
        await ws_manager.broadcast_channel("orders", {"type": "menu_updated", "dish": dish})
        return dish

    @app.put("/api/menu/dishes/{dish_id}")
    async def update_dish(dish_id: int, data: dict = Body(...)):
        if dish_id not in store.dishes:
            raise HTTPException(404, "Блюдо не найдено")
        store.dishes[dish_id].update(data)
        store.log_action(0, "dish.update", f"Обновлено блюдо #{dish_id}")
        return store.dishes[dish_id]

    @app.post("/api/menu/dishes/{dish_id}/stop-list")
    async def toggle_stop_list(dish_id: int, until: str = Query(None)):
        if dish_id not in store.dishes:
            raise HTTPException(404, "Блюдо не найдено")
        dish = store.dishes[dish_id]
        dish["is_available"] = not dish.get("is_available", True)
        store.log_action(0, "stoplist.toggle", f"Блюдо #{dish_id}: {'стоп-лист' if not dish['is_available'] else 'доступно'}")
        return dish

    @app.post("/api/menu/export")
    async def export_menu(format: str = Query("json")):
        """Экспорт меню в JSON или CSV"""
        dishes_list = list(store.dishes.values())
        if format == "csv":
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=["id", "name", "price", "category_id", "description"])
            writer.writeheader()
            for d in dishes_list:
                writer.writerow({k: d.get(k, "") for k in ["id", "name", "price", "category_id", "description"]})
            return StreamingResponse(io.BytesIO(output.getvalue().encode()), media_type="text/csv",
                                   headers={"Content-Disposition": "attachment; filename=menu.csv"})
        return dishes_list

    @app.post("/api/menu/import")
    async def import_menu(file: UploadFile = File(...)):
        """Импорт меню из JSON или CSV"""
        content = await file.read()
        if file.filename.endswith(".json"):
            data = json.loads(content)
            for item in data:
                dish_id = item.get("id", store.next_id())
                store.dishes[dish_id] = item
        elif file.filename.endswith(".csv"):
            reader = csv.DictReader(io.StringIO(content.decode()))
            for row in reader:
                dish_id = int(row.get("id", store.next_id()))
                store.dishes[dish_id] = row
        return {"imported": len(store.dishes)}

    @app.post("/api/menu/copy/{from_branch}/{to_branch}")
    async def copy_menu(from_branch: int, to_branch: int):
        """Копирование меню из одного филиала в другой"""
        copied = 0
        for dish in list(store.dishes.values()):
            if dish.get("branch_id") == from_branch:
                new_dish = {**dish, "id": store.next_id(), "branch_id": to_branch}
                store.dishes[new_dish["id"]] = new_dish
                copied += 1
        return {"copied": copied}

    # --- Заказы ---
    @app.post("/api/orders")
    async def create_order(data: OrderCreateSchema):
        """Создание нового заказа"""
        # Расчёт суммы
        subtotal = sum(item.get("price", 0) * item.get("quantity", 1) for item in data.items)
        delivery_fee = 0 if data.order_type != "delivery" else 199
        discount = 0

        # Проверка промокода
        if data.promo_code:
            promo = store.promo_codes.get(data.promo_code.upper())
            if promo and promo.get("is_active"):
                if promo["promo_type"] == "percent":
                    discount = subtotal * promo["value"] / 100
                else:
                    discount = promo["value"]

        total = max(0, subtotal + delivery_fee - discount - data.bonus_used)

        order = store.create_order(
            user_id=0,  # TODO: из авторизации
            branch_id=data.branch_id,
            order_type=data.order_type,
            status=OrderStatusEnum.NEW.value,
            items=data.items,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            discount=discount,
            bonus_used=data.bonus_used,
            total=total,
            promo_code=data.promo_code,
            payment_method=data.payment_method,
            is_paid=False,
            address=data.address,
            table_number=data.table_number,
            comment=data.comment,
        )

        # Создание платежа
        payment_result = {}
        if data.payment_method == "yukassa":
            payment_result = await payment_service.create_payment_yukassa(order["id"], total, f"Заказ #{order['id']}")
        elif data.payment_method == "tinkoff":
            payment_result = await payment_service.create_payment_tinkoff(order["id"], total, f"Заказ #{order['id']}")
        elif data.payment_method == "telegram_stars":
            payment_result = await payment_service.create_payment_telegram_stars(order["id"], int(total / 10))

        # WebSocket уведомление админам
        await ws_manager.broadcast_channel("orders", {
            "type": "new_order",
            "order": order,
        })

        # Фоновые задачи
        if HAS_CELERY:
            task_send_notification.delay(0, f"🆕 Новый заказ #{order['id']} на {total}₽")

        store.log_action(0, "order.create", f"Создан заказ #{order['id']} на {total}₽")

        return {"order": order, "payment": payment_result}

    @app.get("/api/orders")
    async def get_orders(
        branch_id: int = Query(None),
        status: str = Query(None),
        order_type: str = Query(None),
        date_from: str = Query(None),
        date_to: str = Query(None),
        limit: int = Query(50),
        offset: int = Query(0),
    ):
        """Список заказов с фильтрами"""
        orders = list(store.orders.values())
        if branch_id:
            orders = [o for o in orders if o.get("branch_id") == branch_id]
        if status:
            orders = [o for o in orders if o.get("status") == status]
        if order_type:
            orders = [o for o in orders if o.get("order_type") == order_type]
        return {"orders": orders[offset:offset+limit], "total": len(orders)}

    @app.get("/api/orders/{order_id}")
    async def get_order(order_id: int):
        order = store.orders.get(order_id)
        if not order:
            raise HTTPException(404, "Заказ не найден")
        return order

    @app.put("/api/orders/{order_id}/status")
    async def update_order_status(order_id: int, data: OrderStatusUpdateSchema):
        """Изменение статуса заказа"""
        order = store.update_order_status(order_id, data.status)
        if not order:
            raise HTTPException(404, "Заказ не найден")

        if data.courier_id:
            order["courier_id"] = data.courier_id

        if data.status == OrderStatusEnum.CANCELLED.value and order.get("is_paid"):
            # Возврат средств
            if order.get("payment_id"):
                await payment_service.refund_payment(order["payment_id"], order["total"])

        # Уведомление клиента
        status_messages = {
            "accepted": "✅ Ваш заказ принят!",
            "preparing": "👨‍🍳 Ваш заказ готовится...",
            "ready": "🎉 Ваш заказ готов!",
            "delivering": "🚗 Курьер в пути!",
            "delivered": "📦 Заказ доставлен! Приятного аппетита!",
            "cancelled": "❌ Заказ отменён.",
        }
        msg = status_messages.get(data.status, f"Статус заказа изменён: {data.status}")
        if HAS_CELERY:
            task_send_notification.delay(order.get("user_id", 0), f"{msg} (Заказ #{order_id})")

        # WebSocket
        await ws_manager.broadcast_channel("orders", {
            "type": "order_status_updated",
            "order_id": order_id,
            "status": data.status,
        })

        store.log_action(0, "order.status", f"Заказ #{order_id}: {data.status}")
        return order

    @app.post("/api/orders/{order_id}/assign-courier")
    async def assign_courier(order_id: int, courier_id: int = Query(...)):
        """Назначить курьера на заказ"""
        order = store.orders.get(order_id)
        if not order:
            raise HTTPException(404, "Заказ не найден")
        order["courier_id"] = courier_id
        store.log_action(0, "order.assign_courier", f"Заказ #{order_id}: курьер #{courier_id}")
        return order

    # --- Бронирования ---
    @app.post("/api/bookings")
    async def create_booking(data: BookingCreateSchema):
        booking = store.create_booking(
            user_id=0,
            branch_id=data.branch_id,
            table_id=data.table_id,
            booking_date=data.date,
            booking_time=data.time,
            guest_count=data.guest_count,
            duration=data.duration,
            deposit=data.deposit,
            comment=data.comment,
            status=BookingStatusEnum.PENDING.value,
        )

        # Отложенное напоминание
        if HAS_CELERY:
            task_send_booking_reminder.delay(booking["id"])

        await ws_manager.broadcast_channel("bookings", {
            "type": "new_booking",
            "booking": booking,
        })

        store.log_action(0, "booking.create", f"Бронь #{booking['id']}: {data.date} {data.time}")
        return booking

    @app.get("/api/bookings")
    async def get_bookings(
        branch_id: int = Query(None),
        date: str = Query(None),
        status: str = Query(None),
    ):
        bookings = list(store.bookings.values())
        if branch_id:
            bookings = [b for b in bookings if b.get("branch_id") == branch_id]
        if date:
            bookings = [b for b in bookings if b.get("booking_date") == date]
        if status:
            bookings = [b for b in bookings if b.get("status") == status]
        return bookings

    @app.put("/api/bookings/{booking_id}/status")
    async def update_booking_status(booking_id: int, status: str = Query(...)):
        if booking_id not in store.bookings:
            raise HTTPException(404, "Бронь не найдена")
        store.bookings[booking_id]["status"] = status
        store.log_action(0, "booking.status", f"Бронь #{booking_id}: {status}")
        return store.bookings[booking_id]

    # --- Столики ---
    @app.get("/api/tables")
    async def get_tables(branch_id: int = Query(...)):
        return [t for t in store.tables.values() if t.get("branch_id") == branch_id] or []

    @app.put("/api/tables/{table_id}/status")
    async def update_table_status(table_id: int, status: str = Query(...)):
        if table_id not in store.tables:
            raise HTTPException(404, "Столик не найден")
        store.tables[table_id]["status"] = status
        return store.tables[table_id]

    # --- Склад ---
    @app.get("/api/ingredients")
    async def get_ingredients(branch_id: int = Query(None)):
        ings = list(store.ingredients.values())
        if branch_id:
            ings = [i for i in ings if i.get("branch_id") == branch_id]
        return ings

    @app.get("/api/ingredients/low-stock")
    async def get_low_stock(branch_id: int = Query(None)):
        ings = list(store.ingredients.values())
        if branch_id:
            ings = [i for i in ings if i.get("branch_id") == branch_id]
        return [i for i in ings if i.get("current_stock", 0) <= i.get("min_stock", 0)]

    @app.post("/api/ingredients/{ingredient_id}/writeoff")
    async def writeoff_ingredient(ingredient_id: int, quantity: float = Query(...)):
        """Ручное списание ингредиента"""
        if ingredient_id not in store.ingredients:
            raise HTTPException(404, "Ингредиент не найден")
        ing = store.ingredients[ingredient_id]
        ing["current_stock"] = max(0, ing.get("current_stock", 0) - quantity)
        store.log_action(0, "ingredient.writeoff", f"Списание {ing['name']}: {quantity} {ing['unit']}")
        return ing

    # --- Промокоды ---
    @app.get("/api/promo-codes")
    async def get_promo_codes():
        return list(store.promo_codes.values())

    @app.post("/api/promo-codes")
    async def create_promo_code(data: PromoCodeCreateSchema):
        promo = {
            "id": store.next_id(),
            **data.model_dump(),
            "used_count": 0,
            "is_active": True,
            "created_at": datetime.now().isoformat(),
        }
        store.promo_codes[data.code.upper()] = promo
        store.log_action(0, "promo.create", f"Промокод {data.code}: {data.promo_type} {data.value}")
        return promo

    @app.post("/api/promo-codes/validate")
    async def validate_promo_code(code: str = Query(...), order_total: float = Query(0)):
        promo = store.promo_codes.get(code.upper())
        if not promo:
            raise HTTPException(404, "Промокод не найден")
        if not promo.get("is_active"):
            raise HTTPException(400, "Промокод неактивен")
        if promo.get("max_uses", 0) > 0 and promo.get("used_count", 0) >= promo["max_uses"]:
            raise HTTPException(400, "Промокод использован максимальное число раз")
        if promo.get("min_order", 0) > order_total:
            raise HTTPException(400, f"Минимальная сумма заказа: {promo['min_order']}₽")

        discount = promo["value"] if promo["promo_type"] == "fixed" else order_total * promo["value"] / 100
        return {"valid": True, "discount": discount, "promo": promo}

    # --- Отзывы ---
    @app.get("/api/reviews")
    async def get_reviews(dish_id: int = Query(None), moderated: bool = Query(None)):
        revs = store.reviews
        if dish_id:
            revs = [r for r in revs if r.get("dish_id") == dish_id]
        if moderated is not None:
            revs = [r for r in revs if r.get("is_moderated") == moderated]
        return revs

    @app.post("/api/reviews")
    async def create_review(data: ReviewCreateSchema):
        review = {
            "id": store.next_id(),
            **data.model_dump(),
            "user_id": 0,
            "is_moderated": False,
            "created_at": datetime.now().isoformat(),
        }
        store.reviews.append(review)

        # Начислить бонусы за отзыв
        store.log_action(0, "review.create", f"Отзыв на блюдо #{data.dish_id}: {data.rating}⭐")
        return review

    @app.put("/api/reviews/{review_id}/moderate")
    async def moderate_review(review_id: int, approve: bool = Query(True)):
        for r in store.reviews:
            if r.get("id") == review_id:
                r["is_moderated"] = approve
                store.log_action(0, "review.moderate", f"Отзыв #{review_id}: {'одобрен' if approve else 'отклонён'}")
                return r
        raise HTTPException(404, "Отзыв не найден")

    # --- Доставка ---
    @app.get("/api/delivery/zones")
    async def get_delivery_zones(branch_id: int = Query(...)):
        return [z for z in store.tables.values() if z.get("branch_id") == branch_id] or []

    @app.post("/api/delivery/calculate")
    async def calculate_delivery(branch_id: int = Query(...), lat: float = Query(...), lng: float = Query(...)):
        """Расчёт стоимости доставки по координатам"""
        result = await geo_service.calculate_delivery_fee(55.764, 37.606, lat, lng, [
            {"name": "Ближняя", "radius_km": 3, "delivery_price": 0, "estimated_time": 30, "min_order": 500},
            {"name": "Средняя", "radius_km": 5, "delivery_price": 199, "estimated_time": 45, "min_order": 800},
            {"name": "Дальняя", "radius_km": 10, "delivery_price": 399, "estimated_time": 60, "min_order": 1500},
        ])
        return result

    @app.post("/api/delivery/courier-location")
    async def update_courier_location(courier_id: int = Query(...), lat: float = Query(...), lng: float = Query(...), order_id: int = Query(None)):
        """Обновление геолокации курьера"""
        store.courier_locations[courier_id] = {
            "courier_id": courier_id, "lat": lat, "lng": lng,
            "order_id": order_id, "updated_at": datetime.now().isoformat()
        }
        if order_id:
            await ws_manager.broadcast_channel("delivery", {
                "type": "courier_location",
                "courier_id": courier_id,
                "order_id": order_id,
                "lat": lat, "lng": lng,
            })
        return {"status": "ok"}

    @app.get("/api/delivery/courier-location/{order_id}")
    async def get_courier_location(order_id: int):
        """Получение геолокации курьера для клиента"""
        for loc in store.courier_locations.values():
            if loc.get("order_id") == order_id:
                return loc
        raise HTTPException(404, "Курьер не найден")

    # --- Персонал ---
    @app.get("/api/staff")
    async def get_staff(branch_id: int = Query(None), role: str = Query(None)):
        staff = [u for u in store.users.values() if u.get("role") != UserRoleEnum.GUEST.value]
        if branch_id:
            staff = [s for s in staff if s.get("branch_id") == branch_id]
        if role:
            staff = [s for s in staff if s.get("role") == role]
        return staff

    @app.post("/api/staff")
    async def add_staff(data: StaffSchema):
        user = store.get_or_create_user(data.telegram_id, data.first_name, data.last_name)
        store.set_user_role(data.telegram_id, data.role, data.branch_id)
        user["phone"] = data.phone
        store.log_action(0, "staff.create", f"Добавлен: {data.first_name} {data.last_name} ({data.role})")
        return user

    @app.put("/api/staff/{telegram_id}/role")
    async def update_staff_role(telegram_id: int, role: str = Query(...), branch_id: int = Query(None)):
        store.set_user_role(telegram_id, role, branch_id)
        store.log_action(0, "staff.role", f"Роль изменена: #{telegram_id} -> {role}")
        return {"status": "ok"}

    # --- Смены ---
    @app.get("/api/shifts")
    async def get_shifts(branch_id: int = Query(None), date: str = Query(None)):
        result = store.shifts
        if branch_id:
            result = [s for s in result if s.get("branch_id") == branch_id]
        if date:
            result = [s for s in result if s.get("shift_date") == date]
        return result

    @app.post("/api/shifts")
    async def create_shift(user_id: int = Query(...), branch_id: int = Query(...),
                          date: str = Query(...), start: str = Query(...), end: str = Query(...)):
        shift = {
            "id": store.next_id(), "user_id": user_id, "branch_id": branch_id,
            "shift_date": date, "start_time": start, "end_time": end,
            "is_confirmed": False, "created_at": datetime.now().isoformat(),
        }
        store.shifts.append(shift)
        return shift

    # --- Маркетинг ---
    @app.get("/api/campaigns")
    async def get_campaigns():
        return store.campaigns

    @app.post("/api/campaigns")
    async def create_campaign(data: CampaignCreateSchema):
        campaign = {
            "id": store.next_id(),
            **data.model_dump(),
            "sent_count": 0, "open_count": 0,
            "status": CampaignStatusEnum.DRAFT.value,
            "created_at": datetime.now().isoformat(),
        }
        store.campaigns.append(campaign)
        store.log_action(0, "campaign.create", f"Кампания: {data.name}")
        return campaign

    @app.post("/api/campaigns/{campaign_id}/send")
    async def send_campaign(campaign_id: int):
        """Отправка рассылки"""
        for c in store.campaigns:
            if c.get("id") == campaign_id:
                # Получаем всех пользователей-гостей
                user_ids = [u["telegram_id"] for u in store.users.values()]
                c["sent_count"] = len(user_ids)
                c["status"] = CampaignStatusEnum.ACTIVE.value

                if HAS_CELERY:
                    task_process_mass_mailing.delay(campaign_id, user_ids, c["message"])

                store.log_action(0, "campaign.send", f"Рассылка #{campaign_id}: {len(user_ids)} получателей")
                return c
        raise HTTPException(404, "Кампания не найдена")

    # --- Аналитика ---
    @app.get("/api/analytics/dashboard")
    async def get_analytics_dashboard(branch_id: int = Query(None)):
        """Основные метрики для дашборда"""
        orders_list = list(store.orders.values())
        if branch_id:
            orders_list = [o for o in orders_list if o.get("branch_id") == branch_id]

        today = datetime.now().date().isoformat()
        today_orders = [o for o in orders_list if o.get("created_at", "").startswith(today)]

        revenue_today = sum(o.get("total", 0) for o in today_orders)
        revenue_total = sum(o.get("total", 0) for o in orders_list)

        return {
            "revenue": {"today": revenue_today, "total": revenue_total},
            "orders": {"today": len(today_orders), "total": len(orders_list)},
            "avg_check": revenue_today / max(1, len(today_orders)),
            "users": len(store.users),
        }

    @app.get("/api/analytics/revenue")
    async def get_revenue_report(
        period: str = Query("week"),  # day, week, month
        branch_id: int = Query(None),
    ):
        """Отчёт по выручке"""
        return {
            "period": period,
            "data": [
                {"date": "2025-01-13", "revenue": 42300, "orders": 28},
                {"date": "2025-01-14", "revenue": 38900, "orders": 25},
                {"date": "2025-01-15", "revenue": 47850, "orders": 34},
            ]
        }

    @app.get("/api/analytics/export")
    async def export_analytics(format: str = Query("csv")):
        """Экспорт отчёта в CSV"""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Дата", "Тип", "Сумма", "Статус"])
        for order in store.orders.values():
            writer.writerow([order["id"], order.get("created_at", ""), order.get("order_type", ""),
                           order.get("total", 0), order.get("status", "")])
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8-sig")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=report_{datetime.now().strftime('%Y%m%d')}.csv"}
        )

    # --- Поддержка ---
    @app.get("/api/support/{user_id}/messages")
    async def get_support_messages(user_id: int):
        return store.support_messages.get(user_id, [])

    @app.post("/api/support/{user_id}/messages")
    async def send_support_message(user_id: int, data: MessageSchema, from_admin: bool = Query(False)):
        msg = {
            "id": store.next_id(),
            "from_user": not from_admin,
            "text": data.text,
            "created_at": datetime.now().isoformat(),
        }
        if user_id not in store.support_messages:
            store.support_messages[user_id] = []
        store.support_messages[user_id].append(msg)

        # Уведомление через WebSocket
        await ws_manager.broadcast_channel("support", {
            "type": "new_message",
            "user_id": user_id,
            "message": msg,
        })

        return msg

    # --- Настройки ---
    @app.get("/api/settings")
    async def get_settings():
        return {
            "network_name": config.NETWORK_NAME,
            "phone": "+7 (800) 123-45-67",
            "delivery_enabled": True,
            "booking_enabled": True,
            "loyalty_enabled": True,
            "theme": "auto",
        }

    @app.put("/api/settings")
    async def update_settings(data: dict = Body(...)):
        store.log_action(0, "settings.update", f"Настройки обновлены: {list(data.keys())}")
        return {"status": "ok", "updated": data}

    # --- Аудит ---
    @app.get("/api/audit-logs")
    async def get_audit_logs(limit: int = Query(50), offset: int = Query(0)):
        logs = store.audit_logs[offset:offset+limit]
        return {"logs": logs, "total": len(store.audit_logs)}

    # --- Безопасность ---
    @app.post("/api/security/2fa/send-code")
    async def send_2fa_code(telegram_id: int = Query(...)):
        """Отправка 2FA кода через Telegram"""
        code = str(secrets.randbelow(999999)).zfill(6)
        logger.info(f"[2FA] Код для {telegram_id}: {code}")
        # В реальном проекте: отправить код через бота
        return {"status": "code_sent"}

    @app.post("/api/security/2fa/verify")
    async def verify_2fa_code(telegram_id: int = Query(...), code: str = Query(...)):
        """Проверка 2FA кода"""
        # В реальном проекте: проверить код из БД
        return {"verified": True}

    @app.post("/api/security/backup")
    async def create_backup():
        """Создание резервной копии БД"""
        if HAS_CELERY:
            task_database_backup.delay()
            return {"status": "backup_started"}
        return {"status": "backup_not_available", "reason": "Celery не настроен"}

    # --- Загрузка файлов ---
    @app.post("/api/upload")
    async def upload_file(file: UploadFile = File(...)):
        """Загрузка изображения (блюда, аватар, отзыв)"""
        ext = Path(file.filename).suffix
        filename = f"{secrets.token_hex(16)}{ext}"
        filepath = Path(config.UPLOAD_DIR) / filename
        filepath.parent.mkdir(parents=True, exist_ok=True)

        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)

        # В продакшене: загрузить в S3/MinIO
        return {"url": f"/uploads/{filename}", "filename": filename}

    # --- Вебхуки платёжных систем ---
    @app.post("/api/webhooks/yukassa")
    async def webhook_yukassa(request: Request):
        """Вебхук от ЮKassa"""
        data = await request.json()
        result = await payment_service.process_webhook_yukassa(data)
        return result

    @app.post("/api/webhooks/tinkoff")
    async def webhook_tinkoff(request: Request):
        """Вебхук от Tinkoff"""
        data = await request.json()
        result = await payment_service.process_webhook_tinkoff(data)
        return result

    # --- WebSocket ---
    @app.websocket("/ws/{user_id}")
    async def websocket_endpoint(websocket: WebSocket, user_id: int):
        """
        WebSocket для live-уведомлений.
        Клиент подключается и указывает каналы для подписки.
        """
        channels = ["orders", "bookings", "kitchen", "delivery", "support"]
        await ws_manager.connect(websocket, user_id, channels)
        try:
            while True:
                data = await websocket.receive_json()
                # Обработка входящих сообщений от клиента
                msg_type = data.get("type")
                if msg_type == "subscribe":
                    channel = data.get("channel")
                    if channel in ws_manager.channel_connections:
                        ws_manager.channel_connections[channel].add(user_id)
                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
        except WebSocketDisconnect:
            ws_manager.disconnect(user_id)


# ============================================================================
#                           TELEGRAM БОТ (aiogram 3.x)
# ============================================================================

try:
    from aiogram import Bot, Dispatcher, Router, F
    from aiogram.client.default import DefaultBotProperties
    from aiogram.types import (
        Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton,
        WebAppInfo, ReplyKeyboardMarkup, KeyboardButton, MenuButtonWebApp,
        LabeledPrice, PreCheckoutQuery, ContentType as AiogramContentType,
    )
    from aiogram.filters import Command, CommandStart
    from aiogram.enums import ParseMode
    HAS_AIOGRAM = True
except ImportError:
    HAS_AIOGRAM = False
    logger.warning("aiogram не установлен. Бот не будет запущен.")


if HAS_AIOGRAM:
    bot = Bot(token=config.BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher()
    router = Router()

    # ==================== ХЭНДЛЕРЫ БОТА ====================

    @router.message(CommandStart())
    async def cmd_start(message: Message):
        """
        /start — Приветствие и главные кнопки.
        Гостю: кнопка «Заказать» (гостевое мини-приложение).
        Админу: дополнительно «Управление» (админская панель).
        """
        user = store.get_or_create_user(
            telegram_id=message.from_user.id,
            first_name=message.from_user.first_name or "",
            last_name=message.from_user.last_name or "",
            username=message.from_user.username or "",
        )

        welcome_text = (
            f"🍔 Добро пожаловать в <b>{config.NETWORK_NAME}</b>!\n\n"
            f"Привет, {message.from_user.first_name}! 👋\n\n"
            f"Здесь вы можете:\n"
            f"🍕 Заказать еду с доставкой или самовывозом\n"
            f"📅 Забронировать столик\n"
            f"⭐ Копить бонусы и получать скидки\n\n"
            f"Выберите действие:"
        )

        # Кнопки
        buttons = [
            [InlineKeyboardButton(
                text="🍽️ Заказать / Меню",
                web_app=WebAppInfo(url=config.WEBAPP_URL_GUEST)
            )],
            [InlineKeyboardButton(
                text="📅 Забронировать столик",
                callback_data="booking_start"
            )],
            [InlineKeyboardButton(
                text="📦 Мои заказы",
                callback_data="my_orders"
            )],
            [InlineKeyboardButton(
                text="🌟 Программа лояльности",
                callback_data="loyalty_info"
            )],
            [InlineKeyboardButton(
                text="📞 Связаться с нами",
                callback_data="contact_support"
            )],
        ]

        # Если пользователь — админ, добавляем кнопку управления
        if store.is_admin(message.from_user.id):
            buttons.append([InlineKeyboardButton(
                text="🔧 Панель управления",
                web_app=WebAppInfo(url=config.WEBAPP_URL_ADMIN)
            )])

        keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
        await message.answer(welcome_text, reply_markup=keyboard)

    @router.message(Command("menu"))
    async def cmd_menu(message: Message):
        """Быстрый доступ к меню"""
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📋 Открыть меню", web_app=WebAppInfo(url=config.WEBAPP_URL_GUEST))],
        ])
        await message.answer("🍽️ Нажмите кнопку чтобы открыть меню:", reply_markup=keyboard)

    @router.message(Command("orders"))
    async def cmd_orders(message: Message):
        """Мои заказы"""
        user_id = message.from_user.id
        user_orders = [o for o in store.orders.values() if o.get("user_id") == user_id]

        if not user_orders:
            await message.answer("📦 У вас пока нет заказов.\nНажмите /menu чтобы сделать первый заказ!")
            return

        text = "📦 <b>Ваши заказы:</b>\n\n"
        status_emoji = {
            "new": "🆕", "accepted": "✅", "preparing": "👨‍🍳",
            "ready": "🎉", "delivering": "🚗", "delivered": "📦", "cancelled": "❌"
        }
        for order in user_orders[-5:]:
            emoji = status_emoji.get(order.get("status", ""), "❓")
            text += f"{emoji} <b>Заказ #{order['id']}</b> — {order.get('total', 0)}₽\n"
        await message.answer(text)

    @router.message(Command("bonus"))
    async def cmd_bonus(message: Message):
        """Бонусный баланс"""
        user = store.users.get(message.from_user.id)
        if not user:
            await message.answer("Вы ещё не зарегистрированы. Нажмите /start")
            return

        level_info = {
            "newbie": ("⭐ Новичок", 3),
            "silver": ("🥈 Серебро", 5),
            "gold": ("🥇 Золото", 7),
            "platinum": ("💎 Платина", 10),
        }
        level_name, cashback = level_info.get(user["loyalty_level"], ("⭐", 3))

        await message.answer(
            f"🌟 <b>Программа лояльности</b>\n\n"
            f"Ваш уровень: {level_name}\n"
            f"Бонусов: <b>{user['bonus_balance']}₽</b>\n"
            f"Кэшбэк: <b>{cashback}%</b> с каждого заказа\n\n"
            f"📊 Всего потрачено: {user['total_spent']}₽\n\n"
            f"Реферальный код: <code>{user['referral_code']}</code>\n"
            f"Пригласите друга и получите 200₽ бонусов!"
        )

    @router.message(Command("help"))
    async def cmd_help(message: Message):
        """Помощь"""
        await message.answer(
            "ℹ️ <b>Помощь</b>\n\n"
            "/start — Главное меню\n"
            "/menu — Открыть меню и заказать\n"
            "/orders — Мои заказы\n"
            "/bonus — Бонусный баланс\n"
            "/help — Эта справка\n\n"
            "По любым вопросам напишите нам — менеджер ответит в течение 5 минут!"
        )

    @router.message(Command("admin"))
    async def cmd_admin(message: Message):
        """Вход в панель управления"""
        if not store.is_admin(message.from_user.id):
            await message.answer("⛔ У вас нет доступа к панели управления.")
            return

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🔧 Открыть панель", web_app=WebAppInfo(url=config.WEBAPP_URL_ADMIN))],
        ])
        await message.answer("👨‍💼 Панель управления:", reply_markup=keyboard)

    @router.message(Command("addadmin"))
    async def cmd_add_admin(message: Message):
        """Добавление суперадмина (только для первого запуска или из env)"""
        # В реальном проекте: проверка что sender уже суперадмин
        args = message.text.split()
        if len(args) < 2:
            await message.answer("Использование: /addadmin <telegram_id>")
            return

        try:
            target_id = int(args[1])
            store.set_user_role(target_id, UserRoleEnum.SUPERADMIN.value)
            store.get_or_create_user(target_id, "Admin")
            await message.answer(f"✅ Пользователь {target_id} назначен суперадмином")
        except ValueError:
            await message.answer("❌ Некорректный ID")

    # --- Обработка Callback Query ---

    @router.callback_query(F.data == "booking_start")
    async def cb_booking_start(callback: CallbackQuery):
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📅 Забронировать", web_app=WebAppInfo(url=f"{config.WEBAPP_URL_GUEST}#booking"))],
        ])
        await callback.message.answer("📅 Для бронирования столика нажмите кнопку:", reply_markup=keyboard)
        await callback.answer()

    @router.callback_query(F.data == "my_orders")
    async def cb_my_orders(callback: CallbackQuery):
        await cmd_orders(callback.message)
        await callback.answer()

    @router.callback_query(F.data == "loyalty_info")
    async def cb_loyalty(callback: CallbackQuery):
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🌟 Подробнее", web_app=WebAppInfo(url=f"{config.WEBAPP_URL_GUEST}#loyalty"))],
        ])
        await callback.message.answer(
            "🌟 <b>Программа лояльности FoodChain</b>\n\n"
            "⭐ Новичок — 3% кэшбэк\n"
            "🥈 Серебро — 5% кэшбэк (от 5 000₽)\n"
            "🥇 Золото — 7% кэшбэк (от 15 000₽)\n"
            "💎 Платина — 10% кэшбэк (от 50 000₽)\n\n"
            "Бонусы за:\n"
            "• Каждый заказ\n"
            "• Отзывы (+50₽ с фото)\n"
            "• Приглашения (+200₽)",
            reply_markup=keyboard
        )
        await callback.answer()

    @router.callback_query(F.data == "contact_support")
    async def cb_support(callback: CallbackQuery):
        await callback.message.answer(
            "📞 <b>Связаться с нами:</b>\n\n"
            f"☎️ Телефон: +7 (800) 123-45-67\n"
            f"📱 Telegram: @foodchain_support\n\n"
            "Или просто напишите сообщение — менеджер ответит в течение 5 минут!"
        )
        await callback.answer()

    @router.callback_query(F.data.startswith("confirm_booking_"))
    async def cb_confirm_booking(callback: CallbackQuery):
        booking_id = int(callback.data.split("_")[-1])
        if booking_id in store.bookings:
            store.bookings[booking_id]["status"] = BookingStatusEnum.CONFIRMED.value
            await callback.message.answer(f"✅ Бронирование #{booking_id} подтверждено!")
        await callback.answer()

    @router.callback_query(F.data.startswith("cancel_booking_"))
    async def cb_cancel_booking(callback: CallbackQuery):
        booking_id = int(callback.data.split("_")[-1])
        if booking_id in store.bookings:
            store.bookings[booking_id]["status"] = BookingStatusEnum.CANCELLED.value
            await callback.message.answer(f"❌ Бронирование #{booking_id} отменено")
        await callback.answer()

    @router.callback_query(F.data.startswith("accept_order_"))
    async def cb_accept_order(callback: CallbackQuery):
        order_id = int(callback.data.split("_")[-1])
        order = store.update_order_status(order_id, OrderStatusEnum.ACCEPTED.value)
        if order:
            await callback.message.answer(f"✅ Заказ #{order_id} принят!")
            # Уведомить клиента
            if HAS_CELERY:
                task_send_notification.delay(
                    order.get("user_id", 0),
                    f"✅ Ваш заказ #{order_id} принят! Ожидайте."
                )
        await callback.answer()

    # --- Обработка текстовых сообщений (чат поддержки) ---

    @router.message(F.text & ~F.text.startswith("/"))
    async def handle_text_message(message: Message):
        """
        Все текстовые сообщения пересылаются в чат поддержки.
        В реальном проекте: пересылка менеджеру или в группу поддержки.
        """
        user_id = message.from_user.id

        # Сохраняем сообщение
        if user_id not in store.support_messages:
            store.support_messages[user_id] = []
        store.support_messages[user_id].append({
            "id": store.next_id(),
            "from_user": True,
            "text": message.text,
            "created_at": datetime.now().isoformat(),
        })

        # Уведомляем админов через WebSocket
        asyncio.create_task(ws_manager.broadcast_channel("support", {
            "type": "new_support_message",
            "user_id": user_id,
            "user_name": message.from_user.first_name,
            "text": message.text,
        }))

        await message.answer(
            "📩 Ваше сообщение получено!\n"
            "Менеджер ответит в течение 5 минут.\n\n"
            "А пока вы можете:\n"
            "/menu — Посмотреть меню\n"
            "/orders — Проверить заказы"
        )

    # --- Оплата Telegram Stars ---

    @router.pre_checkout_query()
    async def pre_checkout(query: PreCheckoutQuery):
        """Подтверждение pre-checkout для Telegram Stars"""
        await query.answer(ok=True)

    @router.message(F.successful_payment)
    async def successful_payment(message: Message):
        """Обработка успешной оплаты Telegram Stars"""
        payment = message.successful_payment
        order_id = payment.invoice_payload  # мы кладём order_id в payload

        order = store.update_order_status(int(order_id), OrderStatusEnum.ACCEPTED.value)
        if order:
            order["is_paid"] = True
            order["payment_method"] = PaymentMethodEnum.TELEGRAM_STARS.value

        await message.answer(
            f"🎉 Оплата прошла успешно!\n\n"
            f"Заказ #{order_id} оплачен.\n"
            f"Мы уведомим вас, когда заказ будет готов!"
        )

    # --- Утилиты для отправки уведомлений ---

    async def send_order_notification(user_telegram_id: int, order_id: int, status: str):
        """Отправка уведомления о статусе заказа"""
        status_messages = {
            "accepted": ("✅", "Ваш заказ принят!"),
            "preparing": ("👨‍🍳", "Ваш заказ готовится..."),
            "ready": ("🎉", "Ваш заказ готов!"),
            "delivering": ("🚗", "Курьер в пути!"),
            "delivered": ("📦", "Заказ доставлен! Приятного аппетита!"),
            "cancelled": ("❌", "Заказ отменён."),
        }
        emoji, text = status_messages.get(status, ("ℹ️", f"Статус заказа изменён: {status}"))

        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📦 Подробнее", web_app=WebAppInfo(url=f"{config.WEBAPP_URL_GUEST}#order-{order_id}"))],
        ])

        try:
            await bot.send_message(
                user_telegram_id,
                f"{emoji} <b>Заказ #{order_id}</b>\n{text}",
                reply_markup=keyboard
            )
        except Exception as e:
            logger.error(f"Не удалось отправить уведомление: {e}")

    async def send_booking_reminder_notification(user_telegram_id: int, booking_id: int, time: str):
        """Напоминание о бронировании за 2 часа"""
        try:
            await bot.send_message(
                user_telegram_id,
                f"⏰ <b>Напоминание о бронировании</b>\n\n"
                f"Ваш столик забронирован на {time}.\n"
                f"Ждём вас!",
                reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="✅ Подтвердить", callback_data=f"confirm_booking_{booking_id}")],
                    [InlineKeyboardButton(text="❌ Отменить", callback_data=f"cancel_booking_{booking_id}")],
                ])
            )
        except Exception as e:
            logger.error(f"Не удалось отправить напоминание: {e}")

    async def send_admin_new_order(order: dict):
        """Уведомление админам о новом заказе"""
        for admin_id in store.admin_ids:
            try:
                items_text = "\n".join(
                    f"  • {item['name']} ×{item['quantity']}"
                    for item in order.get("items", [])
                )
                keyboard = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="✅ Принять", callback_data=f"accept_order_{order['id']}")],
                    [InlineKeyboardButton(text="🔧 Открыть панель", web_app=WebAppInfo(url=config.WEBAPP_URL_ADMIN))],
                ])
                await bot.send_message(
                    admin_id,
                    f"🆕 <b>Новый заказ #{order['id']}</b>\n\n"
                    f"💰 Сумма: {order.get('total', 0)}₽\n"
                    f"📋 Состав:\n{items_text}\n"
                    f"📍 {order.get('address', 'Самовынос/В зале')}",
                    reply_markup=keyboard
                )
            except Exception as e:
                logger.error(f"Ошибка уведомления админа {admin_id}: {e}")

    # Регистрация роутера
    dp.include_router(router)


# ============================================================================
#                         DOCKER / ИНФРАСТРУКТУРА
# ============================================================================

DOCKERFILE = """
# === Dockerfile для бэкенда ===
FROM python:3.12-slim

WORKDIR /app

# Зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Код
COPY bot.py .

# Порт
EXPOSE 8000

# Запуск
CMD ["python", "bot.py"]
"""

DOCKER_COMPOSE = """
version: '3.9'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - BOT_TOKEN=${BOT_TOKEN}
      - DATABASE_URL=postgresql+asyncpg://foodchain:foodchain@postgres:5432/foodchain
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/1
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./backups:/app/backups

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: foodchain
      POSTGRES_USER: foodchain
      POSTGRES_PASSWORD: foodchain
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  celery-worker:
    build: .
    command: celery -A bot worker -l info -c 4
    environment:
      - DATABASE_URL=postgresql+asyncpg://foodchain:foodchain@postgres:5432/foodchain
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/1
    depends_on:
      - redis
      - postgres

  celery-beat:
    build: .
    command: celery -A bot beat -l info
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/1
    depends_on:
      - redis

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./dist:/usr/share/nginx/html
    depends_on:
      - backend

volumes:
  pgdata:
"""

REQUIREMENTS = """
# === Бэкенд зависимости ===
fastapi==0.115.0
uvicorn[standard]==0.31.0
aiogram==3.13.0
sqlalchemy[asyncio]==2.0.35
asyncpg==0.29.0
alembic==1.13.2
redis==5.1.0
celery==5.4.0
pydantic==2.9.0
python-multipart==0.0.9
aiofiles==24.1.0
httpx==0.27.0
python-dotenv==1.0.1
Pillow==10.4.0
openpyxl==3.1.5
boto3==1.35.0
# yookassa==3.2.0  # Раскомментируйте для реальных платежей ЮKassa
"""

ENV_TEMPLATE = """
# === Переменные окружения FoodChain ===

# Telegram Bot
BOT_TOKEN=YOUR_BOT_TOKEN_HERE
WEBAPP_URL_GUEST=https://solsoykaru-design.github.io/mini_bot/
WEBAPP_URL_ADMIN=https://solsoykaru-design.github.io/mini_bot/

# База данных
DATABASE_URL=postgresql+asyncpg://foodchain:foodchain@localhost:5432/foodchain

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Платежи (тестовые ключи)
YUKASSA_SHOP_ID=test_shop_id
YUKASSA_SECRET_KEY=test_secret_key
TINKOFF_TERMINAL_KEY=test_terminal
TINKOFF_SECRET_KEY=test_secret

# Яндекс.Карты
YANDEX_MAPS_API_KEY=test_key

# S3 / MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Приложение
DEBUG=true
SECRET_KEY=your-secret-key-here
NETWORK_NAME=FoodChain
"""


# ============================================================================
#                          ТОЧКА ВХОДА
# ============================================================================

async def main():
    """Запуск всех сервисов"""
    logger.info("=" * 60)
    logger.info(f"  🍔 {config.NETWORK_NAME} — Ресторанная экосистема")
    logger.info(f"  📡 API: http://{config.HOST}:{config.PORT}")
    logger.info(f"  📖 Docs: http://{config.HOST}:{config.PORT}/docs")
    logger.info(f"  🤖 Bot: {'Включён' if HAS_AIOGRAM else 'Отключён'}")
    logger.info(f"  🗄️ DB: {'SQLAlchemy' if HAS_SQLALCHEMY else 'In-Memory'}")
    logger.info(f"  📮 Celery: {'Включён' if HAS_CELERY else 'Отключён'}")
    logger.info("=" * 60)

    tasks = []

    # Запуск FastAPI
    if HAS_FASTAPI:
        import uvicorn
        uvicorn_config = uvicorn.Config(
            app=app,
            host=config.HOST,
            port=config.PORT,
            log_level="info" if not config.DEBUG else "debug",
        )
        server = uvicorn.Server(uvicorn_config)
        tasks.append(server.serve())

    # Запуск бота
    if HAS_AIOGRAM and config.BOT_TOKEN != "YOUR_BOT_TOKEN_HERE":
        logger.info("🤖 Запуск Telegram бота...")
        tasks.append(dp.start_polling(bot))
    else:
        logger.warning("⚠️ BOT_TOKEN не задан. Бот не запущен.")

    if tasks:
        await asyncio.gather(*tasks)
    else:
        logger.error("Нет сервисов для запуска. Установите FastAPI или aiogram.")


if __name__ == "__main__":
    print("""
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🍔🍕🍣  FOODCHAIN — Ресторанная экосистема  🍰🥤🍝        ║
║                                                               ║
║   Запуск: python bot.py                                       ║
║                                                               ║
║   Для генерации файлов инфраструктуры:                       ║
║     python bot.py --generate-files                            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    """)

    if "--generate-files" in sys.argv:
        # Генерация файлов инфраструктуры
        files = {
            "Dockerfile": DOCKERFILE,
            "docker-compose.yml": DOCKER_COMPOSE,
            "requirements.txt": REQUIREMENTS,
            ".env.example": ENV_TEMPLATE,
        }
        for filename, content in files.items():
            with open(filename, "w") as f:
                f.write(content.strip() + "\n")
            print(f"  ✅ {filename}")
        print("\nФайлы сгенерированы! Настройте .env и запустите:")
        print("  docker-compose up --build")
    else:
        try:
            asyncio.run(main())
        except KeyboardInterrupt:
            logger.info("🛑 Сервер остановлен")
