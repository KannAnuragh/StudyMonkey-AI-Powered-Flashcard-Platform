"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

// Mock QR Code component - removed, using qrcode.react instead

// QR Code Component
const QRCodeComponent = ({ value, size = 200 }: { value: string; size?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrModule = await import('qrcode');
        if (canvasRef.current) {
          await qrModule.toCanvas(canvasRef.current, value, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.95,
            margin: 1,
            width: size,
          });
        }
      } catch (err) {
        console.error('QR Code generation failed:', err);
        // Fallback: show text representation
        if (canvasRef.current) {
          canvasRef.current.style.display = 'none';
        }
      }
    };
    
    generateQRCode();
  }, [value, size]);

  return <canvas ref={canvasRef} />;
};

// Button Component
const Button = ({ children, variant = 'default', className = '', disabled = false, ...props }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'outline'; 
  className?: string; 
  disabled?: boolean;
  onClick?: () => void;
}) => {
  const variants: Record<'default' | 'outline', string> = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:bg-gray-400 shadow-lg hover:shadow-xl',
    outline: 'border-3 border-gray-400 bg-white hover:bg-blue-50 hover:border-blue-600 text-gray-900 hover:text-blue-700 active:bg-blue-100 shadow-md hover:shadow-lg',
  };
  
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold transition-all duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-300 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Switch Component
const Switch = ({ checked, onCheckedChange, switchRef }: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void; 
  switchRef?: React.RefObject<HTMLButtonElement | null>;
}) => (
  <button
    ref={switchRef}
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 shadow-inner ${
      checked ? 'bg-blue-600' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
        checked ? 'translate-x-7' : 'translate-x-1'
      }`}
    />
  </button>
);

// NumberFlow Mock
const NumberFlow = ({ value }: { value: number }) => <span>{value}</span>;

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  yearlyPeriod?: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  onSelect?: (plan: PricingPlan) => void;
}

// Pricing Component
function Pricing({ plans, title, description, isMonthly, onTogglePeriod }: { 
  plans: PricingPlan[]; 
  title: string; 
  description: string;
  isMonthly: boolean;
  onTogglePeriod: (isMonthly: boolean) => void;
}) {
  const switchRef = useRef<HTMLButtonElement | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleToggle = (checked: boolean) => {
    onTogglePeriod(!checked);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredCard(index);
  };

  const handleMouseLeave = () => {
    setHoveredCard(null);
  };

  return (
    <div className="w-full py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900">
            {title}
          </h2>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
            {description.split('\n').map((line: string, i: number) => (
              <React.Fragment key={i}>
                {line}
                {i < description.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        </div>

        <div className="flex justify-center items-center gap-4 mb-16">
          <span className={`text-base font-semibold transition-colors ${isMonthly ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <Switch
            switchRef={switchRef}
            checked={!isMonthly}
            onCheckedChange={handleToggle}
          />
          <span className={`text-base font-semibold transition-colors ${!isMonthly ? 'text-gray-900' : 'text-gray-500'}`}>
            Annual <span className="text-blue-600 font-bold">(Save 20%)</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {plans.map((plan: PricingPlan, index: number) => (
            <div
              key={index}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseLeave={handleMouseLeave}
              className={`rounded-3xl border-2 p-8 lg:p-10 bg-white flex flex-col relative transition-all duration-300 hover:shadow-2xl overflow-hidden ${
                plan.isPopular 
                  ? 'border-blue-600 shadow-xl ring-2 ring-blue-100' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{
                boxShadow: hoveredCard === index 
                  ? `0 0 0 1px rgba(59, 130, 246, 0.5)` 
                  : undefined,
              }}
            >
              {hoveredCard === index && (
                <div
                  className="absolute inset-0 opacity-100 pointer-events-none transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(450px 350px ellipse at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.08), transparent 60%)`,
                  }}
                />
              )}
              {plan.isPopular && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 py-1.5 px-8 rounded-full shadow-lg">
                  <span className="text-white text-xs font-bold tracking-wide">MOST POPULAR</span>
                </div>
              )}
              
              <div className="flex-1 flex flex-col">
                <div className="text-center mb-8">
                  <p className="text-xs uppercase font-bold tracking-widest text-gray-500 mb-3">
                    {plan.name}
                  </p>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-bold text-gray-900">₹</span>
                      <span className="text-6xl font-extrabold text-gray-900">
                        <NumberFlow
                          value={isMonthly ? Number(plan.price) : Math.round(Number(plan.yearlyPrice) / 12)}
                        />
                      </span>
                      {plan.period !== 'forever' && (
                        <span className="text-xl font-semibold text-gray-500">
                          /month
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-3 font-medium">
                      {plan.period === 'forever' ? 'Free forever' : isMonthly ? 'Billed monthly' : 'Billed annually'}
                    </p>
                  </div>

                  <p className="text-base text-gray-600 font-medium">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-4 flex-1 text-left mb-8 bg-gray-50 rounded-2xl p-6">
                  {plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.isPopular ? 'default' : 'outline'}
                  className={`w-full py-4 text-base font-extrabold transition-all duration-200 ${
                    plan.isPopular 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5' 
                      : 'border-3 border-gray-400 hover:border-blue-600 hover:bg-blue-50 text-gray-900 hover:text-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                  onClick={() => plan.onSelect?.(plan)}
                  disabled={false}
                >
                  {plan.buttonText}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// UPI Payment Component
interface OrderData {
  orderId: string;
  amount: number;
  upiString: string;
  upiId: string;
  merchantName: string;
}

function UpiPayment({ amount, onSuccess }: { 
  amount: number; 
  userId?: string; 
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'checking'>('pending');

  const handleCreatePayment = async () => {
    setLoading(true);
    
    setTimeout(() => {
      const merchantUpiId = 'kannanuragh@okhdfcbank';
      const merchantName = 'StudyMonkey';
      const mockOrderData: OrderData = {
        orderId: `ORD${Date.now()}`,
        amount: amount,
        upiString: `upi://pay?pa=${merchantUpiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=StudyMonkey%20Premium`,
        upiId: merchantUpiId,
        merchantName: merchantName
      };
      
      setOrderData(mockOrderData);
      setOrderCreated(true);
      setLoading(false);
      // Start automatic verification polling after QR is shown
      startAutomaticVerification(mockOrderData.orderId);
    }, 1000);
  };

  const startAutomaticVerification = (orderId: string) => {
    // Simulate automatic payment verification every 3 seconds
    const verificationInterval = setInterval(async () => {
      setPaymentStatus('checking');
      
      try {
        // In production, this would call your backend API to check payment status
        // For now, we'll simulate a successful payment after some time
        const verificationResult = await checkPaymentStatus(orderId);
        
        if (verificationResult.success) {
          setPaymentStatus('success');
          clearInterval(verificationInterval);
          setVerifyingPayment(false);
          
          // Show success message and proceed
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 1500);
        }
      } catch (error) {
        console.error('Payment verification error:', error);
      }
    }, 3000);

    setVerifyingPayment(true);
  };

  const checkPaymentStatus = async (orderId: string): Promise<{ success: boolean }> => {
    // Simulating API call to check payment status
    // In production, replace this with actual backend API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 80% chance of payment success after 15-20 seconds
        const hasPaymentCompleted = Math.random() < 0.8;
        resolve({ success: hasPaymentCompleted });
      }, Math.random() * 5000 + 3000);
    });
  };

  if (!orderCreated || !orderData) {
    return (
      <Button
        onClick={handleCreatePayment}
        disabled={loading}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white font-extrabold rounded-xl shadow-xl hover:shadow-2xl text-base transform hover:-translate-y-0.5"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span> Creating Payment...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Pay ₹{amount} via UPI
          </span>
        )}
      </Button>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* QR Code Section */}
      <div className="bg-white p-6 rounded-xl border-2 border-blue-200 shadow-md">
        <h4 className="text-base font-bold text-gray-800 mb-4 text-center">
          Scan QR Code to Pay
        </h4>
        
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-white rounded-lg border-2 border-gray-200">
            <QRCodeComponent value={orderData.upiString} size={200} />
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm text-gray-600">
            Amount: <span className="font-bold text-xl text-gray-900">₹{amount}</span>
          </p>
          <p className="text-xs text-gray-500">
            Order ID: {orderData.orderId.slice(0, 12)}...
          </p>
        </div>
      </div>

      {/* UPI Apps Section */}
      

      {/* Automatic Verification Section */}
      {verifyingPayment && (
        <div className="bg-white p-5 rounded-xl border-2 border-blue-200 shadow-md">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Verifying Payment
          </h4>
          
          {paymentStatus === 'checking' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 py-4">
                <span className="animate-spin text-2xl">⏳</span>
                <span className="text-sm text-gray-600">Checking payment status...</span>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Please keep the payment app open. Verification happens automatically.
              </p>
            </div>
          ) : paymentStatus === 'success' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 py-4 text-green-600">
                <span className="text-2xl">✓</span>
                <span className="text-sm font-semibold">Payment verified successfully!</span>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Your premium account is being activated...
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Main App Component
export default function PricingPage() {
  const [userId] = useState('user-123');
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isMonthly, setIsMonthly] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  const handlePlanSelect = (plan: PricingPlan) => {
    if (plan.name === "FREE") {
      // Redirect to signup for free plan
      window.location.href = "/signup";
    } else {
      // Show payment modal for premium plans
      setSelectedPlan(plan);
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = () => {
    alert('Payment successful! Your premium features are now active.');
    setShowPayment(false);
    setSelectedPlan(null);
    // Redirect to dashboard
    window.location.href = "/dashboard";
  };

  const pricingPlans = [
    {
      name: "FREE",
      price: "0",
      yearlyPrice: "0",
      period: "forever",
      features: [
        "Up to 50 flashcards",
        "Basic AI-generated cards",
        "Manual review mode",
        "Community support",
        "Mobile responsive"
      ],
      description: "Perfect for students getting started",
      buttonText: "Start Free",
      href: "/sign-up",
      isPopular: false,
      onSelect: handlePlanSelect,
    },
    {
      name: "PREMIUM",
      price: "299",
      yearlyPrice: "2868",
      period: "month",
      yearlyPeriod: "year",
      features: [
        "Unlimited flashcards",
        "Advanced AI generation",
        "Spaced repetition algorithm",
        "Priority support",
        "Analytics & insights",
        "Export to Anki/Quizlet",
        "Collaboration features"
      ],
      description: "Ideal for serious learners",
      buttonText: "Get Premium",
      href: "/signup",
      isPopular: true,
      onSelect: handlePlanSelect,
    },
    {
      name: "PRO",
      price: "599",
      yearlyPrice: "5748",
      period: "month",
      yearlyPeriod: "year",
      features: [
        "Everything in Premium",
        "Custom AI model training",
        "Team management (5 users)",
        "Advanced analytics",
        "API access",
        "Dedicated account manager",
        "Custom integrations",
        "Priority feature requests"
      ],
      description: "For educators and institutions",
      buttonText: "Go Pro",
      href: "/signup",
      isPopular: false,
      onSelect: handlePlanSelect,
    },
  ];

  const selectedAmount = selectedPlan 
    ? (isMonthly ? Number(selectedPlan.price) : Number(selectedPlan.yearlyPrice))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="pt-16 pb-20">
        <Pricing
          plans={pricingPlans}
          title="Pick your StudyMonkey plan"
          description="Choose the plan that fits your learning needs. All tiers include AI flashcards, smart reviews, and support."
          isMonthly={isMonthly}
          onTogglePeriod={setIsMonthly}
        />
      </div>

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedPlan.name} Plan</h3>
                  <p className="text-gray-600 mt-1">Complete your payment</p>
                </div>
                <button
                  onClick={() => setShowPayment(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Amount to pay:</span>
                  <span className="text-3xl font-bold text-blue-600">₹{selectedAmount}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {isMonthly ? 'Billed monthly' : 'Billed annually (Save 20%)'}
                </p>
              </div>
            </div>
            <div className="p-6">
              <UpiPayment
                amount={selectedAmount}
                userId={userId}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}