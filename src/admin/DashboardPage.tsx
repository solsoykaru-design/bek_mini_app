// DashboardPage — полностью реальные данные из orders, registeredUsers, reviews
import { useState } from 'react';
import { useApp } from '../context';
import { formatLocalDate, DAY_NAMES_SHORT } from '../data';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, UsersRound, Users, CalendarDays, X } from 'lucide-react';

// ─── Хелперы ────────────────────────────────────────────────
const toIso = (d: Date) => formatLocalDate(d);
const shiftDays = (iso: string, offset: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return toIso(d);
};
const today = toIso(new Date());

// ─── StatCard ───────────────────────────────────────────────
function StatCard({ label, value, sub, trend, icon: Icon, color }: {
  label: string; value: string; sub?: string;
  trend?: 'up' | 'down' | 'neutral'; icon: any; color: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
        {sub && (
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-zinc-400'}`}>
            {sub}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
      <p className="text-sm text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Главный компонент дашборда ──────────────────────────────
export default function DashboardPage() {
  const { orders, registeredUsers, reviews } = useApp();

  // ── Диапазон дат ──────────────────────────────────────────
  const [dateFrom, setDateFrom] = useState(shiftDays(today, -6));
  const [dateTo,   setDateTo]   = useState(today);
  const [showCal,  setShowCal]  = useState(false);
  const [calYear,  setCalYear]  = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [picking,  setPicking]  = useState<'from' | 'to'>('from');

  const rangeStart = dateFrom <= dateTo ? dateFrom : dateTo;
  const rangeEnd   = dateFrom <= dateTo ? dateTo   : dateFrom;

  const PRESETS = [
    { label: 'Сегодня',     from: today,               to: today              },
    { label: '7 дней',      from: shiftDays(today,-6), to: today              },
    { label: '30 дней',     from: shiftDays(today,-29),to: today              },
    { label: 'Этот месяц',  from: toIso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to: today },
    { label: 'Прошлый мес.',from: toIso(new Date(new Date().getFullYear(), new Date().getMonth()-1, 1)),
                             to: toIso(new Date(new Date().getFullYear(), new Date().getMonth(), 0)) },
  ];
  const applyPreset = (from: string, to: string) => { setDateFrom(from); setDateTo(to); setShowCal(false); };

  // ── Мини-календарь ────────────────────────────────────────
  const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const buildGrid = (y: number, m: number) => {
    const first = new Date(y, m, 1);
    const last  = new Date(y, m + 1, 0);
    const startDow = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++) cells.push(d);
    return cells;
  };
  const calGrid = buildGrid(calYear, calMonth);
  const ds = (day: number) => `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const handleDayClick = (day: number) => {
    const clicked = ds(day);
    if (clicked > today) return;
    if (picking === 'from') { setDateFrom(clicked); setDateTo(clicked); setPicking('to'); }
    else { if (clicked < dateFrom) { setDateFrom(clicked); } else { setDateTo(clicked); } setPicking('from'); setShowCal(false); }
  };

  // ── Фильтрованные данные ───────────────────────────────────
  const rangeOrders  = orders.filter(o => o.createdAt.slice(0,10) >= rangeStart && o.createdAt.slice(0,10) <= rangeEnd);
  const todayOrders  = orders.filter(o => o.createdAt.slice(0,10) === today);
  const activeOrders = orders.filter(o => ['new','accepted','preparing','ready'].includes(o.status));

  const sumRevenue = (arr: typeof orders) => arr.reduce((s,o) => s + o.total, 0);
  const avgCheck   = (arr: typeof orders) => arr.length ? Math.round(sumRevenue(arr) / arr.length) : 0;

  const todayRevenue = sumRevenue(todayOrders);
  const rangeRevenue = sumRevenue(rangeOrders);
  const todayAvg     = avgCheck(todayOrders);
  const rangeAvg     = avgCheck(rangeOrders);

  const todayClients = registeredUsers.filter(u => u.registeredAt.slice(0,10) === today).length;
  const rangeClients = registeredUsers.filter(u => {
    const d = u.registeredAt.slice(0,10);
    return d >= rangeStart && d <= rangeEnd;
  }).length;

  // ── График по дням ────────────────────────────────────────
  const dayCount = Math.min(30, Math.round((new Date(rangeEnd).getTime() - new Date(rangeStart).getTime()) / 86400000) + 1);
  const chartData = Array.from({ length: dayCount }, (_, i) => {
    const d = shiftDays(rangeStart, i);
    const dayOrds = orders.filter(o => o.createdAt.slice(0,10) === d);
    const dow = new Date(`${d}T12:00:00`).getDay();
    return {
      date: d,
      label: new Date(`${d}T12:00:00`).toLocaleDateString('ru-RU', { day:'2-digit', month:'short' }),
      dayShort: DAY_NAMES_SHORT[(dow+6)%7],
      revenue: sumRevenue(dayOrds),
      orders: dayOrds.length,
      clients: registeredUsers.filter(u => u.registeredAt.slice(0,10) === d).length,
    };
  });

  // ── Типы заказов ──────────────────────────────────────────
  const total = rangeOrders.length || 1;
  const ordersByType = [
    { type: 'Доставка',  value: rangeOrders.filter(o=>o.type==='delivery').length, pct: Math.round(rangeOrders.filter(o=>o.type==='delivery').length/total*100), color:'#3b82f6' },
    { type: 'Самовынос', value: rangeOrders.filter(o=>o.type==='pickup').length,   pct: Math.round(rangeOrders.filter(o=>o.type==='pickup').length/total*100),   color:'#10b981' },
    { type: 'В зале',   value: rangeOrders.filter(o=>o.type==='dine_in').length,  pct: Math.round(rangeOrders.filter(o=>o.type==='dine_in').length/total*100),  color:'#f59e0b' },
  ].filter(t => t.value > 0);

  // ── Топ блюд ──────────────────────────────────────────────
  const dishMap: Record<number, { name: string; qty: number; revenue: number }> = {};
  rangeOrders.forEach(o => o.items.forEach(item => {
    if (!dishMap[item.dishId]) dishMap[item.dishId] = { name: item.name, qty: 0, revenue: 0 };
    dishMap[item.dishId].qty += item.quantity;
    dishMap[item.dishId].revenue += item.price * item.quantity;
  }));
  const topDishes = Object.values(dishMap).sort((a,b) => b.qty - a.qty).slice(0, 5);

  // ── Отзывы ────────────────────────────────────────────────
  const pendingReviews = reviews.filter(r => !r.isModerated).length;
  const avgRating = reviews.length ? +(reviews.reduce((s,r) => s+r.rating,0)/reviews.length).toFixed(1) : null;

  const fmtDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('ru-RU', { day:'2-digit', month:'short' });
  const isToday = rangeStart === today && rangeEnd === today;
  const periodLabel = isToday ? 'Сегодня' : `${fmtDate(rangeStart)} — ${fmtDate(rangeEnd)}`;

  return (
    <div className="space-y-6">

      {/* ── Выбор периода ──────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p.from, p.to)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                rangeStart === p.from && rangeEnd === p.to
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}>{p.label}</button>
          ))}
          <button onClick={() => setShowCal(!showCal)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ml-auto ${
              showCal ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
            }`}>
            <CalendarDays size={14} />
            {periodLabel}
          </button>
          {!(rangeStart === shiftDays(today,-6) && rangeEnd === today) && (
            <button onClick={() => { setDateFrom(shiftDays(today,-6)); setDateTo(today); setShowCal(false); }}
              className="p-1.5 text-zinc-400 hover:text-red-500 transition rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <X size={14} />
            </button>
          )}
        </div>

        {showCal && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-col md:flex-row gap-5">
            {/* Мини-календарь */}
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => { if (calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition">◀</button>
                <span className="font-bold text-zinc-900 dark:text-white text-sm">{MONTHS[calMonth]} {calYear}</span>
                <button onClick={() => { if (calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition">▶</button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-zinc-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calGrid.map((day, idx) => {
                  if (!day) return <div key={`e${idx}`} />;
                  const d = ds(day);
                  const isFuture = d > today;
                  const isStart = d === rangeStart;
                  const isEnd   = d === rangeEnd;
                  const inRange = d >= rangeStart && d <= rangeEnd;
                  return (
                    <button key={idx} onClick={() => handleDayClick(day)} disabled={isFuture}
                      title={picking === 'from' ? 'Выберите начало' : 'Выберите конец'}
                      className={`h-9 rounded-lg text-xs font-medium transition flex items-center justify-center ${
                        isStart || isEnd
                          ? 'bg-orange-500 text-white shadow-md'
                          : inRange
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700'
                            : isFuture
                              ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                      }`}>{day}</button>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-400 text-center mt-2">
                {picking === 'from' ? '🟠 Кликните для начала периода' : '🟠 Кликните для конца периода'}
              </p>
            </div>
            {/* Ручной ввод */}
            <div className="space-y-3 min-w-[180px]">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">С даты</label>
                <input type="date" value={dateFrom} max={today}
                  onChange={e => { setDateFrom(e.target.value); setPicking('to'); }}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">По дату</label>
                <input type="date" value={dateTo} min={dateFrom} max={today}
                  onChange={e => { setDateTo(e.target.value); setPicking('from'); setShowCal(false); }}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none border border-zinc-200 dark:border-zinc-700 focus:border-orange-500" />
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-3 text-xs space-y-1">
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">Выбранный период</p>
                <p className="text-zinc-500">{fmtDate(rangeStart)} — {fmtDate(rangeEnd)}</p>
                <p className="text-orange-600 font-bold text-base">{rangeRevenue.toLocaleString()}₽</p>
                <p className="text-zinc-400">{rangeOrders.length} заказов</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── KPI-карточки ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label={isToday ? 'Выручка сегодня' : 'Выручка за период'}
          value={`${rangeRevenue.toLocaleString()}₽`}
          sub={todayRevenue !== rangeRevenue ? `Сегодня: ${todayRevenue.toLocaleString()}₽` : undefined}
          icon={DollarSign} color="from-green-500 to-emerald-500" />
        <StatCard label={isToday ? 'Заказов сегодня' : 'Заказов за период'}
          value={String(rangeOrders.length)}
          sub={`Активных: ${activeOrders.length}`}
          trend={activeOrders.length > 0 ? 'up' : 'neutral'}
          icon={ShoppingBag} color="from-blue-500 to-cyan-500" />
        <StatCard label="Средний чек"
          value={rangeAvg ? `${rangeAvg.toLocaleString()}₽` : '—'}
          sub={isToday && todayAvg !== rangeAvg ? `Период: ${rangeAvg}₽` : undefined}
          icon={TrendingUp} color="from-purple-500 to-pink-500" />
        <StatCard label={isToday ? 'Новых клиентов' : 'Новые клиенты'}
          value={String(rangeClients)}
          sub={`Всего: ${registeredUsers.length}`}
          trend={rangeClients > 0 ? 'up' : 'neutral'}
          icon={UsersRound} color="from-orange-500 to-red-500" />
        <StatCard label="База клиентов"
          value={registeredUsers.length.toLocaleString()}
          sub={todayClients > 0 ? `+${todayClients} сегодня` : undefined}
          trend={todayClients > 0 ? 'up' : 'neutral'}
          icon={Users} color="from-indigo-500 to-violet-500" />
      </div>

      {/* ── Пустой дашборд ─────────────────────────────────── */}
      {orders.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
          <span className="text-6xl block mb-4">📊</span>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Данных пока нет</h3>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            Как только первые клиенты сделают заказы через мобильное приложение или Telegram, здесь появится реальная статистика: выручка, средний чек, популярные блюда.
          </p>
          <div className="mt-6 flex gap-3 justify-center flex-wrap">
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
              📱 Ждём заказ из приложения
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
              🤖 Ждём заказ из Telegram
            </div>
          </div>
        </div>
      )}

      {/* ── Графики — только если есть данные ─────────────── */}
      {chartData.some(d => d.revenue > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* График выручки */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Выручка по дням</h3>
            <p className="text-xs text-zinc-400 mb-3">За выбранный период · {periodLabel}</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v:any) => v > 999 ? `${Math.round(v/1000)}к` : String(v)} />
                <Tooltip formatter={(v:any) => [`${Number(v).toLocaleString()}₽`, 'Выручка']}
                  labelFormatter={(label:any, payload:any) => `${label}${payload?.[0]?.payload ? ` · ${payload[0].payload.orders} заказов` : ''}`} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="#f97316" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Типы заказов */}
          {ordersByType.length > 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Типы заказов</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={ordersByType} dataKey="value" nameKey="type" cx="50%" cy="50%" outerRadius={70}
                    label={({ type, pct }:any) => `${type} ${pct}%`}>
                    {ordersByType.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v:any) => [`${v} заказов`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2">
                {ordersByType.map(t => (
                  <div key={t.type} className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <span className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                    {t.type}: {t.value}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
              <p className="text-zinc-400 text-sm text-center">Нет заказов за период для отображения типов</p>
            </div>
          )}
        </div>
      )}

      {/* ── Активные заказы + Топ блюд ────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Активные заказы */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {activeOrders.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${activeOrders.length > 0 ? 'bg-red-500' : 'bg-zinc-300'}`}></span>
            </span>
            Активные заказы ({activeOrders.length})
          </h3>
          {activeOrders.length === 0 ? (
            <div className="text-center py-6 text-zinc-400">
              <span className="text-3xl block mb-2">✅</span>
              <p className="text-sm">Нет активных заказов</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeOrders.map(order => (
                <div key={order.id} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    order.status==='new'?'bg-blue-500 animate-pulse':
                    order.status==='accepted'?'bg-cyan-500':
                    order.status==='preparing'?'bg-amber-500 animate-pulse':'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-zinc-900 dark:text-white">#{order.id} · {order.userName}</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{order.total.toLocaleString()}₽</span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{order.items.map(i=>i.name).join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Топ блюд */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-3">🔥 Топ блюд за период</h3>
          {topDishes.length === 0 ? (
            <div className="text-center py-6 text-zinc-400">
              <span className="text-3xl block mb-2">🍽️</span>
              <p className="text-sm">Пока нет заказов для анализа</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topDishes.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i===0?'bg-amber-100 text-amber-700':i===1?'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300':'bg-orange-100 text-orange-700'
                  }`}>{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{d.name}</p>
                    <p className="text-xs text-zinc-500">{d.qty} шт.</p>
                  </div>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{d.revenue.toLocaleString()}₽</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Клиенты + Отзывы ──────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Новые клиенты */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-zinc-900 dark:text-white">👥 Клиенты за период</h3>
            <span className="text-xs text-zinc-400">Всего: {registeredUsers.length}</span>
          </div>
          {/* По источникам */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(['mobile_app','telegram','website'] as const).map(src => {
              const srcRange = registeredUsers.filter(u => u.source===src && u.registeredAt.slice(0,10)>=rangeStart && u.registeredAt.slice(0,10)<=rangeEnd).length;
              const srcTotal = registeredUsers.filter(u => u.source===src).length;
              const labels = { mobile_app:'📱 Приложение', telegram:'🤖 Telegram', website:'🌐 Сайт' };
              const colors = { mobile_app:'bg-blue-500', telegram:'bg-sky-500', website:'bg-purple-500' };
              return (
                <div key={src} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-xs text-zinc-500 mb-1">{labels[src]}</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{srcRange}</p>
                  <p className="text-[10px] text-zinc-400">из {srcTotal}</p>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1 mt-1.5">
                    <div className={`${colors[src]} rounded-full h-1`} style={{ width: srcTotal > 0 ? `${Math.round(srcRange/Math.max(1,rangeClients)*100)}%` : '0%' }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Последние */}
          <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
            {registeredUsers.length === 0 ? (
              <p className="text-center text-sm text-zinc-400 py-4">Нет зарегистрированных клиентов</p>
            ) : (
              registeredUsers.slice(0, 10).map(u => {
                const srcColor = u.source==='telegram'?'bg-sky-500':u.source==='mobile_app'?'bg-blue-500':'bg-purple-500';
                return (
                  <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${srcColor}`}>{u.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{u.name}</p>
                      <p className="text-xs text-zinc-400">{u.phone}</p>
                    </div>
                    <p className="text-[10px] text-zinc-400 flex-shrink-0">
                      {u.registeredAt.slice(0,10) === today
                        ? new Date(u.registeredAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})
                        : new Date(u.registeredAt).toLocaleDateString('ru-RU',{day:'2-digit',month:'short'})}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Отзывы */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              ⭐ Отзывы
              {pendingReviews > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {pendingReviews} новых
                </span>
              )}
            </h3>
            {avgRating && (
              <span className="text-sm font-bold text-amber-500">{avgRating} ★ средний рейтинг</span>
            )}
          </div>
          {reviews.length === 0 ? (
            <div className="text-center py-6 text-zinc-400">
              <span className="text-3xl block mb-2">⭐</span>
              <p className="text-sm">Пока нет отзывов</p>
              <p className="text-xs mt-1">Они появятся, когда клиенты оставят их в приложении</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
              {reviews.slice(0, 8).map(r => (
                <div key={r.id} className={`bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5 ${!r.isModerated ? 'ring-1 ring-orange-300' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">{r.userName}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-xs ${s<=r.rating?'text-amber-400':'text-zinc-300'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{r.dishName}: {r.text}</p>
                  {!r.isModerated && <span className="text-[9px] text-orange-500 font-semibold">● Ожидает модерации</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── График заказов по дням (если больше 1 дня) ──── */}
      {chartData.length > 1 && chartData.some(d => d.orders > 0) && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Количество заказов по дням</h3>
          <p className="text-xs text-zinc-400 mb-3">{periodLabel}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
              <Tooltip formatter={(v:any) => [`${v} заказов`, 'Заказы']} />
              <Bar dataKey="orders" fill="#3b82f6" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
