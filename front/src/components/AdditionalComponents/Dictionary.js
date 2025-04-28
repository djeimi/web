import React from 'react';
import styles from './Dictionary.module.css';
import { FaTimes } from 'react-icons/fa';

const Dictionary = ({ listOfWords, onClose }) => {
    return (
        <div className={styles.dictionariesBlock}>
            <div className={styles.header}>
                <p className={styles.title}>Список слов пользователя:</p>
                <button className={styles.closeButton} onClick={onClose}>
                    <FaTimes />
                </button>
            </div>
            
            <ul className={styles.wordList}>
                {listOfWords.map((word, index) => (
                    <li className={styles.word} key={index}>{word["word"]}</li>
                ))}
            </ul>
        </div>
    );
};

export default Dictionary;