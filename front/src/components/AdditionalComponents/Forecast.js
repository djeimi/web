import React from 'react';
import styles from './Forecast.module.css';
import { FaTimes } from 'react-icons/fa';


const Forecast = ({ data, onClose }) => {
    const forecastMessage = data.is_achievable 
        ? `При текущем темпе обучения вы достигнете 90% правильных ответов через ${data.days_to_90} дней (к ${data.forecast_date}). Ваш текущий процент: ${data.current_rate.toFixed(1)}%`
        : `При текущем темпе обучения достижение 90% правильных ответов маловероятно в следующие 60 дней. Ваш текущий процент: ${data.current_rate.toFixed(1)}%`;

    const img = `data:image/png;base64,${data.img}`;
    return (
        <div className={styles.forecastBlock}>
            <div className={styles.header}>
                <p className={styles.title}>Прогноз пользователя:</p>
                <button className={styles.closeButton} onClick={onClose}>
                    <FaTimes />
                </button>
            </div>
            
            <div className={styles.imgWithLine}>
                <img src={img} className={styles.imgStyle}/>
                <hr className={styles.bottom_line}></hr>
            </div>
            <p className={styles.forecast}>{forecastMessage}</p>
        </div>
    );
}

export default Forecast;
