// --- index.js ---
// This is the main file for your Discord bot. It contains the logic for
// connecting to Discord, listening for messages, and responding to commands.

// Import necessary classes from the discord.js library.
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// IMPORTS FOR MUSIC:
const {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
} = require('@discordjs/voice');

const ytdl = require('ytdl-core');

// Create a new Discord client instance.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// --- IMPORTANT: Bot Token ---
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// --- API Key for Google Models (Gemini) ---
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Now loads from Replit secrets

// --- Music Player Variables ---
const queue = new Map(); 

// --- Game Variables ---
// Stores active "Guess the Number" games for each server (guild)
// Each entry: guildId: { secretNumber: number, attempts: number }
const gameStates = new Map(); 

// NEW: Stores active "Emoji Guessing" games for each server
// Each entry: guildId: { puzzle: { emojis: string, answer: string }, player: string }
const emojiGameStates = new Map();

// Emoji puzzles for the game
const emojiPuzzles = [
    { emojis: '👨‍🏫📚', answer: 'Teacher' },
    { emojis: '🍎🍏', answer: 'Apple' },
    { emojis: '🍕🎉', answer: 'Pizza Party' },
    { emojis: '🚗💨', answer: 'Fast Car' },
    { emojis: '👻🎃', answer: 'Halloween' },
    { emojis: '👑🦁', answer: 'Lion King' },
    { emojis: '🌧️🌈', answer: 'Rainbow' },
    { emojis: '📚🐛', answer: 'Bookworm' },
    { emojis: '💡🧠', answer: 'Bright Idea' },
    { emojis: '🧊☕', answer: 'Iced Coffee' }
];

// --- Bot Ready Event ---
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('Bot is online and ready to receive commands.');
    client.user.setActivity('for your commands!');
});

// --- Message Create Event ---
client.on('messageCreate', async message => {
    if (message.author.bot) return; // Ignore messages from other bots

    const prefix = '!';

    // --- Casual Chat Handling (if message is NOT a command) ---
    if (!message.content.startsWith(prefix)) {
        // If the bot is mentioned, or if it's a direct message, or just a general chat
        // For simplicity, we'll make it respond to any message not starting with '!'
        // You might want to refine this (e.g., only respond if mentioned)

        // Prevent bot from responding to very short messages or just emojis
        if (message.content.length < 5) return; 

        const typingIndicator = await message.channel.send('💬 Thinking...'); // Send a temporary message

        try {
            let chatHistory = [];
            // You can build a more complex chat history here if you want context
            chatHistory.push({ role: "user", parts: [{ text: message.content }] });
            const payload = { contents: chatHistory };

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                await typingIndicator.edit(text); // Edit the temporary message with the AI's response
            } else {
                console.error('Unexpected AI chat response structure:', result);
                await typingIndicator.edit('Sorry, I\'m a bit confused right now. Can you rephrase that?');
            }
        } catch (error) {
            console.error('Error in casual AI chat:', error);
            await typingIndicator.edit('Oops! My brain is taking a nap. Try again later!');
        }
        return; // Stop processing if it was a casual chat message
    }

    // --- Command Handling (if message starts with prefix) ---
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const serverQueue = queue.get(message.guild.id);
    const currentGame = gameStates.get(message.guild.id); // Get current Guess the Number game
    const currentEmojiGame = emojiGameStates.get(message.guild.id); // Get current Emoji Guessing game

    // 1. Basic Ping Command
    if (command === 'ping') {
        message.reply('Pong!');
    }
    // 2. Personalized Hello Command
    else if (command === 'hello') {
        message.reply(`Hello there, ${message.author.username}! How can I help you today?`);
    }
    // 3. Server Rules Command
    else if (command === 'rules') {
        message.channel.send(
            '**Server Rules:**\n' +
            '1. Be respectful and kind to all members.\n' +
            '2. No spamming or excessive use of caps.\n' +
            '3. Keep discussions civil and constructive.\n' +
            '4. No NSFW content.\n' +
            '5. Follow Discord\'s Terms of Service.'
        );
    }
    // 4. Dice Roll Command (Simple)
    else if (command === 'dice') {
        const sides = parseInt(args[0]);
        if (isNaN(sides) || sides <= 0) {
            message.reply('Please specify a valid number of sides for the dice (e.g., `!dice 6` or `!dice 20`).');
            return;
        }
        const roll = Math.floor(Math.random() * sides) + 1;
        message.reply(`🎲 You rolled a **${roll}** on a ${sides}-sided die!`);
    }
    // 5. Random Joke Command
    else if (command === 'joke') {
        const loadingMessage = await message.channel.send('Fetching a joke for you...');
        try {
            const response = await fetch('https://icanhazdadjoke.com/', { headers: { 'Accept': 'application/json' } });
            const data = await response.json();
            if (data.joke) {
                await loadingMessage.edit(`😂 Here's a joke: ${data.joke}`);
            } else {
                await loadingMessage.edit('Could not fetch a joke right now. The joke API might be busy!');
            }
        } catch (error) {
            console.error('Error fetching joke:', error);
            await loadingMessage.edit('Oops! Something went wrong while trying to get a joke.');
        }
    }
    // 6. Embed Message Command
    else if (command === 'embed') {
        const exampleEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Bot Information')
            .setURL('https://discord.js.org/')
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setDescription('This is an example of a rich embed message from your bot!')
            .setThumbnail('https://placehold.co/64x64/000000/FFFFFF?text=BOT')
            .addFields(
                { name: 'Feature 1', value: 'Can respond to commands.' },
                { name: '\u200B', value: '\u200B' },
                { name: 'Feature 2', value: 'Can fetch external data.', inline: true },
                { name: 'Feature 3', value: 'Can generate AI text!', inline: true },
                { name: 'Feature 4', value: 'Can play music!', inline: true },
                { name: 'Feature 5', value: 'Can play **11 different games**!', inline: true }, // Updated description for new game
            )
            .setImage('https://placehold.co/600x200/FF0000/FFFFFF?text=Discord+Bot')
            .setTimestamp()
            .setFooter({ text: 'Powered by Discord.js and Google AI', iconURL: 'https://placehold.co/16x16/00FF00/FFFFFF?text=AI' });

        message.channel.send({ embeds: [exampleEmbed] });
    }
    // 7. AI Text Generation Command
    else if (command === 'askai') {
        const prompt = args.join(' ');
        if (!prompt) {
            message.reply('Please provide a question for the AI (e.g., `!askai What is the capital of France?`).');
            return;
        }

        const loadingMessage = await message.channel.send('🧠 AI is thinking...');
        try {
            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });
            const payload = { contents: chatHistory };

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                await loadingMessage.edit(`**Your question:** "${prompt}"\n\n**AI's response:**\n${text}`);
            } else {
                console.error('Unexpected AI response structure:', result);
                await loadingMessage.edit('Sorry, I could not get a response from the AI. The response structure was unexpected.');
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            await loadingMessage.edit('Oops! There was an error communicating with the AI. Please try again later.');
        }
    }
    // --- MUSIC COMMANDS ---
    // 8. Play Music Command
    else if (command === 'play') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.channel.send('You need to be in a voice channel to play music!');
        }

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return message.channel.send('I need the permissions to join and speak in your voice channel!');
        }

        const songInfo = args.join(' ');
        if (!songInfo) {
            return message.channel.send('Please provide a YouTube URL or a song title to search for.');
        }

        try {
            let songUrl;
            if (ytdl.validateURL(songInfo)) {
                songUrl = songInfo;
            } else {
                message.channel.send('Searching for your song... (Note: Direct YouTube search is basic here, provide URL for best results)');
                const searchResponse = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(songInfo)}`);
                const searchText = await searchResponse.text();
                const match = searchText.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
                if (match && match[1]) {
                    songUrl = `https://www.youtube.com/watch?v=${match[1]}`;
                } else {
                    return message.channel.send('Could not find a YouTube video for that search query.');
                }
            }

            const song = {
                title: (await ytdl.getInfo(songUrl)).videoDetails.title,
                url: songUrl,
            };

            if (!serverQueue) {
                const queueContruct = {
                    textChannel: message.channel,
                    voiceChannel: voiceChannel,
                    connection: null,
                    player: createAudioPlayer(),
                    songs: [],
                    volume: 0.5,
                    playing: true,
                };

                queue.set(message.guild.id, queueContruct);
                queueContruct.songs.push(song);

                try {
                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: message.guild.id,
                        adapterCreator: message.guild.voiceAdapterCreator,
                    });
                    queueContruct.connection = connection;

                    queueContruct.player.on(AudioPlayerStatus.Idle, () => {
                        queueContruct.songs.shift();
                        play(message.guild, queueContruct.songs[0]);
                    });

                    queueContruct.player.on('error', error => {
                        console.error(`Audio player error: ${error.message}`);
                        message.channel.send(`An error occurred while playing: ${error.message}`);
                        queue.delete(message.guild.id);
                        connection.destroy();
                    });

                    play(message.guild, queueContruct.songs[0]);
                } catch (err) {
                    console.error(err);
                    queue.delete(message.guild.id);
                    return message.channel.send(err);
                }
            } else {
                serverQueue.songs.push(song);
                return message.channel.send(`🎶 **${song.title}** has been added to the queue!`);
            }
        } catch (error) {
            console.error(error);
            message.channel.send('There was an error trying to play that song. Make sure it\'s a valid YouTube URL or search term.');
        }
    }
    // 9. Skip Music Command
    else if (command === 'skip') {
        if (!message.member.voice.channel) {
            return message.channel.send('You must be in a voice channel to skip music!');
        }
        if (!serverQueue) {
            return message.channel.send('There is no song currently playing to skip.');
        }
        serverQueue.player.stop();
        message.channel.send('⏭️ Skipped the current song.');
    }
    // 10. Stop Music Command
    else if (command === 'stop') {
        if (!message.member.voice.channel) {
            return message.channel.send('You must be in a voice channel to stop music!');
        }
        if (!serverQueue) {
            return message.channel.send('There is no song currently playing to stop.');
        }
        serverQueue.songs = [];
        serverQueue.player.stop();
        serverQueue.connection.destroy();
        queue.delete(message.guild.id);
        message.channel.send('⏹️ Stopped the music and left the voice channel.');
    }
    // 11. Show Queue Command
    else if (command === 'queue') {
        if (!serverQueue || serverQueue.songs.length === 0) {
            return message.channel.send('The music queue is empty.');
        }
        let queueList = serverQueue.songs.map((song, index) => `${index + 1}. ${song.title}`).join('\n');
        message.channel.send(`**Current Music Queue:**\n${queueList}`);
    }
    // --- GAME COMMANDS ---
    // 12. Start Guess the Number Game
    else if (command === 'startguess') {
        if (currentGame) {
            return message.channel.send('A "Guess the Number" game is already in progress! Use `!guess [number]` or `!stopguess`.');
        }

        const secretNumber = Math.floor(Math.random() * 100) + 1; // Number between 1 and 100
        gameStates.set(message.guild.id, {
            secretNumber: secretNumber,
            attempts: 0,
            player: message.author.id // Store who started the game (optional, but good for multi-user games)
        });

        message.channel.send('🔢 I\'ve picked a number between 1 and 100. Try to guess it with `!guess [your number]`!');
    }
    // 13. Guess the Number Command
    else if (command === 'guess') {
        if (!currentGame) {
            return message.channel.send('No "Guess the Number" game is active. Start one with `!startguess`!');
        }

        const guess = parseInt(args[0]);
        if (isNaN(guess)) {
            return message.channel.send('That\'s not a valid number. Please guess a number!');
        }

        currentGame.attempts++;

        if (guess < currentGame.secretNumber) {
            message.channel.send(`⬆️ Too low! Try a higher number. (Attempt: ${currentGame.attempts})`);
        } else if (guess > currentGame.secretNumber) {
            message.channel.send(`⬇️ Too high! Try a lower number. (Attempt: ${currentGame.attempts})`);
        } else {
            message.channel.send(`🎉 Congratulations, ${message.author.username}! You guessed the number **${currentGame.secretNumber}** in **${currentGame.attempts}** attempts!`);
            gameStates.delete(message.guild.id); // End the game
        }
    }
    // 14. Stop Guess the Number Game
    else if (command === 'stopguess') {
        if (!currentGame) {
            return message.channel.send('No "Guess the Number" game is active to stop.');
        }
        gameStates.delete(message.guild.id);
        message.channel.send('✋ The "Guess the Number" game has been stopped.');
    }
    // 15. Rock-Paper-Scissors Game
    else if (command === 'rps') {
        const choices = ['rock', 'paper', 'scissors'];
        const userChoice = args[0] ? args[0].toLowerCase() : null;

        if (!userChoice || !choices.includes(userChoice)) {
            return message.reply('Please choose rock, paper, or scissors (e.g., `!rps rock`).');
        }

        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        let result;
        if (userChoice === botChoice) {
            result = `It's a tie! Both chose **${userChoice}**.`;
        } else if (
            (userChoice === 'rock' && botChoice === 'scissors') ||
            (userChoice === 'paper' && botChoice === 'rock') ||
            (userChoice === 'scissors' && botChoice === 'paper')
        ) {
            result = `You win! You chose **${userChoice}** and I chose **${botChoice}**.`;
        } else {
            result = `I win! You chose **${userChoice}** and I chose **${botChoice}**.`;
        }
        message.channel.send(result);
    }
    // 16. Coin Flip Game
    else if (command === 'coinflip') {
        const outcomes = ['Heads', 'Tails'];
        const result = outcomes[Math.floor(Math.random() * outcomes.length)];
        message.channel.send(`🪙 The coin landed on: **${result}**!`);
    }
    // 17. Magic 8-Ball Game
    else if (command === '8ball') {
        const question = args.join(' ');
        if (!question) {
            return message.reply('Ask the 8-Ball a yes/no question! (e.g., `!8ball Will I win the lottery?`)');
        }

        const responses = [
            'It is certain.',
            'It is decidedly so.',
            'Without a doubt.',
            'Yes, definitely.',
            'You may rely on it.',
            'As I see it, yes.',
            'Most likely.',
            'Outlook good.',
            'Yes.',
            'Signs point to yes.',
            'Reply hazy, try again.',
            'Ask again later.',
            'Better not tell you now.',
            'Cannot predict now.',
            'Concentrate and ask again.',
            'Don\'t count on it.',
            'My reply is no.',
            'My sources say no.',
            'Outlook not so good.',
            'Very doubtful.'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        message.channel.send(`🎱 **Question:** "${question}"\n**8-Ball says:** "${randomResponse}"`);
    }
    // 18. Advanced Dice Roll (XdY format)
    else if (command === 'roll') {
        const rollString = args[0]; // e.g., "2d6"
        if (!rollString || !rollString.match(/^\d+d\d+$/i)) {
            return message.reply('Please use the format `!roll XdY` (e.g., `!roll 2d6` for two 6-sided dice).');
        }

        const [numDice, sides] = rollString.toLowerCase().split('d').map(Number);

        if (numDice <= 0 || sides <= 0 || numDice > 10 || sides > 100) { // Limit to prevent spam/abuse
            return message.reply('Please roll between 1 and 10 dice, each with 1 to 100 sides.');
        }

        let total = 0;
        let rolls = [];
        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            total += roll;
        }

        message.channel.send(`🎲 Rolling ${numDice}d${sides}: ${rolls.join(' + ')} = **${total}**`);
    }
    // 19. Random Fact Generator
    else if (command === 'fact') {
        const facts = [
            'A group of owls is called a parliament.',
            'Honey never spoils.',
            'The shortest war in history lasted 38 to 45 minutes.',
            'Octopuses have three hearts.',
            'A "jiffy" is an actual unit of time: 1/100th of a second.',
            'The average person walks the equivalent of three times around the world in a lifetime.',
            'Bananas are berries, but strawberries aren\'t.',
            'The Earth\'s core is as hot as the surface of the sun.',
            'A crocodile cannot stick its tongue out.',
            'It is impossible for most people to lick their own elbow.',
            'A cat has 32 muscles in each ear.',
            'Slugs have four noses.'
        ];
        const randomFact = facts[Math.floor(Math.random() * facts.length)];
        message.channel.send(`💡 **Did you know?** ${randomFact}`);
    }
    // 20. Choose from List
    else if (command === 'choose') {
        const items = args.join(' ').split(',').map(item => item.trim()).filter(item => item.length > 0);
        if (items.length < 2) {
            return message.reply('Please provide at least two comma-separated items for me to choose from (e.g., `!choose apple, banana, orange`).');
        }
        const choice = items[Math.floor(Math.random() * items.length)];
        message.channel.send(`🤔 I choose: **${choice}**!`);
    }
    // 21. Reverse Text
    else if (command === 'reverse') {
        const textToReverse = args.join(' ');
        if (!textToReverse) {
            return message.reply('Please provide some text for me to reverse (e.g., `!reverse hello world`).');
        }
        const reversedText = textToReverse.split('').reverse().join('');
        message.channel.send(`🔄 Reversed text: **${reversedText}**`);
    }
    // 22. Would You Rather
    else if (command === 'wouldyourather') {
        const questions = [
            'Would you rather be able to fly or be invisible?',
            'Would you rather have unlimited money or unlimited wishes?',
            'Would you rather fight 100 duck-sized horses or one horse-sized duck?',
            'Would you rather live without music or live without movies?',
            'Would you rather be able to talk to animals or speak all human languages?',
            'Would you rather always be 10 minutes late or always be 20 minutes early?',
            'Would you rather have a constantly refilling snack bowl or a constantly refilling drink cup?',
            'Would you rather be a master of every musical instrument or a master of every sport?',
            'Would you rather have a rewind button or a pause button in your life?',
            'Would you rather be able to teleport anywhere or be able to read minds?'
        ];
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        message.channel.send(`🤔 **Would you rather...** ${randomQuestion}`);
    }
    // 23. Random Insult (Lighthearted)
    else if (command === 'insult') {
        const target = message.mentions.users.first() || message.author;
        const insults = [
            'You\'re about as sharp as a marble.',
            'I\'ve had more intelligent conversations with a brick wall.',
            'Your brain is the size of a pea, and that\'s an insult to peas.',
            'You\'re not the sharpest tool in the shed, nor the dullest, just... the one that\'s slightly rusty.',
            'If your brain was made of chocolate, it wouldn\'t even fill a thimble.',
            'You\'re like a broken pencil... pointless.',
            'I\'ve seen better comebacks from a toaster.',
            'Were you born on a highway? Because that\'s where most accidents happen.',
            'You\'re a few fries short of a Happy Meal.',
            'You have the personality of a damp rag.'
        ];
        const randomInsult = insults[Math.floor(Math.random() * insults.length)];
        message.channel.send(`Hey ${target}, ${randomInsult}`);
    }
    // --- NEW EMOJI GAME COMMANDS ---
    // 24. Start Emoji Guessing Game
    else if (command === 'emojiguess') {
        if (currentEmojiGame) {
            return message.channel.send('An Emoji Guessing game is already in progress! Use `!guess [answer]` or `!stopemojiguess`.');
        }

        const randomPuzzle = emojiPuzzles[Math.floor(Math.random() * emojiPuzzles.length)];
        emojiGameStates.set(message.guild.id, {
            puzzle: randomPuzzle,
            player: message.author.id // Tracks who started it, or could be for current guesser
        });

        message.channel.send(`🤔 **Emoji Guessing Game!**\nGuess what these emojis represent:\n${randomPuzzle.emojis}\n\nUse \`!guess [your answer]\` to submit your guess.`);
    }
    // 25. Guess for Emoji Game (re-uses existing !guess logic but for emoji game)
    // IMPORTANT: This command needs to be careful not to conflict with !guess for number game.
    // We'll prioritize the number game if active, otherwise check for emoji game.
    else if (command === 'guess') {
        if (currentGame) { // Prioritize number guessing if active
            const guess = parseInt(args[0]);
            if (isNaN(guess)) {
                return message.channel.send('That\'s not a valid number. Please guess a number!');
            }

            currentGame.attempts++;

            if (guess < currentGame.secretNumber) {
                message.channel.send(`⬆️ Too low! Try a higher number. (Attempt: ${currentGame.attempts})`);
            } else if (guess > currentGame.secretNumber) {
                message.channel.send(`⬇️ Too high! Try a lower number. (Attempt: ${currentGame.attempts})`);
            } else {
                message.channel.send(`🎉 Congratulations, ${message.author.username}! You guessed the number **${currentGame.secretNumber}** in **${currentGame.attempts}** attempts!`);
                gameStates.delete(message.guild.id); // End the game
            }
        } else if (currentEmojiGame) { // If no number game, check for emoji game
            const userAnswer = args.join(' ').toLowerCase();
            const correctAnswer = currentEmojiGame.puzzle.answer.toLowerCase();

            if (userAnswer === correctAnswer) {
                message.channel.send(`🎉 Correct, ${message.author.username}! The answer was **${currentEmojiGame.puzzle.answer}**!`);
                emojiGameStates.delete(message.guild.id); // End the game
            } else {
                message.channel.send('❌ Not quite! Try again.');
            }
        } else {
            return message.channel.send('No active "Guess the Number" or "Emoji Guessing" game. Start one with `!startguess` or `!emojiguess`!');
        }
    }
    // 26. Stop Emoji Guessing Game
    else if (command === 'stopemojiguess') {
        if (!currentEmojiGame) {
            return message.channel.send('No Emoji Guessing game is active to stop.');
        }
        emojiGameStates.delete(message.guild.id);
        message.channel.send('✋ The Emoji Guessing game has been stopped.');
    }
});

// --- Music Play Function ---
function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.textChannel.send('Finished playing all songs in the queue. Leaving voice channel.');
        serverQueue.connection.destroy();
        queue.delete(guild.id);
        return;
    }

    const resource = createAudioResource(ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio' }));

    serverQueue.player.play(resource);
    serverQueue.connection.subscribe(serverQueue.player);

    serverQueue.textChannel.send(`🎶 Now playing: **${song.title}**`);
}

// --- Log in the bot ---
client.login(DISCORD_BOT_TOKEN);
