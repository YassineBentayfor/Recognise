export type TransactionStatus = 'Completed' | 'Reverted' | 'Pending';
export type RiskLevel = 'low' | 'medium' | 'high';

export type HistoryItem = {
  id: string;
  date: string;
  amount: number;
  status: TransactionStatus;
};

export type Transaction = {
  id: string;
  merchant: string;
  descriptor: string;
  amount: number;
  currency: 'EUR';
  date: string;
  time: string;
  category: string;
  cardLastFour: string;
  status: TransactionStatus;
  icon: string;
  iconTone: 'blue' | 'black' | 'orange' | 'green' | 'purple' | 'red';
  canonicalMerchant?: string;
  location?: string;
  cardPresent: boolean;
  history: HistoryItem[];
  related?: HistoryItem[];
  risk: RiskLevel;
  scenario: 'recurring' | 'reverted_duplicate' | 'unknown';
};

export const transactions: Transaction[] = [
  {
    id: 'tx-spotify', merchant: 'ABC*DIGITAL LUX', descriptor: 'ABC*DIGITAL LUX',
    canonicalMerchant: 'Spotify', amount: 47.82, currency: 'EUR', date: '24 Sep 2026',
    time: '10:41', category: 'Entertainment', cardLastFour: '4821', status: 'Completed',
    icon: 'musical-notes', iconTone: 'green', cardPresent: false, risk: 'low', scenario: 'recurring',
    history: [
      { id: 'h1', date: '24 Jun', amount: 47.82, status: 'Completed' },
      { id: 'h2', date: '24 Jul', amount: 47.82, status: 'Completed' },
      { id: 'h3', date: '24 Aug', amount: 47.82, status: 'Completed' },
    ],
  },
  {
    id: 'tx-hotel', merchant: 'HOTEL PARIS', descriptor: 'HOTEL PARIS 08', amount: 92.40,
    currency: 'EUR', date: '21 Sep 2026', time: '23:18', category: 'Travel',
    cardLastFour: '4821', status: 'Completed', icon: 'bed', iconTone: 'red', location: 'Paris, FR',
    cardPresent: false, risk: 'high', scenario: 'unknown', history: [],
  },
  {
    id: 'tx-uber', merchant: 'Uber', descriptor: 'UBER *TRIP', amount: 18.40, currency: 'EUR',
    date: '23 Sep 2026', time: '19:12', category: 'Transport', cardLastFour: '4821',
    status: 'Completed', icon: 'car', iconTone: 'black', canonicalMerchant: 'Uber',
    cardPresent: false, risk: 'low', scenario: 'recurring', history: [
      { id: 'u1', date: '12 Sep', amount: 14.20, status: 'Completed' },
      { id: 'u2', date: '04 Sep', amount: 21.10, status: 'Completed' },
    ],
  },
  {
    id: 'tx-market', merchant: 'Carrefour', descriptor: 'CARREFOUR CITY 149', amount: 46.70,
    currency: 'EUR', date: '23 Sep 2026', time: '17:06', category: 'Groceries',
    cardLastFour: '4821', status: 'Completed', icon: 'basket', iconTone: 'blue',
    canonicalMerchant: 'Carrefour', cardPresent: true, risk: 'low', scenario: 'recurring', history: [],
  },
  {
    id: 'tx-duplicate', merchant: 'Brew House', descriptor: 'BREW HOUSE LDN', amount: 6.80,
    currency: 'EUR', date: '22 Sep 2026', time: '08:32', category: 'Restaurants',
    cardLastFour: '4821', status: 'Completed', icon: 'cafe', iconTone: 'orange',
    canonicalMerchant: 'Brew House', cardPresent: true, risk: 'low', scenario: 'reverted_duplicate',
    history: [], related: [{ id: 'r1', date: '22 Sep', amount: 6.80, status: 'Reverted' }],
  },
  {
    id: 'tx-apple', merchant: 'Apple', descriptor: 'APPLE.COM/BILL', amount: 12.99,
    currency: 'EUR', date: '20 Sep 2026', time: '09:02', category: 'Digital services',
    cardLastFour: '4821', status: 'Completed', icon: 'logo-apple', iconTone: 'purple',
    canonicalMerchant: 'Apple', cardPresent: false, risk: 'low', scenario: 'recurring', history: [],
  },
];

export const getTransaction = (id: string) => transactions.find((item) => item.id === id);

export const formatMoney = (amount: number, sign = true) => `${sign ? '−' : ''}€${amount.toFixed(2)}`;
