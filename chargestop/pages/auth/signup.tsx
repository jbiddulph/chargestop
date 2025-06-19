import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SignupPage = () => {
  const { signUp, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signUp(email, password);
      setSuccess(true);
      // TODO: Redirect to login or home page
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-8 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-6">Sign Up</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="w-full">
          <label htmlFor="email" className="font-medium">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-full">
          <label htmlFor="password" className="font-medium">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-md bg-blue-600 text-white font-semibold text-lg mt-2 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          {isLoading ? 'Signing up...' : 'Sign Up'}
        </button>
        {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
        {success && <div className="text-green-600 text-sm mt-1">Signup successful! Please check your email to confirm your account.</div>}
      </form>
      <div className="mt-6 text-center">
        <a href="/auth/login" className="text-blue-600 hover:underline">Already have an account? Login</a>
      </div>
    </div>
  );
};

export default SignupPage; 