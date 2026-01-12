
import React, { useState } from 'react';
import { Goal, Language } from '../types';
import { t } from '../i18n';
import { Target, Plus, PiggyBank, Trash2, X, Wallet, ArrowUpRight } from 'lucide-react';

interface GoalsProps {
  goals: Goal[];
  onAddGoal: (g: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onAllocate: (goalId: string) => void;
  allocationPercentage: number;
  currentBalance: number;
  savingsBalance: number;
  currency: string;
  lang: Language;
}

const Goals: React.FC<GoalsProps> = ({ 
  goals, 
  onAddGoal, 
  onDeleteGoal,
  onAllocate, 
  allocationPercentage, 
  currentBalance,
  savingsBalance,
  currency,
  lang
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({ currentAmount: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoal.title && newGoal.targetAmount) {
      onAddGoal({
        id: Date.now().toString(),
        title: newGoal.title,
        targetAmount: Number(newGoal.targetAmount),
        currentAmount: Number(newGoal.currentAmount || 0)
      });
      setIsModalOpen(false);
      setNewGoal({ currentAmount: 0, title: '', targetAmount: 0 });
    }
  };

  const allocationAmount = currentBalance > 0 ? (currentBalance * (allocationPercentage / 100)) : 0;
  const inputClasses = "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all placeholder:text-slate-400";
  const labelClasses = "block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1";

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all">
          <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
            <Wallet size={18} className="text-accent" />
            <span className="text-sm font-medium uppercase tracking-wider">{t('savingsBalance', lang)}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800 dark:text-white">
              {savingsBalance.toFixed(2)} {currency}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-accent hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg w-full md:w-auto">
            <Plus size={20} /> {t('newGoal', lang)}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 ml-1">{t('myGoals', lang)}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            return (
              <div key={goal.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col h-full">
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-accent"><Target size={20} /></div>
                    <button onClick={() => onDeleteGoal(goal.id)} className="text-slate-300 hover:text-danger"><Trash2 size={18} /></button>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate mb-1">{goal.title}</h3>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                    <span className="font-bold text-slate-900 dark:text-slate-200">{goal.currentAmount.toFixed(2)} {currency}</span> / {goal.targetAmount.toFixed(2)} {currency}
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden relative"><div className="bg-success h-full transition-all" style={{ width: `${progress}%` }}></div></div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t('progress', lang)}</span>
                    <span className="text-xs font-bold text-success bg-success/10 px-2 rounded-md">{progress.toFixed(1)}%</span>
                  </div>
                </div>
                <button onClick={() => onAllocate(goal.id)} disabled={allocationAmount <= 0} className="w-full mt-auto py-3.5 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-accent hover:text-white transition-all disabled:opacity-30">
                  <PiggyBank size={18} className="inline mr-2" /> {t('allocate', lang)} {allocationAmount > 0 ? allocationAmount.toFixed(2) : '0.00'} {currency}
                </button>
              </div>
            );
          })}
        </div>
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800">
            <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('newGoal', lang)}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div><label className={labelClasses}>Título</label><input required type="text" className={inputClasses} value={newGoal.title || ''} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} /></div>
              <div><label className={labelClasses}>{t('total', lang)} ({currency})</label><input required type="number" step="0.01" className={inputClasses} value={newGoal.targetAmount || ''} onChange={e => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) })} /></div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  {t('cancel', lang)}
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-4 bg-accent hover:bg-blue-600 text-white font-bold rounded-2xl transition-all"
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

export default Goals;
