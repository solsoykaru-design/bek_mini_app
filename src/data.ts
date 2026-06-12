// ============================================================
//  data.ts — справочные данные (меню, филиалы, персонал и т.д.)
//  Транзакционные данные (заказы, клиенты, отзывы, аналитика)
//  генерируются в контексте от текущей даты браузера.
// ============================================================

import {
  Branch, MenuCategory, Dish, Booking, Table,
  Ingredient, Supplier, PurchaseOrder, PromoCode,
  Staff, Shift, AuditLog, DeliveryZone, Campaign,
  Review, PickupPoint, PickupPointReview,
} from './types';

// ─── Филиалы ────────────────────────────────────────────────
export const branches: Branch[] = [
  {
    id: 1, name: 'FoodChain Центр', address: 'ул. Тверская, 15',
    phone: '+7 (495) 123-45-67', lat: 55.764, lng: 37.606,
    workingHours: {
      mon: { open: '09:00', close: '23:00' }, tue: { open: '09:00', close: '23:00' },
      wed: { open: '09:00', close: '23:00' }, thu: { open: '09:00', close: '23:00' },
      fri: { open: '09:00', close: '00:00' }, sat: { open: '10:00', close: '00:00' },
      sun: { open: '10:00', close: '22:00' },
    }, isActive: true,
  },
  {
    id: 2, name: 'FoodChain Арбат', address: 'ул. Арбат, 24',
    phone: '+7 (495) 234-56-78', lat: 55.751, lng: 37.592,
    workingHours: {
      mon: { open: '10:00', close: '22:00' }, tue: { open: '10:00', close: '22:00' },
      wed: { open: '10:00', close: '22:00' }, thu: { open: '10:00', close: '22:00' },
      fri: { open: '10:00', close: '23:00' }, sat: { open: '10:00', close: '23:00' },
      sun: { open: '11:00', close: '21:00' },
    }, isActive: true,
  },
  {
    id: 3, name: 'FoodChain Сити', address: 'Пресненская наб., 8',
    phone: '+7 (495) 345-67-89', lat: 55.749, lng: 37.537,
    workingHours: {
      mon: { open: '08:00', close: '22:00' }, tue: { open: '08:00', close: '22:00' },
      wed: { open: '08:00', close: '22:00' }, thu: { open: '08:00', close: '22:00' },
      fri: { open: '08:00', close: '23:00' }, sat: { open: '09:00', close: '23:00' },
      sun: { open: '09:00', close: '21:00' },
    }, isActive: true,
  },
];

const workingEveryDay = (open = '10:00', close = '22:00') => ({
  mon: { open, close }, tue: { open, close }, wed: { open, close }, thu: { open, close },
  fri: { open, close }, sat: { open, close }, sun: { open, close },
});

// Единый источник для гостевого списка самовывоза, админского раздела и настроек.
export const pickupPoints: PickupPoint[] = [
  {
    id: 1,
    name: 'FoodChain Центр',
    address: 'Москва, ул. Тверская, 15',
    lat: 55.764,
    lng: 37.606,
    phone: '+7 (495) 123-45-67',
    description: 'Флагманская точка в центре города. Удобный вход с Тверской, выдача заказов у отдельной стойки.',
    workingHours: workingEveryDay('09:00', '23:00'),
    photos: [
      { id: 1, name: 'main', url: '', isMain: true, order: 0 },
    ],
    rating: 4.8,
    reviewCount: 0,
    estimatedReadyMinutes: 18,
    isActive: true,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'FoodChain Арбат',
    address: 'Москва, ул. Арбат, 24',
    lat: 55.751,
    lng: 37.592,
    phone: '+7 (495) 234-56-78',
    description: 'Небольшая уютная точка на Арбате с быстрым самовывозом и отдельным окном выдачи.',
    workingHours: workingEveryDay('10:00', '22:00'),
    photos: [
      { id: 2, name: 'main', url: '', isMain: true, order: 0 },
    ],
    rating: 4.6,
    reviewCount: 0,
    estimatedReadyMinutes: 22,
    isActive: true,
    displayOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'FoodChain Сити',
    address: 'Москва, Пресненская наб., 8',
    lat: 55.749,
    lng: 37.537,
    phone: '+7 (495) 345-67-89',
    description: 'Точка для офисов Москва-Сити. Самовывоз обычно готов за 15-20 минут.',
    workingHours: workingEveryDay('08:00', '22:00'),
    photos: [
      { id: 3, name: 'main', url: '', isMain: true, order: 0 },
    ],
    rating: 4.7,
    reviewCount: 0,
    estimatedReadyMinutes: 16,
    isActive: true,
    displayOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const pickupPointReviews: PickupPointReview[] = [];

// ─── Категории меню ─────────────────────────────────────────
export const categories: MenuCategory[] = [
  { id: 1, name: 'Бургеры',   icon: '🍔', order: 1 },
  { id: 2, name: 'Пицца',     icon: '🍕', order: 2 },
  { id: 3, name: 'Роллы',     icon: '🍣', order: 3 },
  { id: 4, name: 'Салаты',    icon: '🥗', order: 4 },
  { id: 5, name: 'Супы',      icon: '🍜', order: 5 },
  { id: 6, name: 'Паста',     icon: '🍝', order: 6 },
  { id: 7, name: 'Десерты',   icon: '🍰', order: 7 },
  { id: 8, name: 'Напитки',   icon: '🥤', order: 8 },
  { id: 9, name: 'Завтраки',  icon: '🍳', order: 9 },
  { id: 10, name: 'Гриль',    icon: '🥩', order: 10 },
];

// ─── Блюда ──────────────────────────────────────────────────
export const dishes: Dish[] = [
  {
    id: 1, name: 'Классический бургер',
    description: 'Сочная говяжья котлета, свежие овощи, фирменный соус, булочка бриошь',
    price: 449, oldPrice: 549, imageUrl: '', categoryId: 1,
    weight: 320, calories: 580, proteins: 28, fats: 32, carbs: 42,
    allergens: ['Глютен', 'Молоко'], tags: ['Хит продаж'],
    isAvailable: true, isNew: false, isPopular: true, rating: 4.8, reviewCount: 0,
    customizations: [
      { id: 1, name: 'Котлета', required: true, multiple: false, options: [
        { id: 1, name: 'Говядина',        price: 0,   isDefault: true  },
        { id: 2, name: 'Курица',          price: 0,   isDefault: false },
        { id: 3, name: 'Двойная говядина',price: 150, isDefault: false },
      ]},
      { id: 2, name: 'Дополнительно', required: false, multiple: true, options: [
        { id: 4, name: 'Бекон',      price: 80, isDefault: false },
        { id: 5, name: 'Яйцо',       price: 50, isDefault: false },
        { id: 6, name: 'Халапеньо',  price: 40, isDefault: false },
        { id: 7, name: 'Экстра сыр', price: 60, isDefault: false },
      ]},
    ],
  },
  { id: 2,  name: 'Чизбургер Делюкс',      description: 'Двойная котлета, двойной чеддер, карамелизированный лук, трюфельный айоли',                          price: 649,  imageUrl: '', categoryId: 1,  weight: 420, calories: 780, proteins: 38, fats: 45, carbs: 48, allergens: ['Глютен','Молоко'],          tags: ['Premium'],          isAvailable: true, isNew: true,  isPopular: true,  rating: 4.9, reviewCount: 0 },
  { id: 3,  name: 'Чикен бургер',           description: 'Хрустящее куриное филе, айсберг, томаты, соус цезарь',                                                price: 399,  imageUrl: '', categoryId: 1,  weight: 290, calories: 520, proteins: 32, fats: 24, carbs: 44, allergens: ['Глютен'],                  tags: [],                   isAvailable: true, isNew: false, isPopular: false, rating: 4.5, reviewCount: 0 },
  { id: 4,  name: 'Веган бургер',           description: 'Котлета из нута и киноа, авокадо, томаты, веганский майонез',                                          price: 499,  imageUrl: '', categoryId: 1,  weight: 310, calories: 420, proteins: 18, fats: 20, carbs: 52, allergens: ['Глютен'],                  tags: ['Веган','Новинка'],  isAvailable: true, isNew: true,  isPopular: false, rating: 4.3, reviewCount: 0 },
  {
    id: 5, name: 'Маргарита',
    description: 'Томатный соус, моцарелла, свежий базилик, оливковое масло',
    price: 549, imageUrl: '', categoryId: 2,
    weight: 450, calories: 650, proteins: 24, fats: 28, carbs: 68,
    allergens: ['Глютен', 'Молоко'], tags: ['Классика'],
    isAvailable: true, isNew: false, isPopular: true, rating: 4.7, reviewCount: 0,
    customizations: [
      { id: 3, name: 'Размер', required: true, multiple: false, options: [
        { id: 8,  name: '25 см', price: 0,   isDefault: true  },
        { id: 9,  name: '30 см', price: 150, isDefault: false },
        { id: 10, name: '35 см', price: 250, isDefault: false },
      ]},
      { id: 4, name: 'Тесто', required: true, multiple: false, options: [
        { id: 11, name: 'Традиционное', price: 0,   isDefault: true  },
        { id: 12, name: 'Тонкое',       price: 0,   isDefault: false },
        { id: 13, name: 'Сырный борт',  price: 100, isDefault: false },
      ]},
    ],
  },
  { id: 6,  name: 'Пепперони',              description: 'Острая пепперони, моцарелла, томатный соус, перец чили',                                               price: 649,  imageUrl: '', categoryId: 2,  weight: 480, calories: 720, proteins: 28, fats: 34, carbs: 64, allergens: ['Глютен','Молоко'],          tags: ['Острое'],           isAvailable: true, isNew: false, isPopular: true,  rating: 4.8, reviewCount: 0 },
  { id: 7,  name: 'Четыре сыра',            description: 'Моцарелла, горгонзола, пармезан, рикотта, сливочный соус',                                             price: 749,  imageUrl: '', categoryId: 2,  weight: 460, calories: 800, proteins: 32, fats: 42, carbs: 58, allergens: ['Глютен','Молоко'],          tags: ['Premium'],          isAvailable: true, isNew: false, isPopular: false, rating: 4.6, reviewCount: 0 },
  { id: 8,  name: 'Филадельфия',            description: 'Лосось, сливочный сыр, огурец, авокадо',                                                               price: 599,  imageUrl: '', categoryId: 3,  weight: 260, calories: 380, proteins: 22, fats: 18, carbs: 42, allergens: ['Рыба','Молоко'],            tags: ['Хит'],              isAvailable: true, isNew: false, isPopular: true,  rating: 4.9, reviewCount: 0 },
  { id: 9,  name: 'Калифорния',             description: 'Краб, авокадо, огурец, тобико',                                                                        price: 549,  imageUrl: '', categoryId: 3,  weight: 240, calories: 340, proteins: 18, fats: 14, carbs: 44, allergens: ['Ракообразные'],              tags: [],                   isAvailable: true, isNew: false, isPopular: true,  rating: 4.7, reviewCount: 0 },
  { id: 10, name: 'Дракон ролл',            description: 'Угорь, креветка темпура, авокадо, унаги соус',                                                         price: 799,  imageUrl: '', categoryId: 3,  weight: 280, calories: 420, proteins: 24, fats: 20, carbs: 48, allergens: ['Рыба','Глютен'],            tags: ['Premium','Новинка'],isAvailable: true, isNew: true,  isPopular: false, rating: 4.8, reviewCount: 0 },
  { id: 11, name: 'Цезарь с курицей',       description: 'Романо, куриная грудка гриль, пармезан, гренки, соус цезарь',                                          price: 449,  imageUrl: '', categoryId: 4,  weight: 280, calories: 320, proteins: 28, fats: 18, carbs: 22, allergens: ['Глютен','Яйца','Молоко'],   tags: ['Классика'],         isAvailable: true, isNew: false, isPopular: true,  rating: 4.6, reviewCount: 0 },
  { id: 12, name: 'Греческий салат',         description: 'Томаты, огурцы, перец, маслины, фета, оливковое масло',                                               price: 399,  imageUrl: '', categoryId: 4,  weight: 250, calories: 240, proteins: 8,  fats: 18, carbs: 14, allergens: ['Молоко'],                  tags: ['Вегетарианское'],   isAvailable: true, isNew: false, isPopular: false, rating: 4.4, reviewCount: 0 },
  { id: 13, name: 'Том Ям',                 description: 'Креветки, грибы, кокосовое молоко, лемонграсс, чили',                                                  price: 549,  imageUrl: '', categoryId: 5,  weight: 350, calories: 280, proteins: 18, fats: 14, carbs: 28, allergens: ['Ракообразные'],              tags: ['Острое'],           isAvailable: true, isNew: false, isPopular: true,  rating: 4.8, reviewCount: 0 },
  { id: 14, name: 'Борщ',                   description: 'Классический борщ с говядиной, сметаной и чесночными пампушками',                                      price: 399,  imageUrl: '', categoryId: 5,  weight: 400, calories: 320, proteins: 18, fats: 12, carbs: 38, allergens: ['Глютен','Молоко'],          tags: ['Домашнее'],         isAvailable: true, isNew: false, isPopular: false, rating: 4.7, reviewCount: 0 },
  { id: 15, name: 'Карбонара',              description: 'Спагетти, гуанчиале, пармезан, яйцо, чёрный перец',                                                    price: 549,  imageUrl: '', categoryId: 6,  weight: 320, calories: 580, proteins: 24, fats: 28, carbs: 56, allergens: ['Глютен','Яйца','Молоко'],   tags: ['Классика'],         isAvailable: true, isNew: false, isPopular: true,  rating: 4.7, reviewCount: 0 },
  { id: 16, name: 'Тирамису',               description: 'Маскарпоне, савоярди, эспрессо, какао',                                                                price: 399,  imageUrl: '', categoryId: 7,  weight: 180, calories: 420, proteins: 8,  fats: 24, carbs: 44, allergens: ['Глютен','Яйца','Молоко'],   tags: ['Хит'],              isAvailable: true, isNew: false, isPopular: true,  rating: 4.9, reviewCount: 0 },
  { id: 17, name: 'Чизкейк Нью-Йорк',      description: 'Классический чизкейк с ягодным соусом',                                                                price: 449,  imageUrl: '', categoryId: 7,  weight: 200, calories: 480, proteins: 10, fats: 28, carbs: 48, allergens: ['Глютен','Яйца','Молоко'],   tags: [],                   isAvailable: true, isNew: false, isPopular: false, rating: 4.6, reviewCount: 0 },
  { id: 18, name: 'Латте',                  description: 'Двойной эспрессо, вспененное молоко, арт на выбор',                                                    price: 249,  imageUrl: '', categoryId: 8,  weight: 300, calories: 180, proteins: 8,  fats: 8,  carbs: 18, allergens: ['Молоко'],                  tags: [],                   isAvailable: true, isNew: false, isPopular: true,  rating: 4.5, reviewCount: 0 },
  { id: 19, name: 'Апельсиновый фреш',      description: 'Свежевыжатый сок из апельсинов',                                                                       price: 299,  imageUrl: '', categoryId: 8,  weight: 350, calories: 140, proteins: 2,  fats: 0,  carbs: 32, allergens: [],                          tags: ['Без сахара'],       isAvailable: true, isNew: false, isPopular: false, rating: 4.7, reviewCount: 0 },
  { id: 20, name: 'Английский завтрак',     description: 'Яичница, бекон, сосиски, фасоль, тост, грибы, томаты',                                                  price: 549,  imageUrl: '', categoryId: 9,  weight: 450, calories: 720, proteins: 38, fats: 42, carbs: 48, allergens: ['Глютен','Яйца'],            tags: ['До 12:00'],         isAvailable: true, isNew: false, isPopular: true,  rating: 4.8, reviewCount: 0 },
  { id: 21, name: 'Рибай стейк',            description: 'Мраморная говядина, гриль овощи, соус чимичурри',                                                      price: 1890, imageUrl: '', categoryId: 10, weight: 350, calories: 680, proteins: 52, fats: 48, carbs: 8,  allergens: [],                          tags: ['Premium'],          isAvailable: true, isNew: false, isPopular: true,  rating: 4.9, reviewCount: 0 },
];

// ─── Пустые транзакционные списки (заполняются живыми данными) ─
export const orders:   import('./types').Order[]   = [];
export const bookings: Booking[] = [];
export const reviews:  Review[]  = [];

// ─── Столики ────────────────────────────────────────────────
export const tables: Table[] = [
  { id: 1,  branchId: 1, name: 'Стол 1',  capacity: 2,  zone: 'Зал',       x: 10, y: 10, status: 'free'     },
  { id: 2,  branchId: 1, name: 'Стол 2',  capacity: 2,  zone: 'Зал',       x: 30, y: 10, status: 'free'     },
  { id: 3,  branchId: 1, name: 'Стол 3',  capacity: 4,  zone: 'Зал',       x: 50, y: 10, status: 'free'     },
  { id: 4,  branchId: 1, name: 'Стол 4',  capacity: 4,  zone: 'Зал',       x: 70, y: 10, status: 'free'     },
  { id: 5,  branchId: 1, name: 'Стол 5',  capacity: 6,  zone: 'Зал',       x: 10, y: 35, status: 'free'     },
  { id: 6,  branchId: 1, name: 'Стол 6',  capacity: 6,  zone: 'Зал',       x: 30, y: 35, status: 'free'     },
  { id: 7,  branchId: 1, name: 'Стол 7',  capacity: 2,  zone: 'Терраса',   x: 50, y: 35, status: 'free'     },
  { id: 8,  branchId: 1, name: 'Стол 8',  capacity: 4,  zone: 'Терраса',   x: 70, y: 35, status: 'free'     },
  { id: 9,  branchId: 1, name: 'Стол 9',  capacity: 8,  zone: 'Банкетный', x: 10, y: 60, status: 'free'     },
  { id: 10, branchId: 1, name: 'VIP 1',   capacity: 10, zone: 'VIP',       x: 50, y: 60, status: 'free'     },
  { id: 11, branchId: 1, name: 'Барная 1',capacity: 1,  zone: 'Бар',       x: 30, y: 80, status: 'free'     },
  { id: 12, branchId: 1, name: 'Барная 2',capacity: 1,  zone: 'Бар',       x: 50, y: 80, status: 'free'     },
];

// ─── Ингредиенты ─────────────────────────────────────────────
export const ingredients: Ingredient[] = [
  { id: 1,  name: 'Говядина (фарш)',  unit: 'кг',  pricePerUnit: 650,  currentStock: 25, minStock: 10, branchId: 1 },
  { id: 2,  name: 'Булочка бриошь',   unit: 'шт',  pricePerUnit: 35,   currentStock: 120,minStock: 50, branchId: 1 },
  { id: 3,  name: 'Моцарелла',        unit: 'кг',  pricePerUnit: 890,  currentStock: 8,  minStock: 5,  branchId: 1 },
  { id: 4,  name: 'Томатный соус',    unit: 'л',   pricePerUnit: 180,  currentStock: 15, minStock: 5,  branchId: 1 },
  { id: 5,  name: 'Мука (тесто)',     unit: 'кг',  pricePerUnit: 45,   currentStock: 50, minStock: 20, branchId: 1 },
  { id: 6,  name: 'Лосось (филе)',    unit: 'кг',  pricePerUnit: 1450, currentStock: 6,  minStock: 3,  branchId: 1 },
  { id: 7,  name: 'Рис для суши',     unit: 'кг',  pricePerUnit: 280,  currentStock: 3,  minStock: 5,  branchId: 1 },
  { id: 8,  name: 'Сливочный сыр',    unit: 'кг',  pricePerUnit: 720,  currentStock: 4,  minStock: 3,  branchId: 1 },
  { id: 9,  name: 'Кофе (зерно)',     unit: 'кг',  pricePerUnit: 2200, currentStock: 5,  minStock: 2,  branchId: 1 },
  { id: 10, name: 'Молоко',           unit: 'л',   pricePerUnit: 85,   currentStock: 30, minStock: 15, branchId: 1 },
  { id: 11, name: 'Пепперони',        unit: 'кг',  pricePerUnit: 1100, currentStock: 4,  minStock: 3,  branchId: 1 },
  { id: 12, name: 'Маскарпоне',       unit: 'кг',  pricePerUnit: 950,  currentStock: 2,  minStock: 2,  branchId: 1 },
];

// ─── Поставщики ─────────────────────────────────────────────
export const suppliers: Supplier[] = [
  { id: 1, name: 'МясоПром',    contactPerson: 'Петров И.А.',   phone: '+7 (495) 111-11-11', email: 'meat@supplier.ru',  address: 'г. Москва, ул. Промышленная, 5' },
  { id: 2, name: 'ФрешФиш',    contactPerson: 'Сидорова А.В.', phone: '+7 (495) 222-22-22', email: 'fish@supplier.ru',  address: 'г. Москва, ул. Рыбная, 12'       },
  { id: 3, name: 'МолочныйДом',contactPerson: 'Козлов М.С.',   phone: '+7 (495) 333-33-33', email: 'dairy@supplier.ru', address: 'г. Москва, ул. Молочная, 8'      },
];

// ─── Заявки на закупку ──────────────────────────────────────
export const purchaseOrders: PurchaseOrder[] = [];

// ─── Персонал ───────────────────────────────────────────────
export const staffList: Staff[] = [
  { id: 1, telegramId: 100001, firstName: 'Иван',   lastName: 'Козлов',    role: 'courier',  branchId: 1, branchName: 'FoodChain Центр', phone: '+7 (999) 100-00-01', hourlyRate: 350, isActive: true,  kpiScore: 92, ordersHandled: 0, avgRating: 0 },
  { id: 2, telegramId: 100002, firstName: 'Анна',   lastName: 'Петрова',   role: 'waiter',   branchId: 1, branchName: 'FoodChain Центр', phone: '+7 (999) 100-00-02', hourlyRate: 300, isActive: true,  kpiScore: 88, ordersHandled: 0, avgRating: 0 },
  { id: 3, telegramId: 100003, firstName: 'Михаил', lastName: 'Сидоров',   role: 'chef',     branchId: 1, branchName: 'FoodChain Центр', phone: '+7 (999) 100-00-03', hourlyRate: 500, isActive: true,  kpiScore: 95, ordersHandled: 0, avgRating: 0 },
  { id: 4, telegramId: 100004, firstName: 'Елена',  lastName: 'Волкова',   role: 'manager',  branchId: 1, branchName: 'FoodChain Центр', phone: '+7 (999) 100-00-04', hourlyRate: 600, isActive: true,  kpiScore: 91, ordersHandled: 0, avgRating: 0 },
  { id: 5, telegramId: 100005, firstName: 'Артём',  lastName: 'Новиков',   role: 'courier',  branchId: 2, branchName: 'FoodChain Арбат',  phone: '+7 (999) 100-00-05', hourlyRate: 350, isActive: true,  kpiScore: 85, ordersHandled: 0, avgRating: 0 },
  { id: 6, telegramId: 100006, firstName: 'Ольга',  lastName: 'Кузнецова', role: 'waiter',   branchId: 2, branchName: 'FoodChain Арбат',  phone: '+7 (999) 100-00-06', hourlyRate: 300, isActive: false, kpiScore: 78, ordersHandled: 0, avgRating: 0 },
];

// ─── Смены ──────────────────────────────────────────────────
export const shifts: Shift[] = [];

// ─── Журнал аудита ──────────────────────────────────────────
export const auditLogs: AuditLog[] = [];

// ─── Зоны доставки ──────────────────────────────────────────
export const deliveryZones: DeliveryZone[] = [
  { id: 1, branchId: 1, name: 'Ближняя зона', radiusKm: 3,  minOrder: 500,  deliveryPrice: 0,   estimatedTime: 30 },
  { id: 2, branchId: 1, name: 'Средняя зона', radiusKm: 5,  minOrder: 800,  deliveryPrice: 199, estimatedTime: 45 },
  { id: 3, branchId: 1, name: 'Дальняя зона', radiusKm: 10, minOrder: 1500, deliveryPrice: 399, estimatedTime: 60 },
];

// ─── Промокоды ──────────────────────────────────────────────
export const promoCodes: PromoCode[] = [
  {
    id: 1, code: 'FIRST100', type: 'fixed', value: 100, minOrder: 500,
    maxUses: 1000, usedCount: 0, expiresAt: '', isActive: true,
  },
  {
    id: 2, code: 'PIZZA20', type: 'percent', value: 20, minOrder: 800,
    maxUses: 500, usedCount: 0, expiresAt: '', isActive: true,
  },
  {
    id: 3, code: 'VIP500', type: 'fixed', value: 500, minOrder: 3000,
    maxUses: 50, usedCount: 0, expiresAt: '', isActive: true,
  },
];

// ─── Рассылки ───────────────────────────────────────────────
export const campaigns: Campaign[] = [];

// ─── Цвета категорий ────────────────────────────────────────
export const categoryColors: Record<number, string> = {
  1: 'from-orange-500 to-red-500',
  2: 'from-red-500 to-yellow-500',
  3: 'from-pink-500 to-purple-500',
  4: 'from-green-500 to-emerald-500',
  5: 'from-amber-500 to-orange-500',
  6: 'from-yellow-500 to-amber-500',
  7: 'from-pink-400 to-rose-500',
  8: 'from-blue-500 to-cyan-500',
  9: 'from-yellow-400 to-orange-400',
  10: 'from-red-600 to-orange-600',
};

// ─── Утилиты дат ────────────────────────────────────────────
export const formatLocalDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

export const DAY_NAMES_FULL = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
export const DAY_NAMES_SHORT = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

export const defaultSettings = {
  networkName: 'FoodChain',
  logoUrl: '',
  phone: '+7 (800) 123-45-67',
  socials: { telegram: '@foodchain', instagram: '@foodchain.ru', vk: 'foodchain' },
  deliveryEnabled: true, bookingEnabled: true, loyaltyEnabled: true,
  theme: 'auto' as const,
  welcomeMessage: 'Добро пожаловать в FoodChain! 🍔🍕🍣',
  errorMessage: 'Произошла ошибка. Попробуйте позже.',
};
