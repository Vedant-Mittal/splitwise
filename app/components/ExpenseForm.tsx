'use client';

import React, { useState, useEffect } from 'react';
import { useDbContext } from '../lib/dbContext';
import { formatCurrency } from '../lib/utils';
import { FaPlus } from 'react-icons/fa';

const ExpenseForm: React.FC = () => {
  const { state, addExpense, addCategory, loading } = useDbContext();
  const { people, categories, currencies, selectedCurrency, selectedGroup } = state;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [categoryId, setCategoryId] = useState('food'); // Default to food
  const [currency, setCurrency] = useState(selectedCurrency);
  const [splitType, setSplitType] = useState('equal'); // 'equal' or 'custom'
  const [splitAmong, setSplitAmong] = useState<{ personId: string; amount: string }[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update currency when selected currency changes
  useEffect(() => {
    setCurrency(selectedCurrency);
  }, [selectedCurrency]);

  // Reset form
  const resetForm = () => {
    setDescription('');
    setAmount('');
    setPaidBy('');
    setCategoryId('food');
    setCurrency(selectedCurrency);
    setSplitType('equal');
    setSplitAmong([]);
    setNewCategoryName('');
    setShowAddCategory(false);
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!description || !amount || !paidBy || !categoryId) {
      setError('Please fill in all required fields');
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    // Validate custom splits if selected
    if (splitType === 'custom') {
      const totalSplitAmount = splitAmong.reduce((sum, split) => {
        const splitAmount = parseFloat(split.amount);
        return sum + (isNaN(splitAmount) ? 0 : splitAmount);
      }, 0);
      
      if (Math.abs(totalSplitAmount - parsedAmount) > 0.01) {
        setError(`The sum of splits (${totalSplitAmount.toFixed(2)}) must equal the total amount (${parsedAmount.toFixed(2)})`);
        return;
      }
    }
    
    try {
      setSubmitting(true);
      
      // Prepare split amounts based on split type
      let splits = [];
      
      if (splitType === 'equal') {
        const relevantPeople = selectedGroup && selectedGroup !== 'all'
          ? people.filter(person => 
              state.groups.find(g => g.id === selectedGroup)?.members.includes(person.id)
            )
          : people;
        
        const splitAmount = parsedAmount / relevantPeople.length;
        
        splits = relevantPeople.map(person => ({
          personId: person.id,
          amount: splitAmount.toFixed(2),
        }));
      } else {
        // Custom split
        splits = splitAmong.map(split => ({
          personId: split.personId,
          amount: split.amount,
        }));
      }
      
      await addExpense({
        description,
        amount: parsedAmount,
        currency,
        paidById: paidBy,
        categoryId,
        groupId: selectedGroup === 'all' || selectedGroup === null ? undefined : selectedGroup,
        splitAmong: splits,
        date: new Date().toISOString(),
      });
      
      resetForm();
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle custom split amount change
  const handleSplitAmountChange = (personId: string, newAmount: string) => {
    setSplitAmong(prev => 
      prev.map(split => 
        split.personId === personId 
          ? { ...split, amount: newAmount } 
          : split
      )
    );
  };

  // Handle add category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim());
      setShowAddCategory(false);
      setNewCategoryName('');
    }
  };

  // Get relevant people based on selected group
  const relevantPeople = selectedGroup && selectedGroup !== 'all'
    ? people.filter(person => 
        state.groups.find(g => g.id === selectedGroup)?.members.includes(person.id)
      )
    : people;

  // Initialize custom split when split type changes to custom
  useEffect(() => {
    if (splitType === 'custom' && amount && relevantPeople.length > 0) {
      const equalSplitAmount = (parseFloat(amount) / relevantPeople.length).toFixed(2);
      
      setSplitAmong(
        relevantPeople.map(person => ({
          personId: person.id,
          amount: equalSplitAmount,
        }))
      );
    }
  }, [splitType, amount, relevantPeople]);

  if (relevantPeople.length < 2) {
    return (
      <div className="mb-6 card">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          {selectedGroup && selectedGroup !== 'all' && selectedGroup !== 'no-group'
            ? 'Add at least 2 people to this group to create an expense.'
            : 'Add at least 2 people to create an expense.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 card">
      <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">Add Expense</h2>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            placeholder="Dinner, Movie tickets, etc."
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              className="input-field"
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="select-field"
              required
            >
              {currencies.map(curr => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Paid by
          </label>
          <select
            id="paidBy"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="select-field"
            required
          >
            <option value="">Select a person</option>
            {relevantPeople.map(person => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Split type
          </label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="equal"
                checked={splitType === 'equal'}
                onChange={() => setSplitType('equal')}
                className="form-radio"
              />
              <span className="ml-2 text-text dark:text-text-dark">Equal</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="custom"
                checked={splitType === 'custom'}
                onChange={() => setSplitType('custom')}
                className="form-radio"
              />
              <span className="ml-2 text-text dark:text-text-dark">Custom</span>
            </label>
          </div>
        </div>
        
        {splitType === 'custom' && amount && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom split
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded">
              {splitAmong.map(split => {
                const person = people.find(p => p.id === split.personId);
                return (
                  <div key={split.personId} className="flex items-center justify-between">
                    <span className="text-text dark:text-text-dark">{person?.name}</span>
                    <div className="flex items-center">
                      <span className="mr-2 text-gray-500 dark:text-gray-400">
                        {currencies.find(c => c.code === currency)?.symbol}
                      </span>
                      <input
                        type="number"
                        value={split.amount}
                        onChange={(e) => handleSplitAmountChange(split.personId, e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-20 input-field py-1 px-2"
                        required
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <div className="flex gap-2">
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="select-field flex-1"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              <option value="add-new">+ Add new category</option>
            </select>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full btn-primary"
          disabled={loading || submitting}
        >
          {submitting ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
};

export default ExpenseForm; 