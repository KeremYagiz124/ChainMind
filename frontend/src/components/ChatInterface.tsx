import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { API_ENDPOINTS } from '../config/api';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';
import { chatLogger } from '../utils/logger';

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
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { address, isConnected } = useAccount();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    isConnected: wsConnected, 
    sendMessage: wsSendMessage, 
    joinChat, 
    leaveChat,
    onNewMessage,
    onAiTyping
  } = useWebSocket();

  // Load conversation from URL parameter
  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId && isConnected && address) {
      loadConversation(convId);
      setSearchParams({});
    } else if (isConnected && address && !conversationId) {
      const newConvId = `conv_${address}_${Date.now()}`;
      setConversationId(newConvId);
    }
  }, [isConnected, address, searchParams]);

  // WebSocket: Join/leave chat room on conversation change
  useEffect(() => {
    if (!conversationId || !wsConnected) return;
    joinChat(conversationId);
    return () => { leaveChat(conversationId); };
  }, [conversationId, wsConnected]);

  const handleNewMessage = useCallback((message: {
    id: string;
    content: string;
    sender: string;
    timestamp: string | Date;
  }) => {
    const newMessage: Message = {
      id: message.id,
      content: message.content,
      sender: message.sender === 'assistant' ? 'ai' : message.sender as 'user' | 'ai',
      timestamp: new Date(message.timestamp),
      conversationId: conversationId
    };

    setMessages(prev => {
      // Avoid duplicates
      if (prev.find(m => m.id === newMessage.id)) return prev;
      return [...prev, newMessage];
    });
    setIsLoading(false);
  }, [conversationId]);

  // WebSocket: Listen for new messages
  useEffect(() => {
    if (!wsConnected) return;
    const unsubscribe = onNewMessage(handleNewMessage);
    return unsubscribe;
  }, [wsConnected, handleNewMessage]);

  const handleAiTyping = useCallback((data: {
    conversationId: string;
    typing: boolean;
  }) => {
    if (data.conversationId === conversationId) {
      setIsAiTyping(data.typing);
    }
  }, [conversationId]);

  // WebSocket: Listen for AI typing indicator
  useEffect(() => {
    if (!wsConnected || !conversationId) return;
    
    const unsubscribe = onAiTyping(handleAiTyping);

    return unsubscribe;
  }, [wsConnected, conversationId, handleAiTyping]);

  const loadConversation = async (convId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.CHAT_CONVERSATION(convId));
      
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
        showSuccessToast('Conversation loaded successfully');
      }
    } catch (err) {
      chatLogger.error('Failed to load conversation:', err);
      showErrorToast(err, 'Failed to load conversation');
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

    const contentToSend = inputMessage;
    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      content: contentToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInputMessage('');

    // Try WebSocket first, fallback to HTTP
    if (wsConnected && conversationId) {
      wsSendMessage(conversationId, contentToSend, address);
    } else {
      // Fallback to HTTP API
      try {
        const response = await fetch(API_ENDPOINTS.CHAT_MESSAGE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: contentToSend,
            userAddress: address,
            conversationId: conversationId
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();

        const aiMessage: Message = {
          id: `msg_${Date.now()}_ai`,
          content: data.message || data.aiMessage?.content || 'Sorry, I could not process your request.',
          sender: 'ai',
          timestamp: new Date(),
          conversationId: data.conversation?.id
        };

        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        chatLogger.error('Error sending message:', error);
        showErrorToast(error, 'Failed to send message. Please try again.');
        
        const errorMessage: Message = {
          id: `msg_${Date.now()}_error`,
          content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
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
              <span className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${wsConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                {wsConnected ? 'Live' : 'Offline'} • <span className="hidden sm:inline ml-1">AI-Powered DeFi Assistant</span><span className="sm:hidden ml-1">AI Assistant</span>
              </span>
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
        
          {/* AI Typing Indicator */}
          {isAiTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
        </AnimatePresence>
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
