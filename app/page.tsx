'use client';

import React from 'react';
import Header from './components/Header';
import PersonForm from './components/PersonForm';
import PeopleList from './components/PeopleList';
import ExpenseForm from './components/ExpenseForm';
import ExpensesList from './components/ExpensesList';
import BalancesSummary from './components/BalancesSummary';
import GroupSelector from './components/GroupSelector';
import SettlementForm from './components/SettlementForm';
import CategoryChart from './components/CategoryChart';
import { useDbContext } from './lib/dbContext';

export default function Home() {
  const { loading, error } = useDbContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we load your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-gray-500">{error.message}</p>
          <button 
            className="mt-4 btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      
      <div className="mb-6">
        <GroupSelector />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <PersonForm />
          <PeopleList />
          <SettlementForm />
        </div>
        
        <div>
          <ExpenseForm />
          <CategoryChart />
          <ExpensesList />
        </div>
      </div>
      
      <div className="mt-6">
        <BalancesSummary />
      </div>
    </>
  );
} 