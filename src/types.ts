// ==================== ТИПЫ ДАННЫХ ЭКОСИСТЕМЫ ====================

// --- Роли ---
export type UserRole = 'guest' | 'superadmin' | 'owner' | 'manager' | 'chef' | 'waiter' | 'courier' | 'accountant' | 'analyst';

export interface User {
  id: number;
  telegramId: number;
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
  role: UserRole;
  branchId?: number;
  avatarUrl?: string;
  loyaltyLevel: 'newbie' | 'silver' | 'gold' | 'platinum';
  bonusBalance: number;
  referralCode: string;
  createdAt: string;
}

// --- Филиал ---
export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  workingHours: { [day: string]: { open: string; close: string } };
  isActive: boolean;
}

// --- Точки самовывоза (единый источник для филиалов в гостевом и админском приложении) ---
export interface PickupPointPhoto {
  id: number;
  url: string;
  name: string;
  isMain: boolean;
  order: number;
}

export interface PickupPointWorkingHours {
  [day: string]: { open: string; close: string; isClosed?: boolean };
}

export interface PickupPoint {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  description?: string;
  workingHours: PickupPointWorkingHours;
  photos: PickupPointPhoto[];
  rating: number;
  reviewCount: number;
  estimatedReadyMinutes: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PickupPointReview {
  id: number;
  pickupPointId: number;
  userId: number;
  userName: string;
  rating: number;
  text: string;
  source: ReviewSource;
  isModerated: boolean;
  isVisible: boolean;
  reply?: string;
  createdAt: string;
}

// --- Категория меню ---
export interface MenuCategory {
  id: number;
  name: string;
  icon: string;
  parentId?: number;
  order: number;
  branchId?: number;
}

// --- Аллерген ---
export interface Allergen {
  id: number;
  name: string;
  icon: string;
}

// --- Блюдо ---
export interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  imageUrl: string;
  categoryId: number;
  weight: number;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  allergens: string[];
  tags: string[];
  isAvailable: boolean;
  isNew: boolean;
  isPopular: boolean;
  branchId?: number;
  ingredients?: DishIngredient[];
  customizations?: Customization[];
  rating: number;
  reviewCount: number;
}

export interface DishIngredient {
  id: number;
  ingredientId: number;
  name: string;
  quantity: number;
  unit: string;
  isOptional: boolean;
  extraPrice: number;
}

export interface Customization {
  id: number;
  name: string;
  options: CustomizationOption[];
  required: boolean;
  multiple: boolean;
}

export interface CustomizationOption {
  id: number;
  name: string;
  price: number;
  isDefault: boolean;
}

// --- Корзина ---
export interface CartItem {
  dish: Dish;
  quantity: number;
  selectedOptions: { [customizationId: number]: number[] };
  totalPrice: number;
  comment?: string;
}

// --- Заказ ---
export type OrderType = 'delivery' | 'pickup' | 'dine_in';
export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
export type PaymentMethod = 'telegram_stars' | 'yukassa' | 'tinkoff' | 'cash' | 'card';

export interface Order {
  id: number;
  userId: number;
  userName: string;
  userPhone: string;
  branchId: number;
  branchName: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  bonusUsed: number;
  total: number;
  promoCode?: string;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  address?: string;
  deliveryTime?: string;
  tableNumber?: number;
  courierId?: number;
  courierName?: string;
  comment?: string;
  statusHistory?: { status: OrderStatus; at: string; note?: string }[];
  pickupCode?: string;
  courierLat?: number;
  courierLng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  dishId: number;
  name: string;
  price: number;
  quantity: number;
  options: string[];
}

// --- Бронирование ---
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: number;
  userId: number;
  userName: string;
  userPhone: string;
  branchId: number;
  date: string;
  time: string;
  duration: number;
  guestCount: number;
  tableId: number;
  tableName: string;
  status: BookingStatus;
  deposit: number;
  comment?: string;
  createdAt: string;
}

export interface Table {
  id: number;
  branchId: number;
  name: string;
  capacity: number;
  zone: string;
  x: number;
  y: number;
  status: 'free' | 'reserved' | 'occupied';
}

// --- Склад ---
export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  pricePerUnit: number;
  currentStock: number;
  minStock: number;
  supplierId?: number;
  expiryDate?: string;
  branchId: number;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface PurchaseOrderItem {
  ingredientId: number;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
}

export interface PurchaseOrder {
  id: number;
  supplierId: number;
  supplierName: string;
  branchId: number;
  branchName: string;
  items: PurchaseOrderItem[];
  total: number;
  status: 'draft' | 'sent' | 'delivered' | 'cancelled';
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// --- Промокод ---
export interface PromoCode {
  id: number;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  branchId?: number;
  dishId?: number;
  isActive: boolean;
}

// --- Сотрудник ---
export interface Staff {
  id: number;
  telegramId: number;
  firstName: string;
  lastName: string;
  role: UserRole;
  branchId: number;
  branchName: string;
  phone: string;
  hourlyRate: number;
  isActive: boolean;
  kpiScore: number;
  ordersHandled: number;
  avgRating: number;
}

// --- Отзыв ---
export type ReviewSource = 'mobile_app' | 'website' | 'telegram';

export interface Review {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  dishId: number;
  dishName: string;
  branchId?: number;
  branchName?: string;
  rating: number;
  text: string;
  photoUrl?: string;
  isModerated: boolean;
  isVisible: boolean;
  reply?: string;
  source: ReviewSource;
  createdAt: string;
}

// --- Смена ---
export interface Shift {
  id: number;
  staffId: number;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  branchId: number;
  isConfirmed: boolean;
}

// --- Лог аудита ---
export interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  details: string;
  ip?: string;
  createdAt: string;
}

// --- Зона доставки ---
export interface DeliveryZone {
  id: number;
  branchId: number;
  name: string;
  radiusKm: number;
  minOrder: number;
  deliveryPrice: number;
  estimatedTime: number;
}

// --- Рассылка ---
export interface Campaign {
  id: number;
  name: string;
  type: 'manual' | 'trigger';
  triggerType?: 'inactive' | 'birthday' | 'after_review';
  message: string;
  buttonText?: string;
  sentCount: number;
  openCount: number;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
}

// --- Настройки ---
export interface AppSettings {
  networkName: string;
  logoUrl: string;
  phone: string;
  socials: { telegram?: string; instagram?: string; vk?: string };
  deliveryEnabled: boolean;
  bookingEnabled: boolean;
  loyaltyEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  welcomeMessage: string;
  errorMessage: string;
}

// --- Сообщение чата ---
export interface ChatMessage {
  id: number;
  fromUser: boolean;
  text: string;
  timestamp: string;
}

// --- Навигация ---
export type GuestPage = 'home' | 'menu' | 'dish' | 'cart' | 'checkout' | 'booking' | 'profile' | 'orders' | 'loyalty' | 'reviews' | 'support' | 'order-tracking';
export type AdminPage = 'dashboard' | 'orders' | 'menu' | 'bookings' | 'inventory' | 'delivery' | 'finance' | 'marketing' | 'staff' | 'settings' | 'audit' | 'kitchen' | 'reviews' | 'clients' | 'pickup_points';
