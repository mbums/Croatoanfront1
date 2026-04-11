import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Check, 
  X, 
  Calendar, 
  MapPin, 
  User,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from "../../firebase/config";
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function ImagesTab({ images, loading, onImagesUpdate }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Sort images: pending first, then approved, then rejected
  const sortedImages = [...images].sort((a, b) => {
    const statusOrder = { pending: 0, active: 1, rejected: 2 };
    const aOrder = statusOrder[a.status] ?? 3;
    const bOrder = statusOrder[b.status] ?? 3;
    
    if (aOrder !== bOrder) return aOrder - bOrder;
    
    return new Date(b.createdAt?.toDate?.() || b.createdAt) - 
           new Date(a.createdAt?.toDate?.() || a.createdAt);
  });

  const pendingCount = images.filter(img => img.status === 'pending').length;
  const approvedCount = images.filter(img => img.status === 'active').length;
  const rejectedCount = images.filter(img => img.status === 'rejected').length;

  const handleApproveImage = async (image) => {
    if (processing) return;
    
    setProcessing(true);
    try {
      // 1. Update status in Images collection
      const imageRef = doc(db, "Images", image.id);
      await updateDoc(imageRef, {
        status: "active"
      });

      // 2. Add image to Markers collection
      const markerRef = doc(db, "Markers", image.markerId);
      const markerDoc = await getDoc(markerRef);
      
      if (markerDoc.exists()) {
        const markerData = markerDoc.data();
        const currentImages = markerData.images || [];
        
        // Check if image already exists
        if (!currentImages.includes(image.imageUrl)) {
          await updateDoc(markerRef, {
            images: [...currentImages, image.imageUrl]
          });
          console.log('Image added to marker:', image.imageUrl);
        } else {
          console.log('Image already exists in marker');
        }
      } else {
        console.error('Marker not found:', image.markerId);
        toast.error('Marker not found!');
        setProcessing(false);
        return;
      }

      toast.success('Image approved successfully!');
      onImagesUpdate(); // Refresh the images list
    } catch (error) {
      console.error("Error approving image:", error);
      toast.error(`Failed to approve image: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectImage = async (image) => {
    if (processing) return;
    
    const result = await Swal.fire({
      title: 'Reject Image?',
      text: 'Are you sure you want to reject this image? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'Cancel',
      background: '#111827',
      color: '#fff',
      customClass: {
        popup: 'border border-gray-800'
      }
    });
    
    if (!result.isConfirmed) return;
    
    setProcessing(true);
    try {
      // Update status to rejected
      const imageRef = doc(db, "Images", image.id);
      await updateDoc(imageRef, {
        status: "rejected"
      });

      toast.success('Image rejected');
      onImagesUpdate();
    } catch (error) {
      console.error("Error rejecting image:", error);
      toast.error('Failed to reject image');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/10 p-3 rounded-lg">
              <Clock className="text-yellow-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/10 p-3 rounded-lg">
              <CheckCircle className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Approved</p>
              <p className="text-2xl font-bold text-green-500">{approvedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-3 rounded-lg">
              <XCircle className="text-red-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <ImageIcon className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Images</p>
              <p className="text-2xl font-bold">{images.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      {sortedImages.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <ImageIcon className="text-gray-600 mx-auto mb-4" size={48} />
          <p className="text-gray-400">No images uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedImages.map((image) => (
            <div
              key={image.id}
              className={`bg-gray-900 border rounded-lg overflow-hidden hover:border-green-500 transition-colors ${
                image.status === 'pending' 
                  ? 'border-yellow-500/50' 
                  : image.status === 'rejected'
                  ? 'border-red-500/50'
                  : 'border-gray-800'
              }`}
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-800">
                <img
                  src={image.imageUrl}
                  alt="Uploaded"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                />
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${
                  image.status === 'pending'
                    ? 'bg-yellow-500 text-black'
                    : image.status === 'rejected'
                    ? 'bg-red-500 text-white'
                    : 'bg-green-500 text-black'
                }`}>
                  {image.status === 'pending' ? 'Pending' : image.status === 'rejected' ? 'Rejected' : 'Approved'}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-gray-300 truncate">{image.markerName || 'Unknown Location'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <User size={16} className="text-gray-400" />
                  <span className="text-gray-300 truncate">
                    {image.uploadedBy?.name || image.uploadedBy?.email || 'Unknown'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-gray-400">
                    {image.createdAt?.toDate?.().toLocaleDateString() || 
                     new Date(image.createdAt).toLocaleDateString() || 
                     'Unknown date'}
                  </span>
                </div>

                {/* Action Buttons */}
                {image.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleApproveImage(image)}
                      disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectImage(image)}
                      disabled={processing}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </div>
                )}

                {image.status === 'active' && (
                  <div className="pt-2">
                    <div className="bg-green-500/10 text-green-500 px-3 py-2 rounded-lg text-center text-sm font-semibold">
                      ✓ Already Approved
                    </div>
                  </div>
                )}

                {image.status === 'rejected' && (
                  <div className="pt-2">
                    <div className="bg-red-500/10 text-red-500 px-3 py-2 rounded-lg text-center text-sm font-semibold">
                      ✗ Rejected
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">Image Details</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <img
                src={selectedImage.imageUrl}
                alt="Preview"
                className="w-full rounded-lg"
              />

              <div className="space-y-3 bg-gray-950 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-semibold ${
                    selectedImage.status === 'pending' 
                      ? 'text-yellow-500' 
                      : selectedImage.status === 'rejected'
                      ? 'text-red-500'
                      : 'text-green-500'
                  }`}>
                    {selectedImage.status === 'pending' ? 'Pending' : selectedImage.status === 'rejected' ? 'Rejected' : 'Approved'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Location:</span>
                  <span className="font-semibold">{selectedImage.markerName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Uploaded By:</span>
                  <span className="font-semibold">
                    {selectedImage.uploadedBy?.name || selectedImage.uploadedBy?.email}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Upload Date:</span>
                  <span className="font-semibold">
                    {selectedImage.createdAt?.toDate?.().toLocaleString() || 
                     new Date(selectedImage.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Marker ID:</span>
                  <span className="font-semibold text-sm">{selectedImage.markerId}</span>
                </div>
              </div>

              {selectedImage.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleApproveImage(selectedImage);
                      setSelectedImage(null);
                    }}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check size={20} />
                    Approve Image
                  </button>
                  <button
                    onClick={() => {
                      handleRejectImage(selectedImage);
                      setSelectedImage(null);
                    }}
                    disabled={processing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X size={20} />
                    Reject Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
