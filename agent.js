const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system", //persona
        content: `You are Josh, a personal finance assistant. You task is to assistuser with their expenses,balances and fincial planning.
          current datetime:${new Date().toUTCString()}`,
      },
      {
        role: "user",
        content: "How much money I hav spent this month?",
      },
    ],
    model: "llama-3.3-70b-versatile",
    tools: [
      {
        type: "function",
        function: {
          name: "getTotalExpenses",
          description: "Get total expense from date to date.",
          parameters: {
            type: "object",
            properties: {
              from: {
                type: "string",
                description:
                  "From date to calculate expense. Format: YYYY-MM-DD",
              },
              to: {
                type: "string",
                description: "To date to calculate expense. Format: YYYY-MM-DD",
              },
            },
          },
        },
      },
    ],
  });
  console.log(JSON.stringify(completion.choices[0], null, 2));
}
callAgent();

//Tools:
//Get total expenses

function getTotalExpenses({ from, to }) {
  console.log("Calling getTotalExpenses tool");

  //In reality->we call do here...
  return 10000;
}
