import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  HomeIcon, 
  ListIcon, 
  MicIcon, 
  SettingsIcon, 
  LogOutIcon,
  HeadphonesIcon,
  UserIcon,
  CreditCardIcon,
  MenuIcon,
  XIcon
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/useToast';

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      success('Signed out successfully');
      navigate('/login');
    } catch (err: any) {
      error(err.message || 'Failed to sign out');
    }
  };

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <HomeIcon className="w-5 h-5" /> },
    { name: 'Record Call', path: '/record', icon: <MicIcon className="w-5 h-5" /> },
    { name: 'Subscription', path: '/subscription', icon: <CreditCardIcon className="w-5 h-5" /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <XIcon className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </button>
              
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="flex items-center">
                  <HeadphonesIcon className="h-8 w-8 text-primary" />
                  <span className="ml-2 text-xl font-bold text-gray-900 hidden md:block">
                    LoanNavigator AI
                  </span>
                </Link>
              </div>
            </div>

            {/* User Profile Dropdown */}
            <div className="flex items-center">
              <div className="flex items-center ml-4 md:ml-6">
                <div className="flex items-center gap-2">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.email}
                    </span>
                    <span className="text-xs text-gray-500">
                      Loan Officer
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation (desktop) */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16 lg:z-20">
          <div className="flex flex-col flex-grow border-r border-gray-200 bg-white pt-5 pb-4 overflow-y-auto">
            <div className="flex-1 flex flex-col px-3 mt-6">
              <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center px-3 py-2.5 text-sm font-medium rounded-md group transition-colors
                      ${
                        location.pathname === item.path
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}

                <div className="pt-4 mt-6 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:bg-gray-100"
                    onClick={handleSignOut}
                  >
                    <LogOutIcon className="w-5 h-5 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Sidebar */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>

            {/* Sidebar */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <XIcon className="h-6 w-6 text-white" />
                </button>
              </div>

              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <HeadphonesIcon className="h-8 w-8 text-primary" />
                  <span className="ml-2 text-xl font-bold text-gray-900">
                    LoanNavigator AI
                  </span>
                </div>
                <div className="mt-5 flex-1 px-2">
                  <nav className="flex-1 space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`
                          flex items-center px-3 py-2.5 text-base font-medium rounded-md
                          ${
                            location.pathname === item.path
                              ? 'bg-primary/10 text-primary'
                              : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </Link>
                    ))}

                    <div className="pt-4 mt-6 border-t border-gray-200">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-700 hover:bg-gray-100"
                        onClick={handleSignOut}
                      >
                        <LogOutIcon className="w-5 h-5 mr-3" />
                        Sign Out
                      </Button>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="lg:pl-64 flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}