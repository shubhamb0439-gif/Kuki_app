import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Gift, Trash2, XCircle, Star } from 'lucide-react';
import QRCode from 'react-qr-code';
import { supabase } from '../../lib/supabase';
import { Employee } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';

interface EmployeeProfileModalProps {
  employee: Employee;
  onClose: () => void;
  onUpdate: () => void;
}

interface Loan {
  id: string;
  amount: number;
  interest_rate: number;
  total_amount: number;
  remaining_amount: number;
  status: string;
}

type ActionType = 'wages' | 'loan' | 'bonus' | 'advance' | 'foreclose';

export function EmployeeProfileModal({ employee, onClose, onUpdate }: EmployeeProfileModalProps) {
  const { user } = useAuth();
  const [actionType, setActionType] = useState<ActionType | null>(null);

  const [currentWage, setCurrentWage] = useState<number | null>(null);
  const [wageInfo, setWageInfo] = useState<{
    hourlyRate: number;
    actualHoursWorked: number;
    finalPayable: number;
  } | null>(null);
  const [employeeCurrency, setEmployeeCurrency] = useState<string>('USD');
  const [wageAmount, setWageAmount] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyDeduction, setMonthlyDeduction] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusType, setBonusType] = useState<'positive' | 'negative'>('positive');
  const [bonusComment, setBonusComment] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');

  const [employeeLoans, setEmployeeLoans] = useState<Loan[]>([]);
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const [totalLoanBalance, setTotalLoanBalance] = useState(0);
  const [monthlyLoanDeduction, setMonthlyLoanDeduction] = useState(0);
  const [totalBonuses, setTotalBonuses] = useState(0);
  const [totalAdvances, setTotalAdvances] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployeeData();
    fetchPerformanceRating();

    const qrChannel = supabase
      .channel('qr_transactions_changes')
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'qr_transactions',
          filter: `employee_id=eq.${employee.id}`
        },
        (payload) => {
          if (payload.new.status === 'completed') {
            fetchEmployeeData();
          }
        }
      )
      .subscribe();

    const loansChannel = supabase
      .channel('employee_loans_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_loans',
          filter: `employee_id=eq.${employee.id}`
        },
        () => {
          fetchEmployeeData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(qrChannel);
      supabase.removeChannel(loansChannel);
    };
  }, [employee.id]);

  const fetchPerformanceRating = async () => {
    if (!employee.user_id) return;

    const { data: ratings } = await supabase
      .from('performance_ratings')
      .select('rating')
      .eq('employee_id', employee.user_id);

    if (ratings && ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      setAverageRating(Math.round(avg * 10) / 10);
      setRatingCount(ratings.length);
    }
  };

  const fetchEmployeeData = async () => {
    // Fetch employee's currency from profile
    if (employee.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('currency')
        .eq('id', employee.user_id)
        .maybeSingle();

      if (profileData) {
        setEmployeeCurrency(profileData.currency || 'USD');
      }
    }

    const { data: wageData } = await supabase
      .from('employee_wages')
      .select('monthly_wage, hourly_rate, actual_hours_worked, final_payable')
      .eq('employee_id', employee.id)
      .eq('employer_id', employee.employer_id)
      .maybeSingle();

    if (wageData) {
      setCurrentWage(wageData.monthly_wage);
      setWageAmount(wageData.monthly_wage.toString());

      // Store wage calculation info
      setWageInfo({
        hourlyRate: wageData.hourly_rate || 0,
        actualHoursWorked: wageData.actual_hours_worked || 0,
        finalPayable: wageData.final_payable || 0
      });
    } else {
      setWageInfo(null);
    }

    const { data: loansData } = await supabase
      .from('employee_loans')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('status', 'active');

    if (loansData) {
      setEmployeeLoans(loansData);
      const total = loansData.reduce((sum, loan) => sum + (loan.remaining_amount || loan.total_amount), 0);
      setTotalLoanBalance(total);
      const monthlyDeduction = loansData.reduce((sum, loan) => sum + (loan.monthly_deduction || 0), 0);
      setMonthlyLoanDeduction(monthlyDeduction);
    } else {
      setEmployeeLoans([]);
      setTotalLoanBalance(0);
      setMonthlyLoanDeduction(0);
    }

    const { data: bonusData } = await supabase
      .from('employee_bonuses')
      .select('amount, category, type')
      .eq('employee_id', employee.id)
      .eq('employer_id', employee.employer_id);

    if (bonusData) {
      const bonusTotal = bonusData
        .filter(b => b.category === 'merit' || b.category === 'demerit' || b.category === 'bonus')
        .reduce((sum, bonus) => sum + bonus.amount, 0);
      setTotalBonuses(bonusTotal);

      const advanceTotal = bonusData
        .filter(b => b.category === 'advance')
        .reduce((sum, adv) => sum + adv.amount, 0);
      setTotalAdvances(advanceTotal);
    } else {
      setTotalBonuses(0);
      setTotalAdvances(0);
    }
  };

  const openActionModal = (action: ActionType) => {
    setActionType(action);
    setLoanAmount('');
    setInterestRate('');
    setBonusAmount('');
    setAdvanceAmount('');
  };

  const closeActionModal = () => {
    setActionType(null);
    setLoanAmount('');
    setInterestRate('');
    setMonthlyDeduction('');
    setBonusAmount('');
    setBonusComment('');
    setBonusType('positive');
    setAdvanceAmount('');
    setShowQRCode(false);
    setQrCodeValue('');
    setSelectedLoans([]);
  };

  const handleSetWages = async () => {
    if (!wageAmount) {
      alert('Please enter wage amount');
      return;
    }

    setLoading(true);
    try {
      const paymentAmount = parseFloat(wageAmount);

      // Contract employee - generate QR code for direct payment
      if (employee.employment_type === 'contract') {
        const timestamp = Date.now();
        const qrCode = `qr:pay_contract_wages:${user?.id}:${employee.id}:${timestamp}`;

        const { error: qrError } = await supabase
          .from('qr_transactions')
          .insert({
            qr_code: qrCode,
            transaction_type: 'pay_contract_wages',
            employee_id: employee.id,
            employer_id: user?.id,
            status: 'pending',
            metadata: {
              amount: paymentAmount,
              currency: employeeCurrency,
              employee_name: employee.name,
              employee_user_id: employee.user_id
            }
          });

        if (qrError) throw qrError;

        setQrCodeValue(qrCode);
        setShowQRCode(true);
        setLoading(false);
        return;
      }

      // Full-time and Part-time employees - set monthly wage
      const wageDate = new Date();
      const wageDateStr = wageDate.toISOString();
      const wageDateDisplay = wageDate.toLocaleDateString();
      const monthlyWage = paymentAmount;
      const workingHoursPerDay = employee.working_hours_per_day || 8;
      const workingDaysPerMonth = employee.working_days_per_month || 22;

      const hourlyRate = employee.employment_type === 'part_time'
        ? monthlyWage / (workingHoursPerDay * workingDaysPerMonth)
        : 0;

      console.log('Setting wage in EmployeeProfileModal:', {
        employmentType: employee.employment_type,
        monthlyWage,
        workingHoursPerDay,
        workingDaysPerMonth,
        calculatedHourlyRate: hourlyRate
      });

      await supabase
        .from('employee_wages')
        .upsert({
          employee_id: employee.id,
          employer_id: employee.employer_id,
          monthly_wage: monthlyWage,
          currency: employeeCurrency,
          hourly_rate: hourlyRate,
          working_hours_per_day: workingHoursPerDay,
          total_working_days: workingDaysPerMonth,
          updated_at: wageDateStr
        }, {
          onConflict: 'employee_id,employer_id'
        });

      if (employee.employment_type === 'part_time' && employee.working_hours_per_day && employee.working_days_per_month) {
        console.log('Calculating hourly rate:', {
          monthlyWage,
          workingHoursPerDay: employee.working_hours_per_day,
          workingDaysPerMonth: employee.working_days_per_month,
          hourlyRate
        });
        const { error: updateError } = await supabase
          .from('employees')
          .update({ hourly_rate: hourlyRate })
          .eq('id', employee.id);

        if (updateError) {
          console.error('Error updating employee hourly rate:', updateError);
        }
      } else {
        console.log('Skipping hourly rate calculation:', {
          employment_type: employee.employment_type,
          working_hours_per_day: employee.working_hours_per_day,
          working_days_per_month: employee.working_days_per_month
        });
      }

      await supabase
        .from('statements')
        .insert({
          user_id: employee.user_id,
          generated_by: user?.id,
          statement_type: 'wages',
          period_start: wageDateStr.split('T')[0],
          period_end: wageDateStr.split('T')[0],
          content: `WAGE ${currentWage !== null ? 'UPDATE' : 'SETUP'} CONFIRMATION\n\nDate: ${wageDateDisplay}\nEmployee: ${employee.name}\nMonthly Wage: ${employeeCurrency} ${monthlyWage.toFixed(2)}\nCurrency: ${employeeCurrency}\nStatus: ${currentWage !== null ? 'Updated' : 'Set'}\n\nYour monthly wage has been ${currentWage !== null ? 'updated' : 'set'} successfully.\nPayment will be processed separately.\n\n- Statement Personnel`
        });

      // Calculate monthly hours for current month if part-time
      if (employee.employment_type === 'part_time' && hourlyRate > 0) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const { error: calcError } = await supabase.rpc('calculate_and_update_monthly_hours', {
          p_employee_id: employee.id,
          p_employer_id: employee.employer_id,
          p_year: currentYear,
          p_month: currentMonth
        });

        if (calcError) {
          console.error('Error calculating monthly hours:', calcError);
        }
      }

      setCurrentWage(monthlyWage);
      setWageAmount(monthlyWage.toString());

      alert('Wages updated successfully!');
      closeActionModal();
      fetchEmployeeData();
      onUpdate();
    } catch (error: any) {
      alert('Error updating wages: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGiveLoan = async () => {
    if (!loanAmount || !interestRate || !monthlyDeduction) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(loanAmount);
      const rate = parseFloat(interestRate);
      const deduction = parseFloat(monthlyDeduction);
      const totalAmount = amount + (amount * rate / 100);

      // Generate QR code for employee to scan
      const qrCode = `qr:grant_loan:${user?.id}:${employee.id}:${Date.now()}`;

      const { error } = await supabase
        .from('qr_transactions')
        .insert({
          employer_id: user?.id,
          employee_id: employee.id,
          transaction_type: 'grant_loan',
          qr_code: qrCode,
          status: 'pending',
          metadata: {
            amount,
            interest_rate: rate,
            total_amount: totalAmount,
            monthly_deduction: deduction,
            currency: employeeCurrency,
            employee_user_id: employee.user_id,
            employee_name: employee.name
          }
        });

      if (!error) {
        setQrCodeValue(qrCode);
        setShowQRCode(true);
      } else {
        alert('Error generating QR code: ' + error.message);
      }
    } catch (error: any) {
      alert('Error preparing loan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGiveBonus = async () => {
    if (!bonusAmount || !bonusComment.trim()) {
      alert('Please enter amount and comment');
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(bonusAmount);
      const finalAmount = bonusType === 'negative' ? -Math.abs(amount) : Math.abs(amount);

      await supabase
        .from('employee_bonuses')
        .insert({
          employee_id: employee.id,
          employer_id: employee.employer_id,
          amount: finalAmount,
          currency: employeeCurrency,
          type: bonusType,
          category: bonusType === 'positive' ? 'merit' : 'demerit',
          comment: bonusComment
        });

      await supabase
        .from('statements')
        .insert({
          user_id: employee.user_id,
          generated_by: user?.id,
          statement_type: 'personal',
          period_start: new Date().toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          content: `${bonusType === 'positive' ? 'MERIT' : 'DEMERIT'} CONFIRMATION

Date: ${new Date().toLocaleDateString()}
Employee: ${employee.name}
Type: ${bonusType === 'positive' ? 'Positive (+)' : 'Negative (−)'}
Amount: ${employeeCurrency} ${Math.abs(finalAmount).toFixed(2)}
Comment: ${bonusComment}
Currency: ${employeeCurrency}

${bonusType === 'positive' ? 'Congratulations! This merit has been added to your account.' : 'This demerit has been deducted from your account.'}

- Statement Personnel`
        });

      alert(`${bonusType === 'positive' ? 'Merit' : 'Demerit'} recorded successfully!`);
      setBonusAmount('');
      setBonusComment('');
      setBonusType('positive');
      closeActionModal();
      onUpdate();
    } catch (error: any) {
      alert('Error granting bonus: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGiveAdvance = async () => {
    if (!advanceAmount) {
      alert('Please enter advance amount');
      return;
    }

    setLoading(true);
    try {
      await supabase
        .from('employee_bonuses')
        .insert({
          employee_id: employee.id,
          employer_id: employee.employer_id,
          amount: parseFloat(advanceAmount),
          currency: employeeCurrency,
          category: 'advance'
        });

      await supabase
        .from('statements')
        .insert({
          user_id: employee.user_id,
          generated_by: user?.id,
          statement_type: 'personal',
          period_start: new Date().toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          content: `SALARY ADVANCE CONFIRMATION

Date: ${new Date().toLocaleDateString()}
Employee: ${employee.name}
Advance Amount: ${employeeCurrency} ${parseFloat(advanceAmount).toFixed(2)}
Currency: ${employeeCurrency}

This advance will be deducted from your next salary payment.

- Statement Personnel`
        });

      alert('Advance granted successfully!');
      closeActionModal();
      onUpdate();
    } catch (error: any) {
      alert('Error granting advance: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForecloseLoan = async () => {
    if (selectedLoans.length === 0) {
      alert('Please select at least one loan to foreclose');
      return;
    }

    if (!confirm(`Are you sure you want to foreclose ${selectedLoans.length} loan(s)?`)) {
      return;
    }

    setLoading(true);
    try {
      const foreclosureDate = new Date().toISOString();
      const foreclosureDateDisplay = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      let totalAmount = 0;

      // Foreclose selected loans
      for (const loanId of selectedLoans) {
        const { data: loan } = await supabase
          .from('employee_loans')
          .select('*')
          .eq('id', loanId)
          .maybeSingle();

        if (loan) {
          totalAmount += loan.remaining_amount || loan.total_amount;

          await supabase
            .from('employee_loans')
            .update({
              status: 'paid',
              foreclosure_date: foreclosureDate,
              remaining_amount: 0
            })
            .eq('id', loanId);
        }
      }

      await supabase
        .from('statements')
        .insert({
          user_id: employee.user_id,
          generated_by: user?.id,
          statement_type: 'loan',
          period_start: foreclosureDate.split('T')[0],
          period_end: foreclosureDate.split('T')[0],
          content: `LOAN FORECLOSURE CONFIRMATION\n\nForeclosure Date: ${foreclosureDateDisplay}\nTotal Amount Settled: ${employeeCurrency} ${totalAmount.toFixed(2)}\nNumber of Loans Closed: ${selectedLoans.length}\nStatus: Paid in Full\n\nAll selected loans have been successfully foreclosed and paid.\n\nThank you for your prompt settlement!\n\n- Statement Personnel`
        });

      alert('Loan(s) foreclosed successfully!');
      closeActionModal();
      fetchEmployeeData();
      onUpdate();
    } catch (error: any) {
      alert('Error foreclosing loan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEmployee = async () => {
    if (!confirm(`Are you sure you want to remove ${employee.name}?`)) return;

    setLoading(true);
    try {
      await supabase
        .from('employees')
        .delete()
        .eq('id', employee.id);

      alert('Employee removed successfully!');
      onUpdate();
      onClose();
    } catch (error: any) {
      alert('Error removing employee: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalLoanPayable = () => {
    if (!loanAmount || !interestRate) return 0;
    const amount = parseFloat(loanAmount);
    const rate = parseFloat(interestRate);
    return amount + (amount * rate / 100);
  };

  const ProfilePhoto = ({ name, photo }: { name: string; photo?: string }) => {
    if (photo) {
      return (
        <img
          src={photo}
          alt={name}
          className="w-full h-full object-cover rounded-full"
        />
      );
    }

    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-emerald-400 rounded-full flex items-center justify-center">
        <span className="text-white font-semibold text-3xl">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
          <div className="flex-shrink-0 bg-white rounded-t-2xl border-b border-gray-200 p-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              {employee.employment_type === 'full_time' ? 'Manage Full-time Employee' :
               employee.employment_type === 'part_time' ? 'Manage Part-time Employee' :
               employee.employment_type === 'contract' ? 'Manage Contract Employee' :
               'Manage Employee'}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 mb-3">
                <ProfilePhoto name={employee.name} photo={employee.profile_photo} />
              </div>
              <h4 className="text-lg font-bold text-gray-900">{employee.name}</h4>
              <p className="text-xs text-gray-600">{employee.email || employee.phone}</p>
              {employee.profession && (
                <p className="text-xs text-gray-500">{employee.profession}</p>
              )}
              {employee.employment_type && (
                <span className={`mt-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                  employee.employment_type === 'full_time' ? 'bg-blue-100 text-blue-700' :
                  employee.employment_type === 'part_time' ? 'bg-green-100 text-green-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {employee.employment_type === 'full_time' ? 'Full-time' :
                   employee.employment_type === 'part_time' ? 'Part-time' :
                   'Contract'}
                </span>
              )}
              {ratingCount > 0 && (
                <div className="flex items-center mt-1.5 bg-yellow-50 px-2.5 py-0.5 rounded-full">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-current mr-1" />
                  <span className="text-xs font-semibold text-yellow-700">{averageRating.toFixed(1)}</span>
                  <span className="text-xs text-yellow-600 ml-0.5">({ratingCount} reviews)</span>
                </div>
              )}
              <div className="mt-2 flex flex-col items-center gap-1">
                {/* Only show "To Be Paid" for non-contract employees */}
                {employee.employment_type !== 'contract' && currentWage !== null && (
                  <p className="text-sm text-emerald-600 font-semibold">
                    To Be Paid: {employeeCurrency} {employee.employment_type === 'part_time' && wageInfo && wageInfo.hourlyRate > 0
                      ? wageInfo.finalPayable.toFixed(2)
                      : (currentWage - monthlyLoanDeduction - totalAdvances + totalBonuses).toFixed(2)}/month
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {/* Contract employees only show Pay Wage button */}
              {employee.employment_type === 'contract' ? (
                <>
                  <button
                    onClick={() => openActionModal('wages')}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 shadow-md"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Pay Wage</span>
                  </button>

                  <button
                    onClick={handleRemoveEmployee}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 border border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove Employee</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openActionModal('wages')}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>{currentWage !== null ? 'Update Wage' : 'Set Wages'}{currentWage !== null ? ` : ${employeeCurrency} ${currentWage.toFixed(2)}` : ''}</span>
                  </button>

                  <button
                    onClick={() => openActionModal('loan')}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Give Loan{totalLoanBalance > 0 ? ` : ${employeeCurrency} ${totalLoanBalance.toFixed(2)}` : ''}</span>
                  </button>

                  <button
                    onClick={() => openActionModal('bonus')}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Gift className="w-4 h-4" />
                    <span>Merits/Demerits{totalBonuses !== 0 ? ` : ${employeeCurrency} ${totalBonuses.toFixed(2)}` : ''}</span>
                  </button>

                  <button
                    onClick={() => openActionModal('advance')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Give Advance{totalAdvances !== 0 ? ` : ${employeeCurrency} ${totalAdvances.toFixed(2)}` : ''}</span>
                  </button>

                  {totalLoanBalance > 0 && (
                    <button
                      onClick={() => openActionModal('foreclose')}
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Foreclose Loan</span>
                    </button>
                  )}

                  <button
                    onClick={handleRemoveEmployee}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 border border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove Employee</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
            {actionType === 'wages' && (
              <>
                {employee.employment_type === 'contract' ? (
                  <>
                    {!showQRCode ? (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pay Contract Wage</h3>
                        <p className="text-sm text-gray-600 mb-4">for {employee.name}</p>

                        <div className="space-y-4 mb-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Payment Amount ({employeeCurrency})
                            </label>
                            <input
                              type="number"
                              value={wageAmount}
                              onChange={(e) => setWageAmount(e.target.value)}
                              placeholder="Enter payment amount"
                              step="0.01"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Payment QR Code</h3>
                        <p className="text-sm text-gray-600 mb-4">for {employee.name}</p>

                        <div className="text-center mb-4">
                          <p className="text-sm text-gray-600 mb-2">Payment Amount</p>
                          <p className="text-2xl font-bold text-emerald-600">{employeeCurrency} {parseFloat(wageAmount).toFixed(2)}</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                          <div className="bg-white p-4 flex items-center justify-center">
                            <QRCode value={qrCodeValue} size={200} />
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 text-center mb-6">
                          Ask {employee.name} to scan this QR code to complete the payment
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Monthly Wages</h3>
                    <p className="text-sm text-gray-600 mb-4">for {employee.name}</p>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency
                        </label>
                        <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                          {employeeCurrency}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Employee's preferred currency (set in profile)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monthly Wage
                        </label>
                        <input
                          type="number"
                          value={wageAmount}
                          onChange={(e) => setWageAmount(e.target.value)}
                          placeholder="Enter monthly wage"
                          step="0.01"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {actionType === 'loan' && !showQRCode && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Grant Loan</h3>
                <p className="text-sm text-gray-600 mb-4">to {employee.name}</p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {employeeCurrency}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Employee's preferred currency</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Amount
                    </label>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      placeholder="Enter loan amount"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="Enter interest rate"
                      step="0.1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Deduction
                    </label>
                    <input
                      type="number"
                      value={monthlyDeduction}
                      onChange={(e) => setMonthlyDeduction(e.target.value)}
                      placeholder="Enter monthly deduction"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  {loanAmount && interestRate && monthlyDeduction && (
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Total to repay: <span className="text-orange-600 font-bold">
                          {employeeCurrency} {calculateTotalLoanPayable().toFixed(2)}
                        </span>
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        Tenure: <span className="text-orange-600 font-bold">
                          {Math.ceil(calculateTotalLoanPayable() / parseFloat(monthlyDeduction))} months
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {actionType === 'loan' && showQRCode && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Grant QR Code</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Employee must scan this QR code to confirm receipt of loan
                </p>

                <div className="bg-white rounded-lg p-6 border-2 border-orange-200 mb-4">
                  <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeValue)}&size=200x200`}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-center text-gray-600 mt-4 break-all font-mono">
                    {qrCodeValue}
                  </p>
                </div>

                <p className="text-xs text-gray-500 text-center mb-6">
                  Once the employee scans this code, the loan will be granted and a statement will be generated
                </p>
              </>
            )}

            {actionType === 'bonus' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Merits and Demerits</h3>
                <p className="text-sm text-gray-600 mb-4">for {employee.name}</p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={bonusType}
                      onChange={(e) => setBonusType(e.target.value as 'positive' | 'negative')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="positive">Positive (+) - Reward</option>
                      <option value="negative">Negative (−) - Penalty</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {employeeCurrency}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Employee's preferred currency</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={bonusAmount}
                      onChange={(e) => setBonusAmount(e.target.value)}
                      placeholder="Enter amount"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason / Comment
                    </label>
                    <textarea
                      value={bonusComment}
                      onChange={(e) => setBonusComment(e.target.value)}
                      placeholder="Enter reason for merit or demerit"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                    />
                  </div>
                </div>
              </>
            )}

            {actionType === 'advance' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Give Advance</h3>
                <p className="text-sm text-gray-600 mb-4">to {employee.name}</p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {employeeCurrency}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Employee's preferred currency</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Advance Amount
                    </label>
                    <input
                      type="number"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      placeholder="Enter advance amount"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            {actionType === 'foreclose' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Foreclose Loan</h3>
                <p className="text-sm text-gray-600 mb-4">for {employee.name}</p>

                <div className="space-y-3 mb-6">
                  <p className="text-sm font-semibold text-gray-700">Select loans to foreclose:</p>
                  {employeeLoans.length > 0 ? (
                    employeeLoans.map((loan, index) => (
                      <div key={loan.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <input
                          type="checkbox"
                          id={`loan-${loan.id}`}
                          checked={selectedLoans.includes(loan.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLoans([...selectedLoans, loan.id]);
                            } else {
                              setSelectedLoans(selectedLoans.filter(id => id !== loan.id));
                            }
                          }}
                          className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor={`loan-${loan.id}`} className="flex-1 cursor-pointer">
                          <div className="text-sm font-medium text-gray-900">Loan {index + 1}</div>
                          <div className="text-xs text-gray-600">
                            Remaining: {employeeCurrency} {(loan.remaining_amount || loan.total_amount).toFixed(2)}
                          </div>
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No active loans</p>
                  )}
                </div>

                {selectedLoans.length > 0 && (
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 mb-6">
                    <p className="text-sm text-gray-700">Total Amount to Foreclose:</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {employeeCurrency} {employeeLoans
                        .filter(loan => selectedLoans.includes(loan.id))
                        .reduce((sum, loan) => sum + (loan.remaining_amount || loan.total_amount), 0)
                        .toFixed(2)}
                    </p>
                  </div>
                )}

                <p className="text-sm text-gray-600 mb-6">
                  Select loans and click "Foreclose" to immediately close the selected loans. The employee will receive a statement confirming the closure.
                </p>
              </>
            )}
            </div>

            <div className="flex-shrink-0 p-6 pt-0 border-t border-gray-100">
              {actionType === 'wages' && (
                <div className="flex space-x-3">
                  <button onClick={closeActionModal} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors">
                    {showQRCode ? 'Close' : 'Cancel'}
                  </button>
                  {!showQRCode && (
                    <button
                      onClick={handleSetWages}
                      disabled={loading || !wageAmount || parseFloat(wageAmount) <= 0}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? (employee.employment_type === 'contract' ? 'Generating...' : 'Saving...') : (employee.employment_type === 'contract' ? 'Generate QR' : 'Save')}
                    </button>
                  )}
                </div>
              )}
              {actionType === 'loan' && !showQRCode && (
                <div className="flex space-x-3">
                  <button onClick={closeActionModal} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors">Cancel</button>
                  <button onClick={handleGiveLoan} disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50">{loading ? 'Processing...' : 'Generate QR'}</button>
                </div>
              )}
              {actionType === 'loan' && showQRCode && (
                <div className="flex space-x-3">
                  <button onClick={closeActionModal} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors">Close</button>
                  <button onClick={() => navigator.share && navigator.share({ text: qrCodeValue })} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors">Share</button>
                </div>
              )}
              {actionType === 'bonus' && (
                <div className="flex space-x-3">
                  <button onClick={closeActionModal} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors">Cancel</button>
                  <button onClick={handleGiveBonus} disabled={loading} className={`flex-1 ${bonusType === 'positive' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50`}>{loading ? 'Processing...' : (bonusType === 'positive' ? 'Add Merit' : 'Add Demerit')}</button>
                </div>
              )}
              {actionType === 'advance' && (
                <div className="flex space-x-3">
                  <button onClick={closeActionModal} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors">Cancel</button>
                  <button onClick={handleGiveAdvance} disabled={loading} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50">{loading ? 'Processing...' : 'Give Advance'}</button>
                </div>
              )}
              {actionType === 'foreclose' && (
                <div className="flex space-x-3">
                  <button onClick={closeActionModal} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors">Cancel</button>
                  <button onClick={handleForecloseLoan} disabled={loading || selectedLoans.length === 0} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50">{loading ? 'Processing...' : 'Foreclose'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
