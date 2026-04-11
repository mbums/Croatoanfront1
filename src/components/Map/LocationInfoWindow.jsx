import React, { useState } from 'react';
import { MapPin, Upload, ChevronLeft, ChevronRight, } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import IntelSubmissionModal from '../IntelSubmissionModal';

function LocationInfoWindow({
  selected,
  currentImageIndex,
  onNextImage,
  onPrevImage,
  onOpenGoogleMaps,
  onOpenArcGIS,
  user
}) {
  const [showIntelModal, setShowIntelModal] = useState(false);
  
  const lastVerified = selected.lastVerified;
  let daysSince = 0;
  
  if (lastVerified && lastVerified.toDate) {
    const lastDate = lastVerified.toDate();
    const now = new Date();
    const diffTime = now - lastDate;
    daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
  const threshold = user?.premium ? 10 : 14;
  const needsVerify = daysSince >= threshold;
  const isStale = selected.status === "stale";

  return (
    <div
      className="text-black w-80 max-h-[85vh] flex flex-col rounded-lg"
      style={{ fontFamily: "'Onest', sans-serif" }}
    >
      {selected.images && selected.images.length > 0 && (
        <div className="relative flex-shrink-0">
          <img
            src={selected.images[currentImageIndex]}
            alt={selected.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          {selected.images.length > 1 && (
            <>
              <button
                onClick={onPrevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={onNextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {currentImageIndex + 1} / {selected.images.length}
          </div>
        </div>
      )}

      <div className="p-3 overflow-y-auto flex-1 min-h-0">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg">{selected.name}</h3>
          <StatusBadge
            status={selected.status || 'N/A'}
            lastVerified={selected.lastVerified}
          />
        </div>

        <div className="mb-3">
          <span className="text-sm font-medium text-gray-700">Type: </span>
          <span className="text-sm text-gray-600">{selected.type || 'Unknown'}</span>
        </div>

        {selected.observationCounts && (
          <div className="mb-4">
            <h4 className="font-medium text-sm mb-2">Observations Summary:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {selected.observationCounts.buildingStanding > 0 && (
                <li>• Building still standing ({selected.observationCounts.buildingStanding})</li>
              )}
              {selected.observationCounts.exteriorAccess > 0 && (
                <li>• Exterior access observed ({selected.observationCounts.exteriorAccess})</li>
              )}
              {selected.observationCounts.securityPresence > 0 && (
                <li>• Security presence observed ({selected.observationCounts.securityPresence})</li>
              )}
              {selected.observationCounts.maintenanceSigns > 0 && (
                <li>• Signs of maintenance ({selected.observationCounts.maintenanceSigns})</li>
              )}
              {selected.observationCounts.redevelopmentSigns > 0 && (
                <li>• Signs of redevelopment ({selected.observationCounts.redevelopmentSigns})</li>
              )}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <MapPin size={16} />
          <span>
            {selected.lat?.toFixed(6) || '0.000000'}, {selected.lng?.toFixed(6) || '0.000000'}
          </span>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={(e) => onOpenGoogleMaps(e, selected.lat, selected.lng)}
            className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 text-center"
          >
            Google Maps
          </button>
          <button
            onClick={(e) => onOpenArcGIS(e, selected.lat, selected.lng)}
            className="flex-1 bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 text-center"
          >
            ArcGIS
          </button>
        </div>

        {needsVerify && !isStale && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800 font-medium">📍 Needs verification</p>
            <p className="text-xs text-yellow-600 mt-1">
              Last verified {daysSince} days ago
              {user?.premium ? " (Premium early warning)" : ""}
            </p>
          </div>
        )}

        {isStale && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800 font-medium">⚠️ Location Status: Stale</p>
            <p className="text-xs text-red-600 mt-1">
              Last verified {daysSince} days ago.
              Intel may be outdated.
            </p>
          </div>
        )}

        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
          <p className="font-medium">⚠️ Community-reported observations</p>
          <p className="mt-1">Conditions may change. No access, safety, or abandonment is guaranteed.</p>
        </div>

        <button
          onClick={() => setShowIntelModal(true)}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded text-sm hover:bg-purple-700 flex items-center justify-center gap-2"
        >
          <Upload size={16} />
          Submit Intel
        </button>
      </div>

      <IntelSubmissionModal
        isOpen={showIntelModal}
        onClose={() => setShowIntelModal(false)}
        locationId={selected.id}
        userId={user?.uid}
        userName={user?.name ?? 'Anonymous'}
        userEmail={user?.email}
        userStatus={user?.status}
      />
    </div>
  );
}

export default LocationInfoWindow;