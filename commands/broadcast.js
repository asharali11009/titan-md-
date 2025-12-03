const isOwnerOrSudo = require('../lib/isOwner');
const store = require('../lib/lightweight_store');

/**
 * Broadcast command to send messages to all chats
 * Usage: .broadcast <message>
 * Only usable by the bot owner
 */
async function broadcastCommand(sock, chatId, message, args) {
    try {
        // Check if sender is owner
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!isOwner) {
            await sock.sendMessage(chatId, { 
                text: '❌ Only the owner can use broadcast command'
            }, { quoted: message });
            return;
        }

        // Get broadcast message
        const broadcastMessage = args.trim();
        if (!broadcastMessage) {
            await sock.sendMessage(chatId, { 
                text: '⚠️ Please provide a message to broadcast\n\nUsage: .broadcast <message>'
            }, { quoted: message });
            return;
        }

        // Ask for broadcast type
        await sock.sendMessage(chatId, { 
            text: `📢 *Broadcast Message*\n\nMessage: ${broadcastMessage}\n\nWhere do you want to broadcast this message?\n\n1️⃣ Groups only\n2️⃣ Private chats only\n3️⃣ Both groups and private chats\n\n*Reply with the number (1, 2, or 3)*`,
        }, { quoted: message });

        // Set up a listener for the response
        const filter = m => {
            return m.key.remoteJid === chatId && 
                  (m.key.fromMe === false) && 
                  (m.message?.conversation === '1' || m.message?.conversation === '2' || m.message?.conversation === '3' || 
                   m.message?.extendedTextMessage?.text === '1' || m.message?.extendedTextMessage?.text === '2' || m.message?.extendedTextMessage?.text === '3');
        };

        // Create a promise that will resolve with the next matching message
        const responsePromise = new Promise((resolve) => {
            const responseHandler = (m) => {
                if (filter(m.messages[0])) {
                    sock.ev.off('messages.upsert', responseHandler);
                    resolve(m.messages[0]);
                }
            };
            sock.ev.on('messages.upsert', responseHandler);

            // Timeout after 30 seconds
            setTimeout(() => {
                sock.ev.off('messages.upsert', responseHandler);
                resolve(null);
            }, 30000);
        });

        // Wait for response
        const response = await responsePromise;
        if (!response) {
            await sock.sendMessage(chatId, { 
                text: '❌ Broadcast cancelled - no response received'
            }, { quoted: message });
            return;
        }

        const choice = response.message?.conversation || response.message?.extendedTextMessage?.text || '';

        // Process based on user choice
        const toGroups = choice === '1' || choice === '3';
        const toPrivate = choice === '2' || choice === '3';

        if (!toGroups && !toPrivate) {
            await sock.sendMessage(chatId, { 
                text: '❌ Invalid choice. Broadcast cancelled.'
            }, { quoted: message });
            return;
        }

        // Start broadcast
        await sock.sendMessage(chatId, { 
            text: '🔄 Starting broadcast. Please wait...'
        });

        // Get all chats
        const allChats = Object.keys(store.chats);
        const groups = allChats.filter(id => id.endsWith('@g.us'));
        const privateChats = allChats.filter(id => id.endsWith('@s.whatsapp.net'));

        let successCount = 0;
        let failCount = 0;
        let totalTargets = 0;
        
        if (toGroups) totalTargets += groups.length;
        if (toPrivate) totalTargets += privateChats.length;

        // Create progress message
        const progressMsg = await sock.sendMessage(chatId, { 
            text: `📢 *Broadcast Progress*\n\n⏳ Processing: 0/${totalTargets}`
        });

        // Broadcast to groups with hidetag
        if (toGroups && groups.length > 0) {
            for (let i = 0; i < groups.length; i++) {
                const groupId = groups[i];
                try {
                    // Get all members for hidetag
                    const metadata = await sock.groupMetadata(groupId);
                    const participants = metadata.participants || [];
                    const mentions = participants.map(p => p.id);

                    // Send with hidetag
                    await sock.sendMessage(groupId, { 
                        text: `📢 *ANNOUNCEMENT*\n\n${broadcastMessage}`,
                        mentions: mentions
                    });
                    
                    successCount++;

                    // Update progress
                    await sock.sendMessage(chatId, { 
                        edit: progressMsg.key,
                        text: `📢 *Broadcast Progress*\n\n⏳ Processing: ${successCount + failCount}/${totalTargets}\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`
                    });

                    // Small delay to avoid spam detection
                    await new Promise(r => setTimeout(r, 1000));
                    
                } catch (err) {
                    console.error(`Error broadcasting to ${groupId}:`, err);
                    failCount++;
                    
                    // Update progress
                    await sock.sendMessage(chatId, { 
                        edit: progressMsg.key,
                        text: `📢 *Broadcast Progress*\n\n⏳ Processing: ${successCount + failCount}/${totalTargets}\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`
                    });
                }
            }
        }

        // Broadcast to private chats
        if (toPrivate && privateChats.length > 0) {
            for (let i = 0; i < privateChats.length; i++) {
                const userId = privateChats[i];
                try {
                    await sock.sendMessage(userId, { 
                        text: `📢 *ANNOUNCEMENT*\n\n${broadcastMessage}`
                    });
                    
                    successCount++;

                    // Update progress
                    await sock.sendMessage(chatId, { 
                        edit: progressMsg.key,
                        text: `📢 *Broadcast Progress*\n\n⏳ Processing: ${successCount + failCount}/${totalTargets}\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`
                    });

                    // Small delay to avoid spam detection
                    await new Promise(r => setTimeout(r, 1000));
                    
                } catch (err) {
                    console.error(`Error broadcasting to ${userId}:`, err);
                    failCount++;
                    
                    // Update progress
                    await sock.sendMessage(chatId, { 
                        edit: progressMsg.key,
                        text: `📢 *Broadcast Progress*\n\n⏳ Processing: ${successCount + failCount}/${totalTargets}\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`
                    });
                }
            }
        }

        // Final report
        await sock.sendMessage(chatId, { 
            text: `📢 *Broadcast Completed*\n\n✅ Successfully sent: ${successCount}\n❌ Failed: ${failCount}\n\nTarget: ${toGroups && toPrivate ? 'All Chats' : toGroups ? 'Groups Only' : 'Private Chats Only'}`
        });

    } catch (error) {
        console.error('Error in broadcast command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Error executing broadcast command'
        }, { quoted: message });
    }
}

module.exports = broadcastCommand;
