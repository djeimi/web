const { saveWord, getVocLen, checkWordExists, trainWords, updateWordRating } = require('../services/wordService');
const { invokeModel } = require('../services/modelService');
const { saveWordTools, trainWordTools } = require('../utils/tools');
const { OpenAI } = require('openai');
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.processMessage = async (req, res) => {
  let { userId, message, chatHistory, trainingState } = req.body;

  console.log(`Received message from user ${userId}: ${message}`);

  try {
    const vocLen = await getVocLen(userId);
    const initialMessage = `Добрый день, чем хотите заняться сегодня? На текущий момент вы добавили ${vocLen} слов.`;

    if (chatHistory.length === 0) {
      chatHistory.push({ role: 'assistant', content: initialMessage });
      return res.json({ result: initialMessage, chatHistory });
    }

    chatHistory.push({ role: 'user', content: message });

    if (trainingState && trainingState.inProgress) {
      const { word, sentence } = trainingState.currentSentence;
      const isCorrect = message.trim().toLowerCase() === word.trim().toLowerCase();

      await updateWordRating(userId, word, isCorrect);

      const feedbackMessage = isCorrect ? 'Correct!' : `Incorrect. Правильный ответ ${word}.`;
      chatHistory.push({ role: 'assistant', content: feedbackMessage });

      const nextSentence = trainingState.remainingSentences.shift();
      if (nextSentence) {
        trainingState.currentSentence = nextSentence;
        chatHistory.push({ role: 'assistant', content: nextSentence.generated_sentence });
        return res.json({ result: [feedbackMessage, nextSentence.generated_sentence], chatHistory, trainingState });
      } else {
        trainingState.inProgress = false;
        return res.json({ result: feedbackMessage + " Training completed.", chatHistory, trainingState });
      }
    } else {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: chatHistory,
        tools: [...saveWordTools, ...trainWordTools],
        tool_choice: 'auto',
        temperature: 0.7
      });

      const responseMessage = response.choices[0].message;
      const toolCalls = responseMessage.tool_calls;

      if (toolCalls) {
        for (const call of toolCalls) {
          const functionName = call.function.name;
          const arguments = JSON.parse(call.function.arguments);

          console.log(`Function call: ${functionName} with arguments:`, arguments);

          if (functionName === 'save_word') {
            const wordExists = await checkWordExists(userId, arguments.word);
            if (wordExists) {
              chatHistory.push({ role: 'assistant', content: `Слово "${arguments.word}" уже добавлено в словарь. Хотите обновить его статистику?` });
              return res.json({ result: `Слово "${arguments.word}" уже добавлено в словарь. Хотите обновить его статистику?`, chatHistory });
            } else {
              await saveWord(userId, arguments.word);
              const updatedVocLen = await getVocLen(userId);
              chatHistory.push({ role: 'assistant', content: `Слово "${arguments.word}" успешно добавлено. Теперь у вас ${updatedVocLen} слов в словаре.` });
              return res.json({ result: `Слово "${arguments.word}" успешно добавлено. Теперь у вас ${updatedVocLen} слов в словаре.`, chatHistory });
            }
          } else if (functionName === 'train_words') {
            const count = arguments.quantity;
            const complexity = arguments.complexity;
            const specificWords = arguments.specificWords || [];
            const useLastTrained = arguments.useLastTrained || false;

            const result = await trainWords(userId, count, complexity, specificWords, useLastTrained);

            const firstSentence = result.results[0];
            trainingState = {
              inProgress: true,
              currentSentence: firstSentence,
              remainingSentences: result.results.slice(1)
            };

            chatHistory.push({ role: 'assistant', content: firstSentence.generated_sentence });
            return res.json({ result: firstSentence.generated_sentence, chatHistory, trainingState });
          }
        }
      } else {
        console.log(`No function calls. Responding: ${responseMessage.content}`);
        chatHistory.push({ role: 'assistant', content: responseMessage.content });
        return res.json({ result: responseMessage.content, chatHistory });
      }
    }
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: error.message });
  }
};