import React, { useState, useRef, useEffect } from 'react';
import styles from './Chat.module.css';
import axios from 'axios';

const Chat = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isFirstMessageSent, setIsFirstMessageSent] = useState(false);
  const [trainingState, setTrainingState] = useState(null);
  const textareaRef = useRef(null);
  const chatBlockRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchInitialMessage = async () => {
      try {
        const response = await axios.post('http://localhost:5000/process-message', {
          userId,
          message: '',
          chatHistory: [],
        });
        setMessages([{ text: response.data.result, isUser: false }]);
      } catch (error) {
        console.error("Ошибка при получении начального сообщения:", error);
      }
    };    

    if (!isFirstMessageSent) {
      fetchInitialMessage();
      setIsFirstMessageSent(true);
    }
  }, [userId, isFirstMessageSent]);

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      setMessages((prevMessages) => [...prevMessages, { text: inputValue, isUser: true }]);
      setInputValue('');
      setIsThinking(true);
  
      try {
        const response = await axios.post('http://localhost:5000/process-message', {
          userId,
          message: inputValue,
          chatHistory: messages.map(msg => ({ role: msg.isUser ? 'user' : 'assistant', content: msg.text })),
          trainingState,
        });
  
        if (Array.isArray(response.data.result)) {
          response.data.result.forEach(message => {
            setMessages((prevMessages) => [...prevMessages, { text: message, isUser: false }]);
            console.log(message)
          });
        } else {
          console.log(response.data.result)
          setMessages((prevMessages) => [...prevMessages, { text: response.data.result, isUser: false }]);
        }
  
        setTrainingState(response.data.trainingState);
      } catch (error) {
        console.error("Ошибка при отправке сообщения:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: 'Ошибка при обработке сообщения.', isUser: false },
        ]);
      } finally {
        setIsThinking(false);
      }
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

  const [showTooltipForClear, setShowTooltipForClear] = useState(false);

  const handleMouseEnterClearButt = () => {
    setShowTooltipForClear(true);
  };

  const handleMouseLeaveClearButt = () => {
    setShowTooltipForClear(false);
  };

  const handleClearChat = async () => {
    setMessages([]);
    
    setTrainingState(null);
    
    setIsFirstMessageSent(false);

    console.log("Очищена история чата.");
  }; 

  return (
    <div className={styles.chatBlock} ref={chatBlockRef}>
      <h2 className={isFirstMessageSent ? styles.chatHeaderFixed : styles.chatHeader}>
        Chat with English Coach
      </h2>
      <div className={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div key={index} className={msg.isUser ? styles.userMessage : styles.botMessage}>
            {Array.isArray(msg.text) ? msg.text.join('\n') : msg.text}
          </div>
        ))}
        {isThinking && <div className={styles.thinkingMessage}>AI ассистент думает..</div>}
        <div ref={messagesEndRef} />
      </div>
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
          <button
            onClick={handleClearChat}
            onMouseEnter={handleMouseEnterClearButt}
            onMouseLeave={handleMouseLeaveClearButt}
            className={styles.buttonWithTool}>Clear all</button>
        </div>
        {showTooltip && (
          <div className={styles.tooltip}>
            Отправка сообщения - по нажатию "Enter",<br />
            перенос строки - "Shift + Enter"
          </div>
        )}
        {showTooltipForClear && (
          <div className={styles.tooltipClear}>
            Очистить всю историю чата
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
