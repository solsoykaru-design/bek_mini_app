import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context';
import type { DeliveryAddress } from '../context';
import {
  Phone, User, Calendar, MapPin, Home, Plus, Trash2,
  ChevronLeft, ChevronRight, Check, Shield, Clock
} from 'lucide-react';

// ============================================================
//  Многошаговая регистрация с верификацией по SMS
//  Шаг 1: Ввод номера телефона
//  Шаг 2: Ввод кода из SMS (симуляция)
//  Шаг 3: Личные данные (имя, дата рождения, email)
//  Шаг 4: Адрес доставки
//  Шаг 5: Готово — сводка
// ============================================================

type Step = 'phone' | 'code' | 'profile' | 'address' | 'done';

interface Props {
  onClose: () => void;
}

export default function RegisterPage({ onClose }: Props) {
  const { registerUser, addAddress, registeredUsers, addNotification } = useApp();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [codeError, setCodeError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [sentCode] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [email, setEmail] = useState('');
  const [profileError, setProfileError] = useState('');
  const [, setNewUserId] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const codeRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Таймер обратного отсчёта
  useEffect(() => {
    if (step !== 'code') return;
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { setCanResend(true); clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  // ── Шаг 1: Телефон ──────────────────────────────────────
  const handlePhoneNext = () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) { setPhoneError('Введите корректный номер телефона'); return; }
    // Проверка дубликата
    const exists = registeredUsers.find(u => u.phone.replace(/\D/g,'') === cleaned);
    if (exists) { setPhoneError('Этот номер уже зарегистрирован'); return; }
    setPhoneError('');
    setStep('code');
    setCountdown(60);
    setCanResend(false);
    console.log(`[SMS] Код для ${phone}: ${sentCode}`); // В реальном проекте — через SMS API
  };

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 1) return `+7`;
    if (d.length <= 4) return `+7 (${d.slice(1)}`;
    if (d.length <= 7) return `+7 (${d.slice(1,4)}) ${d.slice(4)}`;
    if (d.length <= 9) return `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
    return `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,9)}-${d.slice(9,11)}`;
  };

  // ── Шаг 2: SMS-код ──────────────────────────────────────
  const handleCodeChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code]; next[i] = val.slice(-1); setCode(next);
    setCodeError('');
    if (val && i < 3) codeRefs[i + 1].current?.focus();
    if (!val && i > 0) codeRefs[i - 1].current?.focus();
  };
  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0, 4);
    if (pasted.length === 4) {
      setCode(pasted.split(''));
      codeRefs[3].current?.focus();
    }
    e.preventDefault();
  };
  const handleCodeVerify = () => {
    const entered = code.join('');
    // В демо: принимаем любой 4-значный код ИЛИ правильный sentCode
    if (entered.length !== 4) { setCodeError('Введите 4-значный код'); return; }
    if (entered !== sentCode && entered !== '1234') {
      setCodeError(`Неверный код. Подсказка для демо: ${sentCode}`);
      return;
    }
    setCodeError('');
    setStep('profile');
  };

  // ── Шаг 3: Профиль ──────────────────────────────────────
  const handleProfileNext = () => {
    if (!name.trim()) { setProfileError('Введите ваше имя'); return; }
    setProfileError('');
    setStep('address');
  };

  // ── Шаг 4: Адрес ────────────────────────────────────────
  const handleFinish = () => {
    // Регистрируем пользователя
    registerUser(name.trim(), phone, 'mobile_app');
    const newUser = registeredUsers[0]; // только что добавленный (самый первый)
    if (newUser) {
      setNewUserId(newUser.id);
      addresses.forEach(addr => addAddress(newUser.id, addr));
    }
    addNotification({
      type: 'client',
      title: '👤 Новый клиент',
      body: `${name.trim()} зарегистрировался через Мобильное приложение`,
      link: 'dashboard',
    });
    setStep('done');
  };

  const addLocalAddress = (addr: DeliveryAddress) => {
    setAddresses(prev => [...prev, addr]);
    setShowAddressForm(false);
  };

  const removeLocalAddress = (id: number) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  // ── Прогресс ─────────────────────────────────────────────
  const steps: { id: Step; label: string }[] = [
    { id: 'phone', label: 'Телефон' },
    { id: 'code', label: 'SMS-код' },
    { id: 'profile', label: 'Профиль' },
    { id: 'address', label: 'Адрес' },
    { id: 'done', label: 'Готово' },
  ];
  const stepIdx = steps.findIndex(s => s.id === step);

  return (
    <div className="fixed inset-0 z-[300] bg-white dark:bg-zinc-950 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step !== 'done' && step !== 'phone' && (
            <button onClick={() => {
              if (step === 'code') setStep('phone');
              else if (step === 'profile') setStep('code');
              else if (step === 'address') setStep('profile');
            }} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition">
              <ChevronLeft size={22} />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-base font-bold text-zinc-900 dark:text-white">Регистрация</h1>
            <p className="text-xs text-zinc-500">{steps[stepIdx]?.label} · Шаг {stepIdx + 1} из {steps.length}</p>
          </div>
          {step !== 'done' && (
            <button onClick={onClose} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition px-2 py-1">
              Отмена
            </button>
          )}
        </div>
        {/* Прогрессбар */}
        <div className="max-w-lg mx-auto mt-2 flex gap-1">
          {steps.map((s, i) => (
            <div key={s.id} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= stepIdx ? 'bg-orange-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-5">

        {/* ════ ШАГ 1: ТЕЛЕФОН ════ */}
        {step === 'phone' && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">📱</div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Введите номер телефона</h2>
              <p className="text-sm text-zinc-500 mt-1">Мы отправим SMS с кодом подтверждения</p>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">Номер телефона *</label>
              <div className={`flex items-center gap-3 rounded-2xl border-2 transition-all px-4 py-3.5 ${phoneError ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700 focus-within:border-orange-500'} bg-white dark:bg-zinc-900`}>
                <Phone size={20} className="text-zinc-400 flex-shrink-0" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(formatPhone(e.target.value)); setPhoneError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handlePhoneNext()}
                  placeholder="+7 (999) 000-00-00"
                  className="flex-1 bg-transparent text-lg text-zinc-900 dark:text-white outline-none font-mono"
                  autoFocus
                />
              </div>
              {phoneError && <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">⚠️ {phoneError}</p>}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 flex gap-3">
              <Shield size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-semibold">Безопасно</p>
                <p className="text-xs mt-0.5">Номер будет верифицирован. Используется только для входа и уведомлений.</p>
              </div>
            </div>

            <button onClick={handlePhoneNext} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              Получить SMS-код <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* ════ ШАГ 2: SMS-КОД ════ */}
        {step === 'code' && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">💬</div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Введите код из SMS</h2>
              <p className="text-sm text-zinc-500 mt-1">Отправили код на номер</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">{phone}</p>
            </div>

            {/* 4 поля для кода */}
            <div className="flex gap-3 justify-center">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={codeRefs[i]}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !code[i] && i > 0) codeRefs[i-1].current?.focus();
                  }}
                  onPaste={i === 0 ? handleCodePaste : undefined}
                  autoFocus={i === 0}
                  className={`w-16 h-16 text-center text-2xl font-bold rounded-2xl border-2 transition-all outline-none
                    ${codeError ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : digit ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white'}
                    focus:border-orange-500`}
                />
              ))}
            </div>
            {codeError && <p className="text-red-500 text-sm text-center">⚠️ {codeError}</p>}

            {/* Таймер / Повторная отправка */}
            <div className="text-center">
              {!canResend ? (
                <p className="text-sm text-zinc-500 flex items-center justify-center gap-1.5">
                  <Clock size={14} /> Повторить через {countdown} сек.
                </p>
              ) : (
                <button onClick={() => { setCountdown(60); setCanResend(false); setCode(['','','','']); console.log(`[SMS] Новый код: ${sentCode}`); }}
                  className="text-sm text-orange-500 font-medium hover:text-orange-600 transition">
                  Отправить код повторно
                </button>
              )}
            </div>

            {/* Подсказка для демо */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex gap-2 text-sm text-amber-700 dark:text-amber-300">
              <span>💡</span>
              <span>Демо-режим: используйте код <strong className="font-mono">{sentCode}</strong> или <strong className="font-mono">1234</strong></span>
            </div>

            <button
              onClick={handleCodeVerify}
              disabled={code.join('').length !== 4}
              className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/25 disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Подтвердить <Check size={20} />
            </button>
          </div>
        )}

        {/* ════ ШАГ 3: ЛИЧНЫЕ ДАННЫЕ ════ */}
        {step === 'profile' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-2">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">👤</div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Ваши данные</h2>
              <p className="text-sm text-zinc-500 mt-1">Заполните профиль для удобных заказов</p>
            </div>

            {/* Имя */}
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">Ваше имя *</label>
              <div className={`flex items-center gap-3 rounded-2xl border-2 transition-all px-4 py-3.5 ${profileError && !name ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700 focus-within:border-orange-500'} bg-white dark:bg-zinc-900`}>
                <User size={18} className="text-zinc-400 flex-shrink-0" />
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setProfileError(''); }}
                  placeholder="Как вас зовут?"
                  className="flex-1 bg-transparent text-base text-zinc-900 dark:text-white outline-none"
                  autoFocus
                />
              </div>
              {profileError && <p className="text-red-500 text-sm mt-1">⚠️ {profileError}</p>}
            </div>

            {/* Дата рождения */}
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
                Дата рождения <span className="text-zinc-400 font-normal">(для подарков в ДР 🎂)</span>
              </label>
              <div className="flex items-center gap-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 focus-within:border-orange-500 transition-all px-4 py-3.5 bg-white dark:bg-zinc-900">
                <Calendar size={18} className="text-zinc-400 flex-shrink-0" />
                <input
                  type="date"
                  value={birthday}
                  onChange={e => setBirthday(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="flex-1 bg-transparent text-base text-zinc-900 dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
                Email <span className="text-zinc-400 font-normal">(для чеков и акций)</span>
              </label>
              <div className="flex items-center gap-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 focus-within:border-orange-500 transition-all px-4 py-3.5 bg-white dark:bg-zinc-900">
                <span className="text-zinc-400 text-base">@</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@mail.ru"
                  className="flex-1 bg-transparent text-base text-zinc-900 dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Телефон (readonly) */}
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <Phone size={18} className="text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-zinc-400">Телефон (подтверждён)</p>
                <p className="text-base font-semibold text-zinc-900 dark:text-white">{phone}</p>
              </div>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">✓ SMS</span>
            </div>

            <button onClick={handleProfileNext} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              Далее — Адрес доставки <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* ════ ШАГ 4: АДРЕСА ════ */}
        {step === 'address' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-2">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">📍</div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Адрес доставки</h2>
              <p className="text-sm text-zinc-500 mt-1">Добавьте адреса для быстрого оформления заказов</p>
            </div>

            {/* Список добавленных адресов */}
            {addresses.map(addr => (
              <div key={addr.id} className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${addr.isDefault ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                  {addr.label === 'Дом' ? '🏠' : addr.label === 'Работа' ? '💼' : '📍'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-white">{addr.label}</span>
                    {addr.isDefault && <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">Основной</span>}
                  </div>
                  <p className="text-sm text-zinc-500">{addr.street}, д.{addr.house}{addr.apartment ? `, кв.${addr.apartment}` : ''}</p>
                  {(addr.entrance || addr.floor || addr.intercom) && (
                    <p className="text-xs text-zinc-400">{[addr.entrance && `Подъезд ${addr.entrance}`, addr.floor && `Этаж ${addr.floor}`, addr.intercom && `Домофон ${addr.intercom}`].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
                <button onClick={() => removeLocalAddress(addr.id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            {/* Форма добавления адреса */}
            {showAddressForm ? (
              <AddressForm
                onSave={addLocalAddress}
                onCancel={() => setShowAddressForm(false)}
                isFirst={addresses.length === 0}
              />
            ) : (
              <button onClick={() => setShowAddressForm(true)}
                className="w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl py-4 text-sm font-medium text-zinc-500 hover:border-orange-400 hover:text-orange-500 transition flex items-center justify-center gap-2">
                <Plus size={18} /> Добавить адрес доставки
              </button>
            )}

            <div className="flex gap-3">
              {addresses.length === 0 && (
                <button onClick={() => setStep('done') ?? handleFinish()}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                  Пропустить
                </button>
              )}
              <button
                onClick={handleFinish}
                disabled={showAddressForm}
                className="flex-1 bg-orange-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {addresses.length > 0 ? <>Завершить регистрацию <Check size={20} /></> : 'Зарегистрироваться'}
              </button>
            </div>
          </div>
        )}

        {/* ════ ШАГ 5: ГОТОВО ════ */}
        {step === 'done' && (
          <div className="space-y-5 text-center animate-fade-in">
            <div className="pt-6">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-lg">
                🎉
              </div>
              <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-2">Добро пожаловать!</h2>
              <p className="text-zinc-500 text-sm">Вы успешно зарегистрированы в FoodChain</p>
            </div>

            {/* Сводка */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 text-left">
              <div className="flex items-center gap-3 px-4 py-3">
                <User size={16} className="text-zinc-400" />
                <div><p className="text-xs text-zinc-400">Имя</p><p className="text-sm font-semibold text-zinc-900 dark:text-white">{name}</p></div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <Phone size={16} className="text-green-500" />
                <div><p className="text-xs text-zinc-400">Телефон (подтверждён ✓)</p><p className="text-sm font-semibold text-zinc-900 dark:text-white">{phone}</p></div>
              </div>
              {birthday && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Calendar size={16} className="text-zinc-400" />
                  <div><p className="text-xs text-zinc-400">Дата рождения</p><p className="text-sm font-semibold text-zinc-900 dark:text-white">{new Date(birthday).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })}</p></div>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-zinc-400 text-base w-4 text-center">@</span>
                  <div><p className="text-xs text-zinc-400">Email</p><p className="text-sm font-semibold text-zinc-900 dark:text-white">{email}</p></div>
                </div>
              )}
              {addresses.length > 0 && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <MapPin size={16} className="text-zinc-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-400">Адреса доставки</p>
                    {addresses.map(a => <p key={a.id} className="text-sm font-semibold text-zinc-900 dark:text-white">{a.label}: {a.street}, {a.house}</p>)}
                  </div>
                </div>
              )}
            </div>

            {/* Бонус за регистрацию */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white text-left">
              <p className="font-bold">🎁 Подарок за регистрацию</p>
              <p className="text-white/80 text-sm mt-0.5">На ваш счёт начислено <strong>200 бонусных рублей</strong></p>
              <p className="text-xs text-white/60 mt-1">Используйте при следующем заказе</p>
            </div>

            <button onClick={onClose} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all">
              Перейти в приложение →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  Форма добавления адреса
// ============================================================
function AddressForm({ onSave, onCancel, isFirst }: {
  onSave: (addr: DeliveryAddress) => void;
  onCancel: () => void;
  isFirst: boolean;
}) {
  const [label, setLabel] = useState<'Дом' | 'Работа' | 'Другое'>('Дом');
  const [city, setCity] = useState('Москва');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [apartment, setApartment] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [intercom, setIntercom] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!street.trim()) { setError('Введите улицу'); return; }
    if (!house.trim()) { setError('Введите номер дома'); return; }
    onSave({
      id: Date.now(),
      label, city, street: street.trim(), house: house.trim(),
      apartment: apartment.trim() || undefined,
      entrance: entrance.trim() || undefined,
      floor: floor.trim() || undefined,
      intercom: intercom.trim() || undefined,
      comment: comment.trim() || undefined,
      isDefault: isFirst,
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-orange-300 dark:border-orange-900/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Home size={18} className="text-orange-500" /> Новый адрес
        </h3>
        {isFirst && <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">Основной</span>}
      </div>

      {/* Тип */}
      <div className="flex gap-2">
        {(['Дом', 'Работа', 'Другое'] as const).map(l => (
          <button key={l} onClick={() => setLabel(l)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${label === l ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
            {l === 'Дом' ? '🏠' : l === 'Работа' ? '💼' : '📍'} {l}
          </button>
        ))}
      </div>

      {/* Город */}
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Город</label>
        <input value={city} onChange={e => setCity(e.target.value)}
          className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-400 transition" />
      </div>

      {/* Улица + Дом */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="text-xs text-zinc-500 mb-1 block">Улица *</label>
          <input value={street} onChange={e => { setStreet(e.target.value); setError(''); }}
            placeholder="ул. Пушкина"
            className={`w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-400 transition ${error && !street ? 'ring-2 ring-red-400' : ''}`} />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Дом *</label>
          <input value={house} onChange={e => { setHouse(e.target.value); setError(''); }}
            placeholder="10А"
            className={`w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-400 transition ${error && !house ? 'ring-2 ring-red-400' : ''}`} />
        </div>
      </div>

      {/* Кв / Подъезд / Этаж / Домофон */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Квартира</label>
          <input value={apartment} onChange={e => setApartment(e.target.value)} placeholder="15"
            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-400 transition" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Подъезд</label>
          <input value={entrance} onChange={e => setEntrance(e.target.value)} placeholder="2"
            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-400 transition" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Этаж</label>
          <input value={floor} onChange={e => setFloor(e.target.value)} placeholder="7"
            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-400 transition" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Домофон</label>
          <input value={intercom} onChange={e => setIntercom(e.target.value)} placeholder="1588К"
            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-400 transition" />
        </div>
      </div>

      {/* Комментарий */}
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Комментарий курьеру</label>
        <input value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Звоните, не стучите"
          className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-400 transition" />
      </div>

      {error && <p className="text-red-500 text-sm">⚠️ {error}</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} className="flex-1 bg-orange-500 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-orange-600 transition">
          ✓ Сохранить адрес
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 text-zinc-500 text-sm hover:text-zinc-700 dark:hover:text-zinc-300 transition">
          Отмена
        </button>
      </div>
    </div>
  );
}
