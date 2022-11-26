const logger = require('../util/logger.js');
const config = require('../config.json');
const axios = require('axios');

class Discord {
    constructor (client) {
        this.client = client;
    }
    activate () {
        logger.info('Discord传话组件加载成功！');
    }
    async sendWebhook(session) {
        const processedMessage = this.processMessage(session.message);
        await axios.post(config.discord_webhook,
          JSON.stringify({
            content: processedMessage,
            username: session.sender.nickname,
            avatar_url: session.member.getAvatarUrl(100)
          }),
        {
          headers: {
            'content-type': 'application/json'
          }
        })
    }
    processMessage (msgArray) {
        const result = [];
        for (const msgElem of msgArray) {
            switch (msgElem.type) {
            case 'face':
            case 'at':
            case 'text':
                result.push(msgElem.text);
                break;
            case 'bface':
                result.push(` ${msgElem.file} `);
                break;
            case 'share':
            case 'flash':
            case 'image':
                result.push(` ${msgElem.url} `);
                break;
            default: 
                result.push(`[${msgElem.type} msg]`);
            }
        }
        return result.join('');
    }
    async onGroupMessage (session) {
        if (!config.workgroup.includes(session.group_id)) return;
        if (session.raw_message == '签到') return;
        await this.sendWebhook(session)
    }
}

module.exports = Discord;
