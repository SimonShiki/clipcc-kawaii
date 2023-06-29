const logger = require('../util/logger.js');
const config = require('../config.json');
const LocalStorage = require('node-localstorage').LocalStorage;
const storage = new LocalStorage('./luck');
const axios = require('axios');
const dayjs = require('dayjs');

function randomizeReply (jrrp, time) {
    const seed = Math.floor(Math.random() * 15);
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
        return `今天你的人品是${jrrp.toString(2)}，不过是二进制`
    case 10:
        return `f(jrrp)=e^${Math.log(jrrp)}`
    case 11:
        return `Can't keep up! Did the system time change, or is your jrrp overloaded? Running ${time}ms or ${jrrp} points behind`
    case 12:
        return `今天你的人品是${jrrp}!!!!!`
    case 13:
        return `你今天的人品是 ${String.fromCharCode(jrrp)}`
    case 14:
        return `今日人品签到是怎么回事呢？今日人品相信大家都很熟悉，但是今日人品签到是怎么回事呢，下面就让小编带大家一起了解吧。\n今日人品签到，其实就是你今天没有人品，大家可能会很惊讶今日人品怎么会签到呢？但事实就是这样，小编也感到非常惊讶。\n这就是关于今日人品签到的事情了，大家有什么想法呢，欢迎在评论区告诉小编一起讨论哦！`
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

    wait (maxTime = 10) {
        return new Promise(resolve => {
            const time = Math.random() * 1000 * maxTime;
            setTimeout(() => resolve(time), time);
        });
    }
    
    activate () {
        logger.info('签到组件加载成功！');
    }
    
    async onGroupMessage (session) {
        if (!config.workgroup.includes(session.group_id)) return;
        
        const result = this.refresh();
        if (session.raw_message.trim() === '签到') {
            const time = await this.wait();
            const attempt = this.attempt(parseInt(session.user_id));
            if (attempt <= 1) {
                const jrrp = parseInt(session.user_id / this.seed % 101);
                session.reply(randomizeReply(jrrp, time), true);
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
