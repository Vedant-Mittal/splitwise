'use client';

import React, { useState } from 'react';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { useDbContext } from '../lib/dbContext';
import { formatCurrency, getTotalBalance } from '../lib/utils';
import { useApi } from '../lib/hooks/useApi';

const PeopleList: React.FC = () => {
  const { state, removePerson, refreshData, loading } = useDbContext();
  const { people, balances, currencies, selectedCurrency, selectedGroup } = state;
  const api = useApi();

  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start editing a person
  const startEdit = (person: any) => {
    setEditingPersonId(person.id);
    setEditName(person.name);
    setEditEmail(person.email || '');
    setError(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingPersonId(null);
    setEditName('');
    setEditEmail('');
    setError(null);
  };

  // Save edited person
  const saveEdit = async () => {
    if (!editName.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingPersonId) {
        // Use the API directly since updatePerson is not in DbContext
        await api.people.update(editingPersonId, editName.trim());
        // Refresh data to get updated people list
        await refreshData();
        cancelEdit();
      }
    } catch (err) {
      console.error('Error updating person:', err);
      setError('Failed to update person. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle person deletion
  const handleRemovePerson = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this person? All associated expenses will be deleted.')) {
      try {
        await removePerson(id);
      } catch (error) {
        console.error('Error removing person:', error);
        alert('Failed to remove person. Please try again.');
      }
    }
  };

  // Format balance with currency
  const formatBalance = (amount: number) => {
    return formatCurrency(amount, selectedCurrency, currencies);
  };

  // Get CSS class for balance
  const getBalanceClass = (balance: number) => {
    if (balance > 0) return 'text-green-600 dark:text-green-400';
    if (balance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="card mb-6">
      <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">People</h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}
      
      {people.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No people added yet. Add someone to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Name</th>
                <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Balance</th>
                <th className="text-right py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.map(person => {
                const balance = getTotalBalance(person.id, selectedGroup, balances);
                
                return (
                  <tr key={person.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-2">
                      {editingPersonId === person.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input-field w-full"
                          placeholder="Enter name"
                          disabled={submitting}
                        />
                      ) : (
                        <span className="text-text dark:text-text-dark">{person.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={getBalanceClass(balance)}>
                        {formatBalance(balance)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {editingPersonId === person.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={saveEdit}
                            className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            disabled={submitting}
                            aria-label="Save"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            disabled={submitting}
                            aria-label="Cancel"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(person)}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            disabled={loading || !!editingPersonId}
                            aria-label={`Edit ${person.name}`}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleRemovePerson(person.id)}
                            className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            disabled={loading || !!editingPersonId}
                            aria-label={`Remove ${person.name}`}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PeopleList; 