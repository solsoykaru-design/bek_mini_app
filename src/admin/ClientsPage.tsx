import { useState, useMemo } from 'react';
import { useApp } from '../context';
import type { RegisteredUser } from '../context';
import {
  Search, Filter, Users, Phone, Mail, MapPin, Star,
  ShoppingBag, Gift, Calendar, TrendingUp, ChevronRight,
  X, MessageSquare, Download, Clock, ArrowUpDown, Award
} from 'lucide-react';

// ============================================================
//  СТРАНИЦА «КЛИЕНТЫ» — полная CRM с подразделами
// ============================================================

type ClientTab = 'list' | 'segments' | 'bonuses';

export default function ClientsPage() {
  const [activeTab, setActiveTab] = useState<ClientTab>('list');
  const [selectedClient, setSelectedClient] = useState<RegisteredUser | null>(null);

  const tabs = [
    { id: 'list' as ClientTab,     icon: Users,       label: 'Список клиентов' },
    { id: 'segments' as ClientTab, icon: Award,       label: 'Сегменты' },
    { id: 'bonuses' as ClientTab,  icon: Gift,        label: 'Бонусы' },
  ];

  return (
    <div className="space-y-4">
      {/* Вкладки */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-0 -mb-4">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === t.id
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}>
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {activeTab === 'list'     && <ClientListTab selectedClient={selectedClient} setSelectedClient={setSelectedClient} />}
        {activeTab === 'segments' && <SegmentsTab />}
        {activeTab === 'bonuses'  && <BonusesTab />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ВКЛАДКА 1: СПИСОК КЛИЕНТОВ
// ─────────────────────────────────────────────────────────────
function ClientListTab({ selectedClient, setSelectedClient }: {
  selectedClient: RegisteredUser | null;
  setSelectedClient: (u: RegisteredUser | null) => void;
}) {
  const { registeredUsers, orders, reviews, updateUserBonus, sendMessageToClient, addNotification } = useApp();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'mobile_app' | 'telegram' | 'website'>('all');
  const [loyaltyFilter, setLoyaltyFilter] = useState<'all' | 'newbie' | 'silver' | 'gold' | 'platinum'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'orders' | 'spent'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Фильтрация + сортировка
  const filtered = useMemo(() => {
    let result = [...registeredUsers];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }
    if (sourceFilter !== 'all') result = result.filter(u => u.source === sourceFilter);
    if (loyaltyFilter !== 'all') result = result.filter(u => u.loyaltyLevel === loyaltyFilter);

    result.sort((a, b) => {
      let va: any, vb: any;
      if (sortBy === 'name') { va = a.name; vb = b.name; }
      else if (sortBy === 'date') { va = a.registeredAt; vb = b.registeredAt; }
      else if (sortBy === 'orders') {
        va = orders.filter(o => o.userName === a.name).length;
        vb = orders.filter(o => o.userName === b.name).length;
      } else {
        va = a.totalSpent || 0;
        vb = b.totalSpent || 0;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [registeredUsers, orders, search, sourceFilter, loyaltyFilter, sortBy, sortDir]);

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  const srcLabel = (src: string) =>
    src === 'telegram' ? '🤖 Telegram' : src === 'mobile_app' ? '📱 Приложение' : '🌐 Сайт';
  const lvlLabel = (l?: string) => ({
    newbie: { icon: '⭐', label: 'Новичок', color: 'text-zinc-500' },
    silver: { icon: '🥈', label: 'Серебро', color: 'text-slate-500' },
    gold:   { icon: '🥇', label: 'Золото',  color: 'text-amber-500' },
    platinum: { icon: '💎', label: 'Платина', color: 'text-purple-500' },
  }[l || 'newbie'] || { icon: '⭐', label: 'Новичок', color: 'text-zinc-500' });

  const today = new Date().toISOString().slice(0, 10);
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин. назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч. назад`;
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Метрики
  const totalClients = registeredUsers.length;
  const todayNew = registeredUsers.filter(u => u.registeredAt.slice(0, 10) === today).length;
  const mobileClients = registeredUsers.filter(u => u.source === 'mobile_app').length;

  if (selectedClient) {
    return (
      <ClientDetailPanel
        client={selectedClient}
        orders={orders.filter(o => o.userName === selectedClient.name)}
        reviews={reviews.filter(r => r.userName === selectedClient.name)}
        onBack={() => setSelectedClient(null)}
        onAddBonus={(amount, comment) => {
          updateUserBonus(selectedClient.id, amount);
          sendMessageToClient(selectedClient.id, `🎁 Вам начислено ${amount}₽ бонусов!${comment ? ` ${comment}` : ''}`);
          addNotification({ type: 'system', title: '🎁 Бонус начислен', body: `+${amount}₽ → ${selectedClient.name}`, link: 'clients' });
        }}
        onSendMessage={(text) => {
          sendMessageToClient(selectedClient.id, text);
          addNotification({ type: 'system', title: '💬 Сообщение отправлено', body: `${selectedClient.name}: «${text.slice(0, 40)}»`, link: 'clients' });
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Метрики */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalClients}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Всего клиентов</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{todayNew}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Сегодня</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mobileClients}</p>
          <p className="text-xs text-zinc-500 mt-0.5">📱 Приложение</p>
        </div>
      </div>

      {/* Поиск + фильтры */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5">
            <Search size={16} className="text-zinc-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Имя, телефон, email..."
              className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400" />
            {search && <button onClick={() => setSearch('')}><X size={14} className="text-zinc-400" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`px-3 rounded-xl text-sm font-medium transition ${showFilters ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
            <Filter size={16} />
          </button>
          <button className="px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition">
            <Download size={16} />
          </button>
        </div>

        {showFilters && (
          <div className="space-y-2.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            {/* Источник */}
            <div>
              <p className="text-xs text-zinc-400 mb-1.5 font-semibold">Источник регистрации</p>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'mobile_app', 'telegram', 'website'] as const).map(s => (
                  <button key={s} onClick={() => setSourceFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${sourceFilter === s ? 'bg-zinc-800 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    {s === 'all' ? 'Все' : s === 'mobile_app' ? '📱 Приложение' : s === 'telegram' ? '🤖 Telegram' : '🌐 Сайт'}
                  </button>
                ))}
              </div>
            </div>
            {/* Уровень лояльности */}
            <div>
              <p className="text-xs text-zinc-400 mb-1.5 font-semibold">Уровень лояльности</p>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'newbie', 'silver', 'gold', 'platinum'] as const).map(l => (
                  <button key={l} onClick={() => setLoyaltyFilter(l)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${loyaltyFilter === l ? 'bg-zinc-800 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    {l === 'all' ? 'Все' : lvlLabel(l).icon + ' ' + lvlLabel(l).label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Сортировка + счётчик */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>{filtered.length} клиентов</span>
        <div className="flex gap-1">
          {([['name','Имя'], ['date','Дата'], ['orders','Заказы'], ['spent','Сумма']] as const).map(([k,l]) => (
            <button key={k} onClick={() => toggleSort(k)}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${sortBy === k ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700'}`}>
              {l} {sortBy === k && <ArrowUpDown size={10} />}
            </button>
          ))}
        </div>
      </div>

      {/* Список */}
      {registeredUsers.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
          <span className="text-5xl block mb-4">👥</span>
          <h3 className="font-bold text-zinc-900 dark:text-white text-lg mb-1">Клиентов пока нет</h3>
          <p className="text-sm text-zinc-500">Клиенты появятся после регистрации в мобильном приложении или Telegram</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
          <span className="text-3xl block mb-2">🔍</span>
          <p className="text-sm text-zinc-500">Ничего не найдено по запросу «{search}»</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => {
            const clientOrders = orders.filter(o => o.userName === client.name);
            const totalSpent = clientOrders.reduce((s, o) => s + o.total, 0);
            const lvl = lvlLabel(client.loyaltyLevel);
            const isNew = client.registeredAt.slice(0, 10) === today;

            return (
              <button key={client.id} onClick={() => setSelectedClient(client)}
                className="w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-4 flex items-center gap-3 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-md transition-all text-left group">
                {/* Аватар */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 ${client.source === 'telegram' ? 'bg-sky-500' : client.source === 'mobile_app' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                  {client.name[0]}
                </div>
                {/* Инфо */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-zinc-900 dark:text-white">{client.name}</span>
                    <span className={`text-xs font-medium ${lvl.color}`}>{lvl.icon}</span>
                    {isNew && <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full font-semibold animate-pulse">● Сегодня</span>}
                    <span className="text-[10px] text-zinc-400 ml-auto">{fmtDate(client.registeredAt)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Phone size={10} /> {client.phone}</span>
                    <span className="flex items-center gap-1 text-zinc-300">·</span>
                    <span>{srcLabel(client.source)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="text-zinc-500 flex items-center gap-1"><ShoppingBag size={10} /> {clientOrders.length} заказов</span>
                    {totalSpent > 0 && <span className="text-orange-600 dark:text-orange-400 font-medium">{totalSpent.toLocaleString()}₽</span>}
                    {(client.bonusBalance || 0) > 0 && <span className="text-amber-500 flex items-center gap-1"><Gift size={10} /> {client.bonusBalance}₽</span>}
                  </div>
                </div>
                {/* Адреса если есть */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {client.addresses && client.addresses.length > 0 && (
                    <span className="text-[10px] text-zinc-400 flex items-center gap-0.5"><MapPin size={10} /> {client.addresses.length}</span>
                  )}
                  <ChevronRight size={18} className="text-zinc-300 group-hover:text-orange-500 transition" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ДЕТАЛЬНАЯ ПАНЕЛЬ КЛИЕНТА
// ─────────────────────────────────────────────────────────────
function ClientDetailPanel({ client, orders, reviews, onBack, onAddBonus, onSendMessage }: {
  client: RegisteredUser;
  orders: import('../types').Order[];
  reviews: import('../types').Review[];
  onBack: () => void;
  onAddBonus: (amount: number, comment: string) => void;
  onSendMessage: (text: string) => void;
}) {
  const [tab, setTab] = useState<'info' | 'orders' | 'reviews' | 'chat' | 'bonus'>('info');
  const [bonusAmount, setBonusAmount] = useState(200);
  const [bonusComment, setBonusComment] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{ from: 'admin' | 'client'; text: string; time: string }[]>([]);
  const { clientChats } = useApp();
  const msgs = clientChats[client.id] || [];

  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  const avgCheck = orders.length ? Math.round(totalSpent / orders.length) : 0;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  const srcLabel = client.source === 'telegram' ? '🤖 Telegram' : client.source === 'mobile_app' ? '📱 Приложение' : '🌐 Сайт';
  const _srcColorGrad = client.source === 'telegram' ? 'from-sky-400 to-sky-600' : client.source === 'mobile_app' ? 'from-blue-500 to-blue-700' : 'from-purple-500 to-purple-700'; void _srcColorGrad;
  const lvlData: Record<string, { label: string; color: string; icon: string; cashback: number }> = {
    newbie:   { label: 'Новичок', color: 'from-zinc-400 to-zinc-500',      icon: '⭐', cashback: 3 },
    silver:   { label: 'Серебро', color: 'from-slate-300 to-slate-500',    icon: '🥈', cashback: 5 },
    gold:     { label: 'Золото',  color: 'from-amber-400 to-amber-600',    icon: '🥇', cashback: 7 },
    platinum: { label: 'Платина', color: 'from-purple-500 to-fuchsia-500', icon: '💎', cashback: 10 },
  };
  const lvl = lvlData[client.loyaltyLevel || 'newbie'];
  const fmtDate = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtShort = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });

  const statusColor: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700', accepted: 'bg-cyan-100 text-cyan-700',
    preparing: 'bg-amber-100 text-amber-700', ready: 'bg-green-100 text-green-700',
    delivering: 'bg-purple-100 text-purple-700', delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  const statusLabel: Record<string, string> = {
    new: 'Новый', accepted: 'Принят', preparing: 'Готовится',
    ready: 'Готов', delivering: 'В доставке', delivered: 'Доставлен', cancelled: 'Отменён',
  };

  const detailTabs = [
    { id: 'info' as const,    icon: Users,        label: 'Профиль' },
    { id: 'orders' as const,  icon: ShoppingBag,  label: `Заказы (${orders.length})` },
    { id: 'reviews' as const, icon: Star,         label: `Отзывы (${reviews.length})` },
    { id: 'chat' as const,    icon: MessageSquare,label: 'Чат' },
    { id: 'bonus' as const,   icon: Gift,         label: 'Бонусы' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Назад + заголовок */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition">
          ← Все клиенты
        </button>
      </div>

      {/* Карточка клиента */}
      <div className={`bg-gradient-to-br ${lvl.color} rounded-2xl p-5 text-white`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center text-2xl font-bold border-2 border-white/30">
            {client.name[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{client.name}</h2>
            <p className="text-white/70 text-sm">{lvl.icon} {lvl.label} · {srcLabel}</p>
            <p className="text-white/60 text-xs mt-0.5">ID #{client.id} · Кэшбэк {lvl.cashback}%</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs">Бонусы</p>
            <p className="text-2xl font-bold">{(client.bonusBalance || 0).toLocaleString()}₽</p>
          </div>
        </div>
        {/* Быстрая статистика */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: 'Заказов', value: orders.length },
            { label: 'Потрачено', value: `${totalSpent.toLocaleString()}₽` },
            { label: 'Ср. чек', value: avgCheck ? `${avgCheck.toLocaleString()}₽` : '—' },
            { label: 'Отменено', value: cancelledOrders },
          ].map(m => (
            <div key={m.label} className="bg-white/15 rounded-xl p-2.5 text-center">
              <p className="text-base font-bold">{m.value}</p>
              <p className="text-[10px] text-white/60">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Детальные вкладки */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide bg-white dark:bg-zinc-900 rounded-2xl p-1.5 shadow-sm border border-zinc-100 dark:border-zinc-800">
        {detailTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${tab === t.id ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Профиль ── */}
      {tab === 'info' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {[
            { icon: Phone,    label: 'Телефон',          value: client.phone,    verified: true },
            { icon: Mail,     label: 'Email',             value: client.email || '—' },
            { icon: Calendar, label: 'Дата рождения',    value: client.birthday ? new Date(client.birthday).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' }) : '—' },
            { icon: Clock,    label: 'Регистрация',      value: fmtDate(client.registeredAt) },
            { icon: Clock,    label: 'Последний визит',  value: client.lastVisitAt ? fmtDate(client.lastVisitAt) : '—' },
            { icon: TrendingUp,label:'Всего потрачено',  value: `${totalSpent.toLocaleString()}₽` },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3 px-4 py-3">
              <row.icon size={16} className="text-zinc-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-400">{row.label}</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{row.value}</p>
              </div>
              {(row as any).verified && <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">✓ SMS</span>}
            </div>
          ))}

          {/* Адреса */}
          {client.addresses && client.addresses.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-xs text-zinc-400 mb-2 flex items-center gap-1"><MapPin size={12} /> Адреса доставки</p>
              <div className="space-y-2">
                {client.addresses.map(addr => (
                  <div key={addr.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm">{addr.label === 'Дом' ? '🏠' : addr.label === 'Работа' ? '💼' : '📍'}</span>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white">{addr.label}</span>
                      {addr.isDefault && <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">Основной</span>}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">{addr.city}, {addr.street}, д.{addr.house}{addr.apartment ? `, кв.${addr.apartment}` : ''}</p>
                    {(addr.entrance || addr.floor || addr.intercom) && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {[addr.entrance && `Подъезд ${addr.entrance}`, addr.floor && `Этаж ${addr.floor}`, addr.intercom && `Домофон ${addr.intercom}`].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {addr.comment && <p className="text-xs text-zinc-400 mt-0.5 italic">«{addr.comment}»</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Заказы ── */}
      {tab === 'orders' && (
        <div className="space-y-2">
          {orders.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center shadow-sm border border-zinc-100 dark:border-zinc-800">
              <span className="text-4xl block mb-2">🛍️</span>
              <p className="text-sm text-zinc-500">Заказов пока нет</p>
            </div>
          ) : orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900 dark:text-white">#{order.id}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[order.status]}`}>{statusLabel[order.status]}</span>
                </div>
                <span className="font-bold text-zinc-900 dark:text-white">{order.total.toLocaleString()}₽</span>
              </div>
              <p className="text-xs text-zinc-500 mb-1">{order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</p>
              <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                <span>{order.type === 'delivery' ? '🚗 Доставка' : order.type === 'pickup' ? '🏪 Самовынос' : '🍽️ В зале'}</span>
                <span>·</span>
                <span>{fmtShort(order.createdAt)}</span>
                {order.address && <><span>·</span><span>📍 {order.address}</span></>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Отзывы ── */}
      {tab === 'reviews' && (
        <div className="space-y-2">
          {reviews.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 text-center shadow-sm border border-zinc-100 dark:border-zinc-800">
              <span className="text-4xl block mb-2">⭐</span>
              <p className="text-sm text-zinc-500">Отзывов пока нет</p>
            </div>
          ) : reviews.map(r => (
            <div key={r.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">{r.dishName}</span>
                <div className="flex">{[1,2,3,4,5].map(s=><span key={s} className={`text-sm ${s<=r.rating?'text-amber-400':'text-zinc-300'}`}>★</span>)}</div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{r.text}</p>
              <p className="text-xs text-zinc-400 mt-1">{fmtShort(r.createdAt)} · {r.isModerated ? '✓ Опубликован' : '⏳ На модерации'}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Чат ── */}
      {tab === 'chat' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 bg-green-500 text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-semibold">Чат с {client.name}</span>
            <span className="text-xs text-white/70 ml-auto">{srcLabel}</span>
          </div>
          <div className="h-64 overflow-y-auto p-4 space-y-2 bg-zinc-50 dark:bg-zinc-800/50">
            {msgs.length === 0 && chatLog.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400">
                <MessageSquare size={32} className="mb-2 opacity-30" />
                <p className="text-sm">Напишите первым</p>
              </div>
            ) : (
              [...msgs.map(m => ({ from: m.fromAdmin ? 'admin' : 'client' as 'admin'|'client', text: m.text, time: new Date(m.timestamp).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}) })),
               ...chatLog].map((m, i) => (
                <div key={i} className={`flex ${m.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${m.from === 'admin' ? 'bg-green-500 text-white rounded-br-sm' : 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-bl-sm'}`}>
                    <p>{m.text}</p>
                    <p className={`text-[9px] mt-0.5 ${m.from === 'admin' ? 'text-white/60' : 'text-zinc-400'}`}>{m.time} {m.from === 'admin' && '✓✓'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Шаблоны */}
          <div className="px-3 py-2 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {['Спасибо за ваш отзыв! 🙏', 'Приносим извинения, исправим!', 'Ваш заказ уже в пути 🚗', 'Дарим вам промокод SORRY15 🎁'].map(t => (
              <button key={t} onClick={() => setChatInput(t)}
                className="flex-shrink-0 text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 transition">
                {t.slice(0, 25)}…
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && chatInput.trim()) {
                  onSendMessage(chatInput.trim());
                  setChatLog(prev => [...prev, { from: 'admin', text: chatInput.trim(), time: new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}) }]);
                  setChatInput('');
                }
              }}
              placeholder="Написать клиенту..."
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none" />
            <button onClick={() => {
              if (!chatInput.trim()) return;
              onSendMessage(chatInput.trim());
              setChatLog(prev => [...prev, { from: 'admin', text: chatInput.trim(), time: new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}) }]);
              setChatInput('');
            }} className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-green-600 transition">
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ── Бонусы ── */}
      {tab === 'bonus' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-5 text-white">
            <p className="text-white/70 text-sm">Текущий баланс бонусов</p>
            <p className="text-4xl font-bold mt-1">{(client.bonusBalance || 0).toLocaleString()} ₽</p>
            <p className="text-white/60 text-xs mt-1">Кэшбэк {lvl.cashback}% с каждого заказа</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-3">
            <h3 className="font-bold text-zinc-900 dark:text-white">Начислить бонусы</h3>
            <div className="flex gap-2">
              {[100, 200, 500, 1000, 2000].map(v => (
                <button key={v} onClick={() => setBonusAmount(v)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${bonusAmount === v ? 'bg-amber-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600'}`}>
                  +{v}
                </button>
              ))}
            </div>
            <input type="number" value={bonusAmount} onChange={e => setBonusAmount(Math.max(0, Number(e.target.value)))}
              className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none" />
            <input value={bonusComment} onChange={e => setBonusComment(e.target.value)}
              placeholder="Причина начисления (например: компенсация)"
              className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400" />
            <button onClick={() => { onAddBonus(bonusAmount, bonusComment); setBonusComment(''); }}
              disabled={bonusAmount <= 0}
              className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 transition disabled:opacity-40">
              Начислить {bonusAmount.toLocaleString()}₽ → клиент получит уведомление
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ВКЛАДКА 2: СЕГМЕНТЫ
// ─────────────────────────────────────────────────────────────
function SegmentsTab() {
  const { registeredUsers, orders } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const week7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const week30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const segments = [
    {
      id: 'new', label: 'Новые', icon: '🆕', color: 'from-green-400 to-emerald-500',
      desc: 'Зарегистрировались за 7 дней',
      count: registeredUsers.filter(u => u.registeredAt.slice(0, 10) >= week7).length,
    },
    {
      id: 'active', label: 'Активные', icon: '🔥', color: 'from-orange-400 to-red-500',
      desc: 'Делали заказы за последние 30 дней',
      count: registeredUsers.filter(u => orders.some(o => o.userName === u.name && o.createdAt.slice(0, 10) >= week30)).length,
    },
    {
      id: 'vip', label: 'VIP', icon: '💎', color: 'from-purple-400 to-fuchsia-500',
      desc: 'Уровень Золото или Платина',
      count: registeredUsers.filter(u => u.loyaltyLevel === 'gold' || u.loyaltyLevel === 'platinum').length,
    },
    {
      id: 'inactive', label: 'Спящие', icon: '😴', color: 'from-zinc-400 to-zinc-500',
      desc: 'Нет заказов более 30 дней',
      count: registeredUsers.filter(u => !orders.some(o => o.userName === u.name && o.createdAt.slice(0, 10) >= week30)).length,
    },
    {
      id: 'birthday', label: 'Именинники', icon: '🎂', color: 'from-pink-400 to-rose-500',
      desc: 'День рождения в этом месяце',
      count: registeredUsers.filter(u => {
        if (!u.birthday) return false;
        const bMonth = u.birthday.slice(5, 7);
        const nowMonth = today.slice(5, 7);
        return bMonth === nowMonth;
      }).length,
    },
    {
      id: 'telegram', label: 'Telegram', icon: '🤖', color: 'from-sky-400 to-sky-600',
      desc: 'Зарегистрированы через Telegram',
      count: registeredUsers.filter(u => u.source === 'telegram').length,
    },
    {
      id: 'mobile', label: 'Приложение', icon: '📱', color: 'from-blue-400 to-blue-600',
      desc: 'Зарегистрированы через мобильное приложение',
      count: registeredUsers.filter(u => u.source === 'mobile_app').length,
    },
    {
      id: 'highcheck', label: 'Большой чек', icon: '💰', color: 'from-amber-400 to-yellow-500',
      desc: 'Средний чек более 2000₽',
      count: registeredUsers.filter(u => {
        const uOrders = orders.filter(o => o.userName === u.name);
        if (!uOrders.length) return false;
        return uOrders.reduce((s, o) => s + o.total, 0) / uOrders.length > 2000;
      }).length,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 text-sm text-zinc-500">
        💡 Сегменты помогают таргетировать рассылки и акции на нужную аудиторию
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {segments.map(seg => (
          <div key={seg.id} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            <div className={`bg-gradient-to-r ${seg.color} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2 text-white">
                <span className="text-xl">{seg.icon}</span>
                <span className="font-bold">{seg.label}</span>
              </div>
              <span className="text-white text-2xl font-bold">{seg.count}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-zinc-500">{seg.desc}</p>
              <button className="text-xs text-orange-500 font-medium hover:text-orange-600 transition">
                Рассылка →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ВКЛАДКА 3: БОНУСЫ
// ─────────────────────────────────────────────────────────────
function BonusesTab() {
  const { registeredUsers } = useApp();

  const totalBonuses = registeredUsers.reduce((s, u) => s + (u.bonusBalance || 0), 0);
  const topByBonus = [...registeredUsers]
    .filter(u => (u.bonusBalance || 0) > 0)
    .sort((a, b) => (b.bonusBalance || 0) - (a.bonusBalance || 0))
    .slice(0, 10);

  const lvlCounts = {
    newbie: registeredUsers.filter(u => u.loyaltyLevel === 'newbie' || !u.loyaltyLevel).length,
    silver: registeredUsers.filter(u => u.loyaltyLevel === 'silver').length,
    gold:   registeredUsers.filter(u => u.loyaltyLevel === 'gold').length,
    platinum: registeredUsers.filter(u => u.loyaltyLevel === 'platinum').length,
  };

  return (
    <div className="space-y-4">
      {/* Сводка */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-5 text-white">
        <p className="text-white/70 text-sm">Всего бонусов в обращении</p>
        <p className="text-4xl font-bold mt-1">{totalBonuses.toLocaleString()} ₽</p>
        <p className="text-white/60 text-xs mt-1">У {registeredUsers.filter(u => (u.bonusBalance || 0) > 0).length} клиентов есть бонусы</p>
      </div>

      {/* Уровни лояльности */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
        <h3 className="font-bold text-zinc-900 dark:text-white mb-3">Распределение по уровням</h3>
        <div className="space-y-2.5">
          {[
            { id: 'platinum', icon: '💎', label: 'Платина', color: 'bg-purple-500', cashback: '10%' },
            { id: 'gold',     icon: '🥇', label: 'Золото',  color: 'bg-amber-500',  cashback: '7%'  },
            { id: 'silver',   icon: '🥈', label: 'Серебро', color: 'bg-slate-400',  cashback: '5%'  },
            { id: 'newbie',   icon: '⭐', label: 'Новичок', color: 'bg-zinc-400',   cashback: '3%'  },
          ].map(l => {
            const count = lvlCounts[l.id as keyof typeof lvlCounts];
            const pct = registeredUsers.length > 0 ? Math.round(count / registeredUsers.length * 100) : 0;
            return (
              <div key={l.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    {l.icon} {l.label}
                    <span className="text-xs text-zinc-400">Кэшбэк {l.cashback}</span>
                  </span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{count}</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                  <div className={`${l.color} rounded-full h-2 transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Топ по бонусам */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white">Топ по бонусам</h3>
        </div>
        {topByBonus.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Нет клиентов с бонусами</div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {topByBonus.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300' : 'bg-orange-100 text-orange-700'}`}>
                  {i + 1}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${u.source === 'telegram' ? 'bg-sky-500' : u.source === 'mobile_app' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                  {u.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{u.name}</p>
                  <p className="text-xs text-zinc-400">{u.phone}</p>
                </div>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{(u.bonusBalance || 0).toLocaleString()}₽</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
