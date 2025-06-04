'use client';

import { useState } from 'react';
import Navigation from '../components/Navigation';
import { CheckIcon } from '@heroicons/react/24/outline';

type BillingCycle = 'monthly' | 'yearly';

interface PricingPlan {
  monthly: number;
  yearly: number;
  features: string[];
}

interface PricingPlans {
  organization: {
    basic: PricingPlan;
    premium: PricingPlan;
  };
  staff: {
    basic: PricingPlan;
    premium: PricingPlan;
  };
}

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const pricingPlans: PricingPlans = {
    organization: {
      basic: {
        monthly: 99,
        yearly: 990,
        features: [
          'Up to 10 active shifts',
          'Basic staff management',
          'Email support',
          'Standard reporting',
          'Basic analytics'
        ]
      },
      premium: {
        monthly: 299,
        yearly: 2990,
        features: [
          'Unlimited active shifts',
          'Advanced staff management',
          'Priority support',
          'Advanced analytics',
          'Custom reporting',
          'API access',
          'Team management',
          'Automated scheduling'
        ]
      }
    },
    staff: {
      basic: {
        monthly: 0,
        yearly: 0,
        features: [
          'Basic profile',
          'Apply to shifts',
          'Basic notifications',
          'Email support',
          'Standard availability management'
        ]
      },
      premium: {
        monthly: 19,
        yearly: 190,
        features: [
          'Enhanced profile visibility',
          'Priority shift applications',
          'Advanced notifications',
          'Priority support',
          'Advanced availability management',
          'Shift history tracking',
          'Performance analytics',
          'Direct messaging'
        ]
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      <Navigation />
      
      {/* Pricing Header */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-brand-bgLight to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your needs. All plans include our core features.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex justify-center items-center space-x-4 mb-12">
            <span className={`text-lg ${billingCycle === 'monthly' ? 'text-brand-dark' : 'text-gray-600'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg ${billingCycle === 'yearly' ? 'text-brand-dark' : 'text-gray-600'}`}>
              Yearly <span className="text-sm text-brand-dark">(Save 20%)</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Organization Plans */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">For Organizations</h2>
              <div className="grid grid-cols-1 gap-8">
                {/* Basic Plan */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Basic</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">${pricingPlans.organization.basic[billingCycle]}</span>
                    <span className="text-gray-600">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {pricingPlans.organization.basic.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <CheckIcon className="h-6 w-6 text-brand-dark mr-2" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-3 px-4 bg-brand-dark text-white rounded-md hover:bg-brand-accent transition-colors">
                    Get Started
                  </button>
                </div>

                {/* Premium Plan */}
                <div className="bg-white rounded-2xl shadow-sm border-2 border-brand-dark p-8 relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-brand-dark text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">${pricingPlans.organization.premium[billingCycle]}</span>
                    <span className="text-gray-600">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {pricingPlans.organization.premium.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <CheckIcon className="h-6 w-6 text-brand-dark mr-2" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-3 px-4 bg-brand-dark text-white rounded-md hover:bg-brand-accent transition-colors">
                    Get Started
                  </button>
                </div>
              </div>
            </div>

            {/* Staff Plans */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">For Staff</h2>
              <div className="grid grid-cols-1 gap-8">
                {/* Basic Plan */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Basic</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">Free</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {pricingPlans.staff.basic.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <CheckIcon className="h-6 w-6 text-brand-dark mr-2" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-3 px-4 bg-brand-dark text-white rounded-md hover:bg-brand-accent transition-colors">
                    Get Started
                  </button>
                </div>

                {/* Premium Plan */}
                <div className="bg-white rounded-2xl shadow-sm border-2 border-brand-dark p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">${pricingPlans.staff.premium[billingCycle]}</span>
                    <span className="text-gray-600">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {pricingPlans.staff.premium.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <CheckIcon className="h-6 w-6 text-brand-dark mr-2" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-3 px-4 bg-brand-dark text-white rounded-md hover:bg-brand-accent transition-colors">
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-[#f5f9f9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-brand-dark">Can I change plans later?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.</p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-brand-dark">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-brand-dark">Is there a free trial?</h3>
              <p className="text-gray-600">Yes, we offer a 14-day free trial for all premium plans. No credit card required.</p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-brand-dark">Do you offer refunds?</h3>
              <p className="text-gray-600">Yes, we offer a 30-day money-back guarantee for all paid plans.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 