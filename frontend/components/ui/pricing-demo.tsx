"use client";

import { Pricing } from "@/components/ui/pricing";
import { pricingPlans } from "@/lib/pricing-data";

function PricingDemo() {
  return (
    <div className="h-[800px] overflow-y-auto rounded-lg">
      <Pricing
        plans={pricingPlans}
        title="Simple, Transparent Pricing"
        description={`Choose the plan that works for you\nAll plans include access to our platform, lead generation tools, and dedicated support.`}
      />
    </div>
  );
}

export { PricingDemo };
