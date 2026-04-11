import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Shield, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checkIfAdminUser = async (userEmail) => {
    try {
      const adminUsersRef = collection(db, 'adminUsers');
      const q = query(
        adminUsersRef,
        where('email', '==', userEmail),
        where('active', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking admin user:', error);
      return false;
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const isAdmin = await checkIfAdminUser(user.email);

      if (!isAdmin) {
        await auth.signOut();
        toast.error('Access denied. Admin privileges required.');
        return;
      }

      toast.success('Admin login successful!');
      navigate('/admin/dashboard');

    } catch (error) {
      console.error('Admin login error:', error);
      if (error.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Try again later.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const goToMainApp = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-950 border border-gray-800 rounded-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-r from-red-600 to-red-800 p-3 rounded-full mb-4">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">Croatoan Admin Portal</h1>
          <p className="text-gray-400 text-center mt-2">Admin Authenticated Access</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Admin Email</label>
            <input
              type="email"
              placeholder="Enter admin email"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              'Authenticating...'
            ) : (
              <>
                <LogIn size={18} />
                Admin Login
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-gray-900 border border-gray-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-400 text-xs">
              Admin access required.
              If you are not an authorized administrator, please return to the main site.
            </p>
          </div>
        </div>

        {/* Back to Main App */}
        <div className="mt-6 text-center">
          <button
            onClick={goToMainApp}
            className="text-gray-400 hover:text-white text-sm underline"
          >
            ← Back to Main Application
          </button>
        </div>
      </div>
    </div>
  );
}