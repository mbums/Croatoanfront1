import React, { useState, useEffect } from "react";
import { X, Upload, MapPin, Cloud, Crosshair } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { uploadToCloudinary } from "../../utils/cloudinary";
import toast from "react-hot-toast";

function AddLocationModal({ isOpen, onClose, user, onLocationAdded, onRequestMapClick }) {
  console.log('user', user);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lat: "",
    lng: "",
    type: "abandoned",
    area: "",
    isPremium: false,
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (isOpen && window.mapClickCoordinates) {
      const { lat, lng } = window.mapClickCoordinates;
      setFormData(prev => ({
        ...prev,
        lat: lat.toString(),
        lng: lng.toString()
      }));
      window.mapClickCoordinates = null;
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.images.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    setUploadingImages(true);
    const uploadToast = toast.loading(`Uploading ${files.length} image(s) to Cloudinary...`);

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
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      setImageFiles(prev => [...prev, ...files]);
      toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)`);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
      toast.dismiss(uploadToast);
    }
  };

  const removeImage = (index) => {
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    const newImages = formData.images.filter((_, i) => i !== index);
    
    setImageFiles(newImageFiles);
    setFormData(prev => ({ ...prev, images: newImages }));
    toast.success('Image removed');
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString()
          }));
          toast.success("Current location fetched!");
        },
        (error) => {
          toast.error("Failed to get current location");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to add location");
      return;
    }

    if (!formData.name.trim() || !formData.description.trim() || !formData.lat || !formData.lng) {
      toast.error("Please fill all required fields");
      return;
    }

    // if (formData.images.length === 0) {
    //   toast.error("Please upload at least one image");
    //   return;
    // }

    setLoading(true);

    try {
      const locationData = {
        name: formData.name.trim(),
        desc: formData.description.trim(),
        lat: Number(formData.lat),
        lng: Number(formData.lng),
        type: formData.type,
        area: formData.area.trim() || "Unknown",
        premium: formData.isPremium && user.premium,
        premium: formData.isPremium && (user.email === "admin@gmail.com" || user.premium),
        images: formData.images,
        status: "pending",
        createdBy: user.uid,
        createdByEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        comments: []
      };

      const docRef = await addDoc(collection(db, "Markers"), locationData);
      
      toast.success("Location submitted for admin approval!");
      
      setFormData({
        name: "",
        description: "",
        lat: "",
        lng: "",
        type: "abandoned",
        area: "",
        isPremium: false,
        images: []
      });
      setImageFiles([]);
      
      if (onLocationAdded) {
        onLocationAdded();
      }
      
      onClose();
    } catch (error) {
      console.error("Error adding location:", error);
      toast.error("Failed to add location");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Add New Location</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              placeholder="Enter location name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              placeholder="Describe this location..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude *
              </label>
              <input
                type="number"
                step="any"
                name="lat"
                value={formData.lat}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                placeholder="44.123456"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude *
              </label>
              <input
                type="number"
                step="any"
                name="lng"
                value={formData.lng}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                placeholder="-69.123456"
                required
              />
            </div>
          </div>

          {/* Location Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={getCurrentLocation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <MapPin size={16} />
              Use Current Location
            </button>
            
            <button
              type="button"
              onClick={onRequestMapClick}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              <Crosshair size={16} />
              Tap Map to choose the coordinates
            </button>
          </div>

          {/* Rest of the form remains same */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
              >
                <option value="abandoned">Abandoned</option>
                <option value="factory">Factory</option>
                <option value="school">School</option>
                <option value="hospital">Hospital</option>
                <option value="house">House</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area
              </label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                placeholder="City or Region"
              />
            </div>
          </div>

          {user?.premium || user?.email == 'admin@gmail.com' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPremium"
                checked={formData.isPremium}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Mark as Premium Location
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images * (Max 5) - Cloudinary Storage
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="cloudinary-upload"
                disabled={uploadingImages || formData.images.length >= 5}
              />
              <label
                htmlFor="cloudinary-upload"
                className={`flex flex-col items-center justify-center cursor-pointer ${
                  uploadingImages || formData.images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Cloud size={24} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 text-center">
                  {uploadingImages ? "Uploading..." : "Click to upload images"}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Max 5 images 
                </span>
              </label>
            </div>

            {formData.images.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Uploaded Images ({formData.images.length}/5)
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Cloudinary Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-opacity duration-200"
                        >
                          ×
                        </button>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                        ☁️
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                "Submit Location"
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            * Your location will be reviewed by admin before becoming publicly visible
            <br />
            * Images are securely stored on Cloudinary
          </p>
        </form>
      </div>
    </div>
  );
}

export default AddLocationModal;
