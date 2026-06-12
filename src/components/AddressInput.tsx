/**
 * AddressInput — умное поле ввода адреса доставки
 *
 * Функции:
 * а) Автодополнение из истории заказов (debounce 300ms, фильтр по началу строки)
 * б) Геолокация → обратный геокодинг (OpenStreetMap Nominatim + заглушка)
 * в) Избранные адреса пользователя (добавить, удалить, default)
 * г) Валидация через DaData (заглушка с имитацией: зелёный/красный)
 *
 * Работает как в гостевом приложении, так и в бэк-офисе.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context';
import type { DeliveryAddress, RegisteredUser } from '../context';
import {
  MapPin, Navigation, Star, Check, X, Loader2, Clock
} from 'lucide-react';

// ─── Типы ───────────────────────────────────────────────────
interface ValidationResult {
  status: 'idle' | 'loading' | 'valid' | 'invalid' | 'warning';
  normalized?: string;
  message?: string;
}

interface Props {
  value: string;
  onChange: (address: string) => void;
  user?: RegisteredUser | null;
  /** Компактный режим для бэк-офиса */
  compact?: boolean;
  /** Показывать блок избранных адресов */
  showFavorites?: boolean;
  placeholder?: string;
  className?: string;
}

// ─── Заглушка истории адресов (в реальном проекте — GET /api/users/:id/addresses) ──
const MOCK_HISTORY: string[] = [
  'Москва, ул. Тверская, д. 15, кв. 42',
  'Москва, ул. Арбат, д. 24, кв. 8',
  'Москва, Пресненская наб., д. 8, кв. 101',
  'Москва, ул. Новый Арбат, д. 19, кв. 305',
  'Москва, Кутузовский просп., д. 36, кв. 12',
  'Санкт-Петербург, Невский просп., д. 100, кв. 7',
  'Москва, ул. Ленинградская, д. 3, кв. 56',
];

// ─── Заглушка DaData (в реальном проекте — POST https://cleaner.dadata.ru/api/v1/clean/address) ──
async function validateAddressDaData(address: string): Promise<ValidationResult> {
  if (!address || address.length < 5) return { status: 'idle' };
  // Имитация задержки API
  await new Promise(r => setTimeout(r, 600));

  // Простая имитация: если есть цифра (номер дома) — валидный
  const hasHouseNumber = /\d/.test(address);
  void /москва|спб|санкт|новосибирск|казань|екатеринбург/i.test(address);

  if (hasHouseNumber && address.length > 10) {
    const normalized = address
      .replace(/^г\.\s*/i, 'г. ')
      .replace(/^ул\.\s*/i, 'ул. ')
      .trim();
    return {
      status: 'valid',
      normalized,
      message: 'Адрес подтверждён',
    };
  } else if (address.length > 6 && !hasHouseNumber) {
    return {
      status: 'warning',
      message: 'Добавьте номер дома',
    };
  } else {
    return {
      status: 'invalid',
      message: 'Адрес не найден. Уточните ввод.',
    };
  }
}

// ─── Обратный геокодинг через OpenStreetMap Nominatim ──────
async function reverseGeocode(lat: number, lon: number): Promise<string[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ru&addressdetails=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'FoodChainApp/1.0' } });
    if (!res.ok) throw new Error('OSM error');
    const data = await res.json();
    const addr = data.address || {};
    const parts = [
      addr.city || addr.town || addr.village || addr.county,
      addr.road || addr.pedestrian || addr.residential,
      addr.house_number ? `д. ${addr.house_number}` : null,
    ].filter(Boolean);
    const full = parts.join(', ');
    return [full, full + ', подъезд 1', full + ', корп. 2'].filter(Boolean);
  } catch {
    return [
      'Москва, ул. Тверская, д. 15',
      'Москва, ул. Тверская, д. 17',
      'Москва, Охотный ряд, д. 1',
    ];
  }
}

// ─── Утилита: debounce ──────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ═══════════════════════════════════════════════════════════
//  ГЛАВНЫЙ КОМПОНЕНТ
// ═══════════════════════════════════════════════════════════
export default function AddressInput({
  value,
  onChange,
  user,
  compact = false,
  showFavorites = true,
  placeholder = 'ул. Пушкина, д. 10, кв. 5',
  className = '',
}: Props) {
  const { addAddress } = useApp();

  // ─── State ────────────────────────────────────────────────
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoSuggestions, setGeoSuggestions] = useState<string[]>([]);
  const [showGeoDropdown, setShowGeoDropdown] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({ status: 'idle' });
  const [validating, setValidating] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saveLabel, setSaveLabel] = useState<'Дом' | 'Работа' | 'Другое'>('Дом');
  const [savingAddress, setSavingAddress] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedValue = useDebounce(value, 300);

  const favorites = user?.addresses || [];
  const isInFavorites = favorites.some(
    a => a.street.toLowerCase() === value.toLowerCase() || value.includes(a.street)
  );

  // ─── а) Автодополнение из истории (debounce 300ms) ────────
  useEffect(() => {
    if (!focused || debouncedValue.length < 2) { setSuggestions([]); return; }
    // В реальном проекте: GET /api/address-history?q=...&userId=...
    // Фильтр по началу строки (не по вхождению)
    const q = debouncedValue.toLowerCase();
    const historyAddrs = [
      ...MOCK_HISTORY,
      ...favorites.map(a => `${a.city}, ${a.street}, д. ${a.house}${a.apartment ? `, кв. ${a.apartment}` : ''}`),
    ];
    const matched = historyAddrs
      .filter((addr, i, arr) => arr.indexOf(addr) === i) // уникальные
      .filter(addr => addr.toLowerCase().startsWith(q) || addr.toLowerCase().includes(q))
      .slice(0, 5);
    setSuggestions(matched);
  }, [debouncedValue, focused, favorites]);

  // ─── г) Валидация DaData (debounce 300ms) ─────────────────
  useEffect(() => {
    if (debouncedValue.length < 5) { setValidation({ status: 'idle' }); return; }
    setValidating(true);
    validateAddressDaData(debouncedValue).then(result => {
      setValidation(result);
      setValidating(false);
      // Если адрес валидный и не в истории — предложить сохранить
      if (result.status === 'valid' && user && !isInFavorites && !showSavePrompt) {
        const isNew = !MOCK_HISTORY.some(h => h.toLowerCase().startsWith(debouncedValue.toLowerCase().slice(0, 10)));
        if (isNew) setShowSavePrompt(true);
      }
    });
  }, [debouncedValue]);

  // Закрыть при клике вне
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
        setShowGeoDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── б) Геолокация ────────────────────────────────────────
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Геолокация недоступна в вашем браузере');
      return;
    }
    setGeoLoading(true);
    setGeoSuggestions([]);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const results = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setGeoSuggestions(results);
        setShowGeoDropdown(true);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        // Если нет разрешения — показать заглушку
        const fallback = [
          'Москва, ул. Тверская, д. 15',
          'Москва, Охотный ряд, д. 1',
        ];
        setGeoSuggestions(fallback);
        setShowGeoDropdown(true);
        console.warn('Geo error:', err.message);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  const selectSuggestion = (addr: string) => {
    onChange(addr);
    setSuggestions([]);
    setShowGeoDropdown(false);
    setFocused(false);
    inputRef.current?.blur();
  };

  // ─── в) Сохранить в избранное ─────────────────────────────
  const handleSaveAddress = () => {
    if (!user || !value.trim()) return;
    setSavingAddress(true);
    // Парсим адрес (упрощённо)
    const parts = value.split(',').map(p => p.trim());
    const city = parts[0] || 'Москва';
    const street = parts[1] || value;
    const houseMatch = value.match(/д\.\s*(\S+)/i);
    const aptMatch = value.match(/кв\.\s*(\d+)/i);
    const newAddr: DeliveryAddress = {
      id: Date.now(),
      label: saveLabel,
      city,
      street,
      house: houseMatch?.[1] || '?',
      apartment: aptMatch?.[1],
      isDefault: favorites.length === 0,
    };
    addAddress(user.id, newAddr);
    setTimeout(() => {
      setSavingAddress(false);
      setShowSavePrompt(false);
    }, 500);
  };

  // Цвет рамки по статусу валидации
  const borderClass =
    validation.status === 'valid' ? 'border-green-500 focus:border-green-500' :
    validation.status === 'invalid' ? 'border-red-400 focus:border-red-400' :
    validation.status === 'warning' ? 'border-amber-400 focus:border-amber-400' :
    'border-zinc-200 dark:border-zinc-700 focus:border-orange-500';

  const showDropdown = focused && (suggestions.length > 0 || showGeoDropdown);

  return (
    <div ref={containerRef} className={`relative ${className}`}>

      {/* ── в) Избранные адреса (список карточек) ── */}
      {showFavorites && favorites.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-zinc-500 font-medium mb-1.5">⭐ Избранные адреса</p>
          <div className="flex flex-col gap-1.5">
            {favorites.map(addr => {
              const full = `${addr.city}, ${addr.street}, д. ${addr.house}${addr.apartment ? `, кв. ${addr.apartment}` : ''}`;
              const isSelected = value === full || value.includes(addr.street);
              return (
                <button key={addr.id} type="button" onClick={() => onChange(full)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all border-2 w-full ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${isSelected ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                    {addr.label === 'Дом' ? '🏠' : addr.label === 'Работа' ? '💼' : '📍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-white text-xs flex items-center gap-1">
                      {addr.label}
                      {addr.isDefault && <span className="text-[9px] bg-orange-200 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-1 rounded">По умолчанию</span>}
                    </p>
                    <p className="text-zinc-500 text-xs truncate">{full}</p>
                  </div>
                  {isSelected && <Check size={16} className="text-orange-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Управление избранными адресами (для личного кабинета) */}
          {!compact && user && (
            <FavoriteAddressManager user={user} onSelect={(full) => onChange(full)} />
          )}

          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
            <span className="text-[10px] text-zinc-400">или введите новый</span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      )}

      {/* ── Поле ввода ── */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
          <MapPin size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setShowSavePrompt(false); }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          className={`w-full pl-9 pr-24 py-3 rounded-2xl border-2 text-sm text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 outline-none transition-all placeholder:text-zinc-400 ${borderClass}`}
        />

        {/* Кнопка геолокации */}
        <button type="button" onClick={handleGeolocate} disabled={geoLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-semibold px-2.5 py-1.5 rounded-xl transition disabled:opacity-60"
          title="Определить адрес по геолокации">
          {geoLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
          {!compact && <span>GPS</span>}
        </button>
      </div>

      {/* ── Статус валидации (DaData) ── */}
      {value.length > 4 && (
        <div className={`flex items-center gap-1.5 mt-1 px-1 text-xs transition-all ${
          validating ? 'text-zinc-400' :
          validation.status === 'valid' ? 'text-green-600 dark:text-green-400' :
          validation.status === 'invalid' ? 'text-red-500' :
          validation.status === 'warning' ? 'text-amber-500' : 'text-zinc-400'
        }`}>
          {validating && <Loader2 size={11} className="animate-spin" />}
          {!validating && validation.status === 'valid' && <Check size={11} />}
          {!validating && validation.status === 'invalid' && <X size={11} />}
          {!validating && validation.status === 'warning' && <span>⚠️</span>}
          {validating ? 'Проверка адреса...' : validation.message}
          {!validating && validation.status === 'valid' && validation.normalized && validation.normalized !== value && (
            <button type="button" onClick={() => onChange(validation.normalized!)}
              className="ml-1 underline text-green-600 dark:text-green-400 hover:no-underline">
              Стандартизировать
            </button>
          )}
        </div>
      )}

      {/* ── Выпадающий список (история + гео) ── */}
      {showDropdown && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          style={{ animation: 'slideDownFade 0.15s ease-out' }}>
          {/* История */}
          {suggestions.length > 0 && (
            <>
              <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
                <Clock size={11} className="text-zinc-400" />
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">История</span>
              </div>
              {suggestions.map((s, i) => (
                <button key={i} type="button" onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-3 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition flex items-center gap-2.5 border-t border-zinc-100 dark:border-zinc-800 first:border-0">
                  <MapPin size={13} className="text-zinc-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate">{s}</span>
                </button>
              ))}
            </>
          )}

          {/* Геолокация */}
          {showGeoDropdown && geoSuggestions.length > 0 && (
            <>
              <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5 border-t border-zinc-100 dark:border-zinc-800">
                <Navigation size={11} className="text-blue-500" />
                <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">Рядом с вами</span>
              </div>
              {geoSuggestions.map((s, i) => (
                <button key={i} type="button" onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition flex items-center gap-2.5 border-t border-zinc-100 dark:border-zinc-800">
                  <Navigation size={13} className="text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate">{s}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── в) Предложение сохранить новый адрес ── */}
      {showSavePrompt && user && !isInFavorites && !compact && (
        <div className="mt-2 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-2xl p-3"
          style={{ animation: 'slideDownFade 0.2s ease-out' }}>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
            ⭐ Сохранить этот адрес?
          </p>
          <p className="text-xs text-zinc-500 mb-2 truncate">{value}</p>
          <div className="flex gap-1.5 mb-2">
            {(['Дом', 'Работа', 'Другое'] as const).map(l => (
              <button key={l} type="button" onClick={() => setSaveLabel(l)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${saveLabel === l ? 'bg-orange-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700'}`}>
                {l === 'Дом' ? '🏠' : l === 'Работа' ? '💼' : '📍'} {l}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveAddress} disabled={savingAddress}
              className="flex-1 bg-orange-500 text-white text-xs font-semibold py-2 rounded-xl hover:bg-orange-600 transition disabled:opacity-60 flex items-center justify-center gap-1">
              {savingAddress ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
              {savingAddress ? 'Сохраняем...' : 'Добавить в избранное'}
            </button>
            <button type="button" onClick={() => setShowSavePrompt(false)}
              className="px-3 py-2 text-zinc-400 hover:text-zinc-600 text-xs transition">
              Нет
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Менеджер избранных адресов (Личный кабинет) ────────────
export function FavoriteAddressManager({ user, onSelect }: {
  user: RegisteredUser;
  onSelect?: (full: string) => void;
}) {
  const { addAddress, updateAddress, deleteAddress } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    label: 'Дом' as 'Дом' | 'Работа' | 'Другое',
    city: 'Москва', street: '', house: '', apartment: '', entrance: '', floor: '', intercom: '',
  });
  const [addrInput, setAddrInput] = useState('');

  const favorites = user.addresses || [];

  const handleAdd = () => {
    if (!form.street || !form.house) return;
    addAddress(user.id, {
      id: Date.now(),
      label: form.label,
      city: form.city,
      street: form.street,
      house: form.house,
      apartment: form.apartment || undefined,
      entrance: form.entrance || undefined,
      floor: form.floor || undefined,
      intercom: form.intercom || undefined,
      isDefault: favorites.length === 0,
    });
    setShowAddForm(false);
    setForm({ label: 'Дом', city: 'Москва', street: '', house: '', apartment: '', entrance: '', floor: '', intercom: '' });
  };

  const setDefault = (id: number) => {
    favorites.forEach(a => updateAddress(user.id, a.id, { isDefault: a.id === id }));
  };

  if (favorites.length === 0 && !showAddForm) return (
    <button type="button" onClick={() => setShowAddForm(true)}
      className="mt-1 text-xs text-orange-500 font-medium hover:text-orange-600 transition">
      + Добавить адрес
    </button>
  );

  return (
    <div className="mt-2 space-y-1">
      {favorites.map(addr => {
        const full = `${addr.city}, ${addr.street}, д. ${addr.house}${addr.apartment ? `, кв. ${addr.apartment}` : ''}`;
        return (
          <div key={addr.id} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2 group">
            <span className="text-base">{addr.label === 'Дом' ? '🏠' : addr.label === 'Работа' ? '💼' : '📍'}</span>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect?.(full)}>
              <p className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1">
                {addr.label}
                {addr.isDefault && <span className="text-[8px] bg-orange-200 text-orange-700 px-1 rounded">DEFAULT</span>}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">{full}</p>
              {(addr.entrance || addr.floor) && (
                <p className="text-[10px] text-zinc-400">{[addr.entrance && `Подъезд ${addr.entrance}`, addr.floor && `Этаж ${addr.floor}`, addr.intercom && `Домофон ${addr.intercom}`].filter(Boolean).join(' · ')}</p>
              )}
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
              {!addr.isDefault && (
                <button type="button" onClick={() => setDefault(addr.id)} title="Сделать основным"
                  className="p-1.5 text-zinc-400 hover:text-amber-500 transition"><Star size={13} /></button>
              )}
              <button type="button" onClick={() => deleteAddress(user.id, addr.id)} title="Удалить"
                className="p-1.5 text-zinc-400 hover:text-red-500 transition"><X size={13} /></button>
            </div>
          </div>
        );
      })}

      <button type="button" onClick={() => setShowAddForm(!showAddForm)}
        className="text-xs text-orange-500 font-medium hover:text-orange-600 transition pl-1">
        {showAddForm ? '✕ Закрыть' : '+ Добавить адрес'}
      </button>

      {showAddForm && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 space-y-2"
          style={{ animation: 'slideDownFade 0.15s ease-out' }}>
          {/* Умное поле для нового адреса (использует сам AddressInput) */}
          <AddressInput
            value={addrInput}
            onChange={(v) => {
              setAddrInput(v);
              const parts = v.split(',').map(p => p.trim());
              if (parts.length >= 2) {
                setForm(prev => ({
                  ...prev,
                  city: parts[0] || prev.city,
                  street: parts[1] || prev.street,
                }));
                const hm = v.match(/д\.\s*(\S+)/i);
                const am = v.match(/кв\.\s*(\d+)/i);
                if (hm) setForm(prev => ({ ...prev, house: hm[1] }));
                if (am) setForm(prev => ({ ...prev, apartment: am[1] }));
              }
            }}
            user={user}
            compact
            showFavorites={false}
            placeholder="Введите адрес"
          />
          <div className="flex gap-1.5">
            {(['Дом', 'Работа', 'Другое'] as const).map(l => (
              <button key={l} type="button" onClick={() => setForm(p => ({ ...p, label: l }))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${form.label === l ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                {l === 'Дом' ? '🏠' : l === 'Работа' ? '💼' : '📍'} {l}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ['Улица *', 'street'], ['Дом *', 'house'],
              ['Квартира', 'apartment'], ['Подъезд', 'entrance'],
              ['Этаж', 'floor'], ['Домофон', 'intercom'],
            ].map(([label, key]) => (
              <div key={key as string}>
                <label className="text-[10px] text-zinc-400 block mb-0.5">{label as string}</label>
                <input
                  value={(form as any)[key as string]}
                  onChange={e => setForm(p => ({ ...p, [key as string]: e.target.value }))}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-white outline-none border border-transparent focus:border-orange-400" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} disabled={!form.street || !form.house}
              className="flex-1 bg-orange-500 text-white text-xs font-semibold py-2 rounded-xl hover:bg-orange-600 transition disabled:opacity-40">
              Сохранить адрес
            </button>
            <button type="button" onClick={() => { setShowAddForm(false); setAddrInput(''); }}
              className="px-3 text-xs text-zinc-400 hover:text-zinc-600 transition">
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
