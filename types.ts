
export type TransactionType = 'income' | 'expense' | 'transfer';
export type InvestmentAction = 'Market buy' | 'Market sell' | 'Dividend' | 'Deposit' | 'Withdrawal' | 'Interest on cash';
export type ChartType = 'pie' | 'bar';
export type Language = 'pt' | 'en';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
}

export interface Investment {
  id: string;
  name: string;
  ticker?: string;
  isin?: string;
  type: InvestmentAction;
  date: string;
  pricePerShare: number;
  investedValue: number;
  shares: number;
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
}

export interface AppConfig {
  allocationPercentage: number;
  trading212Token: string;
  currency: string;
  userName: string;
  theme: ThemeMode;
  language: Language;
  showDashboardCharts: boolean;
  dashboardChartType: ChartType;
  showInvestmentCharts: boolean;
  investmentChartType: ChartType;
}

export const DEFAULT_CATEGORIES = [
  'Alimentação',
  'Habitação',
  'Transporte',
  'Saúde',
  'Lazer',
  'Salário',
  'Investimento',
  'Poupança Automática',
  'Transferência Entre Contas',
  'Outros'
];
