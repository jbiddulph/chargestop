import { useRef, useState, useEffect } from 'react';
import { uploadAvatar } from '../lib/profile';

interface AvatarUploadProps {
  userId: string;
  avatarUrl?: string;
  onAvatarChange?: (url: string | null) => void;
}

const AvatarUpload = ({ userId, avatarUrl, onAvatarChange }: AvatarUploadProps) => {
  const [preview, setPreview] = useState<string | undefined>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview if avatarUrl prop changes (for persistence)
  useEffect(() => {
    setPreview(avatarUrl);
  }, [avatarUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Upload
      const url = await uploadAvatar(userId, file);
      setUploading(false);
      if (onAvatarChange) onAvatarChange(url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar.');
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    if (onAvatarChange) onAvatarChange(null);
    // Optionally: remove from Supabase and update profile
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 mb-2 flex items-center justify-center">
        <img
          src={preview || '/default-avatar.png'}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      </div>
      <label
        htmlFor="avatar-upload"
        className={`bg-gray-100 text-gray-800 px-5 py-2 rounded-md border border-gray-300 font-medium text-base cursor-pointer transition-colors ${uploading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-200'}`}
      >
        {uploading ? 'Uploading...' : 'Change Avatar'}
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
      </label>
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </div>
  );
};

export default AvatarUpload; 