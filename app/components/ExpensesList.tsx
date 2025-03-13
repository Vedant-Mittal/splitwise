'use client';

import React, { useState } from 'react';
import { FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useDbContext } from '../lib/dbContext';
import { formatCurrency } from '../lib/utils';

const ExpensesList: React.FC = () => {
  const { state, removeExpense, updateExpense, loading } = useDbContext();
  const { expenses, people, categories, currencies, selectedCurrency, selectedGroup } = state;
  
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editPaidBy, setEditPaidBy] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editCurrency, setEditCurrency] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get person name by ID
  const getPersonName = (id: string): string => {
    const person = people.find(p => p.id === id);
    return person ? person.name : 'Unknown';
  };

  // Get category name by ID
  const getCategoryName = (id: string): string => {
    const category = categories.find(c => c.id === id);
    return category ? category.name : 'Other';
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Start editing an expense
  const startEditing = (expense: any) => {
    setEditingExpense(expense.id);
    setEditDescription(expense.description);
    setEditAmount(expense.amount.toString());
    setEditPaidBy(expense.paidBy);
    setEditCategoryId(expense.categoryId);
    setEditCurrency(expense.currency);
    setError(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingExpense(null);
    setError(null);
  };

  // Save edited expense
  const saveExpense = async (expense: any) => {
    if (!editDescription || !editAmount || !editPaidBy || !editCategoryId) {
      setError('Please fill in all required fields');
      return;
    }

    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      
      await updateExpense({
        ...expense,
        description: editDescription,
        amount: parsedAmount,
        paidBy: editPaidBy,
        categoryId: editCategoryId,
        currency: editCurrency,
      });
      
      setEditingExpense(null);
      setError(null);
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Failed to update expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle expense deletion
  const handleRemoveExpense = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await removeExpense(id);
      } catch (error) {
        console.error('Error removing expense:', error);
        alert('Failed to remove expense. Please try again.');
      }
    }
  };

  // Filter expenses based on selected group
  const filteredExpenses = selectedGroup && selectedGroup !== 'all'
    ? expenses.filter(expense => expense.groupId === selectedGroup)
    : expenses;

  if (filteredExpenses.length === 0) {
    return (
      <div className="mb-6 card">
        <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">Expenses</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">No expenses added yet.</p>
      </div>
    );
  }

  return (
    <div className="mb-6 card">
      <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">Expenses</h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 text-left text-text dark:text-text-dark">Description</th>
              <th className="py-2 text-left text-text dark:text-text-dark">Amount</th>
              <th className="py-2 text-left text-text dark:text-text-dark">Paid By</th>
              <th className="py-2 text-left text-text dark:text-text-dark">Category</th>
              <th className="py-2 text-left text-text dark:text-text-dark">Date</th>
              <th className="py-2 text-right text-text dark:text-text-dark">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(expense => (
              <tr key={expense.id} className="border-b border-gray-200 dark:border-gray-700">
                {editingExpense === expense.id ? (
                  // Edit form
                  <>
                    <td className="py-2">
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="input-field py-1 px-2 w-full"
                        required
                      />
                    </td>
                    <td className="py-2">
                      <div className="flex items-center space-x-2">
                        <select
                          value={editCurrency}
                          onChange={(e) => setEditCurrency(e.target.value)}
                          className="select-field py-1 px-2 w-24"
                          required
                        >
                          {currencies.map(curr => (
                            <option key={curr.code} value={curr.code}>
                              {curr.symbol} {curr.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          min="0.01"
                          step="0.01"
                          className="input-field py-1 px-2 w-24"
                          required
                        />
                      </div>
                    </td>
                    <td className="py-2">
                      <select
                        value={editPaidBy}
                        onChange={(e) => setEditPaidBy(e.target.value)}
                        className="select-field py-1 px-2 w-full"
                        required
                      >
                        {people.map(person => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <select
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        className="select-field py-1 px-2 w-full"
                        required
                      >
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      {formatDate(expense.date)}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => saveExpense(expense)}
                        className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 mr-2"
                        disabled={submitting}
                        aria-label="Save"
                      >
                        <FaSave />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                        disabled={submitting}
                        aria-label="Cancel"
                      >
                        <FaTimes />
                      </button>
                    </td>
                  </>
                ) : (
                  // Display expense
                  <>
                    <td className="py-2 text-text dark:text-text-dark">
                      {expense.description}
                    </td>
                    <td className="py-2 text-text dark:text-text-dark">
                      {formatCurrency(expense.amount, expense.currency, currencies)}
                    </td>
                    <td className="py-2 text-text dark:text-text-dark">
                      {getPersonName(expense.paidBy)}
                    </td>
                    <td className="py-2 text-text dark:text-text-dark">
                      {getCategoryName(expense.categoryId)}
                    </td>
                    <td className="py-2 text-text dark:text-text-dark">
                      {formatDate(expense.date)}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => startEditing(expense)}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-2"
                        disabled={loading}
                        aria-label="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleRemoveExpense(expense.id)}
                        className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        disabled={loading}
                        aria-label="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpensesList; 