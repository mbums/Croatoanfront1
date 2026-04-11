import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";

function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const { logout, user } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-gray-950 bg-opacity-80 flex items-center justify-center text-white shadow-md hover:opacity-90 focus:outline-none"
      >
        <i className="fa-solid fa-user text-lg"></i>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-56 bg-gray-950 border border-gray-800 rounded-xl shadow-lg p-4 text-white z-[1100] animate-fadeIn">
          {/* User Info Section */}
          <div className="mb-3 pb-3 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <i className="fa-solid fa-user text-xs"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.name || user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-coins text-yellow-500"></i>
                  <span className="text-xs text-gray-300">Points</span>
                </div>
                <span className="text-sm font-bold text-yellow-400">
                  {user?.points?.toLocaleString() || '0'}
                </span>
              </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full py-2 rounded bg-gray-800 hover:bg-red-600 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-right-from-bracket text-xs"></i>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;