import 'dotenv/config';
import fetch from 'node-fetch';
import notifications from './notifications.js';
import config from './config.js';

const channels = (process.env.CHANNELS || config.channels).split(',').map(c => c.replace('#', ''));
const disconnectedChannels = new Set();

export default function streamStatusMonitor(client) {
    async function fetchLiveStreamers(usernames) {
        const query = usernames.map(name => `user_login=${name}`).join('&');
        const url = `https://api.twitch.tv/helix/streams?${query}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID || config.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${(process.env.TWITCH_OAUTH_TOKEN || config.TWITCH_OAUTH_TOKEN).replace("oauth:", "")}`
                }
            });

            if (!response.ok) {
                throw new Error(`Twitch API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.data.map(stream => stream.user_login.toLowerCase());
        } catch (error) {
            console.error(`Error fetching stream status:`, error.message);
            return [];
        }
    }

    setInterval(async () => {
        const liveStreamers = await fetchLiveStreamers(channels);

        for (const username of channels) {
            const isLive = liveStreamers.includes(username.toLowerCase());

            if (isLive) {
                console.log(`${username} is LIVE!`);
                disconnectedChannels.delete(username);
            } else if (!disconnectedChannels.has(username)) {
                disconnectedChannels.add(username);
                notifications("offline", username);

                try {
                    await client.part(`#${username}`);
                    console.log(`Disconnected from ${username}`);
                } catch (err) {
                    console.error(`Error disconnecting from ${username}:`, err.message);
                }
            }
        }
    }, 60000); // Check every 60 seconds
}