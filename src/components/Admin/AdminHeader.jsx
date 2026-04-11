import React, { useState } from 'react';
import { Users, MapPin, CreditCard, Settings, LogOut, Key, Image } from 'lucide-react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';


export default function AdminHeader({ 
  activeTab, 
  setActiveTab, 
  usersCount, 
  markersCount, 
  imagesCount,
  pendingImagesCount,
  onLogout,
  onRefresh 
}) {
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, count: usersCount },
    { id: 'markers', label: 'Markers', icon: MapPin, count: markersCount },
    { id: 'images', label: 'Images', icon: Image, count: imagesCount, badge: pendingImagesCount },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, count: '' }
  ];

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      
      if (!user || !user.email) {
        toast.error("No user found");
        setLoading(false);
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      
      await reauthenticateWithCredential(user, credential);
      
      await updatePassword(user, passwordData.newPassword);
      
      toast.success("Password successfully changed!");
      setShowPasswordPopup(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        toast.error("Current password is incorrect");
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error("Please login again to change password");
      } else {
        toast.error("Error changing password");
      }
    }
    
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetPasswordForm = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordPopup(false);
  };

  return (
    <>
      <div className="bg-gray-950 border-b border-gray-800 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Settings className="text-green-500" size={32} />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-400">Manage users and locations</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPasswordPopup(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Key size={18} />
              Change Password
            </button>
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        <div className="flex mt-6 border-b border-gray-800 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-green-500 text-green-500"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <Icon size={20} />
                {tab.label} {tab.count && `(${tab.count})`}
                 {/* Pending Badge */}
              {tab.badge > 0 && (
                <span className="absolute top-[0.2rem] -right-1 bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
              </button>
            );
          })}
        </div>
      </div>

      {showPasswordPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <Key className="text-green-500" size={24} />
              <h2 className="text-xl font-bold text-white">Change Admin Password</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
              <button
                onClick={resetPasswordForm}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
