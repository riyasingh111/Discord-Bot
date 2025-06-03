Discord Bot
This is a feature-rich Discord bot built with Node.js and the discord.js library, hosted on Replit. It combines fun interactive games, music playback, and leverages Google's Generative AI models (Gemini for text generation) to provide a dynamic and engaging experience for your Discord server.

✨ Features
This bot comes packed with a variety of commands and functionalities:

🤖 AI-Powered Chat: Engage in casual conversations with the bot, powered by Google's Gemini AI model.

🧠 AI Text Generation: Use !askai [your question] to get intelligent responses to your queries.

🎶 Music Playback:

!play [YouTube URL or search term]: Play music from YouTube in a voice channel.

!skip: Skip the current song in the queue.

!stop: Stop music playback and make the bot leave the voice channel.

!queue: View the current music queue.

🎲 10+ Interactive Games:

!startguess: Start a "Guess the Number" game (1-100).

!guess [number/answer]: Submit a guess for "Guess the Number" or "Emoji Guessing" game.

!stopguess: Stop the "Guess the Number" game.

!rps [rock/paper/scissors]: Play Rock-Paper-Scissors against the bot.

!coinflip: Flip a coin (Heads or Tails).

!8ball [your question]: Ask the Magic 8-Ball a yes/no question.

!roll [XdY]: Roll multiple dice (e.g., !roll 2d6 for two 6-sided dice).

!fact: Get a random interesting fact.

!choose [item1, item2, ...]: Let the bot randomly choose from a list of items.

!reverse [text]: Get any text reversed.

!wouldyourather: Get a random "Would you rather...?" question.

!insult [@user or blank]: Deliver a lighthearted, randomized insult.

!emojiguess: Start an emoji guessing game.

!stopemojiguess: Stop the emoji guessing game.

📜 Basic Commands:

!ping: Check if the bot is online.

!hello: Get a personalized greeting.

!rules: Display predefined server rules.

!embed: See an example of a rich Discord embed message.

🚀 Getting Started
This guide assumes you have a basic understanding of Discord and GitHub. We'll be using Replit as the hosting platform, which makes setup incredibly easy without needing to download any software.

Prerequisites
A Discord account.

A Replit account.

A GitHub account.

A Google Cloud Project with the Generative Language API enabled (for !askai command).

1. Discord Bot Setup
Create a New Application:

Go to the Discord Developer Portal.

Click "New Application" and give it a name (e.g., "MyAwesomeBot").

Add a Bot:

Navigate to the "Bot" tab on the left sidebar.

Click "Add Bot" and confirm.

Enable Message Content Intent:

Under "Privileged Gateway Intents," enable the "Message Content Intent" toggle. This is crucial for your bot to read message content.

Copy Your Bot Token:

Click "Reset Token" and copy your bot's token. Keep this token secret! You'll need it for Replit.

Invite Your Bot to Your Server:

Go to the "OAuth2" tab, then "URL Generator."

Under "Scopes," select bot.

Under "Bot Permissions," select the following:

Send Messages

Read Message History

Embed Links

Attach Files

Connect (for music)

Speak (for music)

Use Voice Activity (for music)

Copy the generated URL at the bottom. Paste it into your browser, select your server, and authorize the bot. You must have "Manage Server" permissions on the server to add bots.

2. Google Cloud API Key Setup (for AI features)
Get a Google Cloud API Key:

Go to the Google Cloud Console.

Create a new project if you don't have one.

Navigate to APIs & Services > Credentials.

Click "+ CREATE CREDENTIALS" and select "API Key."

Copy this key immediately.

Important: Restrict this API key to only allow calls to the Generative Language API (or similar, depending on Google's naming).

3. Replit Project Setup
Create a New Repl:

Go to Replit.com and log in.

Click "+ Create Repl" or "Create App."

Select "Node.js" as the template.

Give your Repl a name (e.g., my-discord-bot).

Click "Create Repl."

Add Secrets:

In your Replit project, click the "Secrets" icon (padlock 🔒) on the left sidebar.

Add two new secrets:

KEY: DISCORD_BOT_TOKEN

VALUE: Paste your Discord bot token here.

KEY: GOOGLE_API_KEY

VALUE: Paste your Google Cloud API Key here.

Update index.js:

Open the index.js file in Replit.

Replace its entire content with the code provided in the immersive block at the top of this README (or the latest code from the model's response).

Update package.json:

Open the package.json file in Replit.

Replace its entire content with the following pure JSON (no comments):

{
  "name": "my-discord-bot-full",
  "version": "1.0.0",
  "description": "An AI-powered Discord bot with various commands, including music.",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "keywords": ["discord", "bot", "ai", "gemini", "imagen", "javascript", "music"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "discord.js": "^14.0.0",
    "@discordjs/voice": "^0.16.0",
    "ytdl-core": "^4.11.5",
    "ffmpeg-static": "^5.2.0"
  }
}

4. Install Dependencies
In your Replit project, go to the "Shell" tab.

Run the following commands one by one to ensure all necessary packages are installed and up-to-date:

rm -rf node_modules
npm cache clean --force
npm install @discordjs/voice ytdl-core ffmpeg-static discord.js

(Ignore any npm warn messages, they are not critical errors.)

5. Run Your Bot
Go back to your index.js file in Replit.

Click the green "Run" button at the top.

Check the Replit console for the "Logged in as..." message. Your bot should now be online in Discord!

6. Keeping Your Bot Online (Optional but Recommended)
Replit's free tier may put your Repls to sleep. Use UptimeRobot to keep it alive:

Create a free account on UptimeRobot.com.

Click "+ Add New Monitor."

Select "Monitor Type: HTTP(s)."

For "Friendly Name," enter your bot's name.

For "URL (or IP)," copy the public URL of your running Replit project. You can find this by running your Repl and looking for a URL that looks like https://your-repl-name.your-username.repl.co in the console or by using the "Share" button in Replit.

Set "Monitoring Interval" to "5 Minutes."

Click "Create Monitor."

🎮 Bot Commands
Here's a quick reference for all the commands your bot supports. Remember to use the ! prefix before each command.

General & AI Commands:

!ping - Checks bot's responsiveness.

!hello - A personalized greeting.

!rules - Displays server rules.

!embed - Shows an example of a rich Discord embed.

!askai [your question] - Asks Google's Gemini AI a question.

(Casual Chat): Simply type a message without a prefix, and the bot will respond using AI.

Music Commands:

!play [YouTube URL or search term] - Plays a song from YouTube.

!skip - Skips the current song.

!stop - Stops music and leaves the voice channel.

!queue - Shows the current song queue.

Games:

!startguess - Starts a "Guess the Number" game.

!guess [number/answer] - Submits a guess for active games.

!stopguess - Stops the "Guess the Number" game.

!rps [rock/paper/scissors] - Play Rock-Paper-Scissors.

!coinflip - Flips a coin.

!8ball [question] - Consults the Magic 8-Ball.

!roll [XdY] - Rolls custom dice (e.g., !roll 2d6).

!fact - Get a random fun fact.

!choose [item1, item2, ...] - Bot picks an item from your list.

!reverse [text] - Reverses provided text.

!wouldyourather - Get a random "Would you rather...?" question.

!insult [@user or blank] - Delivers a lighthearted insult.

!emojiguess - Starts an emoji guessing game.

!stopemojiguess - Stops the emoji guessing game.

🤝 Contributing
Feel free to fork this repository, add new features, fix bugs, or improve existing commands!

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
