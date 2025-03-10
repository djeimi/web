import React, { useState, useRef, useEffect } from 'react';
import styles from './Chat.module.css';

const Chat = ({ userId }) => {
  const [messages, setMessages] = useState([
    { text: "Пример сообщения пользователя 1, Пример сообщения пользователя 1,Пример сообщения пользователя 1 Пример сообщения пользователя 1,Пример сообщения пользователя 1,Пример сообщения пользователя 1,Пример сообщения пользователя 1", isUser: true },
    { text: "Пример сообщения user, Пример сообщения user,Пример сообщения user,Пример сообщения user,Пример сообщения user,Пример сообщения user,Пример сообщения user", isUser: false },
    { text: "Пример сообщения пользователя", isUser: true },
    { text: "Пример сообщения user", isUser: false },
    { text: "Пример сообщения пользователя", isUser: true },
    { text: "Пример сообщения user", isUser: false },
    { text: "Пример сообщения пользователя", isUser: true },
    { text: "Пример сообщения user", isUser: false },
    { text: "Пример сообщения пользователя", isUser: true },
    { text: "Пример сообщения user", isUser: false },
    { text: "Пример сообщения пользователя", isUser: true },
    { text: "Пример сообщения user", isUser: false },
    { text: "Пример сообщения пользователя", isUser: true },
    { text: "Пример сообщения user", isUser: false },
    { text: "Пример сообщения пользователя", isUser: true },
    { text: "Пример сообщения user", isUser: false },
    { text: "Пример сообщения пользователя", isUser: true },
    { text: "Пример сообщения user", isUser: false },
    { text: "Пример сообщения пользователя", isUser: true },
    { text: "Пример сообщения user", isUser: false },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isFirstMessageSent, setIsFirstMessageSent] = useState(true);
  const textareaRef = useRef(null);
  const chatBlockRef = useRef(null);
  const messagesEndRef = useRef(null);

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      setMessages([...messages, { text: inputValue, isUser: true }]);
      setInputValue('');
      setIsThinking(true);
      setIsFirstMessageSent(true);

      // Uncomment when getBotResponse function is available
      // const botResponse = await getBotResponse(inputValue);
      // setMessages((prevMessages) => [
      //   ...prevMessages,
      //   { text: botResponse, isUser: false },
      // ]);
      setIsThinking(false);
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, [inputValue]);

  useEffect(() => {
    const chatBlock = chatBlockRef.current;
    const fixedHeader = document.querySelector(`.${styles.chatHeaderFixed}`);
    if (fixedHeader && chatBlock) {
      fixedHeader.style.width = `${chatBlock.offsetWidth}px`;
    }
  }, [isFirstMessageSent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div className={styles.chatBlock} ref={chatBlockRef}>
      <h2 className={isFirstMessageSent ? styles.chatHeaderFixed : styles.chatHeader}>
        Chat with English Coach
      </h2>
      {isFirstMessageSent && (
        <div className={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div key={index} className={msg.isUser ? styles.userMessage : styles.botMessage}>
              {msg.text}
            </div>
          ))}
          {isThinking && <div className={styles.thinkingMessage}>AI ассистент думает..</div>}
          <div ref={messagesEndRef} />
        </div>
      )}
      <div className={isFirstMessageSent ? styles.inputBlockFixed : styles.inputBlock}>
        <textarea
          ref={textareaRef}
          placeholder="Ask English coach"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ maxHeight: '150px', overflowY: 'auto' }}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.buttonBlock}>
          <button 
            onClick={handleSendMessage}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={styles.buttonWithTool}>Send</button>
        </div>
        {showTooltip && (
          <div className={styles.tooltip}>
            Отправка сообщения - по нажатию "Enter",<br /> 
            перенос строки - "Shift + Enter"
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;