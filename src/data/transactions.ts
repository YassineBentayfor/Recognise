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
  {
    id: 'tx-tfl', merchant: 'TFL TRAVEL CH', descriptor: 'TFL TRAVEL CH', amount: 8.50,
    currency: 'EUR', date: '19 Sep 2026', time: '18:44', category: 'Transport',
    cardLastFour: '4821', status: 'Completed', icon: 'train-outline', iconTone: 'blue',
    canonicalMerchant: 'Transport for London', cardPresent: false, risk: 'low', scenario: 'recurring',
    history: [
      { id: 'tfl-1', date: '18 Sep', amount: 8.50, status: 'Completed' },
      { id: 'tfl-2', date: '17 Sep', amount: 6.70, status: 'Completed' },
    ],
  },
  {
    id: 'tx-amazon', merchant: 'AMZN MKTP UK', descriptor: 'AMZN MKTP UK*4D82', amount: 39.99,
    currency: 'EUR', date: '18 Sep 2026', time: '14:09', category: 'Shopping',
    cardLastFour: '4821', status: 'Completed', icon: 'cart-outline', iconTone: 'orange',
    canonicalMerchant: 'Amazon', cardPresent: false, risk: 'low', scenario: 'recurring',
    history: [{ id: 'amz-1', date: '02 Sep', amount: 21.49, status: 'Completed' }],
  },
  {
    id: 'tx-pret', merchant: 'Pret A Manger', descriptor: 'PRET A MANGER 184', amount: 7.65,
    currency: 'EUR', date: '18 Sep 2026', time: '08:17', category: 'Restaurants',
    cardLastFour: '4821', status: 'Completed', icon: 'cafe-outline', iconTone: 'red',
    canonicalMerchant: 'Pret A Manger', location: 'London, GB', cardPresent: true,
    risk: 'low', scenario: 'recurring', history: [],
  },
  {
    id: 'tx-netflix', merchant: 'NETFLIX.COM', descriptor: 'NETFLIX.COM 866-579', amount: 17.99,
    currency: 'EUR', date: '16 Sep 2026', time: '05:02', category: 'Entertainment',
    cardLastFour: '4821', status: 'Completed', icon: 'play', iconTone: 'black',
    canonicalMerchant: 'Netflix', cardPresent: false, risk: 'low', scenario: 'recurring',
    history: [
      { id: 'net-1', date: '16 Jul', amount: 17.99, status: 'Completed' },
      { id: 'net-2', date: '16 Aug', amount: 17.99, status: 'Completed' },
    ],
  },
  {
    id: 'tx-booking', merchant: 'BOOKING.COM', descriptor: 'BOOKING.COM HOTEL', amount: 214.00,
    currency: 'EUR', date: '15 Sep 2026', time: '20:31', category: 'Travel',
    cardLastFour: '4821', status: 'Pending', icon: 'airplane-outline', iconTone: 'purple',
    canonicalMerchant: 'Booking.com', cardPresent: false, risk: 'medium', scenario: 'recurring', history: [],
  },
  {
    id: 'tx-broadband', merchant: 'CITYFIBRE BILLING', descriptor: 'CITYFIBRE BILLING', amount: 31.00,
    currency: 'EUR', date: '14 Sep 2026', time: '06:15', category: 'Bills',
    cardLastFour: '4821', status: 'Completed', icon: 'wifi-outline', iconTone: 'green',
    canonicalMerchant: 'CityFibre', cardPresent: false, risk: 'low', scenario: 'recurring',
    history: [
      { id: 'city-1', date: '14 Jul', amount: 31.00, status: 'Completed' },
      { id: 'city-2', date: '14 Aug', amount: 31.00, status: 'Completed' },
    ],
  },
];

export const getTransaction = (id: string) => transactions.find((item) => item.id === id);

export const formatMoney = (amount: number, sign = true) => `${sign ? '−' : ''}€${amount.toFixed(2)}`;
