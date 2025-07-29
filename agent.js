const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const readline = require("readline/promises");

const expenseDB = [];
const incomeDB = [];

async function callAgent() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages = [
    {
      role: "system", //persona
      content: `You are Josh, a personal finance assistant. You task is to assistuser with their expenses,balances and fincial planning.
      You have access to following tools:
      1. getTotalExpenses({from,to}) : string // Get total expense for a time period.
      2. addExpense({name,amount}) : string // Add new expense to the expense database.
      3. addIncome({name,amount}) : string // Add new income to income database.
      4. getMoneyBalance() : string // Get remaining money balance from database.
      current datetime:${new Date().toUTCString()}`,
    },
  ];

  //thsi is for user prompt loop
  while (true) {
    const question = await rl.question("User: ");

    if (question == "bye") {
      break;
    }

    messages.push({
      role: "user",
      content: question,
    });

    //this is for agent
    while (true) {
      const completion = await groq.chat.completions.create({
        messages: messages,
        model: "llama-3.3-70b-versatile",
        tool_choice: "auto",
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
          {
            type: "function",
            function: {
              name: "addIncome",
              description: "Add new income entry to the income database.",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description:
                      "Name of the income. e.g., Got salary, profit in sell car",
                  },
                  amount: {
                    type: "string",
                    description: "Amount of the income.",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "getMoneyBalance",
              description: "Get remaining money balance from database",
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
        } else if (functionName == "addIncome") {
          result = addIncome(JSON.parse(functionArgs));
        } else if (functionName == "getMoneyBalance") {
          result = getMoneyBalance();
        }

        // console.log(`Tool result: ${result}`);

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

        // console.log("-----------------------------------------------------");
        // console.log("-----------------------------------------------------");
        // console.log("Messages: ");
        // console.log(messages);
        // console.log("-----------------------------------------------------");
        // console.log("DB: ", expenseDB);
      }
    }
  }
  rl.close();
}
callAgent();

//Tools:
//Get total expenses

function getTotalExpenses({ from, to }) {
  // console.log("Calling getTotalExpenses tool");

  //In reality->we call do here...
  const expense = expenseDB.reduce((accum, curEle) => {
    return accum + Number(curEle.amount);
  }, 0);
  return `₹ ${expense}`;
}

function addExpense({ name, amount }) {
  console.log(`Adding ${amount} to expense db for ${name}`);
  expenseDB.push({ name, amount: Number(amount) });
  return "Added to the expense database.";
}

function addIncome({ name, amount }) {
  console.log(`Adding ${amount} to income db for ${name}`);
  incomeDB.push({ name, amount: Number(amount) });
  return "Added to the income database.";
}

function getMoneyBalance() {
  const totalIncome = incomeDB.reduce((accum, curEle) => {
    return accum + Number(curEle.amount);
  }, 0);

  const totalExpense = expenseDB.reduce((accum, curEle) => {
    return accum + Number(curEle.amount);
  }, 0);

  return `₹${totalIncome - totalExpense}`;
}
