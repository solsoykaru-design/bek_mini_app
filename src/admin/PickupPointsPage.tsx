import { useState } from 'react';
import { useApp } from '../context';
import type { PickupPoint, PickupPointReview } from '../types';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Star, MessageSquare, X, Check, Image as ImageIcon } from 'lucide-react';

const makeHours = (open = '10:00', close = '22:00') => ({
  mon: { open, close }, tue: { open, close }, wed: { open, close },
  thu: { open, close }, fri: { open, close }, sat: { open, close }, sun: { open, close },
});

export default function PickupPointsPage() {
  const {
    pickupPoints, addPickupPoint, updatePickupPoint, deletePickupPoint,
    reorderPickupPoint, togglePickupPointActive, pickupPointReviews,
    approvePickupPointReview, rejectPickupPointReview, replyPickupPointReview,
    addNotification,
  } = useApp();
  const [editing, setEditing] = useState<PickupPoint | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reviewPointId, setReviewPointId] = useState<number | null>(null);

  const sorted = [...pickupPoints].sort((a, b) => a.displayOrder - b.displayOrder);
  const activeCount = pickupPoints.filter(p => p.isActive).length;

  const savePoint = (point: PickupPoint) => {
    if (editing) {
      updatePickupPoint(point.id, point);
      addNotification({ type: 'system', title: '📍 Точка самовывоза обновлена', body: point.name, link: 'pickup_points' });
    } else {
      addPickupPoint(point);
      addNotification({ type: 'system', title: '📍 Точка самовывоза добавлена', body: point.name, link: 'pickup_points' });
    }
    setEditing(null);
    setShowForm(false);
  };

  if (reviewPointId) {
    const point = pickupPoints.find(p => p.id === reviewPointId);
    return (
      <PickupPointReviewsView
        point={point}
        reviews={pickupPointReviews.filter(r => r.pickupPointId === reviewPointId)}
        onBack={() => setReviewPointId(null)}
        onApprove={approvePickupPointReview}
        onReject={rejectPickupPointReview}
        onReply={replyPickupPointReview}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Точки самовывоза</h2>
          <p className="text-sm text-zinc-500">Единый список филиалов для гостевого приложения и настроек</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-orange-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-orange-500/20">
          <Plus size={16} /> Добавить точку
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric label="Всего" value={pickupPoints.length} />
        <Metric label="Активных" value={activeCount} />
        <Metric label="Отзывы" value={pickupPointReviews.length} />
      </div>

      {showForm && (
        <PickupPointForm
          point={editing}
          nextOrder={pickupPoints.length + 1}
          onCancel={() => { setEditing(null); setShowForm(false); }}
          onSave={savePoint}
        />
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {sorted.map(point => {
          const reviews = pickupPointReviews.filter(r => r.pickupPointId === point.id && r.isVisible);
          return (
            <div key={point.id} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 flex items-center justify-center relative">
                {point.photos[0]?.url ? <img src={point.photos[0].url} className="w-full h-full object-cover" /> : <div className="text-center text-zinc-400"><ImageIcon className="mx-auto mb-1" /><span className="text-xs">Нет изображения</span></div>}
                <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full ${point.isActive ? 'bg-green-500 text-white' : 'bg-zinc-500 text-white'}`}>{point.isActive ? 'Активна' : 'Не активна'}</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-zinc-900 dark:text-white">{point.name}</h3>
                    <p className="text-sm text-zinc-500">{point.address}</p>
                    <p className="text-xs text-zinc-400 mt-1">⏱️ ~{point.estimatedReadyMinutes} мин · ⭐ {point.rating.toFixed(1)} ({reviews.length})</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={point.isActive} onChange={() => togglePickupPointActive(point.id)} className="sr-only peer" />
                    <div className="relative w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
                  </label>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => { setEditing(point); setShowForm(true); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1"><Edit2 size={14}/> Редактировать</button>
                  <button onClick={() => setReviewPointId(point.id)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1"><MessageSquare size={14}/> Отзывы</button>
                  <button onClick={() => reorderPickupPoint(point.id, 'up')} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500"><ArrowUp size={14}/></button>
                  <button onClick={() => reorderPickupPoint(point.id, 'down')} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500"><ArrowDown size={14}/></button>
                  <button onClick={() => confirm('Удалить точку?') && deletePickupPoint(point.id)} className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 ml-auto"><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 text-center"><p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p><p className="text-xs text-zinc-500">{label}</p></div>;
}

function PickupPointForm({ point, nextOrder, onSave, onCancel }: { point: PickupPoint | null; nextOrder: number; onSave: (p: PickupPoint) => void; onCancel: () => void }) {
  const [name, setName] = useState(point?.name || '');
  const [address, setAddress] = useState(point?.address || '');
  const [lat, setLat] = useState(point?.lat || 55.7558);
  const [lng, setLng] = useState(point?.lng || 37.6173);
  const [description, setDescription] = useState(point?.description || '');
  const [isActive, setIsActive] = useState(point?.isActive ?? true);
  const [ready, setReady] = useState(point?.estimatedReadyMinutes || 20);
  const [open, setOpen] = useState(point?.workingHours?.mon?.open || '10:00');
  const [close, setClose] = useState(point?.workingHours?.mon?.close || '22:00');
  const [photos, setPhotos] = useState(point?.photos || []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    Array.from(files).forEach(file => {
      if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => setPhotos(prev => [...prev, { id: Date.now() + Math.random(), name: file.name, url: String(reader.result), isMain: prev.length === 0, order: prev.length }]);
      reader.readAsDataURL(file);
    });
  };

  const submit = () => {
    if (!name || !address) return;
    onSave({
      id: point?.id || Date.now(), name, address, lat, lng, description,
      phone: point?.phone || '', workingHours: makeHours(open, close), photos,
      rating: point?.rating || 0, reviewCount: point?.reviewCount || 0,
      estimatedReadyMinutes: ready, isActive, displayOrder: point?.displayOrder || nextOrder,
      createdAt: point?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border-2 border-orange-200 dark:border-orange-900/40 space-y-4">
      <div className="flex items-center justify-between"><h3 className="font-bold text-zinc-900 dark:text-white">{point ? 'Редактировать точку' : 'Добавить точку'}</h3><button onClick={onCancel}><X size={18}/></button></div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Название" value={name} setValue={setName} />
        <Field label="Адрес" value={address} setValue={setAddress} />
        <Field label="Широта" value={String(lat)} setValue={v => setLat(Number(v))} />
        <Field label="Долгота" value={String(lng)} setValue={v => setLng(Number(v))} />
        <Field label="Открытие" value={open} setValue={setOpen} type="time" />
        <Field label="Закрытие" value={close} setValue={setClose} type="time" />
        <Field label="Время готовности, мин" value={String(ready)} setValue={v => setReady(Number(v))} type="number" />
      </div>
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание для клиентов" className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-sm outline-none" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} /> Активна</label>
      <div>
        <p className="text-xs text-zinc-500 font-medium mb-2">Фотографии (JPEG/PNG/WEBP до 5 МБ)</p>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>addFiles(e.target.files)} className="text-sm" />
        <div className="flex gap-2 flex-wrap mt-3">
          {photos.length === 0 && <div className="w-24 h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">Нет изображения</div>}
          {photos.sort((a,b)=>a.order-b.order).map(photo => (
            <div key={photo.id} className="relative w-24 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              {photo.url ? <img src={photo.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">Нет фото</div>}
              <button onClick={() => setPhotos(prev => prev.map(p => ({ ...p, isMain: p.id === photo.id })))} className={`absolute top-1 left-1 p-1 rounded-full ${photo.isMain ? 'bg-amber-400 text-white' : 'bg-black/40 text-white'}`}><Star size={10}/></button>
              <button onClick={() => confirm('Удалить фото?') && setPhotos(prev => prev.filter(p => p.id !== photo.id))} className="absolute top-1 right-1 bg-black/40 text-white rounded-full p-1"><X size={10}/></button>
            </div>
          ))}
        </div>
      </div>
      <button onClick={submit} className="bg-orange-500 text-white font-semibold px-5 py-3 rounded-xl">Сохранить</button>
    </div>
  );
}

function Field({ label, value, setValue, type='text' }: { label: string; value: string; setValue: (v:string)=>void; type?: string }) {
  return <div><label className="text-xs text-zinc-500 block mb-1">{label}</label><input type={type} value={value} onChange={e=>setValue(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-sm outline-none" /></div>;
}

function PickupPointReviewsView({ point, reviews, onBack, onApprove, onReject, onReply }: { point?: PickupPoint; reviews: PickupPointReview[]; onBack:()=>void; onApprove:(id:number)=>void; onReject:(id:number)=>void; onReply:(id:number, text:string)=>void }) {
  const [replyId, setReplyId] = useState<number | null>(null);
  const [reply, setReply] = useState('');
  return <div className="space-y-4"><button onClick={onBack} className="text-sm text-zinc-500">← Назад к точкам</button><h2 className="text-xl font-bold text-zinc-900 dark:text-white">Отзывы о точке: {point?.name}</h2>{reviews.length===0?<div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl text-center text-zinc-400">Отзывов пока нет</div>:reviews.map(r=><div key={r.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800"><div className="flex justify-between"><b className="text-zinc-900 dark:text-white">{r.userName}</b><span>{'★'.repeat(r.rating)}</span></div><p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{r.text}</p>{r.reply&&<p className="text-sm bg-orange-50 dark:bg-orange-900/20 mt-2 p-2 rounded-xl">Ответ: {r.reply}</p>}<div className="flex gap-2 mt-3">{!r.isModerated&&<><button onClick={()=>onApprove(r.id)} className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg"><Check size={12} className="inline"/> Одобрить</button><button onClick={()=>onReject(r.id)} className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg"><X size={12} className="inline"/> Скрыть</button></>}<button onClick={()=>setReplyId(r.id)} className="text-blue-500 text-xs">Ответить</button></div>{replyId===r.id&&<div className="mt-2 flex gap-2"><input value={reply} onChange={e=>setReply(e.target.value)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-sm"/><button onClick={()=>{onReply(r.id,reply);setReply('');setReplyId(null)}} className="bg-blue-500 text-white px-3 rounded-xl text-sm">OK</button></div>}</div>)}</div>;
}