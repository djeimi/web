const { OpenAI } = require('openai');
const client = new OpenAI();

exports.invokeModel = async (messages) => {

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages,
    temperature: 0.7
  });

  return response.choices[0].message;
};