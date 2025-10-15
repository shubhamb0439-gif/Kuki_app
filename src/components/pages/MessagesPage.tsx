import React, { useState, useEffect } from 'react';
import { MessageSquare, User, Mail, Phone, MapPin, Clock, CheckCircle, XCircle, FileText, Trash2, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Header } from '../common/Header';

interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  status: string;
  message: string | null;
  created_at: string;
  job_postings: {
    title: string;
    profession: string;
    description: string;
  };
  applicant: {
    name: string;
    email: string;
    profile_photo?: string;
    profession?: string;
  };
  rating?: {
    average_rating: number;
    total_ratings: number;
  };
}

interface Statement {
  id: string;
  user_id: string;
  generated_by: string;
  statement_type: string;
  period_start: string;
  period_end: string;
  content: string;
  created_at: string;
  recipient_name?: string;
  generator_name?: string;
}

interface MessagesPageProps {
  onReferFriend: () => void;
  onMessages: () => void;
}

export function MessagesPage({ onReferFriend, onMessages }: MessagesPageProps) {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);
  const [profilePhotos, setProfilePhotos] = useState<Record<string, string>>({});
  const [employeeRatings, setEmployeeRatings] = useState<Record<string, { average: number; total: number }>>({});

  const handleMessagesNav = () => {
    window.location.hash = '#/messages';
  };

  const handleReferFriend = () => {
    alert('Refer a friend feature coming soon!');
  };

  useEffect(() => {
    if (user) {
      loadApplications();
      loadStatements();

      const cleanupApps = subscribeToApplications();
      const cleanupStatements = subscribeToStatements();

      return () => {
        if (cleanupApps) cleanupApps();
        if (cleanupStatements) cleanupStatements();
      };
    }
  }, [user]);

  const loadApplications = async () => {
    if (!user) return;

    try {
      console.log('Loading applications for employer:', user.id);

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_postings!job_applications_job_posting_id_fkey(title, profession, description),
          applicant:profiles!job_applications_applicant_id_fkey(name, email, profession)
        `)
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Applications query result:', { data, error });

      if (error) {
        console.error('Error loading applications:', error);
        return;
      }

      if (data) {
        console.log('Raw applications data:', data);
        const validApplications = data.filter(app =>
          app.job_postings && app.applicant
        );
        console.log('Valid applications after filter:', validApplications);
        setApplications(validApplications as any);

        // Load profile photos and ratings for all applicants
        const applicantIds = validApplications
          .map(app => app.applicant_id)
          .filter((id, index, self) => self.indexOf(id) === index);

        loadProfilePhotos(applicantIds);
        loadEmployeeRatings(applicantIds);
      }
    } catch (error) {
      console.error('Error in loadApplications:', error);
    }
  };

  const loadProfilePhotos = async (userIds: string[]) => {
    if (userIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, profile_photo')
        .in('id', userIds);

      if (!error && data) {
        const photos: Record<string, string> = {};
        data.forEach(profile => {
          if (profile.profile_photo) {
            photos[profile.id] = profile.profile_photo;
          }
        });
        setProfilePhotos(prev => ({ ...prev, ...photos }));
      }
    } catch (error) {
      console.error('Error loading profile photos:', error);
    }
  };

  const loadEmployeeRatings = async (employeeIds: string[]) => {
    if (employeeIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('employee_ratings')
        .select('employee_id, rating')
        .in('employee_id', employeeIds);

      if (!error && data) {
        const ratings: Record<string, { average: number; total: number }> = {};

        employeeIds.forEach(id => {
          const employeeRatings = data.filter(r => r.employee_id === id);
          if (employeeRatings.length > 0) {
            const sum = employeeRatings.reduce((acc, r) => acc + r.rating, 0);
            ratings[id] = {
              average: sum / employeeRatings.length,
              total: employeeRatings.length
            };
          } else {
            ratings[id] = { average: 0, total: 0 };
          }
        });

        setEmployeeRatings(prev => ({ ...prev, ...ratings }));
      }
    } catch (error) {
      console.error('Error loading employee ratings:', error);
    }
  };

  const loadStatements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('statements')
        .select('*')
        .or(`user_id.eq.${user.id},generated_by.eq.${user.id}`)
        .order('created_at', { ascending: false});

      if (error) {
        console.error('Error loading statements:', error);
        return;
      }

      if (data) {
        // Fetch names for recipients and generators
        const userIds = new Set<string>();
        data.forEach(stmt => {
          userIds.add(stmt.user_id);
          userIds.add(stmt.generated_by);
        });

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', Array.from(userIds));

        const nameMap = new Map<string, string>();
        profiles?.forEach(profile => {
          nameMap.set(profile.id, profile.name);
        });

        const enrichedStatements = data.map(stmt => ({
          ...stmt,
          recipient_name: nameMap.get(stmt.user_id) || 'Unknown',
          generator_name: nameMap.get(stmt.generated_by) || 'System'
        }));

        setStatements(enrichedStatements);
      }
    } catch (error) {
      console.error('Error in loadStatements:', error);
    }
  };

  const handleClearMessages = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to clear all messages? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete statements where user is recipient
      const { error: stmtError1 } = await supabase
        .from('statements')
        .delete()
        .eq('user_id', user.id);

      if (stmtError1) {
        console.error('Error deleting recipient statements:', stmtError1);
        throw stmtError1;
      }

      // Delete statements where user is generator
      const { error: stmtError2 } = await supabase
        .from('statements')
        .delete()
        .eq('generated_by', user.id);

      if (stmtError2) {
        console.error('Error deleting generated statements:', stmtError2);
        throw stmtError2;
      }

      // Delete job applications
      const { error: appError } = await supabase
        .from('job_applications')
        .delete()
        .eq('employer_id', user.id);

      if (appError) {
        console.error('Error deleting applications:', appError);
        throw appError;
      }

      // Reload data to reflect changes
      await loadApplications();
      await loadStatements();

      alert('All messages cleared successfully!');
    } catch (error: any) {
      alert('Error clearing messages: ' + error.message);
    }
  };

  const subscribeToApplications = () => {
    if (!user) return;

    const channelName = `job_applications_messages_${user.id}`;
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications',
          filter: `employer_id=eq.${user.id}`
        },
        () => {
          loadApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const subscribeToStatements = () => {
    if (!user) return;

    const channelName1 = `statements_recipient_${user.id}`;
    const subscription1 = supabase
      .channel(channelName1)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'statements',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadStatements();
        }
      )
      .subscribe();

    const channelName2 = `statements_generator_${user.id}`;
    const subscription2 = supabase
      .channel(channelName2)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'statements',
          filter: `generated_by=eq.${user.id}`
        },
        () => {
          loadStatements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription1);
      supabase.removeChannel(subscription2);
    };
  };

  const handleUpdateStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('job_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', applicationId);

    if (!error) {
      await loadApplications();
      setSelectedApplication(null);
      alert(`Application ${status}!`);
    } else {
      alert('Error updating application: ' + error.message);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return `${Math.floor(seconds / 604800)} weeks ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const reviewedApplications = applications.filter(app => app.status !== 'pending');

  return (
    <div className="flex-1 bg-gray-50 pb-20">
      <Header
        onReferFriend={onReferFriend}
        onMessages={onMessages}
        unreadCount={pendingApplications.length}
      />
      <div className="max-w-md mx-auto bg-white min-h-screen pt-[75px]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            {(applications.length > 0 || statements.length > 0) && (
              <button
                onClick={handleClearMessages}
                className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium transition-colors border border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {applications.length === 0 && statements.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No messages yet</p>
              <p className="text-sm text-gray-500">Applications and statements will appear here</p>
            </div>
          ) : (
            <>
              {/* Statements Section */}
              {statements.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Statements ({statements.length})
                  </h2>
                  <div className="space-y-3">
                    {statements.map((statement) => (
                      <div
                        key={statement.id}
                        className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedStatement(statement)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className={`w-12 h-12 mr-3 rounded-full flex items-center justify-center ${
                              statement.statement_type === 'wages' ? 'bg-green-500' :
                              statement.statement_type === 'loan' ? 'bg-orange-500' :
                              statement.statement_type === 'attendance' ? 'bg-purple-500' :
                              'bg-blue-500'
                            }`}>
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {statement.statement_type === 'wages' ? 'Wages' :
                                 statement.statement_type === 'loan' ? 'Loan' :
                                 statement.statement_type === 'attendance' ? 'Attendance' :
                                 'Statement'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {statement.statement_type === 'wages' ? 'Employee wages paid' :
                                 statement.statement_type === 'loan' ? 'Loan granted to employee' :
                                 statement.statement_type === 'attendance' ?
                                   (statement.generated_by === user?.id
                                     ? `For: ${statement.recipient_name}`
                                     : `From: ${statement.generator_name}`) :
                                 'Account statement'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeAgo(statement.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Applications */}
              {pendingApplications.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Pending Applications ({pendingApplications.length})
                  </h2>
                  <div className="space-y-3">
                    {pendingApplications.map((application) => (
                      <div
                        key={application.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedApplication(application)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-12 h-12 mr-3">
                              <ProfilePhoto
                                name={application.applicant?.name || 'Unknown'}
                                photo={profilePhotos[application.applicant_id]}
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{application.applicant?.name || 'Unknown'}</h3>
                              <p className="text-sm text-gray-600">{application.job_postings?.title || 'Job posting unavailable'}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {application.status}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeAgo(application.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviewed Applications */}
              {reviewedApplications.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Reviewed ({reviewedApplications.length})
                  </h2>
                  <div className="space-y-3">
                    {reviewedApplications.map((application) => (
                      <div
                        key={application.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-12 h-12 mr-3">
                              <ProfilePhoto
                                name={application.applicant?.name || 'Unknown'}
                                photo={profilePhotos[application.applicant_id]}
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{application.applicant?.name || 'Unknown'}</h3>
                              <p className="text-sm text-gray-600">{application.job_postings?.title || 'Job posting unavailable'}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {application.status}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeAgo(application.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Statement Detail Modal */}
        {selectedStatement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Statement Personnel
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Generated Statement
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">Statement Content</p>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{selectedStatement.content}</pre>
                </div>

                <div className="flex items-center text-gray-700">
                  <Clock className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Generated</p>
                    <p className="text-sm">{getTimeAgo(selectedStatement.created_at)}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStatement(null)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4">
                  <ProfilePhoto
                    name={selectedApplication.applicant?.name || 'Unknown'}
                    photo={profilePhotos[selectedApplication.applicant_id]}
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {selectedApplication.applicant?.name || 'Unknown'}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Applied for {selectedApplication.job_postings?.title || 'Job posting unavailable'}
                </p>
                {employeeRatings[selectedApplication.applicant_id] && (
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(employeeRatings[selectedApplication.applicant_id].average)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {employeeRatings[selectedApplication.applicant_id].average.toFixed(1)}
                      ({employeeRatings[selectedApplication.applicant_id].total} {employeeRatings[selectedApplication.applicant_id].total === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedApplication.status)}`}>
                  {selectedApplication.status}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-700">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm">{selectedApplication.applicant?.email || 'Not available'}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <User className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Profession</p>
                    <p className="text-sm">{selectedApplication.applicant?.profession || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <Clock className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Applied</p>
                    <p className="text-sm">{getTimeAgo(selectedApplication.created_at)}</p>
                  </div>
                </div>

                {selectedApplication.message && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-2">Message from applicant</p>
                    <p className="text-sm text-gray-700">{selectedApplication.message}</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                {selectedApplication.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedApplication.id, 'rejected')}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedApplication.id, 'accepted')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Accept</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
