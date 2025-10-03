import 'dotenv/config'; // Load env variables
import tmi from 'tmi.js'; // Twitch Messaging Interface
import streamStatusMonitor from './streamStatusMonitor.js';
import notifications from './notifications.js';
import config from './config.js'

// List of channels to track from the .env file
// const channels = (process.env.CHANNELS || config.channels)
const channelNames = config.channels.map(c => c.channelName);
const username = process.env.TWITCH_USERNAME || config.TWITCH_USERNAME

// Create Twitch client
const client = new tmi.Client({
    options: { debug: true },
    identity: {
        username: process.env.TWITCH_USERNAME || config.TWITCH_USERNAME,
        password: process.env.TWITCH_OAUTH_TOKEN || config.TWITCH_OAUTH_TOKEN
    },
    channels: channelNames
});

client.connect(); // Connect to Twitch chat

const messageMap = {}; // Stores messages per channel
const lastBotMessageTimeMap = {}; // Tracks last bot message per channel
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const usernameDetectionCooldownMap = {}; // Tracks when username was detected
const USERNAME_COOLDOWN_MS = 30 * 1000; // 30 seconds

// Event listener for incoming chat messages
client.on('message', (channel, tags, message) => {
    // Define Filters
    const channelName = channel.replace("#", "");
    const channelConfig = config.channels.find(c => c.channelName === channelName);
    const filtersForChannel = [
        ...(config.globalFilters || []),
        ...(channelConfig?.filters || [])
    ];

    const isFiltered = filtersForChannel.some(word =>
        message.toLowerCase().includes(word.toLowerCase())
    );
    if (tags.badges?.vip || isFiltered) return; // Filter out VIP and filtered messages

    // Track bot cooldown
    const now = Date.now();
    const lastTime = lastBotMessageTimeMap[channel] || 0;
    const onCooldown = now - lastTime < COOLDOWN_MS;


    // Check if username detection is on cooldown for this channel
    const usernameCooldownActive = usernameDetectionCooldownMap[channel] && (now - usernameDetectionCooldownMap[channel] < USERNAME_COOLDOWN_MS);

    // Detect if your username is mentioned
    const usernameMentioned = message.toLowerCase().includes(username.toLowerCase());
    if (usernameMentioned && !usernameCooldownActive) {
        notifications("mentioned", channelName, message) // Notify user that name was mentioned

        // Wait 5 seconds before sending message
        setTimeout(() => {
            // Send a message in chat
            // client.say(channel, "Hello")
            const randomMessage = config.winMessages[Math.floor(Math.random() * config.winMessages.length)];
            console.log(randomMessage)
        }, 5000)

    }

    // Initialize message array for channel
    if (!messageMap[channel]) messageMap[channel] = [];
    const messages = messageMap[channel];

    // Add non-mod messages to message array
    if (!tags.mod) {
        messages.push(message);
    }

    if (messages.length > channelConfig.duplicateMessagesInARow) messages.shift(); // Remove older messages

    console.log(`Messages for ${channel}:`, messages); // Log the current message array for this channel

    // Check if messages are the same
    const lastMessage = messages[messages.length - 1];
    const lastFewMessages = messages.slice(-channelConfig.duplicateMessagesInARow);
    const allSame = lastFewMessages.every(msg => msg === lastMessage);

    // If a message is reapeated, log it and play a notification
    if (messages.length >= channelConfig.duplicateMessagesInARow && allSame && !onCooldown) {

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

streamStatusMonitor(client); // Checks if stream is live