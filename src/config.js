// Twitch credentials
const TWITCH_USERNAME = "YOUR USERNAME"
const TWITCH_OAUTH_TOKEN = "YOUR TOKEN"
const TWITCH_CLIENT_ID = "YOUR ID"

// Channels to monitor and channel specific configs
const channels = [
    {
        channelName: "kaicenat",
        filters: ["WORD OR PHRASE TO BE FILTERED", "WORD"],
        duplicateMessagesInARow: 10,
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
const joinGiveawayCooldown = 15; // Amount of time in MINUTES before you can enter the same stream's giveaway
const usernameDetectionCooldown = 30; // Amount of time in SECONDS your username will not be detected after entering a giveaway
const winMessages = ['YOOOOO', "Yippee :)", "PogChamp PogChamp PogChamp"]; // Messages to say when you win
const notifyWhenStreamGoesOffline = true; // Notifies you when a stream goes offline

export default {
    TWITCH_CLIENT_ID, TWITCH_OAUTH_TOKEN, TWITCH_USERNAME,
    channels, globalFilters, winMessages, automaticallyJoinGiveaway, automaticallySendWinMessage, notifyWhenStreamGoesOffline, joinGiveawayCooldown, usernameDetectionCooldown
};