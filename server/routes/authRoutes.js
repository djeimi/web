const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const bcrypt = require('bcrypt');
const { makeForecast } = require('../services/forecastService.js');

const saltRounds = 10;

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/check-username', (req, res) => {
  const { username } = req.query;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ exists: !!row });
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (row) {
      try {
        const match = await bcrypt.compare(password, row.password);
        if (match) {
          res.json({ id: row.id, username: row.username });
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

router.get('/dictionary', (req, res) => {
  const { user_id } = req.query;

  db.all('SELECT * FROM words WHERE user_id = ?', [user_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ row });
  });
});

// app.get('/api/performance/metrics', (req, res) => {
//   db.all(`
//     SELECT 
//       model,
//       time_ms,
//       timestamp
//     FROM performance_metrics
//     ORDER BY timestamp
//   `, [], (err, rows) => {
//     if (err) return res.status(500).send('Database error');
    
//     const modelData = {};
//     rows.forEach(row => {
//       if (!modelData[row.model]) {
//         modelData[row.model] = [];
//       }
//       modelData[row.model].push({
//         time: row.time_ms,
//         timestamp: row.timestamp
//       });
//     });
    
//     const html = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <title>Сравнение моделей</title>
//       <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
//       <style>
//         body { font-family: Arial; margin: 20px; }
//         .chart-container { 
//           width: 90%; 
//           height: 400px;
//           margin: 30px auto;
//           border: 1px solid #eee;
//           padding: 20px;
//           box-shadow: 0 0 10px rgba(0,0,0,0.1);
//         }
//         h1 { color: #333; text-align: center; }
//         .stats { 
//           display: flex; 
//           justify-content: space-around;
//           margin: 20px 0;
//           flex-wrap: wrap;
//         }
//         .stat-card {
//           border: 1px solid #ddd;
//           padding: 15px;
//           border-radius: 5px;
//           width: 45%;
//           margin-bottom: 10px;
//         }
//       </style>
//     </head>
//     <body>
//       <h1>Сравнение производительности моделей</h1>
      
//       <div class="stats">
//         <div class="stat-card" id="stats1">
//           <h3>gpt-4o-mini (с дообучением)</h3>
//           <p>Среднее время: <span id="avg1"></span> мс</p>
//           <p>Минимум: <span id="min1"></span> мс</p>
//           <p>Максимум: <span id="max1"></span> мс</p>
//         </div>
//         <div class="stat-card" id="stats2">
//           <h3>gpt-4o-mini (без дообучения)</h3>
//           <p>Среднее время: <span id="avg2"></span> мс</p>
//           <p>Минимум: <span id="min2"></span> мс</p>
//           <p>Максимум: <span id="max2"></span> мс</p>
//         </div>
//       </div>
      
//       <div class="chart-container">
//         <canvas id="timeChart"></canvas>
//       </div>
      
//       <div class="chart-container">
//         <canvas id="distributionChart"></canvas>
//       </div>

//       <script>
//         // Подготовка данных
//         const data = ${JSON.stringify(modelData)};
//         const model1 = 'gpt-4o-mini';
//         const model2 = 'gpt-4o-mini without add.learning';
        
//         // Рассчитываем статистику
//         function calculateStats(values) {
//           const avg = values.reduce((a, b) => a + b, 0) / values.length;
//           return {
//             avg: avg.toFixed(1),
//             min: Math.min(...values),
//             max: Math.max(...values),
//             values: values
//           };
//         }
        
//         const stats1 = calculateStats(data[model1].map(x => x.time));
//         const stats2 = calculateStats(data[model2].map(x => x.time));
        
//         // Обновляем статистику на странице
//         document.getElementById('avg1').textContent = stats1.avg;
//         document.getElementById('min1').textContent = stats1.min;
//         document.getElementById('max1').textContent = stats1.max;
        
//         document.getElementById('avg2').textContent = stats2.avg;
//         document.getElementById('min2').textContent = stats2.min;
//         document.getElementById('max2').textContent = stats2.max;
        
//         // График временных рядов
//         new Chart(
//           document.getElementById('timeChart'),
//           {
//             type: 'line',
//             data: {
//               labels: [...data[model1].map(x => x.timestamp), ...data[model2].map(x => x.timestamp)],
//               datasets: [
//                 {
//                   label: model1,
//                   data: data[model1].map(x => x.time),
//                   borderColor: 'rgb(75, 192, 192)',
//                   tension: 0.1
//                 },
//                 {
//                   label: model2,
//                   data: data[model2].map(x => x.time),
//                   borderColor: 'rgb(255, 99, 132)',
//                   tension: 0.1
//                 }
//               ]
//             },
//             options: {
//               responsive: true,
//               plugins: {
//                 title: {
//                   display: true,
//                   text: 'Время ответа по запросам (мс)'
//                 },
//               },
//               scales: {
//                 x: {
//                   display: false // Скрываем метки времени для краткости
//                 },
//                 y: {
//                   title: {
//                     display: true,
//                     text: 'Время (мс)'
//                   }
//                 }
//               }
//             }
//           }
//         );
        
//         new Chart(
//           document.getElementById('distributionChart'),
//           {
//             type: 'boxplot',
//             data: {
//               labels: [model1, model2],
//               datasets: [{
//                 data: [stats1.values, stats2.values],
//                 backgroundColor: ['rgba(75, 192, 192, 0.5)', 'rgba(255, 99, 132, 0.5)'],
//                 borderColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
//                 borderWidth: 1
//               }]
//             },
//             options: {
//               responsive: true,
//               plugins: {
//                 title: {
//                   display: true,
//                   text: 'Распределение времени ответа'
//                 },
//               },
//               scales: {
//                 y: {
//                   title: {
//                     display: true,
//                     text: 'Время (мс)'
//                   }
//                 }
//               }
//             }
//           }
//         );
//       </script>
//     </body>
//     </html>
//     `;

//     res.send(html);
//   });
// });

router.get('/statistics', (req, res) => {
  const { user_id } = req.query;

  console.log(user_id)

  db.all('SELECT * FROM word_answers WHERE user_id = ?', [user_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ row });
  });
});

router.get('/statistics/additionalInfo', (req, res) => {
  const { user_id } = req.query;

  db.all(`SELECT 
            DATE(answered_at) AS answer_date,
            SUM(is_correct) AS correct_answers,
            COUNT(is_correct) - SUM(is_correct) AS incorrect_answers,
            (SUM(is_correct) * 100 / COUNT(is_correct)) AS percent_correct
          FROM 
              word_answers
          WHERE user_id = ?
          GROUP BY 
              DATE(answered_at)
          ORDER BY 
              answer_date;`, [user_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ row });
  });
});

router.get('/statistics/additionalInfo/word', (req, res) => {
  const { user_id } = req.query;

  db.all(`SELECT 
            DATE(answered_at) AS answer_date,
            word,
            SUM(is_correct) AS correct_answers,
            COUNT(is_correct) - SUM(is_correct) AS incorrect_answers,
            (SUM(is_correct) * 100 / COUNT(is_correct)) AS percent_correct
          FROM 
              word_answers
          WHERE user_id = ?
          GROUP BY 
              DATE(answered_at), word
          ORDER BY 
              answer_date;`, [user_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ row });
  });
});

router.get('/vocabulary', async (req, res) => {
  const { user_id } = req.query;

  db.all(`SELECT word, rating, last_used FROM words WHERE user_id = ?`, [user_id], (err, row) => {
  if (err) {
    return res.status(500).json({ error: err.message });
  }
  res.json({ row });
  });
})

router.get('/forecast', async (req, res) => {
  const { user_id } = req.query;

  try {
    const stats = await new Promise((resolve, reject) => {
      db.all(`SELECT u.username, wa.answer_date, wa.percent_correct
              FROM (
                SELECT
                  DATE(answered_at) AS answer_date,
                  (SUM(is_correct) * 100.0 / COUNT(is_correct)) AS percent_correct
                FROM word_answers
                WHERE user_id = ?
                GROUP BY DATE(answered_at)
              ) wa
              JOIN users u ON u.id = ?
              ORDER BY wa.answer_date`, 
              [user_id, user_id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
              });
    });

    if (stats.length < 3) {
      return res.json({ 
        error: "Недостаточно данных для прогноза. Нужно минимум 21 день тренировок, количество достаточное для формирования привычки." 
      });
    }

    // if (stats.length < 21) {
    //   return res.json({ 
    //     error: "Недостаточно данных для прогноза. Нужно минимум 21 день тренировок, количество достаточное для формирования привычки." 
    //   });
    // }
    
    const forecast = await makeForecast(stats);
    
    res.json(forecast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
