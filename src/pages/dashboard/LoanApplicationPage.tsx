import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  ArrowLeftIcon, 
  FileTextIcon, 
  ArrowRightIcon,
  ClipboardCheckIcon,
  CheckCircle2Icon,
  ChevronRightIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LoanApplication {
  id: string;
  created_at: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  loan_amount: number;
  loan_type: string;
  property_type: string;
  interest_rate: number;
  term: number;
  call_id?: string;
  status: 'Review needed' | 'Ready for LOS' | 'Pushed to Encompass';
}

export default function LoanApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [pushed, setPushed] = useState(false);
  const [pushProgress, setPushProgress] = useState(0);
  
  const supabase = useSupabase();
  const { error, success } = useToast();
  
  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<LoanApplication>();

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        if (!id) return;
        
        const { data, error: fetchError } = await supabase
          .from('loan_applications')
          .select('*')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        if (data) {
          setApplication(data as LoanApplication);
          // Set form values
          Object.entries(data).forEach(([key, value]) => {
            setValue(key as any, value);
          });
        }
      } catch (err: any) {
        error(err.message || 'Failed to load application data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplication();
  }, [id, supabase, error, setValue]);

  const onSubmit = async (data: LoanApplication) => {
    try {
      const { error: updateError } = await supabase
        .from('loan_applications')
        .update(data)
        .eq('id', id);
        
      if (updateError) throw updateError;
      
      success('Application updated successfully');
      setApplication(prev => prev ? { ...prev, ...data } : null);
    } catch (err: any) {
      error(err.message || 'Failed to update application');
    }
  };

  const pushToLOS = async () => {
    try {
      setPushing(true);
      
      // Simulate API call to Encompass LOS
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setPushProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Update status in database
          supabase
            .from('loan_applications')
            .update({ status: 'Pushed to Encompass' })
            .eq('id', id)
            .then(({ error: updateError }) => {
              if (updateError) throw updateError;
              
              // Update local state
              setApplication(prev => prev ? { ...prev, status: 'Pushed to Encompass' } : null);
              setPushed(true);
              success('Application successfully pushed to Encompass');
            });
        }
      }, 300);
      
    } catch (err: any) {
      error(err.message || 'Failed to push to LOS');
      setPushing(false);
    }
  };

  // Mock data for demonstration
  const mockApplication: LoanApplication = {
    id: '1',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    client_name: 'John Smith',
    client_email: 'john.smith@example.com',
    client_phone: '(555) 123-4567',
    loan_amount: 360000,
    loan_type: 'Conventional',
    property_type: 'Single Family Home',
    interest_rate: 6.25,
    term: 30,
    status: 'Ready for LOS'
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application data...</p>
        </div>
      </div>
    );
  }

  const applicationData = application || mockApplication;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" className="mb-2" asChild>
          <Link to="/dashboard">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Loan Application</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
              <div className="flex items-center">
                <FileTextIcon className="w-4 h-4 mr-1" />
                <span>{applicationData.client_name}</span>
              </div>
              <div className="flex items-center">
                <span>{formatDistanceToNow(new Date(applicationData.created_at), { addSuffix: true })}</span>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                applicationData.status === 'Pushed to Encompass' 
                  ? 'bg-green-100 text-green-800' 
                  : applicationData.status === 'Ready for LOS'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {applicationData.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {pushed ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2Icon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Successfully Pushed to Encompass</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            The loan application has been successfully pushed to your Encompass LOS system.
          </p>
          
          <div className="max-w-sm mx-auto space-y-4">
            <h3 className="font-medium">Next Steps</h3>
            <ul className="space-y-2 text-left">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">
                  <ChevronRightIcon className="h-3 w-3" />
                </div>
                <span className="text-gray-700">Log in to Encompass to verify the loan details</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">
                  <ChevronRightIcon className="h-3 w-3" />
                </div>
                <span className="text-gray-700">Contact the client to schedule the next meeting</span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">
                  <ChevronRightIcon className="h-3 w-3" />
                </div>
                <span className="text-gray-700">Prepare disclosure documents</span>
              </li>
            </ul>
          </div>
          
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link to="/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">Application Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Review and update the loan application information before pushing to Encompass LOS.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 space-y-6">
              {/* Client Information */}
              <div>
                <h3 className="text-md font-medium mb-4">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <Input
                      {...register('client_name', { required: 'Name is required' })}
                      className={errors.client_name ? 'border-red-500' : ''}
                    />
                    {errors.client_name && (
                      <p className="mt-1 text-xs text-red-500">{errors.client_name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      {...register('client_email', { 
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className={errors.client_email ? 'border-red-500' : ''}
                    />
                    {errors.client_email && (
                      <p className="mt-1 text-xs text-red-500">{errors.client_email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <Input
                      {...register('client_phone')}
                    />
                  </div>
                </div>
              </div>
              
              {/* Loan Information */}
              <div>
                <h3 className="text-md font-medium mb-4">Loan Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Loan Type
                    </label>
                    <Input
                      {...register('loan_type', { required: 'Loan type is required' })}
                      className={errors.loan_type ? 'border-red-500' : ''}
                    />
                    {errors.loan_type && (
                      <p className="mt-1 text-xs text-red-500">{errors.loan_type.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Property Type
                    </label>
                    <Input
                      {...register('property_type', { required: 'Property type is required' })}
                      className={errors.property_type ? 'border-red-500' : ''}
                    />
                    {errors.property_type && (
                      <p className="mt-1 text-xs text-red-500">{errors.property_type.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Loan Amount
                    </label>
                    <Input
                      type="number"
                      {...register('loan_amount', { 
                        required: 'Loan amount is required',
                        valueAsNumber: true,
                        min: { value: 1, message: 'Amount must be greater than 0' }
                      })}
                      className={errors.loan_amount ? 'border-red-500' : ''}
                    />
                    {errors.loan_amount && (
                      <p className="mt-1 text-xs text-red-500">{errors.loan_amount.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Interest Rate (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('interest_rate', { 
                        required: 'Interest rate is required',
                        valueAsNumber: true,
                        min: { value: 0, message: 'Rate must be greater than 0' }
                      })}
                      className={errors.interest_rate ? 'border-red-500' : ''}
                    />
                    {errors.interest_rate && (
                      <p className="mt-1 text-xs text-red-500">{errors.interest_rate.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Term (Years)
                    </label>
                    <Input
                      type="number"
                      {...register('term', { 
                        required: 'Term is required',
                        valueAsNumber: true,
                        min: { value: 1, message: 'Term must be greater than 0' }
                      })}
                      className={errors.term ? 'border-red-500' : ''}
                    />
                    {errors.term && (
                      <p className="mt-1 text-xs text-red-500">{errors.term.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
              {isDirty && (
                <Button type="submit" variant="outline">
                  Save Changes
                </Button>
              )}
              
              {pushing ? (
                <div className="flex items-center space-x-4 ml-auto">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${pushProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">Pushing to Encompass...</span>
                </div>
              ) : (
                <Button 
                  type="button"
                  onClick={pushToLOS}
                  className="ml-auto"
                  disabled={applicationData.status === 'Pushed to Encompass'}
                >
                  <ClipboardCheckIcon className="mr-2 h-4 w-4" />
                  Push to Encompass LOS
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}