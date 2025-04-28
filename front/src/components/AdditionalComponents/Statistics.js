import React from 'react';
import styles from './Statistics.module.css';
import { FaTimes } from 'react-icons/fa';
import StatisticsChart from './StatisticsChart';

const Statistics = ({ data, vocabulary, onClose }) => {
    const analyzeStatistics = ()=> {
        console.log(vocabulary)

        if (!vocabulary || vocabulary.length === 0) return null;

        const vocabularyArray = Object.entries(vocabulary).map(([word, data]) => ({
            word: data.word,
            rating: data.rating,
            last_used: data.last_used
          }));
          
        const sortedByRating = [...vocabularyArray].sort((a, b) => b.rating - a.rating);

        const bestWord = sortedByRating[0];
        const worstWord = sortedByRating[sortedByRating.length - 1];

        const totalCorrect = data.reduce((sum, day) => sum + day.correct_answers, 0);
        const totalIncorrect = data.reduce((sum, day) => sum + day.incorrect_answers, 0);
        const totalPercent = (totalCorrect / (totalCorrect + totalIncorrect)) * 100;

        return {
            bestWord,
            worstWord,
            totalPercent,
            isPositive: totalPercent >= 70 
        };
    };
    
    const analysis = analyzeStatistics();
    
    return (
        <div className={styles.statisticsBlock}>
            <div className={styles.header}>
                <p className={styles.title}>Статистика пользователя:</p>
                <button className={styles.closeButton} onClick={onClose}>
                    <FaTimes />
                </button>
            </div>
            <StatisticsChart data={data}/>
            
            {analysis && (
                <div className={styles.analysis}>
                    <h1><strong>Анализ вашей статистики:</strong></h1>
                    <p>Общий процент правильных ответов: <strong>{analysis.totalPercent.toFixed(1)}%</strong>. </p>
                    <p>Ваше обучение идет <strong>{analysis.isPositive ? 'хорошо' : 'не очень хорошо'}</strong>.</p>
                    
                    {analysis.bestWord &&
                        <p>Лучше всего вам дается слово <strong>"{analysis.bestWord.word}"</strong>. </p>}
                    
                    {analysis.worstWord && 
                        <p>Хуже всего вам дается слово <strong>"{analysis.worstWord.word}"</strong>. </p> }
                </div>
            )}
        </div>
    );
}

export default Statistics;