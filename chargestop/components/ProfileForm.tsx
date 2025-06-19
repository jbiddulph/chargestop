import { useState } from 'react';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type ProfileFormProps = {
  initialValues: ProfileFormValues;
  onSubmit: (values: ProfileFormValues) => Promise<void> | void;
};

const ProfileForm = ({ initialValues, onSubmit }: ProfileFormProps) => {
  const [values, setValues] = useState<ProfileFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Validate on change
    try {
      profileSchema.pick({ [name]: true } as any).parse({ [name]: value });
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [name]: err.errors?.[0]?.message || 'Invalid' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const parsed = profileSchema.parse(values);
      await onSubmit(parsed);
      setSuccess(true);
    } catch (err: any) {
      if (err.errors) {
        // Zod validation errors
        const fieldErrors: any = {};
        err.errors.forEach((e: any) => {
          if (e.path && e.path[0]) fieldErrors[e.path[0]] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        setFormError('An unexpected error occurred.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center gap-6 max-w-md w-full mx-auto bg-white p-8 rounded-xl shadow-md"
    >
      <div className="w-full">
        <label htmlFor="name" className="font-medium">Full Name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.name && <span className="text-red-600 text-xs mt-1 block">{errors.name}</span>}
      </div>
      <div className="w-full">
        <label htmlFor="email" className="font-medium">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-md bg-blue-600 text-white font-semibold text-lg mt-2 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-700"
      >
        {submitting ? 'Saving...' : 'Save Changes'}
      </button>
      {formError && <div className="text-red-600 text-sm mt-2">{formError}</div>}
      {success && <div className="text-green-600 text-sm mt-2">Profile updated successfully!</div>}
    </form>
  );
};

export default ProfileForm; 