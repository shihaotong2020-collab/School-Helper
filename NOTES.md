# School Helper

Start with `node --env-file=.env server/app.mjs` and open http://127.0.0.1:3000.

## Done
After an answer, replace the question and press Check to follow up. The page remembers the last exchange until you refresh or choose a practice question.
Checked Simpler words with the same question in two styles. For a quick demo, ask “Why do puddles dry up?” using In detail, then select Simpler words and press Check again. The question stays in the box.

Students choose Simpler words, Summary, In detail, Homework hint, or Step by step, then press Check. The server sends middle-school tutoring and safety instructions each time.
The AI connects through getKey() on the server. Model: gpt-5.6-luna.

Saves on this computer only for now. The browser remembers the help style and practice sample titles. Questions and answers are never written to browser storage.

After each save point, push it to GitHub.

## Next
Try the five styles with classroom questions and review factual accuracy before recording the demo.

## Maybe Later
- The user can request explanations in different ways, like examples or analogies.
- The user can get hints instead of direct answers to encourage learning.
- The user can ask the AI to clarify confusing terms or jargon.
- The user can choose a topic from a list of common subjects.
- The user can learn through interactive quizzes based on their questions.
- The user can save their favorite explanations for future reference.
- The user can report inappropriate responses from the AI to ensure safety.
- The user can receive reminders not to share personal information.
- The user can ask for related topics to expand their understanding.
- The user can provide feedback on explanations to improve AI responses.

The water-cycle practice passage follows [USGS Water Science School](https://www.usgs.gov/special-topics/water-science-school/water-cycle).

## Put School Helper online with Vercel

1. In Vercel, choose **Add New → Project** and import the School-Helper GitHub repository. Keep the project root at the repository root.
2. Under **Environment Variables**, add `KEYGEN_URL` and `KEYGEN_TOKEN` using your private values. Select **Production** and also **Preview** if preview links should answer questions.
3. Choose **Deploy**. The repository config serves the page from `public` and sends Check requests to the Node.js function in `api/ask.mjs`. Leave the build settings at their defaults.
4. Open the deployment link, pick a practice question, and press **Check**. If you change either variable later, redeploy to use the new value.

The server obtains its AI key through getKey(). Saving still uses each browser's local storage.
