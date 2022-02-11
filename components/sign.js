const logger = require('../util/logger.js');
const LocalStorage = require('node-localstorage').LocalStorage;
const storage = new LocalStorage('./luck');
const axios = require('axios');
const dayjs = require('dayjs');

class Sign {
    constructor (client) {
        this.client = client;
    }
    
    attempt (id) {
        let list = storage.getItem('user');
        if (!list) storage.setItem('user', '{}');
        list = JSON.parse(list);
        const attempt = list[id];
        
        if (!attempt) {
            list[id] = 1;
            storage.setItem('user', JSON.stringify(list));
            return 1;
        }
        list[id] = attempt + 1;
        storage.setItem('user', JSON.stringify(list));
        return attempt + 1;
    }
    
    activate () {
        logger.info('签到组件加载成功！');
    }
    
    async onGroupMessage (session) {
        if (session.raw_message === '签到') {
            const attempt = await this.attempt(parseInt(session.user_id));
            if (attempt <= 1) {
                const jrrp = parseInt(session.user_id / this.getSeed()) % 101;
                session.reply('签到成功(≧▽≦)！你今天的人品是：'+ jrrp);
            } else if (attempt == 2) {
                session.reply('你知道吗，反复签到可是要掉脑袋的(๑•﹏•)');
            } else {
                try {
                    this.client.setGroupBan(session.group_id, session.user_id, 2 ** attempt * 60);
                    const poisonous = await axios.get('https://api.muxiaoguo.cn/api/dujitang');
                    session.reply(poisonous.data.data.comment);
                } catch (e) {}
            }
        }
    }

    getSeed () {
        const now = dayjs().format('DD/MM/YYYY');
        if (now !== storage.getItem('date')) {
            storage.setItem('user', '{}');
            storage.setItem('seed', Math.round(Math.random() * 100));
            storage.setItem('date', now);
        }
        return parseInt(storage.getItem('seed'));
    }
}

module.exports = Sign;