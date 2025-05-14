const db = require('../utils/database');
const { generateWord} = require('../utils/dictionaries');
const {generateHint} = require('../services/wordService');
const fs = require('fs');

// Объект для хранения результатов
const results = {};

async function simulateTrainingAndHintGeneration() {
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
      results[word] = {
        sentences: [],
        hint: ''
      };
      const usedSentences = new Set(); // Чтобы избегать дубликатов

      console.log(`Обработка слова ${i + 1}/${wordsToProcess}: ${word}`);
      
      // Генерация 5 предложений
      for (let j = 0; j < 5; j++) {
        try {
          const response = await generateWord(word, 'high', usedSentences);
          const sentence = response.content;
          results[word].sentences.push(sentence);
          usedSentences.add(sentence); // Запоминаем предложение, чтобы не повторялось

          // Логируем прогресс
          console.log(`  Слово ${word}: сгенерировано предложение ${j + 1}/5`);
        } catch (error) {
          console.error(`Ошибка при генерации предложения для слова ${word}:`, error);
        }
      }

      // Генерация подсказки (используем первое предложение как контекст)
      try {
        const hintResponse = await generateHint(word, 'сложный', results[word].sentences[0]);
        results[word].hint = hintResponse.content || hintResponse;
        console.log(`  Слово ${word}: подсказка сгенерирована`);
      } catch (error) {
        console.error(`Ошибка при генерации подсказки для слова ${word}:`, error);
        results[word].hint = `Hint generation failed for word: ${word}`;
      }
    }

    // Сохраняем результаты в файл
    fs.writeFileSync('training_and_hint_generation_simulation_results.json', JSON.stringify(results, null, 2));
    console.log('Результаты сохранены в training_and_hint_generation_simulation_results.json');
  } catch (error) {
    console.error('Ошибка в simulateTrainingAndHintGeneration:', error);
  }
}

module.exports = { simulateTrainingAndHintGeneration };