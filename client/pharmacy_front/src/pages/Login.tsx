import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "@/lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      const role = data?.user?.role;
      if (role === "pharmacy" || role === "PHARMACIST") {
        navigate("/pharmacy");
      } else {
        alert("Account is not a pharmacist");
      }
    } catch (err: any) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded bg-white p-6 shadow">
        <h1 className="text-xl font-bold">Pharmacy Login</h1>
        <input className="w-full rounded border p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="w-full rounded border p-2" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full rounded bg-blue-600 p-2 text-white" disabled={loading}>{loading ? 'Logging...' : 'Login'}</button>
      </form>
    </div>
  );
}
