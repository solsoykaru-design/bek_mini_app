import { useState, useEffect } from 'react';
import { useApp } from '../context';
import type { Order, OrderStatus } from '../types';
import { Truck, Check, Phone, Navigation, MapPin, Clock, X, ArrowRight } from 'lucide-react';

export default function CourierApp() {
  const { orders, updateOrderStatus, addNotification } = useApp();
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  // Фильтрация заказов, назначенных этому курьеру (в демо — все заказы в доставке)
  useEffect(() => {
    const courierOrders = orders.filter(o => 
      o.type === 'delivery' && 
      (o.status === 'delivering' || o.status === 'ready' || o.status === 'new')
    );
    setMyOrders(courierOrders);
  }, [orders]);

  const takeOrder = (order: Order) => {
    updateOrderStatus(order.id, 'delivering');
    addNotification({
      type: 'order',
      title: `🚗 Заказ #${order.id} принят`,
      body: `Вы взяли заказ на доставку. Адрес: ${order.address || '—'}`,
      link: 'courier',
    });
    setSelectedOrder(order);
  };

  const completeOrder = (order: Order) => {
    updateOrderStatus(order.id, 'delivered');
    addNotification({
      type: 'order',
      title: `✅ Заказ #${order.id} доставлен`,
      body: `Заказ успешно доставлен клиенту.`,
      link: 'courier',
    });
    setSelectedOrder(null);
  };

  const callClient = (phone: string) => {
    window.open(`tel:${phone.replace(/[^+\d]/g, '')}`, '_self');
    addNotification({
      type: 'system',
      title: '📞 Звонок клиенту',
      body: `Звонок на ${phone}`,
      link: 'courier',
    });
  };

  const buildRoute = (order: Order) => {
    if (!order.address) return;
    alert(`Адрес доставки:\n${order.address}\n\nОткройте приложение карт вручную.`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold">C</div>
          <h1 className="font-bold text-lg">Курьер</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>Онлайн</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <button onClick={() => setTab('active')} className={`flex-1 py-3 text-sm font-medium ${tab === 'active' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-zinc-500'}`}>
          Активные ({myOrders.length})
        </button>
        <button onClick={() => setTab('history')} className={`flex-1 py-3 text-sm font-medium ${tab === 'history' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-zinc-500'}`}>
          История
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {tab === 'active' && (
          <>
            {myOrders.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <Truck size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-medium">Нет назначенных заказов</p>
                <p className="text-xs mt-1">Администратор назначит заказы автоматически</p>
              </div>
            ) : (
              myOrders.map(order => (
                <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-lg text-zinc-900 dark:text-white">#{order.id}</div>
                      <div className="text-xs text-zinc-400">{order.userName} • {order.userPhone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-500">{order.total}₽</div>
                      <div className="text-[10px] text-zinc-400">оплата: {order.isPaid ? '✅' : '⏳'}</div>
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 mb-3 text-xs">
                    <div className="flex items-center gap-1 text-zinc-500 mb-1"><MapPin size={12}/> {order.address}</div>
                    <div className="flex gap-2">
                      {order.items.map((item, i) => (
                        <span key={i} className="bg-white dark:bg-zinc-700 px-2 py-0.5 rounded text-[10px]">{item.name}×{item.quantity}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'ready' && (
                      <button onClick={() => takeOrder(order)} className="flex-1 bg-green-500 text-white font-semibold py-3 rounded-xl text-sm active:scale-95 transition">
                        Забрал у ресторана
                      </button>
                    )}
                    {order.status === 'delivering' && (
                      <>
                        <button onClick={() => callClient(order.userPhone)} className="flex-1 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium py-3 rounded-xl text-sm">📞 Клиенту</button>
                        <button onClick={() => buildRoute(order)} className="flex-1 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium py-3 rounded-xl text-sm">🗺️ Маршрут</button>
                        <button onClick={() => completeOrder(order)} className="flex-1 bg-green-500 text-white font-semibold py-3 rounded-xl text-sm active:scale-95 transition">Доставил</button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {tab === 'history' && (
          <div className="text-center py-12 text-zinc-400">
            <Clock size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">История доставок появится здесь</p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 z-50">
        <div className="max-w-lg mx-auto flex justify-around text-xs">
          <button onClick={() => setTab('active')} className={`flex flex-col items-center ${tab === 'active' ? 'text-orange-500' : 'text-zinc-400'}`}>
            <Truck size={22} />
            <span>Заказы</span>
          </button>
          <button onClick={() => setTab('history')} className={`flex flex-col items-center ${tab === 'history' ? 'text-orange-500' : 'text-zinc-400'}`}>
            <Clock size={22} />
            <span>История</span>
          </button>
        </div>
      </div>
    </div>
  );
}
