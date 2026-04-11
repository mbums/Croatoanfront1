import { Coins, X } from "lucide-react";

function UnlockPreview({
  markersInCircle,
  onUnlockMarkers,
  onCancelDrawing,
}) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-gray-900 p-4 rounded-lg border border-gray-800 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-white">Unlock Preview</h4>
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
              onClick={onUnlockMarkers}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors"
            >
              Unlock {markersInCircle.length} Locations
            </button>
            <button
              onClick={onCancelDrawing}
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
            onClick={onCancelDrawing}
            className="mt-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
          >
            Try Another Area
          </button>
        </div>
      )}
    </div>
  );
}

export default UnlockPreview;