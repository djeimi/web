const fs = require('fs');
const json = require('json');
const { invokeModel } = require('../services/modelService');

function loadDictionaries () {
  const combinedDict = {};
  
  const trainData = fs.readFileSync('utils/train.txt', 'utf-8').split('\n');
  trainData.forEach(line => {
    const parts = line.split(';');
    if (parts.length === 3) {
      const word = parts[0].trim();
      const example = parts[1].trim();
      if (!combinedDict[word]) {
        combinedDict[word] = new Set();
      }
      combinedDict[word].add(example);
    }
  });
  
  const trainJsonData = fs.readFileSync('utils/_train.txt', 'utf-8').split('\n');
  trainJsonData.forEach(line => {
    const entry = JSON.parse(line);
    const word = entry.word;
    const example = entry.example.split('[SEP]')[1].trim();
    if (!combinedDict[word]) {
      combinedDict[word] = new Set();
    }
    combinedDict[word].add(example);
  });

  for (const word in combinedDict) {
    combinedDict[word] = Array.from(combinedDict[word]);
  }

  return combinedDict;
};

const combinedDict = loadDictionaries();

function prompt(word, complexity) {
  let basePrompt;
  
  const examples = combinedDict[word] || [];
  const examplesStr = examples.join('\n');
  basePrompt = `User provided the keyword ${word}.
      Use the following example sentences to improve generation:\n${examplesStr}
      \nGenerate a new sentence for English practice with this word, replacing it with '___',
      user requested training difficulty - ${complexity}`;

  console.log('Base Prompt', basePrompt);
  return basePrompt;
};

async function generateWord (word, complexity) {
  console.log('Generating sentence for word ', word);
  return await invokeModel([{ role: 'system', content: prompt(word, complexity) }]);
};

async function getComplexity (complexity) {
  const response = await invokeModel([{
    role: 'system',
    content: `User was asked how difficult the training should be. Their answer: ${complexity}. Rate this difficulty on a 3-point scale, where 1 is easy and 3 is hard, just give the number as the answer`
  }]);
  return parseInt(response.content);
};

module.exports = { loadDictionaries, prompt, generateWord, getComplexity};