// Twitch credentials
// const TWITCH_USERNAME = "username"
const TWITCH_OAUTH_TOKEN = "token here"
const TWITCH_CLIENT_ID = "id here"

const channels = [
    {
        channelName: "bremdfam",
        filters: ["!join", "aimzHug"],
        duplicateMessagesInARow: 10,
    },
    {
        channelName: "thundergun86",
        filters: [],
        duplicateMessagesInARow: 2,
    }
]
const globalFilters = ["raid"] // Filters for all channels
const winMessages = ['YOOOOO', "I'm here!", "I won!"]; // Messages to say when you win

export default {
    TWITCH_CLIENT_ID, TWITCH_OAUTH_TOKEN,
    // TWITCH_USERNAME,
    channels, globalFilters, winMessages
};