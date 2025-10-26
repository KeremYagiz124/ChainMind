import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Clock, MessageSquare, Trash2, Search } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { showErrorToast } from '../utils/errorHandler';
import { logger } from '../utils/logger';

interface ChatHistory {
  id: string;
  title: string;
  timestamp: string;
  messageCount: number;
  lastMessage: string;
}

const History: React.FC = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      fetchChatHistory();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      
      if (!address) {
        setChatHistory([]);
        return;
      }

      const response = await fetch(API_ENDPOINTS.CHAT_CONVERSATIONS(address));
      const data = await response.json();
      logger.debug('Conversations loaded:', data);
      
      if (data.success && data.conversations) {
        const formattedHistory: ChatHistory[] = data.conversations.map((conv: any) => ({
          id: conv.id,
          title: conv.title,
          timestamp: conv.updatedAt || conv.createdAt,
          messageCount: conv.messageCount || 0,
          lastMessage: conv.lastMessage || 'No messages yet'
        }));
        
        setChatHistory(formattedHistory);
      } else {
        setChatHistory([]);
      }
    } catch (err) {
      logger.error('Failed to fetch chat history:', err);
      setChatHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.CHAT_CONVERSATION(chatId), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
        showErrorToast('Conversation deleted successfully');
      } else {
        showErrorToast('Failed to delete conversation');
      }
    } catch (err) {
      logger.error('Error deleting conversation:', err);
      showErrorToast(err, 'Error deleting conversation');
    }
  };

  const handleLoadConversation = (chatId: string) => {
    navigate(`/?conversation=${chatId}`);
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">
            Please connect your wallet to view your chat history.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Chat History</h1>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="p-6">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No matching conversations' : 'No chat history yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Start a conversation to see your chat history here'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleLoadConversation(chat.id)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {chat.title}
                        </h3>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {chat.messageCount}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {chat.lastMessage}
                      </p>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(chat.timestamp)}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-red-500"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
