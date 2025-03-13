import { AppState, Expense, Person, Settlement, Currency, CategoryTotal, Category } from './types';

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Format currency
export const formatCurrency = (amount: number, currencyCode: string, currencies: Currency[]): string => {
  const currency = currencies.find(c => c.code === currencyCode) || 
    { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 1 };
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    currencyDisplay: 'symbol',
  }).format(amount);
};

// Convert amount from one currency to another
export const convertCurrency = (
  amount: number, 
  fromCurrency: string, 
  toCurrency: string, 
  currencies: Currency[]
): number => {
  const fromRate = currencies.find(c => c.code === fromCurrency)?.exchangeRate || 1;
  const toRate = currencies.find(c => c.code === toCurrency)?.exchangeRate || 1;
  
  // Convert to base currency, then to target currency
  return (amount / fromRate) * toRate;
};

// Calculate balances between people, considering groups and settlements
export const calculateBalances = (
  people: Person[], 
  expenses: Expense[], 
  settlements: Settlement[],
  currencies: Currency[],
  selectedCurrency: string
): Record<string, Record<string, Record<string, number>>> => {
  // Initialize balances structure: groupId -> fromPerson -> toPerson -> amount
  const balances: Record<string, Record<string, Record<string, number>>> = {
    'all': {} // Special group ID for overall balances
  };
  
  // Initialize balances for all people
  people.forEach(person => {
    if (!balances['all'][person.id]) {
      balances['all'][person.id] = {};
    }
    
    people.forEach(otherPerson => {
      if (person.id !== otherPerson.id) {
        balances['all'][person.id][otherPerson.id] = 0;
      }
    });
  });
  
  // Process expenses
  expenses.forEach(expense => {
    const paidBy = expense.paidBy;
    const groupId = expense.groupId || 'no-group';
    
    // Ensure group exists in balances
    if (!balances[groupId]) {
      balances[groupId] = {};
      
      // Initialize group balances for all people
      people.forEach(person => {
        balances[groupId][person.id] = {};
        people.forEach(otherPerson => {
          if (person.id !== otherPerson.id) {
            balances[groupId][person.id][otherPerson.id] = 0;
          }
        });
      });
    }
    
    // Process each split
    expense.splitAmong.forEach(split => {
      if (split.personId !== paidBy) {
        // Convert amount to selected currency
        const convertedAmount = convertCurrency(
          split.amount, 
          expense.currency, 
          selectedCurrency, 
          currencies
        );
        
        // Update group balance
        balances[groupId][paidBy][split.personId] = 
          (balances[groupId][paidBy][split.personId] || 0) + convertedAmount;
        balances[groupId][split.personId][paidBy] = 
          (balances[groupId][split.personId][paidBy] || 0) - convertedAmount;
        
        // Update overall balance
        balances['all'][paidBy][split.personId] = 
          (balances['all'][paidBy][split.personId] || 0) + convertedAmount;
        balances['all'][split.personId][paidBy] = 
          (balances['all'][split.personId][paidBy] || 0) - convertedAmount;
      }
    });
  });
  
  // Process settlements
  settlements.forEach(settlement => {
    const fromPerson = settlement.fromPersonId;
    const toPerson = settlement.toPersonId;
    const groupId = settlement.groupId || 'no-group';
    
    // Convert settlement amount to selected currency
    const convertedAmount = convertCurrency(
      settlement.amount, 
      settlement.currency, 
      selectedCurrency, 
      currencies
    );
    
    // Update group balance if the group exists in balances
    if (balances[groupId]) {
      // When fromPerson pays toPerson, it reduces what fromPerson owes to toPerson
      balances[groupId][fromPerson][toPerson] = 
        (balances[groupId][fromPerson][toPerson] || 0) + convertedAmount;
      balances[groupId][toPerson][fromPerson] = 
        (balances[groupId][toPerson][fromPerson] || 0) - convertedAmount;
    }
    
    // Always update overall balance
    balances['all'][fromPerson][toPerson] = 
      (balances['all'][fromPerson][toPerson] || 0) + convertedAmount;
    balances['all'][toPerson][fromPerson] = 
      (balances['all'][toPerson][fromPerson] || 0) - convertedAmount;
  });
  
  // Simplify balances (if A owes B and B owes A, we can simplify)
  Object.keys(balances).forEach(groupId => {
    people.forEach(person => {
      people.forEach(otherPerson => {
        if (person.id !== otherPerson.id) {
          if (balances[groupId]?.[person.id]?.[otherPerson.id] > 0 && 
              balances[groupId]?.[otherPerson.id]?.[person.id] > 0) {
            // Both owe each other, so we can simplify
            if (balances[groupId][person.id][otherPerson.id] > balances[groupId][otherPerson.id][person.id]) {
              balances[groupId][person.id][otherPerson.id] -= balances[groupId][otherPerson.id][person.id];
              balances[groupId][otherPerson.id][person.id] = 0;
            } else {
              balances[groupId][otherPerson.id][person.id] -= balances[groupId][person.id][otherPerson.id];
              balances[groupId][person.id][otherPerson.id] = 0;
            }
          }
        }
      });
    });
  });
  
  return balances;
};

// Get total balance for a person in a specific group
export const getTotalBalance = (
  personId: string, 
  groupId: string | null,
  balances: Record<string, Record<string, Record<string, number>>>
): number => {
  const groupToCheck = groupId || 'all';
  let total = 0;
  
  if (!balances[groupToCheck] || !balances[groupToCheck][personId]) {
    return 0;
  }
  
  // Sum up all the money this person is owed
  Object.keys(balances[groupToCheck]).forEach(fromPersonId => {
    if (fromPersonId !== personId && 
        balances[groupToCheck][fromPersonId][personId] < 0) {
      total += Math.abs(balances[groupToCheck][fromPersonId][personId]);
    }
  });
  
  // Subtract all the money this person owes
  Object.keys(balances[groupToCheck][personId] || {}).forEach(toPersonId => {
    if (balances[groupToCheck][personId][toPersonId] < 0) {
      total -= Math.abs(balances[groupToCheck][personId][toPersonId]);
    }
  });
  
  return total;
};

// Get category totals for a group
export const getCategoryTotals = (
  expenses: Expense[],
  groupId: string | null,
  currencies: Currency[],
  selectedCurrency: string
): CategoryTotal[] => {
  const categoryTotals: Record<string, number> = {};
  
  expenses
    .filter(expense => !groupId || expense.groupId === groupId)
    .forEach(expense => {
      const convertedAmount = convertCurrency(
        expense.amount,
        expense.currency,
        selectedCurrency,
        currencies
      );
      
      categoryTotals[expense.categoryId] = 
        (categoryTotals[expense.categoryId] || 0) + convertedAmount;
    });
  
  return Object.keys(categoryTotals).map(categoryId => ({
    categoryId,
    amount: categoryTotals[categoryId],
    currency: selectedCurrency
  }));
};

// Get default categories
export const getDefaultCategories = (): Category[] => {
  return [
    { id: 'food', name: 'Food', isCustom: false },
    { id: 'transportation', name: 'Transportation', isCustom: false },
    { id: 'accommodation', name: 'Accommodation', isCustom: false },
    { id: 'entertainment', name: 'Entertainment', isCustom: false },
    { id: 'shopping', name: 'Shopping', isCustom: false },
    { id: 'utilities', name: 'Utilities', isCustom: false },
    { id: 'health', name: 'Health', isCustom: false },
    { id: 'other', name: 'Other', isCustom: false }
  ];
};

// Get default currencies
export const getDefaultCurrencies = (): Currency[] => {
  return [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', exchangeRate: 1 },
    { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 0.012 },
    { code: 'EUR', symbol: '€', name: 'Euro', exchangeRate: 0.011 },
    { code: 'GBP', symbol: '£', name: 'British Pound', exchangeRate: 0.0095 },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', exchangeRate: 1.83 }
  ];
};

// Save app state to local storage
export const saveToLocalStorage = (state: AppState): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('splitwise-state', JSON.stringify(state));
  }
};

// Load app state from local storage
export const loadFromLocalStorage = (): AppState | null => {
  if (typeof window !== 'undefined') {
    const savedState = localStorage.getItem('splitwise-state');
    if (savedState) {
      return JSON.parse(savedState);
    }
  }
  return null;
}; 