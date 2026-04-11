import React, { useState } from 'react';
import { X, Calendar, Upload, Check } from 'lucide-react';
import { doc, addDoc, collection, updateDoc, getDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadToCloudinary } from '../utils/cloudinary';
import toast from 'react-hot-toast';

const IntelSubmissionModal = ({
    isOpen,
    onClose,
    locationId,
    userId,
    userName,
    userEmail,
    userStatus
}) => {

    const [dateObserved, setDateObserved] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [confidence, setConfidence] = useState('medium');
    const [observations, setObservations] = useState([]);
    const [photo, setPhoto] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const observationOptions = [
        { id: 'buildingStanding', label: 'Building still standing' },
        { id: 'exteriorAccess', label: 'Exterior access observed' },
        { id: 'securityPresence', label: 'Security presence observed' },
        { id: 'maintenanceSigns', label: 'Signs of maintenance' },
        { id: 'redevelopmentSigns', label: 'Signs of redevelopment' }
    ];

    const handleObservationToggle = (id) => {
        setObservations(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (observations.length === 0) {
            toast.error('Please select at least one observation');
            return;
        }

        setSubmitting(true);
        try {
            let photoURL = null;
            if (photo) {
                photoURL = await uploadToCloudinary(photo);
            }

            await addDoc(collection(db, 'intelSubmissions'), {
                locationId,
                userId,
                userName,
                userEmail,
                dateObserved,
                confidence,
                observations,
                photoURL,
                createdAt: new Date()
            });

            const locationRef = doc(db, 'Markers', locationId);
            const locationSnap = await getDoc(locationRef);
            const locationData = locationSnap.data();

            const currentStatus = locationData.status || 'fresh';
            const isStale = currentStatus === 'stale';

            const updateData = {
                status: 'fresh',
                lastVerified: new Date(),
                totalIntelSubmissions: increment(1)
            };

            observations.forEach(obs => {
                updateData[`observationCounts.${obs}`] = increment(1);
            });

            await updateDoc(locationRef, updateData);

            const userRef = doc(db, 'user1', userId);

            let pointsToAdd = photoURL ? 15 : 10;
            
            
            if (userStatus == 'Premium') {
                pointsToAdd *= 2;
            }

            if (isStale) {
                pointsToAdd += 10;
            }

            await updateDoc(userRef, {
                points: increment(pointsToAdd)
            });

            toast.success(`Intel submitted! +${pointsToAdd} points earned`);
            onClose();

        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Failed to submit intel');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-md mx-auto my-8 max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">Submit Intel</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                    {/* Date Observed */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date Observed
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="date"
                                value={dateObserved}
                                onChange={(e) => setDateObserved(e.target.value)}
                                className="w-full pl-10 border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* Confidence Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confidence Level
                        </label>
                        <select
                            value={confidence}
                            onChange={(e) => setConfidence(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    {/* Observations */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observations (Select all that apply)
                        </label>
                        <div className="space-y-2">
                            {observationOptions.map((option) => (
                                <label key={option.id} className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={observations.includes(option.id)}
                                        onChange={() => handleObservationToggle(option.id)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Photo Upload (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Photo (Optional)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
                            <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                            <p className="text-sm text-gray-500 mb-2">
                                Upload verification photo
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPhoto(e.target.files[0])}
                                className="hidden"
                                id="photo-upload"
                            />
                            <label
                                htmlFor="photo-upload"
                                className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm cursor-pointer"
                            >
                                Choose File
                            </label>
                            {photo && (
                                <p className="text-xs text-gray-500 mt-2">{photo.name}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || observations.length === 0}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Check size={16} />
                                Submit Intel
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IntelSubmissionModal;