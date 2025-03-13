'use client';

import React, { useEffect, useRef } from 'react';
import { useDbContext } from '../lib/dbContext';
import { getCategoryTotals } from '../lib/utils';

const CategoryChart: React.FC = () => {
  const { state, loading } = useDbContext();
  const { expenses, categories, currencies, selectedCurrency, selectedGroup } = state;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Colors for the pie chart
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#8AC249', '#EA5F89', '#00BFFF', '#FFA07A'
  ];

  useEffect(() => {
    if (!canvasRef.current || loading) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Get category totals
    const categoryTotals = getCategoryTotals(
      expenses,
      selectedGroup,
      currencies,
      selectedCurrency
    );

    if (categoryTotals.length === 0) return;

    // Calculate total amount
    const total = categoryTotals.reduce((sum, cat) => sum + cat.amount, 0);
    if (total <= 0) return;

    // Draw pie chart
    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    let startAngle = 0;
    categoryTotals.forEach((categoryTotal, index) => {
      const sliceAngle = (2 * Math.PI * categoryTotal.amount) / total;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      
      // Fill with color
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      // Calculate label position
      const labelAngle = startAngle + sliceAngle / 2;
      const labelX = centerX + (radius * 0.7) * Math.cos(labelAngle);
      const labelY = centerY + (radius * 0.7) * Math.sin(labelAngle);
      
      // Draw percentage if slice is big enough
      if (categoryTotal.amount / total > 0.05) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round((categoryTotal.amount / total) * 100)}%`, labelX, labelY);
      }
      
      startAngle += sliceAngle;
    });
  }, [expenses, categories, currencies, selectedCurrency, selectedGroup, loading]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    const currency = currencies.find(c => c.code === selectedCurrency);
    if (!currency) return `${amount}`;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      currencyDisplay: 'symbol',
    }).format(amount);
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  // Calculate total expenses
  const totalExpenses = expenses
    .filter(expense => !selectedGroup || expense.groupId === selectedGroup)
    .reduce((sum, expense) => {
      // Convert to selected currency
      const exchangeRate = currencies.find(c => c.code === expense.currency)?.exchangeRate || 1;
      const targetRate = currencies.find(c => c.code === selectedCurrency)?.exchangeRate || 1;
      const convertedAmount = (expense.amount / exchangeRate) * targetRate;
      
      return sum + convertedAmount;
    }, 0);

  // Get category totals
  const categoryTotals = getCategoryTotals(
    expenses,
    selectedGroup,
    currencies,
    selectedCurrency
  );

  return (
    <div className="card mb-6">
      <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">Category Breakdown</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 dark:text-gray-400">No expenses added yet.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-4">
            <canvas 
              ref={canvasRef} 
              width={200} 
              height={200} 
              className="max-w-full"
            />
          </div>
          
          <div className="text-center mb-4">
            <p className="text-lg font-medium text-text dark:text-text-dark">
              Total: {formatCurrency(totalExpenses)}
            </p>
          </div>
          
          <div className="space-y-2">
            {categoryTotals.map((categoryTotal, index) => (
              <div key={categoryTotal.categoryId} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 mr-2 rounded-sm" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-text dark:text-text-dark">
                    {getCategoryName(categoryTotal.categoryId)}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-text dark:text-text-dark mr-2">
                    {formatCurrency(categoryTotal.amount)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    ({Math.round((categoryTotal.amount / totalExpenses) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryChart; 