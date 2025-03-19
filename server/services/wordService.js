const db = require('../utils/database');
const { generateWord } = require('../utils/dictionaries');

async function saveWord (userId, word) {
  const englishPhrases = word.match(/\b[a-zA-Z]+(?:\s[a-zA-Z]+)*\b/g);
  if (!englishPhrases) {
    return 'В предложении нет английских слов или словосочетаний.';
  }

  console.log(`Saving word(s) for user ${userId}: ${englishPhrases}`);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      englishPhrases.forEach(phrase => {
        db.run('INSERT OR IGNORE INTO words (user_id, word) VALUES (?, ?)', [userId, phrase], function(err) {
          if (err) {
            reject('Ошибка при сохранении слова: ' + err.message);
          }
        });
      });

      db.all('SELECT COUNT(*) as count FROM words WHERE user_id = ?', [userId], (err, rows) => {
        if (err) {
          reject('Ошибка при подсчете слов: ' + err.message);
        } else {
          console.log(`Total words for user ${userId}: ${rows[0].count}`);
          resolve(`Сохранено английских словосочетаний: ${englishPhrases.join(', ')}. Всего доступно ${rows[0].count}`);
        }
      });
    });
  });
};

async function getVocLen (userId) {
  const voc = await getVoc(userId);
  const count = Object.keys(voc).length;
  return count;
};

async function checkWordExists (userId, word) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM words WHERE user_id = ? AND word = ?', [userId, word], (err, row) => {
      if (err) {
        reject('Ошибка при проверке наличия слова: ' + err.message);
      } else {
        resolve(!!row);
      }
    });
  });
};

async function resetWordStats (userId, word) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE words SET rating = 0, last_used = NULL WHERE user_id = ? AND word = ?', [userId, word], function(err) {
      if (err) {
        reject('Ошибка при обновлении статистики слова: ' + err.message);
      } else {
        resolve();
      }
    });
  });
};

async function trainWords(userId, count, complexity, specificWords = [], useLastTrained = false) {
  const words = specificWords.length > 0 ? specificWords : await getVoc(userId);
  const maxWords = await getVocLen(userId);

  if (count > maxWords) {
    return `Вы запросили ${count} слов, доступно только ${maxWords}.`;
  }

  let selectedWords;

  if (specificWords.length > 0) {
    // Если specificWords не пустое, используем его
    selectedWords = specificWords.slice(0, count);
  } else {
    // Если specificWords пустое, сортируем и выбираем слова
    const sortedWords = Object.entries(words).sort((a, b) => {
      const ratingA = a[1].rating || 0;
      const ratingB = b[1].rating || 0;
      const lastUsedA = a[1].last_used || new Date(0);
      const lastUsedB = b[1].last_used || new Date(0);

      if (useLastTrained) {
        // Сортируем по дате использования (последние использованные слова будут первыми)
        return new Date(lastUsedB) - new Date(lastUsedA);
      } else {
        // Сортируем по рейтингу и дате использования (как в оригинальной логике)
        return ratingA - ratingB || new Date(lastUsedA) - new Date(lastUsedB);
      }
    });

    // Выбираем нужное количество слов
    selectedWords = shuffleArray(sortedWords.slice(0, count).map(([word]) => word));
  }

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      let promises = selectedWords.map(word => {
        return new Promise((resolveWord, rejectWord) => {
          generateWord(word, complexity).then(sentence => {
            const generated_sentence = sentence.content;
            const result = { word, generated_sentence };
  
            // Проверяем, существует ли слово в базе данных
            db.get('SELECT 1 FROM words WHERE user_id = ? AND word = ?', [userId, word], (err, row) => {
              if (err) {
                return rejectWord('Error checking word existence: ' + err.message);
              }
  
              if (row) {
                // Слово существует, обновляем last_used
                db.run('UPDATE words SET last_used = CURRENT_TIMESTAMP WHERE user_id = ? AND word = ?', [userId, word], function(err) {
                  if (err) {
                    rejectWord('Error updating last_used: ' + err.message);
                  } else {
                    resolveWord(result);
                  }
                });
              } else {
                // Слово не существует, сначала сохраняем его
                saveWord(userId, word).then(() => {
                  // Затем обновляем last_used
                  db.run('UPDATE words SET last_used = CURRENT_TIMESTAMP WHERE user_id = ? AND word = ?', [userId, word], function(err) {
                    if (err) {
                      rejectWord('Error updating last_used after saving word: ' + err.message);
                    } else {
                      resolveWord(result);
                    }
                  });
                }).catch(err => {
                  rejectWord('Error saving word: ' + err.message);
                });
              }
            });
          }).catch(err => {
            rejectWord('Error generating sentence: ' + err.message);
          });
        });
      });
  
      Promise.all(promises)
        .then(results => resolve({ results }))
        .catch(err => reject(err));
    });
  });  
}

async function updateWordRating (userId, word, isCorrect){
  return new Promise((resolve, reject) => {
    const ratingChange = isCorrect ? 1 : -1;
    db.run('UPDATE words SET rating = rating + ? WHERE user_id = ? AND word = ?', [ratingChange, userId, word], function(err) {
      if (err) {
        reject('Ошибка при обновлении рейтинга слова: ' + err.message);
      } else {
        resolve();
      }
    });
  });
};

async function getVoc(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT word, rating, last_used FROM words WHERE user_id = ?', [userId], (err, rows) => {
      if (err) {
        reject('Ошибка при получении слов: ' + err.message);
      } else {
        const words = rows.reduce((acc, row) => {
          acc[row.word] = { rating: row.rating, last_used: row.last_used };
          return acc;
        }, {});
        resolve(words);
      }
    });
  });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

module.exports = { saveWord, getVocLen, checkWordExists, resetWordStats, trainWords, updateWordRating};