'use client';

import React, { useState } from 'react';
import { useDbContext } from '../lib/dbContext';

const PersonForm: React.FC = () => {
  const { addPerson, loading } = useDbContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      await addPerson(name.trim());
      
      // Reset form
      setName('');
      setEmail('');
    } catch (err) {
      console.error('Error adding person:', err);
      setError('Failed to add person. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card mb-6">
      <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">Add Person</h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Enter name"
            disabled={loading || submitting}
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email (Optional)
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="Enter email"
            disabled={loading || submitting}
          />
        </div>
        
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading || submitting}
        >
          {submitting ? 'Adding...' : 'Add Person'}
        </button>
      </form>
    </div>
  );
};

export default PersonForm; 