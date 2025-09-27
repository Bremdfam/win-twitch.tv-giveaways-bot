import 'dotenv/config'; // Load env variables
import tmi from 'tmi.js'; // Twitch Messaging Interface
import streamStatusMonitor from './streamStatusMonitor.js';
import notifications from './notifications.js';

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
    if (tags.badges?.vip || filter.some(word => message.toLowerCase().includes(word))) return; // Filter out bot, VIP, or filtered messages

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
        notifications("mentioned", channelName, message) // Notify user that name was mentioned

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
    const lastFive = messages.slice(-5); // Change to track how many messages need to be the same
    const allSame = lastFive.every(msg => msg === lastMessage);

    // If a message is reapeated 5 times, log it and play a notification
    if (messages.length >= 5 && allSame && !onCooldown) {

        notifications("message", channelName, message)

        // Send the repeated message
        // client.say(channel, message)

        lastBotMessageTimeMap[channel] = now; // Update bot cooldown for channel
        usernameDetectionCooldownMap[channel] = now; // Update username detection
    } else if (onCooldown) {
        console.log(`[${channel}] On cooldown`);
    } else {
        console.log(`[${channel}] Messages not repeated`);
    }
});

streamStatusMonitor(client);