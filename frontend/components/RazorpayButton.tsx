'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface UpiPaymentProps {
  amount: number;
  userId: string;
  onSuccess?: () => void;
}

interface OrderData {
  orderId: string;
  amount: number;
  upiString: string;
  upiId: string;
  merchantName: string;
}

export default function UpiPayment({ amount, userId, onSuccess }: UpiPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleCreatePayment = async () => {
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8081/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userId }),
      });

      if (!res.ok) throw new Error('Failed to create payment');
      const data = await res.json();
      
      setOrderData(data);
      setOrderCreated(true);
    } catch (error) {
      console.error(error);
      alert('Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!transactionId.trim()) {
      alert('Please enter your UPI Transaction ID');
      return;
    }

    if (!orderData) {
      alert('Order data not found. Please create a new payment.');
      return;
    }

    setVerifying(true);

    try {
      const res = await fetch('http://localhost:8081/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          transactionId: transactionId.trim(),
          userId,
        }),
      });

      const data = await res.json();
      
      if (data.status === 'success') {
        alert('Payment verified successfully! 🎉');
        if (onSuccess) onSuccess();
      } else {
        alert('Payment verification failed. Please check your transaction ID.');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to verify payment. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const upiApps = [
    { name: 'Google Pay', icon: '🟢', link: 'gpay' },
    { name: 'PhonePe', icon: '🟣', link: 'phonepe' },
    { name: 'Paytm', icon: '🔵', link: 'paytm' },
    { name: 'BHIM', icon: '🟠', link: 'bhim' },
  ];

  if (!orderCreated || !orderData) {
    return (
      <button
        onClick={handleCreatePayment}
        disabled={loading}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <span>Creating Payment...</span>
        ) : (
          <>
            <span>Pay ₹{amount} via UPI</span>
            <span>💳</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      {/* QR Code Section */}
      <div className="bg-white p-6 rounded-xl border-2 border-blue-200 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
          Scan QR Code to Pay
        </h3>
        
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
            <QRCodeSVG 
              value={orderData.upiString} 
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Amount: <span className="font-bold text-lg">₹{amount}</span>
          </p>
          <p className="text-xs text-gray-500">
            Order ID: {orderData.orderId.slice(0, 8)}...
          </p>
        </div>
      </div>

      {/* UPI Apps Section */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
        <h3 className="text-md font-semibold text-gray-700 mb-4 text-center">
          Or Pay with Your Favorite App
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          {upiApps.map((app) => (
            <a
              key={app.name}
              href={orderData.upiString}
              className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all hover:shadow-md"
            >
              <span className="text-2xl">{app.icon}</span>
              <span className="font-medium text-gray-700">{app.name}</span>
            </a>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">Pay to UPI ID:</p>
          <code className="text-sm font-mono bg-white px-3 py-1 rounded border border-gray-300">
            {orderData.upiId}
          </code>
        </div>
      </div>

      {/* Verification Section */}
      <div className="bg-white p-6 rounded-xl border-2 border-green-200 shadow-lg">
        <h3 className="text-md font-semibold text-gray-700 mb-4">
          ✅ After Payment Complete
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Enter your UPI Transaction ID (UTR/Ref No.) to verify payment:
        </p>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="e.g., 234567890123"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm"
          />
          
          <button
            onClick={handleVerifyPayment}
            disabled={verifying || !transactionId.trim()}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? 'Verifying...' : 'Verify Payment & Activate Premium'}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          Find Transaction ID in your UPI app&apos;s payment history
        </p>
      </div>
    </div>
  );
}
