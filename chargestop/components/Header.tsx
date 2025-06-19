import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, signOut, isLoading } = useAuth();

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #eee' }}>
      <nav style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/">Home</Link>
        <Link href="/profile">Profile</Link>
        <Link href="/chargers">Chargers</Link>
        {/* Add more links as needed */}
      </nav>
      <div>
        {isLoading ? null : user ? (
          <button onClick={signOut} style={{ padding: '0.5rem 1rem' }}>Sign Out</button>
        ) : (
          <>
            <Link href="/auth/login" style={{ marginRight: 12 }}>Login</Link>
            <Link href="/auth/signup">Sign Up</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header; 