'use client';

import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { useDbContext } from '../lib/dbContext';

const GroupSelector: React.FC = () => {
  const { state, addGroup, updateGroup, removeGroup, setSelectedGroup, loading } = useDbContext();
  const { groups, people, selectedGroup } = state;
  
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form
  const resetForm = () => {
    setGroupName('');
    setGroupDescription('');
    setSelectedMembers([]);
    setShowAddGroup(false);
    setEditingGroupId(null);
    setError(null);
  };

  // Start adding a new group
  const startAddGroup = () => {
    resetForm();
    setShowAddGroup(true);
  };

  // Start editing a group
  const startEditGroup = (group: any) => {
    setEditingGroupId(group.id);
    setGroupName(group.name);
    setGroupDescription(group.description || '');
    setSelectedMembers(group.members || []);
    setShowAddGroup(false);
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!groupName || selectedMembers.length === 0) {
      setError('Please provide a group name and select at least one member');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (editingGroupId) {
        // Update existing group
        await updateGroup({
          id: editingGroupId,
          name: groupName,
          description: groupDescription,
          members: selectedMembers,
        });
      } else {
        // Add new group
        await addGroup({
          name: groupName,
          description: groupDescription,
          members: selectedMembers,
        });
      }
      
      resetForm();
    } catch (err) {
      console.error('Error saving group:', err);
      setError('Failed to save group. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle group deletion
  const handleRemoveGroup = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this group? Expenses in this group will be moved to "No Group".')) {
      try {
        await removeGroup(id);
        
        if (selectedGroup === id) {
          setSelectedGroup('all');
        }
      } catch (error) {
        console.error('Error removing group:', error);
        alert('Failed to remove group. Please try again.');
      }
    }
  };

  // Toggle member selection
  const toggleMember = (personId: string) => {
    setSelectedMembers(prev => 
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  return (
    <div className="mb-6 card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-text dark:text-text-dark">Group</h2>
        <button
          onClick={startAddGroup}
          className="btn-primary-sm flex items-center"
          disabled={loading || submitting}
        >
          <FaPlus className="mr-1" /> New Group
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}
      
      {(showAddGroup || editingGroupId) ? (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-3">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="input-field"
              placeholder="Trip to Paris, Apartment, etc."
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="groupDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              id="groupDescription"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="input-field"
              placeholder="A short description of the group"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Members
            </label>
            <div className="max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded">
              {people.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center">No people added yet.</p>
              ) : (
                <div className="space-y-2">
                  {people.map(person => (
                    <label key={person.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(person.id)}
                        onChange={() => toggleMember(person.id)}
                        className="mr-2"
                      />
                      <span className="text-text dark:text-text-dark">{person.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading || submitting}
            >
              {submitting ? 'Saving...' : (editingGroupId ? 'Update Group' : 'Create Group')}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-4">
          <select
            value={selectedGroup || 'all'}
            onChange={(e) => setSelectedGroup(e.target.value === 'all' ? 'all' : e.target.value)}
            className="select-field w-full"
          >
            <option value="all">All Expenses</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          
          {selectedGroup && selectedGroup !== 'all' && (
            <div className="mt-3 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-text dark:text-text-dark">
                  {groups.find(g => g.id === selectedGroup)?.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {groups.find(g => g.id === selectedGroup)?.description || 'No description'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEditGroup(groups.find(g => g.id === selectedGroup))}
                  className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  disabled={loading}
                  aria-label="Edit group"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleRemoveGroup(selectedGroup)}
                  className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  disabled={loading}
                  aria-label="Delete group"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupSelector; 