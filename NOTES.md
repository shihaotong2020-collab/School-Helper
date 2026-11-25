# School Helper

Start with `node --env-file=.env server/app.mjs` and open http://127.0.0.1:3000.

## Done
Use Save to favorites under an explanation. Open its question in Favorites to read it again in this browser.
Click Quiz me after an explanation for one practice question on the same topic. Type your attempt in the box directly below the quiz question and press Check for feedback. The box also opens when you load an unanswered quiz. The quiz and feedback stay in the chat.

Choose from five starter topics in each of five school subjects to fill in an editable question. Press Check to start it, or leave the picker empty and write your own question.

Click Clarify a term under an answer, highlight a confusing word or phrase in any answer (or type it), and press Check. The explanation uses the current topic and stays in the chat when saved.

Choose Homework hint before asking a question, or click Get a hint under a reply for one more clue. Repeated hints keep the original problem, the latest student-written progress, and recent exchanges in view, including after loading a saved chat. Each clue stays in the chat and can be saved with it.

Checked Step by step with “How do I add 1/3 and 1/4?” The AI gave five numbered steps, showed how to rewrite both fractions in twelfths, and left the numerator for the student to calculate.

Checked Homework hint with a rectangle whose perimeter is 34 cm and length is 10 cm. The AI used both numbers to set up the equation and left the final calculation to the student.

All help styles request readable math such as 1/2 = 2/4 and explain the letters in formulas. The page also cleans up common math formatting in earlier saved answers. Tested with “Why do equivalent fractions have the same value?” The answer showed how splitting each half into two quarters keeps the amount the same.

Checked In detail with “Why do we have seasons on Earth?” The live answer connected Earth’s tilt to sunlight angle and day length, then explained why the two hemispheres have opposite seasons.

Summary accepts a passage of up to 20,000 characters or a concept name. Checked with a 19,238-character classroom observation log and the single word “Photosynthesis”. Both produced short summaries of the main ideas.

After an answer, click Follow-up to open another question box below it. Press Check to add the reply. Earlier exchanges stay visible and the AI uses the last exchange for context. Refresh or submit a new question in the top box to start again.
Checked Simpler words with the same question in two styles. For a quick demo, ask “Why do puddles dry up?” using In detail, then select Simpler words and press Check again. The question stays in the box.

After an answer, click Example or Analogy next to Follow-up. Each button adds a reply to the same chat. Save chat includes all of them. The server sends middle-school tutoring and safety instructions each time.
The AI connects through getKey() on the server. Model: gpt-5.6-luna.

Saves on this computer only for now. The browser remembers the help style and practice sample titles. Press Save chat to store completed questions and answers in this browser and get a code. Enter the code under Saved chats and press Load chat to continue. Refreshing keeps saved chats. Clearing site data removes them.

After each save point, push it to GitHub.

## Next
Try the help styles with classroom questions and review factual accuracy before recording the demo.

## Maybe Later





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

Customize look lets students choose background, card, and button colors, move the sidebar before or after the worksheet, and put either sidebar section first. Preferences stay in this browser. Reset look restores the original layout and colors.
