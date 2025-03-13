export interface Person {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  isCustom?: boolean;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number; // Relative to base currency (e.g., USD or INR)
}

export interface Settlement {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  amount: number;
  currency: string;
  date: string;
  groupId?: string; // Optional: if settlement is specific to a group
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string; // Currency code
  paidBy: string; // Person ID
  date: string;
  categoryId: string;
  groupId?: string; // Optional: if expense belongs to a group
  splitAmong: {
    personId: string;
    amount: number;
  }[];
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // Array of Person IDs
  description?: string;
  date: string;
}

export interface Balance {
  personId: string;
  amount: number; // Positive means they are owed money, negative means they owe money
  currency: string;
}

export interface CategoryTotal {
  categoryId: string;
  amount: number;
  currency: string;
}

export interface AppState {
  people: Person[];
  expenses: Expense[];
  settlements: Settlement[];
  groups: Group[];
  categories: Category[];
  currencies: Currency[];
  selectedCurrency: string;
  selectedGroup: string | null; // null means "All groups" or "No group"
  balances: Record<string, Record<string, Record<string, number>>>; // GroupId -> From person ID -> To person ID -> Amount
  darkMode: boolean;
} 