'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useApi } from './hooks/useApi';
import { calculateBalances } from './utils';
import { AppState } from './types';

// Initial state with empty arrays
const initialState: AppState = {
  people: [],
  expenses: [],
  settlements: [],
  groups: [],
  categories: [],
  currencies: [],
  selectedCurrency: 'INR',
  selectedGroup: null,
  balances: { 'all': {} },
  darkMode: false,
};

interface DbContextType {
  state: AppState;
  loading: boolean;
  error: Error | null;
  addPerson: (name: string) => Promise<void>;
  removePerson: (id: string) => Promise<void>;
  addExpense: (expense: any) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  updateExpense: (expense: any) => Promise<void>;
  addGroup: (group: any) => Promise<void>;
  removeGroup: (id: string) => Promise<void>;
  updateGroup: (group: any) => Promise<void>;
  addSettlement: (settlement: any) => Promise<void>;
  removeSettlement: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  setSelectedCurrency: (currencyCode: string) => void;
  setSelectedGroup: (groupId: string | null) => void;
  toggleDarkMode: () => void;
  refreshData: () => Promise<void>;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export const DbProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const api = useApi();

  // Load data from API on initial render
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load all data in parallel
      const [people, expenses, groups, settlements, categories, currencies] = await Promise.all([
        api.people.getAll(),
        api.expenses.getAll(),
        api.groups.getAll(),
        api.settlements.getAll(),
        api.categories.getAll(),
        api.currencies.getAll(),
      ]);
      
      // Get user settings from local storage (or could be from API)
      const userSettings = localStorage.getItem('userSettings');
      const settings = userSettings ? JSON.parse(userSettings) : {
        selectedCurrency: 'INR',
        selectedGroup: null,
        darkMode: false,
      };
      
      // Calculate balances
      const balances = calculateBalances(
        people, 
        expenses, 
        settlements,
        currencies,
        settings.selectedCurrency
      );
      
      // Update state with all data
      setState({
        people,
        expenses,
        groups,
        settlements,
        categories,
        currencies,
        selectedCurrency: settings.selectedCurrency,
        selectedGroup: settings.selectedGroup,
        balances,
        darkMode: settings.darkMode,
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    loadData();
    
    // Check for system dark mode preference
    if (typeof window !== 'undefined' && 
        window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setState(prev => ({ ...prev, darkMode: true }));
    }
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // Save user settings to local storage
    localStorage.setItem('userSettings', JSON.stringify({
      selectedCurrency: state.selectedCurrency,
      selectedGroup: state.selectedGroup,
      darkMode: state.darkMode,
    }));
  }, [state.darkMode, state.selectedCurrency, state.selectedGroup]);

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
  const addPerson = async (name: string) => {
    try {
      const newPerson = await api.people.create(name);
      setState(prev => ({
        ...prev,
        people: [...prev.people, newPerson],
      }));
    } catch (err) {
      console.error('Error adding person:', err);
      throw err;
    }
  };

  // Remove a person
  const removePerson = async (id: string) => {
    try {
      await api.people.delete(id);
      setState(prev => ({
        ...prev,
        people: prev.people.filter(person => person.id !== id),
        expenses: prev.expenses.filter(expense => {
          if (expense.paidBy === id) return false;
          
          // Check if the expense involves this person in any split
          const involvesPerson = expense.splitAmong?.some((split: any) => split.personId === id);
          return !involvesPerson;
        }),
        settlements: prev.settlements.filter(settlement => 
          settlement.fromPersonId !== id && settlement.toPersonId !== id
        ),
      }));
    } catch (err) {
      console.error('Error removing person:', err);
      throw err;
    }
  };

  // Add a new expense
  const addExpense = async (expense: any) => {
    try {
      const newExpense = await api.expenses.create(expense);
      setState(prev => ({
        ...prev,
        expenses: [...prev.expenses, newExpense],
      }));
    } catch (err) {
      console.error('Error adding expense:', err);
      throw err;
    }
  };

  // Remove an expense
  const removeExpense = async (id: string) => {
    try {
      await api.expenses.delete(id);
      setState(prev => ({
        ...prev,
        expenses: prev.expenses.filter(expense => expense.id !== id),
      }));
    } catch (err) {
      console.error('Error removing expense:', err);
      throw err;
    }
  };

  // Update an expense
  const updateExpense = async (updatedExpense: any) => {
    try {
      const expense = await api.expenses.update(updatedExpense.id, updatedExpense);
      setState(prev => ({
        ...prev,
        expenses: prev.expenses.map(exp => 
          exp.id === expense.id ? expense : exp
        ),
      }));
    } catch (err) {
      console.error('Error updating expense:', err);
      throw err;
    }
  };

  // Add a new group
  const addGroup = async (group: any) => {
    try {
      const newGroup = await api.groups.create(group);
      setState(prev => ({
        ...prev,
        groups: [...prev.groups, newGroup],
      }));
    } catch (err) {
      console.error('Error adding group:', err);
      throw err;
    }
  };

  // Remove a group
  const removeGroup = async (id: string) => {
    try {
      await api.groups.delete(id);
      setState(prev => ({
        ...prev,
        groups: prev.groups.filter(group => group.id !== id),
        expenses: prev.expenses.map(expense => 
          expense.groupId === id ? { ...expense, groupId: undefined } : expense
        ),
        settlements: prev.settlements.map(settlement => 
          settlement.groupId === id ? { ...settlement, groupId: undefined } : settlement
        ),
        selectedGroup: prev.selectedGroup === id ? null : prev.selectedGroup,
      }));
    } catch (err) {
      console.error('Error removing group:', err);
      throw err;
    }
  };

  // Update a group
  const updateGroup = async (updatedGroup: any) => {
    try {
      const group = await api.groups.update(updatedGroup.id, updatedGroup);
      setState(prev => ({
        ...prev,
        groups: prev.groups.map(g => 
          g.id === group.id ? group : g
        ),
      }));
    } catch (err) {
      console.error('Error updating group:', err);
      throw err;
    }
  };

  // Add a new settlement
  const addSettlement = async (settlement: any) => {
    try {
      const newSettlement = await api.settlements.create(settlement);
      setState(prev => ({
        ...prev,
        settlements: [...prev.settlements, newSettlement],
      }));
    } catch (err) {
      console.error('Error adding settlement:', err);
      throw err;
    }
  };

  // Remove a settlement
  const removeSettlement = async (id: string) => {
    try {
      await api.settlements.delete(id);
      setState(prev => ({
        ...prev,
        settlements: prev.settlements.filter(settlement => settlement.id !== id),
      }));
    } catch (err) {
      console.error('Error removing settlement:', err);
      throw err;
    }
  };

  // Add a new category
  const addCategory = async (name: string) => {
    try {
      const newCategory = await api.categories.create(name);
      setState(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory],
      }));
    } catch (err) {
      console.error('Error adding category:', err);
      throw err;
    }
  };

  // Remove a category
  const removeCategory = async (id: string) => {
    try {
      await api.categories.delete(id);
      setState(prev => ({
        ...prev,
        categories: prev.categories.filter(category => 
          category.id !== id || !category.isCustom
        ),
        expenses: prev.expenses.map(expense => 
          expense.categoryId === id ? { ...expense, categoryId: 'other' } : expense
        ),
      }));
    } catch (err) {
      console.error('Error removing category:', err);
      throw err;
    }
  };

  // Set selected currency
  const setSelectedCurrency = (currencyCode: string) => {
    setState(prev => ({
      ...prev,
      selectedCurrency: currencyCode,
    }));
  };

  // Set selected group
  const setSelectedGroup = (groupId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedGroup: groupId,
    }));
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setState(prev => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  };

  // Refresh all data
  const refreshData = async () => {
    await loadData();
  };

  return (
    <DbContext.Provider
      value={{
        state,
        loading: isLoading,
        error,
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
        refreshData,
      }}
    >
      {children}
    </DbContext.Provider>
  );
};

export const useDbContext = () => {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDbContext must be used within a DbProvider');
  }
  return context;
}; 