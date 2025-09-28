// Twitch credentials
const TWITCH_USERNAME = "username"
const TWITCH_OAUTH_TOKEN = "token here"
const TWITCH_CLIENT_ID = "id here"

const channels = ["channel1", "channel2"]
const winMessages = ['YOOOOO', "I'm here!", "I won!"]; // Messages to say when you win
const filter = ['raid', 'aimzHug', 'cahlaPrime'] // Filter out specific words
const duplicateMessagesInARow = 3; // Controls how many duplicate messages are needed before a notification is triggered

export default { TWITCH_CLIENT_ID, TWITCH_OAUTH_TOKEN, TWITCH_USERNAME, channels, winMessages, filter, duplicateMessagesInARow };