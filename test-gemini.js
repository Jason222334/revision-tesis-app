const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
async function run() {
  const models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro', 'gemini-pro', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hola');
      console.log(modelName + ': OK');
    } catch (e) {
      console.error(modelName + ': FAILED - ' + e.message.substring(0, 100));
    }
  }
}
run();
