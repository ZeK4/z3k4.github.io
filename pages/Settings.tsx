
import React from 'react';
import { AppConfig, ChartType, Language, ThemeMode } from '../types';
import { t } from '../i18n';
import { Save, Shield, Percent, User, Moon, Sun, PieChart as PieIcon, BarChart3 as BarIcon, Eye, EyeOff, Globe, Monitor, Settings2 } from 'lucide-react';

interface SettingsProps {
  config: AppConfig;
  onUpdateConfig: (c: AppConfig) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  lang: Language;
}

const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig, notify, lang }) => {
  const handleChange = (key: keyof AppConfig, value: any) => {
    onUpdateConfig({ ...config, [key]: value });
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
            <PieIcon size={14} /> Pizza
          </button>
          <button 
            onClick={() => handleChange(typeKey, 'bar')} 
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${config[typeKey] === 'bar' ? 'border-accent bg-accent/5 text-accent' : 'border-transparent bg-white dark:bg-slate-800 text-slate-400'}`}
          >
            <BarIcon size={14} /> {lang === 'pt' ? 'Barras' : 'Bars'}
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

      {/* Idioma */}
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

      {/* Aparência */}
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

      {/* Regras de Alocação (V1.2.0 Alpha Restored) */}
      <div className={sectionClasses}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center gap-2">
          <Percent size={18} className="text-accent" /> <h3 className="font-bold text-slate-800 dark:text-slate-200">{t('allocationRules', lang)}</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <label className={labelClasses}>{lang === 'pt' ? 'Percentagem por objetivo' : 'Percentage per goal'}</label>
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
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              {lang === 'pt' 
                ? "* Este valor define quanto do seu saldo disponível será sugerido para poupança ao clicar no botão 'Alocar' de cada objetivo." 
                : "* This value defines how much of your available balance will be suggested for savings when clicking the 'Allocate' button for each goal."}
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos e Visualizações */}
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

      {/* Perfil */}
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
    </div>
  );
};

export default Settings;
