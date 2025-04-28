const db = require('../utils/database');
const { generateWord } = require('../utils/dictionaries');
const fs = require('fs');

// Объект для хранения результатов
const results = {};

function simulateTraining() {
// Получаем слова из базы данных
    db.all('SELECT word FROM words WHERE user_id = 1', async (err, rows) => {
    if (err) {
        console.error('Ошибка при получении слов:', err);
        return;
    }

    const totalWords = rows.length;
    const wordsToProcess = totalWords;
    console.log(`Всего слов: ${totalWords}, будем обрабатывать: ${wordsToProcess}`);

    // Обрабатываем половину слов
    for (let i = 0; i < wordsToProcess; i++) {
        const word = rows[i].word;
        results[word] = []; // Инициализируем массив для хранения предложений
        
        console.log(`Обработка слова ${i+1}/${wordsToProcess}: ${word}`);
        
        // Генерируем 100 предложений для каждого слова
        for (let j = 0; j < 15; j++) {
        try {
            const response = await generateWord(word, 'high'); // 'high' - высокая сложность
            const sentence = response.content;
            results[word].push(sentence);
            
            // Логируем прогресс
            if ((j + 1) % 10 === 0) {
            console.log(`  Слово ${word}: сгенерировано ${j+1}/100 предложений`);
            }
        } catch (error) {
            console.error(`Ошибка при генерации предложения для слова ${word}:`, error);
        }
        }
    }

    // Сохраняем результаты в файл
    fs.writeFileSync('generation_results_with_adlearning.json', JSON.stringify(results, null, 2));
    console.log('Результаты сохранены в generation_results_with_adlearning.json');
    });
}

module.exports = { simulateTraining};