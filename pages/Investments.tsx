
import React, { useState, useEffect, useMemo } from 'react';
import { Investment, ChartType, InvestmentAction, Language } from '../types';
import { translations, t } from '../i18n';
import { 
  Plus, Trash2, LineChart, X, Upload, Download, 
  Search, Loader2, TrendingUp, PiggyBank, CreditCard, DollarSign,
  CheckCircle, Lock
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip as RechartsTooltip, BarChart, 
  Bar, XAxis, YAxis, CartesianGrid, Sector
} from 'recharts';
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
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

const translateAction = (action: string, lang: Language) => {
  const map: Record<string, keyof typeof translations.pt> = {
    'Market buy': 'buy',
    'Market sell': 'sell',
    'Dividend': 'dividends',
    'Deposit': 'deposit',
    'Withdrawal': 'withdrawal',
    'Interest on cash': 'interest'
  };
  const key = (map[action] || 'others') as keyof typeof translations.pt;
  return t(key, lang);
};

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

const Investments: React.FC<InvestmentsProps> = ({ 
  investments, 
  onAddInvestment, 
  onDeleteInvestment, 
  onImportInvestments,
  currency,
  showCharts,
  chartType,
  lang,
  notify
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const [newInv, setNewInv] = useState<Partial<Investment>>({
    type: 'Market buy',
    date: new Date().toISOString().split('T')[0],
    pricePerShare: 0,
    investedValue: 0,
    shares: 0
  });

  useEffect(() => {
    if (newInv.pricePerShare && newInv.investedValue && newInv.pricePerShare > 0) {
      const calculated_shares = newInv.investedValue / newInv.pricePerShare;
      setNewInv(prev => ({ ...prev, shares: parseFloat(calculated_shares.toFixed(6)) }));
    } else {
      setNewInv(prev => ({ ...prev, shares: 0 }));
    }
  }, [newInv.pricePerShare, newInv.investedValue]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const imported = await parseInvestmentsFile(file);
      onImportInvestments(imported);
    } catch (err: any) {
      const msg = t(err.message as any, lang);
      notify(msg, "error");
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

  const stats = useMemo(() => {
    const buys = investments.filter(i => i.type === 'Market buy').reduce((acc, i) => acc + i.investedValue, 0);
    const sells = investments.filter(i => i.type === 'Market sell').reduce((acc, i) => acc + i.investedValue, 0);
    const divs = investments.filter(i => i.type.toLowerCase().includes('dividend')).reduce((acc, i) => acc + i.investedValue, 0);
    const deps = investments.filter(i => i.type === 'Deposit').reduce((acc, i) => acc + i.investedValue, 0);
    const withs = investments.filter(i => i.type === 'Withdrawal').reduce((acc, i) => acc + i.investedValue, 0);
    const interest = investments.filter(i => i.type.toLowerCase().includes('interest')).reduce((acc, i) => acc + i.investedValue, 0);

    return {
      netInvested: buys - sells,
      totalDividends: divs,
      totalDeposits: deps,
      cashBalance: deps - withs - buys + sells + divs + interest
    };
  }, [investments]);

  const chartData = useMemo(() => {
    const allocation = investments
      .filter(inv => inv.type === 'Market buy')
      .reduce((acc, inv) => {
        const key = inv.ticker || inv.name;
        acc[key] = (acc[key] || 0) + inv.investedValue;
        return acc;
      }, {} as Record<string, number>);

    return Object.keys(allocation).map(key => ({
      name: key,
      value: parseFloat(allocation[key].toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [investments]);

  const totalChartValue = useMemo(() => chartData.reduce((acc, item) => acc + item.value, 0), [chartData]);

  const filteredInvestments = useMemo(() => {
    return investments.filter(inv => 
      inv.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.ticker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.isin?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice().reverse();
  }, [investments, searchTerm]);

  const getActionBadge = (type: string) => {
    const tLower = type.toLowerCase();
    if (tLower.includes('buy')) return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800';
    if (tLower.includes('sell')) return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800';
    if (tLower.includes('dividend')) return 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800';
    if (tLower.includes('deposit')) return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800';
    return 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100';
  };

  const renderChart = () => {
    if (chartData.length === 0) return (
      <div className="flex flex-col items-center justify-center text-slate-400 py-12">
        <LineChart size={48} className="opacity-10 mb-2" />
        <p className="text-sm italic">{t('noData', lang)}</p>
      </div>
    );

    return (
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 w-full min-h-[450px]">
        <div className="w-full lg:w-auto flex-shrink-0 flex flex-col flex-wrap max-h-[400px] overflow-y-auto lg:overflow-visible gap-y-2 gap-x-6">
          {chartData.map((entry, index) => (
            <button
              key={entry.name}
              onClick={() => setActiveIndex(activeIndex === index ? null : index)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left ${
                activeIndex === index 
                ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700' 
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-70 hover:opacity-100'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }} 
              />
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase truncate max-w-[120px]">
                  {entry.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {((entry.value / totalChartValue) * 100).toFixed(1)}%
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 w-full h-[400px] relative">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie 
                  activeIndex={activeIndex ?? undefined}
                  activeShape={renderActiveShape}
                  data={chartData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={75} 
                  outerRadius={115} 
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
                  position={{ y: 20 }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)',
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => {
                    const percent = totalChartValue > 0 ? ((value / totalChartValue) * 100).toFixed(1) : 0;
                    return [`${value.toFixed(2)} ${currency} (${percent}%)`, t('total', lang)];
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                  {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const inputClasses = "w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all";
  const labelClasses = "block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 ml-1 uppercase tracking-tight";

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Resumo Estilizado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('totalAssets', lang), value: stats.netInvested, color: 'text-slate-900 dark:text-white', icon: <TrendingUp size={16} /> },
          { label: t('dividends', lang), value: stats.totalDividends, color: 'text-purple-600', icon: <DollarSign size={16} /> },
          { label: t('cashBalance', lang), value: stats.cashBalance, color: 'text-emerald-600', icon: <PiggyBank size={16} /> },
          { label: t('totalDeposits', lang), value: stats.totalDeposits, color: 'text-slate-900 dark:text-white', icon: <CreditCard size={16} /> }
        ].map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2 text-slate-400 uppercase tracking-widest text-[10px] font-black">
              <span className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">{card.icon}</span> {card.label}
            </div>
            <p className={`text-xl md:text-2xl font-black ${card.color}`}>
              {card.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
            </p>
          </div>
        ))}
      </div>

      {/* Histórico e Tabela */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-accent text-white p-3 rounded-2xl shadow-lg shadow-accent/20"><LineChart size={24}/></div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{t('orderHistory', lang)}</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">{investments.length} {t('recordedTransactions', lang)}</p>
            </div>
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <label className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-2xl cursor-pointer transition-all uppercase tracking-tighter">
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <span>{t('import', lang)}</span>
              <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
            </label>
            <button onClick={() => exportInvestmentsToExcel(investments)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-2xl transition-all uppercase tracking-tighter">
              <Download size={16} /> {t('export', lang)}
            </button>
          </div>
        </div>

        <div className="px-8 py-4 bg-slate-50/30 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-lg">
            <Search size={20} className="absolute left-4 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder', lang)} 
              className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] text-sm outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 uppercase font-black text-[10px] tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-5">{t('date', lang)}</th>
                <th className="px-8 py-5">{lang === 'pt' ? 'Ativo' : 'Asset'}</th>
                <th className="px-8 py-5">{t('operationType', lang)}</th>
                <th className="px-8 py-5 text-right">{t('price', lang)}</th>
                <th className="px-8 py-5 text-right">{t('shares', lang)}</th>
                <th className="px-8 py-5 text-right">{t('total', lang)}</th>
                <th className="px-8 py-5 text-center">{t('actions', lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvestments.length > 0 ? filteredInvestments.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-5 whitespace-nowrap text-slate-400 dark:text-slate-500 font-mono text-[11px]">{inv.date}</td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 dark:text-slate-100 leading-tight text-base group-hover:text-accent transition-colors">{inv.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold tracking-tight mt-1">
                        {inv.ticker ? `${inv.ticker}` : ''} {inv.isin ? ` • ${inv.isin}` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1.5 text-[9px] font-black rounded-xl border uppercase tracking-wider shadow-sm ${getActionBadge(inv.type)}`}>
                      {translateAction(inv.type, lang)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-mono text-xs font-bold">{inv.pricePerShare > 0 ? inv.pricePerShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '-'}</td>
                  <td className="px-8 py-5 text-right font-mono text-xs font-bold">{inv.shares > 0 ? inv.shares.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '-'}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-white text-base">
                    {inv.investedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button onClick={() => onDeleteInvestment(inv.id)} className="text-slate-300 hover:text-danger p-3 hover:bg-danger/5 rounded-2xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-8 py-24 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center">
                       <Search size={48} className="mb-4 opacity-10" />
                       <span className="text-lg font-bold opacity-30">{t('noData', lang)}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCharts && (
        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
            <div>
              <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                {t('charts', lang)}
              </h2>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">
                {t('portfolioAllocation', lang)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-700">
               <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Total {currency}: <span className="text-slate-900 dark:text-white ml-1">{totalChartValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               </span>
            </div>
          </div>
          {renderChart()}
        </div>
      )}

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-12 md:right-12 bg-accent hover:bg-blue-600 text-white p-5 rounded-3xl shadow-2xl transition-all transform hover:scale-110 active:scale-90 z-[45] ring-8 ring-accent/5"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/10">
              <div>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{t('newEntry', lang)}</h3>
                <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-tight">{t('financialRecord', lang)}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 text-slate-400 hover:text-accent hover:bg-accent/5 rounded-2xl transition-all">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>{t('assetName', lang)}</label>
                  <input required type="text" placeholder="ex: Apple Inc" className={inputClasses} value={newInv.name || ''} onChange={e => setNewInv({ ...newInv, name: e.target.value })} />
                </div>
                <div>
                  <label className={labelClasses}>{t('operationType', lang)}</label>
                  <select className={inputClasses} value={newInv.type} onChange={e => setNewInv({ ...newInv, type: e.target.value as any })}>
                    <option value="Market buy">{t('buy', lang)}</option>
                    <option value="Market sell">{t('sell', lang)}</option>
                    <option value="Dividend">{t('dividends', lang)}</option>
                    <option value="Deposit">{t('deposit', lang)}</option>
                    <option value="Withdrawal">{t('withdrawal', lang)}</option>
                    <option value="Interest on cash">{t('interest', lang)}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className={labelClasses}>{t('ticker', lang)}</label>
                    <input type="text" placeholder="AAPL" className={inputClasses} value={newInv.ticker || ''} onChange={e => setNewInv({ ...newInv, ticker: e.target.value.toUpperCase() })} />
                 </div>
                 <div>
                    <label className={labelClasses}>{t('isin', lang)}</label>
                    <input type="text" placeholder="US0378331005" className={inputClasses} value={newInv.isin || ''} onChange={e => setNewInv({ ...newInv, isin: e.target.value.toUpperCase() })} />
                 </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                  <label className={labelClasses}>{t('date', lang)}</label>
                  <input required type="date" className={inputClasses} value={newInv.date} onChange={e => setNewInv({ ...newInv, date: e.target.value })} />
                 </div>
                 <div>
                  <label className={labelClasses}>{t('total', lang)} ({currency})</label>
                  <input required type="number" step="0.01" placeholder="0.00" className={inputClasses} value={newInv.investedValue || ''} onChange={e => setNewInv({ ...newInv, investedValue: parseFloat(e.target.value) })} />
                 </div>
                 <div>
                  <label className={labelClasses}>{t('price', lang)}</label>
                  <input type="number" step="0.0001" placeholder="0.00" className={inputClasses} value={newInv.pricePerShare || ''} onChange={e => setNewInv({ ...newInv, pricePerShare: parseFloat(e.target.value) })} />
                 </div>
                 <div>
                  <label className={labelClasses}>{t('sharesCalculated', lang)}</label>
                  <div className="relative">
                    <input 
                      readOnly 
                      type="number" 
                      className={`${inputClasses} bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed border-dashed opacity-80`} 
                      value={newInv.shares || 0} 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 rounded-md">
                       <Lock size={10} className="text-accent" />
                       <span className="text-[10px] font-black text-accent uppercase tracking-tighter">Auto</span>
                    </div>
                  </div>
                 </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-[2rem] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-lg"
                >
                  {t('cancel', lang)}
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-6 bg-accent hover:bg-blue-600 text-white font-black rounded-[2rem] transition-all shadow-2xl shadow-accent/20 flex items-center justify-center gap-3 text-lg"
                >
                  <CheckCircle size={24} /> {t('save', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;
