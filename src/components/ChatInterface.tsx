import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useSettingsStore } from '../store';

export const ChatInterface: React.FC = () => {
  const { isChatOpen, toggleChat, messages, addMessage } = useSettingsStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addMessage({
      content: input,
      sender: 'user',
    });
    setInput('');

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      addMessage({
        content: 'This is a simulated response. Replace with actual AI integration.',
        sender: 'assistant',
      });
    }, 1000);
  };

  if (!isChatOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-black/80 border border-blue-500/30 rounded-lg shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-blue-500/30">
        <h2 className="text-xl font-bold text-blue-300">Memory Assistant</h2>
        <button
          onClick={toggleChat}
          className="text-blue-300 hover:text-blue-100 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-blue-100'
              }`}
            >
              <p>{message.content}</p>
              <p className="text-xs opacity-50 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-blue-500/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-black/50 border border-blue-500/30 rounded px-3 py-2 text-blue-100 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};