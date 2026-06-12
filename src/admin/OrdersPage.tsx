import { useState } from 'react';
import { useApp } from '../context';
import type { RegisteredUser } from '../context';
import type { Order, OrderStatus, OrderType } from '../types';
import {
  Check, X, Edit2, MapPin, Trash2, Plus, Search,
  Truck, Store, UtensilsCrossed, ShoppingBag
} from 'lucide-react';
import { dishes } from '../data';
import AddressInput from '../components/AddressInput';

const STATUS_CONFIG: Record<string, { label: string; icon: string; bg: string; dot: string }> = {
  new:        { label: 'Новый',      icon: '🆕', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',       dot: 'bg-blue-500'    },
  accepted:   { label: 'Принят',     icon: '✅', bg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',       dot: 'bg-cyan-500'    },
  preparing:  { label: 'Готовится',  icon: '👨‍🍳', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500'   },
  ready:      { label: 'Готов',      icon: '🎉', bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   dot: 'bg-green-500'   },
  delivering: { label: 'В доставке', icon: '🚗', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', dot: 'bg-purple-500' },
  delivered:  { label: 'Доставлен',  icon: '📦', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
  cancelled:  { label: 'Отменён',    icon: '❌', bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500'     },
};
const NEXT_STATUS: Record<string, OrderStatus> = {
  new: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'delivering', delivering: 'delivered'
};
const ALL_STATUSES: OrderStatus[] = ['new', 'accepted', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];
const TYPE_ICON: Record<OrderType, string> = { delivery: '🚗', pickup: '🏪', dine_in: '🍽️' };
const TYPE_LABEL: Record<OrderType, string> = { delivery: 'Доставка', pickup: 'Самовынос', dine_in: 'В зале' };

export default function OrdersPage() {
  const { orders, updateOrderStatus, registeredUsers, setAdminPage } = useApp();
  // Мультифильтр по статусу (можно выбрать несколько)
  const [selectedStatuses, setSelectedStatuses] = useState<Set<OrderStatus>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<OrderType>>(new Set());
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [clientProfile, setClientProfile] = useState<RegisteredUser | null>(null);

  const toggleStatus = (s: OrderStatus) => {
    setSelectedStatuses(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };
  const toggleType = (t: OrderType) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  // Фильтрация
  let filtered = [...orders];
  if (selectedStatuses.size > 0) filtered = filtered.filter(o => selectedStatuses.has(o.status));
  if (selectedTypes.size > 0) filtered = filtered.filter(o => selectedTypes.has(o.type));
  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Считаем кол-во по статусам (для бейджей)
  const countByStatus = (s: OrderStatus) => orders.filter(o => o.status === s).length;
  const now = Date.now();
  const isLate = (o: Order) => (o.status === 'new' || o.status === 'accepted') && (now - new Date(o.createdAt).getTime()) > 30 * 60 * 1000;
  const lateCount = orders.filter(isLate).length;

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  const ago = (iso: string) => {
    const diff = now - new Date(iso).getTime();
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин.`;
    return `${Math.floor(diff / 3600000)} ч.`;
  };

  // Найти клиента по имени
  const findClient = (name: string) => registeredUsers.find(u => u.name === name);

  // ── Профиль клиента (мини) ──
  if (clientProfile) {
    const client = clientProfile;
    const clientOrders = orders.filter(o => o.userName === client.name);
    const totalSpent = clientOrders.reduce((s, o) => s + o.total, 0);
    return (
      <div className="space-y-4">
        <button onClick={() => setClientProfile(null)} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition">← Назад к заказам</button>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center text-2xl font-bold">{client.name[0]}</div>
            <div>
              <h2 className="text-xl font-bold">{client.name}</h2>
              <p className="text-white/70 text-sm">{client.phone} · {client.source === 'telegram' ? '🤖 Telegram' : client.source === 'mobile_app' ? '📱 Приложение' : '🌐 Сайт'}</p>
              <p className="text-white/60 text-xs mt-0.5">{clientOrders.length} заказов · {totalSpent.toLocaleString()}₽ потрачено</p>
            </div>
          </div>
        </div>
        {client.addresses && client.addresses.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">📍 Адреса</h3>
            {client.addresses.map(a => (
              <p key={a.id} className="text-sm text-zinc-600 dark:text-zinc-300">{a.label}: {a.street}, {a.house}{a.apartment ? `, кв.${a.apartment}` : ''}</p>
            ))}
          </div>
        )}
        <div className="space-y-2">
          {clientOrders.map(o => (
            <div key={o.id} className="bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[o.status]?.dot}`} />
              <div className="flex-1">
                <span className="font-semibold text-sm text-zinc-900 dark:text-white">#{o.id}</span>
                <span className="text-xs text-zinc-400 ml-2">{fmtDate(o.createdAt)} {fmtTime(o.createdAt)}</span>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_CONFIG[o.status]?.bg}`}>{STATUS_CONFIG[o.status]?.label}</span>
              <span className="font-bold text-sm text-zinc-900 dark:text-white">{o.total.toLocaleString()}₽</span>
            </div>
          ))}
        </div>
        <button onClick={() => setAdminPage('clients')} className="text-sm text-orange-500 font-medium">Открыть полный профиль →</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Опоздавшие ── */}
      {lateCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-300 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="font-bold text-red-700 dark:text-red-400">{lateCount} заказов ожидают более 30 минут!</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">Нажмите «Новый» чтобы увидеть их</p>
          </div>
        </div>
      )}

      {/* ── Фильтры по статусу (мульти-выбор) ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Статус заказа <span className="text-zinc-300 font-normal">(можно выбрать несколько)</span></p>
          {selectedStatuses.size > 0 && (
            <button onClick={() => setSelectedStatuses(new Set())} className="text-[10px] text-orange-500 font-medium">Сбросить</button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            const count = countByStatus(s);
            const active = selectedStatuses.has(s);
            const hasLate = s === 'new' && lateCount > 0;
            return (
              <button key={s} onClick={() => toggleStatus(s)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                  active
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 shadow-md shadow-orange-500/10'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${count > 0 && (s === 'new' || s === 'preparing') ? 'animate-pulse' : ''}`} />
                <span>{cfg.icon} {cfg.label}</span>
                {count > 0 && (
                  <span className={`min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${hasLate ? 'bg-red-500 animate-pulse' : cfg.dot}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Фильтр по типу */}
        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {(['delivery', 'pickup', 'dine_in'] as OrderType[]).map(t => {
            const count = orders.filter(o => o.type === t && (selectedStatuses.size === 0 || selectedStatuses.has(o.status))).length;
            const active = selectedTypes.has(t);
            return (
              <button key={t} onClick={() => toggleType(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                  active ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'
                }`}>
                {TYPE_ICON[t]} {TYPE_LABEL[t]}
                {count > 0 && <span className="text-zinc-400">({count})</span>}
              </button>
            );
          })}
          {selectedTypes.size > 0 && (
            <button onClick={() => setSelectedTypes(new Set())} className="text-[10px] text-zinc-400 hover:text-zinc-600 ml-auto">✕</button>
          )}
        </div>
      </div>

      {/* ── Счётчик ── */}
      <p className="text-xs text-zinc-400">{filtered.length} заказов{selectedStatuses.size > 0 || selectedTypes.size > 0 ? ' (фильтр)' : ''} · Всего: {orders.length}</p>

      {/* ── Пусто ── */}
      {filtered.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center shadow-sm border border-zinc-100 dark:border-zinc-800">
          <ShoppingBag size={48} className="text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-900 dark:text-white text-lg">{orders.length === 0 ? 'Заказов пока нет' : 'Нет заказов по фильтру'}</h3>
          <p className="text-sm text-zinc-500 mt-1">{orders.length === 0 ? 'Они появятся, когда клиенты оформят заказ через приложение' : 'Попробуйте изменить фильтры'}</p>
        </div>
      )}

      {/* ── Список заказов ── */}
      <div className="space-y-3">
        {filtered.map(order => {
          const cfg = STATUS_CONFIG[order.status];
          const late = isLate(order);
          const client = findClient(order.userName);
          const isEditing = editingOrder?.id === order.id;

          return (
            <div key={order.id} className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border transition-all overflow-hidden ${
              late ? 'border-red-300 dark:border-red-800 ring-1 ring-red-200 dark:ring-red-900/40' :
              order.status === 'new' ? 'border-green-300 dark:border-green-800' :
              'border-zinc-100 dark:border-zinc-800'
            }`}>
              {/* Заголовок */}
              <div className="p-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Индикатор */}
                    <span className={`w-3 h-3 rounded-full ${cfg.dot} ${(order.status === 'new' || order.status === 'preparing') ? 'animate-pulse' : ''} ${late ? 'bg-red-500 animate-pulse' : ''}`} />
                    <span className="text-lg font-bold text-zinc-900 dark:text-white">#{order.id}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg}`}>{cfg.icon} {cfg.label}</span>
                    <span className="text-xs text-zinc-400">{TYPE_ICON[order.type]} {TYPE_LABEL[order.type]}</span>
                    {late && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">⚠️ Опоздание</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">{ago(order.createdAt)}</span>
                    <span className="text-xs text-zinc-300">{fmtTime(order.createdAt)}</span>
                  </div>
                </div>

                {/* Клиент (кликабельный) */}
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => client && setClientProfile(client)}
                    className={`flex items-center gap-2 ${client ? 'hover:text-orange-500 cursor-pointer' : 'cursor-default'} transition`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${client ? 'bg-orange-500' : 'bg-zinc-400'}`}>
                      {order.userName[0]}
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${client ? 'text-zinc-900 dark:text-white hover:text-orange-500 transition' : 'text-zinc-500'}`}>
                        {order.userName}
                        {client && <span className="text-zinc-300 ml-1 text-xs">→</span>}
                      </p>
                      <p className="text-xs text-zinc-400">{order.userPhone}</p>
                    </div>
                  </button>
                  <div className="ml-auto text-right">
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{order.total.toLocaleString()}₽</p>
                    <p className="text-[10px] text-zinc-400">{order.isPaid ? '✅ Оплачен' : '⏳ Не оплачен'}</p>
                  </div>
                </div>

                {/* Состав */}
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 mb-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-700 dark:text-zinc-300">{item.name} <span className="text-zinc-400">×{item.quantity}</span></span>
                      <span className="text-zinc-500">{(item.price * item.quantity).toLocaleString()}₽</span>
                    </div>
                  ))}
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-xs text-zinc-400 mt-1 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                      <span>Доставка</span><span>{order.deliveryFee}₽</span>
                    </div>
                  )}
                </div>

                {/* Адрес / Стол */}
                {order.address && <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><MapPin size={12} /> {order.address}</p>}
                {order.tableNumber && <p className="text-xs text-zinc-500 mb-1">🪑 Стол №{order.tableNumber}</p>}
                {order.comment && <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">💬 {order.comment}</p>}
              </div>

              {/* Кнопки действий */}
              <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-2 bg-zinc-50/50 dark:bg-zinc-800/30">
                {NEXT_STATUS[order.status] && (
                  <button onClick={() => updateOrderStatus(order.id, NEXT_STATUS[order.status])}
                    className="bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-orange-600 transition shadow-sm">
                    <Check size={16} /> {STATUS_CONFIG[NEXT_STATUS[order.status]]?.icon} {STATUS_CONFIG[NEXT_STATUS[order.status]]?.label}
                  </button>
                )}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 transition">
                    <X size={16} /> Отменить
                  </button>
                )}
                <button onClick={() => setEditingOrder(isEditing ? null : order)}
                  className={`text-sm font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 transition ml-auto ${isEditing ? 'bg-blue-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                  <Edit2 size={14} /> Изменить
                </button>
              </div>

              {/* ── Панель редактирования ── */}
              {isEditing && editingOrder && (
                <OrderEditPanel order={editingOrder} onClose={() => setEditingOrder(null)} findClientFn={findClient} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Панель редактирования заказа ──
function OrderEditPanel({ order, onClose, findClientFn }: {
  order: Order;
  onClose: () => void;
  findClientFn?: (name: string) => RegisteredUser | undefined;
}) {
  const { updateOrder, addNotification } = useApp();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [type, setType] = useState<OrderType>(order.type);
  const [userName, setUserName] = useState(order.userName);
  const [userPhone, setUserPhone] = useState(order.userPhone);
  const [address, setAddress] = useState(order.address || '');
  const [tableNum, setTableNum] = useState(String(order.tableNumber || ''));
  const [comment, setComment] = useState(order.comment || '');
  const [paymentMethod, setPaymentMethod] = useState(order.paymentMethod);
  const [isPaid, setIsPaid] = useState(order.isPaid);
  const [items, setItems] = useState(order.items.map(i => ({ ...i })));
  const [showDishPicker, setShowDishPicker] = useState(false);
  const [dishSearch, setDishSearch] = useState('');

  // Пересчёт сумм
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = type === 'delivery' ? order.deliveryFee : 0;
  const total = Math.max(0, subtotal + deliveryFee - order.discount - order.bonusUsed);

  const changeQty = (dishId: number, delta: number) => {
    setItems(prev => prev
      .map(i => i.dishId === dishId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    );
  };
  const removeItem = (dishId: number) => setItems(prev => prev.filter(i => i.dishId !== dishId));
  const addDish = (dish: typeof dishes[0]) => {
    setItems(prev => {
      const ex = prev.find(i => i.dishId === dish.id);
      if (ex) return prev.map(i => i.dishId === dish.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { dishId: dish.id, name: dish.name, price: dish.price, quantity: 1, options: [] }];
    });
    setShowDishPicker(false);
    setDishSearch('');
  };

  const filteredDishes = dishes.filter(d =>
    !items.some(i => i.dishId === d.id) &&
    (dishSearch === '' || d.name.toLowerCase().includes(dishSearch.toLowerCase()))
  );

  const save = () => {
    updateOrder(order.id, {
      status, type, userName, userPhone,
      address: type === 'delivery' ? address : undefined,
      tableNumber: type === 'dine_in' && tableNum ? Number(tableNum) : undefined,
      comment: comment || undefined,
      paymentMethod, isPaid,
      items, subtotal, deliveryFee, total,
    });
    addNotification({
      type: 'order',
      title: `✏️ Заказ #${order.id} изменён`,
      body: `${userName} · ${items.length} поз. · ${total.toLocaleString()}₽ · ${TYPE_LABEL[type]}`,
      link: 'orders',
    });
    onClose();
  };

  return (
    <div className="px-4 py-4 bg-blue-50 dark:bg-blue-900/10 border-t-2 border-blue-300 dark:border-blue-800 space-y-4" style={{ animation: 'slideDownFade 0.15s ease-out' }}>
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-1.5">
          <Edit2 size={14} className="text-blue-500" /> Редактирование заказа #{order.id}
        </h4>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition"><X size={16} /></button>
      </div>

      {/* ── СОСТАВ ЗАКАЗА (блюда) ── */}
      <div>
        <label className="text-xs text-zinc-500 font-medium block mb-1.5">🍽️ Блюда в заказе</label>
        <div className="bg-white dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
          {items.length === 0 ? (
            <p className="text-center text-xs text-zinc-400 py-4">Нет блюд — добавьте хотя бы одно</p>
          ) : items.map((item, idx) => (
            <div key={item.dishId} className={`flex items-center gap-2 px-3 py-2.5 ${idx > 0 ? 'border-t border-zinc-100 dark:border-zinc-700' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{item.name}</p>
                <p className="text-[10px] text-zinc-400">{item.price}₽ за шт · {(item.price * item.quantity).toLocaleString()}₽</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => changeQty(item.dishId, -1)} className="w-7 h-7 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-600 transition">−</button>
                <span className="text-sm font-bold text-zinc-900 dark:text-white w-5 text-center">{item.quantity}</span>
                <button onClick={() => changeQty(item.dishId, 1)} className="w-7 h-7 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition">+</button>
              </div>
              <button onClick={() => removeItem(item.dishId)} className="p-1 text-zinc-400 hover:text-red-500 transition"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        {/* Добавить блюдо */}
        {!showDishPicker ? (
          <button onClick={() => setShowDishPicker(true)}
            className="mt-2 w-full border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl py-2 text-xs font-medium text-zinc-500 hover:border-orange-400 hover:text-orange-500 transition flex items-center justify-center gap-1.5">
            <Plus size={14} /> Добавить блюдо
          </button>
        ) : (
          <div className="mt-2 border-2 border-orange-300 dark:border-orange-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800">
              <Search size={14} className="text-zinc-400" />
              <input value={dishSearch} onChange={e => setDishSearch(e.target.value)} placeholder="Поиск блюда..." autoFocus
                className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white outline-none" />
              <button onClick={() => { setShowDishPicker(false); setDishSearch(''); }}><X size={14} className="text-zinc-400" /></button>
            </div>
            <div className="max-h-44 overflow-y-auto bg-white dark:bg-zinc-800">
              {filteredDishes.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 py-3">Нет блюд</p>
              ) : filteredDishes.map(d => (
                <button key={d.id} onClick={() => addDish(d)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition border-t border-zinc-100 dark:border-zinc-700 first:border-0">
                  <span className="text-sm text-zinc-900 dark:text-white">{d.name}</span>
                  <span className="text-xs text-zinc-400">{d.price}₽ <Plus size={12} className="inline text-orange-500" /></span>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Итого */}
        <div className="mt-2 flex items-center justify-between px-3 py-2 bg-orange-50 dark:bg-orange-900/10 rounded-xl">
          <span className="text-xs text-zinc-500">Подытог: {subtotal.toLocaleString()}₽{deliveryFee > 0 ? ` + ${deliveryFee}₽ дост.` : ''}</span>
          <span className="text-base font-bold text-orange-600 dark:text-orange-400">Итого: {total.toLocaleString()}₽</span>
        </div>
      </div>

      {/* ── ДАННЫЕ КЛИЕНТА ── */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-zinc-500 font-medium block mb-1">👤 Имя клиента</label>
          <input value={userName} onChange={e => setUserName(e.target.value)}
            className="w-full bg-white dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 focus:border-blue-500" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 font-medium block mb-1">📞 Телефон</label>
          <input value={userPhone} onChange={e => setUserPhone(e.target.value)}
            className="w-full bg-white dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 focus:border-blue-500" />
        </div>
      </div>

      {/* ── СТАТУС ── */}
      <div>
        <label className="text-xs text-zinc-500 font-medium block mb-1.5">Статус заказа</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${status === s ? 'bg-orange-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700'}`}>
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ТИП ── */}
      <div>
        <label className="text-xs text-zinc-500 font-medium block mb-1.5">Тип заказа</label>
        <div className="flex gap-2">
          {(['delivery', 'pickup', 'dine_in'] as OrderType[]).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition border-2 ${
                type === t ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'
              }`}>
              {t === 'delivery' && <Truck size={16} />}
              {t === 'pickup' && <Store size={16} />}
              {t === 'dine_in' && <UtensilsCrossed size={16} />}
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Адрес / Стол */}
      {type === 'delivery' && (
        <div>
          <label className="text-xs text-zinc-500 font-medium block mb-1">📍 Адрес доставки</label>
          <AddressInput
            value={address}
            onChange={setAddress}
            user={findClientFn?.(userName)}
            compact
            showFavorites={!!(findClientFn?.(userName)?.addresses?.length)}
            placeholder="ул. Пушкина, д.10, кв.5"
          />
        </div>
      )}
      {type === 'dine_in' && (
        <div>
          <label className="text-xs text-zinc-500 font-medium block mb-1">🪑 Номер стола</label>
          <input value={tableNum} onChange={e => setTableNum(e.target.value)} type="number" placeholder="5"
            className="w-full bg-white dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 focus:border-blue-500" />
        </div>
      )}

      {/* ── ОПЛАТА ── */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-zinc-500 font-medium block mb-1">💳 Способ оплаты</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}
            className="w-full bg-white dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700">
            <option value="card">💳 Карта</option>
            <option value="cash">💵 Наличные</option>
            <option value="telegram_stars">⭐ Telegram Stars</option>
            <option value="yukassa">🏦 ЮKassa</option>
            <option value="tinkoff">🏦 Tinkoff</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 font-medium block mb-1">Статус оплаты</label>
          <button onClick={() => setIsPaid(!isPaid)}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition border-2 ${isPaid ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700' : 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700'}`}>
            {isPaid ? '✅ Оплачен' : '⏳ Не оплачен'}
          </button>
        </div>
      </div>

      {/* ── КОММЕНТАРИЙ ── */}
      <div>
        <label className="text-xs text-zinc-500 font-medium block mb-1">💬 Комментарий к заказу</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="Пожелания, особые условия..."
          className="w-full bg-white dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 resize-none focus:border-blue-500" />
      </div>

      {/* ── СОХРАНИТЬ ── */}
      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={items.length === 0}
          className="bg-blue-500 text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-blue-600 transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
          <Check size={16} /> Сохранить все изменения
        </button>
        <button onClick={onClose} className="text-zinc-500 text-sm px-4 py-3 hover:text-zinc-700 dark:hover:text-zinc-300 transition">Отмена</button>
      </div>
    </div>
  );
}
