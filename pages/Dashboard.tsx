
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, DEFAULT_CATEGORIES, ChartType, TransactionType, Language, RecurringSchedule, RecurrenceFrequency } from '../types';
import { t } from '../i18n';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Sector } from 'recharts';
import { Plus, Upload, Download, Trash2, FileSpreadsheet, FileText, ChevronDown, X, Loader2, Lock, Repeat, CalendarDays, Hash, PieChart as PieIcon, TrendingDown } from 'lucide-react';
import { exportTransactionsToCSV, exportTransactionsToExcel, parseFile } from '../utils/csvHelper';

interface DashboardProps {
  transactions: Transaction[];
  onAddTransaction: (tr: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onImportTransactions: (tr: Transaction[]) => void;
  onAddRecurringSchedule: (schedule: RecurringSchedule) => void;
  currency: string;
  showCharts: boolean;
  chartType: ChartType;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  lang: Language;
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="text-[12px] md:text-sm font-black uppercase tracking-tight">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={14} textAnchor="middle" fill="#94a3b8" className="text-[10px] md:text-xs font-bold">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  onAddTransaction, 
  onDeleteTransaction,
  onImportTransactions,
  onAddRecurringSchedule,
  currency,
  showCharts,
  chartType,
  notify,
  lang
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Estados para Transação Recorrente
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFrequency>('monthly');
  const [endCondition, setEndCondition] = useState<'count' | 'date'>('count');
  const [occCount, setOccCount] = useState(12);
  const [occUntil, setOccUntil] = useState('');

  const [newTrans, setNewTrans] = useState<Partial<Transaction>>({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    category: DEFAULT_CATEGORIES[0]
  });

  // Sincronizar tipo de operação com a categoria selecionada
  useEffect(() => {
    if (newTrans.category === 'Salário') {
      setNewTrans(prev => ({ ...prev, type: 'income', description: t('ordered', lang) }));
    } else if (newTrans.category === 'Transferência Entre Contas' || newTrans.category === 'Poupança Automática') {
      setNewTrans(prev => ({ ...prev, type: 'transfer' }));
    }
  }, [newTrans.category, lang]);

  // Cálculos de Resumo
  const income = transactions.filter(t => t.type === 'income').reduce((acc, tr) => acc + tr.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, tr) => acc + tr.amount, 0);
  const transfersOut = transactions.filter(t => t.type === 'transfer' && (t.category === 'Poupança Automática' || t.description.toLowerCase().includes('saída'))).reduce((acc, tr) => acc + tr.amount, 0);
  const transfersIn = transactions.filter(t => t.type === 'transfer' && (t.category === 'Transferência Entre Contas' && !t.description.toLowerCase().includes('saída'))).reduce((acc, tr) => acc + tr.amount, 0);
  const balance = income - expense + transfersIn - transfersOut;

  const expensesByCategory = useMemo(() => {
    return transactions
      .filter(tr => tr.type === 'expense' || (tr.type === 'transfer' && tr.category === 'Poupança Automática'))
      .reduce((acc, tr) => {
        acc[tr.category] = (acc[tr.category] || 0) + tr.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]);

  const chartData = useMemo(() => {
    return Object.keys(expensesByCategory).map(key => ({
      name: t(key as any, lang),
      value: parseFloat(expensesByCategory[key].toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [expensesByCategory, lang]);

  const totalChartValue = useMemo(() => chartData.reduce((acc, item) => acc + item.value, 0), [chartData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const imported = await parseFile(file);
      if (imported.length > 0) onImportTransactions(imported);
      notify(lang === 'pt' ? 'Importação concluída!' : 'Import successful!', 'success');
    } catch (error: any) {
      notify(t(error.message as any, lang), "error");
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTrans.description && newTrans.amount) {
      const baseTransaction: Transaction = {
        id: Date.now().toString(),
        description: newTrans.description,
        amount: Number(newTrans.amount),
        type: newTrans.type as TransactionType,
        category: newTrans.category || 'Outros',
        date: newTrans.date || new Date().toISOString().split('T')[0],
      };

      onAddTransaction(baseTransaction);

      if (isRecurring) {
        onAddRecurringSchedule({
          id: `sched-${Date.now()}`,
          description: baseTransaction.description,
          amount: baseTransaction.amount,
          type: baseTransaction.type,
          category: baseTransaction.category,
          frequency: recurrenceFreq,
          startDate: baseTransaction.date,
          lastProcessedDate: baseTransaction.date,
          active: true,
          endCondition: endCondition,
          occCount: endCondition === 'count' ? occCount : undefined,
          occUntil: endCondition === 'date' ? occUntil : undefined,
          processedCount: 1
        });
        notify(lang === 'pt' ? "Agendamento recorrente criado!" : "Recurring schedule created!", "success");
      }

      setIsModalOpen(false);
      setIsRecurring(false);
      setNewTrans({ type: 'expense', date: new Date().toISOString().split('T')[0], category: DEFAULT_CATEGORIES[0], description: '', amount: 0 });
    }
  };

  const inputClasses = "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed";
  const labelClasses = "block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1";

  const renderDashboardChart = () => {
    if (chartData.length === 0) return (
      <div className="flex flex-col items-center justify-center text-slate-400 py-20">
        <PieIcon size={48} className="opacity-10 mb-4" />
        <p className="text-sm font-bold opacity-30 italic uppercase tracking-widest">{t('noData', lang)}</p>
      </div>
    );

    return (
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 w-full min-h-[450px]">
        {/* Legenda Estilizada com Expansão em Colunas - Copiada do Investimento */}
        <div className="w-full lg:w-auto flex-shrink-0">
          <div className="grid grid-flow-row sm:grid-flow-col sm:grid-rows-6 lg:grid-rows-8 gap-x-8 gap-y-3 overflow-x-auto pb-6 lg:pb-0">
            {chartData.map((entry, index) => (
              <button
                key={entry.name}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className={`flex items-center gap-4 px-4 py-2.5 rounded-2xl transition-all text-left whitespace-nowrap min-w-[160px] ${
                  activeIndex === index 
                  ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-accent/20 dark:ring-slate-700 scale-105 shadow-sm' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div 
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase truncate max-w-[130px]">
                    {entry.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {entry.value.toFixed(2)} {currency} • {((entry.value / totalChartValue) * 100).toFixed(1)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Área do Gráfico - Ajuste Dinâmico na Horizontal */}
        <div className="flex-1 min-w-[300px] h-[400px] relative">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie 
                  activeIndex={activeIndex ?? undefined}
                  activeShape={renderActiveShape}
                  data={chartData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={80} 
                  outerRadius={120} 
                  paddingAngle={4} 
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="none"
                      style={{ 
                        filter: activeIndex !== null && activeIndex !== index ? 'grayscale(70%) opacity(0.3)' : 'none',
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  ))}
                </Pie>
                <RechartsTooltip 
                  wrapperStyle={{ zIndex: 100 }}
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 25px 30px -5px rgba(0,0,0,0.15)', 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(12px)',
                    padding: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }} 
                  formatter={(value: number) => {
                    const percent = totalChartValue > 0 ? ((value / totalChartValue) * 100).toFixed(1) : 0;
                    return [`${value.toFixed(2)} ${currency} (${percent}%)`, t('total', lang)];
                  }}
                />
              </PieChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontBold: 'bold', fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontBold: 'bold', fill: '#94a3b8' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => {
                    const percent = totalChartValue > 0 ? ((value / totalChartValue) * 100).toFixed(1) : 0;
                    return [`${value.toFixed(2)} ${currency} (${percent}%)`, t('total', lang)];
                  }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={50}>
                  {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <p className="text-sm text-slate-500 font-medium uppercase tracking-tight">{t('balance', lang)}</p>
          <p className={`text-2xl font-black mt-1 ${balance >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-danger'}`}>{balance.toFixed(2)} {currency}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <p className="text-sm text-slate-500 font-medium uppercase tracking-tight">{t('income', lang)}</p>
          <p className="text-2xl font-black mt-1 text-success">+{income.toFixed(2)} {currency}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <p className="text-sm text-slate-500 font-medium uppercase tracking-tight">{t('expense', lang)}</p>
          <p className={`text-2xl font-black mt-1 text-danger`}>-{expense.toFixed(2)} {currency}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tabela de Transacções Primeiro */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('recentTransactions', lang)}</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                <span className="hidden sm:inline">{t('import', lang)}</span>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
              </label>

              <div className="relative flex-1 sm:flex-none">
                <button 
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} 
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Download size={16} /> 
                  <span className="hidden sm:inline">{t('export', lang)}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={() => { exportTransactionsToCSV(transactions); setIsExportMenuOpen(false); }} 
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <FileText size={18} className="text-slate-400" /> CSV
                    </button>
                    <button 
                      onClick={() => { exportTransactionsToExcel(transactions); setIsExportMenuOpen(false); }} 
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <FileSpreadsheet size={18} className="text-emerald-500" /> Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 uppercase font-black text-[10px] tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-4">{t('date', lang)}</th>
                  <th className="px-4 py-4">{t('description', lang)}</th>
                  <th className="px-4 py-4">{t('category', lang)}</th>
                  <th className="px-4 py-4 text-right">{t('amount', lang)}</th>
                  <th className="px-4 py-4 text-center">{t('actions', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.slice().reverse().map(tr => (
                  <tr key={tr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-slate-400 dark:text-slate-500 font-mono text-[11px]">{tr.date}</td>
                    <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-200">{tr.description}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-lg uppercase">
                        {t(tr.category as any, lang)}
                      </span>
                    </td>
                    <td className={`px-4 py-4 text-right font-bold ${tr.type === 'income' ? 'text-success' : tr.type === 'transfer' ? 'text-accent' : 'text-slate-700 dark:text-slate-200'}`}>
                      {tr.type === 'income' ? '+' : tr.type === 'transfer' ? '⇅ ' : '-'}{tr.amount.toFixed(2)} {currency}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => onDeleteTransaction(tr.id)} className="text-slate-300 hover:text-danger p-2 hover:bg-danger/5 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="py-20 text-center text-slate-400 italic flex flex-col items-center gap-2">
                <FileText size={40} className="opacity-10" />
                <span>{t('noData', lang)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico Agora Abaixo da Tabela */}
        {showCharts && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                  {t('charts', lang)}
                </h2>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">
                  {lang === 'pt' ? 'Distribuição de Gastos por Categoria' : 'Expense Distribution by Category'}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingDown size={14} className="text-danger" />
                  Total {currency}: <span className="text-slate-900 dark:text-white ml-1 font-mono text-base">{totalChartValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </span>
              </div>
            </div>
            {renderDashboardChart()}
          </div>
        )}
      </div>

      <button 
        onClick={() => setIsModalOpen(true)} 
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 bg-accent hover:bg-blue-600 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 z-40"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg my-8 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">{t('newTransaction', lang)}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter mt-1">{t('financialRecord', lang)}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
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
                <div>
                  <label className={labelClasses}>{t('operationType', lang)}</label>
                  <select 
                    className={inputClasses} 
                    value={newTrans.type} 
                    onChange={e => setNewTrans({ ...newTrans, type: e.target.value as any })}
                    disabled={newTrans.category === 'Salário' || newTrans.category === 'Transferência Entre Contas'}
                  >
                    <option value="expense">{t('expense', lang)}</option>
                    <option value="income">{t('income', lang)}</option>
                    <option value="transfer">{t('transfer', lang)}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>{t('category', lang)}</label>
                  <select className={inputClasses} value={newTrans.category} onChange={e => setNewTrans({ ...newTrans, category: e.target.value })}>
                    {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{t(c as any, lang)}</option>)}
                  </select>
                </div>
              </div>

              <div 
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                  isRecurring ? 'bg-accent/5 border-accent shadow-sm' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                }`}
                onClick={() => setIsRecurring(!isRecurring)}
              >
                <div className={`w-6 h-6 flex items-center justify-center rounded-lg border-2 transition-all ${
                  isRecurring ? 'bg-accent border-accent text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600'
                }`}>
                   {isRecurring && <Repeat size={14} strokeWidth={3} />}
                </div>
                <span className={`text-sm font-bold ${isRecurring ? 'text-accent' : 'text-slate-600 dark:text-slate-400'}`}>
                  {t('recurring', lang)}
                </span>
              </div>

              {isRecurring && (
                <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className={labelClasses}><Repeat size={14} className="inline mr-1" /> {t('frequency', lang)}</label>
                    <select className={inputClasses} value={recurrenceFreq} onChange={e => setRecurrenceFreq(e.target.value as any)}>
                      <option value="daily">{t('daily', lang)}</option>
                      <option value="weekly">{t('weekly', lang)}</option>
                      <option value="monthly">{t('monthly', lang)}</option>
                      <option value="yearly">{t('yearly', lang)}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className={labelClasses}>{t('endCondition', lang)}</label>
                       <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 h-[46px]">
                          <button 
                            type="button" 
                            onClick={() => setEndCondition('count')} 
                            className={`flex-1 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${endCondition === 'count' ? 'bg-accent text-white' : 'text-slate-400'}`}
                          >
                            {t('count', lang)}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setEndCondition('date')} 
                            className={`flex-1 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${endCondition === 'date' ? 'bg-accent text-white' : 'text-slate-400'}`}
                          >
                            {t('endDate', lang)}
                          </button>
                       </div>
                    </div>
                    <div>
                      {endCondition === 'count' ? (
                        <>
                          <label className={labelClasses}><Hash size={14} className="inline mr-1" /> {t('occurrences', lang)}</label>
                          <input type="number" min="1" className={inputClasses} value={occCount} onChange={e => setOccCount(parseInt(e.target.value))} />
                        </>
                      ) : (
                        <>
                          <label className={labelClasses}><CalendarDays size={14} className="inline mr-1" /> {t('until', lang)}</label>
                          <input type="date" className={inputClasses} value={occUntil} onChange={(e) => setOccUntil(e.target.value)} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  {t('cancel', lang)}
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-4 bg-accent hover:bg-blue-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-accent/20 active:scale-[0.98]"
                >
                  {t('save', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
