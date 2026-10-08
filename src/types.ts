export type ItineraryItem = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h) or '' for no set time
  title: string;
  location: string;
  notes: string;
};

export const EXPENSE_CATEGORIES = [
  'Transport',
  'Lodging',
  'Food',
  'Activities',
  'Shopping',
  'Other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
};

export const PACKING_CATEGORIES = [
  'Clothing',
  'Toiletries',
  'Documents',
  'Electronics',
  'Other',
] as const;
export type PackingCategory = (typeof PACKING_CATEGORIES)[number];

export type PackingItem = {
  id: string;
  name: string;
  category: PackingCategory;
  packed: boolean;
};

export const GUIDE_CATEGORIES = [
  'Must-see',
  'Food & drink',
  'Getting around',
  'Tips',
] as const;
export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

export type GuideEntry = {
  id: string;
  category: GuideCategory;
  title: string;
  details: string;
};

export type Trip = {
  id: string;
  name: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  budget: number;
  currency: string;
  notes: string;
  itinerary: ItineraryItem[];
  expenses: Expense[];
  packing: PackingItem[];
  guide: GuideEntry[];
  createdAt: number;
};

export type TripDetails = Pick<
  Trip,
  'name' | 'destination' | 'startDate' | 'endDate' | 'budget' | 'currency'
>;
