import React, { useState, useRef } from 'react';
import { Check, Star, CheckCircle } from 'lucide-react';

// Mock QR Code component
const QRCodeMock = ({ value, size }: { value: string; size: number }) => (
  <div 
    style={{ width: size, height: size }}
    className="bg-gray-100 border-4 border-gray-800 flex items-center justify-center"
  >
    <div className="text-center p-4">
      <div className="text-xs font-mono break-all">{value.slice(0, 30)}...</div>
    </div>
  </div>
);

// Button Component
const Button = ({ children, variant = 'default', className = '', disabled = false, ...props }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'outline'; 
  className?: string; 
  disabled?: boolean;
  onClick?: () => void;
}) => {
  const variants: Record<'default' | 'outline', string> = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50',
    outline: 'border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-900',
  };
  
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all disabled:cursor-not-allowed ${variants[variant]} ${className}`}
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
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-blue-600' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
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
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  onSelect?: (plan: PricingPlan) => void;
}

// Pricing Component
function Pricing({ plans, title, description }: { 
  plans: PricingPlan[]; 
  title: string; 
  description: string;
}) {
  const [isMonthly, setIsMonthly] = useState(true);
  const switchRef = useRef<HTMLButtonElement | null>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
  };

  return (
    <div className="w-full py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{title}</h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
            {description.split('\n').map((line: string, i: number) => (
              <React.Fragment key={i}>
                {line}
                {i < description.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        </div>

        <div className="flex justify-center items-center gap-3 mb-12">
          <span className={`font-semibold transition-colors ${isMonthly ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <Switch
            switchRef={switchRef}
            checked={!isMonthly}
            onCheckedChange={handleToggle}
          />
          <span className={`font-semibold transition-colors ${!isMonthly ? 'text-gray-900' : 'text-gray-500'}`}>
            Annual <span className="text-blue-600">(Save 20%)</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan: PricingPlan, index: number) => (
            <div
              key={index}
              className={`rounded-2xl border-2 p-8 bg-white text-center flex flex-col relative transition-all hover:shadow-xl ${
                plan.isPopular 
                  ? 'border-blue-600 shadow-2xl md:scale-105 md:-mt-4 md:mb-4' 
                  : 'border-gray-200 shadow-md'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 py-2 px-6 rounded-full flex items-center gap-2 shadow-lg">
                  <Star className="text-white h-4 w-4 fill-current" />
                  <span className="text-white text-sm font-bold">MOST POPULAR</span>
                </div>
              )}
              
              <div className="flex-1 flex flex-col">
                <p className="text-sm uppercase font-bold tracking-wider text-gray-500 mb-4">
                  {plan.name}
                </p>
                
                <div className="mb-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-gray-900">
                      ₹<NumberFlow
                        value={isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)}
                      />
                    </span>
                    {plan.period !== 'Next 3 months' && (
                      <span className="text-lg font-medium text-gray-600">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {isMonthly ? 'billed monthly' : 'billed annually'}
                  </p>
                </div>

                <p className="text-sm text-gray-600 mb-6 min-h-10">
                  {plan.description}
                </p>

                <ul className="space-y-4 flex-1 text-left mb-8">
                  {plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.isPopular ? 'default' : 'outline'}
                  className={`w-full py-3 text-base font-semibold ${
                    plan.isPopular 
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-lg' 
                      : 'hover:border-blue-600 hover:text-blue-600'
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
  const [transactionId, setTransactionId] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleCreatePayment = async () => {
    setLoading(true);
    
    setTimeout(() => {
      const mockOrderData: OrderData = {
        orderId: `ORD${Date.now()}`,
        amount: amount,
        upiString: `upi://pay?pa=merchant@paytm&pn=StudyMonkey&am=${amount}&cu=INR&tn=Payment`,
        upiId: 'merchant@paytm',
        merchantName: 'StudyMonkey'
      };
      
      setOrderData(mockOrderData);
      setOrderCreated(true);
      setLoading(false);
    }, 1000);
  };

  const handleVerifyPayment = async () => {
    if (!transactionId.trim()) {
      alert('Please enter your UPI Transaction ID');
      return;
    }

    setVerifying(true);
    
    setTimeout(() => {
      alert('Payment verified successfully! 🎉');
      setVerifying(false);
      if (onSuccess) onSuccess();
    }, 1500);
  };

  const upiApps = [
    { name: 'Google Pay', icon: '🟢' },
    { name: 'PhonePe', icon: '🟣' },
    { name: 'Paytm', icon: '🔵' },
    { name: 'BHIM', icon: '🟠' },
  ];

  if (!orderCreated || !orderData) {
    return (
      <Button
        onClick={handleCreatePayment}
        disabled={loading}
        className="w-full px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg text-base"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span> Creating Payment...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Pay ₹{amount} via UPI 💳
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
            <QRCodeMock value={orderData.upiString} size={180} />
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
      <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
          Or Pay with Your Favorite App
        </h4>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          {upiApps.map((app) => (
            <a
              key={app.name}
              href={orderData.upiString}
              className="flex items-center justify-center gap-2 p-2.5 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all hover:shadow-md text-sm"
            >
              <span className="text-xl">{app.icon}</span>
              <span className="font-medium text-gray-700">{app.name}</span>
            </a>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Pay to UPI ID:</p>
          <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-300">
            {orderData.upiId}
          </code>
        </div>
      </div>

      {/* Verification Section */}
      <div className="bg-white p-5 rounded-xl border-2 border-green-200 shadow-md">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          After Payment Complete
        </h4>
        
        <p className="text-xs text-gray-600 mb-3">
          Enter your UPI Transaction ID (UTR/Ref No.) to verify payment:
        </p>

        <div className="space-y-2">
          <input
            type="text"
            placeholder="e.g., 234567890123"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm"
          />
          
          <Button
            onClick={handleVerifyPayment}
            disabled={verifying || !transactionId.trim()}
            className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md"
          >
            {verifying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Verifying...
              </span>
            ) : (
              'Verify Payment & Activate'
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-2 text-center">
          Find Transaction ID in your UPI app&apos;s payment history
        </p>
      </div>
    </div>
  );
}

// Main App Component
export default function PricingPage() {
  const [userId] = useState('user-123');

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
    },
    {
      name: "PREMIUM",
      price: "299",
      yearlyPrice: "239",
      period: "month",
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
      href: "#checkout",
      isPopular: true,
    },
    {
      name: "PRO",
      price: "599",
      yearlyPrice: "479",
      period: "month",
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
      href: "#checkout",
      isPopular: false,
    },
  ];

  const paidPlans = pricingPlans.filter((plan) => plan.price !== '0');

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="pt-12 pb-8">
        <Pricing
          plans={pricingPlans}
          title="Pick your StudyMonkey plan"
          description={`Make UPI-powered checkouts in seconds.\nAll tiers include AI flashcards, smart reviews, and support.`}
        />
      </div>

      {/* Checkout Section */}
      <section id="checkout" className="py-16 px-4 bg-linear-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-700 px-4 py-2 rounded-full text-sm font-semibold">
              <span className="text-lg">🔐</span> UPI Checkout
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              Secure UPI payments for paid plans
            </h3>
            <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Choose your plan below, complete payment, and we&apos;ll activate your access automatically within seconds.
            </p>
          </div>

          {/* Payment Cards Grid */}
          <div className="grid gap-8 md:grid-cols-2">
            {paidPlans.map((plan) => (
              <div
                key={plan.name}
                className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl hover:shadow-2xl transition-shadow p-8 flex flex-col gap-6"
              >
                {/* Plan Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">
                      {plan.name}
                    </p>
                    <p className="text-4xl font-bold text-slate-900 mb-1">
                      ₹{plan.price}
                      <span className="text-lg font-normal text-slate-600"> /month</span>
                    </p>
                    <p className="text-xs text-slate-500">Annual billing saves 20%</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                    <CheckCircle className="h-3.5 w-3.5" />
                    UPI Ready
                  </div>
                </div>

                {/* Features List */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3">
                    What&apos;s Included
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.slice(0, 5).map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-xs text-slate-500 pl-5">
                        + {plan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Payment Section */}
                <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-600 mb-3">
                    💳 Pay Securely
                  </p>
                  <UpiPayment
                    amount={Number(plan.price)}
                    userId={userId}
                    onSuccess={() => {
                      alert(`Thanks for choosing ${plan.name}! 🎉 Redirecting to dashboard...`);
                      setTimeout(() => {
                        window.location.href = '/dashboard';
                      }, 1800);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="text-center pt-6">
            <div className="inline-flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 bg-white px-6 py-4 rounded-full shadow-md border border-slate-200">
              <span className="flex items-center gap-2">
                <span className="text-lg">🔐</span>
                <span className="font-medium">100% Secure UPI</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="font-medium">Instant Activation</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-2">
                <span className="text-lg">🇮🇳</span>
                <span className="font-medium">All Major UPI Apps</span>
              </span>
            </div>
          </div>
        </div>
      </section> 
    </div>
  );
}