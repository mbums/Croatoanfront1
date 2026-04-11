import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../../context/UserContext";
import Login from "../../components/Login";
import MapSidebar from "./MapSidebar";
import MapControls from "./MapControls";
import UnlockPreview from "./UnlockPreview";
import {
  containerStyle,
  center,
  mapOptions,
  fetchMarkers,
  fetchAllMarkers,
  // addCommentToMarker,
  getMarkerWithComments,
} from "./markersData";
import toast from "react-hot-toast";
import AddLocationModal from "./AddLocationModal";
import StripeCheckout from "../StripeCheckout";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  Circle,
  useJsApiLoader,
} from "@react-google-maps/api";
import LocationInfoWindow from "./LocationInfoWindow";

export default function MainMap() {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [selected, setSelected] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [markers, setMarkers] = useState([]);
  const [userUnlockedMarkers, setUserUnlockedMarkers] = useState([]);
  const { user, loading: userLoading } = useUser();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [circleCenter, setCircleCenter] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [markersInCircle, setMarkersInCircle] = useState([]);
  const [showUnlockPreview, setShowUnlockPreview] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [circleRadius] = useState(30000);
  const [showCheckout, setShowCheckout] = useState(false);
  const [mapClickForCoordinates, setMapClickForCoordinates] = useState(false);
  const [showMapClickOverlay, setShowMapClickOverlay] = useState(false);

  const mapRef = useRef();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyAhxyJTODlgtLM2AZuiBG8mkT9DZdYOJs0",
  });

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
      console.error("Error fetching user unlocks:", error);
      return [];
    }
  };

  useEffect(() => {
    loadMarkers();

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [user]);

  const handleAddLocation = () => {
    if (!user) {
      toast.error("Please login to add locations");
      return;
    }
    setIsAddModalOpen(true);
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
      console.error("Error loading markers:", error);
      toast.error("Failed to load locations");
    }
  };
  

  const unlockMarkers = async () => {
    if (!user || markersInCircle.length === 0) return;

    const pointsPerMarker = 10;
    const totalCost = markersInCircle.length * pointsPerMarker;

    try {
      const userDocRef = doc(db, "user1", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        toast.error("User data not found");
        return;
      }

      const userData = userDoc.data();
      const currentPoints = userData.points || 0;

      if (currentPoints < totalCost) {
        toast.error(
          `Insufficient points. You need ${totalCost} points but have only ${currentPoints}`
        );
        return;
      }

      await updateDoc(userDocRef, {
        points: currentPoints - totalCost,
      });

      const unlockData = {
        userId: user.uid,
        userEmail: user.email,
        centerLat: circleCenter.lat,
        centerLng: circleCenter.lng,
        radius: circleRadius,
        markersUnlocked: markersInCircle.map((marker) => marker.id),
        pointsSpent: totalCost,
        unlockedAt: new Date().toISOString(),
        expires: null,
      };

      await addDoc(collection(db, "Unlocks"), unlockData);

      const newUnlockedIds = markersInCircle.map((marker) => marker.id);
      setUserUnlockedMarkers((prev) => [...prev, ...newUnlockedIds]);

      const updatedMarkers = await fetchMarkers(user, [
        ...userUnlockedMarkers,
        ...newUnlockedIds,
      ]);
      setMarkers(updatedMarkers);

      toast.success(
        `Unlocked ${markersInCircle.length} locations for ${totalCost} points!`
      );

      setIsDrawing(false);
      setCircleCenter(null);
      setShowUnlockPreview(false);
      setMarkersInCircle([]);
    } catch (error) {
      console.error("Error unlocking markers:", error);
      toast.error("Failed to unlock locations");
    }
  };

  const handleLocationAdded = () => {
    loadMarkers();
  };

  const calculateMarkersInCircle = async (center, radius) => {
    const earthRadius = 6371000;

    try {
      const allMarkers = await fetchAllMarkers();
      const unlockedIds = user ? await fetchUserUnlocks(user.uid) : [];

      const premiumMarkersToUnlock = allMarkers.filter(
        (marker) => marker.is_premium && !unlockedIds.includes(marker.id)
      );

      const markersInside = premiumMarkersToUnlock.filter((marker) => {
        const lat1 = (center.lat * Math.PI) / 180;
        const lat2 = (marker.lat * Math.PI) / 180;
        const deltaLat = ((marker.lat - center.lat) * Math.PI) / 180;
        const deltaLng = ((marker.lng - center.lng) * Math.PI) / 180;

        const a =
          Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(deltaLng / 2) *
            Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadius * c;

        return distance <= radius;
      });

      return markersInside;
    } catch (error) {
      console.error("Error calculating markers in circle:", error);
      return [];
    }
  };

 
const handleMapClick = async (event) => {
  if (selected && !isDrawing) {
      setSelected(null);
      return;
    }
  const clickedLat = event.latLng.lat();
  const clickedLng = event.latLng.lng();

  if (mapClickForCoordinates) {
    setFormDataFromMapClick(clickedLat, clickedLng);
    setMapClickForCoordinates(false);
    setIsAddModalOpen(true);
    toast.success(`Coordinates set: ${clickedLat.toFixed(6)}, ${clickedLng.toFixed(6)}`);
    return;
  }

  if (!isDrawing) return;

  setCircleCenter({ lat: clickedLat, lng: clickedLng });

  const markersInside = await calculateMarkersInCircle(
    { lat: clickedLat, lng: clickedLng },
    30000
  );

  setMarkersInCircle(markersInside);
  setShowUnlockPreview(true);
};

const setFormDataFromMapClick = (lat, lng) => {
  window.mapClickCoordinates = { lat, lng };
};

const startMapClickForCoordinates = () => {
  setIsAddModalOpen(false);
  setMapClickForCoordinates(true);
  setShowMapClickOverlay(true);
};

const cancelMapClickProcess = () => {
  setMapClickForCoordinates(false);
  setShowMapClickOverlay(false);
};

  const startDrawing = () => {
    if (!user) {
      alert("Please login to unlock locations");
      return;
    }

    setIsDrawing(true);
    setCircleCenter(null);
    setShowUnlockPreview(false);
    setSelected(null);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setCircleCenter(null);
    setShowUnlockPreview(false);
    setMarkersInCircle([]);
  };

  const handleUnlockMarkers = async () => {
    const success = await unlockMarkers(
      markersInCircle,
      circleCenter,
      30000,
      userUnlockedMarkers
    );
    if (success) {
      setIsDrawing(false);
      setCircleCenter(null);
      setShowUnlockPreview(false);
      setMarkersInCircle([]);
    }
  };

  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  const handleMarkerHover = async (marker) => {
    try {
      const freshMarkerData = await getMarkerWithComments(marker.id);
      if (freshMarkerData) {
        setSelected(freshMarkerData);
      } else {
        setSelected(marker);
      }
      setCurrentImageIndex(0);
      setNewComment("");
    } catch (error) {
      console.error("Error fetching marker details:", error);
      setSelected(marker);
    }
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (selected && selected.images) {
      setCurrentImageIndex((prev) =>
        prev === selected.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (selected && selected.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selected.images.length - 1 : prev - 1
      );
    }
  };

  // const handleAddComment = async (e) => {
  //   e.stopPropagation();
  //   if (!newComment.trim()) {
  //     toast.error("Please enter a comment");
  //     return;
  //   }

  //   if (!user) {
  //     toast.error("Please login to add a comment");
  //     return;
  //   }

  //   setAddingComment(true);

  //   try {
  //     await addCommentToMarker(
  //       selected.id,
  //       newComment,
  //       user.uid,
  //       user.name || user.email,
  //       user.email
  //     );

  //     const updatedMarker = await getMarkerWithComments(selected.id);
  //     if (updatedMarker) {
  //       setSelected(updatedMarker);
  //     }

  //     loadMarkers();

  //     toast.success("Comment added successfully!");
  //     setNewComment("");
  //   } catch (error) {
  //     console.error("Error adding comment:", error);
  //     toast.error("Failed to add comment");
  //   } finally {
  //     setAddingComment(false);
  //   }
  // };

  const handleDeleteRequest = (e) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to request deletion of this location?"
      )
    ) {
      toast.success("Deletion request submitted for review");
    }
  };

  const openInGoogleMaps = (e, lat, lng) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  const openInArcGIS = (e, lat, lng) => {
    e.stopPropagation();
    window.open(
      `https://www.arcgis.com/home/webmap/viewer.html?center=${lng},${lat}&level=10`,
      "_blank"
    );
  };

  const circleOptions = {
    fillColor: "#10B981",
    fillOpacity: 0.2,
    strokeColor: "#10B981",
    strokeOpacity: 0.8,
    strokeWeight: 2,
  };

  const filteredMarkers = markers.filter(
    (marker) =>
      marker?.name?.toLowerCase().includes(search.toLowerCase()) 
  );

  const markersToShow = user?.premium
    ? filteredMarkers
    : filteredMarkers.filter(
        (marker) =>
          !marker.is_premium || userUnlockedMarkers.includes(marker.id)
      );

  if (userLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <MapSidebar
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        onMarkerHover={handleMarkerHover}
        onStartDrawing={startDrawing}
        isDrawing={isDrawing}
        user={user}
        userUnlockedMarkers={userUnlockedMarkers}
        onAddLocation={handleAddLocation}
        onShowCheckout={() => setShowCheckout(true)}
      />

      <div className="flex-1 relative">
        <MapControls
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isDrawing={isDrawing}
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          onCancelDrawing={cancelDrawing}
          onAddLocation={handleAddLocation}
        />

        {isLoaded && (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={7}
            options={mapOptions}
            onClick={handleMapClick}
            onLoad={onMapLoad}
          >
            {markersToShow.map((marker) => (
              <Marker
                key={marker.id}
                position={{ lat: marker.lat, lng: marker.lng }}
                icon={{
                  url: marker.is_premium
                    ? "data:image/svg+xml;charset=UTF-8," +
                      encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                          <circle cx="20" cy="20" r="15" fill="url(#grad)" />
                          <defs>
                            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stop-color="#00c853"/>
                              <stop offset="100%" stop-color="#00796b"/>
                            </linearGradient>
                          </defs>
                          <text x="20" y="25" text-anchor="middle" font-size="18" font-weight="bold" fill="white">★</text>
                        </svg>
                      `)
                    : "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                  scaledSize: new window.google.maps.Size(
                    marker.is_premium ? 40 : 30,
                    marker.is_premium ? 40 : 30
                  ),
                }}
                onClick={() =>
                  handleMarkerHover({
                    ...marker,
                    category: marker.is_premium
                      ? "Premium Location"
                      : "Public Location",
                  })
                }
              />
            ))}

            {circleCenter && (
              <Circle
                center={circleCenter}
                radius={circleRadius}
                options={circleOptions}
              />
            )}

            {selected && (
              <InfoWindow
                position={{ lat: selected.lat, lng: selected.lng }}
                onCloseClick={() => setSelected(null)}
                options={{
                  pixelOffset: new window.google.maps.Size(0, -40),
                  maxWidth: 350,
                }}
              >
                <LocationInfoWindow
                  selected={selected}
                  currentImageIndex={currentImageIndex}
                  newComment={newComment}
                  onClose={() => setSelected(null)}
                  onNextImage={nextImage}
                  onPrevImage={prevImage}
                  // onAddComment={handleAddComment}
                  onDeleteRequest={handleDeleteRequest}
                  onOpenGoogleMaps={openInGoogleMaps}
                  onOpenArcGIS={openInArcGIS}
                  onCommentChange={(e) => setNewComment(e.target.value)}
                  addingComment={addingComment}
                  user={user}
                />
              </InfoWindow>
            )}
          </GoogleMap>
        )}

        { showUnlockPreview && (
          <UnlockPreview
            markersInCircle={markersInCircle}
            onUnlockMarkers={handleUnlockMarkers}
            onCancelDrawing={cancelDrawing}
          />
        )}

        <AddLocationModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          user={user}
          onLocationAdded={handleLocationAdded}
          onRequestMapClick={startMapClickForCoordinates}
          // mapClickEnabled={mapClickForCoordinates}
        />

        {showCheckout && (
          <StripeCheckout onClose={() => setShowCheckout(false)} />
        )}

        {showMapClickOverlay && (
  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40">
    <div className="bg-gray-900 border-2 border-green-500 rounded-xl p-6 max-w-md text-center">
      <div className="text-green-500 text-4xl mb-4">📍</div>
      <h3 className="text-xl font-bold text-white mb-2">Click on Map</h3>
      <p className="text-gray-300 mb-6">
        Click anywhere on the map to set coordinates for your new location
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => {
            setShowMapClickOverlay(false);
            setMapClickForCoordinates(true);
            toast.success("Now click on the map to set coordinates");
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          Okay
        </button>
        <button
          onClick={cancelMapClickProcess}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
}
