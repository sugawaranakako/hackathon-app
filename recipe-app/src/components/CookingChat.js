import React, { useState, useEffect, useRef } from 'react';
import ApiService from '../services/api';
import './CookingChat.css';

const CookingChat = ({ currentRecipe, isOpen, onToggle }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 初期メッセージ
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      const welcomeMessage = {
        id: Date.now(),
        role: 'assistant',
        content: currentRecipe 
          ? `こんにちは！${currentRecipe.name}について何かご質問はありますか？\n\n例：\n・材料の代用方法\n・調理のコツ\n・保存方法\n・アレンジレシピ`
          : 'こんにちは！料理について何でもお聞きください。\n\n例：\n・食材の使い方\n・調理法の相談\n・レシピのアレンジ\n・栄養について',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, currentRecipe, messages.length]);

  // メッセージが追加されたら最下部にスクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // チャットが開いたらフォーカス
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const result = await ApiService.sendCookingChatMessage(
        userMessage.content,
        currentRecipe,
        chatHistory
      );

      if (result.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `申し訳ございません。エラーが発生しました：${result.error}\n\nもう一度お試しください。`,
          timestamp: new Date(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'ネットワークエラーが発生しました。インターネット接続を確認してもう一度お試しください。',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    if (window.confirm('チャット履歴をクリアしますか？')) {
      setMessages([]);
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 定型質問のサンプル
  const quickQuestions = [
    '材料の代用方法を教えて',
    '調理時間を短縮するコツは？',
    '保存方法を教えて',
    '栄養価について教えて',
    'アレンジレシピはある？'
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  if (!isOpen) {
    return (
      <div className="chat-fab" onClick={onToggle}>
        <span className="chat-icon">💬</span>
        <span className="chat-label">料理相談</span>
      </div>
    );
  }

  return (
    <div className={`cooking-chat ${isMinimized ? 'minimized' : ''}`}>
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">🤖</span>
          <div className="title-info">
            <h3>料理相談AI</h3>
            {currentRecipe && (
              <p className="recipe-context">📖 {currentRecipe.name}</p>
            )}
          </div>
        </div>
        <div className="chat-controls">
          <button 
            className="control-btn minimize-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? '展開' : '最小化'}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button 
            className="control-btn clear-btn"
            onClick={clearChat}
            title="履歴をクリア"
          >
            🗑️
          </button>
          <button 
            className="control-btn close-btn"
            onClick={onToggle}
            title="閉じる"
          >
            ×
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.role} ${message.isError ? 'error' : ''}`}
              >
                <div className="message-content">
                  <div className="message-text">
                    {message.content.split('\n').map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        {index < message.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="message-time">
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message assistant loading">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="message-text">考え中...</div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="quick-questions">
              <p className="quick-title">💡 よくある質問:</p>
              <div className="question-buttons">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="quick-question-btn"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="chat-input-area">
            <div className="input-container">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="料理について何でもお聞きください..."
                className="chat-input"
                rows="2"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                className="send-btn"
                disabled={!inputMessage.trim() || isLoading}
              >
                {isLoading ? (
                  <span className="loading-spinner-small"></span>
                ) : (
                  '📤'
                )}
              </button>
            </div>
            <div className="input-hint">
              <small>Enterで送信、Shift+Enterで改行</small>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CookingChat;