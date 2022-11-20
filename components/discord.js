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
        await axios.post(config.discord_webhook,{
          headers: {
            'content-type': 'application/json'
          },
          data: JSON.stringify({
             content: session.raw_message,
             username: session.sender.nickname
          })
        })
    }
    async onGroupMessage (session) {
        if (!config.workgroup.includes(session.group_id)) return;
        if (session.raw_message == '签到') return;
        await this.sendWebhook(session)
    }
}

module.exports = Discord;
