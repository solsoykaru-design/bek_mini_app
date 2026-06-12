import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { CartItem, Dish, GuestPage, AdminPage, UserRole, Order, Booking, Table, PurchaseOrder, Supplier, Review, PickupPoint, PickupPointReview } from './types';
import { tables as initialTables, suppliers as initialSuppliers, pickupPoints as initialPickupPoints, pickupPointReviews as initialPickupPointReviews } from './data';
import type { Order as _Order, Booking as _Booking, Review as _Review, PurchaseOrder as _PO } from './types';
const initialOrders: _Order[] = [];
const initialBookings: _Booking[] = [];
const initialReviews: _Review[] = [];
const initialPurchaseOrders: _PO[] = [];

export interface DeliveryAddress {
  id: number;
  label: string;        // Дом, Работа, Другое
  city: string;
  street: string;
  house: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  intercom?: string;
  comment?: string;
  isDefault: boolean;
}

export interface RegisteredUser {
  id: number;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  registeredAt: string;
  source: 'telegram' | 'mobile_app' | 'website';
  bonusBalance?: number;
  totalSpent?: number;
  visitsCount?: number;
  lastVisitAt?: string;
  loyaltyLevel?: 'newbie' | 'silver' | 'gold' | 'platinum';
  addresses?: DeliveryAddress[];
  verifiedPhone?: boolean;
}

export interface ClientChatMessage {
  id: number;
  fromAdmin: boolean;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export type NotifType = 'order' | 'booking' | 'client' | 'stock' | 'review' | 'system';

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: string;   // ISO
  isRead: boolean;
  link?: string;       // на какую страницу вести (adminPage)
  meta?: Record<string, string | number>;
}

interface AppState {
  // Режим приложения
  mode: 'guest' | 'admin';
  setMode: (m: 'guest' | 'admin') => void;
  // Тема
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  // Навигация
  guestPage: GuestPage;
  setGuestPage: (p: GuestPage) => void;
  adminPage: AdminPage;
  setAdminPage: (p: AdminPage) => void;
  // Филиал
  selectedBranch: number;
  setSelectedBranch: (b: number) => void;
  // Корзина
  cart: CartItem[];
  addToCart: (dish: Dish, qty: number, options?: { [k: number]: number[] }) => void;
  removeFromCart: (dishId: number) => void;
  updateCartQty: (dishId: number, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  // Промокод
  promoCode: string;
  setPromoCode: (c: string) => void;
  promoDiscount: number;
  applyPromo: () => void;
  // Избранное
  favorites: number[];
  toggleFavorite: (dishId: number) => void;
  // Выбранное блюдо (для детальной страницы)
  selectedDish: Dish | null;
  setSelectedDish: (d: Dish | null) => void;
  // Заказы (мок)
  orders: Order[];
  updateOrderStatus: (orderId: number, status: Order['status']) => void;
  updateOrder: (orderId: number, data: Partial<Order>) => void;
  // Бронирования
  bookings: Booking[];
  addBooking: (b: Booking) => void;
  updateBookingStatus: (id: number, status: Booking['status']) => void;
  // Столики
  tables: Table[];
  updateTableStatus: (id: number, status: Table['status']) => void;
  // Роль админа
  adminRole: UserRole;
  setAdminRole: (r: UserRole) => void;
  // Поиск
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  // Отзывы
  reviews: Review[];
  addReview: (r: Omit<Review, 'id' | 'createdAt' | 'isModerated' | 'isVisible'>) => void;
  approveReview: (id: number) => void;
  rejectReview: (id: number) => void;
  replyReview: (id: number, reply: string) => void;
  // Зарегистрированные пользователи (гости)
  registeredUsers: RegisteredUser[];
  registerUser: (name: string, phone: string, source: RegisteredUser['source']) => void;
  getNewCustomersCount: (dateFrom: string, dateTo: string) => number;
  updateUserBonus: (userId: number, amount: number) => void;
  addAddress: (userId: number, address: DeliveryAddress) => void;
  updateAddress: (userId: number, addressId: number, data: Partial<DeliveryAddress>) => void;
  deleteAddress: (userId: number, addressId: number) => void;
  // Чат с клиентами (CRM)
  clientChats: Record<number, ClientChatMessage[]>;
  sendMessageToClient: (userId: number, text: string) => void;
  // Создание заказа от имени клиента
  addOrder: (order: Order) => void;
  // Бонусы
  bonusBalance: number;
  // Поставщики
  suppliers: Supplier[];
  addSupplier: (s: Supplier) => void;
  updateSupplier: (id: number, data: Partial<Supplier>) => void;
  deleteSupplier: (id: number) => void;
  // Точки самовывоза / филиалы
  pickupPoints: PickupPoint[];
  addPickupPoint: (point: PickupPoint) => void;
  updatePickupPoint: (id: number, data: Partial<PickupPoint>) => void;
  deletePickupPoint: (id: number) => void;
  reorderPickupPoint: (id: number, direction: 'up' | 'down') => void;
  togglePickupPointActive: (id: number) => void;
  pickupPointReviews: PickupPointReview[];
  addPickupPointReview: (review: Omit<PickupPointReview, 'id' | 'createdAt' | 'isModerated' | 'isVisible'>) => void;
  approvePickupPointReview: (id: number) => void;
  rejectPickupPointReview: (id: number) => void;
  replyPickupPointReview: (id: number, reply: string) => void;
  // Заявки на закупку
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePurchaseOrderStatus: (id: number, status: PurchaseOrder['status']) => void;
  deletePurchaseOrder: (id: number) => void;
  // Уведомления
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'guest' | 'admin'>('guest');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [guestPage, setGuestPage] = useState<GuestPage>('home');
  const [adminPage, setAdminPage] = useState<AdminPage>('dashboard');
  const [selectedBranch, setSelectedBranch] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([1, 8, 16]);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  // ── Персистентность: загрузка из localStorage при старте ──
  const loadLS = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(`foodchain_${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  };

  const [ordersState, setOrders] = useState<Order[]>(() => loadLS('orders', initialOrders));
  const [bookingsState, setBookings] = useState<Booking[]>(() => loadLS('bookings', initialBookings));
  const [tablesState, setTables] = useState<Table[]>(initialTables);
  const [adminRole, setAdminRole] = useState<UserRole>('superadmin');
  const [searchQuery, setSearchQuery] = useState('');
  const [bonusBalance] = useState(1250);
  const [notifications, setNotifications] = useState<Notification[]>(() => loadLS('notifications', []));
  const [purchaseOrdersState, setPurchaseOrders] = useState<PurchaseOrder[]>(() => loadLS('purchaseOrders', initialPurchaseOrders));
  const [suppliersState, setSuppliers] = useState<Supplier[]>(() => loadLS('suppliers', initialSuppliers));
  const [reviewsState, setReviews] = useState<Review[]>(() => loadLS('reviews', initialReviews));
  const [pickupPointsState, setPickupPoints] = useState<PickupPoint[]>(() => loadLS('pickupPoints', initialPickupPoints));
  const [pickupPointReviewsState, setPickupPointReviews] = useState<PickupPointReview[]>(() => loadLS('pickupPointReviews', initialPickupPointReviews));

  const addReview = useCallback((r: Omit<Review, 'id' | 'createdAt' | 'isModerated' | 'isVisible'>) => {
    const newReview: Review = {
      ...r, id: Date.now(),
      createdAt: new Date().toISOString(),
      isModerated: false, isVisible: true,
    };
    setReviews(prev => [newReview, ...prev]);
  }, []);

  const approveReview = useCallback((id: number) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, isModerated: true, isVisible: true } : r));
  }, []);

  const rejectReview = useCallback((id: number) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, isModerated: true, isVisible: false } : r));
  }, []);

  const replyReview = useCallback((id: number, reply: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, reply } : r));
  }, []);
  // Клиенты — загружаются из localStorage (регистрация сохраняется навсегда)
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => loadLS('registeredUsers', []));
  let _userIdCounter = Date.now() % 100000;

  // ── Автосохранение в localStorage при каждом изменении ──
  useEffect(() => { try { localStorage.setItem('foodchain_registeredUsers', JSON.stringify(registeredUsers)); } catch {} }, [registeredUsers]);
  useEffect(() => { try { localStorage.setItem('foodchain_orders', JSON.stringify(ordersState)); } catch {} }, [ordersState]);
  useEffect(() => { try { localStorage.setItem('foodchain_bookings', JSON.stringify(bookingsState)); } catch {} }, [bookingsState]);
  useEffect(() => { try { localStorage.setItem('foodchain_reviews', JSON.stringify(reviewsState)); } catch {} }, [reviewsState]);
  useEffect(() => { try { localStorage.setItem('foodchain_notifications', JSON.stringify(notifications)); } catch {} }, [notifications]);
  useEffect(() => { try { localStorage.setItem('foodchain_purchaseOrders', JSON.stringify(purchaseOrdersState)); } catch {} }, [purchaseOrdersState]);
  useEffect(() => { try { localStorage.setItem('foodchain_suppliers', JSON.stringify(suppliersState)); } catch {} }, [suppliersState]);
  useEffect(() => { try { localStorage.setItem('foodchain_pickupPoints', JSON.stringify(pickupPointsState)); } catch {} }, [pickupPointsState]);
  useEffect(() => { try { localStorage.setItem('foodchain_pickupPointReviews', JSON.stringify(pickupPointReviewsState)); } catch {} }, [pickupPointReviewsState]);

  const registerUser = useCallback((name: string, phone: string, source: RegisteredUser['source']) => {
    _userIdCounter++;
    const newUser: RegisteredUser = {
      id: _userIdCounter, name, phone,
      email: `${name.toLowerCase().split(' ')[0]}@mail.ru`,
      birthday: '1990-01-01',
      registeredAt: new Date().toISOString(),
      source,
      bonusBalance: 0,
      totalSpent: 0,
      visitsCount: 1,
      lastVisitAt: new Date().toISOString(),
      loyaltyLevel: 'newbie',
    };
    setRegisteredUsers(prev => [newUser, ...prev]);
  }, []);

  const getNewCustomersCount = useCallback((dateFrom: string, dateTo: string) => {
    return registeredUsers.filter(u => {
      const d = u.registeredAt.slice(0, 10);
      return d >= dateFrom && d <= dateTo;
    }).length;
  }, [registeredUsers]);

  // ── Начисление бонусов клиенту (реальное время) ──
  const updateUserBonus = useCallback((userId: number, amount: number) => {
    setRegisteredUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, bonusBalance: Math.max(0, (u.bonusBalance || 0) + amount) } : u
    ));
  }, []);

  // ── Чат с клиентами (CRM) ──
  const [clientChats, setClientChats] = useState<Record<number, ClientChatMessage[]>>({});
  let _chatMsgId = Date.now();

  const sendMessageToClient = useCallback((userId: number, text: string) => {
    const msg: ClientChatMessage = {
      id: ++_chatMsgId,
      fromAdmin: true,
      text,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setClientChats(prev => ({ ...prev, [userId]: [...(prev[userId] || []), msg] }));

    // Симуляция ответа клиента через 3-8 сек (в реальном проекте — WebSocket от бота)
    const replies = [
      'Спасибо большое! 😊',
      'Хорошо, понял(а), спасибо!',
      'Ого, как приятно! Спасибо!',
      'Да, конечно, буду ждать!',
      'Отлично, спасибо за заботу! ❤️',
      'Супер! Вы лучшие!',
    ];
    setTimeout(() => {
      const reply: ClientChatMessage = {
        id: ++_chatMsgId,
        fromAdmin: false,
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setClientChats(prev => ({ ...prev, [userId]: [...(prev[userId] || []), reply] }));
    }, 3000 + Math.random() * 5000);
  }, []);

  // ── Создание заказа от имени клиента ──
  const addOrder = useCallback((order: Order) => {
    const withHistory: Order = {
      ...order,
      pickupCode: order.pickupCode || String(order.id).slice(-4).padStart(4, '0'),
      statusHistory: order.statusHistory || [{ status: order.status, at: order.createdAt || new Date().toISOString(), note: 'Заказ создан' }],
    };
    setOrders(prev => [withHistory, ...prev]);
  }, []);

  const addAddress = useCallback((userId: number, address: DeliveryAddress) => {
    setRegisteredUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const existing = u.addresses || [];
      const newAddr = address.isDefault
        ? existing.map(a => ({ ...a, isDefault: false }))
        : existing;
      return { ...u, addresses: [...newAddr, address] };
    }));
  }, []);

  const updateAddress = useCallback((userId: number, addressId: number, data: Partial<DeliveryAddress>) => {
    setRegisteredUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return { ...u, addresses: (u.addresses || []).map(a => a.id === addressId ? { ...a, ...data } : a) };
    }));
  }, []);

  const deleteAddress = useCallback((userId: number, addressId: number) => {
    setRegisteredUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return { ...u, addresses: (u.addresses || []).filter(a => a.id !== addressId) };
    }));
  }, []);

  const toggleTheme = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), []);

  const addToCart = useCallback((dish: Dish, qty: number, options?: { [k: number]: number[] }) => {
    setCart(prev => {
      const existing = prev.find(i => i.dish.id === dish.id);
      let extraPrice = 0;
      if (options && dish.customizations) {
        Object.entries(options).forEach(([custId, optIds]) => {
          const cust = dish.customizations?.find(c => c.id === Number(custId));
          if (cust) {
            optIds.forEach(optId => {
              const opt = cust.options.find(o => o.id === optId);
              if (opt) extraPrice += opt.price;
            });
          }
        });
      }
      if (existing) {
        return prev.map(i => i.dish.id === dish.id ? { ...i, quantity: i.quantity + qty, totalPrice: (dish.price + extraPrice) * (i.quantity + qty), selectedOptions: options || i.selectedOptions } : i);
      }
      return [...prev, { dish, quantity: qty, selectedOptions: options || {}, totalPrice: (dish.price + extraPrice) * qty }];
    });
  }, []);

  const removeFromCart = useCallback((dishId: number) => {
    setCart(prev => prev.filter(i => i.dish.id !== dishId));
  }, []);

  const updateCartQty = useCallback((dishId: number, qty: number) => {
    if (qty <= 0) { removeFromCart(dishId); return; }
    setCart(prev => prev.map(i => {
      if (i.dish.id !== dishId) return i;
      let extraPrice = 0;
      if (i.selectedOptions && i.dish.customizations) {
        Object.entries(i.selectedOptions).forEach(([custId, optIds]) => {
          const cust = i.dish.customizations?.find(c => c.id === Number(custId));
          if (cust) {
            optIds.forEach(optId => {
              const opt = cust.options.find(o => o.id === optId);
              if (opt) extraPrice += opt.price;
            });
          }
        });
      }
      return { ...i, quantity: qty, totalPrice: (i.dish.price + extraPrice) * qty };
    }));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, i) => sum + i.totalPrice, 0);

  const applyPromo = useCallback(() => {
    if (promoCode.toUpperCase() === 'FIRST100') {
      setPromoDiscount(100);
    } else if (promoCode.toUpperCase() === 'PIZZA20') {
      setPromoDiscount(Math.round(cartTotal * 0.2));
    } else if (promoCode.toUpperCase() === 'VIP500') {
      setPromoDiscount(500);
    } else {
      setPromoDiscount(0);
    }
  }, [promoCode, cartTotal]);

  const toggleFavorite = useCallback((dishId: number) => {
    setFavorites(prev => prev.includes(dishId) ? prev.filter(id => id !== dishId) : [...prev, dishId]);
  }, []);

  const updateOrderStatus = useCallback((orderId: number, status: Order['status']) => {
    const now = new Date().toISOString();
    const labels: Record<Order['status'], string> = {
      new: 'Новый', accepted: 'Принят', preparing: 'Готовится', ready: 'Готов',
      delivering: 'В доставке', delivered: 'Доставлен/Выдан', cancelled: 'Отменён'
    };
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        status,
        updatedAt: now,
        statusHistory: [
          ...(o.statusHistory || [{ status: o.status, at: o.createdAt, note: 'Заказ создан' }]),
          { status, at: now, note: labels[status] },
        ],
      };
    }));
    setNotifications(prev => [{
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      type: 'order' as const,
      title: `Статус заказа #${orderId}: ${labels[status]}`,
      body: 'Клиент получил push-уведомление, статус обновился в приложении.',
      link: 'orders',
      timestamp: now,
      isRead: false,
      meta: { orderId },
    }, ...prev].slice(0, 50));
  }, []);

  const updateOrder = useCallback((orderId: number, data: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...data, updatedAt: new Date().toISOString() } : o));
  }, []);

  const addBooking = useCallback((b: Booking) => {
    setBookings(prev => [...prev, b]);
  }, []);

  const updateBookingStatus = useCallback((id: number, status: Booking['status']) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  }, []);

  const updateTableStatus = useCallback((id: number, status: Table['status']) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }, []);

  const addSupplier = useCallback((s: Supplier) => {
    setSuppliers(prev => [...prev, s]);
  }, []);

  const updateSupplier = useCallback((id: number, data: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }, []);

  const deleteSupplier = useCallback((id: number) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }, []);

  const addPickupPoint = useCallback((point: PickupPoint) => {
    setPickupPoints(prev => [...prev, point].sort((a, b) => a.displayOrder - b.displayOrder));
  }, []);

  const updatePickupPoint = useCallback((id: number, data: Partial<PickupPoint>) => {
    setPickupPoints(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
  }, []);

  const deletePickupPoint = useCallback((id: number) => {
    setPickupPoints(prev => prev.filter(p => p.id !== id));
  }, []);

  const reorderPickupPoint = useCallback((id: number, direction: 'up' | 'down') => {
    setPickupPoints(prev => {
      const sorted = [...prev].sort((a, b) => a.displayOrder - b.displayOrder);
      const i = sorted.findIndex(p => p.id === id);
      const j = direction === 'up' ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= sorted.length) return prev;
      const a = sorted[i], b = sorted[j];
      sorted[i] = { ...b, displayOrder: a.displayOrder };
      sorted[j] = { ...a, displayOrder: b.displayOrder };
      return sorted;
    });
  }, []);

  const togglePickupPointActive = useCallback((id: number) => {
    setPickupPoints(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p));
  }, []);

  const addPickupPointReview = useCallback((review: Omit<PickupPointReview, 'id' | 'createdAt' | 'isModerated' | 'isVisible'>) => {
    const newReview: PickupPointReview = {
      ...review,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      isModerated: false,
      isVisible: true,
    };
    setPickupPointReviews(prev => [newReview, ...prev]);
  }, []);

  const approvePickupPointReview = useCallback((id: number) => {
    setPickupPointReviews(prev => prev.map(r => r.id === id ? { ...r, isModerated: true, isVisible: true } : r));
  }, []);

  const rejectPickupPointReview = useCallback((id: number) => {
    setPickupPointReviews(prev => prev.map(r => r.id === id ? { ...r, isModerated: true, isVisible: false } : r));
  }, []);

  const replyPickupPointReview = useCallback((id: number, reply: string) => {
    setPickupPointReviews(prev => prev.map(r => r.id === id ? { ...r, reply } : r));
  }, []);

  const addPurchaseOrder = useCallback((po: PurchaseOrder) => {
    setPurchaseOrders(prev => [po, ...prev]);
  }, []);

  const updatePurchaseOrderStatus = useCallback((id: number, status: PurchaseOrder['status']) => {
    setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status, updatedAt: new Date().toISOString() } : po));
  }, []);

  const deletePurchaseOrder = useCallback((id: number) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== id));
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const full: Notification = {
      ...n,
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications(prev => [full, ...prev].slice(0, 50));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  // ── Реальные системные уведомления (проверка остатков склада) ──────────
  const liveRef = useRef({ addNotification });
  liveRef.current = { addNotification };

  useEffect(() => {
    // Проверяем низкие остатки один раз при загрузке
    import('./data').then(({ ingredients: ingData }) => {
      const lowStock = ingData.filter((i: any) => i.currentStock <= i.minStock);
      if (lowStock.length > 0) {
        const names = lowStock.slice(0, 3).map((i: any) => `${i.name}: ${i.currentStock} ${i.unit}`).join(', ');
        liveRef.current.addNotification({
          type: 'stock',
          title: `⚠️ Низкий остаток: ${lowStock.length} позиций`,
          body: names,
          link: 'inventory',
        });
      }
    });
  }, []);
  // ────────────────────────────────────────────────────────────────────────

  return (
    <AppContext.Provider value={{
      mode, setMode, theme, toggleTheme, guestPage, setGuestPage, adminPage, setAdminPage,
      selectedBranch, setSelectedBranch, cart, addToCart, removeFromCart, updateCartQty, clearCart, cartTotal,
      promoCode, setPromoCode, promoDiscount, applyPromo, favorites, toggleFavorite,
      selectedDish, setSelectedDish, orders: ordersState, updateOrderStatus, updateOrder,
      bookings: bookingsState, addBooking, updateBookingStatus, tables: tablesState, updateTableStatus,
      adminRole, setAdminRole, searchQuery, setSearchQuery, bonusBalance,
      reviews: reviewsState, addReview, approveReview, rejectReview, replyReview,
      registeredUsers, registerUser, getNewCustomersCount, updateUserBonus,
      addAddress, updateAddress, deleteAddress,
      clientChats, sendMessageToClient, addOrder,
      suppliers: suppliersState, addSupplier, updateSupplier, deleteSupplier,
      pickupPoints: pickupPointsState,
      addPickupPoint, updatePickupPoint, deletePickupPoint, reorderPickupPoint, togglePickupPointActive,
      pickupPointReviews: pickupPointReviewsState,
      addPickupPointReview, approvePickupPointReview, rejectPickupPointReview, replyPickupPointReview,
      purchaseOrders: purchaseOrdersState, addPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder,
      notifications, unreadCount: notifications.filter(n => !n.isRead).length,
      addNotification, markAllRead, markRead, clearNotifications,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
