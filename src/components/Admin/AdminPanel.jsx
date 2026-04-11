import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from "../../firebase/config";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import AdminHeader from './AdminHeader';
import UsersTab from './UsersTab';
import MarkersTab from './MarkersTab';
import SubscriptionsTab from './SubscriptionsTab';
import ImagesTab from './ImagesTab';
import { Shield } from "lucide-react";
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecking, setAdminChecking] = useState(true);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate("/admin");
      return;
    }

    try {
      const adminUsersRef = collection(db, "adminUsers");
      const q = query(
        adminUsersRef,
        where("email", "==", user.email),
        where("active", "==", true)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setIsAdmin(true);
        fetchData();
      } else {
        await logout();
        navigate("/admin");
      }
    } catch (error) {
      console.error("Error checking admin access");
      await logout();
      navigate("/admin");
    }
    setAdminChecking(false);
  };

  const fetchData = async () => {
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, "user1"));
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);

      // Fetch markers
      const markersSnapshot = await getDocs(collection(db, "Markers"));
      const markersList = markersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMarkers(markersList);
      // Fetch images
      const imagesSnapshot = await getDocs(collection(db, "Images"));
      const imagesList = imagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setImages(imagesList);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate("/");
  };
 const pendingImagesCount = images.filter(img => img.status === 'pending').length;

  if (adminChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Verifying Admin Access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-gray-950 p-8 rounded-xl border border-red-800 text-center">
          <Shield className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-white text-xl mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">Admin privileges required.</p>
          <button
            onClick={() => navigate("/admin")}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        usersCount={users.length}
        markersCount={markers.length}
        imagesCount={images.length}
        pendingImagesCount={pendingImagesCount}
        onLogout={handleLogout}
        onRefresh={fetchData}
      />
      
      <div className="p-6">
        {activeTab === "users" && (
          <UsersTab 
            users={users} 
            loading={loading}
            onUsersUpdate={fetchData}
          />
        )}

        {activeTab === "markers" && (
          <MarkersTab 
            markers={markers}
            loading={loading}
            onMarkersUpdate={fetchData}
            currentUser={user}
          />
        )}

        {activeTab === "images" && (
          <ImagesTab 
            images={images}
            loading={loading}
            onImagesUpdate={fetchData}
          />
        )}

        {activeTab === "subscriptions" && (
          <SubscriptionsTab 
            users={users}
            onUsersUpdate={fetchData}
          />
        )}
      </div>
    </div>
  );
}
