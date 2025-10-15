import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Clock, DollarSign, Star, Users, UserPlus, UserCheck, UserX, Plus, Briefcase, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Header } from '../common/Header';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  profile_photo?: string;
  profession?: string;
  average_rating?: number;
  rating_count?: number;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
}

interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  location: string;
  hourly_rate: number;
  job_type: string;
  status: string;
  created_at: string;
}

interface SearchPageProps {
  onReferFriend: () => void;
  onMessages: () => void;
}

export function SearchPage({ onReferFriend, onMessages }: SearchPageProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'jobs' | 'posts' | 'users'>('users');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({
    description: '',
    profession: '',
    job_type: 'full-time'
  });
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({
    description: '',
    profession: ''
  });
  const [myPosts, setMyPosts] = useState<Job[]>([]);

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
    if (user) {
      loadFriendRequests();
      loadFriends();
      loadJobs();
      if (user.role === 'employee') {
        loadMyPosts();
      }
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      searchPeople();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadFriendRequests = async () => {
    if (!user) return;

    const { data: sent } = await supabase
      .from('friend_requests')
      .select('receiver_id')
      .eq('sender_id', user.id)
      .eq('status', 'pending');

    if (sent) {
      setSentRequests(new Set(sent.map(req => req.receiver_id)));
    }

    const { data: received } = await supabase
      .from('friend_requests')
      .select('*, sender:profiles!friend_requests_sender_id_fkey(name, profile_photo)')
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (received) {
      setReceivedRequests(received as any);
    }
  };

  const loadFriends = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id);

    if (data) {
      setFriends(new Set(data.map(f => f.friend_id)));
    }
  };

  const searchPeople = async () => {
    if (!user || searchQuery.length === 0) return;

    let query = supabase
      .from('profiles')
      .select('id, name, email, role, profile_photo, profession')
      .neq('id', user.id)
      .limit(20);

    // Search by name OR profession
    // For employers searching, they want to find employees by profession
    if (user.role === 'employer') {
      query = query.or(`name.ilike.%${searchQuery}%,profession.ilike.%${searchQuery}%`);
    } else {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (!error && data) {
      const profilesWithRatings = await Promise.all(
        data.map(async (profile) => {
          const { data: ratings } = await supabase
            .from('performance_ratings')
            .select('rating')
            .eq('employee_id', profile.id);

          if (ratings && ratings.length > 0) {
            const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
            return {
              ...profile,
              average_rating: Math.round(avgRating * 10) / 10,
              rating_count: ratings.length
            };
          }

          return {
            ...profile,
            average_rating: 0,
            rating_count: 0
          };
        })
      );

      // Sort by rating (highest first), then by name
      profilesWithRatings.sort((a, b) => {
        if (b.average_rating !== a.average_rating) {
          return b.average_rating! - a.average_rating!;
        }
        return a.name.localeCompare(b.name);
      });

      setSearchResults(profilesWithRatings);
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending'
      });

    if (!error) {
      setSentRequests(new Set([...sentRequests, receiverId]));
    }
  };

  const handleFriendRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (!error) {
      await loadFriendRequests();
      await loadFriends();
    }
  };

  const loadJobs = async () => {
    if (!user) return;

    let query = supabase
      .from('job_postings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // For employers, show only their jobs
    if (user.role === 'employer') {
      query = query.eq('employer_id', user.id);
    } else if (user.role === 'employee' && user.profession) {
      // For employees, show only jobs matching their profession
      query = query.eq('profession', user.profession);
    }

    const { data, error } = await query;

    if (!error && data) {
      setJobs(data as any);
    }
  };

  const handleCreateJob = async () => {
    if (!user || !jobForm.description || !jobForm.profession) {
      alert('Please fill in all required fields');
      return;
    }

    const title = `${jobForm.profession.replace('_', ' ')} - ${jobForm.job_type}`;

    const { error } = await supabase
      .from('job_postings')
      .insert({
        employer_id: user.id,
        title: title,
        description: jobForm.description,
        profession: jobForm.profession,
        status: 'active'
      });

    if (!error) {
      setShowJobModal(false);
      setJobForm({ description: '', profession: '', job_type: 'full-time' });
      alert('Job posted successfully!');
      if (user.role === 'employee') {
        loadJobs();
      }
    } else {
      alert('Error posting job: ' + error.message);
    }
  };

  const handleApplyJob = async (jobId: string, employerId: string) => {
    if (!user) return;

    try {
      // For job_postings, we just insert into job_applications with the posting ID
      const { error: appError } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          employer_id: employerId,
          status: 'pending'
        });

      if (appError) throw appError;

      alert('Application submitted successfully!');
    } catch (error: any) {
      if (error.message.includes('duplicate') || error.message.includes('violates foreign key')) {
        alert('You have already applied for this job');
      } else {
        alert('Error submitting application: ' + error.message);
      }
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;

    const { error } = await supabase
      .from('job_postings')
      .update({ status: 'closed' })
      .eq('id', jobId);

    if (!error) {
      alert('Job deleted successfully!');
      loadJobs();
    } else {
      alert('Error deleting job: ' + error.message);
    }
  };

  const loadMyPosts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('employer_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMyPosts(data as any);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !postForm.description) {
      alert('Please fill in all fields');
      return;
    }

    // Use employee's profession from their profile
    const employeeProfession = user.profession;
    if (!employeeProfession) {
      alert('Please set your profession in your profile first');
      return;
    }

    const title = `Job Request - ${employeeProfession.replace('_', ' ')}`;

    const { error } = await supabase
      .from('job_postings')
      .insert({
        employer_id: user.id,
        title: title,
        description: postForm.description,
        profession: employeeProfession,
        status: 'active'
      });

    if (!error) {
      setShowPostModal(false);
      setPostForm({ description: '', profession: '' });
      alert('Job request posted successfully!');
      loadMyPosts();
    } else {
      alert('Error posting job request: ' + error.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const { error } = await supabase
      .from('job_postings')
      .update({ status: 'closed' })
      .eq('id', postId);

    if (!error) {
      alert('Post deleted successfully!');
      loadMyPosts();
    } else {
      alert('Error deleting post: ' + error.message);
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

  return (
    <div className="flex-1 bg-gray-50 pb-20">
      <Header
        onReferFriend={onReferFriend}
        onMessages={onMessages}
        unreadCount={0}
      />
      <div className="max-w-md mx-auto bg-white min-h-screen pt-[75px]">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Search</h1>

          {/* Search Type Toggle */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setSearchType('users')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                searchType === 'users'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users
            </button>
            {user?.role === 'employee' && (
              <button
                onClick={() => setSearchType('posts')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  searchType === 'posts'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Briefcase className="w-4 h-4 inline mr-2" />
                Posts
              </button>
            )}
            <button
              onClick={() => setSearchType('jobs')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                searchType === 'jobs'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Briefcase className="w-4 h-4 inline mr-2" />
              Jobs
            </button>
          </div>

          {/* Employer Job Posting Section */}
          {user?.role === 'employer' && searchType === 'jobs' && (
            <div className="mb-6">
              <button
                onClick={() => setShowJobModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Post a Job</span>
              </button>
            </div>
          )}

          {/* Search Bar */}
          {searchType !== 'jobs' && (
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchType === 'users' ? 'Search users by name...' : 'Search people by name...'}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Post Job Request Button */}
          {user?.role === 'employee' && searchType === 'posts' && (
            <div className="mb-6">
              <button
                onClick={() => setShowPostModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Post Job Request</span>
              </button>
            </div>
          )}

          {/* Friend Requests Section (removed) */}
          {searchType === 'posts' && receivedRequests.length > 0 && false && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Friend Requests</h2>
              <div className="space-y-3">
                {receivedRequests.map((request: any) => (
                  <div key={request.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 mr-3">
                          <ProfilePhoto
                            name={request.sender.name}
                            photo={request.sender.profile_photo}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{request.sender.name}</p>
                          <p className="text-sm text-gray-600">Wants to connect</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFriendRequest(request.id, 'accepted')}
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFriendRequest(request.id, 'rejected')}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="space-y-4">
            {searchType === 'users' ? (
              searchResults.length > 0 ? (
                searchResults.map((profile) => (
                  <div key={profile.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <div className="w-12 h-12 mr-4">
                          <ProfilePhoto name={profile.name} photo={profile.profile_photo} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                          <p className="text-sm text-gray-600">{profile.email}</p>
                          {profile.profession && (
                            <p className="text-xs text-blue-600 mt-1">{profile.profession}</p>
                          )}
                          {profile.rating_count! > 0 && (
                            <div className="flex items-center mt-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm font-medium text-gray-700">
                                {profile.average_rating!.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500 ml-1">
                                ({profile.rating_count} reviews)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-blue-600 font-medium capitalize">{profile.role}</p>
                          {profile.profession && (
                            <span className="text-xs text-green-600 font-medium capitalize">• {profile.profession.replace('_', ' ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : searchQuery.length > 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No users found</p>
                  <p className="text-sm text-gray-500">Try searching by name</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Search for users</p>
                  <p className="text-sm text-gray-500">Enter a name to find users</p>
                </div>
              )
            ) : searchType === 'posts' && user?.role === 'employee' ? (
              myPosts.length > 0 ? (
                myPosts.map((post) => (
                  <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{post.title}</h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium capitalize">
                        {post.profession?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{post.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{getTimeAgo(post.created_at)}</span>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No job requests posted</p>
                  <p className="text-sm text-gray-500">Click "Post Job Request" to create one</p>
                </div>
              )
            ) : (
              jobs.length > 0 ? (
                jobs.map((job) => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium capitalize">
                        {job.profession?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{job.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{getTimeAgo(job.created_at)}</span>
                      {user?.role === 'employer' ? (
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyJob(job.id, job.employer_id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No jobs available</p>
                  <p className="text-sm text-gray-500">Check back later for new opportunities</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Post Job Request Modal */}
        {showPostModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Post Job Request</h3>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profession
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium capitalize">
                    {user?.profession?.replace('_', ' ') || 'Not set'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">You can only post jobs for your profession</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={postForm.description}
                    onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                    placeholder="Describe what kind of work you're looking for"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPostModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Post Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Job Posting Modal */}
        {showJobModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Post a Job</h3>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profession <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={jobForm.profession}
                    onChange={(e) => setJobForm({ ...jobForm, profession: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select profession</option>
                    <option value="gardener">Gardener</option>
                    <option value="maid">Maid</option>
                    <option value="driver">Driver</option>
                    <option value="cook">Cook</option>
                    <option value="nanny">Nanny</option>
                    <option value="cleaner">Cleaner</option>
                    <option value="caretaker">Caretaker</option>
                    <option value="security">Security Guard</option>
                    <option value="maintenance">Maintenance Worker</option>
                    <option value="laundry">Laundry Worker</option>
                    <option value="pet_care">Pet Care</option>
                    <option value="tutor">Tutor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={jobForm.job_type}
                    onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    placeholder="Describe the job responsibilities and requirements"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowJobModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateJob}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Post Job
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
