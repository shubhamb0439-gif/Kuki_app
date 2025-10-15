import { LanguageCode, getTranslation } from './translations';
import { getCurrencySymbol } from './currencyHelper';

export interface WageData {
  monthly_wage: number;
  currency: string;
  payment_date?: string;
  updated_at: string;
}

export interface LoanData {
  amount: number;
  remaining_amount: number;
  currency: string;
  created_at: string;
  foreclosure_date?: string;
  deduction_amount?: number;
}

export interface BonusData {
  amount: number;
  currency: string;
  comment?: string;
  created_at: string;
}

export interface StatementData {
  wages: WageData[];
  loans: LoanData[];
  advances: BonusData[];
}

export const generatePDFContent = (
  data: StatementData,
  language: LanguageCode = 'en'
): string => {
  const t = (key: string) => getTranslation(key, language);

  let content = `${t('statement.title').toUpperCase()}\n\n`;
  let hasData = false;

  if (data.wages.length > 0) {
    hasData = true;
    content += `${t('employees.wages').toUpperCase()}:\n\n`;

    data.wages.forEach((wage: any, index: number) => {
      const currency = wage.currency || 'USD';
      const symbol = getCurrencySymbol(currency);

      if (wage.is_contract_payment) {
        // Contract payment
        content += `Contract Payment ${index > 0 ? index : ''}:\n`;
        content += `  Amount: ${symbol}${wage.monthly_wage}\n`;
        content += `  Payment Date: ${new Date(wage.payment_date).toLocaleDateString()}\n`;
        content += `\n`;
      } else {
        // Regular wage
        content += `Monthly Wage:\n`;
        content += `  ${t('wages.daily')}: ${symbol}${wage.monthly_wage}\n`;
        content += `  ${t('profile.currency')}: ${currency}\n`;
        content += `  ${t('common.view')} ${t('statement.date')}: ${new Date(wage.updated_at).toLocaleDateString()}\n`;

        if (wage.payment_date) {
          content += `  ${t('wages.paymentDate')}: ${new Date(wage.payment_date).toLocaleDateString()}\n`;
        } else {
          content += `  ${t('wages.paymentDate')}: ${t('common.loading')}\n`;
        }
        content += `\n`;
      }
    });
  } else {
    content += `${t('employees.wages').toUpperCase()}:\n`;
    content += `${t('search.noResults')}\n\n`;
  }

  if (data.loans.length > 0) {
    hasData = true;
    content += `${t('employees.loans').toUpperCase()}:\n`;

    data.loans.forEach((loan, index) => {
      const symbol = getCurrencySymbol(loan.currency || 'USD');
      content += `\n${t('employees.loans')} ${index + 1}:\n`;
      content += `  ${t('loans.amount')}: ${symbol}${loan.amount}\n`;
      content += `  ${t('loans.remaining')}: ${symbol}${loan.remaining_amount}\n`;
      content += `  ${t('statement.date')}: ${new Date(loan.created_at).toLocaleDateString()}\n`;

      if (loan.foreclosure_date) {
        content += `  ${t('loans.foreclose')} ${t('statement.date')}: ${new Date(loan.foreclosure_date).toLocaleDateString()}\n`;
      }

      if (loan.deduction_amount) {
        content += `  ${t('loans.deduct')} ${t('loans.amount')}: ${symbol}${loan.deduction_amount}\n`;
      }
    });
    content += '\n';
  }

  if (data.advances.length > 0) {
    hasData = true;
    content += `${t('employees.bonuses').toUpperCase()}:\n`;

    data.advances.forEach((bonus, index) => {
      const symbol = getCurrencySymbol(bonus.currency || 'USD');
      content += `\n${t('employees.bonuses')} ${index + 1}:\n`;
      content += `  ${t('bonuses.amount')}: ${symbol}${bonus.amount}\n`;
      content += `  ${t('statement.date')}: ${new Date(bonus.created_at).toLocaleDateString()}\n`;

      if (bonus.comment) {
        content += `  ${t('bonuses.comment')}: ${bonus.comment}\n`;
      }
    });
    content += '\n';
  }

  if (!hasData) {
    content += `\n${t('search.noResults')}\n`;
  }

  return content;
};

export const generateStatementSummary = (
  startMonth: string,
  startYear: string,
  endMonth: string,
  endYear: string,
  language: LanguageCode = 'en'
): string => {
  const months = [
    { value: '1', label: getTranslation('calendar.today', language) },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const t = (key: string) => getTranslation(key, language);
  const startMonthLabel = months[parseInt(startMonth) - 1]?.label || startMonth;
  const endMonthLabel = months[parseInt(endMonth) - 1]?.label || endMonth;

  return `${t('statement.title')}\n\n${t('statement.period')}: ${startMonthLabel} ${startYear} - ${endMonthLabel} ${endYear}`;
};

export const translateMonths = (language: LanguageCode = 'en'): Array<{ value: string; label: string }> => {
  const monthKeys = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return monthKeys.map((month, index) => ({
    value: (index + 1).toString(),
    label: month
  }));
};
