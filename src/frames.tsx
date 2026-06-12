import { ReactNode, useEffect, useState } from 'react';
import { Wifi, Battery, Signal, Search, Volume2, ChevronUp, Smartphone, X, Square, Minus } from 'lucide-react';

// ============================================================
//  РАМКИ УСТРОЙСТВ:
//  - PhoneFrame  : iPhone (Dynamic Island) / Android (punch-hole)
//  - WindowsFrame: окно Windows 11 с панелью задач
//  Трюк: transform: translateZ(0) на контейнере экрана делает
//  position:fixed внутри него относительным к рамке устройства.
// ============================================================

// ===================== ТЕЛЕФОН =====================
export function PhoneFrame({ platform, children }: { platform: 'ios' | 'android'; children: ReactNode }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const timeStr = time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const ios = platform === 'ios';

  return (
    <div
      className={`relative bg-zinc-900 ${ios ? 'rounded-[58px]' : 'rounded-[34px]'} shadow-[0_30px_90px_rgba(0,0,0,0.7)] ring-1 ring-zinc-600/50 flex-shrink-0`}
      style={{ width: 393, height: 832, padding: 10 }}
    >
      {/* Кнопки на корпусе */}
      {ios ? (
        <>
          {/* Кнопка действия + громкость слева */}
          <div className="absolute -left-[3px] top-[180px] w-[3px] h-8 bg-zinc-700 rounded-l-md" />
          <div className="absolute -left-[3px] top-[230px] w-[3px] h-14 bg-zinc-700 rounded-l-md" />
          <div className="absolute -left-[3px] top-[295px] w-[3px] h-14 bg-zinc-700 rounded-l-md" />
          {/* Кнопка питания справа */}
          <div className="absolute -right-[3px] top-[230px] w-[3px] h-20 bg-zinc-700 rounded-r-md" />
        </>
      ) : (
        <>
          {/* Громкость + питание справа (Android) */}
          <div className="absolute -right-[3px] top-[180px] w-[3px] h-16 bg-zinc-700 rounded-r-md" />
          <div className="absolute -right-[3px] top-[260px] w-[3px] h-10 bg-zinc-700 rounded-r-md" />
        </>
      )}

      {/* ЭКРАН (transform для содержания fixed-элементов) */}
      <div
        className={`relative w-full h-full overflow-hidden ${ios ? 'rounded-[48px]' : 'rounded-[26px]'} bg-zinc-950`}
        style={{ transform: 'translateZ(0)' }}
      >
        {/* Статус-бар */}
        <div className="absolute top-0 left-0 right-0 z-[200] pointer-events-none">
          {ios ? (
            <div className="relative flex items-start justify-between px-8 pt-3.5 text-white">
              <span className="text-[15px] font-semibold w-14 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{timeStr}</span>
              {/* Dynamic Island */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[11px] w-[122px] h-[35px] bg-black rounded-full flex items-center justify-end pr-3">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 ring-1 ring-zinc-700" />
              </div>
              <div className="flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                <Signal size={15} strokeWidth={2.5} />
                <Wifi size={15} strokeWidth={2.5} />
                <Battery size={20} strokeWidth={2} fill="white" />
              </div>
            </div>
          ) : (
            <div className="relative flex items-start justify-between px-6 pt-2.5 text-white">
              <span className="text-[13px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{timeStr}</span>
              {/* Punch-hole камера */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[10px] w-[12px] h-[12px] bg-black rounded-full ring-2 ring-zinc-800" />
              <div className="flex items-center gap-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                <Wifi size={13} strokeWidth={2.5} />
                <Signal size={13} strokeWidth={2.5} />
                <span className="text-[11px] font-medium">87%</span>
                <Battery size={16} strokeWidth={2} fill="white" />
              </div>
            </div>
          )}
        </div>

        {/* Контент приложения */}
        <div className="h-full overflow-y-auto scrollbar-hide">{children}</div>

        {/* Нижняя панель */}
        {ios ? (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-[200] w-[135px] h-[5px] bg-white/90 rounded-full pointer-events-none" />
        ) : (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-[200] w-[110px] h-[4px] bg-white/60 rounded-full pointer-events-none" />
        )}
      </div>
    </div>
  );
}

// ===================== ОКНО WINDOWS 11 =====================
export function WindowsFrame({ title, onClose, onOpenPhone, onOpenCourier, children }: {
  title: string;
  onClose: () => void;
  onOpenPhone: () => void;
  onOpenCourier?: () => void;
  children: ReactNode;
}) {
  const [maximized, setMaximized] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const timeStr = time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      {/* === Обои Windows 11 === */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-300/10 rounded-full blur-[130px] rotate-12" />
      </div>

      {/* === Ярлыки на рабочем столе === */}
      <div className="absolute top-6 left-6 flex flex-col gap-5">
        <button onDoubleClick={() => setMinimized(false)} className="flex flex-col items-center gap-1 w-20 group">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition">F</div>
          <span className="text-white text-[11px] text-center drop-shadow-md leading-tight">FoodChain<br/>Admin</span>
        </button>
        <button onDoubleClick={onOpenPhone} className="flex flex-col items-center gap-1 w-20 group">
          <div className="w-12 h-12 bg-zinc-800/80 backdrop-blur rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition">
            <Smartphone size={24} className="text-white" />
          </div>
          <span className="text-white text-[11px] text-center drop-shadow-md leading-tight">Гостевое<br/>приложение</span>
        </button>
      </div>

      {/* === ОКНО ПРИЛОЖЕНИЯ === */}
      {!minimized && (
        <div className={`absolute flex flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950 transition-all duration-200 ${
          maximized
            ? 'inset-0 bottom-12'
            : 'top-[5%] left-[6%] right-[6%] bottom-[calc(48px+5%)] rounded-xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/20'
        }`}>
          {/* Заголовок окна */}
          <div
            onDoubleClick={() => setMaximized(m => !m)}
            className="h-10 flex items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0"
          >
            <div className="flex items-center gap-2.5 px-3.5">
              <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-md flex items-center justify-center text-white font-bold text-[11px]">F</div>
              <span className="text-[12.5px] text-zinc-700 dark:text-zinc-300 font-medium">{title}</span>
            </div>
            <div className="flex-1" />
            {/* Кнопки управления окном (Windows 11) */}
            <div className="flex h-full">
              <button onClick={() => setMinimized(true)} title="Свернуть"
                className="w-12 h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <Minus size={15} />
              </button>
              <button onClick={() => setMaximized(m => !m)} title={maximized ? 'Восстановить' : 'Развернуть'}
                className="w-12 h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <Square size={11} strokeWidth={2.5} />
              </button>
              <button onClick={onClose} title="Закрыть"
                className="w-12 h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-red-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Меню приложения */}
          <div className="h-7 flex items-center gap-0.5 px-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
            {['Файл', 'Правка', 'Вид', 'Отчёты', 'Сервис', 'Справка'].map(m => (
              <button key={m} className="px-2.5 py-0.5 text-[11.5px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
                {m}
              </button>
            ))}
          </div>

          {/* Содержимое окна (transform для fixed-элементов админки) */}
          <div className="relative flex-1 min-h-0" style={{ transform: 'translateZ(0)' }}>
            <div className="h-full overflow-y-auto custom-scrollbar">{children}</div>
          </div>

          {/* Строка состояния */}
          <div className="h-6 flex items-center gap-4 px-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex-shrink-0">
            <span>Готово</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Подключено к серверу</span>
            <span>Филиал: FoodChain Центр</span>
            <span className="ml-auto">v1.0.0</span>
          </div>
        </div>
      )}

      {/* === ПАНЕЛЬ ЗАДАЧ === */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-zinc-900/70 backdrop-blur-2xl border-t border-white/10 flex items-center px-3">
        {/* Центрированные иконки */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {/* Пуск */}
          <button className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors" title="Пуск">
            <div className="grid grid-cols-2 gap-[2px]">
              {[0, 1, 2, 3].map(i => <div key={i} className="w-[7px] h-[7px] bg-blue-400 rounded-[1px]" />)}
            </div>
          </button>
          {/* Поиск */}
          <button className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors" title="Поиск">
            <Search size={18} className="text-white/80" />
          </button>
          {/* FoodChain Admin (активно) */}
          <button onClick={() => setMinimized(m => !m)}
            className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${!minimized ? 'bg-white/15' : 'hover:bg-white/10'}`}
            title="FoodChain Admin">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-md flex items-center justify-center text-white font-bold text-xs">F</div>
            <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] rounded-full bg-blue-400 transition-all ${minimized ? 'w-1.5' : 'w-4'}`} />
          </button>
          {/* Гостевое приложение */}
          <button onClick={onOpenPhone} className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors" title="Гостевое приложение (телефон)">
            <Smartphone size={18} className="text-white/80" />
          </button>
        </div>

        {/* Системный трей справа */}
        <div className="ml-auto flex items-center gap-3 text-white/80">
          <ChevronUp size={14} />
          <div className="flex items-center gap-2">
            <Wifi size={14} />
            <Volume2 size={14} />
            <Battery size={16} />
          </div>
          <div className="text-right leading-tight pr-1">
            <div className="text-[11.5px]">{timeStr}</div>
            <div className="text-[10.5px] text-white/60">{dateStr}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
