import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  increment,
} from "firebase/firestore";
import { db } from "../../firebase/config";

export const containerStyle = {
  width: "100%",
  height: "100%",
};

export const center = { lat: 44.3, lng: -69.8 };

export const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  mapTypeId: "hybrid",
};

export const fetchMarkers = async (user) => {
  try {
    let markersQuery = collection(db, "Markers");

    if (user?.role === "admin") {
      markersQuery = query(markersQuery);
    } else {
      markersQuery = query(markersQuery, where("status", "!=", "pending"));
    }

    const markersSnapshot = await getDocs(markersQuery);
    const now = new Date();
    const updatePromises = [];

    const markersData = markersSnapshot.docs.map((doc) => {
      const data = doc.data();

      const lastVerified = data.lastVerified || data.approvedAt || data.createdAt;
      let daysSinceVerification = 0;
      let needsVerification = false;
      
      if (lastVerified) {
        const lastDate = lastVerified.toDate ? lastVerified.toDate() : new Date(lastVerified);
        daysSinceVerification = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      }
      
      let status = data.status || "fresh";
      const shouldBeStale = daysSinceVerification > 14;
      
      if (shouldBeStale && status !== "stale") {
        status = "stale";
        updatePromises.push(
          updateDoc(doc.ref, { 
            status: "stale",
            lastVerified: lastVerified
          })
        );
      } else if (!shouldBeStale && status !== "fresh") {
        status = "fresh";
        updatePromises.push(
          updateDoc(doc.ref, { 
            status: "fresh",
            lastVerified: lastVerified
          })
        );
      }
      
      const verificationThreshold = 14;
      needsVerification = daysSinceVerification >= verificationThreshold;

      return {
        id: doc.id,
        name: data.name || "Unknown Location",
        lat: data.lat || 0,
        lng: data.lng || 0,
        type: data.type || "unknown",
        area: data.area || "Unknown",
        is_premium: data.premium || false,
        status: status,
        lastVerified: lastVerified,
        daysSinceVerification: daysSinceVerification,
        needsVerification: needsVerification,
        createdBy: data.createdBy,
        observationCounts: data.observationCounts || {
          buildingStanding: 0,
          exteriorAccess: 0,
          securityPresence: 0,
          maintenanceSigns: 0,
          redevelopmentSigns: 0
        },
        totalIntelSubmissions: data.totalIntelSubmissions || 0,
        images: data.images && data.images.length > 0 ? data.images : [""],
      };
    });

    if (updatePromises.length > 0) {
      try {
        await Promise.all(updatePromises);
        console.log(`Updated ${updatePromises.length} markers in Firestore`);
      } catch (updateError) {
        console.error("Error updating markers:", updateError);
      }
    }

    return markersData;
  } catch (error) {
    console.error("Error fetching markers:", error);
    return [];
  }
};

export const fetchAllMarkers = async () => {
  try {
    const markersQuery = query(
      collection(db, "Markers"),
      where("status", "!=", "pending")
    );

    const markersSnapshot = await getDocs(markersQuery);
    const now = new Date();

    const markersData = markersSnapshot.docs.map((doc) => {
      const data = doc.data();
      
      const lastVerified = data.lastVerified || data.approvedAt || data.createdAt;
      let daysSinceVerification = 0;
      
      if (lastVerified) {
        const lastDate = lastVerified.toDate ? lastVerified.toDate() : new Date(lastVerified);
        daysSinceVerification = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      }
      
      let status = data.status || "fresh";
      const shouldBeStale = daysSinceVerification > 14;
      
      if (shouldBeStale && status !== "stale") {
        status = "stale";
      } else if (!shouldBeStale && status !== "fresh") {
        status = "fresh";
      }

      return {
        id: doc.id,
        name: data.name || "Unknown Location",
        lat: data.lat || 0,
        lng: data.lng || 0,
        type: data.type || "unknown",
        area: data.area || "Unknown",
        is_premium: data.premium || false,
        images: data.images && data.images.length > 0 ? data.images : ["/default-image.jpg"],
        status: status,
        daysSinceVerification: daysSinceVerification,
      };
    });

    return markersData;
  } catch (error) {
    console.error("Error fetching all markers:", error);
    return [];
  }
};

export const subscribeToMarkers = (callback) => {
  if (typeof callback !== 'function') {
    console.error('subscribeToMarkers: callback is not a function');
    return () => {};
  }
  
  try {
    const markersQuery = query(collection(db, "Markers"), where("status", "!=", "pending"));
    return onSnapshot(markersQuery, (snapshot) => {
      const changes = snapshot.docChanges().map((change) => ({
        type: change.type,
        doc: {
          id: change.doc.id,
          ...change.doc.data(),
        },
      }));
      callback(changes);
    });
  } catch (error) {
    console.error("Error setting up marker subscription:", error);
    return () => {};
  }
};

export const getMarkerWithComments = async (markerId) => {
  try {
    const markerDoc = await getDoc(doc(db, "Markers", markerId));
    if (markerDoc.exists()) {
      return {
        id: markerDoc.id,
        ...markerDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching marker:", error);
    throw error;
  }
};