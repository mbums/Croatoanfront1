import React, { createContext, useState, useContext } from 'react';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const StripeContext = createContext();

export function StripeProvider({ children }) {
  const [loading, setLoading] = useState(false);

  const updateUserSubscription = async (userId, subscriptionData) => {
    try {
      const userRef = doc(db, "user1", userId);
      const now = new Date();
      let endDate = new Date();

      // Calculate end date based on subscription type
      switch (subscriptionData.type) {
        case 'weekly':
          endDate.setDate(now.getDate() + 7);
          break;
        case 'monthly':
          endDate.setDate(now.getDate() + 30);
          break;
        case 'yearly':
          endDate.setDate(now.getDate() + 365);
          break;
        default:
          endDate.setDate(now.getDate() + 30);
      }

      await updateDoc(userRef, {
        premium: true,
        status: 'Premium',
        subscriptionType: subscriptionData.type,
        subscriptionStart: now,
        subscriptionEnd: endDate,
        subscriptionAmount: subscriptionData.amount,
        stripeSubscriptionId: subscriptionData.subscriptionId
      });

      // Add to subscription history
      await addDoc(collection(db, "subscriptionHistory"), {
        userId: userId,
        type: subscriptionData.type,
        amount: subscriptionData.amount,
        startDate: now,
        endDate: endDate,
        status: 'active',
        createdAt: now
      });

      return true;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  };

  const value = {
    loading,
    setLoading,
    updateUserSubscription
  };

  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  );
}

export function useStripe() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}