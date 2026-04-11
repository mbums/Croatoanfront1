import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LegalGateway() {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const navigate = useNavigate();

  // Check if user already agreed
  useEffect(() => {
    const agreed = localStorage.getItem('croatoanLegalAgreed');
    if (agreed === 'true') {
      navigate('/');
    }
  }, [navigate]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolled(true);
    }
  };

  const handleAgree = () => {
    if (hasAgreed && hasScrolled) {
      localStorage.setItem('croatoanLegalAgreed', 'true');
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
              <style jsx>{`
        .custom-checkbox {
          appearance: none;
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border: 2px solid #6b7280;
          border-radius: 4px;
          background-color: #374151;
          cursor: pointer;
          position: relative;
        }
        .custom-checkbox:checked {
          background-color: #dc2626;
          border-color: #dc2626;
        }
        .custom-checkbox:checked::after {
          content: '✓';
          position: absolute;
          color: white;
          font-size: 16px;
          font-weight: bold;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .custom-checkbox:focus {
          outline: none;
          ring: 2px solid #dc2626;
        }
      `}</style>
        <div className="bg-gray-900 rounded-2xl border border-red-600 max-w-4xl w-full h-auto">
        {/* Header */}
        <div className="bg-red-600 rounded-2xl p-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            ⚠️ CROATOAN - 18+ LEGAL GATEWAY
          </h1>
          <p className="text-red-100 text-lg">
            You must read and agree to all terms before entering
          </p>
        </div>

        {/* Legal Text Container */}
        <div className="p-6">
          <div 
            className="bg-gray-800 rounded-lg p-6 h-[50vh] sm:h-[60vh] overflow-y-auto mb-6 border border-gray-700"
            onScroll={handleScroll}
          >
            <div className="text-white space-y-8">
              
              {/* 18+ Entry Notice */}
              <section>
                <h2 className="text-2xl font-bold text-red-400 mb-4">
                  CROATOAN — 18+ ENTRY NOTICE / WARNING PAGE
                </h2>
                <div className="space-y-3 text-gray-300">
                  <p className="text-lg font-semibold text-red-300">🚨 WARNING — 18+ ONLY</p>
                  <p>
                    Croatoan contains content involving abandoned and hazardous locations. 
                    This site is intended for adults only.
                  </p>
                  <p className="font-semibold">By continuing, you acknowledge:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You are 18 or older</li>
                    <li>Croatoan is for photography + historical interest only</li>
                    <li>You will not enter any abandoned or private property</li>
                    <li>You take full responsibility for your actions</li>
                    <li>Croatoan is not liable for injury, arrest, or damages</li>
                  </ul>
                </div>
                <p className="text-gray-400 text-sm mt-4">Last Updated: November 13, 2025</p>
              </section>

              {/* Terms of Use */}
              <section>
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">
                  1. CROATOAN — TERMS OF USE
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>Welcome to Croatoan ("we," "us," "our"). By accessing or using our website, you agree to the following Terms of Use. If you do not agree, do not use the website.</p>
                  
                  <div>
                    <p className="font-semibold">1. Purpose of the Website</p>
                    <p>Croatoan is for photographic exploration, historical interest, and urban documentation only. The locations shown may include abandoned, unsafe, or private properties. We do not encourage, promote, or endorse trespassing, breaking and entering, or accessing any restricted area.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">2. Age Requirement</p>
                    <p>This website is intended for 18+ users only. By using the website, you confirm that you are at least 18 years old.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">3. No Trespassing</p>
                    <p>You agree that you will:</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Not enter any private property</li>
                      <li>Comply with all local, state, and federal laws</li>
                      <li>Respect all no-trespassing signs, barriers, and posted restrictions</li>
                      <li>Use the information only for photography reference and historical interest</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold">4. Use of Information</p>
                    <p>All coordinates, locations, descriptions, and photos on Croatoan are:</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>For informational and artistic purposes only</li>
                      <li>Not a guide for physical exploration</li>
                      <li>Not permission to access any property</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold">5. Limitation of Liability</p>
                    <p>Croatoan is not responsible for:</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Injury, harm, or death</li>
                      <li>Arrests, fines, detainment, or legal issues</li>
                      <li>Property damage</li>
                      <li>Any consequences from visiting or attempting to visit locations listed</li>
                      <li>Inaccurate or outdated information</li>
                      <li>User-submitted content</li>
                    </ul>
                    <p className="mt-2">You use the site at your own risk.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">6. User Accounts</p>
                    <p>Users are responsible for maintaining the security of their accounts. Croatoan may suspend accounts that violate our Terms.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">7. Subscriptions & Points</p>
                    <p>Premium subscriptions give users additional points, not automatic access to all premium locations. Unlocked locations still do not grant permission to visit them.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">8. Intellectual Property</p>
                    <p>All logos, designs, databases, and content belong to Croatoan. No content may be copied or redistributed without permission.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">9. Termination</p>
                    <p>Croatoan may suspend or terminate accounts at any time.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">10. Changes to Terms</p>
                    <p>We may update these Terms at any time. Continued use of the website means you accept the updates.</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-4">Last Updated: November 13, 2025</p>
              </section>

              {/* Privacy Policy */}
              <section>
                <h2 className="text-2xl font-bold text-green-400 mb-4">
                  2. CROATOAN — PRIVACY POLICY
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>This Privacy Policy explains how Croatoan collects, uses, and protects your information.</p>
                  
                  <div>
                    <p className="font-semibold">1. Information We Collect</p>
                    <p>We may collect:</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Email, username, and password</li>
                      <li>Location submissions</li>
                      <li>Comments</li>
                      <li>Subscription/payment details (handled by Stripe)</li>
                      <li>Device data and analytics</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold">2. How We Use Your Information</p>
                    <p>We use your information to:</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Operate and improve the website</li>
                      <li>Manage accounts</li>
                      <li>Process subscriptions</li>
                      <li>Prevent fraud or abuse</li>
                      <li>Provide customer support</li>
                    </ul>
                    <p className="mt-2">We never sell personal data.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">3. Stripe Payments</p>
                    <p>All payments are securely processed through Stripe. Croatoan does not store any payment card information.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">4. Cookies & Tracking</p>
                    <p>Cookies may be used for login sessions, preferences, and analytics.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">5. User Content</p>
                    <p>Any submitted locations, images, or comments may be visible to other users.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">6. Data Removal</p>
                    <p>You can request account deletion or data removal at any time.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">7. Security</p>
                    <p>We use industry-standard security but cannot guarantee 100% protection.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">8. Children</p>
                    <p>Croatoan is 18+ only.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">9. Updates</p>
                    <p>We may update this Privacy Policy at any time.</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-4">Last Updated: November 13, 2025</p>
              </section>

              {/* Legal Disclaimer */}
              <section>
                <h2 className="text-2xl font-bold text-orange-400 mb-4">
                  3. CROATOAN — LEGAL DISCLAIMER
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>Croatoan is an informational and photography reference website.</p>
                  
                  <div>
                    <p className="font-semibold">1. No Encouragement of Trespassing</p>
                    <p>Croatoan does NOT encourage or endorse:</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Trespassing</li>
                      <li>Breaking and entering</li>
                      <li>Visiting unsafe or restricted areas</li>
                      <li>Illegal activity of any kind</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold">2. Accuracy of Information</p>
                    <p>Location data may be:</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Inaccurate</li>
                      <li>Outdated</li>
                      <li>Dangerous to visit</li>
                      <li>Submitted by users</li>
                    </ul>
                    <p className="mt-2">No guarantee is made regarding safety or legality.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">3. Assumption of Risk</p>
                    <p>By using Croatoan, you accept full responsibility for your actions. Croatoan is not liable for injuries, deaths, arrests, or damages.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">4. No Professional Advice</p>
                    <p>Nothing on the website should be taken as permission or legal advice.</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-4">Last Updated: November 13, 2025</p>
              </section>

            </div>
          </div>

          {/* Agreement Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-start space-x-3 mb-4">
              <input
                type="checkbox"
                id="agree"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
              />
              <label htmlFor="agree" className="text-white text-lg">
                "I have read and agree to the Terms of Use, Privacy Policy, and Legal Disclaimer."
              </label>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleAgree}
                disabled={!hasAgreed || !hasScrolled}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold text-lg transition-all ${
                  hasAgreed && hasScrolled
                    ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {hasScrolled ? 'ENTER CROATOAN' : 'SCROLL TO BOTTOM TO ENABLE'}
              </button>
            </div>
            
            {!hasScrolled && (
              <p className="text-red-400 text-sm mt-2 text-center">
                Please scroll to the bottom of all terms to enable entry
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}