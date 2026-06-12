import { useState, useEffect } from 'react';
import { useApp } from '../context';
import type { Notification as AppNotification } from '../context';
type N = Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>;
const n = (type: AppNotification['type'], title: string, body: string, link?: string): N => ({ type, title, body, link });
import { dishes, categories, branches, staffList, ingredients, promoCodes, shifts, auditLogs, deliveryZones, campaigns } from '../data';
import _DashboardPage from './DashboardPage';
import ClientsPage from './ClientsPage';
import _OrdersPage from './OrdersPage';
import PickupPointsPage from './PickupPointsPage';
import CourierApp from '../courier/CourierApp';
import { AdminPage, UserRole, Order } from '../types';
import type { RegisteredUser } from '../context';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { LayoutDashboard, ShoppingBag, BookOpen, CalendarDays, Warehouse, Truck, DollarSign, Megaphone, UsersRound, Users, Settings, Shield, ChefHat, Plus, Search, Edit, Trash2, Check, X, ChevronDown, ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, Bell, Moon, Sun, LogOut, Package, MapPin, Star, Download, Upload, MoreVertical, Pause, UserPlus, Activity, MessageSquare, Reply } from 'lucide-react';

// ===================== АДМИН ПРИЛОЖЕНИЕ =====================
export default function AdminApp() {
  const { adminPage } = useApp();
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64">
        <TopBar />
        <div className="p-4 md:p-6">
          {adminPage === 'dashboard' && <DashboardPage />}
          {adminPage === 'orders' && <_OrdersPage />}
          {adminPage === 'menu' && <MenuManagePage />}
          {adminPage === 'bookings' && <BookingsPage />}
          {adminPage === 'inventory' && <InventoryPage />}
          {adminPage === 'delivery' && <DeliveryPage />}
          {adminPage === 'finance' && <FinancePage />}
          {adminPage === 'marketing' && <MarketingPage />}
          {adminPage === 'staff' && <StaffPage />}
          {adminPage === 'settings' && <SettingsPage />}
          {adminPage === 'audit' && <AuditPage />}
          {adminPage === 'kitchen' && <KitchenPage />}
          {adminPage === 'reviews' && <ReviewsAdminPage />}
          {adminPage === 'clients' && <ClientsPage />}
          {adminPage === 'pickup_points' && <PickupPointsPage />}
          {adminPage === 'courier' && <CourierApp />}
        </div>
      </main>
    </div>
  );
}

// ===================== SIDEBAR =====================
function Sidebar() {
  const { adminPage, setAdminPage, adminRole, orders, bookings, reviews, registeredUsers } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Живые счётчики и индикаторы ──
  const newOrders = orders.filter(o => o.status === 'new').length;
  const activeOrders = orders.filter(o => ['new','accepted','preparing','ready'].includes(o.status)).length;
  const preparingOrders = orders.filter(o => o.status === 'accepted' || o.status === 'preparing').length;
  const deliveringOrders = orders.filter(o => o.status === 'delivering' || o.status === 'ready').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const pendingReviews = reviews.filter(r => !r.isModerated).length;
  // Опоздавшие заказы: больше 30 мин со статусом new/accepted
  const now = Date.now();
  const lateOrders = orders.filter(o => {
    if (o.status !== 'new' && o.status !== 'accepted') return false;
    return (now - new Date(o.createdAt).getTime()) > 30 * 60 * 1000;
  }).length;

  type BadgeInfo = { count: number; color: string; pulse?: boolean } | null;

  const getBadge = (id: AdminPage): BadgeInfo => {
    switch (id) {
      case 'orders':
        if (lateOrders > 0) return { count: activeOrders, color: 'bg-red-500', pulse: true };
        if (newOrders > 0) return { count: activeOrders, color: 'bg-green-500', pulse: true };
        if (activeOrders > 0) return { count: activeOrders, color: 'bg-blue-500' };
        return null;
      case 'kitchen':
        if (preparingOrders > 0) return { count: preparingOrders, color: 'bg-amber-500', pulse: true };
        return null;
      case 'delivery':
        if (deliveringOrders > 0) return { count: deliveringOrders, color: 'bg-purple-500', pulse: true };
        return null;
      case 'bookings':
        if (pendingBookings > 0) return { count: pendingBookings, color: 'bg-amber-500' };
        return null;
      case 'reviews':
        if (pendingReviews > 0) return { count: pendingReviews, color: 'bg-orange-500' };
        return null;
      case 'clients':
        if (registeredUsers.length > 0) return { count: registeredUsers.length, color: 'bg-indigo-500' };
        return null;
      default: return null;
    }
  };

  type MenuItem = { id: AdminPage; icon: any; label: string; roles: UserRole[] };
  const menu: MenuItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Дашборд', roles: ['superadmin', 'owner', 'manager', 'analyst'] },
    { id: 'orders', icon: ShoppingBag, label: 'Заказы', roles: ['superadmin', 'owner', 'manager', 'waiter'] },
    { id: 'kitchen', icon: ChefHat, label: 'Кухня', roles: ['superadmin', 'chef', 'manager'] },
    { id: 'menu', icon: BookOpen, label: 'Меню', roles: ['superadmin', 'owner', 'manager', 'chef'] },
    { id: 'bookings', icon: CalendarDays, label: 'Бронирования', roles: ['superadmin', 'owner', 'manager', 'waiter'] },
    { id: 'inventory', icon: Warehouse, label: 'Склад', roles: ['superadmin', 'manager', 'chef'] },
    { id: 'delivery', icon: Truck, label: 'Доставка', roles: ['superadmin', 'manager', 'courier'] },
    { id: 'pickup_points', icon: MapPin, label: 'Точки самовывоза', roles: ['superadmin', 'owner', 'manager'] },
    { id: 'finance', icon: DollarSign, label: 'Финансы', roles: ['superadmin', 'owner', 'accountant', 'analyst'] },
    { id: 'marketing', icon: Megaphone, label: 'Маркетинг', roles: ['superadmin', 'owner', 'manager'] },
    { id: 'clients', icon: Users, label: 'Клиенты', roles: ['superadmin', 'owner', 'manager', 'analyst'] },
    { id: 'reviews', icon: MessageSquare, label: 'Отзывы', roles: ['superadmin', 'owner', 'manager', 'analyst'] },
    { id: 'staff', icon: UsersRound, label: 'Персонал', roles: ['superadmin', 'owner', 'manager'] },
    { id: 'settings', icon: Settings, label: 'Настройки', roles: ['superadmin', 'owner'] },
    { id: 'audit', icon: Shield, label: 'Безопасность', roles: ['superadmin'] },
  ];

  const filtered = menu.filter(m => m.roles.includes(adminRole));

  // Если пользователь — курьер, показываем только курьерский интерфейс
  if (adminRole === 'courier') {
    return <CourierApp />;
  }

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl shadow-lg flex items-center justify-center">
        <LayoutDashboard size={20} className="text-zinc-700 dark:text-zinc-200" />
      </button>
      
      {/* Overlay */}
      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="md:hidden fixed inset-0 bg-black/50 z-40" />}
      
      <aside className={`fixed top-0 left-0 h-full z-40 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${collapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">F</div>
          {!collapsed && <span className="font-bold text-zinc-900 dark:text-white">FoodChain Admin</span>}
        </div>

        {/* Menu items */}
        <nav className="mt-4 px-3 space-y-1">
          {filtered.map(item => {
            const badge = getBadge(item.id);
            return (
              <button key={item.id} onClick={() => { setAdminPage(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${adminPage === item.id ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                <div className="relative">
                  <item.icon size={20} />
                  {/* Точка-индикатор рядом с иконкой (для collapsed режима) */}
                  {badge && collapsed && (
                    <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${badge.color} ${badge.pulse ? 'animate-pulse' : ''} border-2 border-white dark:border-zinc-900`} />
                  )}
                </div>
                {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                {!collapsed && badge && (
                  <span className={`${badge.color} text-white text-[10px] min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center font-bold ${badge.pulse ? 'animate-pulse' : ''}`}>
                    {badge.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse button */}
        <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex absolute bottom-4 left-3 right-3 items-center justify-center py-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">
          {collapsed ? '→' : '← Свернуть'}
        </button>
      </aside>
    </>
  );
}

// ===================== TOP BAR =====================
function TopBar() {
  const { theme, toggleTheme, setMode, setAdminPage, adminPage, adminRole, notifications, unreadCount, markAllRead, markRead, clearNotifications } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);

  const pageNames: Record<AdminPage, string> = {
    dashboard: 'Дашборд', orders: 'Заказы', menu: 'Управление меню', bookings: 'Бронирования',
    inventory: 'Склад', delivery: 'Доставка', finance: 'Финансы', marketing: 'Маркетинг',
    staff: 'Персонал', settings: 'Настройки', audit: 'Безопасность', kitchen: 'Кухня',
    reviews: 'Отзывы', clients: 'Клиенты', pickup_points: 'Точки самовывоза'
  };
  const roleNames: Record<UserRole, string> = {
    guest: 'Гость', superadmin: 'Суперадмин', owner: 'Владелец', manager: 'Управляющий',
    chef: 'Шеф-повар', waiter: 'Официант', courier: 'Курьер', accountant: 'Бухгалтер', analyst: 'Аналитик'
  };
  const typeIcon: Record<string, string> = {
    order: '🛒', booking: '📅', client: '👤', stock: '📦', review: '⭐', system: '⚙️'
  };
  const typeBg: Record<string, string> = {
    order: 'bg-blue-100 dark:bg-blue-900/30',
    booking: 'bg-amber-100 dark:bg-amber-900/30',
    client: 'bg-green-100 dark:bg-green-900/30',
    stock: 'bg-red-100 dark:bg-red-900/30',
    review: 'bg-yellow-100 dark:bg-yellow-900/30',
    system: 'bg-zinc-100 dark:bg-zinc-800',
  };
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const handleNotifClick = (notif: AppNotification) => {
    markRead(notif.id);
    if (notif.link) { setAdminPage(notif.link as AdminPage); setShowNotifs(false); }
  };

  return (
    <div className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-6 h-16 flex items-center gap-4">
      <div className="ml-12 md:ml-0 flex-1 flex items-center gap-3">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-white">{pageNames[adminPage]}</h1>
        <span className="hidden md:inline-flex bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[11px] font-semibold px-2 py-0.5 rounded-full">{roleNames[adminRole]}</span>
      </div>

      {/* Уведомления */}
      <div className="relative">
        <button
          onClick={() => { setShowNotifs(!showNotifs); }}
          className={`relative p-2 transition-colors rounded-xl ${showNotifs ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'} text-zinc-600 dark:text-zinc-300`}
        >
          <Bell size={20} className={unreadCount > 0 ? 'text-orange-500' : ''} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
            <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right"
              style={{ animation: 'slideDownFade 0.15s ease-out' }}>
              {/* Заголовок */}
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/60">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Уведомления</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} новых</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] text-blue-500 hover:text-blue-600 font-medium transition">Прочитать все</button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearNotifications} className="text-[11px] text-zinc-400 hover:text-red-500 font-medium transition">Очистить</button>
                  )}
                </div>
              </div>

              {/* Список */}
              <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <span className="text-4xl block mb-3">🔕</span>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Нет уведомлений</p>
                    <p className="text-zinc-400 text-xs mt-1">Новые события появятся здесь автоматически</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button key={notif.id} onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left flex gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition ${!notif.isRead ? 'bg-blue-50/40 dark:bg-blue-900/5' : ''}`}>
                      {/* Иконка типа */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5 ${typeBg[notif.type]}`}>
                        {typeIcon[notif.type]}
                      </div>
                      {/* Текст */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold leading-tight ${!notif.isRead ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>{notif.title}</p>
                          {!notif.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{notif.body}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">{fmtTime(notif.timestamp)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <button onClick={toggleTheme} className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button onClick={() => setMode('guest')} className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition" title="Выход">
        <LogOut size={20} />
      </button>
    </div>
  );
}

// ===================== ДАШБОРД → в отдельном файле =====================
// (Теперь DashboardPage вынесен в src/admin/DashboardPage.tsx)

// ===================== STAT CARD =====================
function StatCard({ label, value, change, trend, icon: Icon, color }: { label: string; value: string; change: string; trend: 'up' | 'down'; icon: any; color: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
        <span className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
      <p className="text-sm text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}

// ===================== ДАШБОРД =====================
function DashboardPage() {
  return <_DashboardPage />;
}
function _OldDashboardDeleted() { return null; }
function _X() { void _OldDashboardDeleted;
  const [dailySortDir, setDailySortDir] = useState<'asc' | 'desc'>('desc');
  const allData = analyticsData.dailyStats;
  const allDates = allData.map(d => d.date);
  const minDate = allDates[allDates.length - 1];
  const maxDate = allDates[0];
  const currentDate = new Date(`${maxDate}T12:00:00`);
  const toIsoDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const shiftDate = (iso: string, offset: number) => {
    const dt = new Date(`${iso}T12:00:00`);
    dt.setDate(dt.getDate() + offset);
    return toIsoDate(dt);
  };

  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(currentDate.getMonth());
  const [calYear, setCalYear] = useState(currentDate.getFullYear());
  const [dateFrom, setDateFrom] = useState(allData[Math.min(6, allData.length - 1)]?.date || maxDate);
  const [dateTo, setDateTo] = useState(maxDate);
  const [selectingFrom, setSelectingFrom] = useState(true); // true = выбираем начало, false = конец
  const [activePreset, setActivePreset] = useState<string>('7days');

  const clampDate = (iso: string) => iso < minDate ? minDate : iso > maxDate ? maxDate : iso;
  const setRange = (from: string, to: string) => {
    const a = clampDate(from);
    const b = clampDate(to);
    const start = a <= b ? a : b;
    const end = a <= b ? b : a;
    setDateFrom(start);
    setDateTo(end);
    const dt = new Date(`${end}T12:00:00`);
    setCalMonth(dt.getMonth());
    setCalYear(dt.getFullYear());
  };

  // Пресеты
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    const today = maxDate;
    const d = (offset: number) => shiftDate(today, -offset);
    const dow = currentDate.getDay(); // 0=Sun
    const monOffset = dow === 0 ? 6 : dow - 1;
    const firstDayOfCurrentMonth = toIsoDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 12));
    const firstDayOfLastMonth = toIsoDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1, 12));
    const lastDayOfLastMonth = toIsoDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 0, 12));
    switch (preset) {
      case '7days': setRange(d(6), today); break;
      case '14days': setRange(d(13), today); break;
      case '30days': setRange(d(29), today); break;
      case 'thisWeek': setRange(d(monOffset), today); break;
      case 'lastWeek': setRange(d(monOffset + 7), d(monOffset + 1)); break;
      case 'thisMonth': setRange(firstDayOfCurrentMonth, today); break;
      case 'lastMonth': setRange(firstDayOfLastMonth, lastDayOfLastMonth); break;
      case 'all': setRange(minDate, maxDate); break;
    }
  };

  // Фильтрация по диапазону дат
  const rangeStart = dateFrom <= dateTo ? dateFrom : dateTo;
  const rangeEnd = dateFrom <= dateTo ? dateTo : dateFrom;
  let dailyData = allData.filter(d => d.date >= rangeStart && d.date <= rangeEnd);

  dailyData.sort((a, b) => {
    if (dailySort === 'date') return dailySortDir === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    return dailySortDir === 'desc' ? (b[dailySort] as number) - (a[dailySort] as number) : (a[dailySort] as number) - (b[dailySort] as number);
  });

  const toggleSort = (key: typeof dailySort) => {
    if (dailySort === key) setDailySortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setDailySort(key); setDailySortDir('desc'); }
  };

  const totals = {
    revenue: dailyData.reduce((s, d) => s + d.revenue, 0),
    orders: dailyData.reduce((s, d) => s + d.orders, 0),
    avgCheck: Math.round(dailyData.reduce((s, d) => s + d.revenue, 0) / Math.max(1, dailyData.reduce((s, d) => s + d.orders, 0))),
    newCustomers: dailyData.reduce((s, d) => s + d.newCustomers, 0),
  };

  // Сравнение с аналогичным предыдущим периодом
  const periodLen = dailyData.length;
  const prevStart = shiftDate(rangeStart, -periodLen);
  const prevEnd = shiftDate(rangeStart, -1);
  const prevSlice = allData.filter(d => d.date >= prevStart && d.date <= prevEnd);
  const prevRevenue = prevSlice.reduce((s, d) => s + d.revenue, 0);
  const revenueTrend = prevRevenue > 0 ? Math.round((totals.revenue - prevRevenue) / prevRevenue * 100) : 0;

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  const fmtDateFull = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  const currentMonthLabel = currentDate.toLocaleDateString('ru-RU', { month: 'long' });
  const previousMonthLabel = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1, 12).toLocaleDateString('ru-RU', { month: 'long' });
  const chartData = dailyData
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ ...d, label: fmtDate(d.date) }));

  // --- Мини-календарь ---
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const buildCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Пн=0
    const days: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    return days;
  };
  const calDays = buildCalendar(calYear, calMonth);
  const hasData = (day: number) => {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allData.some(d => d.date === ds);
  };
  const getDayRev = (day: number) => {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allData.find(d => d.date === ds)?.revenue;
  };
  const handleCalClick = (day: number) => {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (selectingFrom) { setDateFrom(ds); setDateTo(ds); setSelectingFrom(false); setActivePreset(''); }
    else { setRange(dateFrom, ds); setSelectingFrom(true); setActivePreset(''); }
  };
  const isInRange = (day: number) => {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return ds >= rangeStart && ds <= rangeEnd;
  };
  const isStart = (day: number) => {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return ds === rangeStart;
  };
  const isEnd = (day: number) => {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return ds === rangeEnd;
  };

  return (
    <div className="space-y-6">
      {/* KPI карточки */}
      {(() => {
        const today = maxDate;
        const todayRegs = registeredUsers.filter(u => u.registeredAt.slice(0, 10) === today);
        const weekRegs = registeredUsers.filter(u => {
          const d = u.registeredAt.slice(0, 10);
          return d >= shiftDate(today, -6) && d <= today;
        });
        const prevWeekRegs = registeredUsers.filter(u => {
          const d = u.registeredAt.slice(0, 10);
          return d >= shiftDate(today, -13) && d < shiftDate(today, -6);
        });
        const custChange = prevWeekRegs.length > 0
          ? Math.round((weekRegs.length - prevWeekRegs.length) / prevWeekRegs.length * 100)
          : 0;
        // Общая база клиентов: прирост за неделю в %
        const totalBefore = registeredUsers.length - weekRegs.length;
        const totalGrowth = totalBefore > 0 ? Math.round(weekRegs.length / totalBefore * 100) : 0;
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard label="Выручка сегодня" value={`${analyticsData.revenue.today.toLocaleString()}₽`} change="+12%" trend="up" icon={DollarSign} color="from-green-500 to-emerald-500" />
            <StatCard label="Заказов сегодня" value={String(analyticsData.orders.today)} change="+8%" trend="up" icon={ShoppingBag} color="from-blue-500 to-cyan-500" />
            <StatCard label="Средний чек" value={`${analyticsData.avgCheck.today}₽`} change="-2%" trend="down" icon={TrendingUp} color="from-purple-500 to-pink-500" />
            <StatCard
              label="Новых клиентов"
              value={String(todayRegs.length)}
              change={`${custChange >= 0 ? '+' : ''}${custChange}%`}
              trend={custChange >= 0 ? 'up' : 'down'}
              icon={UsersRound}
              color="from-orange-500 to-red-500"
            />
            <StatCard
              label="Всего клиентов"
              value={registeredUsers.length.toLocaleString()}
              change={`+${weekRegs.length} за нед.`}
              trend={totalGrowth >= 0 ? 'up' : 'down'}
              icon={Users}
              color="from-indigo-500 to-violet-500"
            />
          </div>
        );
      })()}

      {/* Графики */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Выручка за выбранный период</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()}₽`, 'Выручка']} />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="#f97316" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Типы заказов</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={analyticsData.ordersByType} dataKey="value" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ name, value }: any) => `${name} ${value}%`}>
                {analyticsData.ordersByType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* НОВЫЕ КЛИЕНТЫ */}
      {(() => {
        const today = maxDate;
        const todayRegs = registeredUsers.filter(u => u.registeredAt.slice(0, 10) === today);
        const rangeRegs = registeredUsers.filter(u => {
          const d = u.registeredAt.slice(0, 10);
          return d >= rangeStart && d <= rangeEnd;
        });
        const prevRegCount = allData.length > periodLen
          ? allData.slice(periodLen, periodLen * 2).reduce((s, d) => s + d.newCustomers, 0)
          : 0;
        const regChange = prevRegCount > 0 ? Math.round((rangeRegs.length - prevRegCount) / prevRegCount * 100) : 0;

        return (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-lg">
                👥 Новые клиенты
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {rangeRegs.length} за период
                </span>
                {regChange !== 0 && (
                  <span className={`text-xs font-medium ${regChange > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {regChange > 0 ? '↑' : '↓'} {Math.abs(regChange)}%
                  </span>
                )}
              </h3>
              <div className="flex gap-2">
                <span className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-medium">
                  👤 Всего в базе: <strong>{registeredUsers.length.toLocaleString()}</strong>
                </span>
                <span className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg font-medium">
                  📱 Сегодня: <strong>{todayRegs.length}</strong>
                </span>
              </div>
            </div>

            {/* Общая база клиентов */}
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-white/70 text-sm">Общая база клиентов</p>
                <p className="text-white text-3xl font-bold">{registeredUsers.length.toLocaleString()}</p>
              </div>
              <div className="flex gap-4 text-right">
                <div>
                  <p className="text-white/70 text-xs">📱 Приложение</p>
                  <p className="text-white text-lg font-bold">{registeredUsers.filter(u => u.source === 'mobile_app').length}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">🤖 Telegram</p>
                  <p className="text-white text-lg font-bold">{registeredUsers.filter(u => u.source === 'telegram').length}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">🌐 Сайт</p>
                  <p className="text-white text-lg font-bold">{registeredUsers.filter(u => u.source === 'website').length}</p>
                </div>
              </div>
            </div>

            {/* Статистика по источникам */}
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              {(['mobile_app', 'telegram', 'website'] as const).map(src => {
                const count = rangeRegs.filter(u => u.source === src).length;
                const pct = rangeRegs.length > 0 ? Math.round(count / rangeRegs.length * 100) : 0;
                const labels = { mobile_app: '📱 Моб. приложение', telegram: '🤖 Telegram', website: '🌐 Веб-сайт' };
                const colors = { mobile_app: 'bg-blue-500', telegram: 'bg-sky-500', website: 'bg-zinc-500' };
                return (
                  <div key={src} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                    <p className="text-sm text-zinc-500">{labels[src]}</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">{count}</p>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 mt-2">
                      <div className={`${colors[src]} rounded-full h-1.5 transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{pct}%</p>
                  </div>
                );
              })}
            </div>

            {/* Последние регистрации */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Последние регистрации</p>
                <span className="text-xs text-zinc-400">Всего: {registeredUsers.length}</span>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                {registeredUsers.slice(0, 20).map(u => {
                  const isFromRange = u.registeredAt.slice(0, 10) >= rangeStart && u.registeredAt.slice(0, 10) <= rangeEnd;
                  const isToday = u.registeredAt.slice(0, 10) === today;
                  return (
                    <div key={u.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${isFromRange ? 'bg-zinc-50 dark:bg-zinc-800' : 'opacity-50'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${u.source === 'telegram' ? 'bg-sky-500' : u.source === 'mobile_app' ? 'bg-blue-500' : 'bg-zinc-500'}`}>
                        {u.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-white truncate">{u.name}</p>
                        <p className="text-xs text-zinc-400">{u.phone} · {u.source === 'telegram' ? 'Telegram' : u.source === 'mobile_app' ? 'Приложение' : 'Веб-сайт'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-zinc-400">{new Date(u.registeredAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
                        {isToday && <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">сегодня</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ТАБЛИЦА СТАТИСТИКИ ПО ДНЯМ */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        {/* Заголовок + Пресеты + Кнопка календаря */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="font-bold text-zinc-900 dark:text-white text-lg">📊 Статистика по дням</h3>
            <button onClick={() => setShowCalendar(!showCalendar)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm ${showCalendar ? 'bg-orange-500 text-white shadow-orange-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'}`}>
              <span>📅</span>
              <span>{fmtDateFull(rangeStart)} — {fmtDateFull(rangeEnd)}</span>
            </button>
          </div>
          {/* Пресеты */}
          <div className="flex flex-wrap gap-1.5">
            {[
              ['7days', '7 дн.'], ['14days', '14 дн.'], ['30days', '30 дн.'],
              ['thisWeek', 'Эта неделя'], ['lastWeek', 'Прошлая нед.'],
              ['thisMonth', currentMonthLabel], ['lastMonth', previousMonthLabel], ['all', 'Всё время'],
            ].map(([k, l]) => (
              <button key={k} onClick={() => applyPreset(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activePreset === k ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Календарь (раскрывается) */}
        {showCalendar && (
          <div className="px-5 py-4 bg-orange-50/50 dark:bg-orange-900/5 border-b border-orange-200/50 dark:border-orange-900/20">
            <div className="flex flex-col md:flex-row gap-5">
              {/* Навигация по месяцам */}
              <div className="flex-1 min-w-[280px]">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700">◀</button>
                  <span className="font-bold text-zinc-900 dark:text-white">{monthNames[calMonth]} {calYear}</span>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700">▶</button>
                </div>
                {/* Дни недели */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-zinc-400 py-1">{d}</div>
                  ))}
                </div>
                {/* Сетка дней */}
                <div className="grid grid-cols-7 gap-1">
                  {calDays.map((day, idx) => {
                    if (day === null) return <div key={`e${idx}`} />;
                    const inRange = isInRange(day);
                    const start = isStart(day);
                    const end = isEnd(day);
                    const available = hasData(day);
                    const rev = getDayRev(day);
                    return (
                      <button key={idx} onClick={() => available && handleCalClick(day)} disabled={!available}
                        className={`relative h-12 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center ${
                          start || end
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 z-10 scale-105'
                            : inRange
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              : available
                                ? 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 cursor-pointer'
                                : 'text-zinc-300 dark:text-zinc-600 cursor-default'
                        }`}>
                        <span className={`text-sm font-bold ${start || end ? 'text-white' : ''}`}>{day}</span>
                        {available && rev !== undefined && (
                          <span className={`text-[8px] leading-none ${start || end ? 'text-white/80' : 'text-zinc-400'}`}>{Math.round(rev / 1000)}к</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Подсказка */}
                <p className="text-[10px] text-zinc-400 mt-2 text-center">
                  {selectingFrom ? 'Выберите начало периода' : 'Выберите конец периода'}
                  <span className="ml-2 inline-flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Начало/Конец
                    <span className="w-2 h-2 rounded-full bg-orange-200 inline-block ml-1" /> Диапазон
                    <span className="w-2 h-2 rounded-full bg-zinc-200 inline-block ml-1" /> Данные есть
                  </span>
                </p>
              </div>

              {/* Ручной ввод дат + предпросмотр */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                <div>
                  <label className="text-xs text-zinc-500 font-medium block mb-1">От</label>
                  <input type="date" value={dateFrom} onChange={e => { setDateFrom(clampDate(e.target.value)); setActivePreset(''); }}
                    min={minDate} max={maxDate}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-medium block mb-1">До</label>
                  <input type="date" value={dateTo} onChange={e => { setDateTo(clampDate(e.target.value)); setActivePreset(''); }}
                    min={minDate} max={maxDate}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
                </div>
                {/* Предпросмотр */}
                <div className="bg-white dark:bg-zinc-800 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                  <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Выбрано</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{dailyData.length} дней</p>
                  <p className="text-lg font-bold text-orange-500">{totals.revenue.toLocaleString()}₽</p>
                  <p className="text-xs text-zinc-500">{totals.orders} заказов · ср. чек {totals.avgCheck.toLocaleString()}₽</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Итоги за период */}
        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Выручка</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{totals.revenue.toLocaleString()}₽</p>
            {revenueTrend !== 0 && (
              <span className={`text-xs font-medium ${revenueTrend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {revenueTrend > 0 ? '↑' : '↓'} {Math.abs(revenueTrend)}% к пред. периоду
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Заказов</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{totals.orders}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Средний чек</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{totals.avgCheck.toLocaleString()}₽</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Новых клиентов</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{totals.newCustomers}</p>
          </div>
        </div>

        {/* Таблица */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                {([['date', 'Дата'], ['revenue', 'Выручка'], ['orders', 'Заказы'], ['avgCheck', 'Средний чек'], ['newCustomers', 'Новые клиенты']] as [typeof dailySort, string][]).map(([key, label]) => (
                  <th key={key} onClick={() => toggleSort(key)}
                    className="text-left px-4 py-3 text-zinc-500 font-medium cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition select-none whitespace-nowrap">
                    <span className="flex items-center gap-1">{label}{dailySort === key && <span className="text-orange-500">{dailySortDir === 'desc' ? '↓' : '↑'}</span>}</span>
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-zinc-500 font-medium whitespace-nowrap">Доставка/Вынос/Зал</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium whitespace-nowrap">Бонусы</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium whitespace-nowrap">Отмены</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((d) => {
                const maxRev = Math.max(...dailyData.map(x => x.revenue));
                const minRev = Math.min(...dailyData.map(x => x.revenue));
                const isToday = d.date === maxDate;
                return (
                  <tr key={d.date} className={`border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition ${isToday ? 'bg-orange-50/50 dark:bg-orange-900/5' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isToday ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{d.weekDay}</span>
                        <span className={`font-medium ${isToday ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-900 dark:text-white'}`}>{fmtDate(d.date)}</span>
                        {isToday && <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Сегодня</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${d.revenue === maxRev ? 'text-green-600 dark:text-green-400' : d.revenue === minRev ? 'text-red-500' : 'text-zinc-900 dark:text-white'}`}>
                        {d.revenue.toLocaleString()}₽
                      </span>
                      {d.revenue === maxRev && <span className="ml-1 text-[10px]">📈</span>}
                      {d.revenue === minRev && <span className="ml-1 text-[10px]">📉</span>}
                    </td>
                    <td className="px-4 py-3"><span className="font-semibold text-zinc-900 dark:text-white">{d.orders}</span></td>
                    <td className="px-4 py-3"><span className="text-zinc-700 dark:text-zinc-300">{d.avgCheck.toLocaleString()}₽</span></td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-medium">+{d.newCustomers}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">🚗{d.delivery}</span>
                        <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">🏪{d.pickup}</span>
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">🍽️{d.dineIn}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      <span className="text-green-600 dark:text-green-400">+{d.bonusesIssued.toLocaleString()}</span>
                      {d.bonusesRedeemed > 0 && <span className="text-red-500 ml-1">−{d.bonusesRedeemed}</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(d.cancelled > 0 || d.refund > 0) ? (
                        <div className="flex items-center gap-1.5">
                          {d.cancelled > 0 && <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">✗{d.cancelled}</span>}
                          {d.refund > 0 && <span className="text-xs text-red-500">↩{d.refund.toLocaleString()}₽</span>}
                        </div>
                      ) : <span className="text-xs text-zinc-300 dark:text-zinc-600">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white whitespace-nowrap">Итого ({dailyData.length} дн.)</td>
                <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white">{totals.revenue.toLocaleString()}₽</td>
                <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white">{totals.orders}</td>
                <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white">{totals.avgCheck.toLocaleString()}₽</td>
                <td className="px-4 py-3"><span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">+{totals.newCustomers}</span></td>
                <td className="px-4 py-3 text-xs text-zinc-500">{dailyData.reduce((s, d) => s + d.delivery, 0)} / {dailyData.reduce((s, d) => s + d.pickup, 0)} / {dailyData.reduce((s, d) => s + d.dineIn, 0)}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">{dailyData.reduce((s, d) => s + d.bonusesIssued, 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">{dailyData.reduce((s, d) => s + d.cancelled, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Активные заказы + Топ блюд */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
            Активные заказы ({newOrders.length})
          </h3>
          <div className="space-y-2">
            {newOrders.map(order => (
              <div key={order.id} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                <div className={`w-2 h-2 rounded-full ${order.status === 'new' ? 'bg-blue-500' : order.status === 'preparing' ? 'bg-amber-500' : 'bg-green-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-white">#{order.id}</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{order.total}₽</span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{order.items.map(i => i.name).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-3">🔥 Топ блюд</h3>
          <div className="space-y-2">
            {analyticsData.topDishes.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-zinc-200 text-zinc-700' : 'bg-orange-100 text-orange-700'}`}>{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{d.name}</p>
                  <p className="text-xs text-zinc-500">{d.orders} заказов</p>
                </div>
                <span className="text-sm font-bold text-zinc-900 dark:text-white">{d.revenue.toLocaleString()}₽</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== ЗАКАЗЫ (АДМИН) =====================
function OrdersPage() {
  const { orders, updateOrderStatus } = useApp();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType] = useState('all');

  const statusLabels: Record<string, [string, string]> = {
    new: ['Новый', 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'],
    accepted: ['Принят', 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'],
    preparing: ['Готовится', 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'],
    ready: ['Готов', 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'],
    delivering: ['В доставке', 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'],
    delivered: ['Доставлен', 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'],
    cancelled: ['Отменён', 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'],
  };
  const nextStatus: Record<string, string> = { new: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'delivering', delivering: 'delivered' };

  let filtered = orders;
  if (filterStatus !== 'all') filtered = filtered.filter(o => o.status === filterStatus);
  if (filterType !== 'all') filtered = filtered.filter(o => o.type === filterType);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['all', 'new', 'accepted', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filterStatus === s ? 'bg-orange-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'}`}>
            {s === 'all' ? 'Все' : statusLabels[s]?.[0]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(order => (
          <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-zinc-900 dark:text-white">#{order.id}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusLabels[order.status]?.[1]}`}>{statusLabels[order.status]?.[0]}</span>
                <span className="text-xs text-zinc-400">{order.type === 'delivery' ? '🚗 Доставка' : order.type === 'pickup' ? '🏪 Самовынос' : '🍽️ В зале'}</span>
              </div>
              <span className="text-sm text-zinc-400">{new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="grid md:grid-cols-3 gap-3 mb-3">
              <div>
                <p className="text-xs text-zinc-400 mb-1">Клиент</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{order.userName}</p>
                <p className="text-xs text-zinc-500">{order.userPhone}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Блюда</p>
                {order.items.map((item, i) => (
                  <p key={i} className="text-sm text-zinc-700 dark:text-zinc-300">{item.name} ×{item.quantity} <span className="text-zinc-400">({item.price}₽)</span></p>
                ))}
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Оплата</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{order.total}₽</p>
                <p className="text-xs text-zinc-500">{order.isPaid ? '✅ Оплачен' : '⏳ Не оплачен'} · {order.paymentMethod}</p>
              </div>
            </div>
            {order.address && <p className="text-xs text-zinc-500 mb-2">📍 {order.address}</p>}
            {order.comment && <p className="text-xs text-zinc-500 mb-2">💬 {order.comment}</p>}
            <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              {nextStatus[order.status] && (
                <button onClick={() => updateOrderStatus(order.id, nextStatus[order.status] as any)} className="bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5">
                  <Check size={16} /> {statusLabels[nextStatus[order.status]]?.[0]}
                </button>
              )}
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5">
                  <X size={16} /> Отменить
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== КУХНЯ =====================
function KitchenPage() {
  const { orders, updateOrderStatus } = useApp();
  const kitchenOrders = orders.filter(o => o.status === 'accepted' || o.status === 'preparing' || o.status === 'ready');

  const columns = [
    { status: 'accepted' as const, title: '🆕 Новые', color: 'border-blue-500' },
    { status: 'preparing' as const, title: '🔥 Готовятся', color: 'border-amber-500' },
    { status: 'ready' as const, title: '✅ Готовы', color: 'border-green-500' },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {columns.map(col => {
        const colOrders = kitchenOrders.filter(o => o.status === col.status);
        return (
          <div key={col.status} className={`bg-white dark:bg-zinc-900 rounded-2xl border-t-4 ${col.color} shadow-sm`}>
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-zinc-900 dark:text-white">{col.title} ({colOrders.length})</h3>
            </div>
            <div className="p-3 space-y-3 min-h-[200px]">
              {colOrders.map(order => (
                <div key={order.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-zinc-900 dark:text-white">#{order.id}</span>
                    <span className="text-xs text-zinc-400">{new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {order.items.map((item, i) => (
                    <div key={i} className="text-sm text-zinc-700 dark:text-zinc-300 flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-bold">×{item.quantity}</span>
                    </div>
                  ))}
                  {order.comment && <p className="text-xs text-amber-600 mt-1">⚠️ {order.comment}</p>}
                  <div className="flex gap-2 mt-2">
                    {col.status === 'accepted' && (
                      <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="flex-1 bg-amber-500 text-white text-xs font-semibold py-2 rounded-lg">Начать готовку</button>
                    )}
                    {col.status === 'preparing' && (
                      <button onClick={() => updateOrderStatus(order.id, 'ready')} className="flex-1 bg-green-500 text-white text-xs font-semibold py-2 rounded-lg">Готово!</button>
                    )}
                    {col.status === 'ready' && (
                      <button onClick={() => updateOrderStatus(order.id, 'delivering')} className="flex-1 bg-purple-500 text-white text-xs font-semibold py-2 rounded-lg">Выдать</button>
                    )}
                  </div>
                </div>
              ))}
              {colOrders.length === 0 && <p className="text-center text-sm text-zinc-400 py-8">Нет заказов</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===================== УПРАВЛЕНИЕ МЕНЮ =====================
function MenuManagePage() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState(0);
  const [showForm, setShowForm] = useState(false);

  let filtered = catFilter === 0 ? dishes : dishes.filter(d => d.categoryId === catFilter);
  if (search) filtered = filtered.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-200 dark:border-zinc-700">
          <Search size={18} className="text-zinc-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск блюд..." className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white outline-none" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(Number(e.target.value))} className="bg-white dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 outline-none">
          <option value={0}>Все категории</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <button className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700">
          <Download size={16} /> Экспорт
        </button>
        <button className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700">
          <Upload size={16} /> Импорт
        </button>
        <button onClick={() => setShowForm(!showForm)} className="bg-orange-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-orange-500/30">
          <Plus size={16} /> Добавить блюдо
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Новое блюдо</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[['Название', 'text', 'Классический бургер'], ['Цена (₽)', 'number', '449'], ['Вес (г)', 'number', '320'], ['Калории', 'number', '580']].map(([label, type, placeholder]) => (
              <div key={label as string}>
                <label className="text-xs text-zinc-500 mb-1 block">{label as string}</label>
                <input type={type as string} placeholder={placeholder as string} className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none" />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="text-xs text-zinc-500 mb-1 block">Описание</label>
              <textarea placeholder="Описание блюда..." rows={2} className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none resize-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Категория</label>
              <select className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none">
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Аллергены</label>
              <input placeholder="Глютен, Молоко..." className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="bg-orange-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl">Сохранить</button>
            <button onClick={() => setShowForm(false)} className="text-zinc-500 font-medium text-sm px-5 py-2.5">Отмена</button>
          </div>
        </div>
      )}

      {/* Стоп-лист */}
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-4">
        <h4 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2"><AlertTriangle size={16} /> Стоп-лист</h4>
        <div className="flex gap-2 flex-wrap">
          {dishes.filter(d => !d.isAvailable).length === 0 && <span className="text-sm text-red-500/70">Все блюда доступны</span>}
          {dishes.filter(d => !d.isAvailable).map(d => (
            <span key={d.id} className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs px-3 py-1 rounded-full">{d.name}</span>
          ))}
        </div>
      </div>

      {/* Dishes table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Блюдо</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Категория</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Цена</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Рейтинг</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Статус</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(dish => {
                const cat = categories.find(c => c.id === dish.categoryId);
                return (
                  <tr key={dish.id} className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat?.icon}</span>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">{dish.name}</p>
                          <p className="text-xs text-zinc-400">{dish.weight}г · {dish.calories} ккал</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{cat?.name}</td>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">{dish.price}₽</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1"><Star size={14} fill="#f59e0b" className="text-amber-400" />{dish.rating}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${dish.isAvailable ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {dish.isAvailable ? 'Доступно' : 'Стоп-лист'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-blue-500"><Edit size={16} /></button>
                        <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-red-500"><Trash2 size={16} /></button>
                        <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-amber-500"><Pause size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===================== БРОНИРОВАНИЯ =====================
function BookingsPage() {
  const { bookings, updateBookingStatus, tables: allTables, updateTableStatus } = useApp();
  const [view, setView] = useState<'list' | 'floor'>('list');
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    completed: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setView('list')} className={`px-4 py-2 rounded-xl text-sm font-medium ${view === 'list' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'}`}>📋 Список</button>
        <button onClick={() => setView('floor')} className={`px-4 py-2 rounded-xl text-sm font-medium ${view === 'floor' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'}`}>🗺️ Схема зала</button>
      </div>

      {view === 'list' ? (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900 dark:text-white">{b.userName}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[b.status]}`}>{b.status === 'pending' ? 'Ожидает' : b.status === 'confirmed' ? 'Подтверждено' : b.status === 'cancelled' ? 'Отменено' : 'Завершено'}</span>
                </div>
                <MoreVertical size={18} className="text-zinc-400" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <span>📅 {b.date}</span>
                <span>⏰ {b.time}</span>
                <span>👥 {b.guestCount} гостей</span>
                <span>🪑 {b.tableName}</span>
              </div>
              {b.comment && <p className="text-xs text-zinc-500 mt-1">💬 {b.comment}</p>}
              {b.deposit > 0 && <p className="text-xs text-green-600 mt-1">💰 Депозит: {b.deposit}₽</p>}
              <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                {b.status === 'pending' && <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg">✓ Подтвердить</button>}
                {(b.status === 'pending' || b.status === 'confirmed') && <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg">✗ Отменить</button>}
                {b.status === 'confirmed' && <button onClick={() => updateBookingStatus(b.id, 'completed')} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium px-3 py-1.5 rounded-lg">Завершить</button>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Схема зала — FoodChain Центр</h3>
          <div className="relative w-full aspect-[3/2] bg-zinc-50 dark:bg-zinc-800 rounded-xl overflow-hidden">
            {allTables.map(t => (
              <button key={t.id} onClick={() => updateTableStatus(t.id, t.status === 'free' ? 'occupied' : 'free')}
                className={`absolute w-16 h-14 rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all hover:scale-105 ${
                  t.status === 'free' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-2 border-green-300 dark:border-green-700' :
                  t.status === 'reserved' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-2 border-amber-300 dark:border-amber-700' :
                  'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-2 border-red-300 dark:border-red-700'
                }`} style={{ left: `${t.x}%`, top: `${t.y}%` }}>
                <span className="font-bold">{t.name.replace('Стол ', '').replace('Барная ', 'Б')}</span>
                <span className="text-[9px] opacity-70">{t.capacity} мест</span>
              </button>
            ))}
          </div>
          <div className="flex gap-6 mt-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-green-400" /> Свободен ({allTables.filter(t => t.status === 'free').length})</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-amber-400" /> Бронь ({allTables.filter(t => t.status === 'reserved').length})</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-red-400" /> Занят ({allTables.filter(t => t.status === 'occupied').length})</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== СКЛАД =====================
function InventoryPage() {
  const { purchaseOrders, addPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder, suppliers, addSupplier, deleteSupplier, addNotification } = useApp();
  const [tab, setTab] = useState<'ingredients' | 'suppliers' | 'orders'>('ingredients');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [preselectedSupplier, setPreselectedSupplier] = useState<number | null>(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const lowStock = ingredients.filter(i => i.currentStock <= i.minStock);

  // Открыть форму с предвыбранным поставщиком
  const openFormForSupplier = (supplierId: number) => {
    setPreselectedSupplier(supplierId);
    setShowCreateForm(true);
    setTab('orders');
  };

  // Авто-заявка из низких остатков
  const createAutoOrder = () => {
    // Группируем по поставщикам (для демо — все на одного)
    const items = lowStock.map(ing => ({
      ingredientId: ing.id,
      name: ing.name,
      quantity: ing.minStock * 2 - ing.currentStock,
      unit: ing.unit,
      pricePerUnit: ing.pricePerUnit,
      total: (ing.minStock * 2 - ing.currentStock) * ing.pricePerUnit,
    }));
    const total = items.reduce((s, i) => s + i.total, 0);
    const po = {
      id: Date.now(),
      supplierId: 1,
      supplierName: suppliers[0].name,
      branchId: 1,
      branchName: 'FoodChain Центр',
      items,
      total,
      status: 'draft' as const,
      notes: 'Авто-заявка по низким остаткам',
      createdBy: 'Система',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addPurchaseOrder(po);
    addNotification(n('stock', '📦 Авто-заявка создана', `Авто-заявка #${po.id} на ${total.toLocaleString()}₽ по низким остаткам`, 'inventory'));
    setTab('orders');
  };

  return (
    <div className="space-y-4">
      {/* Низкий остаток */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2"><AlertTriangle size={16} /> Низкий остаток ({lowStock.length})</h4>
            <button onClick={createAutoOrder} className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-red-600 transition">
              <Plus size={14} /> Авто-заявка
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {lowStock.map(i => (
              <span key={i.id} className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs px-3 py-1 rounded-full">{i.name}: {i.currentStock} {i.unit} (мин. {i.minStock})</span>
            ))}
          </div>
        </div>
      )}

      {/* Табы */}
      <div className="flex flex-wrap gap-2">
        {(['ingredients', 'suppliers', 'orders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'}`}>
            {t === 'ingredients' ? '📦 Ингредиенты' : t === 'suppliers' ? `🏭 Поставщики (${suppliers.length})` : `📝 Закупки (${purchaseOrders.length})`}
          </button>
        ))}
        {tab === 'orders' && (
          <button onClick={() => { setPreselectedSupplier(null); setShowCreateForm(true); }} className="ml-auto bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition">
            <Plus size={16} /> Новая заявка
          </button>
        )}
        {tab === 'suppliers' && (
          <button onClick={() => setShowAddSupplier(true)} className="ml-auto bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition">
            <Plus size={16} /> Добавить поставщика
          </button>
        )}
      </div>

      {/* ===== ИНГРЕДИЕНТЫ ===== */}
      {tab === 'ingredients' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-100 dark:border-zinc-800">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Ингредиент</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Остаток</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Мин.</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Цена/ед.</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Статус</th>
            </tr></thead>
            <tbody>
              {ingredients.map(ing => (
                <tr key={ing.id} className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{ing.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{ing.currentStock} {ing.unit}</td>
                  <td className="px-4 py-3 text-zinc-400">{ing.minStock} {ing.unit}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{ing.pricePerUnit}₽/{ing.unit}</td>
                  <td className="px-4 py-3">
                    {ing.currentStock <= ing.minStock ? (
                      <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs px-2 py-0.5 rounded-full">⚠️ Низкий</span>
                    ) : (
                      <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-0.5 rounded-full">✓ Норма</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== ПОСТАВЩИКИ ===== */}
      {tab === 'suppliers' && (
        <div className="space-y-4">
          {/* Форма добавления поставщика */}
          {showAddSupplier && (
            <AddSupplierForm
              onSave={(s) => { addSupplier(s); setShowAddSupplier(false); addNotification(n('system', '✅ Поставщик добавлен', `«${s.name}» добавлен в список`, 'inventory')); }}
              onCancel={() => setShowAddSupplier(false)}
            />
          )}

          {/* Список поставщиков */}
          {suppliers.length === 0 && !showAddSupplier ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
              <Package size={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Поставщиков пока нет</h3>
              <p className="text-sm text-zinc-500 mt-1">Добавьте первого поставщика для управления закупками</p>
              <button onClick={() => setShowAddSupplier(true)} className="mt-4 bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition">
                <span className="flex items-center gap-1.5"><Plus size={16} /> Добавить поставщика</span>
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {suppliers.map(s => (
                <div key={s.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 group">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-zinc-900 dark:text-white text-lg">{s.name}</h4>
                    <button
                      onClick={() => {
                        if (confirm(`Удалить поставщика "${s.name}"?`)) {
                          deleteSupplier(s.id);
                          addNotification(n('system', '🗑️ Поставщик удалён', `«${s.name}» удалён из списка`, 'inventory'));
                        }
                      }}
                      className="p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Удалить поставщика"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-2 space-y-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                    <p className="flex items-center gap-2">👤 {s.contactPerson}</p>
                    <p className="flex items-center gap-2">📞 {s.phone}</p>
                    <p className="flex items-center gap-2">📧 {s.email}</p>
                    <p className="flex items-center gap-2">📍 {s.address}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button onClick={() => openFormForSupplier(s.id)} className="bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-orange-600 transition">
                      <Plus size={14} /> Создать заявку
                    </button>
                    <span className="text-xs text-zinc-400 ml-auto">
                      Заявок: {purchaseOrders.filter(po => po.supplierId === s.id).length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== ЗАКУПКИ (ЗАЯВКИ) ===== */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {/* Форма создания */}
          {showCreateForm && (
            <PurchaseOrderForm
              preselectedSupplier={preselectedSupplier}
              onSave={(po) => { addPurchaseOrder(po); setShowCreateForm(false); addNotification(n('stock', '📝 Заявка создана', `Заявка #${po.id} — ${po.supplierName} · ${po.total.toLocaleString()}₽`, 'inventory')); }}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {/* Список заявок */}
          {purchaseOrders.length === 0 && !showCreateForm ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
              <Package size={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Заявок на закупку пока нет</h3>
              <p className="text-sm text-zinc-500 mt-1">Создайте первую заявку для пополнения склада</p>
              <button onClick={() => { setPreselectedSupplier(null); setShowCreateForm(true); }} className="mt-4 bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition">
                <span className="flex items-center gap-1.5"><Plus size={16} /> Создать заявку</span>
              </button>
            </div>
          ) : (
            purchaseOrders.map(po => (
              <PurchaseOrderCard
                key={po.id}
                po={po}
                onStatusChange={(status) => { updatePurchaseOrderStatus(po.id, status); addNotification(n('stock', `📋 Заявка #${po.id}`, `Статус: ${statusLabel(status)} · ${po.supplierName}`, 'inventory')); }}
                onDelete={() => { deletePurchaseOrder(po.id); addNotification(n('stock', `🗑️ Заявка #${po.id} удалена`, po.supplierName, 'inventory')); }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Хелпер для статуса
function statusLabel(s: string): string {
  return { draft: 'Черновик', sent: 'Отправлена', delivered: 'Доставлена', cancelled: 'Отменена' }[s] || s;
}

// ===================== КАРТОЧКА ЗАЯВКИ =====================
function PurchaseOrderCard({ po, onStatusChange, onDelete }: {
  po: import('../types').PurchaseOrder;
  onStatusChange: (status: 'draft' | 'sent' | 'delivered' | 'cancelled') => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusStyles: Record<string, string> = {
    draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
    sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  const statusIcons: Record<string, string> = { draft: '📝', sent: '📤', delivered: '✅', cancelled: '❌' };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      {/* Заголовок */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-zinc-900 dark:text-white">#{po.id}</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[po.status]}`}>
              {statusIcons[po.status]} {statusLabel(po.status)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">{new Date(po.createdAt).toLocaleDateString('ru-RU')}</span>
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 transition">
              <ChevronDown size={18} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-zinc-400">Поставщик</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">{po.supplierName}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Филиал</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">{po.branchName}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Позиций</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">{po.items.length}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Сумма</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-white">{po.total.toLocaleString()}₽</p>
          </div>
        </div>

        {po.notes && (
          <div className="mt-2 flex items-start gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <span>💬</span>
            <span>{po.notes}</span>
          </div>
        )}
      </div>

      {/* Развёрнутое содержимое */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          {/* Позиции */}
          <div className="p-5 pb-3">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Позиции заявки</h4>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left px-3 py-2 text-zinc-400 font-medium text-xs">Ингредиент</th>
                    <th className="text-right px-3 py-2 text-zinc-400 font-medium text-xs">Кол-во</th>
                    <th className="text-right px-3 py-2 text-zinc-400 font-medium text-xs">Цена/ед.</th>
                    <th className="text-right px-3 py-2 text-zinc-400 font-medium text-xs">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item, i) => (
                    <tr key={i} className="border-b border-zinc-100 dark:border-zinc-700 last:border-0">
                      <td className="px-3 py-2.5 font-medium text-zinc-900 dark:text-white">{item.name}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-600 dark:text-zinc-300">{item.quantity} {item.unit}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-600 dark:text-zinc-300">{item.pricePerUnit}₽</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-zinc-900 dark:text-white">{item.total.toLocaleString()}₽</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
                    <td colSpan={3} className="px-3 py-2.5 text-right font-bold text-zinc-700 dark:text-zinc-300">Итого:</td>
                    <td className="px-3 py-2.5 text-right font-bold text-lg text-orange-500">{po.total.toLocaleString()}₽</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Мета */}
          <div className="px-5 pb-3 text-xs text-zinc-400 flex gap-4">
            <span>Создал: {po.createdBy}</span>
            <span>Создана: {new Date(po.createdAt).toLocaleString('ru-RU')}</span>
            {po.updatedAt !== po.createdAt && <span>Обновлена: {new Date(po.updatedAt).toLocaleString('ru-RU')}</span>}
          </div>

          {/* Действия */}
          <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-2">
            {po.status === 'draft' && (
              <>
                <button onClick={() => onStatusChange('sent')} className="bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-blue-600 transition">
                  📤 Отправить поставщику
                </button>
                <button onClick={() => onStatusChange('cancelled')} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium px-4 py-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                  Отменить
                </button>
                <button onClick={onDelete} className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition ml-auto">
                  <Trash2 size={14} />
                </button>
              </>
            )}
            {po.status === 'sent' && (
              <>
                <button onClick={() => onStatusChange('delivered')} className="bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-green-600 transition">
                  ✅ Товар получен
                </button>
                <button onClick={() => onStatusChange('cancelled')} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium px-4 py-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                  Отменить
                </button>
              </>
            )}
            {po.status === 'delivered' && (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">✅ Заявка выполнена</span>
            )}
            {po.status === 'cancelled' && (
              <>
                <span className="text-sm text-red-500 flex items-center gap-1.5">❌ Заявка отменена</span>
                <button onClick={onDelete} className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition ml-auto">
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== ФОРМА ДОБАВЛЕНИЯ ПОСТАВЩИКА =====================
function AddSupplierForm({ onSave, onCancel }: {
  onSave: (s: import('../types').Supplier) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const isValid = name.trim().length > 0 && contactPerson.trim().length > 0 && phone.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      id: Date.now(),
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border-2 border-orange-200 dark:border-orange-900/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 py-4 flex items-center justify-between">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">🏭 Новый поставщик</h3>
        <button onClick={onCancel} className="text-white/70 hover:text-white transition">
          <X size={20} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Название */}
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Название компании <span className="text-red-500">*</span></label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder='Например: «ФрешФрукт»'
            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition placeholder:text-zinc-400"
          />
        </div>

        {/* Контактное лицо + Телефон */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Контактное лицо <span className="text-red-500">*</span></label>
            <input
              value={contactPerson}
              onChange={e => setContactPerson(e.target.value)}
              placeholder="Иванов И.И."
              className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition placeholder:text-zinc-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Телефон <span className="text-red-500">*</span></label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Email + Адрес */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="supplier@mail.ru"
              type="email"
              className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition placeholder:text-zinc-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Адрес</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="г. Москва, ул. Складская, 10"
              className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Превью */}
        {name && (
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider font-semibold">Превью карточки</p>
            <h4 className="font-bold text-zinc-900 dark:text-white">{name}</h4>
            <div className="mt-1 space-y-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {contactPerson && <p>👤 {contactPerson}</p>}
              {phone && <p>📞 {phone}</p>}
              {email && <p>📧 {email}</p>}
              {address && <p>📍 {address}</p>}
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="bg-orange-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Check size={16} /> Добавить поставщика
          </button>
          <button
            onClick={onCancel}
            className="text-zinc-500 font-medium text-sm px-5 py-3 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== ФОРМА СОЗДАНИЯ ЗАЯВКИ =====================
function PurchaseOrderForm({ preselectedSupplier, onSave, onCancel }: {
  preselectedSupplier: number | null;
  onSave: (po: import('../types').PurchaseOrder) => void;
  onCancel: () => void;
}) {
  const { suppliers } = useApp();
  const [supplierId, setSupplierId] = useState<number>(preselectedSupplier || suppliers[0]?.id || 0);
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<Array<{
    ingredientId: number;
    name: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    total: number;
  }>>([]);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [ingSearch, setIngSearch] = useState('');

  const supplier = suppliers.find(s => s.id === supplierId);
  const grandTotal = orderItems.reduce((s, i) => s + i.total, 0);

  // Добавить ингредиент в заявку
  const addIngredient = (ing: typeof ingredients[0]) => {
    if (orderItems.some(i => i.ingredientId === ing.id)) return;
    const suggestedQty = ing.currentStock <= ing.minStock
      ? Math.max(1, ing.minStock * 2 - ing.currentStock)
      : Math.max(1, ing.minStock);
    setOrderItems(prev => [...prev, {
      ingredientId: ing.id,
      name: ing.name,
      quantity: suggestedQty,
      unit: ing.unit,
      pricePerUnit: ing.pricePerUnit,
      total: suggestedQty * ing.pricePerUnit,
    }]);
    setShowIngredientPicker(false);
    setIngSearch('');
  };

  // Обновить количество
  const updateQuantity = (ingredientId: number, quantity: number) => {
    setOrderItems(prev => prev.map(i =>
      i.ingredientId === ingredientId
        ? { ...i, quantity: Math.max(0, quantity), total: Math.max(0, quantity) * i.pricePerUnit }
        : i
    ));
  };

  // Удалить позицию
  const removeItem = (ingredientId: number) => {
    setOrderItems(prev => prev.filter(i => i.ingredientId !== ingredientId));
  };

  // Добавить все с низким остатком
  const addAllLowStock = () => {
    const lowStock = ingredients.filter(i => i.currentStock <= i.minStock);
    lowStock.forEach(ing => {
      if (!orderItems.some(i => i.ingredientId === ing.id)) {
        addIngredient(ing);
      }
    });
  };

  // Сохранить
  const handleSave = (asDraft: boolean) => {
    if (orderItems.length === 0) return;
    const po: import('../types').PurchaseOrder = {
      id: Date.now(),
      supplierId,
      supplierName: supplier?.name || '',
      branchId: 1,
      branchName: 'FoodChain Центр',
      items: orderItems,
      total: grandTotal,
      status: asDraft ? 'draft' : 'sent',
      notes,
      createdBy: 'Вы',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(po);
  };

  const filteredIngredients = ingredients.filter(ing =>
    !orderItems.some(i => i.ingredientId === ing.id) &&
    (ingSearch === '' || ing.name.toLowerCase().includes(ingSearch.toLowerCase()))
  );

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border-2 border-orange-200 dark:border-orange-900/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 py-4 flex items-center justify-between">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">📝 Новая заявка на закупку</h3>
        <button onClick={onCancel} className="text-white/70 hover:text-white transition">
          <X size={20} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Поставщик */}
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Поставщик *</label>
          <select
            value={supplierId}
            onChange={e => setSupplierId(Number(e.target.value))}
            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
          >
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name} — {s.contactPerson}</option>
            ))}
          </select>
          {supplier && (
            <p className="text-xs text-zinc-400 mt-1">📞 {supplier.phone} · 📧 {supplier.email}</p>
          )}
        </div>

        {/* Позиции */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Позиции заявки *</label>
            <div className="flex gap-2">
              {ingredients.some(i => i.currentStock <= i.minStock) && (
                <button onClick={addAllLowStock} className="text-xs text-red-500 font-medium hover:text-red-600 transition flex items-center gap-1">
                  <AlertTriangle size={12} /> + Все с низким остатком
                </button>
              )}
            </div>
          </div>

          {/* Список позиций */}
          {orderItems.length > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl overflow-hidden mb-3">
              {orderItems.map((item, idx) => (
                <div key={item.ingredientId} className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-zinc-200 dark:border-zinc-700' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-zinc-400">{item.pricePerUnit}₽/{item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.ingredientId, item.quantity - 1)} className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition">
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateQuantity(item.ingredientId, Number(e.target.value))}
                      className="w-16 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-900 dark:text-white outline-none focus:border-orange-500 transition"
                      min="0"
                    />
                    <button onClick={() => updateQuantity(item.ingredientId, item.quantity + 1)} className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition">
                      +
                    </button>
                    <span className="text-xs text-zinc-400 w-8">{item.unit}</span>
                  </div>
                  <div className="text-right w-24">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.total.toLocaleString()}₽</p>
                  </div>
                  <button onClick={() => removeItem(item.ingredientId)} className="p-1.5 text-zinc-400 hover:text-red-500 transition">
                    <X size={16} />
                  </button>
                </div>
              ))}
              {/* Итого */}
              <div className="flex items-center justify-between px-4 py-3 bg-orange-50 dark:bg-orange-900/10 border-t border-orange-200 dark:border-orange-900/30">
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Итого: {orderItems.length} поз.</span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{grandTotal.toLocaleString()}₽</span>
              </div>
            </div>
          )}

          {/* Кнопка добавления ингредиента */}
          {!showIngredientPicker ? (
            <button
              onClick={() => setShowIngredientPicker(true)}
              className="w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl py-3 text-sm text-zinc-500 dark:text-zinc-400 hover:border-orange-400 hover:text-orange-500 transition flex items-center justify-center gap-1.5"
            >
              <Plus size={16} /> Добавить ингредиент
            </button>
          ) : (
            <div className="border-2 border-orange-300 dark:border-orange-900/50 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 flex items-center gap-2">
                <Search size={16} className="text-zinc-400" />
                <input
                  value={ingSearch}
                  onChange={e => setIngSearch(e.target.value)}
                  placeholder="Поиск ингредиента..."
                  className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400"
                  autoFocus
                />
                <button onClick={() => { setShowIngredientPicker(false); setIngSearch(''); }} className="text-zinc-400 hover:text-zinc-600 transition">
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredIngredients.length === 0 ? (
                  <p className="text-center text-sm text-zinc-400 py-4">Нет доступных ингредиентов</p>
                ) : (
                  filteredIngredients.map(ing => (
                    <button
                      key={ing.id}
                      onClick={() => addIngredient(ing)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition text-left border-t border-zinc-100 dark:border-zinc-800 first:border-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{ing.name}</p>
                        <p className="text-xs text-zinc-400">Остаток: {ing.currentStock} {ing.unit} · Мин: {ing.minStock} {ing.unit}</p>
                      </div>
                      <span className="text-sm text-zinc-500">{ing.pricePerUnit}₽/{ing.unit}</span>
                      {ing.currentStock <= ing.minStock && (
                        <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded-full font-medium">LOW</span>
                      )}
                      <Plus size={16} className="text-orange-500" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Примечание */}
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Примечание</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Комментарий к заявке, особые условия, сроки..."
            rows={2}
            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition placeholder:text-zinc-400"
          />
        </div>

        {/* Кнопки */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => handleSave(true)}
            disabled={orderItems.length === 0}
            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            💾 Сохранить черновик
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={orderItems.length === 0}
            className="bg-blue-500 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            📤 Отправить поставщику
          </button>
          <button
            onClick={onCancel}
            className="text-zinc-500 font-medium text-sm px-5 py-3 hover:text-zinc-700 dark:hover:text-zinc-300 transition ml-auto"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== ДОСТАВКА =====================
function DeliveryPage() {
  const { orders } = useApp();
  const deliveryOrders = orders.filter(o => o.type === 'delivery' && (o.status === 'ready' || o.status === 'delivering'));

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Карта */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2"><MapPin size={18} className="text-blue-500" /> Карта доставок</h3>
          <div className="aspect-video bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <span className="text-5xl">🗺️</span>
              <p className="text-sm text-zinc-500 mt-2">Карта с активными заказами</p>
              <p className="text-xs text-zinc-400">Яндекс.Карты / OSM</p>
            </div>
          </div>
        </div>

        {/* Зоны доставки */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-3">Зоны доставки</h3>
          <div className="space-y-2">
            {deliveryZones.map(zone => (
              <div key={zone.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white text-sm">{zone.name}</p>
                  <p className="text-xs text-zinc-500">Радиус: {zone.radiusKm} км · Мин: {zone.minOrder}₽ · ~{zone.estimatedTime} мин</p>
                </div>
                <span className="font-bold text-zinc-900 dark:text-white">{zone.deliveryPrice === 0 ? 'Бесплатно' : `${zone.deliveryPrice}₽`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Активные доставки */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
        <h3 className="font-bold text-zinc-900 dark:text-white mb-3">Активные доставки ({deliveryOrders.length})</h3>
        <div className="space-y-2">
          {deliveryOrders.map(o => (
            <div key={o.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${o.status === 'delivering' ? 'bg-purple-500 animate-pulse' : 'bg-green-500'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900 dark:text-white">#{o.id}</span>
                  {o.courierName && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">🚴 {o.courierName}</span>}
                </div>
                <p className="text-xs text-zinc-500">{o.address}</p>
              </div>
              <span className="font-bold text-zinc-900 dark:text-white">{o.total}₽</span>
            </div>
          ))}
          {deliveryOrders.length === 0 && <p className="text-center text-sm text-zinc-400 py-4">Нет активных доставок</p>}
        </div>
      </div>
    </div>
  );
}

// ===================== ФИНАНСЫ =====================
function FinancePage() {
  const { orders } = useApp();
  const today = new Date().toISOString().slice(0,10);
  const weekAgo  = new Date(Date.now()-6*86400000).toISOString().slice(0,10);
  const monthAgo = new Date(Date.now()-29*86400000).toISOString().slice(0,10);
  const sumRev = (arr: typeof orders) => arr.reduce((s,o) => s+o.total,0);
  const avgChk = (arr: typeof orders) => arr.length?Math.round(sumRev(arr)/arr.length):0;
  const todayOrders = orders.filter(o => o.createdAt.slice(0,10)===today);
  const weekOrders  = orders.filter(o => o.createdAt.slice(0,10)>=weekAgo);
  const monthOrders = orders.filter(o => o.createdAt.slice(0,10)>=monthAgo);
  const revenueByDay = Array.from({length:7},(_,i)=>{
    const d = new Date(Date.now()-(6-i)*86400000);
    const ds = d.toISOString().slice(0,10);
    const dayOrds = orders.filter(o=>o.createdAt.slice(0,10)===ds);
    const dow = (d.getDay()+6)%7;
    const DAY = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    return { day: DAY[dow], value: sumRev(dayOrds) };
  });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Сегодня" value={`${sumRev(todayOrders).toLocaleString()}₽`} change="" trend="up" icon={DollarSign} color="from-green-500 to-emerald-500" />
        <StatCard label="7 дней" value={`${sumRev(weekOrders).toLocaleString()}₽`} change="" trend="up" icon={TrendingUp} color="from-blue-500 to-cyan-500" />
        <StatCard label="30 дней" value={`${sumRev(monthOrders).toLocaleString()}₽`} change="" trend="up" icon={Activity} color="from-purple-500 to-pink-500" />
        <StatCard label="Ср. чек" value={avgChk(orders)?`${avgChk(orders).toLocaleString()}₽`:'—'} change="" trend="up" icon={ShoppingBag} color="from-orange-500 to-red-500" />
      </div>

      {orders.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center shadow-sm border border-zinc-100 dark:border-zinc-800">
          <span className="text-4xl block mb-3">💰</span>
          <p className="text-zinc-500">Финансовые данные появятся после первых заказов</p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-zinc-900 dark:text-white">Выручка по дням (7 дней)</h3>
            <button className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1"><Download size={14} /> Экспорт CSV</button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()}₽`, 'Выручка']} />
              <Bar dataKey="value" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Промокоды */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
        <h3 className="font-bold text-zinc-900 dark:text-white mb-3">Эффективность промокодов</h3>
        <div className="space-y-2">
          {promoCodes.map(p => (
            <div key={p.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 flex items-center gap-3">
              <span className="font-mono font-bold text-orange-500 text-sm">{p.code}</span>
              <span className="text-xs text-zinc-500">{p.type === 'percent' ? `${p.value}%` : `${p.value}₽`}</span>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>{p.usedCount} / {p.maxUses}</span>
                  <span>{Math.round(p.usedCount / p.maxUses * 100)}%</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                  <div className="bg-orange-500 rounded-full h-1.5" style={{ width: `${Math.min(100, p.usedCount / p.maxUses * 100)}%` }} />
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-500'}`}>{p.isActive ? 'Активен' : 'Неактивен'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================== МАРКЕТИНГ =====================
function MarketingPage() {
  const [tab, setTab] = useState<'promos' | 'campaigns' | 'ab'>('promos');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['promos', 'campaigns', 'ab'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t ? 'bg-orange-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'}`}>
            {t === 'promos' ? '🎟️ Промокоды' : t === 'campaigns' ? '📢 Рассылки' : '🔬 A/B тесты'}
          </button>
        ))}
        <button className="ml-auto bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5"><Plus size={16} /> Создать</button>
      </div>

      {tab === 'promos' && (
        <div className="grid md:grid-cols-2 gap-4">
          {promoCodes.map(p => (
            <div key={p.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-lg font-bold text-orange-500">{p.code}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-500'}`}>{p.isActive ? 'Активен' : 'Неактивен'}</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{p.type === 'percent' ? `Скидка ${p.value}%` : `Скидка ${p.value}₽`} · Мин. заказ {p.minOrder}₽</p>
              <p className="text-xs text-zinc-400 mt-1">Использований: {p.usedCount}/{p.maxUses} · До {p.expiresAt}</p>
              <div className="flex gap-2 mt-3">
                <button className="text-xs text-blue-500 font-medium">Редактировать</button>
                <button className="text-xs text-red-500 font-medium">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-zinc-900 dark:text-white">{c.name}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'completed' ? 'bg-zinc-200 text-zinc-500' : 'bg-amber-100 text-amber-700'}`}>{c.status === 'active' ? 'Активна' : c.status === 'completed' ? 'Завершена' : 'Черновик'}</span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{c.message}</p>
              <div className="flex gap-4 mt-3 text-xs text-zinc-400">
                <span>📤 Отправлено: {c.sentCount}</span>
                <span>👀 Открыто: {c.openCount} ({c.sentCount > 0 ? Math.round(c.openCount / c.sentCount * 100) : 0}%)</span>
                <span>{c.type === 'trigger' ? `⚡ Триггер: ${c.triggerType}` : '✋ Ручная'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'ab' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
          <span className="text-5xl">🔬</span>
          <h3 className="font-bold text-zinc-900 dark:text-white mt-3">A/B тестирование</h3>
          <p className="text-sm text-zinc-500 mt-2">Создайте тест для сравнения разных версий акций и рассылок</p>
          <button className="mt-4 bg-orange-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl">Создать первый тест</button>
        </div>
      )}
    </div>
  );
}

// ===================== ПЕРСОНАЛ =====================
function StaffPage() {
  const [tab, setTab] = useState<'list' | 'shifts' | 'kpi'>('list');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['list', 'shifts', 'kpi'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t ? 'bg-orange-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'}`}>
            {t === 'list' ? '👥 Сотрудники' : t === 'shifts' ? '📅 Смены' : '📊 KPI'}
          </button>
        ))}
        <button className="ml-auto bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5"><UserPlus size={16} /> Добавить</button>
      </div>

      {tab === 'list' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-100 dark:border-zinc-800">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Сотрудник</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Роль</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Филиал</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Рейтинг</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Статус</th>
            </tr></thead>
            <tbody>
              {staffList.map(s => (
                <tr key={s.id} className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-white">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-zinc-400">{s.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {s.role === 'courier' ? '🚴 Курьер' : s.role === 'waiter' ? '🍽️ Официант' : s.role === 'chef' ? '👨‍🍳 Шеф' : s.role === 'manager' ? '👔 Управляющий' : s.role}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{s.branchName}</td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1"><Star size={14} fill="#f59e0b" className="text-amber-400" />{s.avgRating || '–'}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.isActive ? 'Активен' : 'Неактивен'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'shifts' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-3">Смены на 16.01.2025</h3>
          <div className="space-y-2">
            {shifts.map(s => (
              <div key={s.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${s.isConfirmed ? 'bg-green-500' : 'bg-amber-500'}`} />
                <div className="flex-1">
                  <p className="font-medium text-sm text-zinc-900 dark:text-white">{s.staffName}</p>
                  <p className="text-xs text-zinc-400">{s.startTime} — {s.endTime}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.isConfirmed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{s.isConfirmed ? 'Подтверждена' : 'Ожидает'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'kpi' && (
        <div className="grid md:grid-cols-2 gap-4">
          {staffList.filter(s => s.isActive).map(s => (
            <div key={s.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">{s.firstName[0]}</div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-zinc-500">{s.role === 'courier' ? 'Курьер' : s.role === 'waiter' ? 'Официант' : s.role === 'chef' ? 'Шеф-повар' : 'Управляющий'}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl py-2">
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{s.kpiScore}</p>
                  <p className="text-[10px] text-zinc-400">KPI</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl py-2">
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">{s.ordersHandled}</p>
                  <p className="text-[10px] text-zinc-400">Заказов</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl py-2">
                  <p className="text-lg font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-0.5"><Star size={12} fill="#f59e0b" className="text-amber-400" />{s.avgRating || '–'}</p>
                  <p className="text-[10px] text-zinc-400">Рейтинг</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== НАСТРОЙКИ =====================
function SettingsPage() {
  const { theme, toggleTheme, adminRole, setAdminRole } = useApp();
  const [settings, setSettings] = useState({
    networkName: 'FoodChain', phone: '+7 (800) 123-45-67',
    deliveryEnabled: true, bookingEnabled: true, loyaltyEnabled: true,
    welcomeMessage: 'Добро пожаловать в FoodChain! 🍔🍕🍣'
  });

  const roleOptions: { role: UserRole; name: string; icon: string; desc: string; color: string }[] = [
    { role: 'superadmin', name: 'Суперадмин', icon: '👑', desc: 'Полный доступ ко всему, создание филиалов и админов', color: 'from-yellow-400 to-orange-500' },
    { role: 'owner', name: 'Владелец сети', icon: '🏢', desc: 'Все филиалы, финансы, аналитика, маркетинг', color: 'from-purple-500 to-pink-500' },
    { role: 'manager', name: 'Управляющий', icon: '👔', desc: 'Меню, заказы, бронирования, персонал филиала', color: 'from-blue-500 to-cyan-500' },
    { role: 'chef', name: 'Шеф-повар', icon: '👨‍🍳', desc: 'Экран кухни, стоп-лист, списание ингредиентов', color: 'from-orange-500 to-red-500' },
    { role: 'waiter', name: 'Официант', icon: '🍽️', desc: 'Схема зала, приём заказов за столом, закрытие чеков', color: 'from-green-500 to-emerald-500' },
    { role: 'courier', name: 'Курьер', icon: '🚴', desc: 'Приём заказов на доставку, трекинг, статусы', color: 'from-cyan-500 to-blue-500' },
    { role: 'accountant', name: 'Бухгалтер', icon: '📊', desc: 'Финансовые отчёты, выгрузка в Excel', color: 'from-indigo-500 to-purple-500' },
    { role: 'analyst', name: 'Аналитик', icon: '📈', desc: 'Дашборды, прогнозы, визуализация', color: 'from-amber-500 to-yellow-500' },
  ];
  const currentRole = roleOptions.find(r => r.role === adminRole) || roleOptions[0];

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Текущая роль и переключатель */}
      <div className={`bg-gradient-to-br ${currentRole.color} rounded-2xl p-5 text-white shadow-lg`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{currentRole.icon}</span>
          <div>
            <p className="text-white/70 text-xs uppercase tracking-wider font-semibold">Ваша роль (Демо)</p>
            <h2 className="text-xl font-bold">{currentRole.name}</h2>
          </div>
        </div>
        <p className="text-white/80 text-sm mb-4">{currentRole.desc}</p>
        <div className="bg-black/20 rounded-xl p-3">
          <label className="text-xs text-white/70 uppercase tracking-wider font-semibold mb-2 block">Сменить роль для тестирования:</label>
          <select value={adminRole} onChange={e => setAdminRole(e.target.value as UserRole)} className="w-full bg-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none border border-white/20">
            {roleOptions.map(r => (
              <option key={r.role} value={r.role} className="text-zinc-900">{r.icon} {r.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-4">
        <h3 className="font-bold text-zinc-900 dark:text-white">Общие настройки</h3>
        {[['Название сети', 'networkName'], ['Телефон', 'phone']].map(([label, key]) => (
          <div key={key as string}>
            <label className="text-xs text-zinc-500 mb-1 block">{label as string}</label>
            <input value={(settings as any)[key as string]} onChange={e => setSettings(prev => ({ ...prev, [key as string]: e.target.value }))} className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none" />
          </div>
        ))}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Приветственное сообщение бота</label>
          <textarea value={settings.welcomeMessage} onChange={e => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))} rows={3} className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none resize-none" />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-3">
        <h3 className="font-bold text-zinc-900 dark:text-white">Модули</h3>
        {[['Доставка', 'deliveryEnabled'], ['Бронирование', 'bookingEnabled'], ['Программа лояльности', 'loyaltyEnabled']].map(([label, key]) => (
          <div key={key as string} className="flex items-center justify-between py-2">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{label as string}</span>
            <button onClick={() => setSettings(prev => ({ ...prev, [key as string]: !(prev as any)[key as string] }))}
              className={`w-12 h-7 rounded-full transition-colors ${(settings as any)[key as string] ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-1 ${(settings as any)[key as string] ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-3">
        <h3 className="font-bold text-zinc-900 dark:text-white">Тема оформления</h3>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            {theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}
          </span>
          <button onClick={toggleTheme} className={`w-12 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-orange-500' : 'bg-zinc-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-1 ${theme === 'dark' ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-3">
        <h3 className="font-bold text-zinc-900 dark:text-white">Филиалы</h3>
        {branches.map(b => (
          <div key={b.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 flex items-center gap-3">
            <MapPin size={18} className="text-orange-500" />
            <div className="flex-1">
              <p className="font-medium text-sm text-zinc-900 dark:text-white">{b.name}</p>
              <p className="text-xs text-zinc-400">{b.address}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{b.isActive ? 'Активен' : 'Закрыт'}</span>
          </div>
        ))}
      </div>

      <button className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/30">Сохранить настройки</button>
    </div>
  );
}

// ===================== ОТЗЫВЫ КЛИЕНТОВ =====================
function ReviewsAdminPage() {
  const { reviews, approveReview, rejectReview, replyReview, addNotification, orders, registeredUsers } = useApp();
  const [filter, setFilter] = useState<'all' | 'new' | 'approved' | 'rejected'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'mobile_app' | 'telegram' | 'website'>('all');
  const [ratingFilter, setRatingFilter] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [profileUser, setProfileUser] = useState<{ name: string; userId: number } | null>(null);

  // Найти реального пользователя по имени из отзыва (в демо userId = 0, матчинг по имени)
  const findUserByName = (name: string) => {
    return registeredUsers.find(u => u.name === name || (name.split(' ')[0] && u.name.split(' ')[0] === name.split(' ')[0]));
  };

  // Все заказы клиента по userId (в демо userId=0 — матчим по имени)
  const getClientOrders = (name: string) => {
    return orders.filter(o => o.userName === name).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  };

  // Открыть профиль по клику
  const openClientProfile = (name: string, userId: number) => {
    setProfileUser({ name, userId });
  };

  // Фильтрация
  let filtered = [...reviews];
  if (filter === 'new')      filtered = filtered.filter(r => !r.isModerated);
  if (filter === 'approved') filtered = filtered.filter(r => r.isModerated && r.isVisible);
  if (filter === 'rejected') filtered = filtered.filter(r => r.isModerated && !r.isVisible);
  if (sourceFilter !== 'all') filtered = filtered.filter(r => r.source === sourceFilter);
  if (ratingFilter > 0) filtered = filtered.filter(r => r.rating === ratingFilter);
  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Статистика
  const total = reviews.length;
  const pending = reviews.filter(r => !r.isModerated).length;
  const avgRating = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '—';
  const bySource = {
    mobile_app: reviews.filter(r => r.source === 'mobile_app').length,
    telegram: reviews.filter(r => r.source === 'telegram').length,
    website: reviews.filter(r => r.source === 'website').length,
  };

  const sourceLabel = (s: string) =>
    s === 'mobile_app' ? '📱 Приложение' : s === 'telegram' ? '🤖 Telegram' : '🌐 Сайт';
  const sourceBadge = (s: string) =>
    s === 'mobile_app' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
    s === 'telegram' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' :
    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин. назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч. назад`;
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  };

  const handleApprove = (id: number) => {
    approveReview(id);
    addNotification(n('review', '✅ Отзыв одобрен', `Отзыв #${id} опубликован`, 'reviews'));
  };
  const handleReject = (id: number) => {
    rejectReview(id);
    addNotification(n('review', '🚫 Отзыв отклонён', `Отзыв #${id} скрыт`, 'reviews'));
  };
  const handleReply = (id: number) => {
    if (!replyText.trim()) return;
    replyReview(id, replyText.trim());
    setReplyingId(null);
    setReplyText('');
    addNotification(n('review', '💬 Ответ добавлен', `Ответ на отзыв #${id}`, 'reviews'));
  };

  return (
    <div className="space-y-5">
      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg">⭐</div>
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{avgRating}</p>
            <p className="text-xs text-zinc-500">Средний рейтинг</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg">💬</div>
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{total}</p>
            <p className="text-xs text-zinc-500">Всего отзывов</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg ${pending > 0 ? 'bg-gradient-to-br from-red-400 to-red-600 animate-pulse' : 'bg-gradient-to-br from-zinc-400 to-zinc-500'}`}>🕐</div>
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{pending}</p>
            <p className="text-xs text-zinc-500">Ожидают модерации</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 mb-2 font-medium">По источнику</p>
          <div className="space-y-1">
            {(['mobile_app','telegram','website'] as const).map(src => (
              <div key={src} className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 w-24 truncate">{sourceLabel(src).split(' ')[1]}</span>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${src === 'mobile_app' ? 'bg-blue-500' : src === 'telegram' ? 'bg-sky-500' : 'bg-purple-500'}`}
                    style={{ width: total > 0 ? `${bySource[src]/total*100}%` : '0%' }} />
                </div>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 w-5 text-right">{bySource[src]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-3">
        <div className="flex flex-wrap gap-2">
          {([['all','Все'], ['new','Новые'], ['approved','Одобренные'], ['rejected','Отклонённые']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition ${filter === k ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
              {l} {k === 'new' && pending > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pending}</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          {([['all', 'Все источники'], ['mobile_app', '📱 Приложение'], ['telegram', '🤖 Telegram'], ['website', '🌐 Сайт']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setSourceFilter(k)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${sourceFilter === k ? 'bg-zinc-800 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
              {l}
            </button>
          ))}
          <div className="flex gap-1 ml-auto">
            {[0,1,2,3,4,5].map(r => (
              <button key={r} onClick={() => setRatingFilter(r as 0|1|2|3|4|5)}
                className={`w-8 h-7 rounded-lg text-sm transition ${ratingFilter === r ? 'bg-amber-400 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200'}`}>
                {r === 0 ? '★' : `${r}★`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Живой индикатор */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
        Живая лента — отзывы приходят автоматически из всех источников · {filtered.length} шт.
      </div>

      {/* Список отзывов */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
          <MessageSquare size={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">Нет отзывов по выбранным фильтрам</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <div key={review.id}
              className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border transition-all overflow-hidden ${
                !review.isModerated
                  ? 'border-orange-300 dark:border-orange-700 ring-1 ring-orange-200 dark:ring-orange-900/40'
                  : review.isVisible
                    ? 'border-green-200 dark:border-green-900/40'
                    : 'border-zinc-200 dark:border-zinc-800 opacity-60'
              }`}>
              {/* Шапка */}
              <div className="flex items-start gap-3 p-4 pb-3">
                {/* Аватар (клик → профиль) */}
                <button onClick={() => openClientProfile(review.userName, review.userId)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 hover:scale-110 transition-transform ring-2 ring-transparent hover:ring-orange-300">
                  {review.userName[0]}
                </button>
                {/* Инфо */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => openClientProfile(review.userName, review.userId)}
                      className="font-semibold text-zinc-900 dark:text-white text-sm hover:text-orange-500 dark:hover:text-orange-400 transition-colors flex items-center gap-1 group">
                      {review.userName}
                      <ChevronDown size={12} className="-rotate-90 opacity-0 group-hover:opacity-100 transition" />
                    </button>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sourceBadge(review.source)}`}>
                      {sourceLabel(review.source)}
                    </span>
                    {!review.isModerated && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 animate-pulse">
                        ● Новый
                      </span>
                    )}
                    {review.isModerated && review.isVisible && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        ✓ Опубликован
                      </span>
                    )}
                    {review.isModerated && !review.isVisible && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        ✗ Скрыт
                      </span>
                    )}
                    <span className="text-xs text-zinc-400 ml-auto">{fmtTime(review.createdAt)}</span>
                  </div>
                  {/* Рейтинг */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} fill={s <= review.rating ? '#f59e0b' : 'none'} className={s <= review.rating ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{review.rating}.0</span>
                    <span className="text-xs text-zinc-400">·</span>
                    <span className="text-xs text-zinc-500">🍽️ {review.dishName}</span>
                    {review.branchName && <><span className="text-xs text-zinc-400">·</span><span className="text-xs text-zinc-500">📍 {review.branchName}</span></>}
                  </div>
                </div>
              </div>

              {/* Текст отзыва */}
              <div className="px-4 pb-3">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5">
                  {review.text}
                </p>
                {review.photoUrl && (
                  <img src={review.photoUrl} alt="фото" className="mt-2 rounded-xl h-24 object-cover" />
                )}
              </div>

              {/* Ответ ресторана */}
              {review.reply && (
                <div className="mx-4 mb-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl px-3 py-2.5">
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-0.5">💬 Ответ ресторана:</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{review.reply}</p>
                </div>
              )}

              {/* Форма ответа */}
              {replyingId === review.id && (
                <div className="mx-4 mb-3 space-y-2">
                  <textarea
                    value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder="Ваш ответ клиенту..."
                    rows={2}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-orange-400 placeholder:text-zinc-400"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleReply(review.id)} disabled={!replyText.trim()}
                      className="bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-40 hover:bg-orange-600 transition">
                      Опубликовать ответ
                    </button>
                    <button onClick={() => { setReplyingId(null); setReplyText(''); }}
                      className="text-zinc-500 text-sm px-3 py-2 hover:text-zinc-700 transition">
                      Отмена
                    </button>
                  </div>
                </div>
              )}

              {/* Действия */}
              <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-2">
                {!review.isModerated && (
                  <>
                    <button onClick={() => handleApprove(review.id)}
                      className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-600 transition">
                      <Check size={14} /> Одобрить
                    </button>
                    <button onClick={() => handleReject(review.id)}
                      className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-600 transition">
                      <X size={14} /> Отклонить
                    </button>
                  </>
                )}
                {review.isModerated && review.isVisible && (
                  <button onClick={() => handleReject(review.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 px-2 py-1.5 transition">
                    <X size={14} /> Скрыть
                  </button>
                )}
                {review.isModerated && !review.isVisible && (
                  <button onClick={() => handleApprove(review.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-green-500 hover:text-green-600 px-2 py-1.5 transition">
                    <Check size={14} /> Восстановить
                  </button>
                )}
                {!review.reply && review.isVisible && (
                  <button onClick={() => { setReplyingId(review.id); setReplyText(''); }}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-600 px-2 py-1.5 transition ml-auto">
                    <Reply size={14} /> Ответить
                  </button>
                )}
                <span className="text-xs text-zinc-300 dark:text-zinc-600 ml-auto">#{review.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === Модалка профиля клиента === */}
      {profileUser && <ClientProfileModal name={profileUser.name} userId={profileUser.userId} onClose={() => setProfileUser(null)} getClientOrders={getClientOrders} findUserByName={findUserByName} />}
    </div>
  );
}

// ===================== МОДАЛКА ПРОФИЛЯ КЛИЕНТА =====================
function ClientProfileModal({ name, onClose, getClientOrders, findUserByName }: {
  name: string;
  userId?: number;
  onClose: () => void;
  getClientOrders: (n: string) => Order[];
  findUserByName: (n: string) => RegisteredUser | undefined;
}) {
  const { addNotification, updateUserBonus, clientChats, sendMessageToClient, addOrder } = useApp();
  const user = findUserByName(name);
  const clientOrders = getClientOrders(name);

  // Активная панель действия
  const [activePanel, setActivePanel] = useState<'call' | 'chat' | 'bonus' | 'order' | null>(null);

  // === Звонок ===
  const [callState, setCallState] = useState<'idle' | 'dialing' | 'connected' | 'ended'>('idle');
  const [callSeconds, setCallSeconds] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (callState === 'dialing') {
      timer = setTimeout(() => setCallState('connected'), 2500) as any;
    } else if (callState === 'connected') {
      timer = setInterval(() => setCallSeconds(s => s + 1), 1000);
    }
    return () => { if (timer) { clearInterval(timer); clearTimeout(timer as any); } };
  }, [callState]);
  const fmtCall = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // === Чат ===
  const [chatInput, setChatInput] = useState('');
  const chatMessages = user ? (clientChats[user.id] || []) : [];

  // === Бонус ===
  const [bonusAmount, setBonusAmount] = useState(200);
  const [bonusComment, setBonusComment] = useState('');

  // === Заказ ===
  const [orderItems, setOrderItems] = useState<Array<{ dishId: number; name: string; price: number; qty: number }>>([]);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup' | 'dine_in'>('delivery');

  if (!user) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <span className="text-5xl mb-3 block">👤</span>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{name}</h2>
          <p className="text-sm text-zinc-500">Клиент ещё не зарегистрировался в системе.<br/>Он оставил отзыв анонимно (гостевой режим).</p>
          <button onClick={onClose} className="mt-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-5 py-2 rounded-xl text-sm font-medium">Закрыть</button>
        </div>
      </div>
    );
  }

  const sourceLabel = user.source === 'telegram' ? '🤖 Telegram' : user.source === 'mobile_app' ? '📱 Мобильное приложение' : '🌐 Веб-сайт';
  const loyaltyLabel: Record<string, { name: string; color: string; icon: string }> = {
    newbie:    { name: 'Новичок',   color: 'from-zinc-400 to-zinc-500',     icon: '⭐' },
    silver:    { name: 'Серебро',   color: 'from-slate-300 to-slate-500',  icon: '🥈' },
    gold:      { name: 'Золото',    color: 'from-amber-400 to-amber-600',   icon: '🥇' },
    platinum:  { name: 'Платина',   color: 'from-purple-500 to-fuchsia-500',icon: '💎' },
  };
  const lvl = loyaltyLabel[user.loyaltyLevel || 'newbie'];
  const totalRev = clientOrders.reduce((s, o) => s + o.total, 0);
  const avgCheck = clientOrders.length > 0 ? Math.round(totalRev / clientOrders.length) : 0;
  const fmtDate = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtShort = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
        style={{ animation: 'slideDownFade 0.2s ease-out' }}>
        <div className={`bg-gradient-to-br ${lvl.color} p-6 text-white relative`}>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition">
            <X size={18} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur flex items-center justify-center text-3xl font-bold border-4 border-white/40">
              {user.name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-white/80 text-sm flex items-center gap-2 mt-1">
                <span>{lvl.icon}</span> {lvl.name} · ID #{user.id}
              </p>
              <p className="text-white/70 text-xs mt-1">{sourceLabel}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
              <p className="text-xs text-zinc-400 mb-1">📞 Телефон</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{user.phone}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
              <p className="text-xs text-zinc-400 mb-1">📧 Email</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{user.email || '—'}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
              <p className="text-xs text-zinc-400 mb-1">🎂 День рождения</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{user.birthday ? fmtShort(user.birthday) : '—'}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
              <p className="text-xs text-zinc-400 mb-1">📅 Регистрация</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{fmtShort(user.registeredAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{clientOrders.length}</p>
              <p className="text-[10px] text-zinc-500">Заказов</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalRev.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-500">Потрачено ₽</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{avgCheck}</p>
              <p className="text-[10px] text-zinc-500">Ср. чек ₽</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{user.bonusBalance || 0}</p>
              <p className="text-[10px] text-zinc-500">Бонусы ₽</p>
            </div>
          </div>

          {/* Кнопки действий — переключают панели */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setActivePanel(activePanel === 'call' ? null : 'call'); setCallState('idle'); setCallSeconds(0); }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition ${activePanel === 'call' ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>📞 Позвонить</button>
            <button onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
              className={`relative flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition ${activePanel === 'chat' ? 'bg-green-600 text-white ring-2 ring-green-300' : 'bg-green-500 text-white hover:bg-green-600'}`}>
              💬 Написать
              {chatMessages.filter(m => !m.fromAdmin && !m.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center">{chatMessages.filter(m => !m.fromAdmin).length}</span>
              )}
            </button>
            <button onClick={() => setActivePanel(activePanel === 'bonus' ? null : 'bonus')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition ${activePanel === 'bonus' ? 'bg-amber-600 text-white ring-2 ring-amber-300' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>🎁 Начислить бонус</button>
            <button onClick={() => setActivePanel(activePanel === 'order' ? null : 'order')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition ${activePanel === 'order' ? 'bg-orange-600 text-white ring-2 ring-orange-300' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>🍕 Создать заказ</button>
          </div>

          {/* === ПАНЕЛЬ: ЗВОНОК === */}
          {activePanel === 'call' && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-5 text-center" style={{ animation: 'slideDownFade 0.2s ease-out' }}>
              {callState === 'idle' && (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-500 flex items-center justify-center text-2xl mb-3">📞</div>
                  <p className="font-bold text-zinc-900 dark:text-white">{user.name}</p>
                  <p className="text-lg font-mono text-blue-600 dark:text-blue-400 mb-4">{user.phone}</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => { setCallState('dialing'); addNotification(n('system', '📞 Исходящий звонок', `Звонок клиенту ${user.name} (${user.phone})`, 'reviews')); }}
                      className="bg-green-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-green-600 transition flex items-center gap-2">
                      📞 Набрать
                    </button>
                    <a href={`tel:${user.phone.replace(/[^+\d]/g, '')}`}
                      className="bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-600 transition flex items-center gap-2">
                      📱 Через телефон
                    </a>
                  </div>
                </>
              )}
              {callState === 'dialing' && (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-500 flex items-center justify-center text-2xl mb-3 animate-pulse">📞</div>
                  <p className="font-bold text-zinc-900 dark:text-white">{user.name}</p>
                  <p className="text-sm text-blue-500 animate-pulse mb-4">Соединение...</p>
                  <button onClick={() => setCallState('idle')} className="bg-red-500 text-white font-semibold px-6 py-2.5 rounded-xl">✕ Отменить</button>
                </>
              )}
              {callState === 'connected' && (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-500 flex items-center justify-center text-2xl mb-3 ring-4 ring-green-200 dark:ring-green-900">🎙️</div>
                  <p className="font-bold text-zinc-900 dark:text-white">{user.name}</p>
                  <p className="text-2xl font-mono font-bold text-green-600 dark:text-green-400 my-2">{fmtCall(callSeconds)}</p>
                  <p className="text-xs text-zinc-400 mb-4">Разговор идёт · линия защищена</p>
                  <button onClick={() => { setCallState('ended'); addNotification(n('system', '📞 Звонок завершён', `Разговор с ${user.name} — ${fmtCall(callSeconds)}`, 'reviews')); }}
                    className="bg-red-500 text-white font-semibold px-8 py-2.5 rounded-xl hover:bg-red-600 transition">📵 Завершить</button>
                </>
              )}
              {callState === 'ended' && (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-zinc-400 flex items-center justify-center text-2xl mb-3">✅</div>
                  <p className="font-bold text-zinc-900 dark:text-white">Звонок завершён</p>
                  <p className="text-sm text-zinc-500 mb-4">Длительность: {fmtCall(callSeconds)}</p>
                  <button onClick={() => { setCallState('idle'); setCallSeconds(0); }} className="bg-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-xl">Позвонить ещё раз</button>
                </>
              )}
            </div>
          )}

          {/* === ПАНЕЛЬ: ЧАТ === */}
          {activePanel === 'chat' && (
            <div className="bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800 rounded-2xl overflow-hidden" style={{ animation: 'slideDownFade 0.2s ease-out' }}>
              <div className="px-4 py-2.5 bg-green-500 text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-semibold">Чат с {user.name}</span>
                <span className="text-xs text-white/70 ml-auto">через {user.source === 'telegram' ? 'Telegram' : 'приложение'}</span>
              </div>
              <div className="h-56 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-white dark:bg-zinc-900">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <span className="text-3xl mb-2">💬</span>
                    <p className="text-sm text-zinc-400">Начните диалог с клиентом.<br/>Сообщение придёт ему в {user.source === 'telegram' ? 'Telegram' : 'приложение'}.</p>
                  </div>
                ) : (
                  chatMessages.map(m => (
                    <div key={m.id} className={`flex ${m.fromAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${m.fromAdmin ? 'bg-green-500 text-white rounded-br-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-md'}`}>
                        <p>{m.text}</p>
                        <p className={`text-[9px] mt-0.5 ${m.fromAdmin ? 'text-white/60' : 'text-zinc-400'}`}>
                          {new Date(m.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          {m.fromAdmin && ' ✓✓'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && chatInput.trim()) { sendMessageToClient(user.id, chatInput.trim()); setChatInput(''); addNotification(n('system', '💬 Сообщение отправлено', `${user.name}: «${chatInput.trim().slice(0, 40)}»`, 'reviews')); } }}
                  placeholder="Введите сообщение..."
                  className="flex-1 bg-white dark:bg-zinc-900 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 focus:border-green-500"
                />
                <button
                  onClick={() => { if (chatInput.trim()) { sendMessageToClient(user.id, chatInput.trim()); setChatInput(''); addNotification(n('system', '💬 Сообщение отправлено', `${user.name}: «${chatInput.trim().slice(0, 40)}»`, 'reviews')); } }}
                  disabled={!chatInput.trim()}
                  className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-green-600 transition">
                  ➤
                </button>
              </div>
              {/* Быстрые шаблоны */}
              <div className="px-3 pb-3 bg-zinc-50 dark:bg-zinc-800 flex gap-1.5 flex-wrap">
                {['Спасибо за отзыв! 🙏', 'Приносим извинения, исправимся!', 'Дарим вам промокод SORRY15 🎁'].map(t => (
                  <button key={t} onClick={() => setChatInput(t)} className="text-[10px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded-lg text-zinc-500 hover:border-green-400 transition">{t}</button>
                ))}
              </div>
            </div>
          )}

          {/* === ПАНЕЛЬ: БОНУС === */}
          {activePanel === 'bonus' && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-4 space-y-3" style={{ animation: 'slideDownFade 0.2s ease-out' }}>
              <div className="flex items-center justify-between">
                <p className="font-bold text-zinc-900 dark:text-white text-sm">🎁 Начисление бонусов</p>
                <p className="text-xs text-zinc-500">Текущий баланс: <strong className="text-amber-600">{user.bonusBalance || 0}₽</strong></p>
              </div>
              <div className="flex gap-2">
                {[100, 200, 500, 1000].map(v => (
                  <button key={v} onClick={() => setBonusAmount(v)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${bonusAmount === v ? 'bg-amber-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-amber-200 dark:border-amber-800'}`}>
                    +{v}₽
                  </button>
                ))}
              </div>
              <input
                type="number" value={bonusAmount} onChange={e => setBonusAmount(Math.max(0, Number(e.target.value)))}
                className="w-full bg-white dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none border border-amber-200 dark:border-amber-800 focus:border-amber-500"
                placeholder="Своя сумма"
              />
              <input
                value={bonusComment} onChange={e => setBonusComment(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none border border-amber-200 dark:border-amber-800 focus:border-amber-500"
                placeholder="Комментарий (например: компенсация за отзыв)"
              />
              <button
                onClick={() => {
                  updateUserBonus(user.id, bonusAmount);
                  addNotification(n('system', '🎁 Бонус начислен', `+${bonusAmount}₽ для ${user.name}${bonusComment ? ` · ${bonusComment}` : ''} · Клиент получил push-уведомление`, 'reviews'));
                  sendMessageToClient(user.id, `🎁 Вам начислено ${bonusAmount} бонусных рублей!${bonusComment ? ` (${bonusComment})` : ''} Спасибо, что вы с нами!`);
                  setActivePanel(null);
                  setBonusComment('');
                }}
                disabled={bonusAmount <= 0}
                className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 transition disabled:opacity-40">
                Начислить {bonusAmount}₽ → клиент получит уведомление
              </button>
            </div>
          )}

          {/* === ПАНЕЛЬ: СОЗДАНИЕ ЗАКАЗА === */}
          {activePanel === 'order' && (
            <div className="bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-800 rounded-2xl p-4 space-y-3" style={{ animation: 'slideDownFade 0.2s ease-out' }}>
              <p className="font-bold text-zinc-900 dark:text-white text-sm">🍕 Новый заказ для {user.name}</p>
              {/* Тип заказа */}
              <div className="flex gap-2">
                {([['delivery', '🚗 Доставка'], ['pickup', '🏪 Самовынос'], ['dine_in', '🍽️ В зале']] as const).map(([t, l]) => (
                  <button key={t} onClick={() => setOrderType(t)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${orderType === t ? 'bg-orange-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-orange-200 dark:border-orange-800'}`}>
                    {l}
                  </button>
                ))}
              </div>
              {/* Выбор блюд */}
              <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1.5">
                {dishes.slice(0, 8).map(d => {
                  const inOrder = orderItems.find(i => i.dishId === d.id);
                  return (
                    <div key={d.id} className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-xl px-3 py-2">
                      <span className="flex-1 text-sm text-zinc-900 dark:text-white truncate">{d.name}</span>
                      <span className="text-xs text-zinc-400">{d.price}₽</span>
                      {inOrder ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setOrderItems(prev => prev.map(i => i.dishId === d.id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0))}
                            className="w-6 h-6 bg-orange-100 dark:bg-orange-900/40 text-orange-600 rounded-lg text-sm font-bold">−</button>
                          <span className="text-sm font-bold text-zinc-900 dark:text-white w-4 text-center">{inOrder.qty}</span>
                          <button onClick={() => setOrderItems(prev => prev.map(i => i.dishId === d.id ? { ...i, qty: i.qty + 1 } : i))}
                            className="w-6 h-6 bg-orange-500 text-white rounded-lg text-sm font-bold">+</button>
                        </div>
                      ) : (
                        <button onClick={() => setOrderItems(prev => [...prev, { dishId: d.id, name: d.name, price: d.price, qty: 1 }])}
                          className="w-6 h-6 bg-orange-500 text-white rounded-lg text-sm font-bold">+</button>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Итого и кнопка */}
              {orderItems.length > 0 && (
                <>
                  <div className="flex items-center justify-between bg-white dark:bg-zinc-800 rounded-xl px-3 py-2">
                    <span className="text-sm text-zinc-500">{orderItems.reduce((s, i) => s + i.qty, 0)} поз.</span>
                    <span className="font-bold text-orange-600 text-lg">{orderItems.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString()}₽</span>
                  </div>
                  <button
                    onClick={() => {
                      const total = orderItems.reduce((s, i) => s + i.price * i.qty, 0) + (orderType === 'delivery' ? 199 : 0);
                      const newOrder: Order = {
                        id: Date.now() % 100000,
                        userId: user.id, userName: user.name, userPhone: user.phone,
                        branchId: 1, branchName: 'FoodChain Центр',
                        type: orderType, status: 'new',
                        items: orderItems.map(i => ({ dishId: i.dishId, name: i.name, price: i.price, quantity: i.qty, options: [] })),
                        subtotal: orderItems.reduce((s, i) => s + i.price * i.qty, 0),
                        deliveryFee: orderType === 'delivery' ? 199 : 0,
                        discount: 0, bonusUsed: 0, total,
                        paymentMethod: 'card', isPaid: false,
                        comment: `Создан менеджером из профиля клиента`,
                        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                      };
                      addOrder(newOrder);
                      addNotification(n('order', `🍕 Заказ #${newOrder.id} создан`, `Для ${user.name} · ${total.toLocaleString()}₽ · ${orderType === 'delivery' ? 'Доставка' : orderType === 'pickup' ? 'Самовынос' : 'В зале'}`, 'orders'));
                      sendMessageToClient(user.id, `🍕 Ваш заказ #${newOrder.id} на ${total.toLocaleString()}₽ оформлен! Мы сообщим о готовности.`);
                      setOrderItems([]);
                      setActivePanel(null);
                    }}
                    className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition">
                    Оформить заказ на {(orderItems.reduce((s, i) => s + i.price * i.qty, 0) + (orderType === 'delivery' ? 199 : 0)).toLocaleString()}₽
                  </button>
                </>
              )}
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
              🛍️ История заказов ({clientOrders.length})
            </h3>
            {clientOrders.length === 0 ? (
              <p className="text-center text-sm text-zinc-400 py-6 bg-zinc-50 dark:bg-zinc-800 rounded-xl">Нет заказов в системе</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {clientOrders.map(o => (
                  <div key={o.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${o.status === 'delivered' ? 'bg-green-500' : o.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-zinc-900 dark:text-white">#{o.id}</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{o.total.toLocaleString()}₽</span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{o.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {o.type === 'delivery' ? '🚗 Доставка' : o.type === 'pickup' ? '🏪 Самовынос' : '🍽️ В зале'}
                        {' · '}
                        {fmtShort(o.createdAt)}
                        {o.address && ` · 📍 ${o.address}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">📊 Активность</p>
            <p className="text-xs text-zinc-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Зарегистрирован: <strong className="text-zinc-700 dark:text-zinc-300">{fmtDate(user.registeredAt)}</strong>
            </p>
            <p className="text-xs text-zinc-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Последний визит: <strong className="text-zinc-700 dark:text-zinc-300">{user.lastVisitAt ? fmtDate(user.lastVisitAt) : '—'}</strong>
            </p>
            <p className="text-xs text-zinc-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              В среднем: <strong className="text-zinc-700 dark:text-zinc-300">{user.visitsCount || clientOrders.length} визитов в месяц</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== БЕЗОПАСНОСТЬ / АУДИТ =====================
function AuditPage() {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-2">🔐 2FA Аутентификация</h4>
          <p className="text-sm text-zinc-500">Двухфакторная авторизация через Telegram OTP</p>
          <button className="mt-3 bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg">✓ Включена</button>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-2">💾 Резервные копии</h4>
          <p className="text-sm text-zinc-500">Автоматическое резервное копирование каждые 6 часов</p>
          <button className="mt-3 bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1"><Download size={14} /> Скачать последнюю</button>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-2">🚫 Блокировки</h4>
          <p className="text-sm text-zinc-500">Макс. 5 неудачных попыток входа</p>
          <p className="text-xs text-zinc-400 mt-1">Заблокировано: 0 аккаунтов</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 dark:text-white">Журнал действий</h3>
          <button className="text-xs text-orange-500 font-medium">Экспорт →</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-zinc-100 dark:border-zinc-800">
            <th className="text-left px-4 py-3 text-zinc-500 font-medium">Время</th>
            <th className="text-left px-4 py-3 text-zinc-500 font-medium">Пользователь</th>
            <th className="text-left px-4 py-3 text-zinc-500 font-medium">Действие</th>
            <th className="text-left px-4 py-3 text-zinc-500 font-medium">Детали</th>
          </tr></thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id} className="border-b border-zinc-50 dark:border-zinc-800">
                <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString('ru-RU')}</td>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{log.userName}</td>
                <td className="px-4 py-3">
                  <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-0.5 rounded font-mono">{log.action}</span>
                </td>
                <td className="px-4 py-3 text-zinc-500">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
