/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { dbService } from './services/db';
import { Transaction, TransactionType } from './types/finance';
import { PhoneFrame } from './components/PhoneFrame';
import { LockScreen } from './components/LockScreen';
import { AddRecordModal } from './components/AddRecordModal';
import { EditRecordModal } from './components/EditRecordModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';

// Screens
import { HomeScreen } from './screens/HomeScreen';
import { RecordsScreen } from './screens/RecordsScreen';
import { BudgetScreen } from './screens/BudgetScreen';
import { LendingScreen } from './screens/LendingScreen';
import { MoreScreen } from './screens/MoreScreen';

export default function App() {
  const [dbState, setDbState] = useState(dbService.getState());
  const [currentTab, setCurrentTab] = useState<'home' | 'records' | 'budget' | 'lending' | 'more'>('home');
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return dbService.getState().settings.appLockEnabled;
  });

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addDefaultType, setAddDefaultType] = useState<TransactionType>('expense');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    return dbService.subscribe(() => {
      setDbState({ ...dbService.getState() });
    });
  }, []);

  const handleOpenAddModal = (defaultType: TransactionType = 'expense') => {
    setAddDefaultType(defaultType);
    setAddModalOpen(true);
  };

  const handleOpenTransactionDetails = (tx: Transaction) => {
    setSelectedTransaction(tx);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setSelectedTransaction(null);
    setEditingTransaction(tx);
  };

  return (
    <>
      {/* Biometric & PIN Lock Screen */}
      {isLocked && dbState.settings.appLockEnabled && (
        <LockScreen
          pin={dbState.settings.appLockPin}
          biometricsEnabled={dbState.settings.biometricsEnabled}
          onUnlock={() => setIsLocked(false)}
        />
      )}

      {/* Main Android App Experience */}
      <PhoneFrame
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenAddModal={() => handleOpenAddModal('expense')}
      >
        {currentTab === 'home' && (
          <HomeScreen
            onOpenAddModal={(type) => handleOpenAddModal(type || 'expense')}
            onOpenTransactionDetails={handleOpenTransactionDetails}
            onNavigateToRecords={() => setCurrentTab('records')}
            onNavigateToBudget={() => setCurrentTab('budget')}
            onNavigateToLending={() => setCurrentTab('lending')}
          />
        )}

        {currentTab === 'records' && (
          <RecordsScreen
            onOpenAddModal={() => handleOpenAddModal('expense')}
            onOpenTransactionDetails={handleOpenTransactionDetails}
          />
        )}

        {currentTab === 'budget' && <BudgetScreen />}

        {currentTab === 'lending' && <LendingScreen />}

        {currentTab === 'more' && <MoreScreen />}
      </PhoneFrame>

      {/* Add Record Modal (Quick Add + Full Add) */}
      <AddRecordModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        defaultType={addDefaultType}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onEdit={handleEditTransaction}
      />

      {/* Edit Record Modal */}
      <EditRecordModal
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
      />
    </>
  );
}
