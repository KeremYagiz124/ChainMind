import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  conversationId?: string;
}

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m ChainMind AI, your DeFi assistant. I can help you with portfolio analysis, market insights, security assessments, and more. What would you like to know?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { address, isConnected } = useAccount();
  const [searchParams, setSearchParams] = useSearchParams();

  // Load conversation from URL parameter
  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId && isConnected && address) {
      loadConversation(convId);
      // Remove the parameter from URL after loading
      setSearchParams({});
    } else if (isConnected && address && !conversationId) {
      // Create new conversation ID when wallet connects
      setConversationId(`conv_${address}_${Date.now()}`);
    }
  }, [isConnected, address, searchParams]);

  const loadConversation = async (convId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:3001/api/chat/conversation/${convId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }

      const data = await response.json();
      
      if (data.success && data.conversation) {
        setConversationId(convId);
        
        // Convert backend messages to frontend format
        const loadedMessages: Message[] = data.conversation.messages.map((msg: any) => ({
          id: msg.id?.toString() || Date.now().toString(),
          content: msg.content,
          sender: msg.sender === 'assistant' ? 'ai' : msg.sender,
          timestamp: new Date(msg.timestamp || msg.createdAt)
        }));
        
        setMessages(loadedMessages);
        toast.success('Conversation loaded successfully');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Failed to load conversation');
      // Create a new conversation if loading fails
      setConversationId(`conv_${address}_${Date.now()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Capture the current input before clearing state
    const contentToSend = inputMessage;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: contentToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    // Clear the input after we captured it
    setInputMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: contentToSend,
          userId: address || 'anonymous',
          userAddress: address,
          conversationId: conversationId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.aiMessage?.content || data.response || 'Sorry, I could not process your request.',
        sender: 'ai',
        timestamp: new Date(),
        conversationId: data.conversation?.id
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 rounded-lg shadow-lg ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">ChainMind AI</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {isConnected ? 'Connected' : 'Not connected'} • <span className="hidden sm:inline">AI-Powered DeFi Assistant</span><span className="sm:hidden">AI Assistant</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Online</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] sm:max-w-xs lg:max-w-md xl:max-w-lg ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              } items-start space-x-2`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-blue-500 ml-2' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 mr-2'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`px-4 py-2 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' 
                      ? 'text-blue-100' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-md">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">ChainMind is thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about DeFi, portfolio analysis, market trends..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-2 bottom-2 w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        
        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            💡 Connect your wallet for personalized portfolio analysis and recommendations
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
