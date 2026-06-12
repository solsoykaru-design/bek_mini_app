import { useState, useEffect } from 'react';
import { useApp } from '../context';
import { dishes, categories, branches, categoryColors } from '../data';
const initialChat: import('../types').ChatMessage[] = [];
import { Dish, ChatMessage, OrderType, PaymentMethod } from '../types';
import RegisterPage from './RegisterPage';
import AddressInput from '../components/AddressInput';
import PickupPointSelector from './PickupPointSelector';
import type { PickupPoint } from '../types';
import { Search, ShoppingCart, Heart, Star, MapPin, ChevronLeft, ChevronRight, Plus, Minus, X, Send, Trash2, Gift, Award, MessageCircle, Check, Truck, Store, UtensilsCrossed, Users, Calendar, Ticket, Info, Filter, Flame, Sparkles, Crown, Zap, Package, Navigation } from 'lucide-react';

// ===================== ГОСТЕВОЕ ПРИЛОЖЕНИЕ =====================

export default function GuestApp() {
  const { guestPage } = useApp();
  
  return (
    <div className="min-h-screen">
      {guestPage === 'home' && <HomePage />}
      {guestPage === 'menu' && <MenuPage />}
      {guestPage === 'dish' && <DishPage />}
      {guestPage === 'cart' && <CartPage />}
      {guestPage === 'checkout' && <CheckoutPage />}
      {guestPage === 'booking' && <BookingPage />}
      {guestPage === 'profile' && <ProfilePage />}
      {guestPage === 'orders' && <OrdersPage />}
      {guestPage === 'loyalty' && <LoyaltyPage />}
      {guestPage === 'reviews' && <ReviewsPage />}
      {guestPage === 'support' && <SupportPage />}
      {guestPage === 'order-tracking' && <OrderTrackingPage />}
      <BottomNav />
    </div>
  );
}

// ===================== НАВИГАЦИЯ СНИЗУ =====================
function BottomNav() {
  const { guestPage, setGuestPage, cart } = useApp();
  const tabs = [
    { id: 'home' as const, icon: Store, label: 'Главная' },
    { id: 'menu' as const, icon: UtensilsCrossed, label: 'Меню' },
    { id: 'cart' as const, icon: ShoppingCart, label: 'Корзина' },
    { id: 'booking' as const, icon: Calendar, label: 'Бронь' },
    { id: 'profile' as const, icon: Users, label: 'Профиль' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 z-50 safe-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setGuestPage(t.id)} className={`flex flex-col items-center gap-0.5 px-3 py-1 relative transition-all ${guestPage === t.id ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
            <t.icon size={22} strokeWidth={guestPage === t.id ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{t.label}</span>
            {t.id === 'cart' && cart.length > 0 && (
              <span className="absolute -top-1 right-0 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{cart.length}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===================== HEADER =====================
function Header({ title, showBack, onBack }: { title: string; showBack?: boolean; onBack?: () => void }) {
  const { setGuestPage, cart } = useApp();
  return (
    <div className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        {showBack ? (
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 dark:text-zinc-300"><ChevronLeft size={24} /></button>
        ) : <div className="w-8" />}
        <h1 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h1>
        <button onClick={() => setGuestPage('cart')} className="p-2 -mr-2 relative text-zinc-600 dark:text-zinc-300">
          <ShoppingCart size={22} />
          {cart.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>}
        </button>
      </div>
    </div>
  );
}

// ===================== ДОМАШНЯЯ =====================
function HomePage() {
  const { setGuestPage, setSelectedDish, selectedBranch, setSelectedBranch } = useApp();
  const branch = branches.find(b => b.id === selectedBranch)!;
  const popular = dishes.filter(d => d.isPopular).slice(0, 6);
  const newDishes = dishes.filter(d => d.isNew);
  const promos = [
    { title: 'Скидка 20% на пиццу', desc: 'По промокоду PIZZA20', gradient: 'from-red-500 to-orange-500', emoji: '🍕' },
    { title: 'Бесплатная доставка', desc: 'При заказе от 1500₽', gradient: 'from-blue-500 to-purple-500', emoji: '🚀' },
    { title: 'Десерт в подарок', desc: 'К заказу от 2000₽', gradient: 'from-pink-500 to-rose-500', emoji: '🎁' },
  ];

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 px-4 pt-4 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white/80 text-sm">Доставка и самовынос</h2>
              <h1 className="text-white text-2xl font-extrabold tracking-tight">FoodChain</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setGuestPage('support')} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                <MessageCircle size={20} />
              </button>
            </div>
          </div>
          {/* Branch selector */}
          <button onClick={() => {
            const next = branches[(branches.findIndex(b => b.id === selectedBranch) + 1) % branches.length];
            setSelectedBranch(next.id);
          }} className="w-full flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 text-white">
            <MapPin size={18} />
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold">{branch.name}</div>
              <div className="text-xs text-white/70">{branch.address}</div>
            </div>
            <ChevronRight size={18} className="text-white/50" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto -mt-4 px-4 space-y-6">
        {/* Поиск */}
        <button onClick={() => setGuestPage('menu')} className="w-full flex items-center gap-3 bg-white dark:bg-zinc-800 rounded-2xl px-4 py-3.5 shadow-lg shadow-black/5">
          <Search size={18} className="text-zinc-400" />
          <span className="text-zinc-400 text-sm">Поиск блюд...</span>
        </button>

        {/* Категории */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Категории</h3>
            <button onClick={() => setGuestPage('menu')} className="text-orange-500 text-sm font-medium">Все →</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {categories.slice(0, 8).map(cat => (
              <button key={cat.id} onClick={() => setGuestPage('menu')} className="flex-shrink-0 flex flex-col items-center gap-2 w-[72px]">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryColors[cat.id] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-2xl shadow-md`}>
                  {cat.icon}
                </div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 text-center leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Промо баннеры */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {promos.map((p, i) => (
            <div key={i} className={`flex-shrink-0 w-[260px] bg-gradient-to-br ${p.gradient} rounded-2xl p-4 text-white relative overflow-hidden`}>
              <div className="text-3xl absolute right-3 top-3 opacity-30">{p.emoji}</div>
              <h4 className="font-bold text-lg">{p.title}</h4>
              <p className="text-sm text-white/80 mt-1">{p.desc}</p>
              <button className="mt-3 bg-white/25 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold">Подробнее</button>
            </div>
          ))}
        </div>

        {/* Популярное */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame size={20} className="text-orange-500" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Популярное</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {popular.map(dish => (
              <DishCard key={dish.id} dish={dish} onPress={() => { setSelectedDish(dish); setGuestPage('dish'); }} />
            ))}
          </div>
        </div>

        {/* Новинки */}
        {newDishes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={20} className="text-purple-500" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Новинки</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {newDishes.map(dish => (
                <div key={dish.id} className="flex-shrink-0 w-[200px]">
                  <DishCard dish={dish} onPress={() => { setSelectedDish(dish); setGuestPage('dish'); }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== КАРТОЧКА БЛЮДА =====================
function DishCard({ dish, onPress }: { dish: Dish; onPress: () => void }) {
  const { addToCart, favorites, toggleFavorite } = useApp();
  const cat = categories.find(c => c.id === dish.categoryId);
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow" onClick={onPress}>
      <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center">
        <span className="text-5xl">{cat?.icon || '🍽️'}</span>
        {dish.isNew && <span className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>}
        {dish.oldPrice && <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{Math.round((1 - dish.price / dish.oldPrice) * 100)}%</span>}
        <button onClick={e => { e.stopPropagation(); toggleFavorite(dish.id); }} className="absolute bottom-2 right-2 w-8 h-8 bg-white/90 dark:bg-zinc-900/90 rounded-full flex items-center justify-center shadow-sm">
          <Heart size={16} fill={favorites.includes(dish.id) ? '#ef4444' : 'none'} className={favorites.includes(dish.id) ? 'text-red-500' : 'text-zinc-400'} />
        </button>
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-sm text-zinc-900 dark:text-white leading-tight">{dish.name}</h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{dish.description}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <Star size={12} fill="#f59e0b" className="text-amber-400" />
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{dish.rating}</span>
          <span className="text-xs text-zinc-400">({dish.reviewCount})</span>
          <span className="text-xs text-zinc-400 ml-auto">{dish.weight}г</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="font-bold text-base text-zinc-900 dark:text-white">{dish.price}₽</span>
            {dish.oldPrice && <span className="text-xs text-zinc-400 line-through ml-1">{dish.oldPrice}₽</span>}
          </div>
          <button onClick={e => { e.stopPropagation(); addToCart(dish, 1); }} className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-md shadow-orange-500/30 active:scale-95 transition-transform">
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== МЕНЮ =====================
function MenuPage() {
  const { setGuestPage, setSelectedDish, searchQuery, setSearchQuery } = useApp();
  const [activeCat, setActiveCat] = useState(0);
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'rating'>('default');
  const [showFilters, setShowFilters] = useState(false);

  let filtered = activeCat === 0 ? dishes : dishes.filter(d => d.categoryId === activeCat);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(d => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
  }
  if (sortBy === 'price_asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === 'price_desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === 'rating') filtered = [...filtered].sort((a, b) => b.rating - a.rating);

  return (
    <div className="pb-20">
      <Header title="Меню" />
      <div className="max-w-lg mx-auto px-4 pt-3 space-y-3">
        {/* Поиск */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5">
            <Search size={18} className="text-zinc-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Найти блюдо..." className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400" />
            {searchQuery && <button onClick={() => setSearchQuery('')}><X size={16} className="text-zinc-400" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`px-3 rounded-xl ${showFilters ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
            <Filter size={18} />
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-2 flex-wrap">
            {[['default', 'По умолчанию'], ['price_asc', 'Цена ↑'], ['price_desc', 'Цена ↓'], ['rating', 'Рейтинг']].map(([k, l]) => (
              <button key={k} onClick={() => setSortBy(k as any)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${sortBy === k ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Категории */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <button onClick={() => setActiveCat(0)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCat === 0 ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
            Всё меню
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${activeCat === cat.id ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Блюда */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(dish => (
            <DishCard key={dish.id} dish={dish} onPress={() => { setSelectedDish(dish); setGuestPage('dish'); }} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl">🔍</span>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Ничего не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== ДЕТАЛЬНАЯ СТРАНИЦА БЛЮДА =====================
function DishPage() {
  const { selectedDish, setGuestPage, addToCart, favorites, toggleFavorite } = useApp();
  const [qty, setQty] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<{ [k: number]: number[] }>({});

  if (!selectedDish) return null;
  const dish = selectedDish;
  const cat = categories.find(c => c.id === dish.categoryId);

  // Инициализация дефолтных опций
  useEffect(() => {
    if (dish.customizations) {
      const defaults: { [k: number]: number[] } = {};
      dish.customizations.forEach(c => {
        const def = c.options.filter(o => o.isDefault);
        if (def.length > 0) defaults[c.id] = def.map(o => o.id);
      });
      setSelectedOptions(defaults);
    }
  }, [dish]);

  let extraPrice = 0;
  if (dish.customizations) {
    Object.entries(selectedOptions).forEach(([custId, optIds]) => {
      const cust = dish.customizations?.find(c => c.id === Number(custId));
      if (cust) optIds.forEach(optId => {
        const opt = cust.options.find(o => o.id === optId);
        if (opt) extraPrice += opt.price;
      });
    });
  }
  const totalPrice = (dish.price + extraPrice) * qty;

  const toggleOption = (custId: number, optId: number, multiple: boolean) => {
    setSelectedOptions(prev => {
      const current = prev[custId] || [];
      if (multiple) {
        return { ...prev, [custId]: current.includes(optId) ? current.filter(id => id !== optId) : [...current, optId] };
      }
      return { ...prev, [custId]: [optId] };
    });
  };

  return (
    <div className="pb-24">
      <div className="relative aspect-square bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center">
        <span className="text-[120px]">{cat?.icon || '🍽️'}</span>
        <button onClick={() => setGuestPage('menu')} className="absolute top-4 left-4 w-10 h-10 bg-white/90 dark:bg-zinc-900/90 rounded-full flex items-center justify-center shadow-lg">
          <ChevronLeft size={24} className="text-zinc-700 dark:text-white" />
        </button>
        <button onClick={() => toggleFavorite(dish.id)} className="absolute top-4 right-4 w-10 h-10 bg-white/90 dark:bg-zinc-900/90 rounded-full flex items-center justify-center shadow-lg">
          <Heart size={20} fill={favorites.includes(dish.id) ? '#ef4444' : 'none'} className={favorites.includes(dish.id) ? 'text-red-500' : 'text-zinc-400'} />
        </button>
        <div className="absolute bottom-4 left-4 flex gap-2">
          {dish.tags.map(tag => (
            <span key={tag} className="bg-orange-500/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">{tag}</span>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white dark:bg-zinc-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div>
            <div className="flex items-start justify-between">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{dish.name}</h1>
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                <Star size={14} fill="#f59e0b" className="text-amber-400" />
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{dish.rating}</span>
              </div>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">{dish.description}</p>
          </div>

          {/* КБЖУ */}
          <div className="grid grid-cols-4 gap-2">
            {[['Ккал', dish.calories, 'from-orange-400 to-red-400'], ['Белки', dish.proteins + 'г', 'from-blue-400 to-cyan-400'], ['Жиры', dish.fats + 'г', 'from-yellow-400 to-amber-400'], ['Углев.', dish.carbs + 'г', 'from-green-400 to-emerald-400']].map(([label, val, grad]) => (
              <div key={label as string} className="text-center">
                <div className={`bg-gradient-to-br ${grad} text-white text-sm font-bold rounded-xl py-2`}>{String(val)}</div>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">{label as string}</span>
              </div>
            ))}
          </div>

          {/* Аллергены */}
          {dish.allergens.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Info size={14} className="text-amber-500" />
              {dish.allergens.map(a => (
                <span key={a} className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full">{a}</span>
              ))}
            </div>
          )}

          {/* Кастомизация */}
          {dish.customizations?.map(cust => (
            <div key={cust.id}>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">{cust.name} {cust.required && <span className="text-red-500">*</span>}</h3>
              <div className="flex gap-2 flex-wrap">
                {cust.options.map(opt => {
                  const isSelected = (selectedOptions[cust.id] || []).includes(opt.id);
                  return (
                    <button key={opt.id} onClick={() => toggleOption(cust.id, opt.id, cust.multiple)} className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${isSelected ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                      {opt.name} {opt.price > 0 && <span className="text-orange-500">+{opt.price}₽</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Вес */}
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Вес: {dish.weight}г</div>
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 z-40">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-1 py-1">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"><Minus size={18} /></button>
            <span className="text-lg font-bold text-zinc-900 dark:text-white w-6 text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"><Plus size={18} /></button>
          </div>
          <button onClick={() => { addToCart(dish, qty, selectedOptions); setGuestPage('menu'); }} className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-transform">
            В корзину · {totalPrice}₽
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== КОРЗИНА =====================
function CartPage() {
  const { cart, updateCartQty, removeFromCart, cartTotal, promoCode, setPromoCode, promoDiscount, applyPromo, setGuestPage } = useApp();
  const deliveryFee = cartTotal >= 1500 ? 0 : 199;
  const total = Math.max(0, cartTotal - promoDiscount + deliveryFee);

  if (cart.length === 0) {
    return (
      <div className="pb-20">
        <Header title="Корзина" />
        <div className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center py-20">
          <span className="text-6xl mb-4">🛒</span>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Корзина пуста</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Добавьте блюда из меню</p>
          <button onClick={() => setGuestPage('menu')} className="mt-6 bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-orange-500/30">Перейти в меню</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-36">
      <Header title={`Корзина (${cart.length})`} />
      <div className="max-w-lg mx-auto px-4 pt-3 space-y-3">
        {cart.map(item => {
          const cat = categories.find(c => c.id === item.dish.categoryId);
          return (
            <div key={item.dish.id} className="bg-white dark:bg-zinc-800 rounded-2xl p-4 flex gap-3 shadow-sm">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-700 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                {cat?.icon || '🍽️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">{item.dish.name}</h4>
                  <button onClick={() => removeFromCart(item.dish.id)} className="text-zinc-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                </div>
                {Object.keys(item.selectedOptions).length > 0 && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {Object.entries(item.selectedOptions).map(([, optIds]) => optIds.map(optId => {
                      const opt = item.dish.customizations?.flatMap(c => c.options).find(o => o.id === optId);
                      return opt?.name;
                    }).filter(Boolean).join(', ')).join('; ')}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg px-1 py-0.5">
                    <button onClick={() => updateCartQty(item.dish.id, item.quantity - 1)} className="w-7 h-7 rounded-md flex items-center justify-center"><Minus size={14} className="text-zinc-500" /></button>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateCartQty(item.dish.id, item.quantity + 1)} className="w-7 h-7 rounded-md flex items-center justify-center"><Plus size={14} className="text-zinc-500" /></button>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-white">{item.totalPrice}₽</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Промокод */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-700 rounded-xl px-3 py-2.5">
              <Ticket size={18} className="text-zinc-400" />
              <input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Промокод" className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400" />
            </div>
            <button onClick={applyPromo} className="bg-orange-500 text-white font-semibold px-4 rounded-xl text-sm">OK</button>
          </div>
          {promoDiscount > 0 && (
            <div className="flex items-center gap-2 mt-2 text-green-600 dark:text-green-400">
              <Check size={16} />
              <span className="text-sm font-medium">Скидка {promoDiscount}₽ применена!</span>
            </div>
          )}
        </div>
      </div>

      {/* Итого */}
      <div className="fixed bottom-16 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 z-40">
        <div className="max-w-lg mx-auto space-y-1">
          <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
            <span>Подытог</span><span>{cartTotal}₽</span>
          </div>
          <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
            <span>Доставка</span><span>{deliveryFee === 0 ? 'Бесплатно' : `${deliveryFee}₽`}</span>
          </div>
          {promoDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>Скидка</span><span>−{promoDiscount}₽</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-zinc-900 dark:text-white pt-1 border-t border-zinc-100 dark:border-zinc-700">
            <span>Итого</span><span>{total}₽</span>
          </div>
          <button onClick={() => setGuestPage('checkout')} className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/30 active:scale-[0.98] transition-transform mt-2">
            Оформить заказ
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== ОФОРМЛЕНИЕ ЗАКАЗА =====================
function CheckoutPage() {
  const { cart, cartTotal, promoDiscount, promoCode, clearCart, setGuestPage, addOrder, addNotification, registeredUsers } = useApp();
  const currentUser = registeredUsers.length > 0 ? registeredUsers[0] : null;
  const defaultAddr = currentUser?.addresses?.find(a => a.isDefault) || currentUser?.addresses?.[0];
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [address, setAddress] = useState(defaultAddr ? `${defaultAddr.street}, д.${defaultAddr.house}${defaultAddr.apartment ? `, кв.${defaultAddr.apartment}` : ''}` : '');
  const [comment, setComment] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('card');
  const [tableNum, setTableNum] = useState('');
  const [pickupPoint, setPickupPoint] = useState<PickupPoint | null>(null);
  const [placed, setPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<number>(0);
  const deliveryFee = orderType === 'delivery' ? (cartTotal >= 1500 ? 0 : 199) : 0;
  const total = Math.max(0, cartTotal - promoDiscount + deliveryFee);

  // ─── РЕАЛЬНОЕ СОЗДАНИЕ ЗАКАЗА: попадает в бэк-офис ───
  const placeOrder = () => {
    const orderId = Date.now() % 1000000;
    addOrder({
      id: orderId,
      userId: currentUser?.id || 0,
      userName: currentUser?.name || 'Гость',
      userPhone: currentUser?.phone || '—',
      branchId: orderType === 'pickup' && pickupPoint ? pickupPoint.id : 1,
      branchName: orderType === 'pickup' && pickupPoint ? pickupPoint.name : 'FoodChain Центр',
      type: orderType,
      status: 'new',
      items: cart.map(item => ({
        dishId: item.dish.id,
        name: item.dish.name,
        price: item.dish.price,
        quantity: item.quantity,
        options: Object.entries(item.selectedOptions).flatMap(([custId, optIds]) =>
          optIds.map(optId => {
            const opt = item.dish.customizations?.find(c => c.id === Number(custId))?.options.find(o => o.id === optId);
            return opt?.name || '';
          }).filter(Boolean)
        ),
      })),
      subtotal: cartTotal,
      deliveryFee,
      discount: promoDiscount,
      bonusUsed: 0,
      total,
      promoCode: promoCode || undefined,
      paymentMethod: payMethod,
      isPaid: payMethod !== 'cash',
      address: orderType === 'delivery' ? address : undefined,
      tableNumber: orderType === 'dine_in' && tableNum ? Number(tableNum) : undefined,
      comment: [
        comment,
        orderType === 'pickup' && pickupPoint ? `Самовывоз: ${pickupPoint.name}, ${pickupPoint.address}` : '',
      ].filter(Boolean).join(' · ') || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    // Уведомление в бэк-офис (колокольчик)
    addNotification({
      type: 'order',
      title: `🛒 Новый заказ #${orderId}`,
      body: `${currentUser?.name || 'Гость'} · ${cart.map(i => i.dish.name).join(', ').slice(0, 50)} · ${total.toLocaleString()}₽ · ${orderType === 'delivery' ? '🚗 Доставка' : orderType === 'pickup' ? '🏪 Самовынос' : '🍽️ В зале'}`,
      link: 'orders',
      meta: { orderId },
    });
    setPlacedOrderId(orderId);
    setPlaced(true);
    clearCart();
  };

  if (placed) {
    return (
      <div className="pb-20">
        <div className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <Check size={40} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Заказ оформлен!</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 text-center">Номер заказа: #{placedOrderId}<br/>Ресторан уже получил ваш заказ! Мы уведомим о статусе.</p>
          <button onClick={() => { setGuestPage('order-tracking'); }} className="mt-6 bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-orange-500/30">Отследить заказ</button>
          <button onClick={() => setGuestPage('home')} className="mt-3 text-orange-500 font-medium text-sm">На главную</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <Header title="Оформление" showBack onBack={() => setGuestPage('cart')} />
      <div className="max-w-lg mx-auto px-4 pt-3 space-y-4">
        {/* Тип заказа */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">Тип заказа</h3>
          <div className="grid grid-cols-3 gap-2">
            {([['delivery', 'Доставка', Truck], ['pickup', 'Самовынос', Package], ['dine_in', 'В зале', UtensilsCrossed]] as const).map(([type, label, Icon]) => (
              <button key={type} onClick={() => setOrderType(type)} className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all ${orderType === type ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-zinc-200 dark:border-zinc-700'}`}>
                <Icon size={20} className={orderType === type ? 'text-orange-500' : 'text-zinc-400'} />
                <span className={`text-xs font-medium ${orderType === type ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Адрес доставки */}
        {orderType === 'delivery' && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">Адрес доставки</h3>
            <AddressInput
              value={address}
              onChange={setAddress}
              user={currentUser}
              showFavorites={!!(currentUser?.addresses?.length)}
              placeholder="ул. Пушкина, д. 10, кв. 15"
            />
          </div>
        )}

        {orderType === 'pickup' && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm">
            <PickupPointSelector
              selectedId={pickupPoint?.id}
              onSelect={setPickupPoint}
            />
            {pickupPoint && (
              <div className="mt-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-sm text-orange-700 dark:text-orange-300">
                ✓ Самовывоз из: <strong>{pickupPoint.name}</strong><br />
                <span className="text-xs">{pickupPoint.address} · готовность ~{pickupPoint.estimatedReadyMinutes} мин</span>
              </div>
            )}
          </div>
        )}

        {orderType === 'dine_in' && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Номер столика</h3>
            <input value={tableNum} onChange={e => setTableNum(e.target.value)} placeholder="Введите номер" className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400" />
          </div>
        )}

        {/* Комментарий */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Комментарий</h3>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Пожелания к заказу..." rows={2} className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 resize-none" />
        </div>

        {/* Оплата */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">Способ оплаты</h3>
          <div className="space-y-2">
            {([['card', '💳 Банковская карта'], ['telegram_stars', '⭐ Telegram Stars'], ['yukassa', '🏦 ЮKassa'], ['cash', '💵 Наличными']] as [PaymentMethod, string][]).map(([method, label]) => (
              <button key={method} onClick={() => setPayMethod(method)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${payMethod === method ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-zinc-200 dark:border-zinc-700'}`}>
                <span className="text-sm">{label}</span>
                {payMethod === method && <Check size={16} className="text-orange-500 ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Итого */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex justify-between text-sm text-zinc-500"><span>Подытог</span><span>{cartTotal}₽</span></div>
          {orderType === 'delivery' && <div className="flex justify-between text-sm text-zinc-500"><span>Доставка</span><span>{deliveryFee === 0 ? 'Бесплатно' : `${deliveryFee}₽`}</span></div>}
          {promoDiscount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Скидка</span><span>−{promoDiscount}₽</span></div>}
          <div className="flex justify-between text-lg font-bold text-zinc-900 dark:text-white pt-2 border-t border-zinc-100 dark:border-zinc-700">
            <span>Итого</span><span>{total}₽</span>
          </div>
        </div>

        <button onClick={placeOrder} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/30 text-lg active:scale-[0.98] transition-transform">
          Оплатить {total}₽
        </button>
      </div>
    </div>
  );
}

// ===================== БРОНИРОВАНИЕ =====================
function BookingPage() {
  const { setGuestPage, tables: allTables, addBooking } = useApp();
  const [step, setStep] = useState(0);
  const [date, setDate] = useState('2025-01-16');
  const [time, setTime] = useState('19:00');
  const [guests, setGuests] = useState(2);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const _freeTables = allTables.filter(t => t.status === 'free' && t.capacity >= guests); void _freeTables;

  if (step === 2) {
    return (
      <div className="pb-20">
        <div className="max-w-lg mx-auto px-4 flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <Check size={40} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Бронь подтверждена!</h2>
          <p className="text-sm text-zinc-500 mt-2 text-center">{date} в {time}<br/>{guests} гостей</p>
          <p className="text-xs text-zinc-400 mt-1">Напоминание придёт за 2 часа</p>
          <button onClick={() => { setStep(0); setGuestPage('home'); }} className="mt-6 bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl">На главную</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <Header title="Бронирование" showBack onBack={() => step === 0 ? setGuestPage('home') : setStep(0)} />
      <div className="max-w-lg mx-auto px-4 pt-3 space-y-4">
        {step === 0 && (
          <>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Дата</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Время</label>
                <div className="grid grid-cols-4 gap-2">
                  {['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'].map(t => (
                    <button key={t} onClick={() => setTime(t)} className={`py-2 rounded-xl text-sm font-medium ${time === t ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1.5">Количество гостей</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-10 h-10 bg-zinc-100 dark:bg-zinc-700 rounded-xl flex items-center justify-center"><Minus size={18} className="text-zinc-500" /></button>
                  <span className="text-xl font-bold text-zinc-900 dark:text-white w-8 text-center">{guests}</span>
                  <button onClick={() => setGuests(Math.min(20, guests + 1))} className="w-10 h-10 bg-zinc-100 dark:bg-zinc-700 rounded-xl flex items-center justify-center"><Plus size={18} className="text-zinc-500" /></button>
                  <Users size={18} className="text-zinc-400 ml-2" />
                </div>
              </div>
            </div>
            <button onClick={() => setStep(1)} className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/30">Выбрать столик</button>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Доступные столики на {guests} гостей</h3>
            {/* Схема зала */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm">
              <div className="relative w-full aspect-square bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden">
                {/* Зоны */}
                <div className="absolute top-2 left-2 text-[10px] text-zinc-400">Зал</div>
                <div className="absolute top-2 right-2 text-[10px] text-zinc-400">Терраса</div>
                <div className="absolute bottom-12 left-2 text-[10px] text-zinc-400">VIP</div>
                <div className="absolute bottom-2 left-2 text-[10px] text-zinc-400">Бар</div>
                {allTables.map(t => (
                  <button key={t.id} onClick={() => t.status === 'free' && t.capacity >= guests && setSelectedTable(t.id)} disabled={t.status !== 'free' || t.capacity < guests}
                    className={`absolute w-12 h-12 rounded-lg flex flex-col items-center justify-center text-[10px] font-medium transition-all ${
                      selectedTable === t.id ? 'bg-orange-500 text-white ring-2 ring-orange-300 scale-110' :
                      t.status === 'free' && t.capacity >= guests ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:scale-105' :
                      t.status === 'reserved' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                      t.status === 'occupied' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                      'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                    }`} style={{ left: `${t.x}%`, top: `${t.y}%` }}>
                    <span>{t.name.replace('Стол ', '№')}</span>
                    <span className="text-[8px] opacity-70">{t.capacity}м</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400" /> Свободен</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400" /> Бронь</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> Занят</span>
              </div>
            </div>
            {selectedTable && (
              <button onClick={() => {
                addBooking({ id: Date.now(), userId: 0, userName: 'Вы', userPhone: '', branchId: 1, date, time, duration: 120, guestCount: guests, tableId: selectedTable, tableName: allTables.find(t => t.id === selectedTable)?.name || '', status: 'confirmed', deposit: 0, createdAt: new Date().toISOString() });
                setStep(2);
              }} className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/30">
                Забронировать
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ===================== ПРОФИЛЬ =====================
function ProfilePage() {
  const { setGuestPage, bonusBalance, favorites, registeredUsers } = useApp();
  const [showRegister, setShowRegister] = useState(false);
  const currentUser = registeredUsers.length > 0 ? registeredUsers[0] : null;
  const favDishes = dishes.filter(d => favorites.includes(d.id));
  const loyaltyInfo = {
    newbie: { label: '⭐ Новичок', cashback: 3 },
    silver: { label: '🥈 Серебро', cashback: 5 },
    gold: { label: '🥇 Золото', cashback: 7 },
    platinum: { label: '💎 Платина', cashback: 10 },
  };
  const lvl = currentUser?.loyaltyLevel || 'newbie';
  const bonus = currentUser?.bonusBalance ?? bonusBalance;

  const menuItems = [
    { icon: Package, label: 'Мои заказы', page: 'orders' as const },
    { icon: Calendar, label: 'Мои брони', page: 'booking' as const },
    { icon: Award, label: 'Программа лояльности', page: 'loyalty' as const },
    { icon: Star, label: 'Мои отзывы', page: 'reviews' as const },
    { icon: MessageCircle, label: 'Поддержка', page: 'support' as const },
  ];

  if (showRegister) {
    return <RegisterPage onClose={() => setShowRegister(false)} />;
  }

  return (
    <div className="pb-20">
      {/* Профиль header */}
      <div className={`px-4 pt-6 pb-10 ${currentUser ? 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500' : 'bg-gradient-to-br from-zinc-700 to-zinc-900'}`}>
        <div className="max-w-lg mx-auto">
          {currentUser ? (
            /* Авторизован */
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center text-2xl font-bold text-white backdrop-blur-sm border-2 border-white/30">
                  {currentUser.name[0]}
                </div>
                <div className="text-white flex-1">
                  <h2 className="text-xl font-bold">{currentUser.name}</h2>
                  <p className="text-white/70 text-sm flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 bg-green-400/20 px-2 py-0.5 rounded-full text-xs text-green-200">✓ {currentUser.phone}</span>
                  </p>
                  {currentUser.birthday && <p className="text-white/50 text-xs mt-0.5">🎂 {new Date(currentUser.birthday).toLocaleDateString('ru-RU', { day:'numeric', month:'long' })}</p>}
                </div>
              </div>
              {/* Бонусы + уровень */}
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs">Бонусный счёт</p>
                  <p className="text-white text-2xl font-bold">{bonus.toLocaleString()} ₽</p>
                  <p className="text-white/50 text-xs mt-0.5">Кэшбэк {loyaltyInfo[lvl].cashback}% с заказов</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs">Уровень</p>
                  <p className="text-white text-lg font-bold">{loyaltyInfo[lvl].label}</p>
                </div>
              </div>
              {/* Адреса */}
              {currentUser.addresses && currentUser.addresses.length > 0 && (
                <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 space-y-1.5">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">📍 Мои адреса</p>
                  {currentUser.addresses.map(addr => (
                    <div key={addr.id} className="flex items-center gap-2">
                      <span className="text-white/80 text-sm">{addr.label === 'Дом' ? '🏠' : addr.label === 'Работа' ? '💼' : '📍'}</span>
                      <span className="text-white text-sm font-medium">{addr.street}, {addr.house}{addr.apartment ? `, кв.${addr.apartment}` : ''}</span>
                      {addr.isDefault && <span className="ml-auto bg-white/20 text-white/80 text-[10px] px-1.5 py-0.5 rounded-full">Осн.</span>}
                    </div>
                  ))}
                </div>
              )}
              {/* Реферал */}
              <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-2">
                <Gift size={16} className="text-white/70" />
                <div className="flex-1">
                  <p className="text-white/70 text-xs">Пригласи друга — +200₽ бонусов</p>
                  <p className="text-white text-sm font-mono">t.me/foodchain_bot?ref=FC{currentUser.id}</p>
                </div>
              </div>
            </>
          ) : (
            /* Не авторизован */
            <>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm">👤</div>
                <div className="text-white">
                  <h2 className="text-xl font-bold">Добро пожаловать!</h2>
                  <p className="text-white/60 text-sm">Войдите или зарегистрируйтесь</p>
                </div>
              </div>
              <button onClick={() => setShowRegister(true)}
                className="w-full bg-white text-zinc-900 font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform">
                📱 Зарегистрироваться по номеру телефона
              </button>
              <p className="text-center text-white/50 text-xs mt-3">
                Регистрация займёт 2 минуты · SMS верификация · Бесплатно
              </p>
            </>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto -mt-4 px-4 space-y-3">
        {/* Меню */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          {menuItems.map((item, i) => (
            <button key={item.label} onClick={() => setGuestPage(item.page)} className={`w-full flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-zinc-100 dark:border-zinc-700' : ''}`}>
              <div className="w-9 h-9 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <item.icon size={18} className="text-orange-500" />
              </div>
              <span className="flex-1 text-left text-sm font-medium text-zinc-900 dark:text-white">{item.label}</span>
              {'badge' in item && (item as any).badge && <span className="text-xs bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-300">{(item as any).badge}</span>}
              <ChevronRight size={16} className="text-zinc-400" />
            </button>
          ))}
        </div>

        {/* Избранное */}
        {favDishes.length > 0 && (
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2"><Heart size={18} className="text-red-500" /> Избранное</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {favDishes.map(dish => (
                <div key={dish.id} className="flex-shrink-0 w-[160px]">
                  <DishCard dish={dish} onPress={() => {}} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== ЗАКАЗЫ =====================
function OrdersPage() {
  const { orders, setGuestPage } = useApp();
  const statusLabels: Record<string, [string, string]> = {
    new: ['Новый', 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'],
    accepted: ['Принят', 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'],
    preparing: ['Готовится', 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'],
    ready: ['Готов', 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'],
    delivering: ['В доставке', 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'],
    delivered: ['Доставлен', 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'],
    cancelled: ['Отменён', 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'],
  };
  const typeIcons: Record<string, string> = { delivery: '🚗', pickup: '🏪', dine_in: '🍽️' };

  return (
    <div className="pb-20">
      <Header title="Мои заказы" showBack onBack={() => setGuestPage('profile')} />
      <div className="max-w-lg mx-auto px-4 pt-3 space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{typeIcons[order.type]}</span>
                <span className="font-bold text-zinc-900 dark:text-white">#{order.id}</span>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusLabels[order.status]?.[1] || ''}`}>
                {statusLabels[order.status]?.[0]}
              </span>
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 space-y-0.5">
              {order.items.map((item, i) => (
                <div key={i}>{item.name} × {item.quantity}</div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-700">
              <span className="text-xs text-zinc-400">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
              <span className="font-bold text-zinc-900 dark:text-white">{order.total}₽</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== ОТСЛЕЖИВАНИЕ ЗАКАЗА =====================
function OrderTrackingPage() {
  const { setGuestPage } = useApp();
  const steps = [
    { label: 'Заказ принят', done: true, time: '12:30' },
    { label: 'Готовится', done: true, time: '12:35' },
    { label: 'Готов', done: false, time: '' },
    { label: 'В доставке', done: false, time: '' },
    { label: 'Доставлен', done: false, time: '' },
  ];

  return (
    <div className="pb-20">
      <Header title="Статус заказа" showBack onBack={() => setGuestPage('orders')} />
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1">Заказ #1006</h3>
          <p className="text-sm text-zinc-500 mb-6">Ожидаемое время: ~45 мин</p>
          <div className="space-y-0">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s.done ? 'bg-green-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'}`}>
                    {s.done ? <Check size={16} /> : <span className="text-xs">{i + 1}</span>}
                  </div>
                  {i < steps.length - 1 && <div className={`w-0.5 h-8 ${s.done ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />}
                </div>
                <div className="pb-4">
                  <p className={`text-sm font-medium ${s.done ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>{s.label}</p>
                  {s.time && <p className="text-xs text-zinc-400">{s.time}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Карта курьера (заглушка) */}
        <div className="mt-4 bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm">
          <h4 className="font-semibold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            <Navigation size={16} className="text-blue-500" /> Курьер в пути
          </h4>
          <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl">🗺️</span>
              <p className="text-xs text-zinc-500 mt-2">Карта с трекингом курьера</p>
              <p className="text-xs text-zinc-400">Интеграция с Яндекс.Картами</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== ПРОГРАММА ЛОЯЛЬНОСТИ =====================
function LoyaltyPage() {
  const { setGuestPage, bonusBalance } = useApp();
  const levels = [
    { name: 'Новичок', icon: '⭐', min: 0, cashback: 3, color: 'from-zinc-400 to-zinc-500' },
    { name: 'Серебро', icon: '🥈', min: 5000, cashback: 5, color: 'from-slate-400 to-slate-500', current: true },
    { name: 'Золото', icon: '🥇', min: 15000, cashback: 7, color: 'from-amber-400 to-amber-500' },
    { name: 'Платина', icon: '💎', min: 50000, cashback: 10, color: 'from-purple-400 to-purple-500' },
  ];

  return (
    <div className="pb-20">
      <Header title="Программа лояльности" showBack onBack={() => setGuestPage('profile')} />
      <div className="max-w-lg mx-auto px-4 pt-3 space-y-4">
        {/* Текущий уровень */}
        <div className="bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Ваш уровень</p>
              <h2 className="text-2xl font-bold flex items-center gap-2">🥈 Серебро</h2>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Баланс</p>
              <p className="text-2xl font-bold">{bonusBalance}₽</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>Прогресс до Золота</span>
              <span>8 200₽ / 15 000₽</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white rounded-full h-2" style={{ width: '55%' }} />
            </div>
          </div>
        </div>

        {/* Уровни */}
        <div className="space-y-2">
          {levels.map(lvl => (
            <div key={lvl.name} className={`bg-white dark:bg-zinc-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm ${lvl.current ? 'ring-2 ring-orange-500' : ''}`}>
              <div className={`w-12 h-12 bg-gradient-to-br ${lvl.color} rounded-xl flex items-center justify-center text-2xl`}>
                {lvl.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-zinc-900 dark:text-white">{lvl.name}</h4>
                <p className="text-xs text-zinc-500">от {lvl.min.toLocaleString()}₽ покупок</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-orange-500">{lvl.cashback}%</span>
                <p className="text-[10px] text-zinc-400">кэшбэк</p>
              </div>
            </div>
          ))}
        </div>

        {/* Как заработать */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-3">Как заработать бонусы</h3>
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <div className="flex items-center gap-2"><Zap size={16} className="text-amber-500" /> 5% кэшбэк с каждого заказа</div>
            <div className="flex items-center gap-2"><Star size={16} className="text-amber-500" /> +50₽ за отзыв с фото</div>
            <div className="flex items-center gap-2"><Gift size={16} className="text-amber-500" /> +200₽ за приглашённого друга</div>
            <div className="flex items-center gap-2"><Crown size={16} className="text-amber-500" /> Бонусы за повышение уровня</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== ОТЗЫВЫ =====================
function ReviewsPage() {
  const { setGuestPage } = useApp();
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState('');
  const myReviews = [
    { dishName: 'Классический бургер', rating: 5, text: 'Отличный бургер!', date: '14 янв' },
    { dishName: 'Филадельфия', rating: 4, text: 'Хорошие роллы, свежие', date: '10 янв' },
  ];

  return (
    <div className="pb-20">
      <Header title="Отзывы" showBack onBack={() => setGuestPage('profile')} />
      <div className="max-w-lg mx-auto px-4 pt-3 space-y-4">
        {/* Написать отзыв */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">Оставить отзыв</h3>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setNewRating(s)}>
                <Star size={28} fill={s <= newRating ? '#f59e0b' : 'none'} className={s <= newRating ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'} />
              </button>
            ))}
          </div>
          <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Расскажите о впечатлениях..." rows={3} className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 resize-none" />
          <div className="flex items-center justify-between mt-3">
            <button className="text-sm text-orange-500 font-medium">📷 Добавить фото</button>
            <button className="bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl">Отправить</button>
          </div>
        </div>

        {/* Мои отзывы */}
        {myReviews.map((r, i) => (
          <div key={i} className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">{r.dishName}</h4>
              <span className="text-xs text-zinc-400">{r.date}</span>
            </div>
            <div className="flex gap-0.5 mb-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={14} fill={s <= r.rating ? '#f59e0b' : 'none'} className={s <= r.rating ? 'text-amber-400' : 'text-zinc-300'} />
              ))}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== ПОДДЕРЖКА =====================
function SupportPage() {
  const { setGuestPage } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), fromUser: true, text: input, timestamp: new Date().toISOString() }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, fromUser: false, text: 'Спасибо за сообщение! Менеджер ответит в течение 5 минут 😊', timestamp: new Date().toISOString() }]);
    }, 1000);
  };

  return (
    <div className="pb-20 flex flex-col h-screen">
      <Header title="Поддержка" showBack onBack={() => setGuestPage('profile')} />
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 max-w-lg mx-auto w-full">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.fromUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${msg.fromUser ? 'bg-orange-500 text-white rounded-br-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-md'}`}>
              <p className="text-sm">{msg.text}</p>
              <p className={`text-[10px] mt-1 ${msg.fromUser ? 'text-white/60' : 'text-zinc-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-white dark:bg-zinc-900">
        <div className="max-w-lg mx-auto flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Введите сообщение..." className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400" />
          <button onClick={sendMessage} className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-md">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
