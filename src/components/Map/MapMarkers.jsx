// components/Map/MapMarkers.js
import React from "react";
import { Marker, Circle, InfoWindow } from "@react-google-maps/api";
import LocationInfoWindow from "./LocationInfoWindow";

export const MapMarkers = ({ 
  markersToShow, 
  handleMarkerHover, 
  circleCenter, 
  circleOptions, 
  selected, 
  currentImageIndex, 
  newComment, 
  setSelected, 
  nextImage, 
  prevImage, 
  handleAddComment, 
  handleDeleteRequest, 
  openInGoogleMaps, 
  openInArcGIS, 
  setNewComment 
}) => {
  const getMarkerIcon = (isPremium) => ({
    url: isPremium
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
    scaledSize: new window.google.maps.Size(isPremium ? 40 : 30, isPremium ? 40 : 30),
  });

  return (
    <>
      {markersToShow.map((marker) => (
        <Marker
          key={marker.id}
          position={{ lat: marker.lat, lng: marker.lng }}
          icon={getMarkerIcon(marker.is_premium)}
          onMouseOver={() => handleMarkerHover({
            ...marker,
            category: marker.is_premium ? "Premium Location" : "Public Location"
          })}
        />
      ))}

      {circleCenter && (
        <Circle
          center={circleCenter}
          radius={30000}
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
            onAddComment={handleAddComment}
            onDeleteRequest={handleDeleteRequest}
            onOpenGoogleMaps={openInGoogleMaps}
            onOpenArcGIS={openInArcGIS}
            onCommentChange={(e) => setNewComment(e.target.value)}
          />
        </InfoWindow>
      )}
    </>
  );
};