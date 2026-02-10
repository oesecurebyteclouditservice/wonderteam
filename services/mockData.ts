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

// Data inspired by the CSV provided in context
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    reference: '069',
    name: 'ACQUA DI SALE',
    brand: 'PROFUMUM ROMA',
    category: 'HOMME',
    price_public: 69.00,
    price_cost: 34.50,
    stock_quantity: 5,
    alert_threshold: 2,
    image_url: 'https://picsum.photos/400/400?random=1',
    is_active: true
  },
  {
    id: 'p2',
    reference: '042',
    name: 'LA VIE EST BELLE',
    brand: 'LANCOME',
    category: 'FEMME',
    price_public: 85.00,
    price_cost: 42.00,
    stock_quantity: 12,
    alert_threshold: 3,
    image_url: 'https://picsum.photos/400/400?random=2',
    is_active: true
  },
  {
    id: 'p3',
    reference: '142',
    name: 'OMBRE LEATHER',
    brand: 'TOM FORD',
    category: 'MIXTES LUXES',
    price_public: 142.00,
    price_cost: 71.00,
    stock_quantity: 2,
    alert_threshold: 2,
    image_url: 'https://picsum.photos/400/400?random=3',
    is_active: true
  },
  {
    id: 'p4',
    reference: '047',
    name: 'CRYSTAL NOIR',
    brand: 'VERSACE',
    category: 'FEMME',
    price_public: 47.00,
    price_cost: 23.50,
    stock_quantity: 8,
    alert_threshold: 2,
    image_url: 'https://picsum.photos/400/400?random=4',
    is_active: true
  },
  {
    id: 'p5',
    reference: '130',
    name: 'MEGAMARE',
    brand: 'ORTO PARISI',
    category: 'LUXURY MIXTES',
    price_public: 130.00,
    price_cost: 65.00,
    stock_quantity: 0,
    alert_threshold: 2,
    image_url: 'https://picsum.photos/400/400?random=5',
    is_active: true
  },
  {
    id: 'p6',
    reference: '123',
    name: 'GOOD GIRL GONE BAD',
    brand: 'KILLIAN',
    category: 'LUXURY FEMME',
    price_public: 123.00,
    price_cost: 61.50,
    stock_quantity: 4,
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
