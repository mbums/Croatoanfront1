import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from "../../firebase/config";
import { Crown, Calendar, DollarSign, Zap, Trash2, Play, Pause } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionsTab({ users, onUsersUpdate }) {
  const [subscriptionData, setSubscriptionData] = useState({
    type: 'monthly',
    amount: 9.99,
    duration: 30
  });

  const manageSubscription = async (action, userId, currentStatus, userEmail) => {
    try {
      const now = new Date();
      let updates = {};

      if (action === 'activate') {
        const endDate = new Date();
        endDate.setDate(now.getDate() + subscriptionData.duration);
        
        updates = {
          premium: true,
          status: 'Premium',
          subscriptionType: subscriptionData.type,
          subscriptionStart: now,
          subscriptionEnd: endDate,
          subscriptionAmount: subscriptionData.amount
        };
        toast.success(`Premium activated for ${userEmail}`);
      } else if (action === 'deactivate') {
        updates = {
          premium: false,
          status: 'Free',
          subscriptionType: null,
          subscriptionEnd: null,
          subscriptionCanceledAt: now
        };
        toast.success(`Premium deactivated for ${userEmail}`);
      } else if (action === 'renew') {
        const endDate = new Date();
        endDate.setDate(now.getDate() + subscriptionData.duration);
        
        updates = {
          subscriptionEnd: endDate,
          subscriptionType: subscriptionData.type,
          subscriptionAmount: subscriptionData.amount,
          premium: true,
          status: 'Premium'
        };
        toast.success(`Subscription renewed for ${userEmail}`);
      } else if (action === 'pause') {
        updates = {
          premium: false,
          status: 'Paused',
          subscriptionPausedAt: now
        };
        toast.success(`Subscription paused for ${userEmail}`);
      } else if (action === 'resume') {
        const endDate = new Date();
        endDate.setDate(now.getDate() + subscriptionData.duration);
        
        updates = {
          premium: true,
          status: 'Premium',
          subscriptionEnd: endDate,
          subscriptionResumedAt: now
        };
        toast.success(`Subscription resumed for ${userEmail}`);
      }

      await updateDoc(doc(db, "user1", userId), updates);
      onUsersUpdate();
    } catch (error) {
      console.error("Error managing subscription:", error);
      toast.error('Error managing subscription');
    }
  };

  const subscriptionPlans = [
    { type: 'weekly', label: 'Weekly', amount: 3.99, duration: 7 },
    { type: 'monthly', label: 'Monthly', amount: 9.99, duration: 30 },
    { type: 'yearly', label: 'Yearly', amount: 59.99, duration: 365 }
  ];

  const getSubscriptionStatus = (user) => {
    if (!user.premium) return 'inactive';
    if (user.subscriptionEnd && new Date(user.subscriptionEnd.seconds * 1000) < new Date()) {
      return 'expired';
    }
    return 'active';
  };

  return (
    <div className="space-y-6">
      {/* Subscription Plans */}
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign size={20} />
          Subscription Plans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subscriptionPlans.map(plan => (
            <div key={plan.type} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">{plan.label}</h4>
                <span className="text-green-500 font-bold">${plan.amount}</span>
              </div>
              <p className="text-gray-400 text-sm">{plan.duration} days</p>
              <button
                onClick={() => {
                  setSubscriptionData(plan);
                  toast.success(`${plan.label} plan selected`);
                }}
                className={`w-full mt-3 py-2 rounded text-sm ${
                  subscriptionData.type === plan.type 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {subscriptionData.type === plan.type ? 'Selected' : 'Select'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Users List for Subscription Management */}
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Crown size={20} />
          Manage User Subscriptions
        </h3>
        
        <div className="grid gap-4">
          {users.map((user) => {
            const status = getSubscriptionStatus(user);
            const isExpired = status === 'expired';
            const isActive = status === 'active';
            
            return (
              <div key={user.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{user.email}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        isActive ? 'bg-green-900 text-green-300' : 
                        isExpired ? 'bg-red-900 text-red-300' : 
                        'bg-yellow-900 text-yellow-300'
                      }`}>
                        {isActive ? 'Premium' : isExpired ? 'Expired' : 'Free'}
                      </span>
                      {user.subscriptionType && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-900 text-blue-300">
                          {user.subscriptionType}
                        </span>
                      )}
                    </div>
                    
                    {user.premium && user.subscriptionEnd && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar size={14} />
                        {isExpired ? 'Expired: ' : 'Expires: '}
                        {new Date(user.subscriptionEnd.seconds * 1000).toLocaleDateString()}
                        {user.subscriptionAmount && ` • $${user.subscriptionAmount}`}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {!user.premium || isExpired ? (
                      <button
                        onClick={() => manageSubscription('activate', user.id, user.premium, user.email)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                      >
                        <Zap size={14} />
                        Activate Premium
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => manageSubscription('renew', user.id, user.premium, user.email)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                        >
                          <Zap size={14} />
                          Renew
                        </button>
                        <button
                          onClick={() => manageSubscription('deactivate', user.id, user.premium, user.email)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Deactivate
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Subscription Details */}
                {(user.subscriptionType || user.subscriptionAmount) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-900/50 p-3 rounded border border-gray-700">
                    {user.subscriptionType && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Plan</p>
                        <p className="text-gray-300 capitalize">{user.subscriptionType}</p>
                      </div>
                    )}
                    {user.subscriptionAmount && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Amount</p>
                        <p className="text-gray-300">${user.subscriptionAmount}</p>
                      </div>
                    )}
                    {user.subscriptionStart && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Start Date</p>
                        <p className="text-gray-300">
                          {new Date(user.subscriptionStart.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {user.subscriptionEnd && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1">End Date</p>
                        <p className="text-gray-300">
                          {new Date(user.subscriptionEnd.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}