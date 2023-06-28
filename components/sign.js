const logger = require('../util/logger.js');
const config = require('../config.json');
const LocalStorage = require('node-localstorage').LocalStorage;
const storage = new LocalStorage('./luck');
const axios = require('axios');
const dayjs = require('dayjs');

function randomizeReply (jrrp) {
    const seed = Math.floor(Math.random() * 10);
    switch (seed) {
    case 0:
        return `你今天的人品是${jrrp}😎`;
    case 1:
        return `今天你的人品是👉${jrrp}👈`;
    case 2:
        return `you now day's people goods is ${jrrp}`
    case 3:
        return `今日のあなたのキャラクターは${jrrp}`
    case 4:
        return `签到成功(≧▽≦)！你今天的人品是：${jrrp}`
    case 5:
        return `🤡☀️☯️👉${jrrp}`
    case 6:
        return `شخصيتك اليوم${jrrp}`
    case 7:
        return `你的人品应该由自己决定哟!`
    case 8:
        return `f(jrrp)=arcsin(${Math.sin(jrrp)})`
    case 9:
        return `今天你的人品是${jrrp.toString(2)}`
    }
}

class Sign {
    constructor (client) {
        this.client = client;
    }
    
    refresh () {
        const now = dayjs().format('DD/MM/YYYY');
        if (now !== storage.getItem('date')) {
            storage.setItem('user', '{}');
            storage.setItem('seed', Math.round(Math.random() * 100 + 1));
            storage.setItem('date', now);
            return true;
        }
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

    wait (maxTime = 5) {
        return new Promise(resolve => {
            setTimeout(() => resolve(), Math.random() * 1000 * maxTime);
        });
    }
    
    activate () {
        logger.info('签到组件加载成功！');
    }
    
    async onGroupMessage (session) {
        if (!config.workgroup.includes(session.group_id)) return;
        
        const result = this.refresh();
        if (session.raw_message.trim() === '签到') {
            await this.wait();
            const attempt = this.attempt(parseInt(session.user_id));
            if (attempt <= 1) {
                const jrrp = parseInt(session.user_id / this.seed % 101);
                session.reply(randomizeReply(jrrp), true);
                /*
            } else if (attempt == 2) {
            const jrrp = parseInt(session.user_id / this.seed % 101);
                session.reply('你知道吗，反复签到可是要掉脑袋的(๑•﹏•) 你今天的人品是：' + jrrp, true);
            */
            } else {
                try {
                    this.client.setGroupBan(session.group_id, session.user_id, attempt ** attempt * 60);
                    //const poisonous = await axios.get('https://api.muxiaoguo.cn/api/dujitang');
                    //session.reply(poisonous.data.data.comment);
                } catch (e) {}
            }
        }
    }

    get seed () {
        return parseInt(storage.getItem('seed'));
    }
}

module.exports = Sign;
