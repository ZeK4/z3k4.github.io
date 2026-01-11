
import { Transaction, Investment, InvestmentAction } from '../types';
import * as XLSX from 'xlsx';

// Cabeçalhos para Exportação (PascalCase conforme pedido)
const TRANSACTION_EXPORT_HEADERS = ['Id', 'Date', 'Description', 'Amount', 'Type', 'Category'];
const INVESTMENT_EXPORT_HEADERS = ['Id', 'Name', 'Ticker', 'Isin', 'Type', 'Date', 'PricePerShare', 'InvestedValue', 'Shares', 'Notes'];

// Palavras-chave internas para validação (mantidas em lowercase para lógica de comparação)
const INV_KEYWORDS = ['ticker', 'isin', 'shares', 'price / share', 'no. of shares', 'action'];

// Funções auxiliares de mapeamento para exportação
const mapTransactionForExport = (t: Transaction) => ({
  Id: t.id,
  Date: t.date,
  Description: t.description,
  Amount: t.amount,
  Type: t.type,
  Category: t.category
});

const mapInvestmentForExport = (i: Investment) => ({
  Id: i.id,
  Name: i.name,
  Ticker: i.ticker || '',
  Isin: i.isin || '',
  Type: i.type,
  Date: i.date,
  PricePerShare: i.pricePerShare,
  InvestedValue: i.investedValue,
  Shares: i.shares,
  Notes: i.notes || ''
});

// --- TRANSAÇÕES ---

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
  const dataToExport = transactions.map(mapTransactionForExport);
  const ws = dataToExport.length > 0 
    ? XLSX.utils.json_to_sheet(dataToExport, { header: TRANSACTION_EXPORT_HEADERS })
    : XLSX.utils.aoa_to_sheet([TRANSACTION_EXPORT_HEADERS]);

  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "extrato_fingestor.csv";
  link.click();
};

export const exportTransactionsToExcel = (transactions: Transaction[]) => {
  const dataToExport = transactions.map(mapTransactionForExport);
  const ws = dataToExport.length > 0 
    ? XLSX.utils.json_to_sheet(dataToExport, { header: TRANSACTION_EXPORT_HEADERS })
    : XLSX.utils.aoa_to_sheet([TRANSACTION_EXPORT_HEADERS]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Extrato");
  XLSX.writeFile(wb, "extrato_fingestor.xlsx");
};

export const parseFile = async (file: File): Promise<Transaction[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];
  
  if (jsonData.length > 0) {
    const headers = Object.keys(jsonData[0]).map(h => h.toLowerCase());
    const isInvestment = headers.some(h => INV_KEYWORDS.includes(h));
    
    if (isInvestment) {
      throw new Error("errorInvestmentFileInDash");
    }
  }

  return jsonData.map(row => ({
    id: String(row['id'] || row['Id'] || Date.now().toString() + Math.random().toString().slice(2, 8)),
    date: row['date'] || row['Date'] || row['Data do movimento'] || new Date().toISOString().split('T')[0],
    description: row['description'] || row['Description'] || row['Descrição'] || 'Sem descrição',
    amount: Math.abs(parseFloat(String(row['amount'] || row['Amount'] || row['Debito'] || row['Credito'] || 0).replace(',', '.'))),
    type: (row['type'] || row['Type'] || (row['Credito'] ? 'income' : 'expense')) as any,
    category: row['category'] || row['Category'] || row['Categoria'] || 'Outros'
  }));
};

// --- INVESTIMENTOS ---

export const parseInvestmentsFile = async (file: File): Promise<Investment[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];

  if (jsonData.length === 0) throw new Error("Ficheiro vazio.");

  const headers = Object.keys(jsonData[0]).map(h => h.toLowerCase());
  const hasInvHeaders = headers.some(h => INV_KEYWORDS.includes(h));
  const hasTransHeaders = headers.includes('categoria') || headers.includes('descrição') || headers.includes('category') || headers.includes('description');

  if (!hasInvHeaders && hasTransHeaders) {
    throw new Error("errorTransactionFileInInv");
  }

  return jsonData.map(row => {
    const action = (row['type'] || row['Type'] || row['Action'] || row['action'] || 'Market buy') as InvestmentAction;
    
    let dateStr = row['date'] || row['Date'] || row['Time'] || row['time'] || new Date().toISOString();
    if (typeof dateStr === 'number') {
      const d = new Date((dateStr - 25569) * 86400 * 1000);
      dateStr = d.toISOString().split('T')[0];
    } else {
      dateStr = String(dateStr).split(' ')[0];
    }

    const price = parseFloat(String(row['pricePerShare'] || row['PricePerShare'] || row['Price / share'] || row['price'] || 0).replace(',', '.'));
    const total = parseFloat(String(row['investedValue'] || row['InvestedValue'] || row['Total'] || row['total'] || 0).replace(',', '.'));
    const sharesCount = parseFloat(String(row['shares'] || row['Shares'] || row['No. of shares'] || 0).replace(',', '.'));

    return {
      id: String(row['id'] || row['Id'] || row['ID'] || Date.now().toString() + Math.random().toString().slice(2, 8)),
      name: row['name'] || row['Name'] || 'Ativo Desconhecido',
      ticker: String(row['ticker'] || row['Ticker'] || ''),
      isin: String(row['isin'] || row['ISIN'] || row['Isin'] || ''),
      type: action,
      date: dateStr,
      pricePerShare: price,
      investedValue: Math.abs(total),
      shares: sharesCount,
      notes: row['notes'] || row['Notes'] || ''
    };
  });
};

export const exportInvestmentsToExcel = (investments: Investment[]) => {
  const dataToExport = investments.map(mapInvestmentForExport);
  const ws = dataToExport.length > 0 
    ? XLSX.utils.json_to_sheet(dataToExport, { header: INVESTMENT_EXPORT_HEADERS })
    : XLSX.utils.aoa_to_sheet([INVESTMENT_EXPORT_HEADERS]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Investimentos");
  XLSX.writeFile(wb, "investimentos_fingestor.xlsx");
};
