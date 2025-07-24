const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const expenseDB = [];

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
    content: "Hey I just bought a mackbook pro for ₹300000.",
  });

  while (true) {
    const completion = await groq.chat.completions.create({
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
        {
          type: "function",
          function: {
            name: "addExpense",
            description: "Add new expense entry to the expense database.",
            parameters: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name of the expense. e.g., iphone",
                },
                amount: {
                  type: "string",
                  description: "Amount of the expense.",
                },
              },
            },
          },
        },
      ],
    });

    messages.push(completion.choices[0].message); //Assistant msg

    // console.log(JSON.stringify(completion.choices[0], null, 2));

    const toolCalls = completion.choices[0].message.tool_calls;

    if (!toolCalls) {
      console.log(`Assistant: ${completion.choices[0].message.content}`);
      // return;
      break;
    }

    //Call the tool
    for (const tool of toolCalls) {
      const functionName = tool.function.name;
      const functionArgs = tool.function.arguments;

      let result = "";
      if (functionName == "getTotalExpenses") {
        result = getTotalExpenses(JSON.parse(functionArgs));
      } else if (functionName == "addExpense") {
        result = addExpense(JSON.parse(functionArgs));
      }

      console.log(`Tool result: ${result}`);

      messages.push({
        role: "tool",
        content: result,
        tool_call_id: tool.id,
      });

      //Send the result back to the assistant
      // const completion2 = await groq.chat.completions.create({
      //   messages: messages,
      //   model: "llama-3.3-70b-versatile",
      //   tools: [
      //     {
      //       type: "function",
      //       function: {
      //         name: "getTotalExpenses",
      //         description: "Get total expense from date to date.",
      //         parameters: {
      //           type: "object",
      //           properties: {
      //             from: {
      //               type: "string",
      //               description:
      //                 "From date to calculate expense. Format: YYYY-MM-DD",
      //             },
      //             to: {
      //               type: "string",
      //               description:
      //                 "To date to calculate expense. Format: YYYY-MM-DD",
      //             },
      //           },
      //         },
      //       },
      //     },
      //   ],
      // });

      // console.log(JSON.stringify(completion2.choices[0], null, 2));

      console.log("-----------------------------------------------------");
      console.log("-----------------------------------------------------");
      console.log("Messages: ");
      console.log(messages);
      console.log("-----------------------------------------------------");
      console.log("DB: ", expenseDB);
    }
  }
}
callAgent();

//Tools:
//Get total expenses

function getTotalExpenses({ from, to }) {
  console.log("Calling getTotalExpenses tool");

  //In reality->we call do here...
  const expense = expenseDB.reduce((accum, curEle) => {
    return accum + curEle.amount;
  }, 0);
  return `₹ ${expense}`;
}

function addExpense({ name, amount }) {
  console.log(`Adding ${amount} to expense db for ${name}`);
  expenseDB.push({ name, amount });
  return "Added to the database.";
}
