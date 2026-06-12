import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context';
import GuestApp from './guest/GuestApp';
import AdminApp from './admin/AdminApp';
import CourierApp from './courier/CourierApp';
import { PhoneFrame, WindowsFrame } from './frames';

// Три режима приложения
type AppMode = 'guest' | 'admin' | 'courier';

function AppContent() {
  const { theme } = useApp();
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [mode, setMode] = useState<AppMode>('guest');

  // Определяем десктоп / мобильное устройство
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [phoneScale, setPhoneScale] = useState(1);

  useEffect(() => {
    const onResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setPhoneScale(Math.min(1, (window.innerHeight - 48) / 870));
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ===== МОБИЛЬНОЕ УСТРОЙСТВО: без рамок =====
  if (!isDesktop) {
    return (
      <div className={`${theme === 'dark' ? 'dark' : ''}`}>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors">
          {mode === 'guest' && <GuestApp />}
          {mode === 'admin' && <AdminApp />}
          {mode === 'courier' && <CourierApp />}

          {/* Панель переключения режимов */}
          <div className="fixed top-3 right-3 z-[200] flex gap-1.5">
            <button onClick={() => setMode('guest')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all ${mode === 'guest' ? 'bg-orange-500 text-white scale-105' : 'bg-zinc-800/80 text-zinc-400'}`}>
              👤 Гость
            </button>
            <button onClick={() => setMode('admin')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all ${mode === 'admin' ? 'bg-blue-500 text-white scale-105' : 'bg-zinc-800/80 text-zinc-400'}`}>
              🔧 Админ
            </button>
            <button onClick={() => setMode('courier')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all ${mode === 'courier' ? 'bg-green-500 text-white scale-105' : 'bg-zinc-800/80 text-zinc-400'}`}>
              🚴 Курьер
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== ДЕСКТОП: КАЖДОЕ ПРИЛОЖЕНИЕ В СВОЁМ УСТРОЙСТВЕ =====

  // Админка — в Windows
  if (mode === 'admin') {
    return (
      <div className={`${theme === 'dark' ? 'dark' : ''}`}>
        <WindowsFrame
          title="FoodChain Admin — Панель управления сетью ресторанов"
          onClose={() => setMode('guest')}
          onOpenPhone={() => setMode('guest')}
          onOpenCourier={() => setMode('courier')}
        >
          <div className="min-h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
            <AdminApp />
          </div>
        </WindowsFrame>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''}`}>
      <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-red-600/10 rounded-full blur-[120px]" />

        <div className="relative h-full flex items-center justify-center gap-12 px-8">
          {/* ТЕЛЕФОН */}
          <div style={{ transform: `scale(${phoneScale})`, transformOrigin: 'center' }}>
            {mode === 'guest' && (
              <PhoneFrame platform={platform}>
                <div className="min-h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
                  <GuestApp />
                </div>
              </PhoneFrame>
            )}
            {mode === 'courier' && (
              <PhoneFrame platform={platform}>
                <div className="min-h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
                  <CourierApp />
                </div>
              </PhoneFrame>
            )}
          </div>

          {/* Боковая панель */}
          <div className="hidden xl:flex flex-col gap-5 w-72">
            {/* Логотип */}
            <div className="flex items-center gap-3 mb-1">
              {mode === 'guest' && (
                <>
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">F</div>
                  <h1 className="text-white text-2xl font-extrabold tracking-tight">FoodChain</h1>
                </>
              )}
              {mode === 'courier' && (
                <>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">C</div>
                  <h1 className="text-white text-2xl font-extrabold tracking-tight">FoodChain Курьер</h1>
                </>
              )}
            </div>

            {/* Переключатель платформы */}
            <div className="bg-zinc-800/60 backdrop-blur rounded-2xl p-1.5 flex gap-1.5 ring-1 ring-white/10">
              <button
                onClick={() => setPlatform('ios')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${platform === 'ios' ? 'bg-white text-zinc-900 shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
                iPhone
              </button>
              <button
                onClick={() => setPlatform('android')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${platform === 'android' ? 'bg-green-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
                🤖 Android
              </button>
            </div>

            {/* Кнопки переключения */}
            {mode === 'guest' && (
              <button onClick={() => setMode('admin')}
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl p-4 text-left shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-xl">🖥️</div>
                  <div>
                    <p className="font-bold text-sm">Открыть бэк-офис</p>
                    <p className="text-white/60 text-xs">Приложение для Windows</p>
                  </div>
                  <span className="ml-auto text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all">→</span>
                </div>
              </button>
            )}
            {mode === 'guest' && (
              <button onClick={() => setMode('courier')}
                className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-2xl p-4 text-left shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-xl">🚴</div>
                  <div>
                    <p className="font-bold text-sm">Открыть курьерское</p>
                    <p className="text-white/60 text-xs">Отдельное приложение</p>
                  </div>
                  <span className="ml-auto text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all">→</span>
                </div>
              </button>
            )}
            {mode === 'courier' && (
              <button onClick={() => setMode('guest')}
                className="group bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-2xl p-4 text-left shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-xl">👤</div>
                  <div>
                    <p className="font-bold text-sm">Гостевое приложение</p>
                    <p className="text-white/60 text-xs">Для заказов и меню</p>
                  </div>
                  <span className="ml-auto text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all">→</span>
                </div>
              </button>
            )}
            {mode === 'courier' && (
              <button onClick={() => setMode('admin')}
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl p-4 text-left shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-xl">🖥️</div>
                  <div>
                    <p className="font-bold text-sm">Бэк-офис</p>
                    <p className="text-white/60 text-xs">Администрирование</p>
                  </div>
                  <span className="ml-auto text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all">→</span>
                </div>
              </button>
            )}

            {/* Информация */}
            <div className="bg-zinc-800/40 backdrop-blur rounded-2xl p-4 ring-1 ring-white/10 space-y-2.5 text-xs text-zinc-400">
              {mode === 'guest' && <p className="text-zinc-300 font-semibold text-sm">📱 Мобильное приложение для гостей</p>}
              {mode === 'courier' && <p className="text-zinc-300 font-semibold text-sm">🚴 Приложение для курьеров</p>}
              <p>• Синхронизация в реальном времени</p>
              <p>• Telegram WebApp SDK</p>
              <p>• iOS и Android одним нажатием</p>
            </div>
          </div>
        </div>

        {/* Кнопки для экранов без боковой панели */}
        {mode === 'guest' && (
          <>
            <button onClick={() => setMode('admin')}
              className="xl:hidden fixed top-4 right-4 z-[100] bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg active:scale-95">🖥️ Админ</button>
            <button onClick={() => setMode('courier')}
              className="xl:hidden fixed top-4 right-24 z-[100] bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg active:scale-95">🚴 Курьер</button>
          </>
        )}
        {mode === 'courier' && (
          <>
            <button onClick={() => setMode('guest')}
              className="xl:hidden fixed top-4 right-4 z-[100] bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">👤 Гость</button>
            <button onClick={() => setMode('admin')}
              className="xl:hidden fixed top-4 right-28 z-[100] bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">🖥️ Админ</button>
          </>
        )}
        {/* Переключатель платформы для средних экранов */}
        <div className="xl:hidden fixed top-4 left-4 z-[100] bg-zinc-800/80 backdrop-blur rounded-full p-1 flex gap-1 ring-1 ring-white/10">
          <button onClick={() => setPlatform('ios')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${platform === 'ios' ? 'bg-white text-zinc-900' : 'text-zinc-400'}`}>iOS</button>
          <button onClick={() => setPlatform('android')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${platform === 'android' ? 'bg-green-500 text-white' : 'text-zinc-400'}`}>🤖 Android</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
