
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import { Transaction, Investment, Goal, AppConfig } from './types';
import { translations, t } from './i18n';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem('investments');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('config');
    return saved ? JSON.parse(saved) : {
      allocationPercentage: 10,
      trading212Token: '',
      currency: '€',
      userName: 'Investidor',
      theme: 'auto',
      language: 'pt',
      showDashboardCharts: true,
      dashboardChartType: 'pie',
      showInvestmentCharts: true,
      investmentChartType: 'pie'
    };
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Sync Theme with DOM
  useEffect(() => {
    const applyTheme = (mode: string) => {
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    if (config.theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(isDark ? 'dark' : 'light');
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(config.theme);
    }
  }, [config.theme]);

  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('investments', JSON.stringify(investments)); }, [investments]);
  useEffect(() => { localStorage.setItem('goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('config', JSON.stringify(config)); }, [config]);

  const addTransaction = (tr: Transaction) => {
    const isSavingWithdrawal = (tr.type === 'income' || tr.type === 'transfer') && 
                               (tr.category === 'Poupança Automática' || tr.category === 'Transferência Entre Contas');

    if (isSavingWithdrawal) {
      const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
      if (totalSaved > 0) {
        const reductionFactor = tr.amount / totalSaved;
        setGoals(prevGoals => prevGoals.map(g => ({
          ...g,
          currentAmount: Math.max(0, g.currentAmount - (g.currentAmount * reductionFactor))
        })));
        addNotification(`${t('manageFinances', config.language)} - ${tr.amount.toFixed(2)}${config.currency}`, "info");
      }
    }
    
    setTransactions([...transactions, tr]);
    addNotification(config.language === 'pt' ? "Transação registada!" : "Transaction recorded!", "success");
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    addNotification(config.language === 'pt' ? "Removida." : "Removed.", "info");
  };

  const importTransactions = (newTrans: Transaction[]) => {
    setTransactions(prev => [...prev, ...newTrans]);
    addNotification(`${newTrans.length} items`, "success");
  };

  const addInvestment = (inv: Investment) => {
    setInvestments([...investments, inv]);
    addNotification(config.language === 'pt' ? "Registado!" : "Recorded!", "success");
  };

  const deleteInvestment = (id: string) => {
    setInvestments(investments.filter(i => i.id !== id));
    addNotification("...", "info");
  };

  const importInvestments = (newInvs: Investment[]) => {
    setInvestments(prev => [...prev, ...newInvs]);
    addNotification(`${newInvs.length} entries`, "success");
  };

  const addGoal = (g: Goal) => {
    setGoals([...goals, g]);
    addNotification("+ Goal", "success");
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    addNotification("- Goal", "info");
  };

  const allocateToGoal = (goalId: string) => {
    const mainBalance = getCurrentBalance();
    const amountToAllocate = mainBalance * (config.allocationPercentage / 100);

    if (amountToAllocate <= 0) {
      addNotification("...", "error");
      return;
    }

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description: `Savings: ${goal.title}`,
      amount: parseFloat(amountToAllocate.toFixed(2)),
      type: 'transfer',
      category: 'Poupança Automática'
    };

    setTransactions([...transactions, newTransaction]);
    
    setGoals(prevGoals => prevGoals.map(g => {
      if (g.id === goalId) {
        return { ...g, currentAmount: g.currentAmount + amountToAllocate };
      }
      return g;
    }));

    addNotification(`-> ${amountToAllocate.toFixed(2)}${config.currency}`, "success");
  };

  const getCurrentBalance = () => {
    const inc = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const tOut = transactions.filter(t => t.type === 'transfer' && (t.category === 'Poupança Automática' || t.description.toLowerCase().includes('saída'))).reduce((acc, t) => acc + t.amount, 0);
    const tIn = transactions.filter(t => t.type === 'transfer' && (t.category === 'Transferência Entre Contas' && !t.description.toLowerCase().includes('saída'))).reduce((acc, t) => acc + t.amount, 0);

    return inc - exp + tIn - tOut;
  };

  const getSavingsBalance = () => {
    return goals.reduce((acc, g) => acc + g.currentAmount, 0);
  };

  return (
    <HashRouter>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Navbar lang={config.language} />
        
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
          {notifications.map(n => (
            <div key={n.id} className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border animate-in slide-in-from-right-8 duration-300 ${
              n.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300' :
              n.type === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-300' :
              'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300'
            }`}>
              <div className="flex items-center gap-3">
                {n.type === 'success' && <CheckCircle size={20} />}
                {n.type === 'error' && <AlertCircle size={20} />}
                {n.type === 'info' && <Info size={20} />}
                <span className="text-sm font-medium">{n.message}</span>
              </div>
              <button onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))} className="ml-4 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        <main className="flex-1 p-4 md:p-8 md:ml-20 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
               <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('hello', config.language)}, {config.userName} 👋</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('manageFinances', config.language)}</p>
               </div>
               <div className="hidden md:block text-xs bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-400">
                  v1.4.0 International
               </div>
            </div>

            <Routes>
              <Route path="/" element={
                <Dashboard 
                  transactions={transactions} 
                  onAddTransaction={addTransaction}
                  onDeleteTransaction={deleteTransaction}
                  onImportTransactions={importTransactions}
                  currency={config.currency}
                  showCharts={config.showDashboardCharts}
                  chartType={config.dashboardChartType}
                  notify={addNotification}
                  lang={config.language}
                />
              } />
              <Route path="/investments" element={
                <Investments 
                  investments={investments} 
                  onAddInvestment={addInvestment}
                  onDeleteInvestment={deleteInvestment}
                  onImportInvestments={importInvestments}
                  currency={config.currency}
                  showCharts={config.showInvestmentCharts}
                  chartType={config.investmentChartType}
                  lang={config.language}
                />
              } />
              <Route path="/goals" element={
                <Goals 
                  goals={goals} 
                  onAddGoal={addGoal}
                  onDeleteGoal={deleteGoal}
                  onAllocate={allocateToGoal}
                  allocationPercentage={config.allocationPercentage}
                  currentBalance={getCurrentBalance()}
                  savingsBalance={getSavingsBalance()}
                  currency={config.currency}
                  lang={config.language}
                />
              } />
              <Route path="/settings" element={
                <Settings 
                  config={config} 
                  onUpdateConfig={setConfig}
                  notify={addNotification}
                  lang={config.language}
                />
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
