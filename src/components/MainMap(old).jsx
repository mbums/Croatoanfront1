import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  Circle,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MessageCircle,
  Trash2,
  Target,
  Coins,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import Login from "./Login";
import AdminPanel from "./Admin/AdminPanel";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = { lat: 44.3, lng: -69.8 };

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  mapTypeId: "hybrid",
};

const publicMarkers = [
  {
    id: 1,
    name: "Abandoned House",
    lat: 44.3,
    lng: -69.8,
    desc: "Old wooden house with overgrown vegetation",
    images: [
      "https://img.freepik.com/premium-photo/abandoned-house_161754-17860.jpg",
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=500",
      "https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?w=500",
    ],
    type: "house",
    area: "USA",
    comments: [
      {
        user: "UrbanExplorer23",
        text: "Visited last week, still accessible from the back entrance.",
        date: "2023-10-15",
      },
      {
        user: "GhostHunter",
        text: "Great spot for photography at sunset!",
        date: "2023-10-10",
      },
    ],
  },
  {
    id: 2,
    name: "Old Factory",
    lat: 44.5,
    lng: -70.1,
    desc: "Closed manufacturing site with large machinery still inside",
    images: [
      "https://img.freepik.com/premium-photo/scale-old-factory_615433-7538.jpg",
      "https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=500",
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500",
    ],
    type: "factory",
    area: "USA",
    comments: [
      {
        user: "Industrial_Seeker",
        text: "Be careful of loose flooring on the second level.",
        date: "2023-10-12",
      },
    ],
  },
];

const premiumMarkers = [
  {
    id: 1,
    name: "Hidden Motel",
    lat: 44.25,
    lng: -70.0,
    desc: "1960s motel completely frozen in time",
    images: [
      "http://azuremotel.com.br/wp-content/uploads/2022/08/Foto-8.jpg",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500",
    ],
    type: "motel",
    area: "USA",
    comments: [
      {
        user: "TimeTraveler",
        text: "The vintage furniture is incredible! Mostly intact.",
        date: "2023-10-18",
      },
      {
        user: "HistoryBuff",
        text: "Found old registration cards from the 70s in the office.",
        date: "2023-10-05",
      },
    ],
  },
  {
    id: 2,
    name: "Forgotten Shipyard",
    lat: 44.4,
    lng: -69.9,
    desc: "Premium location with massive shipbuilding remnants",
    images: [
      "https://img.freepik.com/premium-photo/vacant-shipyards_975681-74875.jpg",
      "https://images.unsplash.com/photo-1530539595977-0aa9890547d4?w=500",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500",
    ],
    type: "shipyard",
    area: "Canada",
    comments: [],
  },
];

export default function MainMap() {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [selected, setSelected] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newComment, setNewComment] = useState("");
  const { user, loading } = useUser();
  
  // Circle drawing states
  const [circleCenter, setCircleCenter] = useState(null);
  const [circleRadius] = useState(8000); // 5km fixed radius
  const [isDrawing, setIsDrawing] = useState(false);
  const [markersInCircle, setMarkersInCircle] = useState([]);
  const [showUnlockPreview, setShowUnlockPreview] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyAhxyJTODlgtLM2AZuiBG8mkT9DZdYOJs0",
  });

  const mapRef = useRef();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate markers inside circle
  const calculateMarkersInCircle = (center, radius) => {
    const earthRadius = 6371000; // meters
    
    const allPremiumMarkers = [...premiumMarkers];
    const markersInside = allPremiumMarkers.filter(marker => {
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

      return distance <= radius;
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
      alert('Please login to unlock locations');
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
  };

  const unlockMarkers = async () => {
    if (!user || markersInCircle.length === 0) return;

    const pointsPerMarker = 10;
    const totalCost = markersInCircle.length * pointsPerMarker;

    toast.success(`Unlocked ${markersInCircle.length} locations for ${totalCost} points!`);
    
    setIsDrawing(false);
    setCircleCenter(null);
    setShowUnlockPreview(false);
  };

  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const filteredPublic = publicMarkers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPremium = premiumMarkers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleMarkerHover = (marker) => {
    setSelected(marker);
    setCurrentImageIndex(0);
    setNewComment("");
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

  const handleAddComment = (e) => {
    e.stopPropagation();
    if (!newComment.trim()) return;

    // In a real app, this would send to backend
    alert(`Comment added: ${newComment}`);
    setNewComment("");
  };

  const handleDeleteRequest = (e) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to request deletion of this location?"
      )
    ) {
      alert("Deletion request submitted for review");
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

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-full w-[320px] md:w-[400px] bg-gray-950 border-r border-gray-800 p-4 flex flex-col transition-transform duration-300 z-50
        ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 z-[10000]`}
      >
        {/* Mobile Close Button (X) */}
        <button
          className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={22} />
        </button>

        {/* Logo */}
        <div className="flex items-center justify-start mb-4">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
        </div>

        {/* Add Location Button - Moved to sidebar */}
        <button className="w-full py-3 mb-4 rounded bg-gradient-to-r from-green-600 to-green-800 hover:opacity-90 text-white font-medium shadow-lg flex items-center justify-center gap-2">
          <i className="fa-solid fa-plus"></i>
          Add New Location
        </button>

        {/* Unlock Circle Button */}
        <button
          onClick={startDrawing}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-4"
        >
          <Target size={18} />
          {isDrawing ? "Drawing Circle..." : "Unlock Locations"}
        </button>

        {/* Search */}
        <input
          type="text"
          placeholder="Search locations..."
          className="w-full px-3 py-2 mb-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-green-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <select className="flex-1 bg-gray-800 border border-gray-700 text-sm rounded p-2">
            <option>All Areas</option>
            <option>USA</option>
            <option>Canada</option>
          </select>
          <select className="flex-1 bg-gray-800 border border-gray-700 text-sm rounded p-2">
            <option>All Types</option>
            <option>Factory</option>
            <option>School</option>
            <option>Hospital</option>
          </select>
        </div>

        {/* Locations List */}
        <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1 pr-1 sidebar-scroll">
          {[...filteredPublic, ...filteredPremium].map((item) => (
            <div
              key={item.id}
              className="bg-gray-800 rounded-lg p-2 hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => {
                handleMarkerHover(item);
              }}
            >
              <img
                src={item.images[0]}
                alt={item.name}
                className="rounded-md mb-1 h-28 w-full object-cover"
              />
              <h3 className="text-sm font-semibold">{item.name}</h3>
              <p className="text-xs text-gray-400">{item.desc}</p>
              <div className="flex justify-between items-center mt-1">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    premiumMarkers.some((pm) => pm.id === item.id)
                      ? "bg-green-900 text-green-300"
                      : "bg-blue-900 text-blue-300"
                  }`}
                >
                  {premiumMarkers.some((pm) => pm.id === item.id)
                    ? "Premium"
                    : "Public"}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MessageCircle size={12} />
                  {item.comments.length}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 border-t border-gray-800 pt-3 space-y-2">
          <div className="flex justify-between text-sm text-white">
            <span className="text-white text-[16px]">
              Points: <span className="text-green-500">{user.points}</span>
            </span>
            <span className="text-white text-[16px]">
              Status:{" "}
              <span
                className={user.premium ? "text-green-500" : "text-yellow-500"}
              >
                {user.premium ? "Premium" : "Free"}
              </span>
            </span>
          </div>
          <button className="w-full py-2 rounded bg-gradient-to-r from-green-600 to-green-800 hover:opacity-90 text-[17px] font-medium shadow-lg">
            {user.premium ? "Manage Subscription" : "Buy Premium"}
          </button>
          <div className="flex justify-center gap-4 mt-3 text-gray-400">
            <a href="#" className="flex items-center gap-2 text-white">
              <i className="fa-brands fa-discord text-xl text-[#5865F2]"></i>
            </a>
            <a href="#" className="flex items-center gap-2 text-white">
              <i className="fa-brands fa-instagram text-xl text-[#E4405F]"></i>
            </a>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="flex-1 relative">
        {/* Toggle Button */}
        <button
          className="absolute top-4 left-4 z-[1000] bg-gray-950 bg-opacity-80 rounded p-2 shadow text-gray-300 hover:text-white focus:outline-none md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Search + Profile */}
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 md:gap-3 md:mr-[20px]">
          {/* Drawing Status */}
          {isDrawing && (
            <div className="bg-gray-950 bg-opacity-90 border border-green-500 rounded-lg px-3 py-2 text-sm text-green-400">
              <div className="flex items-center gap-2">
                <Target size={16} />
                <span>Click on map to place circle</span>
              </div>
            </div>
          )}

          <div className="flex items-center bg-gray-950 bg-opacity-80 border border-gray-800 rounded-full px-4 py-2 shadow-md w-[190px] md:w-[280px]">
            <i className="fa-solid fa-magnifying-glass text-gray-400 mr-2"></i>
            <input
              type="text"
              placeholder="Search abandoned buildings..."
              className="bg-transparent w-full text-sm focus:outline-none text-white placeholder-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ProfileDropdown />
        </div>

        {/* Cancel Drawing Button */}
        {isDrawing && (
          <button
            onClick={cancelDrawing}
            className="absolute top-4 left-20 z-[1000] bg-red-600 bg-opacity-90 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <X size={16} />
            Cancel
          </button>
        )}

        {/* Map */}
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={7}
            options={mapOptions}
            onClick={handleMapClick}
            onLoad={onMapLoad}
          >
            {filteredPublic.map((marker) => (
              <Marker
                key={`pub-${marker.id}`}
                position={{ lat: marker.lat, lng: marker.lng }}
                icon={{
                  url: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
                onMouseOver={() =>
                  handleMarkerHover({ ...marker, category: "Public Location" })
                }
              />
            ))}

            {filteredPremium.map((marker) => (
              <Marker
                key={`pre-${marker.id}`}
                position={{ lat: marker.lat, lng: marker.lng }}
                icon={{
                  url:
                    "data:image/svg+xml;charset=UTF-8," +
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
                    `),
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
                onMouseOver={() =>
                  handleMarkerHover({ ...marker, category: "Premium Location" })
                }
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

            {selected && (
              <InfoWindow
                position={{ lat: selected.lat, lng: selected.lng }}
                onCloseClick={() => setSelected(null)}
                options={{
                  pixelOffset: new window.google.maps.Size(0, -40),
                  maxWidth: 350,
                }}
              >
                <div
                  className="text-black w-80"
                  style={{ fontFamily: "'Onest', sans-serif" }}
                >
                  {/* Image Carousel */}
                  <div className="relative mb-3">
                    <img
                      src={selected.images[currentImageIndex]}
                      alt={selected.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />

                    {/* Navigation Arrows */}
                    {selected.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {currentImageIndex + 1} / {selected.images.length}
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{selected.name}</h3>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          selected.category === "Premium Location"
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {selected.category}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">
                      {selected.desc}
                    </p>

                    {/* Coordinates with Map Links */}
                    <div className="flex flex-col gap-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        <span>
                          {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) =>
                            openInGoogleMaps(e, selected.lat, selected.lng)
                          }
                          className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 text-center"
                        >
                          Google Maps
                        </button>
                        <button
                          onClick={(e) =>
                            openInArcGIS(e, selected.lat, selected.lng)
                          }
                          className="flex-1 bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 text-center"
                        >
                          ArcGIS
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={handleDeleteRequest}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Request Deletion
                      </button>
                    </div>

                    {/* Comments Section */}
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle size={16} className="text-gray-500" />
                        <h4 className="font-semibold">
                          Comments ({selected.comments.length})
                        </h4>
                      </div>

                      {/* Comments List */}
                      <div className="max-h-32 overflow-y-auto mb-3 space-y-2">
                        {selected.comments.length > 0 ? (
                          selected.comments.map((comment, index) => (
                            <div
                              key={index}
                              className="bg-gray-100 p-2 rounded text-sm"
                            >
                              <div className="flex justify-between">
                                <span className="font-semibold">
                                  {comment.user}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {comment.date}
                                </span>
                              </div>
                              <p className="text-gray-700">{comment.text}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm text-center py-2">
                            No comments yet. Be the first to comment!
                          </p>
                        )}
                      </div>

                      {/* Add Comment */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-green-500"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={handleAddComment}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}

        {/* Unlock Preview Panel */}
        {showUnlockPreview && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-gray-900 p-4 rounded-lg border border-gray-800 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">
                Unlock Preview
              </h4>
              <div className="text-green-500 font-semibold flex items-center gap-1">
                <Coins size={16} />
                Cost: {markersInCircle.length * 10} points
              </div>
            </div>

            {markersInCircle.length > 0 ? (
              <div>
                <p className="text-gray-400 mb-3">
                  Found {markersInCircle.length} premium locations in this area
                </p>
                
                <div className="grid grid-cols-1 gap-2 mb-4 max-h-32 overflow-y-auto">
                  {markersInCircle.slice(0, 4).map(marker => (
                    <div key={marker.id} className="bg-gray-800 p-2 rounded border border-gray-700">
                      <div className="font-semibold text-white text-sm">{marker.name}</div>
                      <div className="text-gray-400 text-xs">{marker.type}</div>
                    </div>
                  ))}
                  {markersInCircle.length > 4 && (
                    <div className="bg-gray-800 p-2 rounded border border-gray-700 text-center">
                      <div className="text-gray-400 text-sm">
                        +{markersInCircle.length - 4} more locations
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={unlockMarkers}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors"
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
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-gray-400">No premium locations found in this area</p>
                <button
                  onClick={cancelDrawing}
                  className="mt-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
                >
                  Try Another Area
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const { logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-gray-950 bg-opacity-80 flex items-center justify-center text-white shadow-md hover:opacity-90 focus:outline-none"
      >
        <i className="fa-solid fa-user text-lg"></i>
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-3 w-56 bg-gray-950 border border-gray-800 rounded-xl shadow-lg p-4 text-white z-[1100] animate-fadeIn">
          <button
            onClick={handleLogout}
            className="w-full py-2 rounded bg-gray-800 hover:bg-red-600 text-sm font-medium"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}