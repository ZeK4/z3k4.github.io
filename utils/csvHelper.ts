
import { Transaction, Investment, InvestmentAction } from '../types';
import * as XLSX from 'xlsx';

// Normalizar strings para comparação de cabeçalhos
const normalizeHeader = (h: string) => h.toLowerCase().trim().replace(/\s+/g, ' ');

// --- TRANSAÇÕES ---

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
  const ws = XLSX.utils.json_to_sheet(transactions);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "extrato_fingestor.csv";
  link.click();
};

export const exportTransactionsToExcel = (transactions: Transaction[]) => {
  const ws = XLSX.utils.json_to_sheet(transactions);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Extrato");
  XLSX.writeFile(wb, "extrato_fingestor.xlsx");
};

export const parseFile = async (file: File): Promise<Transaction[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];
  
  // Mapeamento simplificado para transações bancárias
  return jsonData.map(row => ({
    id: Date.now().toString() + Math.random().toString().slice(2, 8),
    date: row['Data do movimento'] || new Date().toISOString().split('T')[0],
    description: row['Descrição'] || 'Sem descrição',
    amount: Math.abs(parseFloat(row['Debito'] || row['Credito'] || 0)),
    type: row['Credito'] ? 'income' : 'expense',
    category: row['Categoria'] || 'Outros'
  }));
};

// --- INVESTIMENTOS ---

export const parseInvestmentsFile = async (file: File): Promise<Investment[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" }) as any[];

  if (jsonData.length === 0) throw new Error("Ficheiro vazio.");

  // Mapeamento baseado na imagem fornecida (Trading 212 Style)
  return jsonData.map(row => {
    const action = (row['Action'] || row['action'] || 'Market buy') as InvestmentAction;
    
    // Tratamento de datas (pode vir como string ou número de série do excel)
    let dateStr = row['Time'] || row['time'] || new Date().toISOString();
    if (typeof dateStr === 'number') {
      const d = new Date((dateStr - 25569) * 86400 * 1000);
      dateStr = d.toISOString().split('T')[0];
    } else {
      dateStr = dateStr.split(' ')[0]; // Pega apenas a data se houver hora
    }

    const price = parseFloat(String(row['Price / share'] || 0).replace(',', '.'));
    const total = parseFloat(String(row['Total'] || row['total'] || 0).replace(',', '.'));
    const shares = parseFloat(String(row['No. of shares'] || 0).replace(',', '.'));

    return {
      id: (row['ID'] || row['id'] || Date.now().toString() + Math.random().toString().slice(2, 8)),
      name: row['Name'] || row['name'] || 'Ativo Desconhecido',
      ticker: row['Ticker'] || row['ticker'] || '',
      isin: row['ISIN'] || row['isin'] || '',
      type: action,
      date: dateStr,
      pricePerShare: price,
      investedValue: Math.abs(total),
      shares: shares,
      notes: row['Notes'] || ''
    };
  });
};

export const exportInvestmentsToExcel = (investments: Investment[]) => {
  const ws = XLSX.utils.json_to_sheet(investments);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Investimentos");
  XLSX.writeFile(wb, "investimentos_fingestor.xlsx");
};
