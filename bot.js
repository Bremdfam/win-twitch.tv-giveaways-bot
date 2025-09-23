require('dotenv').config(); // Load env variables

const fs = require('fs'); // Write to txt files
const tmi = require('tmi.js'); // Twitch Messaging Interface
const player = require('play-sound')({ players: ['powershell'] }); // Plays sound effects on windows
const path = require('path'); // Resolves paths
const fetch = require('node-fetch'); // Makes HTTP requests
const notifier = require('node-notifier') // Makes notifications

// Paths to sound files
const soundPath = path.resolve(__dirname, 'sounds/button-10.wav');
const soundPathDisconnect = path.resolve(__dirname, 'sounds/phone-disconnect-1.wav');
const soundPathNameMentioned = path.resolve(__dirname, 'sounds/machine-gun-02.wav');

// List of channels to track from the .env file
const channels = process.env.CHANNELS.split(',');

// Create Twitch client
const client = new tmi.Client({
    options: { debug: true },
    identity: {
        username: process.env.TWITCH_USERNAME,
        password: process.env.TWITCH_OAUTH_TOKEN
    },
    channels: channels
});

client.connect(); // Connect to Twitch chat

const messageMap = {}; // Stores messages per channel
const lastBotMessageTimeMap = {}; // Tracks last bot message per channel
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const usernameDetectionCooldownMap = {}; // Tracks when username was detected
const USERNAME_COOLDOWN_MS = 60 * 1000; // 1 minute

// Event listener for incoming chat messages
client.on('message', (channel, tags, message) => {
    if (tags['user-type'] === 'bot' || tags.badges?.vip || message.toLowerCase().includes("raid")) return; // Filter out bot, VIP, or "raid" messages

    // Track bot cooldown
    const now = Date.now();
    const lastTime = lastBotMessageTimeMap[channel] || 0;
    const onCooldown = now - lastTime < COOLDOWN_MS;

    // Check if username detection is on cooldown for this channel
    const usernameCooldownActive = usernameDetectionCooldownMap[channel] && (now - usernameDetectionCooldownMap[channel] < USERNAME_COOLDOWN_MS);

    // Detect if your username is mentioned
    const usernameMentioned = message.toLowerCase().includes(process.env.TWITCH_USERNAME.toLowerCase());
    if (usernameMentioned && !usernameCooldownActive) {
        // Log the mention to a channel specific txt file
        fs.appendFile(`messages/${channel.replace('#', '')}_messages.txt`, `USERNAME MENTIONED AT https://www.twitch.tv/${channel.replace("#", "")} - ` + message + `\n`, (err) => {
            if (err) throw err;
        });

        // Play notification sound
        player.play(soundPathNameMentioned, (err) => {
            if (err) console.error('Error playing sound:', err);
        });

        // Send a message in chat
        // client.say(channel, "Hello")
    }

    // Initialize message array for channel
    if (!messageMap[channel]) messageMap[channel] = [];
    const messages = messageMap[channel];

    // Add non-mod messages to message array
    if (!tags.mod) {
        messages.push(message);
    }

    if (messages.length > 5) messages.shift(); // Remove any message older than the last 5 from the array

    console.log(`Messages for ${channel}:`, messages); // Log the current message array for this channel

    // Check if the last 5 messages are the same
    const lastMessage = messages[messages.length - 1];
    const lastFive = messages.slice(-3); // Change to track how many messages need to be the same
    const allSame = lastFive.every(msg => msg === lastMessage);

    // If a message is reapeated 5 times, log it and play a notification
    if (messages.length >= 5 && allSame && !onCooldown) {
        const logEntry = `[${new Date(now).toLocaleString()}] https://www.twitch.tv/${channel.replace("#", "")} - MSG Repeated: ${message}\n`;

        fs.appendFile(`messages/${channel.replace('#', '')}_messages.txt`, logEntry, (err) => {
            if (err) throw err;
        });

        notifier.notify(
            {
                title: `Message repeated`,
                message: `Message: ${message} has been said 5 times.`
            }
        )

        player.play(soundPath, (err) => {
            if (err) console.error('Error playing sound:', err);
        });

        // Send the repeated message
        //client.say(channel, message)

        lastBotMessageTimeMap[channel] = now; // Update bot cooldown for channel
        usernameDetectionCooldownMap[channel] = now; // Update username detection
    } else if (onCooldown) {
        console.log(`[${channel}] On cooldown`);
    } else {
        console.log(`[${channel}] Messages not repeated`);
    }
});

// Check if streamer is live
async function isStreamerLive(username) {
    try {
        const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${username}`, {
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${process.env.TWITCH_OAUTH_TOKEN.replace("oauth:", "")}`
            }
        });

        const data = await response.json();
        return data?.data?.length > 0; // Returns true if stream is live
    } catch (error) {
        console.error(`Error checking ${username} status:`, error);
        return false;
    }
}

// Check stream every minute to see if they're live. If not, log it and disconnect bot from chat
setInterval(async () => {
    for (const username of channels.map(c => c.replace('#', ''))) {
        const live = await isStreamerLive(username);
        if (live) {
            console.log(`${username} is LIVE!`);
        } else {
            fs.appendFile(`messages/${username}_messages.txt`, `${username} is offline`, (err) => {
                if (err) throw err;
            }); // Log offline status
            client.part(`#${username}`); // Disconnect bot
            player.play(soundPathDisconnect, (err) => {
                if (err) console.error('Error playing disconnect sound:', err);
            }); // Play notification
        }
    }
}, 60000);