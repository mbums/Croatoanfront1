import React, { useState, useEffect } from "react";
import { X, Target, Plus } from "lucide-react";
import { fetchMarkers, subscribeToMarkers } from "./markersData";
import AddLocationModal from "./AddLocationModal";

function MapSidebar({
  sidebarOpen,
  onCloseSidebar,
  search,
  onSearchChange,
  onMarkerHover,
  user,
  onAddLocation,
  userUnlockedMarkers = [],
  onShowCheckout,
}) {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState("All Areas");
  const [selectedType, setSelectedType] = useState("All Types");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadMarkers();

    const unsubscribe = subscribeToMarkers(user, (change) => {
      if (
        change.type === "added" ||
        change.type === "modified" ||
        change.type === "removed"
      ) {
        loadMarkers();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, userUnlockedMarkers]);

  const loadMarkers = async () => {
    setLoading(true);
    try {
      const markersData = await fetchMarkers(user, userUnlockedMarkers);
      setMarkers(markersData);
    } catch (error) {
      console.error("Error loading markers:", error);
    } finally {
      setLoading(false);
    }
  };

  const areas = [
    "All Areas",
    ...new Set(
      markers
        .map((marker) => marker.area)
        .filter((area) => area && area !== "Unknown")
    ),
  ];
  const types = [
    "All Types",
    ...new Set(markers.map((marker) => marker.type).filter((type) => type)),
  ];

  const filteredMarkers = markers.filter((marker) => {
    const matchesSearch =
      marker.name.toLowerCase().includes(search.toLowerCase()) ||
      marker.type.toLowerCase().includes(search.toLowerCase()) ||
      marker.area.toLowerCase().includes(search.toLowerCase());

    const matchesArea =
      selectedArea === "All Areas" || marker.area === selectedArea;
    const matchesType =
      selectedType === "All Types" || marker.type === selectedType;

    return matchesSearch && matchesArea && matchesType;
  });

  const publicMarkers = filteredMarkers.filter((marker) => !marker.is_premium);
  const premiumMarkers = filteredMarkers.filter((marker) => marker.is_premium);
  const unlockedPremiumCount = filteredMarkers.filter(
    (marker) => marker.is_premium && userUnlockedMarkers.includes(marker.id)
  ).length;

  if (loading) {
    return (
      <div
        className={`fixed md:static top-0 left-0 h-full w-[320px] md:w-[400px] bg-gray-950 border-r border-gray-800 p-4 flex flex-col transition-transform duration-300 z-50
        ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 z-[10000]`}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-white">Loading locations...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed md:static top-0 left-0 h-full w-[320px] md:w-[400px] bg-gray-950 border-r border-gray-800 p-4 flex flex-col transition-transform duration-300 z-50
        ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 z-[10000]`}
    >
      <button
        className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-white"
        onClick={onCloseSidebar}
      >
        <X size={22} />
      </button>

      <div className="flex items-center justify-start mb-4">
        <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
        <span className="ml-3 text-2xl font-bold text-white">CROATOAN</span>
      </div>

      <button
        onClick={onAddLocation}
        className="w-full py-3 mb-4 rounded bg-gradient-to-r from-green-600 to-green-800 hover:opacity-90 text-white font-medium shadow-lg flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Add New Locationmnnnnnn
      </button>

      {/* {!user?.premium && ( */}
      {/* <button
        onClick={onStartDrawing}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-4"
      >
        <Target size={18} />
        {isDrawing ? "Drawing Circle..." : "Unlock Locations"}
      </button> */}
      {/* )} */}

      <input
        type="text"
        placeholder="Search locations..."
        className="w-full px-3 py-2 mb-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-green-500"
        value={search}
        onChange={onSearchChange}
      />

      <div className="flex gap-2 mb-3">
        <select
          className="flex-1 bg-gray-800 border border-gray-700 text-sm rounded p-2 text-white"
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
        >
          {areas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
        <select
          className="flex-1 bg-gray-800 border border-gray-700 text-sm rounded p-2 text-white"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center mb-2 text-sm text-gray-400">
        <span>Total: {filteredMarkers.length}</span>
        <div className="flex gap-2">
          <span className="text-blue-400">Public: {publicMarkers.length}</span>
          {/* {!user?.premium && (
            <span className="text-green-400">
              Unlocked: {unlockedPremiumCount}
            </span>
          )} */}
            <span className="text-green-400">
              Premium: {premiumMarkers.length}
            </span>
        </div>
      </div>

      <div className="columns-2 gap-4 overflow-y-auto flex-1 pr-1 sidebar-scroll">
        {filteredMarkers.length > 0 ? (
          filteredMarkers.map((marker) => (
            <div
              key={marker.id}
              className={`bg-gray-800 rounded-lg p-2 hover:bg-gray-700 cursor-pointer transition-colors border border-transparent break-inside-avoid hover:border-gray-600 mb-4 "
                }`}
              onClick={() => onMarkerHover(marker)}
            >
              {marker.images[0] ? (
                <img
                  src={marker.images[0]}
                  alt={marker.name}
                  className="rounded-md mb-1 h-[90px] w-full object-cover"
                  onError={(e) => {
                    e.target.src = "";
                  }}
                />
              ) : null}
              <h3 className="text-sm font-semibold truncate">{marker.name}</h3>
              <p className="text-xs text-gray-400 truncate">{marker.desc}</p>
              <div className="flex justify-between items-center mt-1">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    marker.is_premium
                      ? userUnlockedMarkers.includes(marker.id)
                        ? "bg-purple-900 text-purple-300"
                        : "bg-green-900 text-green-300"
                      : marker.status === "pending" ||
                        marker.status === "inactive"
                      ? "bg-red-900 text-red-300"
                      : "bg-blue-900 text-blue-300"
                  }`}
                >
                  {marker.is_premium
                    ? userUnlockedMarkers.includes(marker.id)
                      ? "Unlocked"
                      : "Premium"
                    : marker.status === "pending"
                    ? "Pending"
                    : marker.status === "inactive"
                    ? "Inactive"
                    : "Public"}
                </span>
                {/* <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MessageCircle size={12} />
                  {marker.comments?.length || 0}
                </span> */}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-8 text-gray-400">
            {search
              ? "No locations found for your search"
              : "No locations available"}
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-gray-800 pt-3 space-y-2">
        <div className="flex justify-between text-sm text-white">
          <span className="text-white text-[16px]">
            Points: <span className="text-green-500">{user?.points || 0}</span>
          </span>
          <span className="text-white text-[16px]">
            Status:{" "}
            <span
              className={user?.premium ? "text-green-500" : "text-yellow-500"}
            >
              {user?.premium ? "Premium" : "Free"}
            </span>
          </span>
        </div>

        <button
          onClick={onShowCheckout}
          className="w-full py-2 rounded bg-gradient-to-r from-green-600 to-green-800 hover:opacity-90 text-[17px] font-medium shadow-lg"
        >
          {user?.premium ? "Manage Subscription" : "Buy Premium"}
        </button>

        <div className="flex justify-center gap-4 mt-3 text-gray-400">
          <a href="https://discord.gg/JMSEXJdWdC" target="_blank" className="flex items-center gap-2 text-white">
            <i className="fa-brands fa-discord text-xl text-[#5865F2]"></i>
          </a>
          <a href="https://www.instagram.com/croatoan.map/?hl=en" target="_blank" className="flex items-center gap-2 text-white">
            <i className="fa-brands fa-instagram text-xl text-[#E4405F]"></i>
          </a>
        </div>
      </div>
    </div>
  );
}

export default MapSidebar;
