import React, { useState } from 'react';
import { Camera, LogOut, Save, X, Briefcase, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { Header } from '../common/Header';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import LanguageSelector from '../common/LanguageSelector';

const PROFESSIONS = [
  { id: 'gardener', name: 'Gardener' },
  { id: 'maid', name: 'Maid' },
  { id: 'driver', name: 'Driver' },
  { id: 'cook', name: 'Cook' },
  { id: 'nanny', name: 'Nanny' },
  { id: 'cleaner', name: 'Cleaner' },
  { id: 'caretaker', name: 'Caretaker' },
  { id: 'security', name: 'Security Guard' },
  { id: 'maintenance', name: 'Maintenance Worker' },
  { id: 'laundry', name: 'Laundry Worker' },
  { id: 'pet_care', name: 'Pet Care' },
  { id: 'tutor', name: 'Tutor' }
];

const CURRENCY_OPTIONS = [
  { code: 'USD', name: 'USD - US Dollar', symbol: '$' },
  { code: 'EUR', name: 'EUR - Euro', symbol: '€' },
  { code: 'GBP', name: 'GBP - British Pound', symbol: '£' },
  { code: 'INR', name: 'INR - Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'JPY - Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'CNY - Chinese Yuan', symbol: '¥' },
  { code: 'AUD', name: 'AUD - Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'CAD - Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'CHF - Swiss Franc', symbol: 'Fr' },
  { code: 'SGD', name: 'SGD - Singapore Dollar', symbol: 'S$' },
  { code: 'MXN', name: 'MXN - Mexican Peso', symbol: 'Mex$' },
  { code: 'BRL', name: 'BRL - Brazilian Real', symbol: 'R$' }
];

interface EditProfilePageProps {
  onReferFriend: () => void;
  onMessages: () => void;
}

export function EditProfilePage({ onReferFriend, onMessages }: EditProfilePageProps) {
  const { user, signOut, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState(user?.profession || '');
  const [currency, setCurrency] = useState('USD');
  const [isSaving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('currency, phone')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.currency) {
        setCurrency(data.currency);
      }
      if (data?.phone) {
        setPhone(data.phone);
      }
    };
    loadProfile();
  }, [user]);

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

  const handleBack = () => {
    window.history.back();
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const updateData: any = {
        name,
        phone,
        currency,
        updated_at: new Date().toISOString()
      };

      if (user.role === 'employee') {
        updateData.profession = profession;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      await refreshUser();
      alert(t('common.success'));
      window.location.hash = '#/home';
    } catch (error: any) {
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshUser();
      alert('Profile photo updated successfully!');
    } catch (error: any) {
      alert('Error uploading photo: ' + error.message);
    } finally {
      setIsUploading(false);
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
        <span className="text-white font-semibold text-4xl">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onReferFriend={onReferFriend}
        onMessages={onMessages}
        unreadCount={0}
      />
      <div className="max-w-md mx-auto bg-white min-h-screen pt-[75px]">
        {/* Page Header */}
        <div className="bg-blue-600 text-white px-4 py-4 flex items-center justify-between">
          <button onClick={handleBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">{t('profile.edit')}</h1>
          <div className="w-10"></div>
        </div>

        <div className="p-6">
          {/* Profile Photo */}
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-4 relative">
              <ProfilePhoto name={name} photo={user?.profile_photo} />
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="text-white text-sm">Uploading...</div>
                </div>
              )}
              <label
                htmlFor="photo-upload"
                className={`absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg ${isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-blue-700'} transition-colors`}
              >
                <Camera className="w-5 h-5 text-white" />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-600">
              {isUploading ? 'Uploading photo...' : t('profile.uploadPhoto')}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.fullName')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder={t('auth.email')}
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.phone')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('auth.phone')}
              />
            </div>

            {/* Profession (Employee Only) */}
            {user?.role === 'employee' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  {t('profile.profession')}
                </label>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('profile.selectProfession')}</option>
                  {PROFESSIONS.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.currency')}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CURRENCY_OPTIONS.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                This currency will be used for all your transactions
              </p>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.language')}
              </label>
              <LanguageSelector />
              <p className="text-xs text-gray-500 mt-2">
                This language will be used throughout the app
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-400"
            >
              <Save className="w-5 h-5" />
              <span>{isSaving ? t('common.loading') : t('profile.save')}</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('home.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
