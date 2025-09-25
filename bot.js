import 'dotenv/config'; // Load env variables
import fs from 'fs'; // Write to txt files
import tmi from 'tmi.js'; // Twitch Messaging Interface
import playSound from 'play-sound'; // Sound player
import path from 'path'; // Resolves paths
import notifier from 'node-notifier'; // Makes notifications
import streamMonitor from './streamMonitor.js';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const player = playSound({ players: ['powershell'] }); // Configure sound player
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to sound files and logo
const soundPath = path.join(__dirname, 'sounds/button-10.wav');
const soundPathNameMentioned = path.join(__dirname, 'sounds/machine-gun-02.wav');
const iconPath = path.join(__dirname, 'logo.jpg')

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
const USERNAME_COOLDOWN_MS = 30 * 1000; // 30 seconds
const filter = ['raid', 'aimzHug', 'cahlaPrime'] // Filter out specific words

// Event listener for incoming chat messages
client.on('message', (channel, tags, message) => {
    if (tags['user-type'] === 'bot' || tags.badges?.vip || filter.some(word => message.toLowerCase().includes(word))) return; // Filter out bot, VIP, or filtered messages

    // Track bot cooldown
    const now = Date.now();
    const lastTime = lastBotMessageTimeMap[channel] || 0;
    const onCooldown = now - lastTime < COOLDOWN_MS;

    let channelName = channel.replace("#", "") // Removes the '#' from the username

    // Check if username detection is on cooldown for this channel
    const usernameCooldownActive = usernameDetectionCooldownMap[channel] && (now - usernameDetectionCooldownMap[channel] < USERNAME_COOLDOWN_MS);

    // Detect if your username is mentioned
    const usernameMentioned = message.toLowerCase().includes(process.env.TWITCH_USERNAME.toLowerCase());
    if (usernameMentioned && !usernameCooldownActive) {
        // Log the mention to a channel specific txt file
        fs.appendFile(`messages/${channelName}_messages.txt`, `USERNAME MENTIONED AT https://www.twitch.tv/${channelName} - ` + message + `\n`, (err) => {
            if (err) throw err;
        });

        notifier.notify(
            {
                title: `USERNAME DETECTED`,
                message: `Channel: ${channelName}\nMessage: ${message}`,
                icon: iconPath,
                wait: true,
            }
        )

        notifier.once('click', () => {
            require('child_process').exec(`start https://www.twitch.tv/${channelName}`)
        })

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
        const logEntry = `[${new Date(now).toLocaleString()}] https://www.twitch.tv/${channelName} - Message Repeated: ${message}\n`;

        fs.appendFile(`messages/${channelName}_messages.txt`, logEntry, (err) => {
            if (err) throw err;
        });

        notifier.notify(
            {
                title: `Message repeated`,
                message: `Channel: ${channelName}\nMessage: ${message} has been said 5 times.`,
                icon: iconPath,
                wait: true,
            }
        )

        notifier.on('click', () => {
            require('child_process').exec(`start https://www.twitch.tv/${channelName}`)
        })

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

streamMonitor(client);