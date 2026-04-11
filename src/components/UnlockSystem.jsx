import React, { useState, useEffect } from 'react';
import { GoogleMap, Circle, Marker, InfoWindow } from '@react-google-maps/api';
import { doc, updateDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUser } from '../context/UserContext';
import { Lock, Unlock, Target, Coins, X } from 'lucide-react';
import toast from 'react-hot-toast';

const UnlockSystem = () => {
  const { user } = useUser();
  const [circleCenter, setCircleCenter] = useState(null);
  const [circleRadius, setCircleRadius] = useState(5000); // 5km default
  const [isDrawing, setIsDrawing] = useState(false);
  const [premiumMarkers, setPremiumMarkers] = useState([]);
  const [unlockedMarkers, setUnlockedMarkers] = useState([]);
  const [markersInCircle, setMarkersInCircle] = useState([]);
  const [showUnlockPreview, setShowUnlockPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load premium markers and user's unlocked markers
  useEffect(() => {
    loadMarkers();
  }, []);

  const loadMarkers = async () => {
    try {
      // Load premium markers
      const markersSnapshot = await getDocs(collection(db, "Markers"));
      const premium = markersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(marker => marker.premium);
      
      setPremiumMarkers(premium);

      // Load user's unlocked markers
      if (user?.unlockedMarkers) {
        setUnlockedMarkers(user.unlockedMarkers);
      }

    } catch (error) {
      console.error("Error loading markers:", error);
      toast.error('Error loading locations');
    } finally {
      setLoading(false);
    }
  };

  // Calculate markers inside circle
  const calculateMarkersInCircle = (center, radius) => {
    const earthRadius = 6371000; // meters
    
    const markersInside = premiumMarkers.filter(marker => {
      // Haversine formula to calculate distance
      const lat1 = center.lat * Math.PI / 180;
      const lat2 = marker.lat * Math.PI / 180;
      const deltaLat = (marker.lat - center.lat) * Math.PI / 180;
      const deltaLng = (marker.lng - center.lng) * Math.PI / 180;

      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = earthRadius * c;

      return distance <= radius && !unlockedMarkers.includes(marker.id);
    });

    return markersInside;
  };

  const handleMapClick = (event) => {
    if (!isDrawing) return;

    const clickedLat = event.latLng.lat();
    const clickedLng = event.latLng.lng();
    
    setCircleCenter({ lat: clickedLat, lng: clickedLng });
    
    // Calculate markers in the circle
    const markersInside = calculateMarkersInCircle(
      { lat: clickedLat, lng: clickedLng }, 
      circleRadius
    );
    
    setMarkersInCircle(markersInside);
    setShowUnlockPreview(true);
  };

  const startDrawing = () => {
    if (!user) {
      toast.error('Please login to unlock locations');
      return;
    }
    setIsDrawing(true);
    toast.success('Click on map to place unlock circle');
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setCircleCenter(null);
    setShowUnlockPreview(false);
  };

  const unlockMarkers = async () => {
    if (!user || markersInCircle.length === 0) return;

    const pointsPerMarker = 10;
    const totalCost = markersInCircle.length * pointsPerMarker;
    const userPoints = user.points || 0;

    // Check if user has enough points
    if (userPoints < totalCost) {
      const affordableCount = Math.floor(userPoints / pointsPerMarker);
      if (affordableCount === 0) {
        toast.error('Not enough points to unlock any locations');
        return;
      }
      
      // Only unlock what they can afford
      const affordableMarkers = markersInCircle.slice(0, affordableCount);
      const affordableCost = affordableMarkers.length * pointsPerMarker;
      
      await processUnlock(affordableMarkers, affordableCost);
    } else {
      await processUnlock(markersInCircle, totalCost);
    }
  };

  const processUnlock = async (markersToUnlock, cost) => {
    try {
      // Create unlock record
      await addDoc(collection(db, "unlocks"), {
        userId: user.uid,
        userEmail: user.email,
        centerLat: circleCenter.lat,
        centerLng: circleCenter.lng,
        radius: circleRadius,
        pointsSpent: cost,
        markersUnlocked: markersToUnlock.map(m => m.id),
        unlockedAt: new Date(),
        expires: null // forever
      });

      // Update user points and unlocked markers
      const newPoints = (user.points || 0) - cost;
      const newUnlockedMarkers = [...unlockedMarkers, ...markersToUnlock.map(m => m.id)];

      await updateDoc(doc(db, "user1", user.uid), {
        points: newPoints,
        unlockedMarkers: newUnlockedMarkers,
        totalPointsSpent: (user.totalPointsSpent || 0) + cost,
        lastUnlockAt: new Date()
      });

      // Update local state
      setUnlockedMarkers(newUnlockedMarkers);
      setMarkersInCircle([]);
      setShowUnlockPreview(false);
      setIsDrawing(false);
      setCircleCenter(null);

      toast.success(`Unlocked ${markersToUnlock.length} locations for ${cost} points! 🎉`);

    } catch (error) {
      console.error("Error unlocking markers:", error);
      toast.error('Error unlocking locations');
    }
  };

  const circleOptions = {
    fillColor: isDrawing ? "#10B981" : "#EF4444",
    fillOpacity: 0.2,
    strokeColor: isDrawing ? "#10B981" : "#EF4444",
    strokeOpacity: 0.8,
    strokeWeight: 2,
  };

  if (loading) {
    return <div className="text-white">Loading unlock system...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Unlock Controls */}
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Unlock size={20} />
              Unlock Premium Locations
            </h3>
            <p className="text-gray-400 text-sm">
              Draw a circle to discover and unlock premium locations
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-gray-400 text-sm">Your Points</div>
              <div className="text-green-500 font-semibold flex items-center gap-1">
                <Coins size={16} />
                {user?.points || 0}
              </div>
            </div>
            
            {!isDrawing ? (
              <button
                onClick={startDrawing}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Target size={16} />
                Draw Circle
              </button>
            ) : (
              <button
                onClick={cancelDrawing}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <X size={16} />
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Radius Control */}
        {isDrawing && (
          <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
            <label className="text-gray-300 text-sm mb-2 block">
              Circle Radius: {circleRadius / 1000} km
            </label>
            <input
              type="range"
              min="1000"
              max="20000"
              step="1000"
              value={circleRadius}
              onChange={(e) => setCircleRadius(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-gray-400 text-xs mt-1">
              <span>1km</span>
              <span>20km</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative h-96 bg-gray-800 rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ lat: 44.3, lng: -69.8 }}
          zoom={7}
          onClick={handleMapClick}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
          }}
        >
          {/* Premium Markers */}
          {premiumMarkers.map(marker => (
            <Marker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              icon={{
                url: unlockedMarkers.includes(marker.id) 
                  ? "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                      <circle cx="15" cy="15" r="12" fill="#10B981" />
                      <text x="15" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="white">✓</text>
                    </svg>
                  `)
                  : "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                      <circle cx="15" cy="15" r="12" fill="#EF4444" />
                      <text x="15" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="white">🔒</text>
                    </svg>
                  `),
                scaledSize: new window.google.maps.Size(30, 30),
              }}
            />
          ))}

          {/* Unlock Circle */}
          {circleCenter && (
            <Circle
              center={circleCenter}
              radius={circleRadius}
              options={circleOptions}
            />
          )}
        </GoogleMap>

        {/* Drawing Instructions */}
        {isDrawing && !circleCenter && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target size={20} className="text-green-500" />
              <span className="font-semibold">Click on map to place circle</span>
            </div>
            <p className="text-sm text-gray-300">
              Click anywhere on the map to place your unlock circle
            </p>
          </div>
        )}
      </div>

      {showUnlockPreview && (
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-white">
              Unlock Preview
            </h4>
            <div className="text-green-500 font-semibold">
              Cost: {markersInCircle.length * 10} points
            </div>
          </div>

          {markersInCircle.length > 0 ? (
            <div>
              <p className="text-gray-400 mb-3">
                Found {markersInCircle.length} premium locations in this area
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {markersInCircle.slice(0, 6).map(marker => (
                  <div key={marker.id} className="bg-gray-800 p-3 rounded border border-gray-700">
                    <div className="font-semibold text-white">{marker.name}</div>
                    <div className="text-gray-400 text-sm">{marker.type}</div>
                  </div>
                ))}
                {markersInCircle.length > 6 && (
                  <div className="bg-gray-800 p-3 rounded border border-gray-700 text-center">
                    <div className="text-gray-400">
                      +{markersInCircle.length - 6} more locations
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={unlockMarkers}
                  disabled={(user?.points || 0) < 10}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-semibold transition-colors"
                >
                  Unlock {markersInCircle.length} Locations
                </button>
                <button
                  onClick={cancelDrawing}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>

              {(user?.points || 0) < markersInCircle.length * 10 && (
                <div className="mt-2 text-yellow-500 text-sm">
                  💡 You can only afford {Math.floor((user?.points || 0) / 10)} locations
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Lock size={32} className="text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400">No new premium locations found in this area</p>
              <button
                onClick={cancelDrawing}
                className="mt-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Try Another Area
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnlockSystem;