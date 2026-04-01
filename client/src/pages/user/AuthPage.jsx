import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserApp } from '@/contexts/UserAppContext';
import { adminLogin } from '@/services/admin-auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart } from 'lucide-react';
const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const { login, register } = useUserApp();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (isLogin) {
            const ok = await login(email, password);
            if (ok) {
                navigate('/user');
            }
            else {
                // Fallback: try admin login so admins don't need a separate login URL
                try {
                    const adminData = await adminLogin(email, password);
                    if (adminData?.admin || adminData?.token) {
                        const role = adminData?.admin?.role;
                        if (role === "superadmin")
                            navigate("/admin/dashboard");
                        else
                            navigate("/center-admin"); // "admin" role → center admin portal
                        return;
                    }
                }
                catch {
                    // not an admin account — fall through to show error
                }
                setError('Invalid email or password');
            }
        }
        else {
            if (!fullName || !phone || !email || !password) {
                setError('All fields are required');
                return;
            }
            const ok = await register({ fullName, phone, email, password });
            if (ok)
                navigate('/user');
            else
                setError('Email already registered');
        }
    };
    return (<div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl medical-gradient mb-4">
            <Heart className="w-7 h-7 text-primary-foreground"/>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">MediCare</h1>
          <p className="text-sm text-muted-foreground mt-1">Your health, our priority</p>
        </div>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-xl">{isLogin ? 'Welcome back' : 'Create account'}</CardTitle>
            <CardDescription>{isLogin ? 'Sign in to your account' : 'Register as a new patient'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (<>
                  <Input placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)}/>
                  <Input placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)}/>
                </>)}
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}/>
              <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}/>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">{isLogin ? 'Sign In' : 'Create Account'}</Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button className="text-primary font-medium hover:underline" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                {isLogin ? 'Register' : 'Sign In'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>);
};
export default AuthPage;
