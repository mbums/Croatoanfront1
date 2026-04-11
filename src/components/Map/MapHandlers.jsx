import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { fetchMarkers, fetchAllMarkers, addCommentToMarker } from "./markersData";
import toast from "react-hot-toast";

export const useMapHandlers = (user, setUserUnlockedMarkers, setMarkers, setSelected) => {
  const fetchUserUnlocks = async (userId) => {
    try {
      const unlocksRef = collection(db, "Unlocks");
      const q = query(unlocksRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      const unlockedMarkerIds = [];
      querySnapshot.forEach((doc) => {
        const unlockData = doc.data();
        if (unlockData.markersUnlocked && unlockData.userId === userId) {
          unlockedMarkerIds.push(...unlockData.markersUnlocked);
        }
      });

      return unlockedMarkerIds;
    } catch (error) {
      console.error('Error fetching user unlocks:', error);
      return [];
    }
  };

  const loadMarkers = async () => {
    try {
      let unlockedIds = [];
      if (user) {
        unlockedIds = await fetchUserUnlocks(user.uid);
        setUserUnlockedMarkers(unlockedIds);
      }

      const markersData = await fetchMarkers(user, unlockedIds);
      setMarkers(markersData);
    } catch (error) {
      console.error('Error loading markers:', error);
      toast.error('Failed to load locations');
    }
  };

  const calculateMarkersInCircle = async (center, radius) => {
    const earthRadius = 6371000;

    try {
      const allMarkers = await fetchAllMarkers();
      const unlockedIds = user ? await fetchUserUnlocks(user.uid) : [];
      const premiumMarkersToUnlock = allMarkers.filter(marker =>
        marker.is_premium && !unlockedIds.includes(marker.id)
      );

      const markersInside = premiumMarkersToUnlock.filter(marker => {
        const lat1 = center.lat * Math.PI / 180;
        const lat2 = marker.lat * Math.PI / 180;
        const deltaLat = (marker.lat - center.lat) * Math.PI / 180;
        const deltaLng = (marker.lng - center.lng) * Math.PI / 180;

        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadius * c;

        return distance <= radius;
      });

      return markersInside;
    } catch (error) {
      console.error('Error calculating markers in circle:', error);
      return [];
    }
  };

  const unlockMarkers = async (markersInCircle, circleCenter, circleRadius, userUnlockedMarkers) => {
    if (!user || markersInCircle.length === 0) return;

    const pointsPerMarker = 10;
    const totalCost = markersInCircle.length * pointsPerMarker;

    try {
      const unlockData = {
        userId: user.uid,
        userEmail: user.email,
        centerLat: circleCenter.lat,
        centerLng: circleCenter.lng,
        radius: circleRadius,
        markersUnlocked: markersInCircle.map(marker => marker.id),
        pointsSpent: totalCost,
        unlockedAt: new Date().toISOString(),
        expires: null
      };

      await addDoc(collection(db, "Unlocks"), unlockData);

      const newUnlockedIds = markersInCircle.map(marker => marker.id);
      setUserUnlockedMarkers(prev => [...prev, ...newUnlockedIds]);

      const updatedMarkers = await fetchMarkers(user, [...userUnlockedMarkers, ...newUnlockedIds]);
      setMarkers(updatedMarkers);

      toast.success(`Unlocked ${markersInCircle.length} locations for ${totalCost} points!`);
      return true;
    } catch (error) {
      console.error('Error unlocking markers:', error);
      toast.error('Failed to unlock locations');
      return false;
    }
  };

  const handleAddComment = async (selected, markers, newComment, user, setMarkers, setSelected, setNewComment) => {
    if (!newComment.trim()) return;

    try {
      await addCommentToMarker(selected.id, newComment, user.uid);

      const updatedMarkers = markers.map(marker => {
        if (marker.id === selected.id) {
          return {
            ...marker,
            comments: [
              ...marker.comments,
              {
                user: user.name || 'You',
                text: newComment,
                date: new Date().toISOString().split('T')[0]
              }
            ]
          };
        }
        return marker;
      });

      setMarkers(updatedMarkers);
      setSelected(updatedMarkers.find(m => m.id === selected.id));
      toast.success('Comment added successfully!');
      setNewComment("");
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  return {
    fetchUserUnlocks,
    loadMarkers,
    calculateMarkersInCircle,
    unlockMarkers,
    handleAddComment
  };
};