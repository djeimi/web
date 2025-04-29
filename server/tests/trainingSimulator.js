const db = require('../utils/database');
const { generateWord } = require('../utils/dictionaries');
const fs = require('fs');

// Объект для хранения результатов
const results = {};

async function simulateTraining() {
  try {
    // Получаем слова из базы данных
    const rows = await new Promise((resolve, reject) => {
      db.all('SELECT word FROM words WHERE user_id = 1', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const totalWords = rows.length;
    const wordsToProcess = totalWords;
    console.log(`Всего слов: ${totalWords}, будем обрабатывать: ${wordsToProcess}`);

    // Обрабатываем слова последовательно
    for (let i = 0; i < wordsToProcess; i++) {
      const word = rows[i].word;
      results[word] = []; // Массив для предложений
      const usedSentences = new Set(); // Чтобы избегать дубликатов

      console.log(`Обработка слова ${i + 1}/${wordsToProcess}: ${word}`);

      // Генерируем 15 предложений для каждого слова
      for (let j = 0; j < 15; j++) {
        try {
          const response = await generateWord(word, 'high', usedSentences);
          const sentence = response.content;
          results[word].push(sentence);
          usedSentences.add(sentence); // Запоминаем предложение, чтобы не повторялось

          // Логируем прогресс каждые 5 предложений
          if ((j + 1) % 5 === 0) {
            console.log(`  Слово ${word}: сгенерировано ${j + 1}/15 предложений`);
          }
        } catch (error) {
          console.error(`Ошибка при генерации предложения для слова ${word}:`, error);
        }
      }
    }

    // Сохраняем результаты в файл
    fs.writeFileSync('generation_results_without_adlearning.json', JSON.stringify(results, null, 2));
    console.log('Результаты сохранены в generation_results_without_adlearning.json');
  } catch (error) {
    console.error('Ошибка в simulateTraining:', error);
  }
}

module.exports = { simulateTraining };