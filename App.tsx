
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import { Transaction, Investment, Goal, AppConfig, RecurringSchedule } from './types';
import { t } from './i18n';
import { X, CheckCircle, Info } from 'lucide-react';

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
      investmentChartType: 'pie',
      alerts: [],
      recurringSchedules: []
    };
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const getNetworkDate = async (): Promise<Date> => {
    try {
      const response = await fetch('https://worldtimeapi.org/api/ip');
      const data = await response.json();
      return new Date(data.datetime);
    } catch (e) {
      return new Date();
    }
  };

  // Processador de Recorrência Robusto
  useEffect(() => {
    const processRecurring = async () => {
      if (!config.recurringSchedules?.length) return;

      const networkDate = await getNetworkDate();
      const todayStr = networkDate.toISOString().split('T')[0];
      let hasUpdates = false;
      const newTransactions: Transaction[] = [];
      
      const updatedSchedules = config.recurringSchedules.map(schedule => {
        if (!schedule.active) return schedule;

        let currentSched = { ...schedule };
        // Começar a partir da última data processada ou da data de início
        let cursorDate = currentSched.lastProcessedDate ? new Date(currentSched.lastProcessedDate) : new Date(currentSched.startDate);
        
        while (true) {
          let nextDate = new Date(cursorDate);
          if (currentSched.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
          else if (currentSched.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
          else if (currentSched.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
          else if (currentSched.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

          const nextDateStr = nextDate.toISOString().split('T')[0];
          
          // Se a próxima data for no futuro, parar
          if (nextDateStr > todayStr) break; 

          // Verificar condições de fim
          if (currentSched.endCondition === 'count' && currentSched.processedCount >= (currentSched.occCount || 999)) {
            currentSched.active = false;
            break;
          }
          if (currentSched.endCondition === 'date' && currentSched.occUntil && nextDateStr > currentSched.occUntil) {
            currentSched.active = false;
            break;
          }

          // Gerar a transação
          hasUpdates = true;
          newTransactions.push({
            id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            date: nextDateStr,
            description: currentSched.description,
            amount: currentSched.amount,
            type: currentSched.type,
            category: currentSched.category
          });

          currentSched.processedCount++;
          currentSched.lastProcessedDate = nextDateStr;
          cursorDate = nextDate;
        }

        return currentSched;
      });

      if (hasUpdates) {
        setTransactions(prev => [...prev, ...newTransactions]);
        setConfig(prev => ({ ...prev, recurringSchedules: updatedSchedules }));
        addNotification(config.language === 'pt' ? `${newTransactions.length} transações recorrentes processadas!` : `${newTransactions.length} recurring transactions processed!`, "success");
      }
    };

    const timer = setTimeout(processRecurring, 2000);
    return () => clearTimeout(timer);
  }, [config.recurringSchedules, config.language, addNotification]);

  // Aplicar Tema
  useEffect(() => {
    const applyTheme = (mode: string) => {
      if (mode === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };
    if (config.theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(isDark ? 'dark' : 'light');
    } else {
      applyTheme(config.theme);
    }
  }, [config.theme]);

  // Sincronizar LocalStorage
  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('investments', JSON.stringify(investments)); }, [investments]);
  useEffect(() => { localStorage.setItem('goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('config', JSON.stringify(config)); }, [config]);

  const addTransaction = (tr: Transaction) => setTransactions(prev => [...prev, tr]);
  const addRecurringSchedule = (s: RecurringSchedule) => setConfig(prev => ({ ...prev, recurringSchedules: [...prev.recurringSchedules, s] }));
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  const importTransactions = (tr: Transaction[]) => setTransactions(prev => [...prev, ...tr]);

  const addInvestment = (inv: Investment) => setInvestments(prev => [...prev, inv]);
  const deleteInvestment = (id: string) => setInvestments(prev => prev.filter(i => i.id !== id));
  const importInvestments = (invs: Investment[]) => setInvestments(prev => [...prev, ...invs]);

  const addGoal = (g: Goal) => setGoals(prev => [...prev, g]);
  const deleteGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

  const getCurrentBalance = () => {
    const inc = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const tOut = transactions.filter(t => t.type === 'transfer' && (t.category === 'Poupança Automática' || t.description.toLowerCase().includes('saída'))).reduce((acc, t) => acc + t.amount, 0);
    const tIn = transactions.filter(t => t.type === 'transfer' && (t.category === 'Transferência Entre Contas' && !t.description.toLowerCase().includes('saída'))).reduce((acc, t) => acc + t.amount, 0);
    return inc - exp + tIn - tOut;
  };

  const allocateToGoal = (goalId: string) => {
    const balance = getCurrentBalance();
    const amount = balance > 0 ? (balance * (config.allocationPercentage / 100)) : 0;
    if (amount <= 0) return;
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g));
    addTransaction({
      id: `alloc-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `${t('allocate', config.language)}: ${goals.find(g => g.id === goalId)?.title}`,
      amount,
      type: 'transfer',
      category: 'Poupança Automática'
    });
    addNotification(config.language === 'pt' ? 'Poupança alocada!' : 'Savings allocated!', 'success');
  };

  const getSavingsBalance = () => goals.reduce((acc, g) => acc + g.currentAmount, 0);

  return (
    <HashRouter>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Navbar lang={config.language} />
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
          {notifications.map(n => (
            <div key={n.id} className="pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 animate-in slide-in-from-right-8 duration-300">
              <div className="flex items-center gap-3">
                <span className={n.type === 'success' ? 'text-success' : n.type === 'error' ? 'text-danger' : 'text-accent'}>
                   {n.type === 'success' ? <CheckCircle size={20}/> : <Info size={20}/>}
                </span>
                <span className="text-sm font-bold">{n.message}</span>
              </div>
              <button onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))} className="text-slate-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={16} /></button>
            </div>
          ))}
        </div>
        <main className="flex-1 p-4 md:p-8 md:ml-20 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard transactions={transactions} onAddTransaction={addTransaction} onDeleteTransaction={deleteTransaction} onImportTransactions={importTransactions} onAddRecurringSchedule={addRecurringSchedule} currency={config.currency} showCharts={config.showDashboardCharts} chartType={config.dashboardChartType} notify={addNotification} lang={config.language} />} />
              <Route path="/investments" element={<Investments investments={investments} onAddInvestment={addInvestment} onDeleteInvestment={deleteInvestment} onImportInvestments={importInvestments} currency={config.currency} showCharts={config.showInvestmentCharts} chartType={config.investmentChartType} lang={config.language} notify={addNotification} />} />
              <Route path="/goals" element={<Goals goals={goals} onAddGoal={addGoal} onDeleteGoal={deleteGoal} onAllocate={allocateToGoal} allocationPercentage={config.allocationPercentage} currentBalance={getCurrentBalance()} savingsBalance={getSavingsBalance()} currency={config.currency} lang={config.language} />} />
              <Route path="/settings" element={<Settings config={config} onUpdateConfig={setConfig} notify={addNotification} lang={config.language} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
