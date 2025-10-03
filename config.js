// Twitch credentials
const TWITCH_USERNAME = "YOUR USERNAME"
const TWITCH_OAUTH_TOKEN = "YOUR TOKEN"
const TWITCH_CLIENT_ID = "YOUR ID"

const channels = [
    {
        channelName: "",
        filters: [],
        duplicateMessagesInARow: 0,
    },
    {
        channelName: "",
        filters: [],
        duplicateMessagesInARow: 0,
    }
]
const globalFilters = ["raid"] // Filters for all channels
const automaticallyJoinGiveaway = true; // Auto joins giveaway
const automaticallySendWinMessage = true; // Auto sends win message
const winMessages = ['YOOOOO', "I'm here!", "I won!"]; // Messages to say when you win

export default {
    TWITCH_CLIENT_ID, TWITCH_OAUTH_TOKEN, TWITCH_USERNAME,
    channels, globalFilters, winMessages, automaticallyJoinGiveaway, automaticallySendWinMessage
};