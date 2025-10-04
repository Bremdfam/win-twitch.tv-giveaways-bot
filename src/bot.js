import 'dotenv/config';
import tmi from 'tmi.js';
import streamStatusMonitor from './streamStatusMonitor.js';
import notifications from './notifications.js';
import config from './config.js';

const channelNames = config.channels.map(c => c.channelName);
const username = process.env.TWITCH_USERNAME || config.TWITCH_USERNAME;

const client = new tmi.Client({
    options: { debug: true },
    identity: {
        username,
        password: process.env.TWITCH_OAUTH_TOKEN || config.TWITCH_OAUTH_TOKEN
    },
    channels: channelNames
});

client.connect();

const messageMap = {};
const lastBotMessageTimeMap = {};
const usernameDetectionCooldownMap = {};

const COOLDOWN_MS = config.joinGiveawayCooldown * 60 * 1000;
const USERNAME_COOLDOWN_MS = config.usernameDetectionCooldown * 1000;

client.on('message', (channel, tags, message) => {
    const now = Date.now();
    const channelName = channel.replace("#", "");
    const channelConfig = config.channels.find(c => c.channelName === channelName);
    if (!channelConfig) return;

    const filters = [...(config.globalFilters || []), ...(channelConfig.filters || [])];
    const isFiltered = filters.some(word =>
        message.toLowerCase().includes(word.toLowerCase())
    );

    if (tags.badges?.vip || isFiltered) return;

    const onCooldown = now - (lastBotMessageTimeMap[channel] || 0) < COOLDOWN_MS;
    const usernameCooldownActive =
        usernameDetectionCooldownMap[channel] &&
        now - usernameDetectionCooldownMap[channel] < USERNAME_COOLDOWN_MS;

    const usernameMentioned = message.toLowerCase().includes(username.toLowerCase());
    if (usernameMentioned && !usernameCooldownActive) {
        notifications("mentioned", channelName, message);
        usernameDetectionCooldownMap[channel] = now;

        setTimeout(() => {
            const randomMessage =
                config.winMessages[Math.floor(Math.random() * config.winMessages.length)];
            // Send win message in chat
            if (config.automaticallySendWinMessage == true) {
                client.say(channel, randomMessage);
            }
        }, 5000);
    }

    // Track messages with sender info
    if (!messageMap[channel]) messageMap[channel] = [];
    const messages = messageMap[channel];

    if (!tags.mod) {
        messages.push({ text: message, user: tags.username });
    }

    const threshold = channelConfig.duplicateMessagesInARow || 10;
    messageMap[channel] = messages.slice(-threshold);

    const lastFew = messageMap[channel];
    if (lastFew.length < threshold) return;

    const firstText = lastFew[0].text;
    const allSameText = lastFew.every(msg => msg.text === firstText);
    const uniqueUsers = new Set(lastFew.map(msg => msg.user));
    const multipleUsers = uniqueUsers.size > 1;

    if (allSameText && multipleUsers && !onCooldown) {
        notifications("message", channelName, firstText);
        lastBotMessageTimeMap[channel] = now;
        usernameDetectionCooldownMap[channel] = now;
        // Send message to enter giveaway in chat
        if (config.automaticallyJoinGiveaway == true) {
            client.say(channel, message);
        }
    } else if (onCooldown) {
        console.log(`[${channelName}] On cooldown`);
    } else {
        console.log(`[${channelName}] Messages not repeated or from same user`);
    }
});

streamStatusMonitor(client);
