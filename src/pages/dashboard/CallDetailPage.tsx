import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  MicIcon, 
  ClipboardIcon, 
  BrainCircuitIcon, 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  FileIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Call {
  id: string;
  title: string;
  client_name: string;
  audio_url: string;
  duration: number;
  created_at: string;
  status: 'processing' | 'completed' | 'error';
  transcript?: string;
  summary?: string;
  action_items?: string[];
  key_points?: string[];
  loan_info?: {
    loan_type?: string;
    loan_amount?: number;
    property_type?: string;
    rate?: number;
    term?: number;
  };
}

export default function CallDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingProgress, setProcessingProgress] = useState(0);
  const supabase = useSupabase();
  const { error, success } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const fetchCall = async () => {
      try {
        if (!id) return;
        
        const { data, error: fetchError } = await supabase
          .from('calls')
          .select('*')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        if (data) {
          setCall(data as Call);
          
          // If the call is still processing, start a progress simulation
          if (data.status === 'processing') {
            let progress = 10;
            intervalId = setInterval(() => {
              progress += 5;
              if (progress >= 95) {
                clearInterval(intervalId);
                progress = 95;
              }
              setProcessingProgress(progress);
              
              // Simulate completion after some time
              if (progress >= 90) {
                clearInterval(intervalId);
                // Refetch to check if processing is complete
                fetchCall();
              }
            }, 1000);
          } else {
            setProcessingProgress(100);
          }
        }
      } catch (err: any) {
        error(err.message || 'Failed to load call data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCall();
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, supabase, error]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mock data for demonstration
  const mockCall: Call = {
    id: '1',
    title: 'Initial consultation with John Smith',
    client_name: 'John Smith',
    audio_url: 'https://example.com/audio.mp3',
    duration: 1250,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    status: 'completed',
    transcript: `
John (Client): Hi, this is John Smith. I'm calling about getting a mortgage pre-approval. Is this a good time?

Loan Officer: Hello John, yes, this is a perfect time. I'm glad you called. I'm ready to help you with your pre-approval today. What kind of property are you looking to purchase?

John: I'm looking at single-family homes in the Riverdale area. Probably in the $450,000 range.

Loan Officer: Great, Riverdale is a nice area. And what's your employment situation like, John?

John: I've been at my current job for about 5 years now. I work as a software engineer at Tech Solutions Inc.

Loan Officer: That's excellent stability. And do you have a preference between a fixed-rate or adjustable-rate mortgage?

John: I think I'd prefer a fixed-rate, probably a 30-year term. I want to keep my monthly payments predictable.

Loan Officer: That makes sense. A 30-year fixed is our most popular option. What about your down payment situation?

John: I've been saving up, and I have about 20% ready for the down payment.

Loan Officer: Perfect, that's going to put you in a great position. With 20% down, you'll avoid private mortgage insurance, which will save you money monthly.`,
    summary: `
This was an initial consultation call with John Smith about obtaining a mortgage pre-approval. Key details discussed:

- John is interested in purchasing a single-family home in the Riverdale area
- His budget is approximately $450,000
- He has been employed as a software engineer at Tech Solutions Inc. for 5 years
- He prefers a 30-year fixed-rate mortgage
- John has saved 20% for a down payment
- The loan officer explained that 20% down would help John avoid PMI

The call ended with the loan officer explaining next steps for the pre-approval process and requesting documents for income verification.`,
    action_items: [
      "Send pre-approval application form to John via email",
      "Request last 2 years of tax returns and W-2s",
      "Schedule follow-up call for next week to review application status",
      "Send information about current interest rates for 30-year fixed mortgages"
    ],
    key_points: [
      "Client has excellent employment stability (5 years)",
      "20% down payment available - qualifies to avoid PMI",
      "Looking in Riverdale area - good property values",
      "Budget is $450,000 which is reasonable for the area and client's likely income",
      "Prefers conservative 30-year fixed-rate loan product"
    ],
    loan_info: {
      loan_type: "Conventional",
      loan_amount: 360000,
      property_type: "Single Family Home",
      rate: 6.25,
      term: 30
    }
  };

  const createLoanApplication = async () => {
    try {
      if (!call && !mockCall) return;
      
      const callData = call || mockCall;
      
      // In production, you would extract this data from the AI analysis
      const loanData = {
        client_name: callData.client_name,
        loan_amount: callData.loan_info?.loan_amount || 360000,
        loan_type: callData.loan_info?.loan_type || "Conventional",
        property_type: callData.loan_info?.property_type || "Single Family Home",
        interest_rate: callData.loan_info?.rate || 6.25,
        term: callData.loan_info?.term || 30,
        call_id: callData.id,
        status: "Ready for LOS"
      };
      
      // Create the loan application in the database
      const { data, error: createError } = await supabase
        .from('loan_applications')
        .insert([loanData])
        .select()
        .single();
        
      if (createError) throw createError;
      
      success('Loan application created successfully');
      
      // Navigate to the application page
      if (data?.id) {
        navigate(`/application/${data.id}`);
      }
      
    } catch (err: any) {
      error(err.message || 'Failed to create loan application');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading call data...</p>
        </div>
      </div>
    );
  }

  const callData = call || mockCall;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" className="mb-2" asChild>
          <Link to="/dashboard">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{callData.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                <span>{formatDistanceToNow(new Date(callData.created_at), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>{formatTime(callData.duration)}</span>
              </div>
              <div className="flex items-center">
                <MicIcon className="w-4 h-4 mr-1" />
                <span>{callData.client_name}</span>
              </div>
            </div>
          </div>
          
          {callData.status === 'completed' && (
            <Button onClick={createLoanApplication}>
              Create Loan Application
            </Button>
          )}
        </div>
      </div>

      {callData.status === 'processing' ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <BrainCircuitIcon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Processing Your Call</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We're transcribing and analyzing your call with AI. This may take a few minutes.
          </p>
          
          <div className="max-w-md mx-auto">
            <Progress value={processingProgress} className="h-2 mb-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className={`p-3 rounded-lg border ${processingProgress >= 30 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-center">
                  {processingProgress >= 30 ? (
                    <CheckCircle2Icon className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 mr-2"></div>
                  )}
                  <span className={processingProgress >= 30 ? 'text-green-700' : 'text-gray-500'}>Transcribing</span>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg border ${processingProgress >= 60 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-center">
                  {processingProgress >= 60 ? (
                    <CheckCircle2Icon className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 mr-2"></div>
                  )}
                  <span className={processingProgress >= 60 ? 'text-green-700' : 'text-gray-500'}>Analyzing</span>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg border ${processingProgress >= 90 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-center">
                  {processingProgress >= 90 ? (
                    <CheckCircle2Icon className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 mr-2"></div>
                  )}
                  <span className={processingProgress >= 90 ? 'text-green-700' : 'text-gray-500'}>Extracting Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Audio Player */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <h2 className="text-lg font-medium mb-3">Audio Recording</h2>
            <audio controls className="w-full" src={callData.audio_url}>
              Your browser does not support the audio element.
            </audio>
          </div>

          {/* Analysis Tabs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="grid grid-cols-3 p-0 h-auto rounded-none border-b">
                <TabsTrigger 
                  value="transcript" 
                  className="py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <ClipboardIcon className="h-4 w-4 mr-2" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger 
                  value="summary" 
                  className="py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <BrainCircuitIcon className="h-4 w-4 mr-2" />
                  AI Summary
                </TabsTrigger>
                <TabsTrigger 
                  value="loandata" 
                  className="py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  <FileIcon className="h-4 w-4 mr-2" />
                  Loan Data
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="transcript" className="p-6 focus-visible:outline-none focus-visible:ring-0">
                <div className="prose max-w-none">
                  <h3 className="text-lg font-medium mb-3">Call Transcript</h3>
                  <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
                    {callData.transcript || "Transcript not available"}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="summary" className="p-6 focus-visible:outline-none focus-visible:ring-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Meeting Summary</h3>
                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line">
                      {callData.summary || "Summary not available"}
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Key Points</h3>
                      <ul className="space-y-2">
                        {callData.key_points?.map((point, index) => (
                          <li key={index} className="flex items-start">
                            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2 mt-0.5">
                              <CheckCircle2Icon className="h-3 w-3" />
                            </div>
                            <span className="text-gray-700">{point}</span>
                          </li>
                        )) || "No key points available"}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Next Steps</h3>
                      <ul className="space-y-2">
                        {callData.action_items?.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 mt-0.5">
                              <ChevronRightIcon className="h-3 w-3" />
                            </div>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        )) || "No action items available"}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="loandata" className="p-6 focus-visible:outline-none focus-visible:ring-0">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Extracted Loan Information</h3>
                  <p className="text-sm text-gray-500">
                    The AI has automatically extracted the following loan information from the call. 
                    This data can be used to create a loan application.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500 mb-1">Loan Type</p>
                      <p className="font-medium">{callData.loan_info?.loan_type || "Conventional"}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500 mb-1">Loan Amount</p>
                      <p className="font-medium">
                        {callData.loan_info?.loan_amount 
                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(callData.loan_info.loan_amount)
                          : "$360,000"
                        }
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500 mb-1">Property Type</p>
                      <p className="font-medium">{callData.loan_info?.property_type || "Single Family Home"}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500 mb-1">Interest Rate</p>
                      <p className="font-medium">{callData.loan_info?.rate || "6.25"}%</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500 mb-1">Term (Years)</p>
                      <p className="font-medium">{callData.loan_info?.term || "30"}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500 mb-1">Down Payment</p>
                      <p className="font-medium">20%</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button onClick={createLoanApplication}>
                      Create Loan Application
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
}