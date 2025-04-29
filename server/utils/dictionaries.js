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

function prompt(word, complexity, usedSentences = new Set()) {
  let basePrompt;

  const complexityLevels = {
    '1': 'simple English using basic vocabulary',
    '2': 'intermediate English with some context',
    '3': 'advanced English with precise terminology, idioms'
  };

  const usedExamplesStr = usedSentences.size > 0 
    ? `\nDo not use this examples in any way: ${Array.from(usedSentences).join(', ')}. 
    Make sentence structure completely different from this examples`
    : '';
  
  const examples = combinedDict[word] || [];
  const examplesStr = examples.join('\n');
  
  basePrompt = `User provided the keyword ${word}.
      Use the following example sentences to improve generation:\n${examplesStr}
      \n${usedExamplesStr}
      \nGenerate a new sentence for English practice with this word, replacing it with '___',
      user requested training difficulty - ${complexityLevels[complexity]}`;

  // basePrompt = `User provided the keyword ${word}.
  //     \n${usedExamplesStr}
  //     \nGenerate a new sentence for English practice with this word, replacing it with '___',
  //     user requested training difficulty - ${complexityLevels[complexity]}`;

  console.log('Base Prompt', basePrompt);
  return basePrompt;
};

async function generateWord(word, complexity, usedSentences = new Set()) {
  if (!(usedSentences instanceof Set)) {
    usedSentences = new Set(usedSentences);
  }

  console.log('Generating sentence for word ', word);
  const MAX_ATTEMPTS = 3;
  let attempts = 0;
  let generatedSentence;

  // Сначала получаем сложность
  const actualComplexity = await getComplexity(complexity);

  while (attempts < MAX_ATTEMPTS) {
    // Теперь передаем уже вычисленную сложность
    generatedSentence = await invokeModel([{ 
      role: 'system', 
      content: prompt(word, actualComplexity, usedSentences) 
    }]);

    // Check uniqueness
    if (!usedSentences.has(generatedSentence.content)) {
      break;
    }
    
    console.log(`Duplicate detected. Regenerating (attempt ${attempts + 1})`);
    attempts++;
  }

  if (attempts === MAX_ATTEMPTS) {
    console.warn('Max regeneration attempts reached. Returning last generated sentence.');
  }
  return generatedSentence;
};

async function getComplexity (complexity) {
  const response = await invokeModel([{
    role: 'system',
    content: `User was asked how difficult the training should be. Their answer: ${complexity}. Rate this difficulty on a 3-point scale, where 1 is easy and 3 is hard, just give the number as the answer`
  }]);
  
  return parseInt(response.content);
};

module.exports = { loadDictionaries, prompt, generateWord, getComplexity};