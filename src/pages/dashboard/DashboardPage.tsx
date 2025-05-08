import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { useSupabase } from '../../hooks/useSupabase';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import {
  MicIcon,
  PlayCircleIcon,
  ClockIcon,
  ClipboardListIcon,
  FilesIcon,
  ChevronRightIcon
} from 'lucide-react';

type Call = {
  id: string;
  created_at: string;
  duration: number;
  title: string;
  status: string;
  client_name?: string;
};

type LoanApplication = {
  id: string;
  created_at: string;
  client_name: string;
  loan_amount: number;
  loan_type: string;
  status: string;
};

export default function DashboardPage() {
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();
  const supabase = useSupabase();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        
        // Fetch recent calls
        const { data: callsData, error: callsError } = await supabase
          .from('calls')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (callsError) throw callsError;
        
        // Fetch loan applications
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('loan_applications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (applicationsError) throw applicationsError;

        setRecentCalls(callsData || []);
        setLoanApplications(applicationsData || []);
      } catch (err: any) {
        error('Failed to load dashboard data: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [supabase, error]);

  // Mock data for demonstration purposes
  const mockCalls: Call[] = [
    {
      id: '1',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      duration: 1250,
      title: 'Initial consultation with John Smith',
      status: 'completed',
      client_name: 'John Smith'
    },
    {
      id: '2',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      duration: 1830,
      title: 'Rate discussion with Sarah Williams',
      status: 'completed',
      client_name: 'Sarah Williams'
    },
    {
      id: '3',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      duration: 950,
      title: 'Pre-approval follow-up with Mike Johnson',
      status: 'completed',
      client_name: 'Mike Johnson'
    }
  ];

  const mockApplications: LoanApplication[] = [
    {
      id: '1',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      client_name: 'John Smith',
      loan_amount: 450000,
      loan_type: 'Conventional',
      status: 'Ready for LOS'
    },
    {
      id: '2',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      client_name: 'Sarah Williams',
      loan_amount: 320000,
      loan_type: 'FHA',
      status: 'Review needed'
    },
    {
      id: '3',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      client_name: 'Mike Johnson',
      loan_amount: 520000,
      loan_type: 'Jumbo',
      status: 'Pushed to Encompass'
    }
  ];

  // Format seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            View your recent calls and loan applications
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex gap-3">
          <Button asChild className="bg-primary text-white hover:bg-primary/90">
            <Link to="/record">
              <MicIcon className="h-4 w-4 mr-2" />
              Record Call
            </Link>
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Activity Summary */}
        <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 fade-in">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <PlayCircleIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Calls</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : (recentCalls.length || mockCalls.length)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <ClipboardListIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Loan Applications</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : (loanApplications.length || mockApplications.length)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4">
                <ClockIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Processing Time</p>
                <p className="text-2xl font-bold">2.5 min</p>
              </div>
            </div>
          </div>
        </div>
      
        {/* Tabbed Content */}
        <div className="col-span-1 md:col-span-3">
          <Tabs defaultValue="calls" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="calls">Recent Calls</TabsTrigger>
              <TabsTrigger value="applications">Loan Applications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calls" className="space-y-4">
              <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Client Calls</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    View and analyze recent call transcriptions
                  </p>
                </div>
                <div>
                  <ul className="divide-y divide-gray-200">
                    {isLoading ? (
                      <div className="p-6 text-center text-gray-500">Loading recent calls...</div>
                    ) : (recentCalls.length > 0 ? recentCalls : mockCalls).map((call) => (
                      <li key={call.id} className="slide-in">
                        <Link to={`/call/${call.id}`} className="block hover:bg-gray-50 transition-colors">
                          <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 mr-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                  <MicIcon className="h-5 w-5" />
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 truncate max-w-md">
                                  {call.title}
                                </p>
                                <div className="mt-1 flex items-center">
                                  <p className="text-sm text-gray-500 mr-4">
                                    <span className="font-medium">{call.client_name}</span>
                                  </p>
                                  <p className="text-sm text-gray-500 flex items-center">
                                    <ClockIcon className="h-3 w-3 mr-1" />
                                    {formatDuration(call.duration || 0)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <p className="text-xs text-gray-500 mr-4">
                                {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                              </p>
                              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                    {!isLoading && recentCalls.length === 0 && mockCalls.length === 0 && (
                      <div className="p-6 text-center text-gray-500">No calls found. Record your first call!</div>
                    )}
                  </ul>
                  <div className="px-5 py-4 border-t border-gray-200">
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/calls">View all calls</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="applications" className="space-y-4">
              <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Loan Applications</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    View and manage loan applications extracted from client calls
                  </p>
                </div>
                <div>
                  <ul className="divide-y divide-gray-200">
                    {isLoading ? (
                      <div className="p-6 text-center text-gray-500">Loading applications...</div>
                    ) : (loanApplications.length > 0 ? loanApplications : mockApplications).map((app) => (
                      <li key={app.id} className="slide-in">
                        <Link to={`/application/${app.id}`} className="block hover:bg-gray-50 transition-colors">
                          <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 mr-4">
                                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                                  <FilesIcon className="h-5 w-5" />
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 truncate max-w-md">
                                  {app.client_name}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <p className="text-sm text-gray-500">
                                    <span className="font-medium">{formatCurrency(app.loan_amount)}</span>
                                  </p>
                                  <span className="text-gray-300">•</span>
                                  <p className="text-sm text-gray-500">{app.loan_type}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className={`px-2 py-1 text-xs rounded-full mr-4 ${
                                app.status === 'Pushed to Encompass' 
                                  ? 'bg-green-100 text-green-800' 
                                  : app.status === 'Ready for LOS'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {app.status}
                              </span>
                              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                    {!isLoading && loanApplications.length === 0 && mockApplications.length === 0 && (
                      <div className="p-6 text-center text-gray-500">No applications found yet.</div>
                    )}
                  </ul>
                  <div className="px-5 py-4 border-t border-gray-200">
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/applications">View all applications</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}