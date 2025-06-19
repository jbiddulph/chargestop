import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import ProfileForm from '../components/ProfileForm';
import AvatarUpload from '../components/AvatarUpload';
import { useState } from 'react';
import { updateUserProfile } from '../lib/profile';

const ProfilePage = () => {
  const { user, signOut, loading, refreshUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar_url || user?.user_metadata?.avatar_url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  // Use user metadata for name if available, else blank
  const initialValues = {
    name: user.user_metadata?.name || '',
    email: user.email || '',
  };

  // Profile update logic: persist name and avatar to Supabase
  const handleProfileUpdate = async (values: { name: string; email: string }) => {
    setSaving(true);
    setError(null);
    try {
      await updateUserProfile(user.id, {
        name: values.name,
        avatar_url: avatarUrl,
      });
      if (refreshUser) await refreshUser(); // Refresh user context if available
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar change and persist to Supabase
  const handleAvatarChange = async (url: string | null) => {
    setAvatarUrl(url || undefined);
    try {
      await updateUserProfile(user.id, {
        name: user.user_metadata?.name || '',
        avatar_url: url,
      });
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to update avatar');
    }
  };

  return (
    <ProtectedRoute>
      <div className="w-full max-w-md mx-auto p-6 min-h-[calc(100vh-80px)] flex flex-col items-center">
        <h1 className="text-2xl font-semibold mb-6 text-center">Profile</h1>
        <AvatarUpload userId={user.id} avatarUrl={avatarUrl} onAvatarChange={handleAvatarChange} />
        <ProfileForm initialValues={initialValues} onSubmit={handleProfileUpdate} />
        <button
          onClick={signOut}
          className="w-full mt-6 py-3 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-lg transition-colors"
        >
          Sign Out
        </button>
        {saving && <div className="text-blue-600 text-sm mt-2">Saving...</div>}
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage; 