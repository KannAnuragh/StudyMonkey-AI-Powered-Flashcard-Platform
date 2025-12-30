'use client';

import { useState, useEffect } from 'react';
import UpiPayment from '@/components/RazorpayButton';

export default function PremiumPage() {
  const [userId, setUserId] = useState('user-123'); // TODO: Get from auth context

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Premium</span>
          </h1>
          <p className="text-lg text-gray-600">
            Unlock unlimited AI flashcards and advanced features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Features Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            <div className="mb-6">
              <div className="inline-block px-4 py-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-4">
                <span className="text-sm font-semibold text-purple-700">Premium Features</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">₹499</h2>
              <p className="text-gray-500">One-time payment</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Unlimited Flashcards</p>
                  <p className="text-sm text-gray-500">Generate as many cards as you need</p>
                </div>
              </li>
              
              <li className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">AI-Powered Language Learning</p>
                  <p className="text-sm text-gray-500">Advanced vocab, grammar & sentence cards</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Priority Support</p>
                  <p className="text-sm text-gray-500">Get help when you need it</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Advanced Study Stats</p>
                  <p className="text-sm text-gray-500">Track your learning progress</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Cloud Sync</p>
                  <p className="text-sm text-gray-500">Access your decks anywhere</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Lifetime Updates</p>
                  <p className="text-sm text-gray-500">Free access to new features</p>
                </div>
              </li>
            </ul>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>🔒</span>
                <span>Secure UPI payment • No recurring charges</span>
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Choose Payment Method</h3>
              <p className="text-sm text-gray-600">Pay securely with any UPI app</p>
            </div>

            <div className="flex flex-col items-center">
              <UpiPayment 
                amount={499} 
                userId={userId}
                onSuccess={() => {
                  console.log('Payment successful! Upgrade user to premium...');
                  // TODO: Refresh user data and redirect to dashboard
                  alert('Welcome to Premium! 🎉 Redirecting to dashboard...');
                  setTimeout(() => {
                    window.location.href = '/dashboard';
                  }, 2000);
                }} 
              />
            </div>

            {/* Payment Instructions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">How it works:</h4>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Click "Pay via UPI" button above</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Scan QR code or click your UPI app</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Complete payment in your UPI app</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-blue-600">4.</span>
                  <span>Enter Transaction ID to verify</span>
                </li>
              </ol>
            </div>

            {/* Supported Apps */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-600 mb-2 text-center">Supported UPI Apps:</p>
              <div className="flex justify-center items-center gap-3 flex-wrap">
                <span className="text-2xl">🟢</span>
                <span className="text-xs text-gray-600">Google Pay</span>
                <span className="text-gray-300">•</span>
                <span className="text-2xl">🟣</span>
                <span className="text-xs text-gray-600">PhonePe</span>
                <span className="text-gray-300">•</span>
                <span className="text-2xl">🔵</span>
                <span className="text-xs text-gray-600">Paytm</span>
                <span className="text-gray-300">•</span>
                <span className="text-2xl">🟠</span>
                <span className="text-xs text-gray-600">BHIM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            🔐 100% Secure Payment • 🇮🇳 Made in India • ⚡ Instant Activation
          </p>
        </div>
      </div>
    </div>
  );
}
