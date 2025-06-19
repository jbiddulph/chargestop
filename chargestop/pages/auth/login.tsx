import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

const LoginPage = () => {
  const { signIn, isLoading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/profile');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await signIn(email, password);
      // Redirect will happen automatically when user is set
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div
      style={{
        maxWidth: 400,
        width: '100%',
        margin: '2rem auto',
        padding: '2rem 1.5rem',
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      }}
      className="responsive-auth-form"
    >
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ width: '100%' }}>
          <label htmlFor="email" style={{ fontWeight: 500 }}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.7rem', borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }}
            autoComplete="email"
          />
        </div>
        <div style={{ width: '100%' }}>
          <label htmlFor="password" style={{ fontWeight: 500 }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.7rem', borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }}
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.9rem',
            borderRadius: 6,
            background: '#0070f3',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            marginTop: 8,
          }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 8, fontSize: 14 }}>{error}</div>}
      </form>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <a href="/auth/signup">Don't have an account? Sign up</a>
      </div>
      <div style={{ marginTop: 8, textAlign: 'center' }}>
        <a href="/auth/reset-password">Forgot password?</a>
      </div>
      <style>{`
        @media (max-width: 600px) {
          .responsive-auth-form {
            padding: 1rem 0.5rem !important;
            max-width: 100vw !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .responsive-auth-form input {
            font-size: 1rem !important;
            padding: 0.6rem !important;
          }
          .responsive-auth-form button {
            font-size: 1rem !important;
            padding: 0.7rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage; 