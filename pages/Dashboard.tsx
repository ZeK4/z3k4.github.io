
import React, { useState, useEffect } from 'react';
import { Transaction, DEFAULT_CATEGORIES, ChartType, TransactionType, Language } from '../types';
import { t } from '../i18n';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Plus, Upload, Download, Trash2, FileSpreadsheet, FileText, ChevronDown, AlertCircle, X, Loader2, Lock } from 'lucide-react';
import { exportTransactionsToCSV, exportTransactionsToExcel, parseFile } from '../utils/csvHelper';

interface DashboardProps {
  transactions: Transaction[];
  onAddTransaction: (tr: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onImportTransactions: (tr: Transaction[]) => void;
  currency: string;
  showCharts: boolean;
  chartType: ChartType;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  lang: Language;
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  onAddTransaction, 
  onDeleteTransaction,
  onImportTransactions,
  currency,
  showCharts,
  chartType,
  notify,
  lang
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newTrans, setNewTrans] = useState<Partial<Transaction>>({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    category: DEFAULT_CATEGORIES[0]
  });

  useEffect(() => {
    if (newTrans.category === 'Salário') {
      setNewTrans(prev => ({
        ...prev,
        type: 'income',
        description: t('ordered', lang)
      }));
    } else if (newTrans.category === 'Transferência Entre Contas') {
      setNewTrans(prev => ({
        ...prev,
        type: 'transfer'
      }));
    }
  }, [newTrans.category, lang]);

  const income = transactions.filter(t => t.type === 'income').reduce((acc, tr) => acc + tr.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, tr) => acc + tr.amount, 0);
  const transfersOut = transactions.filter(t => t.type === 'transfer' && (t.category === 'Poupança Automática' || t.description.toLowerCase().includes('saída'))).reduce((acc, tr) => acc + tr.amount, 0);
  const transfersIn = transactions.filter(t => t.type === 'transfer' && (t.category === 'Transferência Entre Contas' && !t.description.toLowerCase().includes('saída'))).reduce((acc, tr) => acc + tr.amount, 0);
  
  const balance = income - expense + transfersIn - transfersOut;

  const expensesByCategory = transactions
    .filter(tr => tr.type === 'expense' || (tr.type === 'transfer' && tr.category === 'Poupança Automática'))
    .reduce((acc, tr) => {
      acc[tr.category] = (acc[tr.category] || 0) + tr.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: parseFloat(expensesByCategory[key].toFixed(2))
  }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const imported = await parseFile(file);
      if (imported.length > 0) {
        onImportTransactions(imported);
      }
    } catch (error: any) {
      notify(error.message || "Error", "error");
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTrans.description && newTrans.amount) {
      onAddTransaction({
        id: Date.now().toString(),
        description: newTrans.description,
        amount: Number(newTrans.amount),
        type: newTrans.type as TransactionType,
        date: newTrans.date || new Date().toISOString().split('T')[0],
        category: newTrans.category || 'Outros'
      });
      setIsModalOpen(false);
      setNewTrans({ type: 'expense', date: new Date().toISOString().split('T')[0], category: DEFAULT_CATEGORIES[0], description: '', amount: 0 });
    }
  };

  const inputClasses = "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed";
  const labelClasses = "block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1";
  const cardClasses = "bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors";

  const renderChart = () => {
    if (chartData.length === 0) return (
      <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm italic h-64">
        {t('noData', lang)}
      </div>
    );

    if (chartType === 'pie') {
      return (
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'white' }} 
                itemStyle={{ color: '#1e293b' }}
                formatter={(value: number) => `${value.toFixed(2)} ${currency}`} 
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    } else {
      return (
        <div className="w-full h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <RechartsTooltip 
                 cursor={{ fill: 'transparent' }}
                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                 formatter={(value: number) => [`${value.toFixed(2)} ${currency}`, 'Total']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cardClasses}>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('balance', lang)}</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-danger'}`}>
            {balance.toFixed(2)} {currency}
          </p>
        </div>
        <div className={cardClasses}>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('income', lang)}</p>
          <p className="text-2xl font-bold text-success">+{income.toFixed(2)} {currency}</p>
        </div>
        <div className={cardClasses}>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('expense', lang)}</p>
          <p className="text-2xl font-bold text-danger">-{expense.toFixed(2)} {currency}</p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${showCharts ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
        <div className={`${showCharts ? 'lg:col-span-2' : ''} bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{t('recentTransactions', lang)}</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <label className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${isImporting ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} 
                <span className="hidden sm:inline">{t('import', lang)}</span>
                <input type="file" accept=".csv, .xlsx" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
              </label>
              <div className="relative flex-1 sm:flex-none">
                <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <Download size={16} /> <span className="hidden sm:inline">{t('export', lang)}</span> <ChevronDown size={14} />
                </button>
                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-50 overflow-hidden">
                    <button onClick={() => { exportTransactionsToCSV(transactions); setIsExportMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-left">
                      <FileText size={16} className="text-slate-400" /> CSV
                    </button>
                    <button onClick={() => { exportTransactionsToExcel(transactions); setIsExportMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-left">
                      <FileSpreadsheet size={16} className="text-green-600" /> Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 uppercase font-medium text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">{t('date', lang)}</th>
                  <th className="px-4 py-3">{t('description', lang)}</th>
                  <th className="px-4 py-3">{t('category', lang)}</th>
                  <th className="px-4 py-3 text-right">{t('amount', lang)}</th>
                  <th className="px-4 py-3 rounded-r-lg text-center">{t('actions', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.slice().reverse().map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{tr.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{tr.description}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {tr.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${tr.type === 'income' ? 'text-success' : tr.type === 'transfer' ? 'text-accent' : 'text-slate-700 dark:text-slate-300'}`}>
                      {tr.type === 'income' ? '+' : tr.type === 'transfer' ? '⇅ ' : '-'}{tr.amount.toFixed(2)} {currency}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => onDeleteTransaction(tr.id)} className="text-slate-400 hover:text-danger transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showCharts && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center h-fit">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 w-full">{t('charts', lang)}</h2>
            {renderChart()}
          </div>
        )}
      </div>

      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-20 right-4 md:bottom-8 md:right-8 bg-accent hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-105 z-40">
        <Plus size={24} />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-slate-100 dark:border-slate-800">
            <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('newTransaction', lang)}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="relative">
                <label className={labelClasses}>{t('description', lang)}</label>
                <div className="relative">
                  <input 
                    required 
                    type="text" 
                    className={inputClasses} 
                    value={newTrans.description || ''} 
                    onChange={e => setNewTrans({ ...newTrans, description: e.target.value })} 
                    disabled={newTrans.category === 'Salário'}
                  />
                  {newTrans.category === 'Salário' && <Lock size={14} className="absolute right-3 top-3.5 text-slate-400" />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>{t('amount', lang)}</label>
                  <input required type="number" step="0.01" className={inputClasses} value={newTrans.amount || ''} onChange={e => setNewTrans({ ...newTrans, amount: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className={labelClasses}>{t('date', lang)}</label>
                  <input required type="date" className={inputClasses} value={newTrans.date} onChange={e => setNewTrans({ ...newTrans, date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className={labelClasses}>{t('operationType', lang)}</label>
                  <select 
                    className={inputClasses} 
                    value={newTrans.type} 
                    onChange={e => setNewTrans({ ...newTrans, type: e.target.value as any })}
                    disabled={newTrans.category === 'Salário' || newTrans.category === 'Transferência Entre Contas'}
                  >
                    <option value="expense">{t('expense', lang)}</option>
                    <option value="income">{t('income', lang)}</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>{t('category', lang)}</label>
                  <select className={inputClasses} value={newTrans.category} onChange={e => setNewTrans({ ...newTrans, category: e.target.value })}>
                    {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-4 mt-2 bg-accent hover:bg-blue-600 text-white font-bold rounded-2xl transition-all">
                {t('save', lang)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
