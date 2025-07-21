const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {
  const messages = [
    {
      role: "system", //persona
      content: `You are Josh, a personal finance assistant. You task is to assistuser with their expenses,balances and fincial planning.
        current datetime:${new Date().toUTCString()}`,
    },
  ];

  messages.push({
    role: "user",
    content: "How much money I hav spent this month?",
  });

  const completion = await groq.chat.completions.create({
    // messages: [
    //   {
    //     role: "system", //persona
    //     content: `You are Josh, a personal finance assistant. You task is to assistuser with their expenses,balances and fincial planning.
    //       current datetime:${new Date().toUTCString()}`,
    //   },
    //   {
    //     role: "user",
    //     content: "How much money I hav spent this month?",
    //   },
    // ],
    messages: messages,

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

  messages.push(completion.choices[0].message); //Assistant msg

  console.log(JSON.stringify(completion.choices[0], null, 2));

  const toolCalls = completion.choices[0].message.tool_calls;

  if (!toolCalls) {
    console.log(`Assistant: ${completion.choices[0].message.content}`);
    return;
  }

  //Call the tool
  for (const tool of toolCalls) {
    const functionName = tool.function.name;
    const functionArgs = tool.function.arguments;

    let result = "";
    if (functionName == "getTotalExpenses") {
      result = getTotalExpenses(JSON.parse(functionArgs));
      console.log(`Tool result: ${result}`);
    }

    messages.push({
      role: "tool",
      content: result,
      tool_call_id: tool.id,
    });

    //Send the result back to the assistant
    const completion2 = await groq.chat.completions.create({
      messages: messages,
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
                  description:
                    "To date to calculate expense. Format: YYYY-MM-DD",
                },
              },
            },
          },
        },
      ],
    });

    console.log(JSON.stringify(completion2.choices[0], null, 2));

    console.log("-----------------------------------------------------");
    console.log("-----------------------------------------------------");
    console.log("Messages: ");
    console.log(messages);
  }
}
callAgent();

//Tools:
//Get total expenses

function getTotalExpenses({ from, to }) {
  console.log("Calling getTotalExpenses tool");

  //In reality->we call do here...
  return "₹10000";
}
