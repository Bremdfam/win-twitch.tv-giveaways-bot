import 'dotenv/config';
import fetch from 'node-fetch';
import notifications from './notifications.js';
import config from './config.js';

const channelObjects = config.channels;
const channelNames = channelObjects.map(c => c.channelName);
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
        const liveStreamers = await fetchLiveStreamers(channelNames);

        if (liveStreamers.length === 0) {
            console.log("No channels are live. Exiting program.");
            process.exit(0);
        }

        for (const { channelName } of channelObjects) {
            const isLive = liveStreamers.includes(channelName.toLowerCase());

            if (isLive) {
                console.log(`${channelName} is LIVE!`);
                disconnectedChannels.delete(channelName);
            } else if (!disconnectedChannels.has(channelName)) {
                disconnectedChannels.add(channelName);
                notifications("offline", channelName);

                try {
                    await client.part(`#${channelName}`);
                    console.log(`Disconnected from ${channelName}`);
                } catch (err) {
                    console.error(`Error disconnecting from ${channelName}:`, err.message);
                }
            }
        }
    }, 60000); // Check every 60 seconds
}
