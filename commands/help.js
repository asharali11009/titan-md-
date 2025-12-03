const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `
▓▒░ *TITAN* ░▒▓
by ${settings.botOwner} | v${settings.version}

──────⊰ *COMMANDS* ⊱──────

━━━ 𝗕𝗔𝗦𝗜𝗖 ━━━
🔹 .help | .menu - Show this menu
🔹 .ping - Check bot response
🔹 .alive - Check if bot is active
🔹 .owner - Get owner contact
🔹 .quote - Random quotes

━━━ 𝗠𝗘𝗗𝗜𝗔 ━━━
🔹 .sticker - Convert to sticker
🔹 .stickercrop - Create cropped sticker
🔹 .emojimix - Mix two emojis
🔹 .take - Change sticker metadata
🔹 .attp - Animated text sticker
🔹 .viewonce - View once media

━━━ 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 ━━━
🔹 .play - Play songs
🔹 .song - Download music
🔹 .spotify - Spotify audio
🔹 .lyrics - Find song lyrics
🔹 .video - Download videos

━━━ 𝗚𝗥𝗢𝗨𝗣 𝗠𝗔𝗡𝗔𝗚𝗘𝗠𝗘𝗡𝗧 ━━━
🔹 .ban | .unban - Control users
🔹 .kick - Remove member
🔹 .promote | .demote - Manage admins
🔹 .mute | .unmute - Control chat
🔹 .warn - Issue warning
🔹 .warnings - Check user warnings
🔹 .groupinfo - Group information
🔹 .resetlink - Reset invite link
🔹 .staff - List all admins
🔹 .topmembers - Most active members

━━━ 𝗧𝗔𝗚𝗚𝗜𝗡𝗚 ━━━
🔹 .tag - Tag with message
🔹 .tagall - Tag all members
🔹 .tagnotadmin - Tag non-admins
🔹 .hidetag - Hidden mention
🔹 .mention - Bot mention responses

━━━ 𝗠𝗢𝗗𝗘𝗥𝗔𝗧𝗜𝗢𝗡 ━━━
🔹 .antilink - Block links
🔹 .antibadword - Filter language
🔹 .antitag - Prevent mass tagging
🔹 .antidelete - Track deleted msgs
🔹 .welcome - Greeting messages
🔹 .goodbye - Farewell messages
🔹 .delete | .del - Remove messages
🔹 .clear - Clear chat

━━━ 𝗙𝗨𝗡 ━━━
🔹 .tictactoe - Play TicTacToe
🔹 .goodnight - Night messages
🔹 .ship - Ship two members
🔹 .ss - Website screenshot

━━━ 𝗢𝗪𝗡𝗘𝗥 ━━━
🔹 .broadcast - Send to all chats
🔹 .sudo - Manage bot admins
🔹 .pair - Get pairing code
🔹 .settings - Bot settings
🔹 .update - Update bot
🔹 .pmblocker - Block private messages
🔹 .anticall - Block callers

━━━ 𝗚𝗥𝗢𝗨𝗣 𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦 ━━━
🔹 .setgname - Change group name
🔹 .setgdesc - Edit description
🔹 .setgpp - Set group picture

Type *.help <command>* for detailed info

TITAN © ${new Date().getFullYear()} • Powered by ezio
`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { 
                text: helpMessage
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage }, { quoted: message });
    }
}

module.exports = helpCommand;
