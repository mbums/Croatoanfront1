import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useStripe } from '../context/StripeContext';
import { Crown, Zap, Star, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const subscriptionPlans = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: 3.99,
    duration: '7 days',
    features: ['Get 10 points on every week', 'Basic support'],
    popular: false
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 9.99,
    duration: '30 days',
    features: ['Get 25 points on every week', 'Priority support', 'Early access to new features'],
    popular: true
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 59.99,
    duration: '365 days',
    features: ['Get 50 points on every week', 'Priority support', 'Early access to new features', 'Save 50% compared to monthly'],
    popular: false
  }
];

export default function StripeCheckout({ onClose }) {
  const { user } = useUser();
  const { updateUserSubscription, loading } = useStripe();
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const handleSubscription = async (planId) => {
    if (!user) {
      toast.error('Please login to purchase subscription');
      return;
    }
  
    const plan = subscriptionPlans.find(p => p.id === planId);
    
    try {
      const priceId = getPriceId(planId);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          customerEmail: user.email,
          userId: user.uid,
          planType: planId
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error details:', errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
  
      const session = await response.json();
  
      if (!session.url) {
        throw new Error('No checkout URL received');
      }
  
      // Redirect to Stripe Checkout
      window.location.href = session.url;
  
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to initiate payment');
    }
  };
  
  const getPriceId = (planId) => {
    const priceIds = {
      weekly: process.env.REACT_APP_STRIPE_WEEKLY_PRICE_ID,
      monthly: process.env.REACT_APP_STRIPE_MONTHLY_PRICE_ID,
      yearly: process.env.REACT_APP_STRIPE_YEARLY_PRICE_ID
    };
    
    return priceIds[planId];
  };

  const calculateSavings = (plan) => {
    if (plan.id === 'yearly') {
      const monthlyCost = 9.99 * 12;
      const yearlyCost = 59.99;
      return Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100);
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 z-[99999]">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Crown className="text-yellow-400" size={32} />
              <div>
                <h2 className="text-2xl font-bold text-white">Upgrade to Premium</h2>
                <p className="text-purple-200">Unlock all premium locations and features</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {subscriptionPlans.map((plan) => {
              const savings = calculateSavings(plan);
              
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border-2 p-6 transition-all duration-200 hover:scale-105 ${
                    plan.popular
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-700 bg-gray-800/50'
                  } ${selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-[100%] text-center">
                      <span className="bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  {savings > 0 && (
                    <div className="absolute -top-2 -right-2 w-[100%] text-center">
                      <span className="bg-green-500 text-green-900 px-2 py-1 rounded-full text-xs font-bold">
                        SAVE {savings}%
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-3xl font-bold text-white">${plan.price}</span>
                      <span className="text-gray-400">/{plan.duration.split(' ')[1]}</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{plan.duration}</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-gray-300">
                        <Check size={16} className="text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscription(plan.id)}
                    disabled={loading}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                      plan.popular
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? 'Processing...' : `Subscribe - $${plan.price}`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Features Comparison */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap size={20} className="text-yellow-500" />
              Premium Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 text-gray-300">
                <Star size={16} className="text-yellow-500 flex-shrink-0" />
                <span>Access to all premium abandoned locations</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Star size={16} className="text-yellow-500 flex-shrink-0" />
                <span>Unlock locations without spending points</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Star size={16} className="text-yellow-500 flex-shrink-0" />
                <span>Priority support and feature requests</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Star size={16} className="text-yellow-500 flex-shrink-0" />
                <span>Early access to new locations and features</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              🔒 Secure payment powered by Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}