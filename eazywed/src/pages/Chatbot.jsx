import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Chatbot.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedMessages = JSON.parse(localStorage.getItem('weddingChatHistory')) || [];
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      const welcomeMessage = {
        sender: 'bot',
        text: 'Welcome to EazyWed Chat! How can I assist you with your wedding today?',
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('weddingChatHistory', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      sender: 'user',
      text: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/public/chatbot', { query: input });
      const botMessage = {
        sender: 'bot',
        text: response.data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        sender: 'bot',
        text: 'Sorry, something went wrong. Please try again!',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    localStorage.removeItem('weddingChatHistory');
    const welcomeMessage = {
      sender: 'bot',
      text: 'Chat cleared! How can I help with your wedding now?',
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  };

  return (
    <div className="wedding-chatbot-page">
      <div className="wedding-chatbot-container">
        <div className="wedding-chatbot-header">
          <Link to="/" className="back-arrow">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h1>EazyWed Chat Assistant</h1>
          <button className="clear-chat-btn" onClick={clearChat}>
            Clear
          </button>
        </div>
        <div className="wedding-chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <span>{msg.text}</span>
              <span className="timestamp">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {loading && <div className="message bot typing">Typing...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="wedding-chatbot-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about venues, deals, or planning..."
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;