import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, QrCode, X, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Header } from '../common/Header';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import QRCode from 'react-qr-code';

interface AttendanceRecord {
  attendance_date: string;
  status: 'present' | 'absent' | 'leave' | 'sick_leave';
  scanned_at?: string;
  login_time?: string;
  logout_time?: string;
  total_hours?: number;
}

interface CalendarPageProps {
  onReferFriend: () => void;
  onMessages: () => void;
}

export function CalendarPage({ onReferFriend, onMessages }: CalendarPageProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState<'leave' | 'sick_leave'>('leave');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({});
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const currentTransactionIdRef = useRef<string | null>(null);
  const [selectedDateSummary, setSelectedDateSummary] = useState<AttendanceRecord | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [generatingStatement, setGeneratingStatement] = useState(false);

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

  useEffect(() => {
    if (user?.role === 'employer') {
      fetchEmployees();
    }
    fetchAttendance();
  }, [user, currentDate]);

  useEffect(() => {
    if (user?.role === 'employer' && selectedEmployeeId) {
      fetchAttendance();
    }
  }, [selectedEmployeeId]);

  useEffect(() => {
    if (user?.role === 'employer') {
      const subscription = subscribeToQRTransactions();
      return () => {
        if (subscription) subscription();
      };
    }
  }, [user]);

  const subscribeToQRTransactions = () => {
    if (!user) return;

    const subscription = supabase
      .channel(`qr_attendance_${user.id}`)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'qr_transactions',
          filter: `employer_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.status === 'completed' && payload.new.id === currentTransactionIdRef.current) {
            setShowQRModal(false);
            setQrCodeValue('');
            setCurrentTransactionId(null);
            currentTransactionIdRef.current = null;
            alert('Attendance marked successfully!');
            fetchAttendance();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const fetchEmployees = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('employees')
      .select(`
        user_id,
        profiles!employees_user_id_fkey(name)
      `)
      .eq('employer_id', user.id);

    if (data) {
      setEmployees(data.map(e => ({
        id: e.user_id,
        name: e.profiles?.name
      })));
    }
  };

  const fetchAttendance = async () => {
    if (!user) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startDateObj = new Date(year, month, 1);
    const endDateObj = new Date(year, month + 1, 0);
    const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
    const endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;

    let query = supabase
      .from('attendance_records')
      .select('*')
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate);

    if (user.role === 'employer') {
      query = query.eq('employer_id', user.id);
      if (selectedEmployeeId) {
        query = query.eq('employee_id', selectedEmployeeId);
      }
    } else {
      query = query.eq('employee_id', user.id);
    }

    const { data } = await query;

    if (data) {
      const attendanceMap: Record<string, AttendanceRecord> = {};
      data.forEach(record => {
        attendanceMap[record.attendance_date] = {
          attendance_date: record.attendance_date,
          status: record.status,
          scanned_at: record.scanned_at,
          login_time: record.login_time,
          logout_time: record.logout_time,
          total_hours: record.total_hours
        };
      });
      setAttendanceData(attendanceMap);
    }
  };

  const handleDateClick = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const record = attendanceData[dateStr];
    const status = getDateStatus(date);

    if (record) {
      setSelectedDateSummary(record);
    }

    if (user?.role === 'employee') {
      setSelectedDate(date);
      setShowLeaveModal(true);
    } else if (user?.role === 'employer' && status === 'absent') {
      if (!selectedEmployeeId) {
        alert('Please select an employee first to generate attendance QR for missed dates');
        return;
      }
      setSelectedDate(date);
      generateAttendanceQR(date);
    }
  };

  const generateAttendanceQR = async (date: Date) => {
    if (!user || !selectedEmployeeId) return;

    try {
      const { data: employeeRecord, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', selectedEmployeeId)
        .eq('employer_id', user.id)
        .maybeSingle();

      if (employeeError || !employeeRecord) {
        alert('Employee record not found');
        return;
      }

      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const qrCode = `qr:mark_attendance:${user.id}:${employeeRecord.id}:${dateStr}:${Date.now()}`;

      const { data, error } = await supabase
        .from('qr_transactions')
        .insert({
          employer_id: user.id,
          employee_id: employeeRecord.id,
          transaction_type: 'mark_attendance',
          qr_code: qrCode,
          status: 'pending',
          metadata: { attendance_date: dateStr }
        })
        .select()
        .single();

      if (!error && data) {
        setCurrentTransactionId(data.id);
        currentTransactionIdRef.current = data.id;
        setQrCodeValue(qrCode);
        setShowQRModal(true);
      } else {
        alert('Error generating QR code: ' + (error?.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleLeaveRequest = async () => {
    if (!selectedDate || !user) return;

    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      const { data: empData } = await supabase
        .from('employees')
        .select('employer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!empData) {
        alert('Employer not found');
        return;
      }

      const { error } = await supabase
        .from('attendance_records')
        .upsert({
          employer_id: empData.employer_id,
          employee_id: user.id,
          attendance_date: dateStr,
          status: leaveType,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'employer_id,employee_id,attendance_date'
        });

      if (error) throw error;

      alert(`${leaveType === 'leave' ? 'Leave' : 'Sick Leave'} request submitted successfully!`);
      setShowLeaveModal(false);
      setSelectedDate(null);
      fetchAttendance();
    } catch (error: any) {
      alert('Error submitting leave request: ' + error.message);
    }
  };

  const generateAttendanceStatement = async () => {
    if (!user || !selectedEmployeeId) {
      alert('Please select an employee first');
      return;
    }

    setGeneratingStatement(true);

    try {
      const startDateStr = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
      const endDate = new Date(endYear, endMonth, 0);
      const endDateStr = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const { data: attendanceRecords, error: fetchError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', selectedEmployeeId)
        .eq('employer_id', user.id)
        .gte('attendance_date', startDateStr)
        .lte('attendance_date', endDateStr)
        .order('attendance_date', { ascending: true });

      if (fetchError) throw fetchError;

      if (!attendanceRecords || attendanceRecords.length === 0) {
        alert('No attendance records found for the selected period');
        return;
      }

      const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

      let totalHours = 0;
      let presentDays = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let sickLeaveDays = 0;

      let statementContent = `ATTENDANCE STATEMENT\n`;
      statementContent += `Employee: ${selectedEmployee?.name || 'Unknown'}\n`;
      statementContent += `Period: ${getMonthName(startMonth)} ${startYear} - ${getMonthName(endMonth)} ${endYear}\n`;
      statementContent += `\n${'='.repeat(60)}\n\n`;

      attendanceRecords.forEach((record: any) => {
        const date = new Date(record.attendance_date);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

        statementContent += `Date: ${dateStr}\n`;
        statementContent += `Status: ${getStatusLabel(record.status)}\n`;

        if (record.status === 'present') {
          presentDays++;
          const loginTime = record.login_time ? formatTime(record.login_time) : 'Not recorded';
          const logoutTime = record.logout_time ? formatTime(record.logout_time) : 'Pending';
          const hours = record.total_hours || 0;

          statementContent += `Login: ${loginTime}\n`;
          statementContent += `Logout: ${logoutTime}\n`;
          statementContent += `Hours: ${hours.toFixed(2)} hrs\n`;

          if (record.total_hours) {
            totalHours += record.total_hours;
          }
        } else if (record.status === 'absent') {
          absentDays++;
        } else if (record.status === 'leave') {
          leaveDays++;
        } else if (record.status === 'sick_leave') {
          sickLeaveDays++;
        }

        statementContent += `${'-'.repeat(60)}\n`;
      });

      const totalHoursWhole = Math.floor(totalHours);
      const totalMinutes = Math.round((totalHours - totalHoursWhole) * 60);

      statementContent += `\nSUMMARY\n`;
      statementContent += `${'='.repeat(60)}\n`;
      statementContent += `Total Days Present: ${presentDays}\n`;
      statementContent += `Total Days Absent: ${absentDays}\n`;
      statementContent += `Total Days Leave: ${leaveDays}\n`;
      statementContent += `Total Days Sick Leave: ${sickLeaveDays}\n`;
      statementContent += `\n👉 Total Hours Worked This Month: ${totalHoursWhole} hrs ${totalMinutes} mins\n`;

      const startDateObj = new Date(startYear, startMonth - 1, 1);
      const endDateObj = new Date(endYear, endMonth, 0);

      const { error: statementError } = await supabase
        .from('statements')
        .insert({
          user_id: selectedEmployeeId,
          generated_by: user.id,
          statement_type: 'attendance',
          period_start: startDateObj.toISOString().split('T')[0],
          period_end: endDateObj.toISOString().split('T')[0],
          content: statementContent,
          read: false
        });

      if (statementError) throw statementError;

      alert('Attendance statement generated successfully!');
      setShowStatementModal(false);
    } catch (error) {
      console.error('Error generating attendance statement:', error);
      alert('Failed to generate attendance statement');
    } finally {
      setGeneratingStatement(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'leave': return 'Leave';
      case 'sick_leave': return 'Sick Leave';
      default: return status;
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDateStatus = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const record = attendanceData[dateStr];

    if (!record) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      if (checkDate < today) {
        return 'absent';
      }
      return null;
    }

    if (record.status === 'present' && record.login_time && !record.logout_time) {
      return 'pending_logout';
    }

    return record.status;
  };

  const getDateColor = (status: string | null) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'pending_logout':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'leave':
        return 'bg-orange-100 text-orange-800';
      case 'sick_leave':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-white text-gray-900';
    }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance</h1>

          {user?.role === 'employer' && employees.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Employee
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-blue-600" />
              </button>
              <h2 className="text-lg font-semibold text-blue-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-blue-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-blue-600 py-2">
                  {day}
                </div>
              ))}
              {getDaysInMonth(currentDate).map((date, index) => {
                const status = date ? getDateStatus(date) : null;
                const colorClass = date ? getDateColor(status) : '';

                return (
                  <button
                    key={index}
                    onClick={() => date && handleDateClick(date)}
                    disabled={!date}
                    className={`aspect-square text-sm rounded-lg transition-colors ${
                      date
                        ? `${colorClass} font-medium ${
                            user?.role === 'employee'
                              ? 'cursor-pointer hover:opacity-80'
                              : (user?.role === 'employer' && status === 'absent' && selectedEmployeeId)
                                ? 'cursor-pointer hover:opacity-80 ring-2 ring-blue-400'
                                : 'cursor-default'
                          }`
                        : 'text-transparent cursor-default'
                    }`}
                  >
                    {date?.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDateSummary ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">Daily Summary</h3>
                <button
                  onClick={() => setSelectedDateSummary(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(selectedDateSummary.attendance_date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                {selectedDateSummary.login_time && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Login Time:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedDateSummary.login_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                )}
                {selectedDateSummary.logout_time ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Logout Time:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedDateSummary.logout_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-700">Total Hours:</span>
                      <span className="text-base font-bold text-green-600">
                        {selectedDateSummary.total_hours ? `${Math.floor(selectedDateSummary.total_hours)}h ${Math.round((selectedDateSummary.total_hours % 1) * 60)}m` : '0h 0m'}
                      </span>
                    </div>
                  </>
                ) : selectedDateSummary.login_time ? (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-yellow-700">Status:</span>
                    <span className="text-sm font-medium text-yellow-600">Pending Logout</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-100 rounded mr-3"></div>
                  <span className="text-sm text-gray-700">Present (Completed)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-100 rounded mr-3"></div>
                  <span className="text-sm text-gray-700">Pending Logout</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-red-100 rounded mr-3"></div>
                  <span className="text-sm text-gray-700">Absent</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-orange-100 rounded mr-3"></div>
                  <span className="text-sm text-gray-700">Leave</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-100 rounded mr-3"></div>
                  <span className="text-sm text-gray-700">Sick Leave</span>
                </div>
              </div>
            </div>
          )}

          {user?.role === 'employee' && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Click on any date to apply for leave or sick leave
              </p>
            </div>
          )}

          {user?.role === 'employer' && (
            <>
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm text-emerald-900">
                  <QrCode className="w-4 h-4 inline mr-2" />
                  {selectedEmployeeId
                    ? 'Click on absent (red) dates to generate QR code for missed attendance'
                    : 'Select an employee to generate QR codes for missed attendance dates'}
                </p>
              </div>

              <button
                onClick={() => setShowStatementModal(true)}
                disabled={!selectedEmployeeId}
                className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-5 h-5" />
                Generate Attendance Statement
              </button>
            </>
          )}

          {showLeaveModal && selectedDate && user?.role === 'employee' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Request Leave
                </h3>

                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Leave Type
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="leaveType"
                        value="leave"
                        checked={leaveType === 'leave'}
                        onChange={(e) => setLeaveType(e.target.value as 'leave')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">Leave</span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="leaveType"
                        value="sick_leave"
                        checked={leaveType === 'sick_leave'}
                        onChange={(e) => setLeaveType(e.target.value as 'sick_leave')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">Sick Leave</span>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowLeaveModal(false);
                      setSelectedDate(null);
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLeaveRequest}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {showQRModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Attendance QR Code</h3>
                  <button
                    onClick={() => {
                      setShowQRModal(false);
                      setQrCodeValue('');
                      setCurrentTransactionId(null);
                      currentTransactionIdRef.current = null;
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4 text-center">
                  {selectedDate && `For ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
                </p>

                <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
                  <QRCode value={qrCodeValue} size={200} />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 text-center">
                    <QrCode className="w-4 h-4 inline mr-2" />
                    Employee should scan this QR code to mark attendance for this date
                  </p>
                </div>
              </div>
            </div>
          )}

          {showStatementModal && user?.role === 'employer' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Generate Attendance Statement</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Month and Year
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={startMonth}
                        onChange={(e) => setStartMonth(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {getMonthName(i + 1)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={startYear}
                        onChange={(e) => setStartYear(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {Array.from({ length: 11 }, (_, i) => {
                          const year = 2020 + i;
                          return <option key={year} value={year}>{year}</option>;
                        })}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Month and Year
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={endMonth}
                        onChange={(e) => setEndMonth(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {getMonthName(i + 1)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={endYear}
                        onChange={(e) => setEndYear(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {Array.from({ length: 11 }, (_, i) => {
                          const year = 2020 + i;
                          return <option key={year} value={year}>{year}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowStatementModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={generatingStatement}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateAttendanceStatement}
                    disabled={generatingStatement}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
                  >
                    {generatingStatement ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
