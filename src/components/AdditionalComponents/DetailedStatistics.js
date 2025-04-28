import React, { useState } from 'react';
import styles from './DetailedStatistics.module.css';
import { FaTimes } from 'react-icons/fa';
import DetailedStatisticsChart from './DetailedStatisticsChart';


const DetailedStatistics = ({ data, onClose }) => {
    let words = new Set(data.map(item => item.word));
    
    const [selectedWord, setSelectedWord] = useState('');
      const filteredData = selectedWord 
        ? data.filter(item => item.word === selectedWord)
        : []; 

    return (
        <div className={styles.statisticsBlock}>
            <div className={styles.header}>
                <p className={styles.title}>Статистика пользователя по слову:</p>
                <button className={styles.closeButton} onClick={onClose}>
                    <FaTimes />
                </button>
            </div>
            <select className={styles.selectBlock}
                value={selectedWord}
                onChange={(e) => setSelectedWord(e.target.value)}>
                <option value="">-- Выберите слово --</option>
                {[...words].map((word) => (
                    <option key={word} value={word}>{word}</option>
                    ))}
            </select>
            <DetailedStatisticsChart data={filteredData}/>
        </div>
    );
}

export default DetailedStatistics;
