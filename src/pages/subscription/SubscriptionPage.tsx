import { useState, useEffect } from 'react';
import { useSupabase } from '../../hooks/useSupabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/button';
import { CheckIcon, SparklesIcon } from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: number;
  monthlyCallLimit: number;
  isPopular?: boolean;
};

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for loan officers just getting started',
    price: 29,
    monthlyCallLimit: 20,
    features: [
      'Up to 20 calls per month',
      'AI transcription & analysis',
      'Basic loan data extraction',
      'Email support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For loan officers who need more advanced features',
    price: 79,
    monthlyCallLimit: 100,
    isPopular: true,
    features: [
      'Up to 100 calls per month',
      'AI transcription & analysis',
      'Advanced loan data extraction',
      'Direct Encompass integration',
      'Priority support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For mortgage teams and brokerages',
    price: 199,
    monthlyCallLimit: 500,
    features: [
      'Up to 500 calls per month',
      'AI transcription & analysis',
      'Advanced loan data extraction',
      'Direct Encompass integration',
      'Team management features',
      'Dedicated account manager',
      'Custom AI training'
    ]
  }
];

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [processingSubscription, setProcessingSubscription] = useState(false);
  
  const supabase = useSupabase();
  const { user } = useAuth();
  const { error, success } = useToast();
  
  useEffect(() => {
    async function fetchSubscription() {
      if (!user) return;
      
      try {
        setLoadingPlan(true);
        const { data, error: fetchError } = await supabase
          .from('subscriptions')
          .select('plan_id, status')
          .eq('user_id', user.id)
          .single();
          
        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }
        
        if (data && data.status === 'active') {
          setCurrentPlan(data.plan_id);
        } else {
          setCurrentPlan(null);
        }
      } catch (err: any) {
        error(err.message || 'Failed to load subscription data');
      } finally {
        setLoadingPlan(false);
      }
    }
    
    fetchSubscription();
  }, [user, supabase, error]);

  const handleSubscribe = async (planId: string) => {
    if (!user) return;
    
    try {
      setProcessingSubscription(true);
      
      // In a real implementation, this would redirect to Stripe Checkout
      // Here we'll just simulate the process
      
      setTimeout(async () => {
        try {
          // If user already has a subscription, update it
          if (currentPlan) {
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                plan_id: planId,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id);
              
            if (updateError) throw updateError;
          } else {
            // Otherwise create a new subscription
            const { error: insertError } = await supabase
              .from('subscriptions')
              .insert([
                {
                  user_id: user.id,
                  plan_id: planId,
                  status: 'active',
                  created_at: new Date().toISOString()
                }
              ]);
              
            if (insertError) throw insertError;
          }
          
          setCurrentPlan(planId);
          success(`Successfully subscribed to ${plans.find(p => p.id === planId)?.name} plan`);
        } catch (err: any) {
          error(err.message || 'Failed to process subscription');
        } finally {
          setProcessingSubscription(false);
        }
      }, 2000);
      
    } catch (err: any) {
      error(err.message || 'Failed to process subscription');
      setProcessingSubscription(false);
    }
  };

  const cancelSubscription = async () => {
    if (!user || !currentPlan) return;
    
    try {
      setProcessingSubscription(true);
      
      // In a real implementation, this would call Stripe API to cancel
      // Here we'll just simulate the process
      
      setTimeout(async () => {
        try {
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
            
          if (updateError) throw updateError;
          
          setCurrentPlan(null);
          success('Your subscription has been canceled');
        } catch (err: any) {
          error(err.message || 'Failed to cancel subscription');
        } finally {
          setProcessingSubscription(false);
        }
      }, 1500);
      
    } catch (err: any) {
      error(err.message || 'Failed to cancel subscription');
      setProcessingSubscription(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <p className="text-gray-600 mt-1">
          Choose the right plan for your mortgage business
        </p>
      </div>

      {loadingPlan ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {currentPlan && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <p className="font-medium text-blue-800">
                  You're currently on the {plans.find(p => p.id === currentPlan)?.name} plan
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  You can process up to {plans.find(p => p.id === currentPlan)?.monthlyCallLimit} calls per month.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="mt-4 md:mt-0 border-blue-300 hover:bg-blue-100 text-blue-800"
                onClick={cancelSubscription}
                disabled={processingSubscription}
              >
                {processingSubscription ? 'Processing...' : 'Cancel Subscription'}
              </Button>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden border transition-all ${
                  plan.isPopular ? 'border-primary ring-2 ring-primary/20 relative' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                      MOST POPULAR
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-gray-600 mt-2 text-sm">{plan.description}</p>
                  
                  <div className="mt-6 flex items-baseline">
                    <span className="text-4xl font-extrabold">${plan.price}</span>
                    <span className="ml-1 text-gray-500">/month</span>
                  </div>
                  
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <Button
                    className={`w-full ${
                      plan.isPopular 
                        ? 'bg-primary hover:bg-primary/90'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                    disabled={processingSubscription || currentPlan === plan.id}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {currentPlan === plan.id
                      ? 'Current Plan'
                      : processingSubscription
                      ? 'Processing...'
                      : 'Subscribe'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Need a custom plan?</h3>
                <p className="mt-1 text-gray-600">
                  If you need a custom plan for your mortgage brokerage or have specific requirements,
                  contact our sales team for a tailored solution.
                </p>
                <div className="mt-4">
                  <Button variant="outline">Contact Sales</Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}