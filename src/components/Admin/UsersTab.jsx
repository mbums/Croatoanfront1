import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from "../../firebase/config";
import { Edit3, Save, X, Crown, Search, Calendar, Gift, UserX, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersTab({ users, loading, onUsersUpdate }) {
  const [editingUserId, setEditingUserId] = useState(null);
  const [pointsInput, setPointsInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(null);
  const [userUnlocks, setUserUnlocks] = useState({}); // { userId: unlockedCount }

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Fetch unlocked markers count for each user
  useEffect(() => {
    const fetchUserUnlocks = async () => {
      const unlocksData = {};
      
      try {
        // Fetch all unlocks from Unlocks collection
        const unlocksRef = collection(db, "Unlocks");
        const unlocksSnapshot = await getDocs(unlocksRef);
        
        unlocksSnapshot.forEach((doc) => {
          const unlockData = doc.data();
          const userId = unlockData.userId;
          
          if (userId) {
            if (!unlocksData[userId]) {
              unlocksData[userId] = new Set();
            }
            
            // Add all markersUnlocked to the user's set
            if (unlockData.markersUnlocked && Array.isArray(unlockData.markersUnlocked)) {
              unlockData.markersUnlocked.forEach(markerId => {
                unlocksData[userId].add(markerId);
              });
            }
          }
        });
        
        // Convert Sets to counts
        const unlocksCount = {};
        Object.keys(unlocksData).forEach(userId => {
          unlocksCount[userId] = unlocksData[userId].size;
        });
        
        setUserUnlocks(unlocksCount);
      } catch (error) {
        console.error("Error fetching user unlocks:", error);
      }
    };

    if (users.length > 0) {
      fetchUserUnlocks();
    }
  }, [users]);

  const updateUserPoints = async (userId, newPoints, userEmail) => {
    try {
      await updateDoc(doc(db, "user1", userId), {
        points: parseInt(newPoints)
      });
      onUsersUpdate();
      setEditingUserId(null);
      setPointsInput('');
      toast.success(`Points updated for ${userEmail}`);
    } catch (error) {
      console.error("Error updating points:", error);
      toast.error('Error updating points');
    }
  };

  const togglePremium = async (userId, currentStatus, userEmail) => {
    try {
      const updates = {
        premium: !currentStatus,
        status: !currentStatus ? "Premium" : "Free",
      };
      
      if (!currentStatus) {
        const now = new Date();
        const endDate = new Date();
        endDate.setMonth(now.getMonth() + 1);
        
        updates.subscriptionType = "manual_admin";
        updates.subscriptionStart = now;
        updates.subscriptionEnd = endDate;
        updates.subscriptionAmount = 0;
        updates.manualPremium = true;
      } else {
        updates.subscriptionEnd = null;
        updates.manualPremium = false;
      }

      await updateDoc(doc(db, "user1", userId), updates);
      onUsersUpdate();
      toast.success(`${userEmail} is now ${!currentStatus ? 'Premium' : 'Free'}`);
    } catch (error) {
      console.error("Error updating premium status:", error);
      toast.error('Error updating user status');
    }
  };

  const toggleDeactivate = async (userId, currentStatus, userEmail) => {
    try {
      await updateDoc(doc(db, "user1", userId), {
        deactivated: !currentStatus
      });
      onUsersUpdate();
      toast.success(`${userEmail} ${!currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error("Error updating deactivation status:", error);
      toast.error('Error updating user status');
    }
  };

  const setCustomPremium = async (userId, userEmail, durationMonths) => {
    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(now.getMonth() + durationMonths);

      await updateDoc(doc(db, "user1", userId), {
        premium: true,
        status: "Premium",
        subscriptionType: "manual_admin",
        subscriptionStart: now,
        subscriptionEnd: endDate,
        subscriptionAmount: 0,
        manualPremium: true,
        premiumReason: "Admin manual assignment"
      });

      onUsersUpdate();
      setShowPremiumModal(null);
      toast.success(`${userEmail} made premium for ${durationMonths} month(s)`);
    } catch (error) {
      console.error("Error setting custom premium:", error);
      toast.error('Error setting premium');
    }
  };

  const startEditing = (user) => {
    setEditingUserId(user.id);
    setPointsInput(user.points || 0);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setPointsInput('');
  };

  // Get unlocked count for a user
  const getUnlockedCount = (userId) => {
    return userUnlocks[userId] || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="text-white">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <Search className="text-gray-400" size={20} />
          <h3 className="text-lg font-semibold text-white">Search Users</h3>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by email or name..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
          </div>
          <div className="text-gray-400 text-sm flex items-center">
            {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-white font-semibold text-lg">
                    {user.email}
                  </h3>
                  {user.premium && (
                    <div className="flex items-center gap-1">
                      <Crown className="text-yellow-500" size={16} />
                      <span className="text-yellow-500 text-sm">Premium</span>
                    </div>
                  )}
                  {user.deactivated && (
                    <div className="flex items-center gap-1">
                      <UserX className="text-red-500" size={16} />
                      <span className="text-red-500 text-sm">Deactivated</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div>
                    <p className="text-gray-400 text-sm">Points</p>
                    {editingUserId === user.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={pointsInput}
                          onChange={(e) => setPointsInput(e.target.value)}
                          className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                        />
                        <button
                          onClick={() => updateUserPoints(user.id, pointsInput, user.email)}
                          className="text-green-500 hover:text-green-400"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-red-500 hover:text-red-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-green-500 font-semibold">
                          {user.points || 0}
                        </p>
                        <button
                          onClick={() => startEditing(user)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className={`font-semibold ${
                      user.premium ? "text-green-500" : "text-yellow-500"
                    }`}>
                      {user.premium ? "Premium" : "Free"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Account</p>
                    <p className={`font-semibold ${
                      user.deactivated ? "text-red-500" : "text-green-500"
                    }`}>
                      {user.deactivated ? "Deactivated" : "Active"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Unlocked</p>
                    <p className="text-gray-300 text-sm">
                      {getUnlockedCount(user.id)} locations
                    </p>
                  </div>
                </div>

                {user.premium && user.subscriptionEnd && (
                  <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-blue-400" />
                      <span className="text-gray-300">
                        Premium until: {new Date(user.subscriptionEnd.seconds * 1000).toLocaleDateString()}
                      </span>
                      {user.manualPremium && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded ml-2">
                          Manual
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => toggleDeactivate(user.id, user.deactivated, user.email)}
                  className={`px-4 py-2 rounded text-sm flex items-center justify-center gap-2 ${
                    user.deactivated
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {user.deactivated ? <UserCheck size={14} /> : <UserX size={14} />}
                  {user.deactivated ? "Activate" : "Deactivate"}
                </button>
                
                <button
                  onClick={() => togglePremium(user.id, user.premium, user.email)}
                  className={`px-4 py-2 rounded text-sm ${
                    user.premium
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {user.premium ? "Remove Premium" : "Make Premium"}
                </button>
                
                {!user.premium && (
                  <button
                    onClick={() => setShowPremiumModal(user)}
                    className="px-4 py-2 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Gift size={14} />
                    Custom Premium
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              Set Custom Premium for {showPremiumModal.email}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 6, 12, 24, 99].map(months => (
                  <button
                    key={months}
                    onClick={() => setCustomPremium(showPremiumModal.id, showPremiumModal.email, months)}
                    className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
                  >
                    <div className="text-white font-semibold">{months}</div>
                    <div className="text-gray-400 text-xs">month{months > 1 ? 's' : ''}</div>
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowPremiumModal(null)}
                  className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
