export async function getBotResponse(userInput) {
    const response = await fetch('/api/get-bot-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: userInput }),
    });
  
    const data = await response.json();
    return data.response;
  }  