import { Product, Client, Order, Profile } from '../types';

export const MOCK_PROFILE: Profile = {
  id: 'user_123',
  email: 'oe.securebytecloud.itservice@gmail.com',
  full_name: 'Sophie (Wonder Team)',
  role: 'vdi',
  team_name: 'Les Ambassadrices',
  avatar_url: 'https://picsum.photos/200/200',
  sponsor: 'Clara Delavie',
  recruits: [
      { id: 'r1', name: 'Julie Dupont', join_date: '2023-01-15' },
      { id: 'r2', name: 'Manon Lescaut', join_date: '2023-03-22' }
  ]
};

// Data inspired by the CSV provided in context (updated to match new structure)
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'ACQUA DI SALE',
    brand: 'PROFUMUM ROMA',
    category: 'HOMME',
    cat_70ml: '69',
    price_15ml: 0,
    price_30ml: 0,
    price_70ml: 69.00,
    stock_total: 5,
    stock_15ml: 0,
    stock_30ml: 2,
    stock_70ml: 3,
    alert_threshold: 2,
    image_url: 'https://picsum.photos/400/400?random=1',
    is_active: true
  },
  {
    id: 'p2',
    name: 'LA VIE EST BELLE',
    brand: 'LANCOME',
    category: 'FEMME',
    cat_70ml: '42',
    price_15ml: 11.90,
    price_30ml: 18.00,
    price_70ml: 35.00,
    stock_total: 12,
    stock_15ml: 4,
    stock_30ml: 3,
    stock_70ml: 5,
    alert_threshold: 3,
    image_url: 'https://picsum.photos/400/400?random=2',
    is_active: true
  },
  {
    id: 'p3',
    name: 'OMBRE LEATHER',
    brand: 'TOM FORD',
    category: 'MIXTES LUXES',
    cat_70ml: '142',
    price_15ml: 0,
    price_30ml: 0,
    price_70ml: 57.00,
    stock_total: 2,
    stock_15ml: 0,
    stock_30ml: 0,
    stock_70ml: 2,
    alert_threshold: 2,
    image_url: 'https://picsum.photos/400/400?random=3',
    is_active: true
  },
  {
    id: 'p4',
    name: 'CRYSTAL NOIR',
    brand: 'VERSACE',
    category: 'FEMME',
    cat_70ml: '47',
    price_15ml: 0,
    price_30ml: 0,
    price_70ml: 0,
    stock_total: 8,
    stock_15ml: 3,
    stock_30ml: 2,
    stock_70ml: 3,
    alert_threshold: 2,
    image_url: 'https://picsum.photos/400/400?random=4',
    is_active: true
  },
  {
    id: 'p5',
    name: 'MEGAMARE',
    brand: 'ORTO PARISI',
    category: 'LUXURY MIXTES',
    cat_70ml: '130',
    price_15ml: 0,
    price_30ml: 0,
    price_70ml: 65.00,
    stock_total: 0,
    stock_15ml: 0,
    stock_30ml: 0,
    stock_70ml: 0,
    alert_threshold: 2,
    image_url: 'https://picsum.photos/400/400?random=5',
    is_active: true
  },
  {
    id: 'p6',
    name: 'GOOD GIRL GONE BAD',
    brand: 'KILLIAN',
    category: 'LUXURY FEMME',
    cat_70ml: '123',
    price_15ml: 0,
    price_30ml: 0,
    price_70ml: 52.00,
    stock_total: 4,
    stock_15ml: 1,
    stock_30ml: 1,
    stock_70ml: 2,
    alert_threshold: 2,
    image_url: 'https://picsum.photos/400/400?random=6',
    is_active: true
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    full_name: 'Julie Martin',
    email: 'julie.m@example.com',
    phone: '06 12 34 56 78',
    status: 'vip',
    last_purchase_date: '2023-11-15',
    notes: 'Aime les parfums floraux. Anniversaire en Mars.',
    user_id: 'user_123',
    address: '12 Rue de la Paix',
    city: 'Paris',
    postal_code: '75002',
    preferred_contact: 'email',
    loyalty_points: 150,
    total_spent: 450.00,
    is_active: true
  },
  {
    id: 'c2',
    full_name: 'Thomas Bernard',
    email: 'thomas.b@example.com',
    phone: '06 98 76 54 32',
    status: 'active',
    last_purchase_date: '2023-10-20',
    notes: 'Client regulier pour cadeaux.',
    user_id: 'user_123',
    address: '5 Avenue Victor Hugo',
    city: 'Lyon',
    postal_code: '69001',
    preferred_contact: 'phone',
    loyalty_points: 80,
    total_spent: 215.00,
    is_active: true
  },
  {
    id: 'c3',
    full_name: 'Sarah Dubos',
    email: 'sarah.d@example.com',
    phone: '07 55 44 33 22',
    status: 'new',
    notes: 'Rencontree lors de la reunion du 15.',
    user_id: 'user_123',
    preferred_contact: 'sms',
    loyalty_points: 0,
    total_spent: 0,
    is_active: true
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_1',
    client_id: 'c1',
    total_amount: 127.00,
    profit: 63.50,
    status: 'delivered',
    payment_status: 'paid',
    created_at: '2023-11-15T10:30:00Z',
    items: [
        { product_id: 'p2', product_name: 'LA VIE EST BELLE', quantity: 1, unit_price: 85.00, subtotal: 85.00 },
        { product_id: 'p4', product_name: 'CRYSTAL NOIR', quantity: 1, unit_price: 47.00, subtotal: 47.00 }
    ]
  },
  {
    id: 'ord_2',
    client_id: 'c2',
    total_amount: 85.00,
    profit: 42.00,
    status: 'shipped',
    payment_status: 'paid',
    created_at: '2023-10-20T14:15:00Z',
    items: [
        { product_id: 'p2', product_name: 'LA VIE EST BELLE', quantity: 1, unit_price: 85.00, subtotal: 85.00 }
    ]
  }
];

export const INITIAL_TRANSACTIONS = [
  {
    id: 'tx_1',
    transaction_type: 'sale',
    amount: 127.00,
    description: 'Commande ord_1',
    category: 'order',
    payment_method: 'card',
    order_id: 'ord_1',
    created_by: 'user_123',
    created_at: '2023-11-15T10:30:00Z'
  },
  {
    id: 'tx_2',
    transaction_type: 'sale',
    amount: 85.00,
    description: 'Commande ord_2',
    category: 'order',
    payment_method: 'card',
    order_id: 'ord_2',
    created_by: 'user_123',
    created_at: '2023-10-20T14:15:00Z'
  }
];
