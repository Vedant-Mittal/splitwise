import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, Expense, Person, Group, Settlement, Category, Currency } from './types';
import { 
  calculateBalances, 
  generateId, 
  loadFromLocalStorage, 
  saveToLocalStorage,
  getDefaultCategories,
  getDefaultCurrencies
} from './utils';

const initialState: AppState = {
  people: [],
  expenses: [],
  settlements: [],
  groups: [],
  categories: getDefaultCategories(),
  currencies: getDefaultCurrencies(),
  selectedCurrency: 'INR', // Default to Indian Rupee
  selectedGroup: null,
  balances: { 'all': {} },
  darkMode: false,
};

interface AppContextType {
  state: AppState;
  addPerson: (name: string) => void;
  removePerson: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  removeExpense: (id: string) => void;
  updateExpense: (expense: Expense) => void;
  addGroup: (group: Omit<Group, 'id' | 'date'>) => void;
  removeGroup: (id: string) => void;
  updateGroup: (group: Group) => void;
  addSettlement: (settlement: Omit<Settlement, 'id' | 'date'>) => void;
  removeSettlement: (id: string) => void;
  addCategory: (name: string) => void;
  removeCategory: (id: string) => void;
  setSelectedCurrency: (currencyCode: string) => void;
  setSelectedGroup: (groupId: string | null) => void;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(initialState);

  // Load state from local storage on initial render
  useEffect(() => {
    const savedState = loadFromLocalStorage();
    if (savedState) {
      // Ensure we have the latest default categories and currencies
      const updatedState = {
        ...savedState,
        categories: [
          ...getDefaultCategories().filter(cat => 
            !savedState.categories?.some?.(c => c.id === cat.id)
          ),
          ...(savedState.categories || [])
        ],
        currencies: [
          ...getDefaultCurrencies().filter(curr => 
            !savedState.currencies?.some?.(c => c.code === curr.code)
          ),
          ...(savedState.currencies || [])
        ]
      };
      setState(updatedState);
    }
    
    // Check for system dark mode preference
    if (typeof window !== 'undefined' && 
        window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setState(prev => ({ ...prev, darkMode: true }));
    }
  }, []);

  // Save state to local storage whenever it changes
  useEffect(() => {
    saveToLocalStorage(state);
    
    // Apply dark mode class to body
    if (typeof document !== 'undefined') {
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [state]);

  // Recalculate balances whenever expenses, settlements, people, or currency changes
  useEffect(() => {
    const newBalances = calculateBalances(
      state.people, 
      state.expenses, 
      state.settlements,
      state.currencies,
      state.selectedCurrency
    );
    
    setState(prev => ({
      ...prev,
      balances: newBalances
    }));
  }, [
    state.people, 
    state.expenses, 
    state.settlements, 
    state.currencies, 
    state.selectedCurrency
  ]);

  // Add a new person
  const addPerson = (name: string) => {
    const newPerson: Person = {
      id: generateId(),
      name,
    };
    
    setState(prevState => ({
      ...prevState,
      people: [...prevState.people, newPerson],
    }));
  };

  // Remove a person
  const removePerson = (id: string) => {
    setState(prevState => {
      // Filter out expenses that involve this person
      const newExpenses = prevState.expenses.filter(expense => {
        if (expense.paidBy === id) return false;
        
        const involvesPerson = expense.splitAmong.some(split => split.personId === id);
        return !involvesPerson;
      });
      
      // Filter out settlements that involve this person
      const newSettlements = prevState.settlements.filter(settlement => 
        settlement.fromPersonId !== id && settlement.toPersonId !== id
      );
      
      // Remove person from groups
      const newGroups = prevState.groups.map(group => ({
        ...group,
        members: group.members.filter(memberId => memberId !== id)
      }));
      
      return {
        ...prevState,
        people: prevState.people.filter(person => person.id !== id),
        expenses: newExpenses,
        settlements: newSettlements,
        groups: newGroups,
      };
    });
  };

  // Add a new expense
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
    };
    
    setState(prevState => ({
      ...prevState,
      expenses: [...prevState.expenses, newExpense],
    }));
  };

  // Remove an expense
  const removeExpense = (id: string) => {
    setState(prevState => ({
      ...prevState,
      expenses: prevState.expenses.filter(expense => expense.id !== id),
    }));
  };

  // Update an expense
  const updateExpense = (updatedExpense: Expense) => {
    setState(prevState => ({
      ...prevState,
      expenses: prevState.expenses.map(expense => 
        expense.id === updatedExpense.id ? updatedExpense : expense
      ),
    }));
  };

  // Add a new group
  const addGroup = (group: Omit<Group, 'id' | 'date'>) => {
    const newGroup: Group = {
      ...group,
      id: generateId(),
      date: new Date().toISOString(),
    };
    
    setState(prevState => ({
      ...prevState,
      groups: [...prevState.groups, newGroup],
    }));
  };

  // Remove a group
  const removeGroup = (id: string) => {
    setState(prevState => {
      // Update expenses that belong to this group
      const newExpenses = prevState.expenses.map(expense => 
        expense.groupId === id ? { ...expense, groupId: undefined } : expense
      );
      
      // Update settlements that belong to this group
      const newSettlements = prevState.settlements.map(settlement => 
        settlement.groupId === id ? { ...settlement, groupId: undefined } : settlement
      );
      
      return {
        ...prevState,
        groups: prevState.groups.filter(group => group.id !== id),
        expenses: newExpenses,
        settlements: newSettlements,
        selectedGroup: prevState.selectedGroup === id ? null : prevState.selectedGroup,
      };
    });
  };

  // Update a group
  const updateGroup = (updatedGroup: Group) => {
    setState(prevState => ({
      ...prevState,
      groups: prevState.groups.map(group => 
        group.id === updatedGroup.id ? updatedGroup : group
      ),
    }));
  };

  // Add a new settlement
  const addSettlement = (settlement: Omit<Settlement, 'id' | 'date'>) => {
    const newSettlement: Settlement = {
      ...settlement,
      id: generateId(),
      date: new Date().toISOString(),
    };
    
    setState(prevState => ({
      ...prevState,
      settlements: [...prevState.settlements, newSettlement],
    }));
  };

  // Remove a settlement
  const removeSettlement = (id: string) => {
    setState(prevState => ({
      ...prevState,
      settlements: prevState.settlements.filter(settlement => settlement.id !== id),
    }));
  };

  // Add a new category
  const addCategory = (name: string) => {
    const newCategory: Category = {
      id: generateId(),
      name,
      isCustom: true,
    };
    
    setState(prevState => ({
      ...prevState,
      categories: [...prevState.categories, newCategory],
    }));
  };

  // Remove a category
  const removeCategory = (id: string) => {
    setState(prevState => {
      // Update expenses that use this category
      const newExpenses = prevState.expenses.map(expense => 
        expense.categoryId === id ? { ...expense, categoryId: 'other' } : expense
      );
      
      return {
        ...prevState,
        categories: prevState.categories.filter(category => 
          category.id !== id || !category.isCustom
        ),
        expenses: newExpenses,
      };
    });
  };

  // Set selected currency
  const setSelectedCurrency = (currencyCode: string) => {
    setState(prevState => ({
      ...prevState,
      selectedCurrency: currencyCode,
    }));
  };

  // Set selected group
  const setSelectedGroup = (groupId: string | null) => {
    setState(prevState => ({
      ...prevState,
      selectedGroup: groupId,
    }));
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setState(prevState => ({
      ...prevState,
      darkMode: !prevState.darkMode,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        addPerson,
        removePerson,
        addExpense,
        removeExpense,
        updateExpense,
        addGroup,
        removeGroup,
        updateGroup,
        addSettlement,
        removeSettlement,
        addCategory,
        removeCategory,
        setSelectedCurrency,
        setSelectedGroup,
        toggleDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 