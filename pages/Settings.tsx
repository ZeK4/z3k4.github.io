
import React, { useState } from 'react';
import { AppConfig, Language, RecurringAlert, AlertType } from '../types';
import { t } from '../i18n';
import { 
  Save, Percent, User, Moon, Sun, PieChart as PieIcon, 
  BarChart3 as BarIcon, Eye, EyeOff, Globe, Monitor, 
  Settings2, Bell, Plus, Calendar, Trash2, Check, X,
  Briefcase, TrendingUp, AlertCircle
} from 'lucide-react';

interface SettingsProps {
  config: AppConfig;
  onUpdateConfig: (c: AppConfig) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  lang: Language;
}

const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig, notify, lang }) => {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<RecurringAlert>>({
    type: 'salary',
    dayOfMonth: 1,
    active: true,
    autoRecord: false
  });

  const handleChange = (key: keyof AppConfig, value: any) => {
    onUpdateConfig({ ...config, [key]: value });
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAlert.title && newAlert.dayOfMonth) {
      const alert: RecurringAlert = {
        id: Date.now().toString(),
        title: newAlert.title,
        type: newAlert.type as AlertType,
        dayOfMonth: Number(newAlert.dayOfMonth),
        amount: Number(newAlert.amount || 0),
        active: true,
        autoRecord: !!newAlert.autoRecord
      };
      
      const updatedAlerts = [...(config.alerts || []), alert];
      handleChange('alerts', updatedAlerts);
      setIsAlertModalOpen(false);
      setNewAlert({ type: 'salary', dayOfMonth: 1, active: true, autoRecord: false });
      notify(t('alertCreated', lang), "success");
    }
  };

  const removeAlert = (id: string) => {
    const updatedAlerts = config.alerts.filter(a => a.id !== id);
    handleChange('alerts', updatedAlerts);
  };

  const inputClasses = "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all placeholder:text-slate-400";
  const labelClasses = "block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1";
  const sectionClasses = "bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-6 transition-colors";

  const ChartToggle = ({ label, showKey, typeKey }: { label: string, showKey: 'showDashboardCharts' | 'showInvestmentCharts', typeKey: 'dashboardChartType' | 'investmentChartType' }) => (
    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <button 
          onClick={() => handleChange(showKey, !config[showKey])}
          className={`p-2 rounded-lg transition-all ${config[showKey] ? 'bg-accent text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}
        >
          {config[showKey] ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
      {config[showKey] && (
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleChange(typeKey, 'pie')} 
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${config[typeKey] === 'pie' ? 'border-accent bg-accent/5 text-accent' : 'border-transparent bg-white dark:bg-slate-800 text-slate-400'}`}
          >
            <PieIcon size={14} /> {t('pie', lang)}
          </button>
          <button 
            onClick={() => handleChange(typeKey, 'bar')} 
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${config[typeKey] === 'bar' ? 'border-accent bg-accent/5 text-accent' : 'border-transparent bg-white dark:bg-slate-800 text-slate-400'}`}
          >
            <BarIcon size={14} /> {t('bar', lang)}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('settings', lang)}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('manageFinances', lang)}</p>
      </div>

      <div className={sectionClasses}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-2">
          <Globe size={18} className="text-accent" /> <h3 className="font-bold text-slate-800 dark:text-slate-200">{t('language', lang)}</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleChange('language', 'pt')} className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${config.language === 'pt' ? 'border-accent bg-blue-50 dark:bg-blue-900/10 text-accent' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'}`}><span className="font-bold">Português (PT)</span></button>
            <button onClick={() => handleChange('language', 'en')} className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${config.language === 'en' ? 'border-accent bg-blue-50 dark:bg-blue-900/10 text-accent' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'}`}><span className="font-bold">English (EN)</span></button>
          </div>
        </div>
      </div>

      <div className={sectionClasses}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-2">
          <Monitor size={18} className="text-accent" /> <h3 className="font-bold text-slate-800 dark:text-slate-200">{t('appearance', lang)}</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => handleChange('theme', 'light')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${config.theme === 'light' ? 'border-accent bg-blue-50 dark:bg-blue-900/10 text-accent' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}><Sun size={20} /><span className="text-[10px] font-bold uppercase">{t('light', lang)}</span></button>
            <button onClick={() => handleChange('theme', 'dark')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${config.theme === 'dark' ? 'border-accent bg-blue-50 dark:bg-blue-900/10 text-accent' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}><Moon size={20} /><span className="text-[10px] font-bold uppercase">{t('dark', lang)}</span></button>
            <button onClick={() => handleChange('theme', 'auto')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${config.theme === 'auto' ? 'border-accent bg-blue-50 dark:bg-blue-900/10 text-accent' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}><Monitor size={20} /><span className="text-[10px] font-bold uppercase">{t('auto', lang)}</span></button>
          </div>
        </div>
      </div>

      <div className={sectionClasses}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-accent" /> 
            <h3 className="font-bold text-slate-800 dark:text-slate-200">{t('alerts', lang)}</h3>
          </div>
          <button 
            onClick={() => setIsAlertModalOpen(true)}
            className="p-1.5 bg-accent/10 text-accent hover:bg-accent hover:text-white rounded-lg transition-all"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="p-6 space-y-3">
          {config.alerts && config.alerts.length > 0 ? (
            config.alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    alert.type === 'salary' ? 'bg-emerald-100 text-emerald-600' : 
                    alert.type === 'investment' ? 'bg-blue-100 text-blue-600' : 
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {alert.type === 'salary' ? <Briefcase size={16} /> : 
                     alert.type === 'investment' ? <TrendingUp size={16} /> : 
                     <Bell size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{alert.title}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar size={10} /> {t('dayOfMonth', lang)}: {alert.dayOfMonth}
                      {alert.autoRecord && <span className="ml-2 text-accent font-bold">• Auto</span>}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeAlert(alert.id)}
                  className="p-1.5 text-slate-300 hover:text-danger hover:bg-danger/5 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-400 italic text-sm">
              <AlertCircle size={24} className="mx-auto mb-2 opacity-20" />
              {t('noAlerts', lang)}
            </div>
          )}
        </div>
      </div>

      <div className={sectionClasses}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-2">
          <Percent size={18} className="text-accent" /> <h3 className="font-bold text-slate-800 dark:text-slate-200">{t('allocationRules', lang)}</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <label className={labelClasses}>{t('allocationPerGoal', lang)}</label>
              <span className="text-lg font-bold text-accent">{config.allocationPercentage}%</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="100" 
              step="1"
              value={config.allocationPercentage} 
              onChange={(e) => handleChange('allocationPercentage', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
        </div>
      </div>

      <div className={sectionClasses}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-2">
          <Settings2 size={18} className="text-accent" /> <h3 className="font-bold text-slate-800 dark:text-slate-200">{t('charts', lang)}</h3>
        </div>
        <div className="p-6 space-y-4">
          <ChartToggle 
            label={lang === 'pt' ? "Gráficos do Dashboard" : "Dashboard Charts"} 
            showKey="showDashboardCharts" 
            typeKey="dashboardChartType" 
          />
          <ChartToggle 
            label={lang === 'pt' ? "Gráficos de Investimento" : "Investment Charts"} 
            showKey="showInvestmentCharts" 
            typeKey="investmentChartType" 
          />
        </div>
      </div>

      <div className={sectionClasses}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-2">
          <User size={18} className="text-accent" /> <h3 className="font-bold text-slate-800 dark:text-slate-200">{t('userProfile', lang)}</h3>
        </div>
        <div className="p-6 space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t('userName', lang)}</label>
                <input type="text" value={config.userName} onChange={(e) => handleChange('userName', e.target.value)} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>{t('currency', lang)}</label>
                <input type="text" value={config.currency} onChange={(e) => handleChange('currency', e.target.value)} className={inputClasses} placeholder="€, $, etc" />
              </div>
           </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
          <button 
            onClick={() => notify(t('successSave', lang), "success")} 
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-accent text-white font-bold rounded-2xl hover:bg-black dark:hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 dark:shadow-none transform active:scale-95"
          >
             <Save size={20} /> {t('saveConfig', lang)}
          </button>
      </div>

      {isAlertModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800">
            <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('addAlert', lang)}</h3>
              <button onClick={() => setIsAlertModalOpen(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddAlert} className="p-6 space-y-5">
              <div>
                <label className={labelClasses}>{t('alertType', lang)}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setNewAlert({...newAlert, type: 'salary', title: t('salaryDay', lang)})} className={`p-2 text-[10px] font-bold rounded-xl border-2 transition-all ${newAlert.type === 'salary' ? 'border-accent bg-accent/5 text-accent' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>{t('salaryDay', lang)}</button>
                  <button type="button" onClick={() => setNewAlert({...newAlert, type: 'investment', title: t('investmentDay', lang)})} className={`p-2 text-[10px] font-bold rounded-xl border-2 transition-all ${newAlert.type === 'investment' ? 'border-accent bg-accent/5 text-accent' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>{t('investmentDay', lang)}</button>
                  <button type="button" onClick={() => setNewAlert({...newAlert, type: 'other'})} className={`p-2 text-[10px] font-bold rounded-xl border-2 transition-all ${newAlert.type === 'other' ? 'border-accent bg-accent/5 text-accent' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>{t('other', lang)}</button>
                </div>
              </div>
              <div>
                <label className={labelClasses}>{t('description', lang)}</label>
                <input required type="text" className={inputClasses} value={newAlert.title || ''} onChange={e => setNewAlert({...newAlert, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>{t('dayOfMonth', lang)} (1-31)</label>
                  <input required type="number" min="1" max="31" className={inputClasses} value={newAlert.dayOfMonth} onChange={e => setNewAlert({...newAlert, dayOfMonth: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className={labelClasses}>{t('amount', lang)} (Optional)</label>
                  <input type="number" step="0.01" className={inputClasses} value={newAlert.amount || ''} onChange={e => setNewAlert({...newAlert, amount: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <input type="checkbox" id="autoRecord" checked={newAlert.autoRecord} onChange={e => setNewAlert({...newAlert, autoRecord: e.target.checked})} className="w-4 h-4 accent-accent" />
                <label htmlFor="autoRecord" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">{t('autoRecord', lang)}</label>
              </div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAlertModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  {t('cancel', lang)}
                </button>
                <button type="submit" className="flex-[2] py-4 bg-accent hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-accent/20">
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

export default Settings;
