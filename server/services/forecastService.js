const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const csv = require('csv-writer').createObjectCsvWriter;

// Для простоты будем использовать Python + Prophet
async function makeForecast(stats) {
  // Подготовка данных
  const csvWriter = csv({
    path: 'temp_data.csv',
    header: [
      {id: 'ds', title: 'ds'}, 
      {id: 'y', title: 'y'},   
      {id: 'username', title: 'username'}   
    ]
  });

  await csvWriter.writeRecords(stats.map(row => ({
    ds: row.answer_date,
    y: row.percent_correct,
    username: row.username
  })));

  // Запуск Python скрипта для прогноза
  return new Promise((resolve, reject) => {
    exec(`python ${path.join(__dirname, 'forecast.py')}`, (error, stdout, stderr) => {
      if (error) {
        console.log(error)
        reject(error);
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        console.log(result)
        resolve(result);
      } catch (e) {
        console.log(e)
        reject(e);
      }
    });
  });
}

module.exports = { makeForecast };