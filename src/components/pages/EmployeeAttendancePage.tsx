import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Header } from '../common/Header';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../lib/currencyHelper';

interface AttendanceRecord {
  attendance_date: string;
  status: 'present' | 'absent' | 'leave' | 'sick_leave';
  scanned_at?: string;
  login_time?: string;
  logout_time?: string;
  total_hours?: number;
}

interface EmployeeAttendancePageProps {
  onReferFriend: () => void;
  onMessages: () => void;
}

export function EmployeeAttendancePage({ onReferFriend, onMessages }: EmployeeAttendancePageProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord>>({});
  const [selectedDateSummary, setSelectedDateSummary] = useState<AttendanceRecord | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [generatingStatement, setGeneratingStatement] = useState(false);

  useSwipeGesture({
    onSwipeLeft: () => {
      window.location.hash = '#/messages';
    }
  });

  useEffect(() => {
    fetchAttendance();
  }, [user, currentDate]);

  const fetchAttendance = async () => {
    if (!user) return;

    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const { data: employeeRecord } = await supabase
      .from('employees')
      .select('employer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!employeeRecord) return;

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', user.id)
      .eq('employer_id', employeeRecord.employer_id)
      .gte('attendance_date', startDateStr)
      .lte('attendance_date', endDateStr);

    if (!error && data) {
      const attendanceMap: Record<string, AttendanceRecord> = {};
      data.forEach((record: any) => {
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'leave': return 'bg-blue-100 text-blue-800';
      case 'sick_leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + (direction === 'next' ? 1 : -1),
      1
    ));
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedDateSummary(attendanceData[dateStr] || null);
  };

  const generateAttendanceStatement = async () => {
    if (!user) return;

    setGeneratingStatement(true);

    try {
      const { data: employeeRecord } = await supabase
        .from('employees')
        .select('employer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!employeeRecord) {
        alert('Employer not found');
        return;
      }

      const startDateStr = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
      const endDate = new Date(endYear, endMonth, 0);
      const endDateStr = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const { data: attendanceRecords, error: fetchError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', user.id)
        .eq('employer_id', employeeRecord.employer_id)
        .gte('attendance_date', startDateStr)
        .lte('attendance_date', endDateStr)
        .order('attendance_date', { ascending: true });

      if (fetchError) throw fetchError;

      if (!attendanceRecords || attendanceRecords.length === 0) {
        alert('No attendance records found for the selected period');
        return;
      }

      let totalHours = 0;
      let presentDays = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let sickLeaveDays = 0;

      let statementContent = `ATTENDANCE STATEMENT\n`;
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
          user_id: user.id,
          generated_by: employeeRecord.employer_id,
          statement_type: 'attendance',
          period_start: startDateObj.toISOString().split('T')[0],
          period_end: endDateObj.toISOString().split('T')[0],
          content: statementContent,
          read: false
        });

      if (statementError) throw statementError;

      alert('Attendance statement generated successfully! Check the wages page to view it.');
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

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header onReferFriend={onReferFriend} onMessages={onMessages} />

      <div className="max-w-4xl mx-auto p-4 pt-20">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
            </div>

            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startingDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const record = attendanceData[dateStr];
              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
              const isPendingLogout = record?.status === 'present' && record?.login_time && !record?.logout_time;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                    isToday ? 'ring-2 ring-blue-500' : ''
                  } ${
                    record
                      ? getStatusColor(record.status)
                      : 'bg-gray-50 hover:bg-gray-100'
                  } ${isPendingLogout ? 'ring-2 ring-orange-400' : ''}`}
                >
                  <span className="font-semibold">{day}</span>
                  {isPendingLogout && (
                    <span className="text-xs text-orange-600 font-bold mt-1">⏱</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 rounded"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 rounded"></div>
              <span>Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 rounded"></div>
              <span>Sick Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded ring-2 ring-orange-400"></div>
              <span>Pending Logout ⏱</span>
            </div>
          </div>

          <button
            onClick={() => setShowStatementModal(true)}
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            <FileText className="w-5 h-5" />
            Generate Attendance Statement
          </button>
        </div>

        {selectedDateSummary && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">
              {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedDateSummary.status)}`}>
                  {getStatusLabel(selectedDateSummary.status)}
                </span>
              </div>

              {selectedDateSummary.status === 'present' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Login Time:</span>
                    <span className="font-semibold">{formatTime(selectedDateSummary.login_time)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Logout Time:</span>
                    <span className={`font-semibold ${!selectedDateSummary.logout_time ? 'text-orange-600' : ''}`}>
                      {selectedDateSummary.logout_time ? formatTime(selectedDateSummary.logout_time) : 'Pending Logout ⏱'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Hours:</span>
                    <span className="font-semibold">
                      {selectedDateSummary.total_hours ? `${selectedDateSummary.total_hours.toFixed(2)} hrs` : '--'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showStatementModal && (
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
  );
}
