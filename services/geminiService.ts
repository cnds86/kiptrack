import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Account, Category, TransactionType, Currency, SavingsGoal, AIParsedResult, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  currencies: Currency[],
  language: Language = 'TH'
): Promise<string> => {
  if (!process.env.API_KEY) {
    return language === 'EN' ? "Please set API Key to use AI features." : 
           language === 'LA' ? "ກະລຸນາຕັ້ງຄ່າ API Key ເພື່ອໃຊ້ງານ AI." :
           "กรุณาตั้งค่า API Key เพื่อใช้งานฟีเจอร์ AI";
  }

  const baseCurrency = currencies.find(c => c.isBase) || currencies[0];

  // Prepare data summary for the AI
  const recentTransactions = transactions.slice(0, 50); // Analyze last 50 transactions
  const totalBalance = accounts.reduce((sum, acc) => {
     const currency = currencies.find(c => c.code === acc.currencyCode);
     const rate = currency ? currency.rate : 1;
     return sum + (acc.balance * rate);
  }, 0);
  
  const langName = language === 'TH' ? 'Thai' : language === 'LA' ? 'Lao' : 'English';

  const prompt = `
    You are a financial advisor for a user.
    Base Currency: ${baseCurrency.name} (${baseCurrency.symbol}).
    Language: ${langName}.
    
    Current Financial State:
    - Total Net Worth (Est. in Base Currency): ${totalBalance} ${baseCurrency.code}
    - Accounts: ${JSON.stringify(accounts.map(a => ({ name: a.name, balance: a.balance, currency: a.currencyCode })))}
    - Recent Transactions (Last 50): ${JSON.stringify(recentTransactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || 'Unknown';
      const acc = accounts.find(a => a.id === t.accountId);
      return { date: t.date, type: t.type, amount: t.amount, currency: acc?.currencyCode, category: cat, note: t.note };
    }))}

    Please provide a concise financial summary and 3 actionable tips to save money or manage better.
    Use emoji to make it friendly. Keep the response under 200 words.
    Structure the response in Markdown.
    Reply strictly in ${langName} language.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || (language === 'EN' ? "Cannot analyze data right now." : "ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้");
  } catch (error) {
    console.error("Gemini Error:", error);
    return language === 'EN' ? "Error connecting to AI." : "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI";
  }
};

export const parseTransactionWithGemini = async (
  text: string,
  accounts: Account[],
  categories: Category[],
  currencies: Currency[],
  goals: SavingsGoal[] = []
): Promise<AIParsedResult | null> => {
  if (!process.env.API_KEY || !text) return null;

  const today = new Date().toISOString().split('T')[0];
  
  const prompt = `
    Analyze the following user input text regarding personal finance.
    User Input: "${text}"
    Current Date: ${today}

    YOUR GOAL: Extract structured data and map it strictly to the provided IDs.

    --- CONTEXT DATA ---
    Accounts: 
    ${JSON.stringify(accounts.map(a => ({ id: a.id, name: a.name, type: a.type, currency: a.currencyCode })))}
    
    Categories: 
    ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name, type: c.type })))}
    
    Goals: 
    ${JSON.stringify(goals.map(g => ({ id: g.id, name: g.name })))}
    --------------------

    Rules:
    1. Action Determination:
       - "TRANSACTION": Spending or Income.
       - "CREATE_GOAL": Starting a new goal.
       - "DEPOSIT_GOAL": Adding money to existing goal.

    2. Account Mapping (CRITICAL):
       - Check user input for Account Names (fuzzy match).
       - Check for Account Type keywords: "cash" -> find account with type 'CASH'; "bank"/"transfer"/"qr"/"scan" -> find account with type 'BANK'.
       - Check for Currency usage: if user mentions specific currency (e.g., "Baht", "Kip", "Dollar"), pick account with that currency.
       - If multiple matches or unsure, default to the first account in the list.

    3. Category Mapping (CRITICAL):
       - Semantic Analysis: Map the spending item/activity to the most appropriate Category Name.
       - Example: "Food", "Rice", "Dinner", "KFC" -> Food Category.
       - Example: "Taxi", "Gas", "Bus", "Uber" -> Transport Category.
       - Ensure the selected Category ID corresponds to the Transaction Type (INCOME vs EXPENSE).

    4. Amount & Currency:
       - Extract numeric amount.

    RETURN JSON ONLY. No markdown formatting.
    Schema:
    {
      "action": "TRANSACTION" | "CREATE_GOAL" | "DEPOSIT_GOAL",
      "amount": number,
      "type": "INCOME" | "EXPENSE" (for transactions),
      "categoryId": string (ID from context),
      "accountId": string (ID from context),
      "date": string (YYYY-MM-DD),
      "note": string,
      "goalName": string (if CREATE_GOAL),
      "targetAmount": number (if CREATE_GOAL),
      "deadline": string (if CREATE_GOAL),
      "goalId": string (if DEPOSIT_GOAL)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const jsonText = response.text;
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};

export const parseReceiptWithGemini = async (
  base64Image: string,
  accounts: Account[],
  categories: Category[],
  currencies: Currency[]
): Promise<AIParsedResult | null> => {
  if (!process.env.API_KEY || !base64Image) return null;

  const today = new Date().toISOString().split('T')[0];
  
  // Extract base64 data (remove header if present)
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const prompt = `
    Analyze this image.

    First, VALIDATION STEP:
    Is this image a receipt, bill, invoice, or bank transfer slip?
    - If NO (e.g., photo of a person, landscape, animal, general object, or unreadable), return JSON with action "INVALID_IMAGE".
    - If YES, proceed to extract data.

    Current Date: ${today}

    --- CONTEXT DATA ---
    Accounts: 
    ${JSON.stringify(accounts.map(a => ({ id: a.id, name: a.name, type: a.type, currency: a.currencyCode })))}
    
    Categories: 
    ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name, type: c.type })))}
    --------------------

    Rules:
    1. Extract the Total Amount.
    2. Determine if it's Expense (Receipt/Bill) or Income (Transfer Slip receiving money). 
       - Standard Receipts are EXPENSE.
       - Bank Transfer Slips: Check context. If it shows "Sent to" someone else, it's EXPENSE. If it shows "Received from", it's INCOME. If ambiguous, assume EXPENSE.
    3. Identify the Merchant/Payee and put it in the "note".
    4. Map to the BEST Category ID (CRITICAL):
       - Analyze the items listed or the merchant type.
       - Match semantically to the provided Category Names (e.g. 7-Eleven -> Shopping/Food; Shell -> Transport).
       - You MUST return a valid 'categoryId' from the context.
    5. Select the most likely Account ID (CRITICAL):
       - Look for payment method clues: "Cash", "Credit Card", "QR Payment", Bank Logos.
       - "Cash" -> Map to Account with type 'CASH'.
       - "Transfer"/"QR"/"Bank" -> Map to Account with type 'BANK'.
       - Default to the first account if no clues found.

    RETURN JSON ONLY.
    Schema:
    {
      "action": "TRANSACTION" | "INVALID_IMAGE",
      "amount": number,
      "type": "INCOME" | "EXPENSE",
      "categoryId": string,
      "accountId": string,
      "date": string (YYYY-MM-DD),
      "note": string
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
            { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const jsonText = response.text;
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Image Parse Error:", error);
    throw error;
  }
};
