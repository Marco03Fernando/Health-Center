import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { usePharmacyAuth } from '@/contexts/PharmacyAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';

export default function PharmacyLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = usePharmacyAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to='/pharmacy' replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await login(email, password);
      if (!ok) {
        setError('Only pharmacist accounts can access this portal.');
        return;
      }
      navigate('/pharmacy', { replace: true });
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md shadow-lg'>
        <CardHeader className='text-center space-y-3'>
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10'>
            <Heart className='h-7 w-7 text-primary' />
          </div>
          <CardTitle className='text-2xl font-bold'>Pharmacy Portal</CardTitle>
          <CardDescription>Sign in to manage medications and orders</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' type='email' placeholder='pharmacist@healthcenter.com'
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input id='password' type='password' placeholder='••••••••'
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            {error && <p className='text-sm text-center text-destructive'>{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
