import { PricingPlan } from "@/components/ui/pricing";

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "0",
    yearlyPrice: "0",
    period: "per month",
    features: [
      "Create unlimited basic decks",
      "AI flashcard generation (starter limits)",
      "3 collaborative study circles",
      "Email support",
    ],
    description: "Great for quick trials and solo learners who want to sample the workflow.",
    buttonText: "Start for free",
    href: "/signup",
    isPopular: false,
  },
  {
    name: "Study Beginners",
    price: "499",
    yearlyPrice: "399",
    period: "per month",
    features: [
      "Unlimited smart reviews",
      "AI summaries + deck clean up",
      "Shared decks with classmates",
      "Priority email + chat support",
      "Practice streak analytics",
    ],
    description: "Most students choose this to keep reviews effortless and stay on streaks.",
    buttonText: "Checkout with UPI",
    href: "/pricing#checkout",
    isPopular: true,
  },
  {
    name: "Experts",
    price: "1499",
    yearlyPrice: "1199",
    period: "per month",
    features: [
      "All Beginner perks",
      "Advanced analytics & exports",
      "Priority instructor onboarding",
      "Custom knowledge bases",
      "Dedicated success manager",
    ],
    description: "For teams, coaching groups, or researchers that need deeper controls.",
    buttonText: "Checkout with UPI",
    href: "/pricing#checkout",
    isPopular: false,
  },
];
