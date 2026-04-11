import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export default function PaymentCanceled() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border border-red-500 max-w-md w-full">
                {/* Header */}
                <div className="p-6 text-center border-b border-gray-800">
                    <div className="flex justify-center mb-4">
                        <div className="bg-red-500 rounded-full p-3">
                            <XCircle size={48} className="text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Payment Canceled</h1>
                    <p className="text-red-400">Your payment was not completed</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-gray-300 text-center">
                            You can try again anytime. No charges were made to your account.
                        </p>
                    </div>

                    {/* Common Reasons */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-3 text-center">Common Reasons</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                Changed your mind
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                Payment method issues
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                Network connection problem
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                Window closed accidentally
                            </li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={20} />
                            Try Again
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 text-center">
                    <p className="text-gray-400 text-sm">
                        Having trouble? Contact{" "}
                        <a href="mailto:officialmbums@gmail.com" className="text-blue-400 hover:underline">
                            officialmbums@gmail.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}