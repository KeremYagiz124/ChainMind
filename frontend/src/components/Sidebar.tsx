import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  MessageCircle, 
  PieChart, 
  TrendingUp, 
  Shield, 
  Settings, 
  History,
  Plus,
  X
} from 'lucide-react';
import { useAccount } from 'wagmi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isConnected } = useAccount();

  const navigationItems = [
    {
      name: 'Chat',
      href: '/',
      icon: MessageCircle,
      description: 'AI Assistant'
    },
    {
      name: 'Portfolio',
      href: '/portfolio',
      icon: PieChart,
      description: 'Your Holdings',
      requiresWallet: true
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: TrendingUp,
      description: 'Market Data'
    },
    {
      name: 'Security',
      href: '/security',
      icon: Shield,
      description: 'Protocol Safety'
    },
    {
      name: 'History',
      href: '/history',
      icon: History,
      description: 'Past Conversations',
      requiresWallet: true
    }
  ];

  const quickActions = [
    {
      name: 'New Chat',
      action: () => {
        // Navigate to new chat
        window.location.href = '/';
      },
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600'
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 lg:hidden">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CM</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">ChainMind</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.name}
                  onClick={action.action}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-white
                    transition-colors ${action.color}
                  `}
                >
                  <action.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{action.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Navigation
            </h3>
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const isDisabled = item.requiresWallet && !isConnected;
                
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-r-2 border-blue-700 dark:border-blue-400' 
                        : isDisabled
                          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                    </div>
                    {isDisabled && (
                      <div className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                        Wallet Required
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </NavLink>

            {/* Status indicator */}
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                  AI Assistant Online
                </span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                Ready to help with DeFi insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
