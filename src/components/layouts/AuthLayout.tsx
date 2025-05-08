import { Outlet } from 'react-router-dom';
import { HeadphonesIcon } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Left side (branding) */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/90 to-primary flex flex-col justify-center p-8 md:p-16">
        <div className="max-w-md mx-auto text-white space-y-6">
          <div className="flex items-center mb-8">
            <HeadphonesIcon className="h-10 w-10 mr-3 text-white" />
            <h1 className="text-3xl font-bold">LoanNavigator AI</h1>
          </div>
          
          <h2 className="text-4xl font-bold leading-tight">
            Transform your mortgage sales process with AI-powered insights
          </h2>
          
          <p className="text-lg text-white/80 mt-4">
            Automatically transcribe client calls, extract loan data, and get AI-powered
            insights to close more deals, faster.
          </p>
          
          <div className="pt-8 space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                ✓
              </div>
              <p className="ml-3 text-white/90">Automatic call transcription and analysis</p>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                ✓
              </div>
              <p className="ml-3 text-white/90">AI-powered loan application data extraction</p>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                ✓
              </div>
              <p className="ml-3 text-white/90">Seamless integration with your LOS system</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side (auth forms) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Outlet />
      </div>
    </div>
  );
}