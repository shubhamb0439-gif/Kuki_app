import React, { useState } from 'react';
import { X, Send, UserPlus, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ReferFriendModalProps {
  onClose: () => void;
}

export function ReferFriendModal({ onClose }: ReferFriendModalProps) {
  const { user } = useAuth();
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !contactValue) return;

    setLoading(true);
    try {
      const appUrl = window.location.origin;
      const appName = 'KUKI';
      const description = `${user.name} has invited you to join ${appName}!\n\n${appName} is a comprehensive employee-employer management platform that helps businesses manage wages, attendance, performance reviews, and more.\n\nKey Features:\n- Seamless wage management and payment tracking\n- QR-based attendance and transaction systems\n- Performance ratings and reviews\n- Job postings and applications\n- Real-time messaging and notifications\n\nJoin ${appName} today and experience efficient workforce management!\n\nDownload the app: ${appUrl}`;

      if (contactMethod === 'email') {
        // Call edge function to send email
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-referral`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'email',
            to: contactValue,
            from: user.name,
            appUrl,
            description
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to send email');
        }

        alert(`Referral invitation prepared for ${contactValue}!\n\nNote: This is a demo feature. In production, this would send an actual email using services like SendGrid or AWS SES.\n\nYou can manually share this link:\n${appUrl}`);
      } else {
        // Call edge function to send SMS
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-referral`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'sms',
            to: contactValue,
            from: user.name,
            appUrl,
            description
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to send SMS');
        }

        alert(`Referral invitation prepared for ${contactValue}!\n\nNote: This is a demo feature. In production, this would send an actual SMS using services like Twilio or AWS SNS.\n\nYou can manually share this message:\n"${user.name} invites you to join KUKI! Download: ${appUrl}"`);
      }

      onClose();
    } catch (error: any) {
      alert('Error sending referral: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isValidContact = () => {
    if (contactMethod === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue);
    } else {
      return /^\+?[\d\s-()]+$/.test(contactValue) && contactValue.replace(/\D/g, '').length >= 10;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Refer a Friend</h2>
              <p className="text-sm text-gray-500">Invite someone to join KUKI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Contact Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setContactMethod('email');
                  setContactValue('');
                }}
                className={`py-3 px-4 rounded-xl border-2 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  contactMethod === 'email'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setContactMethod('phone');
                  setContactValue('');
                }}
                className={`py-3 px-4 rounded-xl border-2 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  contactMethod === 'phone'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <Phone className="w-4 h-4" />
                Phone
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {contactMethod === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {contactMethod === 'email' ? (
                  <Mail className="w-5 h-5 text-gray-400" />
                ) : (
                  <Phone className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <input
                type={contactMethod === 'email' ? 'email' : 'tel'}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={contactMethod === 'email' ? 'friend@example.com' : '+1 234 567 8900'}
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {contactMethod === 'email'
                ? 'Enter the email address of the person you want to invite'
                : 'Enter the phone number including country code'}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">What they'll receive:</p>
            <p className="text-xs text-blue-700">
              A personalized invitation from you with information about KUKI and a link to get started.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !contactValue || !isValidContact()}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
