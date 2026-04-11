import React from "react";
import { Menu, X, Target } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";

function MapControls({
  sidebarOpen,
  onToggleSidebar,
  isDrawing,
  search,
  onSearchChange,
  onCancelDrawing
}) {
  return (
    <>
      <button
        className="absolute top-4 left-4 z-[1000] bg-gray-950 bg-opacity-80 rounded p-2 shadow text-gray-300 hover:text-white focus:outline-none md:hidden"
        onClick={onToggleSidebar}
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 md:gap-3 md:mr-[20px]">
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
            onChange={onSearchChange}
          />
        </div>
        <ProfileDropdown />
      </div>

      {isDrawing && (
        <button
          onClick={onCancelDrawing}
          className="absolute top-4 left-20 z-[1000] bg-red-600 bg-opacity-90 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <X size={16} />
          Cancel
        </button>
      )}
    </>
  );
}

export default MapControls;