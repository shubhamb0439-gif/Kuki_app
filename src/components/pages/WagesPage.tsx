import React, { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { Header } from '../common/Header';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { generatePDFContent, generateStatementSummary } from '../../lib/statementHelper';
import { getCurrencySymbol } from '../../lib/currencyHelper';

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface StatementData {
  wages: any[];
  loans: any[];
  advances: any[];
}

interface WagesPageProps {
  onReferFriend: () => void;
  onMessages: () => void;
}

export function WagesPage({ onReferFriend, onMessages }: WagesPageProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');
  const [filterAll, setFilterAll] = useState(true);
  const [filterWages, setFilterWages] = useState(false);
  const [filterLoans, setFilterLoans] = useState(false);
  const [filterAdvances, setFilterAdvances] = useState(false);
  const [filterMeritsDemerits, setFilterMeritsDemerits] = useState(false);
  const [loading, setLoading] = useState(false);

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (user?.role === 'employer') {
      fetchEmployees();
    }
    setDefaultDates();
  }, [user]);

  const setDefaultDates = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    setStartMonth(month);
    setStartYear(year);
    setEndMonth(month);
    setEndYear(year);
  };

  const fetchEmployees = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('employees')
      .select(`
        id,
        email,
        phone,
        profiles!employees_user_id_fkey(name)
      `)
      .eq('employer_id', user.id)
      .eq('status', 'active');

    if (!error && data) {
      const formatted = data.map(emp => ({
        id: emp.id,
        name: emp.profiles?.name || emp.email || emp.phone,
        email: emp.email || emp.phone
      }));
      setEmployees(formatted);
      if (formatted.length > 0) {
        setSelectedEmployeeId(formatted[0].id);
      }
    }
  };

  const handleFilterChange = (filter: string) => {
    if (filter === 'all') {
      setFilterAll(!filterAll);
      if (!filterAll) {
        setFilterWages(false);
        setFilterLoans(false);
        setFilterAdvances(false);
        setFilterMeritsDemerits(false);
      }
    } else {
      setFilterAll(false);
      if (filter === 'wages') setFilterWages(!filterWages);
      if (filter === 'loans') setFilterLoans(!filterLoans);
      if (filter === 'advances') setFilterAdvances(!filterAdvances);
      if (filter === 'merits_demerits') setFilterMeritsDemerits(!filterMeritsDemerits);
    }
  };

  const generateStatement = async () => {
    if (user?.role === 'employer' && !selectedEmployeeId) {
      alert(t('common.error'));
      return;
    }

    if (!startMonth || !startYear || !endMonth || !endYear) {
      alert(t('common.error'));
      return;
    }

    if (!filterAll && !filterWages && !filterLoans && !filterAdvances && !filterMeritsDemerits) {
      alert(t('common.error'));
      return;
    }

    setLoading(true);
    try {
      const startDate = `${startYear}-${startMonth}-01`;
      const endDate = `${endYear}-${endMonth}-31`;

      // Handle "All Employees" option
      if (selectedEmployeeId === 'all_employees' && user?.role === 'employer') {
        await generateAllEmployeesStatement(startDate, endDate);
        return;
      }

      let employeeId = selectedEmployeeId;

      if (user?.role === 'employee') {
        const { data: empData } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!empData) {
          alert(t('common.error'));
          setLoading(false);
          return;
        }
        employeeId = empData.id;
      }

      const recipientEmail = user?.email || '';

      const statementData: StatementData = {
        wages: [],
        loans: [],
        advances: []
      };

      if (filterAll || filterWages) {
        const { data: wages, error: wagesError } = await supabase
          .from('employee_wages')
          .select('*')
          .eq('employee_id', employeeId)
          .order('payment_date', { ascending: false })
          .limit(1);

        if (wagesError) console.error('Wages error:', wagesError);
        if (wages) statementData.wages = wages;

        // Also fetch contract payments for the period
        const { data: contractPayments, error: contractError } = await supabase
          .from('contract_payments')
          .select('*')
          .eq('employee_id', employeeId)
          .gte('payment_date', startDate)
          .lte('payment_date', endDate)
          .order('payment_date', { ascending: true });

        if (contractError) console.error('Contract payments error:', contractError);
        if (contractPayments && contractPayments.length > 0) {
          // Add contract payments to wages array with a marker
          statementData.wages = [...(statementData.wages || []), ...contractPayments.map(cp => ({
            ...cp,
            is_contract_payment: true,
            monthly_wage: cp.amount
          }))];
        }
      }

      if (filterAll || filterLoans) {
        // Fetch loans that were either created or foreclosed during the selected period
        const { data: loans, error: loansError } = await supabase
          .from('employee_loans')
          .select('*')
          .eq('employee_id', employeeId)
          .or(`and(created_at.gte.${startDate},created_at.lte.${endDate}),and(foreclosure_date.gte.${startDate},foreclosure_date.lte.${endDate})`)
          .order('created_at', { ascending: true });

        if (loansError) console.error('Loans error:', loansError);
        if (loans) statementData.loans = loans;
      }

      if (filterAll || filterAdvances) {
        const { data: bonuses, error: bonusesError } = await supabase
          .from('employee_bonuses')
          .select('*')
          .eq('employee_id', employeeId)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        if (bonusesError) console.error('Bonuses error:', bonusesError);
        if (bonuses) statementData.advances = bonuses;
      }

      const pdfContent = generatePDFContent(statementData, language);
      const summary = generateStatementSummary(startMonth, startYear, endMonth, endYear, language);
      const statementMessage = `${summary}\n\n${pdfContent}`;

      console.log('Statement Data:', statementData);
      console.log('Generated Content:', pdfContent);

      const { error: insertError } = await supabase
        .from('statements')
        .insert({
          user_id: user?.id,
          generated_by: user?.id,
          statement_type: 'employee',
          period_start: startDate,
          period_end: endDate,
          content: statementMessage
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        alert(t('common.error') + ': ' + insertError.message);
      } else {
        alert(t('common.success'));
      }
    } catch (error: any) {
      console.error('Statement generation error:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAllEmployeesStatement = async (startDate: string, endDate: string) => {
    try {
      if (!user) return;

      const { data: employerProfile } = await supabase
        .from('profiles')
        .select('currency')
        .eq('id', user.id)
        .maybeSingle();

      let currency = employerProfile?.currency || 'USD';
      const symbol = getCurrencySymbol(currency);

      const { data: allEmployees, error: empError } = await supabase
        .from('employees')
        .select(`
          id,
          user_id,
          profiles!employees_user_id_fkey(name)
        `)
        .eq('employer_id', user.id)
        .eq('status', 'active');

      if (empError) throw empError;
      if (!allEmployees || allEmployees.length === 0) {
        alert('No active employees found');
        setLoading(false);
        return;
      }

      interface EmployeeFinancialData {
        name: string;
        wages: number;
        totalLoanAmount: number;
        outstandingLoan: number;
        monthlyDeduction: number;
        merits: number;
        demerits: number;
        netPay: number;
      }

      const employeeDataList: EmployeeFinancialData[] = [];
      let grandTotalWages = 0;
      let grandTotalLoans = 0;
      let grandTotalMerits = 0;
      let grandTotalDemerits = 0;
      let grandTotalNetPay = 0;

      for (const employee of allEmployees) {
        const employeeName = employee.profiles?.name || 'Unknown';
        let empWages = 0;
        let empTotalLoan = 0;
        let empOutstandingLoan = 0;
        let empMonthlyDeduction = 0;
        let empMerits = 0;
        let empDemerits = 0;

        if (filterAll || filterWages) {
          const { data: wages } = await supabase
            .from('employee_wages')
            .select('monthly_wage')
            .eq('employee_id', employee.id)
            .order('payment_date', { ascending: false })
            .limit(1);

          if (wages && wages.length > 0) {
            empWages = parseFloat(wages[0].monthly_wage) || 0;
          }

          const { data: contractPayments } = await supabase
            .from('contract_payments')
            .select('amount')
            .eq('employee_id', employee.id)
            .gte('payment_date', startDate)
            .lte('payment_date', endDate);

          if (contractPayments && contractPayments.length > 0) {
            empWages += contractPayments.reduce((sum, cp) => sum + (cp.amount || 0), 0);
          }
        }

        if (filterAll || filterLoans) {
          const { data: loans } = await supabase
            .from('employee_loans')
            .select('amount, remaining_amount, monthly_deduction')
            .eq('employee_id', employee.id)
            .eq('status', 'active');

          if (loans && loans.length > 0) {
            empTotalLoan = loans.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
            empOutstandingLoan = loans.reduce((sum, l) => sum + (parseFloat(l.remaining_amount) || 0), 0);
            empMonthlyDeduction = loans.reduce((sum, l) => sum + (parseFloat(l.monthly_deduction) || 0), 0);
          }
        }

        if (filterAll || filterAdvances || filterMeritsDemerits) {
          const { data: bonuses } = await supabase
            .from('employee_bonuses')
            .select('amount, category')
            .eq('employee_id', employee.id)
            .gte('created_at', startDate)
            .lte('created_at', endDate);

          if (bonuses && bonuses.length > 0) {
            const merits = bonuses.filter(b => b.category === 'merit').reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
            const advances = bonuses.filter(b => b.category === 'advance').reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
            const demerits = bonuses.filter(b => b.category === 'demerit').reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
            empMerits = merits + advances;
            empDemerits = demerits;
          }

          const { data: adjustments } = await supabase
            .from('salary_adjustments')
            .select('adjustment_amount, adjustment_type')
            .eq('employee_id', employee.id)
            .gte('created_at', startDate)
            .lte('created_at', endDate);

          if (adjustments && adjustments.length > 0) {
            const meritsFromAdj = adjustments.filter(a => a.adjustment_type === 'merit').reduce((sum, a) => sum + (parseFloat(a.adjustment_amount) || 0), 0);
            const demeritsFromAdj = adjustments.filter(a => a.adjustment_type === 'demerit').reduce((sum, a) => sum + Math.abs(parseFloat(a.adjustment_amount) || 0), 0);
            empMerits += meritsFromAdj;
            empDemerits += demeritsFromAdj;
          }
        }

        const netPay = empWages + empMerits - empMonthlyDeduction - empDemerits;

        employeeDataList.push({
          name: employeeName,
          wages: empWages,
          totalLoanAmount: empTotalLoan,
          outstandingLoan: empOutstandingLoan,
          monthlyDeduction: empMonthlyDeduction,
          merits: empMerits,
          demerits: empDemerits,
          netPay: netPay
        });

        grandTotalWages += empWages;
        grandTotalLoans += empMonthlyDeduction;
        grandTotalMerits += empMerits;
        grandTotalDemerits += empDemerits;
        grandTotalNetPay += netPay;
      }

      const summary = generateStatementSummary(startMonth, startYear, endMonth, endYear, language);

      let statementContent = `${summary}\n\n`;
      statementContent += `EMPLOYEE-WISE DETAILED STATEMENT\n`;
      statementContent += `=================================\n\n`;
      statementContent += `Total Active Employees: ${allEmployees.length}\n\n`;
      statementContent += '='.repeat(60) + '\n\n';

      employeeDataList.forEach((empData, index) => {
        statementContent += `Employee Name: ${empData.name}\n\n`;
        statementContent += `  Wages: ${symbol}${empData.wages.toFixed(2)}\n\n`;

        if (empData.totalLoanAmount > 0 || empData.outstandingLoan > 0 || empData.monthlyDeduction > 0) {
          statementContent += `  Loan:\n`;
          statementContent += `    Total Loan: ${symbol}${empData.totalLoanAmount.toFixed(2)}\n`;
          statementContent += `    Outstanding Amount: ${symbol}${empData.outstandingLoan.toFixed(2)}\n`;
          statementContent += `    Monthly Deduction: ${symbol}${empData.monthlyDeduction.toFixed(2)}\n\n`;
        } else {
          statementContent += `  Loan: ${symbol}0.00\n\n`;
        }

        statementContent += `  Merits: ${symbol}${empData.merits.toFixed(2)}\n\n`;
        statementContent += `  Demerits: ${symbol}${empData.demerits.toFixed(2)}\n\n`;
        statementContent += `  Net Pay (Wages + Merits - Loan Deduction - Demerits): ${symbol}${empData.netPay.toFixed(2)}\n`;

        if (index < employeeDataList.length - 1) {
          statementContent += '\n' + '-'.repeat(60) + '\n\n';
        }
      });

      statementContent += '\n' + '='.repeat(60) + '\n\n';
      statementContent += `FINAL SUMMARY\n`;
      statementContent += `=============\n\n`;
      statementContent += `Total Wages (All Employees): ${symbol}${grandTotalWages.toFixed(2)}\n\n`;
      statementContent += `Total Monthly Loan Deductions (All Employees): ${symbol}${grandTotalLoans.toFixed(2)}\n\n`;
      statementContent += `Total Merits (All Employees): ${symbol}${grandTotalMerits.toFixed(2)}\n\n`;
      statementContent += `Total Demerits (All Employees): ${symbol}${grandTotalDemerits.toFixed(2)}\n\n`;
      statementContent += `Grand Total Payable This Month: ${symbol}${grandTotalNetPay.toFixed(2)}\n`;
      statementContent += '\n' + '='.repeat(60) + '\n';

      const { error: insertError } = await supabase
        .from('statements')
        .insert({
          user_id: user.id,
          generated_by: user.id,
          statement_type: 'all_employees',
          period_start: startDate,
          period_end: endDate,
          content: statementContent
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        alert(t('common.error') + ': ' + insertError.message);
      } else {
        alert(t('common.success'));
      }
    } catch (error: any) {
      console.error('All employees statement error:', error);
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleMessages = () => {
    window.location.hash = '#/messages';
  };

  useSwipeGesture({
    onSwipeLeft: () => {
      window.location.hash = '#/messages';
    }
  });

  const handleReferFriend = () => {
    alert('Refer a friend feature coming soon!');
  };

  return (
    <div className="flex-1 bg-gray-50 pb-20">
      <Header
        onReferFriend={onReferFriend}
        onMessages={onMessages}
        unreadCount={0}
      />
      <div className="max-w-md mx-auto bg-white min-h-screen pt-[75px]">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Generate Statement</h1>
          </div>

          <div className="space-y-6">
            {user?.role === 'employer' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Employee
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Choose an employee</option>
                  <option value="all_employees">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {user?.role === 'employee' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900">Your Personal Statement</p>
                <p className="text-xs text-blue-700 mt-1">Generating statement for your account</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Month
                </label>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Year
                </label>
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Month
                </label>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Year
                </label>
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Filter Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={filterAll}
                    onChange={() => handleFilterChange('all')}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">All</span>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={filterWages}
                    onChange={() => handleFilterChange('wages')}
                    disabled={filterAll}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-900">Wages</span>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={filterLoans}
                    onChange={() => handleFilterChange('loans')}
                    disabled={filterAll}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-900">Loans</span>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={filterAdvances}
                    onChange={() => handleFilterChange('advances')}
                    disabled={filterAll}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-900">Advances</span>
                </label>

                {user?.role === 'employer' && (
                  <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={filterMeritsDemerits}
                      onChange={() => handleFilterChange('merits_demerits')}
                      disabled={filterAll}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <span className="text-sm font-medium text-gray-900">Merits and Demerits</span>
                  </label>
                )}
              </div>
            </div>

            <button
              onClick={generateStatement}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Generate Statement</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Statement will be sent to your email and appear in the Messages section from "Statement Personnel"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
