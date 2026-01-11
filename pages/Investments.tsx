
import React, { useState, useEffect } from 'react';
import { Investment, ChartType, InvestmentAction, Language } from '../types';
import { t } from '../i18n';
import { Plus, Trash2, LineChart, RefreshCw, X, Upload, Download, FileSpreadsheet, AlertCircle, Loader2, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { parseInvestmentsFile, exportInvestmentsToExcel } from '../utils/csvHelper';

interface InvestmentsProps {
  investments: Investment[];
  onAddInvestment: (inv: Investment) => void;
  onDeleteInvestment: (id: string) => void;
  onImportInvestments: (invs: Investment[]) => void;
  currency: string;
  showCharts: boolean;
  chartType: ChartType;
  lang: Language;
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

const Investments: React.FC<InvestmentsProps> = ({ 
  investments, 
  onAddInvestment, 
  onDeleteInvestment, 
  onImportInvestments,
  currency,
  showCharts,
  chartType,
  lang
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newInv, setNewInv] = useState<Partial<Investment>>({
    type: 'Market buy',
    date: new Date().toISOString().split('T')[0],
    pricePerShare: 0,
    investedValue: 0,
    shares: 0
  });

  useEffect(() => {
    if (newInv.pricePerShare && newInv.investedValue && newInv.pricePerShare > 0) {
      const calculatedShares = newInv.investedValue / newInv.pricePerShare;
      setNewInv(prev => ({ ...prev, shares: parseFloat(calculatedShares.toFixed(6)) }));
    }
  }, [newInv.pricePerShare, newInv.investedValue]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const imported = await parseInvestmentsFile(file);
      onImportInvestments(imported);
    } catch (err) {
      console.error(err);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInv.name && (newInv.investedValue || newInv.type === 'Dividend')) {
      onAddInvestment({
        id: Date.now().toString(),
        name: newInv.name,
        ticker: newInv.ticker?.toUpperCase(),
        isin: newInv.isin?.toUpperCase(),
        type: newInv.type as InvestmentAction,
        date: newInv.date || new Date().toISOString().split('T')[0],
        pricePerShare: Number(newInv.pricePerShare || 0),
        investedValue: Number(newInv.investedValue || 0),
        shares: Number(newInv.shares || 0)
      });
      setIsModalOpen(false);
      setNewInv({ type: 'Market buy', date: new Date().toISOString().split('T')[0], pricePerShare: 0, investedValue: 0, shares: 0 });
    }
  };

  const totalBuys = investments.filter(i => i.type === 'Market buy').reduce((acc, i) => acc + i.investedValue, 0);
  const totalSells = investments.filter(i => i.type === 'Market sell').reduce((acc, i) => acc + i.investedValue, 0);
  const totalDividends = investments.filter(i => i.type.startsWith('Dividend')).reduce((acc, i) => acc + i.investedValue, 0);
  const totalDeposits = investments.filter(i => i.type === 'Deposit').reduce((acc, i) => acc + i.investedValue, 0);
  const totalWithdrawals = investments.filter(i => i.type === 'Withdrawal').reduce((acc, i) => acc + i.investedValue, 0);
  
  const cashBalance = totalDeposits - totalWithdrawals - totalBuys + totalSells + totalDividends;
  const netInvested = totalBuys - totalSells;

  const filteredInvestments = investments.filter(inv => 
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.ticker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.isin?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice().reverse();

  // Fix: Defined allocationData before mapping to chartData to resolve "Cannot find name 'allocationData'" error.
  const allocationData = investments.filter(inv => inv.type === 'Market buy').reduce((acc, inv) => {
    const key = inv.ticker || inv.name;
    acc[key] = (acc[key] || 0) + inv.investedValue;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(allocationData).map(key => ({
    name: key,
    value: parseFloat(allocationData[key]?.toFixed(2) || '0')
  }));

  const inputClasses = "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all placeholder:text-slate-400";
  const labelClasses = "block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1";

  const cleanType = (type: string) => {
    // Remove qualquer texto entre parênteses
    let cleaned = type.replace(/\s*\(.*?\)\s*/g, '').trim();
    if (cleaned.toLowerCase().includes('dividend')) return t('dividends', lang);
    if (cleaned.toLowerCase().includes('buy')) return t('buy', lang);
    if (cleaned.toLowerCase().includes('sell')) return t('sell', lang);
    if (cleaned.toLowerCase().includes('deposit')) return t('deposit', lang);
    if (cleaned.toLowerCase().includes('withdrawal')) return t('withdrawal', lang);
    return cleaned;
  };

  const getActionBadge = (type: string) => {
    const tLower = type.toLowerCase();
    if (tLower.includes('buy')) return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800';
    if (tLower.includes('sell')) return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800';
    if (tLower.includes('dividend')) return 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800';
    if (tLower.includes('deposit')) return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800';
    return 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100';
  };

  // Fix: Added renderChart implementation to handle visualization of investment data.
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('totalAssets', lang)}</p>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{netInvested.toFixed(2)} {currency}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('dividends', lang)}</p>
          <p className="text-xl font-bold text-purple-600">+{totalDividends.toFixed(2)} {currency}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('cashBalance', lang)}</p>
          <p className="text-xl font-bold text-emerald-600">{cashBalance.toFixed(2)} {currency}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('totalDeposits', lang)}</p>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{totalDeposits.toFixed(2)} {currency}</p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${showCharts ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
        <div className={`${showCharts ? 'lg:col-span-2' : ''} space-y-4`}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <LineChart className="text-accent" size={20}/> {t('orderHistory', lang)}
              </h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl cursor-pointer transition-all">
                  {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  <span>{t('import', lang)}</span>
                  <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
                </label>
                <button onClick={() => exportInvestmentsToExcel(investments)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl transition-all">
                  <Download size={16} /> {t('export', lang)}
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={t('searchPlaceholder', lang)} 
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-accent transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-widest">
                  <tr>
                    <th className="px-6 py-4">{t('date', lang)}</th>
                    <th className="px-6 py-4">Ativo</th>
                    <th className="px-6 py-4">{t('operationType', lang)}</th>
                    <th className="px-6 py-4 text-right">{t('price', lang)}</th>
                    <th className="px-6 py-4 text-right">{t('shares', lang)}</th>
                    <th className="px-6 py-4 text-right">{t('total', lang)}</th>
                    <th className="px-6 py-4 text-center">{t('actions', lang)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInvestments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-medium">{inv.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{inv.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {inv.ticker ? `${inv.ticker}` : ''} {inv.isin ? ` • ${inv.isin}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-lg border uppercase ${getActionBadge(inv.type)}`}>
                          {cleanType(inv.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">{inv.pricePerShare > 0 ? inv.pricePerShare.toFixed(2) : '-'}</td>
                      <td className="px-6 py-4 text-right font-mono">{inv.shares > 0 ? inv.shares.toFixed(4) : '-'}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-100">
                        {inv.investedValue.toFixed(2)} {currency}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => onDeleteInvestment(inv.id)} className="text-slate-300 hover:text-danger transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-3 py-4 bg-accent hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95"
          >
            <Plus size={22} /> {t('newEntry', lang)}
          </button>
          
          {/* Fix: Displayed charts based on showCharts configuration */}
          {showCharts && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center h-fit">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 w-full">{t('charts', lang)}</h2>
              {renderChart()}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('newEntry', lang)}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-accent rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Ativo</label>
                  <input required type="text" className={inputClasses} value={newInv.name || ''} onChange={e => setNewInv({ ...newInv, name: e.target.value })} />
                </div>
                <div>
                  <label className={labelClasses}>{t('operationType', lang)}</label>
                  <select className={inputClasses} value={newInv.type} onChange={e => setNewInv({ ...newInv, type: e.target.value as any })}>
                    <option value="Market buy">{t('buy', lang)}</option>
                    <option value="Market sell">{t('sell', lang)}</option>
                    <option value="Dividend">{t('dividends', lang)}</option>
                    <option value="Deposit">{t('deposit', lang)}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className={labelClasses}>{t('ticker', lang)}</label>
                    <input type="text" className={inputClasses} value={newInv.ticker || ''} onChange={e => setNewInv({ ...newInv, ticker: e.target.value.toUpperCase() })} />
                 </div>
                 <div>
                    <label className={labelClasses}>{t('isin', lang)}</label>
                    <input type="text" className={inputClasses} value={newInv.isin || ''} onChange={e => setNewInv({ ...newInv, isin: e.target.value.toUpperCase() })} />
                 </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                 <div><label className={labelClasses}>{t('date', lang)}</label><input required type="date" className={inputClasses} value={newInv.date} onChange={e => setNewInv({ ...newInv, date: e.target.value })} /></div>
                 <div><label className={labelClasses}>{t('total', lang)}</label><input required type="number" step="0.01" className={inputClasses} value={newInv.investedValue || ''} onChange={e => setNewInv({ ...newInv, investedValue: parseFloat(e.target.value) })} /></div>
                 <div><label className={labelClasses}>{t('price', lang)}</label><input type="number" step="0.0001" className={inputClasses} value={newInv.pricePerShare || ''} onChange={e => setNewInv({ ...newInv, pricePerShare: parseFloat(e.target.value) })} /></div>
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

export default Investments;
