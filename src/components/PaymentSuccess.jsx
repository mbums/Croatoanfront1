import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUser } from '../context/UserContext';
import { CheckCircle, Home, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);

  useEffect(() => {
    const activateSubscription = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const userId = searchParams.get('user_id');
        const planType = searchParams.get('plan_type');

        if (!userId || !planType) {
          throw new Error('Missing required parameters');
        }

        // Calculate subscription dates
        const now = new Date();
        let endDate = new Date();
        let amount = 0;
        let pointsToAdd = 0;

        // Set values based on plan type
        switch (planType) {
          case 'weekly':
            endDate.setDate(now.getDate() + 7);
            amount = 3.99;
            pointsToAdd = 10; // Weekly points
            break;
          case 'monthly':
            endDate.setDate(now.getDate() + 30);
            amount = 9.99;
            pointsToAdd = 25; // Monthly points
            break;
          case 'yearly':
            endDate.setDate(now.getDate() + 365);
            amount = 59.99;
            pointsToAdd = 50; // Yearly points
            break;
          default:
            endDate.setDate(now.getDate() + 30);
            amount = 9.99;
            pointsToAdd = 25;
        }

        // Get current user data to calculate new points
        const userRef = doc(db, "user1", userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const currentPoints = userData.points || 0;
        const newPoints = currentPoints + pointsToAdd;

        // Update user in Firebase with points and subscription data
        await updateDoc(userRef, {
          premium: true,
          status: 'Premium',
          subscriptionType: planType,
          subscriptionStart: now,
          subscriptionEnd: endDate,
          subscriptionAmount: amount,
          manualPremium: false,
          premiumReason: `Stripe ${planType} subscription`,
          points: newPoints,
          updatedAt: now
        });

        setSubscriptionData({
          planType,
          amount,
          startDate: now,
          endDate: endDate,
          pointsAdded: pointsToAdd,
          totalPoints: newPoints
        });

        toast.success(`🎉 ${planType.charAt(0).toUpperCase() + planType.slice(1)} subscription activated! +${pointsToAdd} points added!`);
        setLoading(false);

      } catch (error) {
        console.error('Error activating subscription:', error);
        toast.error('Error activating subscription. Please contact support.');
        setLoading(false);
      }
    };

    activateSubscription();
  }, [searchParams]);

  const getPlanName = (planType) => {
    const names = {
      weekly: 'Weekly',
      monthly: 'Monthly', 
      yearly: 'Yearly'
    };
    return names[planType] || 'Premium';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 text-center max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Activating Premium...</h2>
          <p className="text-gray-400">Please wait while we activate your subscription</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-green-500 max-w-md w-full">
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-800">
          <div className="flex justify-center mb-4">
            <div className="bg-green-500 rounded-full p-3">
              <CheckCircle size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-green-400 text-lg">Welcome to Premium</p>
        </div>

        {/* Subscription Details */}
        <div className="p-6 space-y-4">
          {subscriptionData && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-white text-lg">Subscription Details</h3>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Plan:</span>
                <span className="text-white font-medium">
                  {getPlanName(subscriptionData.planType)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-medium">
                  ${subscriptionData.amount}
                </span>
              </div>

              {/* Points Information */}
              <div className="flex justify-between">
                <span className="text-gray-400">Points Added:</span>
                <span className="text-green-400 font-medium">
                  +{subscriptionData.pointsAdded}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Total Points:</span>
                <span className="text-yellow-400 font-medium">
                  {subscriptionData.totalPoints}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Start Date:</span>
                <span className="text-white font-medium">
                  {formatDate(subscriptionData.startDate)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">End Date:</span>
                <span className="text-white font-medium">
                  {formatDate(subscriptionData.endDate)}
                </span>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">Premium Features Unlocked</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Access to all premium locations
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Unlimited location unlocks
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Priority support
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Early access to new features
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Bonus points with subscription
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Go to Home
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            Need help? Contact support at{" "}
            <a href="mailto:officialmbums@gmail.com" className="text-green-400 hover:underline">
              officialmbums@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}