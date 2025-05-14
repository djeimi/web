import React, { useState, useRef, useEffect } from 'react';
import styles from './Chat.module.css';
import axios from 'axios';
import Dictionary from '../AdditionalComponents/Dictionary';
import Statistics from '../AdditionalComponents/Statistics';
import DetailedStatistics from '../AdditionalComponents/DetailedStatistics';
import Forecast from '../AdditionalComponents/Forecast';

const Chat = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isFirstMessageSent, setIsFirstMessageSent] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [trainingState, setTrainingState] = useState(null);
  const textareaRef = useRef(null);
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
    if (inputValue.trim().toLowerCase() === 'останови тренировку') {
    // Сначала добавляем сообщение пользователя в историю
      setMessages(prev => [...prev, { text: inputValue, isUser: true }]);
      
      try {
        const response = await axios.post('http://localhost:5000/process-message', {
          userId,
          message: inputValue.trim().toLowerCase(),
          chatHistory: [...messages, { text: inputValue, isUser: true }].map(msg => 
            ({ role: msg.isUser ? 'user' : 'assistant', content: msg.text })
          ),
          trainingState
        });
        
        // Затем добавляем ответ ассистента
        setMessages(prev => [...prev, { text: response.data.result, isUser: false }]);
        setTrainingState(response.data.trainingState);
      } catch (error) {
        console.error("Ошибка при остановке тренировки:", error);
        setMessages(prev => [...prev, { text: 'Ошибка при остановке тренировки', isUser: false }]);
      }
      setInputValue('');
      return;
    }

    if (inputValue.trim()) {
      setMessages(prev => [...prev, { text: inputValue, isUser: true }]);
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
          setMessages(prev => [...prev, ...response.data.result.map(text => ({ text, isUser: false }))]);
        } else {
          setMessages(prev => [...prev, { text: response.data.result, isUser: false }]);
        }
  
        setTrainingState(response.data.trainingState);
      } catch (error) {
        console.error("Ошибка при отправке сообщения:", error);
        setMessages(prev => [...prev, { text: 'Ошибка при обработке сообщения.', isUser: false }]);
      } finally {
        setIsThinking(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const [showDictionary, setShowDictionary] = useState(false);
  const [dictionary, setDictionary] = useState([]);
  const handleGetDictionary = async () => {
    try {
      const response = await axios.get('http://localhost:5000/dictionary', { params: { user_id: userId } });
      setDictionary(response.data.row);
      setShowDictionary(true);
    } catch (error) {
      console.error("Ошибка при получении словаря:", error);
    }
  };
  
  const [showStatistics, setShowStatistics] = useState(false);
  const [statistics, setStatistics] = useState([]);
  const [vocabulary, setVocabulary] = useState([]);
  const handleGetStatistics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/statistics/additionalInfo', { params: { user_id: userId } });
      const addResponse = await axios.get('http://localhost:5000/vocabulary', { params: { user_id: userId } });
      setStatistics(response.data.row);
      setVocabulary(addResponse.data.row);
      setShowStatistics(true);
    } catch (error) {
      console.error("Ошибка при получении статистики:", error);
    }
  };

  const [showDetailedStatistics, setShowDetailedStatistics] = useState(false);
  
  const [detailedStatistics, setDetailedStatistics] = useState([]);
  const handleGetDetailedStatistics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/statistics/additionalInfo/word', { params: { user_id: userId } });
      setDetailedStatistics(response.data.row);
      setShowDetailedStatistics(true);
    } catch (error) {
      console.error("Ошибка при получении детальной статистики:", error);
    }
  };

  const [forecast, setForecast] = useState(null);
  const [showForecast, setShowForecast] = useState(false);
  const handleGetForecast = async () => {
    try {
      const response = await axios.get('http://localhost:5000/forecast', { 
        params: { user_id: userId } ,
        timeout: 5000
      });
      
      if (response.data.error) {
        alert(response.data.error);
        return;
      }

      setForecast(response.data);
      setShowForecast(true);
    } catch (error) {
      console.error("Ошибка при получении прогноза:", error);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setTrainingState(null);

    setIsFirstMessageSent(false);

    console.log("Очищена история чата.");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, [inputValue]);

  return (
    <div className={styles.chatContainer}>
      <header className={styles.chatHeader}>
        <h2>Chat with English Coach</h2>
      </header>

      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <button onClick={handleGetDictionary} className={styles.panelButton}>
            Получить все слова
          </button>
        </div>

        <div className={styles.centerColumn}>
          <div className={styles.chatArea}>
            <div className={styles.messages}>
              {messages.map((msg, index) => (
                <div key={index} className={msg.isUser ? styles.userMessage : styles.botMessage}>
                  {msg.text.toLowerCase() === 'останови тренировку' ? (
                    <span style={{ fontWeight: 'bold' }}>{msg.text}</span>
                  ) : Array.isArray(msg.text) ? msg.text.join('\n') : msg.text}
                </div>
              ))}
              {isThinking && <div className={styles.thinking}>AI ассистент думает..</div>}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <footer className={styles.inputArea}>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={trainingState?.inProgress 
                ? "Введите ответ или напишите 'останови тренировку' чтобы прервать" 
                : "Ask English coach"}
            />
            <div className={styles.buttons}>
              <button onClick={handleSendMessage}>Send</button>
              <button onClick={handleClearChat}>Clear</button>
            </div>
          </footer>
        </div>

        <div className={styles.rightPanel}>
          <button onClick={handleGetStatistics} className={styles.panelButton}>
            Статистика
          </button>
          <button onClick={handleGetDetailedStatistics} className={styles.panelButton}>
            Детализированная статистика
          </button>
          <button onClick={handleGetForecast} className={styles.panelButton}>
            Прогноз
          </button>
        </div>
      </div>

      {showDictionary && (
        <>
          <div className={styles.overlay} onClick={() => setShowDictionary(false)} />
          <Dictionary listOfWords={dictionary} onClose={() => setShowDictionary(false)} />
        </>
      )}

      {showStatistics && (
        <>
          <div className={styles.overlay} onClick={() => setShowStatistics(false)} />
          <Statistics data={statistics} vocabulary={vocabulary} onClose={() => setShowStatistics(false)} />
        </>
      )}

      {showDetailedStatistics && (
        <>
          <div className={styles.overlay} onClick={() => setShowDetailedStatistics(false)} />
          <DetailedStatistics data={detailedStatistics} onClose={() => setShowDetailedStatistics(false)} />
        </>
      )}

      {showForecast && (
        <>
          <div className={styles.overlay} onClick={() => setShowForecast(false)} />
          <Forecast data={forecast} onClose={() => setShowForecast(false)} />
        </>
      )}
    </div>
  );
};

export default Chat;