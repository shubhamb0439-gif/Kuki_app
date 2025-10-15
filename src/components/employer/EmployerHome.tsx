import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CreditCard as Edit, CreditCard, Plus, QrCode, Users, DollarSign, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Employee } from '../../types/auth';
import { Header } from '../common/Header';
import { ProfileWithStatusRing } from '../common/ProfileWithStatusRing';
import { EmployeeProfileModal } from './EmployeeProfileModal';
import { EmployeeCard } from './EmployeeCard';
import { getEmployerOwnStatus, getBatchEmployeeStatusForEmployer } from '../../lib/statusRingHelper';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { EmployerHomeSkeletonLoader } from '../common/SkeletonLoader';

interface EmployerHomeProps {
  onReferFriend: () => void;
  onMessages: () => void;
}

export function EmployerHome({ onReferFriend, onMessages }: EmployerHomeProps) {
  const { user, signOut } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showQROptions, setShowQROptions] = useState(false);
  const [qrTransactionType, setQrTransactionType] = useState<'add_employee' | 'pay_wages' | 'settle_loan' | 'mark_attendance'>('add_employee');
  const [showEmploymentTypeModal, setShowEmploymentTypeModal] = useState(false);
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<'full_time' | 'part_time' | 'contract'>('full_time');
  const [showPartTimeConfig, setShowPartTimeConfig] = useState(false);
  const [partTimeConfig, setPartTimeConfig] = useState({ workingHoursPerDay: 8, workingDaysPerMonth: 22 });
  const [showEmployeeSelection, setShowEmployeeSelection] = useState(false);
  const [selectedQREmployee, setSelectedQREmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const currentTransactionIdRef = useRef<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [employerStatus, setEmployerStatus] = useState<{showRing: boolean; color: string; text: string}>({ showRing: false, color: '', text: '' });
  const [employeeStatuses, setEmployeeStatuses] = useState<Record<string, {showRing: boolean; color: string; text: string}>>({});
  const [employerRating, setEmployerRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useSwipeGesture({
    onSwipeLeft: () => {
      window.location.hash = '#/messages';
    }
  });

  const handleEditProfile = () => {
    window.location.hash = '#/edit-profile';
  };

  useEffect(() => {
    if (user) {
      // Load fresh data immediately
      Promise.all([
        fetchEmployees(),
        fetchUnreadMessages(),
        loadEmployerStatus()
      ]).then(() => {
        setIsLoading(false);
        setInitialLoadComplete(true);
      });

      const cleanupEmployees = subscribeToEmployees();
      const cleanupProfiles = subscribeToProfiles();
      const cleanupJobPostings = subscribeToJobPostings();
      const cleanupJobApplications = subscribeToJobApplications();
      const cleanupQRTransactions = subscribeToQRTransactions();

      return () => {
        if (cleanupEmployees) cleanupEmployees();
        if (cleanupProfiles) cleanupProfiles();
        if (cleanupJobPostings) cleanupJobPostings();
        if (cleanupJobApplications) cleanupJobApplications();
        if (cleanupQRTransactions) cleanupQRTransactions();
      };
    }
  }, [user]);

  const subscribeToQRTransactions = () => {
    if (!user) return;

    const subscription = supabase
      .channel('qr_transactions_updates')
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'qr_transactions',
          filter: `employer_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.status === 'completed' && payload.new.id === currentTransactionIdRef.current) {
            setShowQRCode(false);
            setQrCodeValue('');
            setCurrentTransactionId(null);
            currentTransactionIdRef.current = null;
            alert('Transaction completed successfully!');
            fetchEmployees();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  // Memoize employee user IDs to prevent re-computing on every render
  const employeeUserIds = useMemo(() => {
    return employees
      .filter(emp => emp.user_id)
      .map(emp => emp.user_id as string);
  }, [employees]);

  useEffect(() => {
    if (employeeUserIds.length > 0) {
      loadEmployeeStatuses();
    }
  }, [employeeUserIds]);

  const fetchUnreadMessages = async () => {
    if (!user) return;

    const { count: appCount } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('employer_id', user.id)
      .eq('status', 'pending');

    const { count: stmtCount } = await supabase
      .from('statements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setUnreadMessages((appCount || 0) + (stmtCount || 0));
  };

  const fetchEmployees = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        profiles!employees_user_id_fkey(name, profile_photo, job_status, show_status_ring, profession)
      `)
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employees:', error);
      return;
    }

    const formattedEmployees = data.map(emp => ({
      id: emp.id,
      user_id: emp.user_id,
      employer_id: emp.employer_id,
      name: emp.profiles?.name || emp.email || emp.phone,
      email: emp.email,
      phone: emp.phone,
      profile_photo: emp.profiles?.profile_photo,
      job_status: emp.profiles?.job_status,
      show_status_ring: emp.profiles?.show_status_ring,
      profession: emp.profiles?.profession,
      employment_type: emp.employment_type,
      status: emp.status,
      created_at: emp.created_at
    }));

    setEmployees(formattedEmployees);
  };

  const subscribeToEmployees = () => {
    if (!user) return;

    const subscription = supabase
      .channel(`employees_${user.id}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees',
          filter: `employer_id=eq.${user.id}`
        },
        () => {
          fetchEmployees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const subscribeToProfiles = () => {
    if (!user) return;

    const subscription = supabase
      .channel(`profiles_updates_${user.id}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          const affectedEmployee = employees.find(emp => emp.user_id === payload.new?.id);
          if (affectedEmployee) {
            fetchEmployees();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const subscribeToJobPostings = () => {
    if (!user) return;

    const subscription = supabase
      .channel(`job_postings_${user.id}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_postings',
          filter: `employer_id=eq.${user.id}`
        },
        () => {
          loadEmployerStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const subscribeToJobApplications = () => {
    if (!user) return;

    // Subscribe to job applications AND job postings to detect when employees:
    // 1. Apply to other jobs
    // 2. Post job requests (looking for work)
    const subscription = supabase
      .channel(`employee_activity_status_${user.id}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_applications'
        },
        () => {
          // Refresh employee statuses when any job application is created
          loadEmployeeStatuses();
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_postings'
        },
        () => {
          // Refresh employee statuses when any job posting is created/updated/deleted
          loadEmployeeStatuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const loadEmployerStatus = async () => {
    if (!user) return;
    const status = await getEmployerOwnStatus(user.id);
    setEmployerStatus(status);

    const { data: ratings } = await supabase
      .from('employer_ratings')
      .select('rating')
      .eq('employer_id', user.id);

    if (ratings && ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      const roundedRating = Math.round(avgRating);
      setEmployerRating(roundedRating);
    } else {
      setEmployerRating(5);
    }
  };

  const loadEmployeeStatuses = async () => {
    if (employees.length === 0) return;

    // Get all user IDs
    const userIds = employees
      .filter(emp => emp.user_id)
      .map(emp => emp.user_id as string);

    if (userIds.length === 0) return;

    // Batch load all statuses in just 2 queries instead of N queries
    const statusesByUserId = await getBatchEmployeeStatusForEmployer(userIds);

    // Map back to employee IDs
    const statuses: Record<string, {showRing: boolean; color: string; text: string}> = {};
    employees.forEach(employee => {
      if (employee.user_id && statusesByUserId[employee.user_id]) {
        statuses[employee.id] = statusesByUserId[employee.user_id];
      }
    });

    setEmployeeStatuses(statuses);
  };

  const generateQRCode = () => {
    setShowQROptions(true);
  };

  const handleAddEmployeeClick = () => {
    setShowEmploymentTypeModal(true);
  };

  const handleEmploymentTypeSelected = (type: 'full_time' | 'part_time' | 'contract') => {
    setSelectedEmploymentType(type);
    setShowEmploymentTypeModal(false);

    if (type === 'part_time') {
      setShowPartTimeConfig(true);
    } else {
      generateAddEmployeeQR(type);
    }
  };

  const handlePartTimeConfigSubmit = () => {
    setShowPartTimeConfig(false);
    generateAddEmployeeQR('part_time');
  };

  const generateAddEmployeeQR = (employmentType: 'full_time' | 'part_time' | 'contract') => {
    if (!user) return;
    let code = '';
    if (employmentType === 'part_time') {
      const configData = encodeURIComponent(JSON.stringify(partTimeConfig));
      code = `employer:${user.id}:${user.email}:${employmentType}:${configData}`;
    } else {
      code = `employer:${user.id}:${user.email}:${employmentType}`;
    }
    setQrCodeValue(code);
    setQrTransactionType('add_employee');
    setShowQRCode(true);
  };

  const handleQROption = (type: 'pay_wages' | 'mark_attendance') => {
    if (!user) return;
    setQrTransactionType(type);
    setShowQROptions(false);

    if (type === 'mark_attendance') {
      // Universal attendance - no employee selection needed
      createUniversalAttendanceQR();
    } else {
      // For pay_wages - select employee first
      setShowEmployeeSelection(true);
    }
  };

  const handleEmployeeSelected = (employee: Employee) => {
    setSelectedQREmployee(employee);
    setShowEmployeeSelection(false);
    createQRTransaction(qrTransactionType as 'pay_wages' | 'settle_loan' | 'mark_attendance', employee.id);
  };

  const createUniversalAttendanceQR = async () => {
    if (!user) return;

    const qrCode = `qr:mark_attendance:${user.id}:universal:${Date.now()}`;

    const { data, error } = await supabase
      .from('qr_transactions')
      .insert({
        employer_id: user.id,
        employee_id: null,
        transaction_type: 'mark_attendance',
        qr_code: qrCode,
        status: 'pending'
      })
      .select()
      .single();

    if (!error && data) {
      setCurrentTransactionId(data.id);
      currentTransactionIdRef.current = data.id;
      setQrCodeValue(qrCode);
      setShowQRCode(true);
    } else {
      alert('Error generating QR code: ' + error.message);
    }
  };

  const createQRTransaction = async (type: 'pay_wages', employeeId: string) => {
    if (!user) return;

    const qrCode = `qr:${type}:${user.id}:${employeeId}:${Date.now()}`;

    const { data, error } = await supabase
      .from('qr_transactions')
      .insert({
        employer_id: user.id,
        employee_id: employeeId,
        transaction_type: type,
        qr_code: qrCode,
        status: 'pending'
      })
      .select()
      .single();

    if (!error && data) {
      setCurrentTransactionId(data.id);
      currentTransactionIdRef.current = data.id;
      setQrCodeValue(qrCode);
      setShowQRCode(true);
    } else {
      alert('Error generating QR code: ' + error.message);
    }
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
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
        <span className="text-white font-semibold text-lg">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  // Show skeleton loader only on first load
  if (isLoading && !initialLoadComplete) {
    return (
      <div className="min-h-screen bg-white">
        <Header
          onReferFriend={onReferFriend}
          onMessages={onMessages}
          unreadCount={unreadMessages}
        />
        <div className="max-w-md mx-auto bg-white" style={{ paddingTop: 'calc(75px + env(safe-area-inset-top))', minHeight: '100vh' }}>
          <EmployerHomeSkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        onReferFriend={onReferFriend}
        onMessages={onMessages}
        unreadCount={unreadMessages}
      />

      <div className="max-w-md mx-auto bg-white pb-24 overflow-y-auto" style={{ paddingTop: 'calc(75px + env(safe-area-inset-top))', minHeight: '100vh' }}>
        {/* Profile Header */}
        <div className="bg-blue-600 text-white px-4 py-6 relative overflow-hidden bg-cover bg-center shadow-lg -mt-[calc(env(safe-area-inset-top))]" style={{ backgroundImage: 'url(/waves 4.png)', paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
          <div className="relative z-10">

            {/* Profile Section */}
            <div className="text-center pb-20">
              <div className="mx-auto mb-4 relative inline-block">
                <ProfileWithStatusRing
                  name={user?.name || ''}
                  photo={user?.profile_photo}
                  showStatus={employerStatus.showRing}
                  statusText={employerStatus.text}
                  statusColor={employerStatus.color}
                  size="large"
                />
                <button
                  onClick={handleEditProfile}
                  className="absolute bottom-0 right-0 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors z-20"
                >
                  <Edit className="w-4 h-4 text-blue-600" />
                </button>
              </div>
              <p className="text-white text-base mb-1">Welcome</p>
              <h2 className="text-2xl font-bold text-white mb-3">{user?.name}</h2>
              <div className="flex justify-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < employerRating ? 'text-yellow-400' : 'text-white/30'} fill-current`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          {/* Wave decoration */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 100" className="w-full" preserveAspectRatio="none">
              <path fill="rgba(59, 130, 246, 0.5)" d="M0,50L80,53.3C160,57,320,63,480,60C640,57,800,43,960,40C1120,37,1280,43,1360,46.7L1440,50L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"></path>
              <path fill="rgba(96, 165, 250, 0.5)" d="M0,70L80,66.7C160,63,320,57,480,60C640,63,800,77,960,80C1120,83,1280,77,1360,73.3L1440,70L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"></path>
              <path fill="white" d="M0,50L80,53.3C160,57,320,63,480,60C640,57,800,43,960,40C1120,37,1280,43,1360,46.7L1440,50L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"></path>
            </svg>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="px-6 -mt-16 relative z-20 mb-6">
          <div className="grid grid-cols-4 gap-4">
            {employees.slice(0, 3).map((employee) => {
              const status = employeeStatuses[employee.id] || { showRing: false, color: '', text: '' };
              return (
                <div key={employee.id} className="flex justify-center">
                  <ProfileWithStatusRing
                    name={employee.name}
                    photo={employee.profile_photo}
                    showStatus={status.showRing}
                    statusText={status.text}
                    statusColor={status.color}
                    size="medium"
                    onClick={() => handleEmployeeClick(employee)}
                  />
                </div>
              );
            })}

            {/* Add Employee Button */}
            <button
              onClick={handleAddEmployeeClick}
              className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-10 h-10 text-white" />
            </button>

            {/* Additional Employees - Memoized for better performance */}
            {employees.slice(3, 11).map((employee) => {
              const status = employeeStatuses[employee.id] || { showRing: false, color: '', text: '' };
              return (
                <div key={employee.id} className="flex justify-center">
                  <ProfileWithStatusRing
                    name={employee.name}
                    photo={employee.profile_photo}
                    showStatus={status.showRing}
                    statusText={status.text}
                    statusColor={status.color}
                    size="medium"
                    onClick={() => handleEmployeeClick(employee)}
                  />
                </div>
              );
            })}

            {/* Placeholder slots if less than 11 employees */}
            {employees.length < 11 && [...Array(Math.max(0, 11 - employees.length))].map((_, i) => (
              <div key={`empty-${i}`} className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200"></div>
            ))}
          </div>

          {employees.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No employees yet</p>
              <p className="text-sm text-gray-500">Tap the + button to invite employees</p>
            </div>
          )}
        </div>

        {/* Generate QR Code Button - Fixed at Bottom */}
        {employees.length > 0 && (
          <div className="fixed bottom-24 left-0 right-0 px-6 z-30">
            <div className="max-w-md mx-auto">
              <button
                onClick={generateQRCode}
                className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white py-4 px-6 rounded-full font-semibold flex items-center justify-center shadow-lg transition-all transform hover:scale-105"
              >
                <QrCode className="w-5 h-5 mr-2" />
                Generate QR Code
              </button>
            </div>
          </div>
        )}

        {/* Employee Selection Modal for QR */}
        {showEmployeeSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="text-center mb-6">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-gray-900">Select Employee</h3>
                <p className="text-sm text-gray-600">
                  Choose the employee for this transaction
                </p>
              </div>

              <div className="space-y-2">
                {employees.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => handleEmployeeSelected(employee)}
                    className="w-full p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12">
                        <ProfilePhoto name={employee.name} photo={employee.profile_photo} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{employee.name}</p>
                        <p className="text-sm text-gray-600">{employee.email || employee.phone}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowEmployeeSelection(false);
                  setSelectedQREmployee(null);
                }}
                className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Employment Type Selection Modal */}
        {showEmploymentTypeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <div className="text-center mb-6">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-gray-900">Select Employment Type</h3>
                <p className="text-sm text-gray-600">Choose the type of employment for this employee</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleEmploymentTypeSelected('full_time')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 px-4 rounded-lg font-medium transition-colors"
                >
                  Full-time
                </button>

                <button
                  onClick={() => handleEmploymentTypeSelected('part_time')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-4 rounded-lg font-medium transition-colors"
                >
                  Part-time
                </button>

                <button
                  onClick={() => handleEmploymentTypeSelected('contract')}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 px-4 rounded-lg font-medium transition-colors"
                >
                  Contract
                </button>
              </div>

              <button
                onClick={() => setShowEmploymentTypeModal(false)}
                className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Part-time Configuration Modal */}
        {showPartTimeConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <div className="text-center mb-6">
                <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-gray-900">Part-time Configuration</h3>
                <p className="text-sm text-gray-600">Set working hours and days</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Hours Per Day
                  </label>
                  <input
                    type="number"
                    value={partTimeConfig.workingHoursPerDay}
                    onChange={(e) => setPartTimeConfig({...partTimeConfig, workingHoursPerDay: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="8"
                    step="0.5"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days Per Month
                  </label>
                  <input
                    type="number"
                    value={partTimeConfig.workingDaysPerMonth}
                    onChange={(e) => setPartTimeConfig({...partTimeConfig, workingDaysPerMonth: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="22"
                    min="0"
                  />
                </div>

              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPartTimeConfig(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePartTimeConfigSubmit}
                  disabled={partTimeConfig.workingHoursPerDay <= 0 || partTimeConfig.workingDaysPerMonth <= 0}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Generate QR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employee Profile Modal */}
        {showEmployeeModal && selectedEmployee && (
          <EmployeeProfileModal
            employee={selectedEmployee}
            onClose={() => {
              setShowEmployeeModal(false);
              setSelectedEmployee(null);
            }}
            onUpdate={() => {
              fetchEmployees();
            }}
          />
        )}

        {/* QR Options Modal */}
        {showQROptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <div className="text-center mb-6">
                <QrCode className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-gray-900">Generate QR Code</h3>
                <p className="text-sm text-gray-600">Choose an action</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleQROption('pay_wages')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Pay Wages</span>
                </button>

                <button
                  onClick={() => handleQROption('mark_attendance')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Mark Attendance</span>
                </button>
              </div>

              <button
                onClick={() => setShowQROptions(false)}
                className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <div className="text-center mb-6">
                <QrCode className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {qrTransactionType === 'add_employee' && (
                    selectedEmploymentType === 'full_time' ? 'Add Full-time Employee' :
                    selectedEmploymentType === 'part_time' ? 'Add Part-time Employee' :
                    selectedEmploymentType === 'contract' ? 'Add Contract Employee' :
                    'Add Employee QR Code'
                  )}
                  {qrTransactionType === 'pay_wages' && 'Pay Wages QR Code'}
                  {qrTransactionType === 'settle_loan' && 'Settle Loan QR Code'}
                  {qrTransactionType === 'mark_attendance' && 'Mark Attendance QR Code'}
                </h3>
                <p className="text-sm text-gray-600">
                  {qrTransactionType === 'add_employee' ? 'Share this code with employees to add them' : qrTransactionType === 'mark_attendance' ? 'Any employee can scan this code to mark attendance' : 'Share this code with your employee to scan'}
                </p>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg mb-6">
                <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center border-2 border-gray-300">
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

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowQRCode(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => navigator.share && navigator.share({ text: qrCodeValue })}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
