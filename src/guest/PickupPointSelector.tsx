import { useState } from 'react';
import { useApp } from '../context';
import type { PickupPoint } from '../types';
import { MapPin, Star, Clock, Image as ImageIcon, MessageSquare, Check, Navigation } from 'lucide-react';

export default function PickupPointSelector({ selectedId, onSelect }: { selectedId?: number; onSelect: (point: PickupPoint) => void }) {
  const { pickupPoints, pickupPointReviews } = useApp();
  console.log('[PickupPointSelector] pickupPoints from context:', pickupPoints.length, pickupPoints);
  const [gallery, setGallery] = useState<PickupPoint | null>(null);
  const [reviewsPoint, setReviewsPoint] = useState<PickupPoint | null>(null);
  const [loc, setLoc] = useState<{lat:number;lng:number} | null>(null);
  const active = pickupPoints.filter(p => p.isActive).sort((a,b)=>a.displayOrder-b.displayOrder);

  const dist = (p: PickupPoint) => {
    if (!loc) return null;
    const R = 6371;
    const dLat = (p.lat-loc.lat)*Math.PI/180;
    const dLng = (p.lng-loc.lng)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(loc.lat*Math.PI/180)*Math.cos(p.lat*Math.PI/180)*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  };
  const askGeo = () => navigator.geolocation?.getCurrentPosition(pos => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">Выберите точку самовывоза</p>
        <button onClick={askGeo} className="text-xs text-blue-500 flex items-center gap-1"><Navigation size={12}/> Моя гео</button>
      </div>
      {active.length === 0 ? <p className="text-sm text-zinc-400 text-center py-6">Нет доступных точек самовывоза</p> : active.map(point => {
        const d = dist(point);
        const reviews = pickupPointReviews.filter(r=>r.pickupPointId===point.id && r.isVisible);
        return <div key={point.id} className={`rounded-2xl border-2 p-3 transition ${selectedId===point.id?'border-orange-500 bg-orange-50 dark:bg-orange-900/10':'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'}`}>
          <div className="flex gap-3">
            <button onClick={()=>setGallery(point)} className="w-20 h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {point.photos[0]?.url ? <img src={point.photos[0].url} className="w-full h-full object-cover"/> : <ImageIcon className="text-zinc-400"/>}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">{point.name}</h4>
                {selectedId===point.id && <Check size={18} className="text-orange-500"/>}
              </div>
              <p className="text-xs text-zinc-500 flex items-start gap-1 mt-0.5"><MapPin size={11} className="mt-0.5 flex-shrink-0"/> {point.address}</p>
              <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1"><Star size={11} fill="#f59e0b" className="text-amber-400"/> {point.rating.toFixed(1)}</span>
                <span className="flex items-center gap-1"><Clock size={11}/> ~{point.estimatedReadyMinutes} мин</span>
                {d !== null && <span>📍 {d.toFixed(1)} км</span>}
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={()=>onSelect(point)} className="bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">Выбрать</button>
                <button onClick={()=>setReviewsPoint(point)} className="text-xs text-zinc-500 flex items-center gap-1"><MessageSquare size={12}/> Отзывы ({reviews.length})</button>
              </div>
            </div>
          </div>
        </div>;
      })}

      {gallery && <Modal title={`Фото: ${gallery.name}`} onClose={()=>setGallery(null)}><div className="grid grid-cols-2 gap-2">{gallery.photos.length?gallery.photos.map(p=><img key={p.id} src={p.url} className="rounded-xl aspect-square object-cover"/>):<div className="col-span-2 text-center text-zinc-400 py-10">Нет изображения</div>}</div></Modal>}
      {reviewsPoint && <Modal title={`Отзывы: ${reviewsPoint.name}`} onClose={()=>setReviewsPoint(null)}>{pickupPointReviews.filter(r=>r.pickupPointId===reviewsPoint.id && r.isVisible).length?pickupPointReviews.filter(r=>r.pickupPointId===reviewsPoint.id && r.isVisible).map(r=><div key={r.id} className="border-b border-zinc-100 dark:border-zinc-800 py-3"><div className="flex justify-between"><b>{r.userName}</b><span>{'★'.repeat(r.rating)}</span></div><p className="text-sm text-zinc-500 mt-1">{r.text}</p>{r.reply&&<p className="text-sm bg-orange-50 dark:bg-orange-900/20 p-2 rounded-xl mt-2">Ответ: {r.reply}</p>}</div>):<p className="text-center text-zinc-400 py-8">Отзывов пока нет</p>}</Modal>}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: any; onClose: ()=>void }) {
  return <div className="fixed inset-0 z-[500] bg-black/60 flex items-center justify-center p-4" onClick={onClose}><div onClick={e=>e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"><div className="flex justify-between mb-3"><h3 className="font-bold text-zinc-900 dark:text-white">{title}</h3><button onClick={onClose}>✕</button></div>{children}</div></div>
}