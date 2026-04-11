import React, { useState, useRef } from 'react';
import { doc, deleteDoc, addDoc, collection, updateDoc, getDoc } from 'firebase/firestore';
import { db } from "../../firebase/config";
import { Plus, Trash2, Image, X, Upload, FolderOpen, Link, Cloud, Check, Clock, Eye, EyeOff, MapPin, User, Mail, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function MarkersTab({ markers, loading, onMarkersUpdate, currentUser }) {
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [showEditMarker, setShowEditMarker] = useState(false);
  const [editingMarker, setEditingMarker] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [newMarker, setNewMarker] = useState({
    name: "",
    desc: "",
    lat: "",
    lng: "",
    type: "house",
    area: "USA",
    premium: false,
    images: [],
  });
  const [imageUrl, setImageUrl] = useState("");
  const [uploadMethod, setUploadMethod] = useState("url");
  const [uploading, setUploading] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const fileInputRef = useRef(null);

  // Cloudinary Configuration
  const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  // Filter markers based on active tab
  const filteredMarkers = markers.filter(marker => {
    switch (activeTab) {
      case 'pending':
        return marker.status === 'pending';
      case 'active':
        return marker.status === 'active';
      case 'rejected':
        return marker.status === 'rejected';
      case 'premium':
        return marker.premium === true;
      case 'public':
        return marker.premium === false;
      default:
        return true;
    }
  });

  const getStatusBadge = (status, premium) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold";

    switch (status) {
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-600 text-yellow-100`}>⏳ PENDING</span>;
      case 'active':
        return premium
          ? <span className={`${baseClasses} bg-gradient-to-r from-yellow-600 to-yellow-700 text-white`}>⭐ PREMIUM</span>
          : <span className={`${baseClasses} bg-gradient-to-r from-blue-600 to-blue-700 text-white`}>🌎 PUBLIC</span>;
      case 'rejected':
        return <span className={`${baseClasses} bg-red-600 text-red-100`}>❌ REJECTED</span>;
      case 'inactive':
        return <span className={`${baseClasses} bg-red-600 text-red-100`}>❌ INACTIVE</span>;
      default:
        return <span className={`${baseClasses} bg-gray-600 text-gray-100`}>❓ UNKNOWN</span>;
    }
  };

  const getStatusCounts = () => {
    return {
      all: markers.length,
      pending: markers.filter(m => m.status === 'pending').length,
      active: markers.filter(m => m.status === 'active').length,
      rejected: markers.filter(m => m.status === 'rejected').length,
      premium: markers.filter(m => m.premium === true).length,
      public: markers.filter(m => m.premium === false && m.status === 'active').length,
    };
  };

  const statusCounts = getStatusCounts();

  const editMarker = (marker) => {
    setEditingMarker(marker);
    setNewMarker({
      name: marker.name || "",
      desc: marker.desc || "",
      lat: marker.lat?.toString() || "",
      lng: marker.lng?.toString() || "",
      type: marker.type || "house",
      area: marker.area || "USA",
      premium: marker.premium || false,
      images: marker.images || [],
    });
    setShowEditMarker(true);
  };

  const updateMarker = async (e) => {
    e.preventDefault();

    if (!editingMarker) return;

    // if (newMarker.images.length === 0) {
    //   toast.error('Please add at least one image for the location');
    //   return;
    // }

    if (!newMarker.name.trim()) {
      toast.error('Please enter a location name');
      return;
    }

    if (!newMarker.lat || !newMarker.lng) {
      toast.error('Please enter valid coordinates');
      return;
    }

    const updateToast = toast.loading('Updating location...');

    try {
      await updateDoc(doc(db, "Markers", editingMarker.id), {
        name: newMarker.name.trim(),
        desc: newMarker.desc.trim(),
        lat: parseFloat(newMarker.lat),
        lng: parseFloat(newMarker.lng),
        type: newMarker.type,
        area: newMarker.area,
        premium: newMarker.premium,
        images: newMarker.images,
        updatedAt: new Date(),
        updatedBy: currentUser.uid,
        imageSources: newMarker.images.map(img =>
          img.includes('cloudinary.com') ? 'cloudinary' : 'external'
        )
      });

      setShowEditMarker(false);
      setEditingMarker(null);
      setNewMarker({
        name: "",
        desc: "",
        lat: "",
        lng: "",
        type: "house",
        area: "USA",
        premium: false,
        images: [],
      });
      setImageUrl("");
      setUploadMethod("url");

      onMarkersUpdate();
      toast.success('Location updated successfully! 🎉');
    } catch (error) {
      console.error("Error updating marker:", error);
      toast.error('Failed to update location. Please try again.');
    } finally {
      toast.dismiss(updateToast);
    }
  };

  const approveMarker = async (markerId, markerName) => {
    setApprovingId(markerId);
    try {
      const markerDoc = await getDoc(doc(db, "Markers", markerId));
      const markerData = markerDoc.data();
      const creatorId = markerData.createdBy;

      await updateDoc(doc(db, "Markers", markerId), {
        status: 'active',
        updatedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: currentUser.uid
      });

      let pointsAdd = 0;
      if (creatorId) {
        try {
          const userDoc = await getDoc(doc(db, "user1", creatorId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            const currentPoints = userData.points || 0;
            if (userData.status == 'Premium') {
              pointsAdd = 50;
            } else {
              pointsAdd = 25;
            }
            let newPoints = currentPoints + pointsAdd;

            await updateDoc(doc(db, "user1", creatorId), {
              points: newPoints,
              updatedAt: new Date()
            });
          }
        } catch (pointsError) {
          console.error("Error adding points to user:", pointsError);
        }
      }

      onMarkersUpdate();
      toast.success(`"${markerName}" approved successfully! 🎉 +${pointsAdd} points awarded to creator!`);
    } catch (error) {
      console.error("Error approving marker:", error);
      toast.error('Failed to approve marker');
    } finally {
      setApprovingId(null);
    }
  };

  // Reject marker
  const rejectMarker = async (markerId, markerName) => {
    setRejectingId(markerId);
    try {
      await updateDoc(doc(db, "Markers", markerId), {
        status: 'rejected',
        updatedAt: new Date(),
        rejectedAt: new Date(),
        rejectedBy: currentUser.uid
      });
      onMarkersUpdate();
      toast.success(`"${markerName}" rejected!`);
    } catch (error) {
      console.error("Error rejecting marker:", error);
      toast.error('Failed to reject marker');
    } finally {
      setRejectingId(null);
    }
  };

  const toggleMarkerStatus = async (markerId, markerName) => {
    try {
      const marker = markers.find(m => m.id === markerId);
      if (!marker) {
        toast.error('Marker not found');
        return;
      }

      const currentStatus = marker.status;
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      await updateDoc(doc(db, "Markers", markerId), {
        status: newStatus,
        updatedAt: new Date()
      });

      onMarkersUpdate();
      toast.success(`"${markerName}" ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
    } catch (error) {
      console.error("Error toggling marker status:", error);
      toast.error('Failed to update marker');
    }
  };

  const deleteMarker = async (markerId, markerName) => {
    const result = await Swal.fire({
      title: 'Delete Marker?',
      html: `Are you sure you want to permanently delete <strong>"${markerName}"</strong>?<br><span style="color: #ef4444;">This action cannot be undone.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#111827',
      color: '#fff',
      customClass: {
        popup: 'border border-gray-800'
      }
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "Markers", markerId));
        onMarkersUpdate();

        await Swal.fire({
          title: 'Deleted!',
          text: `"${markerName}" has been deleted successfully.`,
          icon: 'success',
          confirmButtonColor: '#059669',
          background: '#111827',
          color: '#fff',
          customClass: {
            popup: 'border border-gray-800'
          }
        });
      } catch (error) {
        console.error("Error deleting marker:", error);

        // Error alert
        await Swal.fire({
          title: 'Error!',
          text: 'Failed to delete marker. Please try again.',
          icon: 'error',
          confirmButtonColor: '#dc2626',
          background: '#111827',
          color: '#fff',
          customClass: {
            popup: 'border border-gray-800'
          }
        });
      }
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'abandoned_locations');

    try {
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  };

  const addImageUrl = () => {
    if (imageUrl.trim() && newMarker.images.length < 5) {
      if (isValidImageUrl(imageUrl)) {
        setNewMarker({
          ...newMarker,
          images: [...newMarker.images, imageUrl.trim()]
        });
        setImageUrl("");
        toast.success('Image URL added successfully');
      } else {
        toast.error('Please enter a valid image URL (jpg, jpeg, png, webp, gif)');
      }
    } else if (newMarker.images.length >= 5) {
      toast.error('Maximum 5 images allowed per location');
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    if (files.length + newMarker.images.length > 5) {
      toast.error(`You can only upload ${5 - newMarker.images.length} more images`);
      return;
    }

    setUploading(true);
    const uploadToast = toast.loading(`Uploading ${files.length} image(s)...`);

    try {
      const uploadPromises = files.map(async (file) => {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`"${file.name}" is too large. Maximum size is 10MB.`);
        }

        if (!file.type.startsWith('image/')) {
          throw new Error(`"${file.name}" is not a valid image file.`);
        }

        return await uploadToCloudinary(file);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      setNewMarker(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)`);
    } catch (error) {
      console.error("Error uploading files:", error);
      if (error.message.includes('too large')) {
        toast.error(error.message);
      } else if (error.message.includes('not a valid image')) {
        toast.error(error.message);
      } else {
        toast.error('Failed to upload images. Please try again.');
      }
    } finally {
      setUploading(false);
      toast.dismiss(uploadToast);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index) => {
    const updatedImages = newMarker.images.filter((_, i) => i !== index);
    setNewMarker({ ...newMarker, images: updatedImages });
    toast.success('Image removed');
  };

  const isValidImageUrl = (url) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const imageDomains = ['unsplash.com', 'imgur.com', 'cloudinary.com', 'images.unsplash.com'];

    const hasImageExtension = imageExtensions.some(ext =>
      url.toLowerCase().includes(ext)
    );

    const hasImageDomain = imageDomains.some(domain =>
      url.toLowerCase().includes(domain)
    );

    return hasImageExtension || hasImageDomain;
  };

  // Add sample images for testing
  const addSampleImages = () => {
    const sampleImages = [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=500&h=300&fit=crop",
      "https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?w=500&h=300&fit=crop",
      "https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=500&h=300&fit=crop"
    ];

    const availableSlots = 5 - newMarker.images.length;
    if (availableSlots === 0) {
      toast.error('Maximum 5 images already added');
      return;
    }

    const imagesToAdd = sampleImages.slice(0, availableSlots);

    setNewMarker({
      ...newMarker,
      images: [...newMarker.images, ...imagesToAdd]
    });
    toast.success(`Added ${imagesToAdd.length} sample image(s)`);
  };

  const addNewMarker = async (e) => {
    e.preventDefault();

    // Validation
    // if (newMarker.images.length === 0) {
    //   toast.error('Please add at least one image for the location');
    //   return;
    // }

    if (!newMarker.name.trim()) {
      toast.error('Please enter a location name');
      return;
    }

    if (!newMarker.lat || !newMarker.lng) {
      toast.error('Please enter valid coordinates');
      return;
    }

    const addToast = toast.loading('Adding new location...');

    try {
      await addDoc(collection(db, "Markers"), {
        ...newMarker,
        lat: parseFloat(newMarker.lat),
        lng: parseFloat(newMarker.lng),
        comments: [],
        createdAt: new Date(),
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
        status: "active",
        approved: true,
        approvedAt: new Date(),
        approvedBy: currentUser.uid,
        images: newMarker.images,
        imageSources: newMarker.images.map(img =>
          img.includes('cloudinary.com') ? 'cloudinary' : 'external'
        )
      });

      // Reset form
      setShowAddMarker(false);
      setNewMarker({
        name: "",
        desc: "",
        lat: "",
        lng: "",
        type: "house",
        area: "USA",
        premium: false,
        images: [],
      });
      setImageUrl("");
      setUploadMethod("url");

      onMarkersUpdate();
      toast.success('Location added successfully! 🎉');
    } catch (error) {
      console.error("Error adding marker:", error);
      toast.error('Failed to add location. Please try again.');
    } finally {
      toast.dismiss(addToast);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="text-white text-lg">Loading markers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Location Management</h2>
          <p className="text-gray-400">Manage all location markers and approvals</p>
        </div>
        <button
          onClick={() => setShowAddMarker(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 w-fit"
        >
          <Plus size={20} />
          Add New Location
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="text-2xl font-bold text-white">{statusCounts.all}</div>
          <div className="text-gray-400 text-sm">Total</div>
        </div>
        <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-800">
          <div className="text-2xl font-bold text-yellow-400">{statusCounts.pending}</div>
          <div className="text-yellow-400 text-sm">Pending</div>
        </div>
        <div className="bg-green-900/20 rounded-lg p-4 border border-green-800">
          <div className="text-2xl font-bold text-green-400">{statusCounts.active}</div>
          <div className="text-green-400 text-sm">Active</div>
        </div>
        <div className="bg-red-900/20 rounded-lg p-4 border border-red-800">
          <div className="text-2xl font-bold text-red-400">{statusCounts.rejected}</div>
          <div className="text-red-400 text-sm">Rejected</div>
        </div>
        <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-800">
          <div className="text-2xl font-bold text-yellow-400">{statusCounts.premium}</div>
          <div className="text-yellow-400 text-sm">Premium</div>
        </div>
        <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800">
          <div className="text-2xl font-bold text-blue-400">{statusCounts.public}</div>
          <div className="text-blue-400 text-sm">Public</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-4">
        {[
          { id: 'all', label: 'All Locations', count: statusCounts.all },
          { id: 'pending', label: 'Pending Review', count: statusCounts.pending },
          { id: 'active', label: 'Active', count: statusCounts.active },
          { id: 'rejected', label: 'Rejected', count: statusCounts.rejected },
          { id: 'premium', label: 'Premium', count: statusCounts.premium },
          { id: 'public', label: 'Public', count: statusCounts.public },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${activeTab === tab.id
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            {tab.label}
            <span className={`px-2 py-1 rounded-full text-xs ${activeTab === tab.id ? 'bg-green-700' : 'bg-gray-700'
              }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Add Marker Form */}
      {showAddMarker && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">Add New Location</h3>
            <p className="text-gray-400 mt-1">Create a new abandoned location marker</p>
          </div>

          <form onSubmit={addNewMarker} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 font-medium mb-2 block">Location Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Abandoned Factory, Old School Building"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                    value={newMarker.name}
                    onChange={(e) => setNewMarker({ ...newMarker, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-medium mb-2 block">Description *</label>
                  <textarea
                    placeholder="Describe the location, its history, current condition..."
                    rows="3"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors resize-none"
                    value={newMarker.desc}
                    onChange={(e) => setNewMarker({ ...newMarker, desc: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 font-medium mb-2 block">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="44.123456"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                      value={newMarker.lat}
                      onChange={(e) => setNewMarker({ ...newMarker, lat: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-medium mb-2 block">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="-69.123456"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                      value={newMarker.lng}
                      onChange={(e) => setNewMarker({ ...newMarker, lng: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 font-medium mb-2 block">Location Type</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                    value={newMarker.type}
                    onChange={(e) => setNewMarker({ ...newMarker, type: e.target.value })}
                  >
                    <option value="house">🏠 House</option>
                    <option value="factory">🏭 Factory</option>
                    <option value="school">🏫 School</option>
                    <option value="hospital">🏥 Hospital</option>
                    <option value="motel">🏨 Motel</option>
                    <option value="shipyard">🚢 Shipyard</option>
                    <option value="asylum">🏛️ Asylum</option>
                    <option value="church">⛪ Church</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-medium mb-2 block">Area/Region</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                    value={newMarker.area}
                    onChange={(e) => setNewMarker({ ...newMarker, area: e.target.value })}
                  >
                    <option value="USA">🇺🇸 United States</option>
                    <option value="Canada">🇨🇦 Canada</option>
                    <option value="Europe">🇪🇺 Europe</option>
                    <option value="Asia">🌏 Asia</option>
                    <option value="Other">🌍 Other</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <input
                    type="checkbox"
                    id="premium"
                    checked={newMarker.premium}
                    onChange={(e) => setNewMarker({ ...newMarker, premium: e.target.checked })}
                    className="w-5 h-5 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <label htmlFor="premium" className="text-gray-300 font-medium cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs px-2 py-1 rounded">PREMIUM</span>
                      Premium Location (Visible only to premium users)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="border-t border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
                    <Image size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">Location Images</h4>
                    <p className="text-gray-400">Add up to 5 images ({newMarker.images.length}/5)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addSampleImages}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <Image size={16} />
                  Add Sample Images
                </button>
              </div>

              {/* Upload Method Selection */}
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setUploadMethod("url")}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-200 ${uploadMethod === "url"
                    ? "border-green-500 bg-green-500/10 text-green-400"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                    }`}
                >
                  <Link size={20} />
                  <div className="text-left">
                    <div className="font-semibold">Paste Image URL</div>
                    <div className="text-sm">From Unsplash, Imgur, etc.</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod("upload")}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-200 ${uploadMethod === "upload"
                    ? "border-green-500 bg-green-500/10 text-green-400"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                    }`}
                >
                  <Cloud size={20} />
                  <div className="text-left">
                    <div className="font-semibold">Upload Images</div>
                    <div className="text-sm">Free cloud storage</div>
                  </div>
                </button>
              </div>

              {/* URL Input */}
              {uploadMethod === "url" && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      disabled={newMarker.images.length >= 5}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Upload size={18} />
                      Add URL
                    </button>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm">
                      💡 <strong>Recommended sources:</strong> Unsplash, Imgur, Cloudinary, or any direct image URL
                    </p>
                  </div>
                </div>
              )}

              {/* Cloudinary File Upload */}
              {uploadMethod === "upload" && (
                <div className="space-y-4">
                  <div className="flex gap-3 items-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={newMarker.images.length >= 5 || uploading}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <FolderOpen size={18} />
                      {uploading ? "Uploading..." : "Choose Images"}
                    </button>
                    <span className="text-gray-400 text-sm">
                      Select multiple images • Max 10MB per file
                    </span>
                  </div>
                </div>
              )}

              {/* Preview Images */}
              {newMarker.images.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h5 className="text-gray-300 font-semibold">
                      Image Preview ({newMarker.images.length}/5)
                    </h5>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {newMarker.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-600 group-hover:border-gray-500 transition-colors">
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/300x300/1f2937/9ca3af?text=Invalid+Image";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {img.includes('cloudinary.com') ? '☁️ Cloud' : '🔗 URL'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-700">
              <div className="text-gray-400 text-sm">
                Admin-created locations are automatically approved
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMarker(false);
                    toast.success('Form cancelled');
                  }}
                  className="px-6 py-3 border border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newMarker.images.length === 0 || uploading}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none flex items-center gap-2"
                >
                  <Plus size={18} />
                  {uploading ? "Uploading..." : "Add Location"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Edit Marker Form */}
      {showEditMarker && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">Edit Location</h3>
            <p className="text-gray-400 mt-1">Update location details</p>
          </div>

          <form onSubmit={updateMarker} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 font-medium mb-2 block">Location Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Abandoned Factory, Old School Building"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                    value={newMarker.name}
                    onChange={(e) => setNewMarker({ ...newMarker, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-medium mb-2 block">Description *</label>
                  <textarea
                    placeholder="Describe the location, its history, current condition..."
                    rows="3"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors resize-none"
                    value={newMarker.desc}
                    onChange={(e) => setNewMarker({ ...newMarker, desc: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 font-medium mb-2 block">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="44.123456"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                      value={newMarker.lat}
                      onChange={(e) => setNewMarker({ ...newMarker, lat: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-medium mb-2 block">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="-69.123456"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                      value={newMarker.lng}
                      onChange={(e) => setNewMarker({ ...newMarker, lng: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 font-medium mb-2 block">Location Type</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                    value={newMarker.type}
                    onChange={(e) => setNewMarker({ ...newMarker, type: e.target.value })}
                  >
                    <option value="house">🏠 House</option>
                    <option value="factory">🏭 Factory</option>
                    <option value="school">🏫 School</option>
                    <option value="hospital">🏥 Hospital</option>
                    <option value="motel">🏨 Motel</option>
                    <option value="shipyard">🚢 Shipyard</option>
                    <option value="asylum">🏛️ Asylum</option>
                    <option value="church">⛪ Church</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-medium mb-2 block">Area/Region</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                    value={newMarker.area}
                    onChange={(e) => setNewMarker({ ...newMarker, area: e.target.value })}
                  >
                    <option value="USA">🇺🇸 United States</option>
                    <option value="Canada">🇨🇦 Canada</option>
                    <option value="Europe">🇪🇺 Europe</option>
                    <option value="Asia">🌏 Asia</option>
                    <option value="Other">🌍 Other</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <input
                    type="checkbox"
                    id="edit-premium"
                    checked={newMarker.premium}
                    onChange={(e) => setNewMarker({ ...newMarker, premium: e.target.checked })}
                    className="w-5 h-5 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <label htmlFor="edit-premium" className="text-gray-300 font-medium cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs px-2 py-1 rounded">PREMIUM</span>
                      Premium Location (Visible only to premium users)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="border-t border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
                    <Image size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">Location Images</h4>
                    <p className="text-gray-400">Add up to 5 images ({newMarker.images.length}/5)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addSampleImages}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <Image size={16} />
                  Add Sample Images
                </button>
              </div>

              {/* Upload Method Selection */}
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setUploadMethod("url")}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-200 ${uploadMethod === "url"
                    ? "border-green-500 bg-green-500/10 text-green-400"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                    }`}
                >
                  <Link size={20} />
                  <div className="text-left">
                    <div className="font-semibold">Paste Image URL</div>
                    <div className="text-sm">From Unsplash, Imgur, etc.</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod("upload")}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-200 ${uploadMethod === "upload"
                    ? "border-green-500 bg-green-500/10 text-green-400"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                    }`}
                >
                  <Cloud size={20} />
                  <div className="text-left">
                    <div className="font-semibold">Upload Images</div>
                    <div className="text-sm">Free cloud storage</div>
                  </div>
                </button>
              </div>

              {/* URL Input */}
              {uploadMethod === "url" && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-colors"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      disabled={newMarker.images.length >= 5}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Upload size={18} />
                      Add URL
                    </button>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-400 text-sm">
                      💡 <strong>Recommended sources:</strong> Unsplash, Imgur, Cloudinary, or any direct image URL
                    </p>
                  </div>
                </div>
              )}

              {/* Cloudinary File Upload */}
              {uploadMethod === "upload" && (
                <div className="space-y-4">
                  <div className="flex gap-3 items-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={newMarker.images.length >= 5 || uploading}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <FolderOpen size={18} />
                      {uploading ? "Uploading..." : "Choose Images"}
                    </button>
                    <span className="text-gray-400 text-sm">
                      Select multiple images • Max 10MB per file
                    </span>
                  </div>
                </div>
              )}

              {/* Preview Images */}
              {newMarker.images.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h5 className="text-gray-300 font-semibold">
                      Image Preview ({newMarker.images.length}/5)
                    </h5>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {newMarker.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-600 group-hover:border-gray-500 transition-colors">
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/300x300/1f2937/9ca3af?text=Invalid+Image";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {img.includes('cloudinary.com') ? '☁️ Cloud' : '🔗 URL'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-700">
              <div className="text-gray-400 text-sm">
                Editing location: {editingMarker?.name}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditMarker(false);
                    setEditingMarker(null);
                    toast.success('Edit cancelled');
                  }}
                  className="px-6 py-3 border border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none flex items-center gap-2"
                >
                  <Check size={18} />
                  {uploading ? "Uploading..." : "Update Location"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Markers List */}
      <div className="grid gap-4">
        {filteredMarkers.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-md mx-auto">
              <Image size={48} className="text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {activeTab === 'pending' ? 'No Pending Locations' :
                  activeTab === 'rejected' ? 'No Rejected Locations' :
                    'No Locations Found'}
              </h3>
              <p className="text-gray-400 mb-4">
                {activeTab === 'pending' ? 'All locations have been reviewed' :
                  activeTab === 'rejected' ? 'No locations have been rejected yet' :
                    'Try changing your filters or add a new location'}
              </p>
              {activeTab !== 'pending' && (
                <button
                  onClick={() => setShowAddMarker(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Add New Location
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredMarkers.map((marker) => (
            <div key={marker.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold text-white">{marker.name}</h3>
                        {getStatusBadge(marker.status, marker.premium)}
                        {marker.status === 'pending' && (
                          <div className="flex items-center gap-2 text-yellow-400 text-sm">
                            <Clock size={16} />
                            <span>Awaiting Review</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4 leading-relaxed">{marker.desc}</p>

                    {/* Creator Information */}
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <User size={16} />
                        <span>Created by: {marker.createdByEmail || 'Unknown User'}</span>
                      </div>
                      {marker.createdAt && (
                        <div className="text-gray-500">
                          {new Date(marker.createdAt.seconds * 1000).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Images Grid */}
                    {marker.images && marker.images.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Image size={16} className="text-gray-400" />
                          <span className="text-gray-400 font-medium">Images ({marker.images.length})</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {marker.images.map((img, index) => (
                            <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-700">
                              <img
                                src={img}
                                alt={`${marker.name} ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/200x200/1f2937/9ca3af?text=Image+Error";
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Coordinates</p>
                        <p className="text-gray-300 font-mono flex items-center gap-1">
                          <MapPin size={12} />
                          {marker.lat?.toFixed(6)}, {marker.lng?.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Type</p>
                        <p className="text-gray-300 capitalize">{marker.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Area</p>
                        <p className="text-gray-300">{marker.area}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Status</p>
                        <p className="text-gray-300 capitalize">{marker.status}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex lg:flex-col gap-2">
                    {/* Edit Button */}
                    <button
                      onClick={() => editMarker(marker)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium w-full justify-center"
                    >
                      <Edit size={16} />
                      Edit
                    </button>

                    {/* Pending Actions */}
                    {marker.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approveMarker(marker.id, marker.name)}
                          disabled={approvingId === marker.id}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium w-full justify-center"
                        >
                          {approvingId === marker.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Check size={16} />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => rejectMarker(marker.id, marker.name)}
                          disabled={rejectingId === marker.id}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium w-full justify-center"
                        >
                          {rejectingId === marker.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <X size={16} />
                          )}
                          Reject
                        </button>
                      </>
                    )}

                    {/* Active/Inactive Actions */}
                    {marker.status === 'active' && (
                      <button
                        onClick={() => toggleMarkerStatus(marker.id, marker.name, marker.status)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium w-full justify-center"
                      >
                        <EyeOff size={16} />
                        Deactivate
                      </button>
                    )}

                    {marker.status === 'inactive' && (
                      <button
                        onClick={() => toggleMarkerStatus(marker.id, marker.name, marker.status)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium w-full justify-center"
                      >
                        <Eye size={16} />
                        Activate
                      </button>
                    )}

                    {/* Delete Button (for all statuses) */}
                    <button
                      onClick={() => deleteMarker(marker.id, marker.name)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium w-full justify-center"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
