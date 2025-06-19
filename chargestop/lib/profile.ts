import { supabase } from './supabase';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_url')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Error fetching user profile:', error.message);
    return null;
  }
  return data as UserProfile;
}

export async function updateUserProfile(userId: string, profileData: Partial<Omit<UserProfile, 'id'>>): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId)
    .select('id, name, email, avatar_url')
    .single();
  if (error) {
    console.error('Error updating user profile:', error.message);
    return null;
  }
  return data as UserProfile;
}

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  // Validate file type and size (max 2MB, png/jpg/jpeg)
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only PNG and JPEG are allowed.');
  }
  if (file.size > maxSize) {
    throw new Error('File is too large. Max size is 2MB.');
  }

  const filePath = `${userId}/avatar.png`;
  const { error: uploadError } = await supabase.storage
    .from('avatar-images')
    .upload(filePath, file, { upsert: false, contentType: file.type });
  if (uploadError) {
    console.error('Error uploading avatar:', uploadError.message);
    return null;
  }

  // Get public URL
  const { data } = supabase.storage.from('avatar-images').getPublicUrl(filePath);
  const publicUrl = data?.publicUrl || null;

  // Update the user's profile with the avatar URL if upload succeeded
  if (publicUrl) {
    await updateUserProfile(userId, { avatar_url: publicUrl });
  }

  return publicUrl;
} 