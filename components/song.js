const logger = require('../util/logger.js');
const config = require('../config.json');
const http = require("http");
const schedule = require('node-schedule');
const LocalStorage = require('node-localstorage').LocalStorage;
const storage = new LocalStorage('./song');

class Song {
    constructor (client) {
        this.client = client;
        try {
            this.songList = JSON.parse(storage.getItem('list')) || [];
        } catch (e) {
            storage.setItem('list', '[]');
            this.songList = [];
        }
        const job = schedule.scheduleJob({hour: 23, dayOfWeek: 0}, () => {
            const group = this.client.pickGroup(config.ccgroup);
            const word = this.songList[Math.floor(Math.random() * this.songList.length + 0.5)];
            http.get(`http://s.music.163.com/search/get/?type=1&s=${word}&limit=1`, res => {
                res.on("data", chunk => {
                    try {
                        const id = JSON.parse(String(chunk))?.result?.songs?.[0]?.id;
                        if (id) {
                            group.shareMusic("163", id);
                        } else session.reply("未找到歌曲：" + word, true);
                    } catch (e) {
                        logger.error("请求歌曲API遇到错误：");
                        logger.error(e);
                    }
                });
            }).on("error", (e) => {
                logger.error(e);
            })
        });
    }

    activate () {
        logger.info('点歌组件加载成功！');
    }
    
    async onGroupMessage (session) {
        if (!config.workgroup.includes(session.group_id)) return;
        if (!config.admin.includes(session.user_id)) return;

        if (session.raw_message.startsWith('点歌')) {
            const word = session.raw_message.replace("点歌", "").trim();
            if (!word) return;
            http.get(`http://s.music.163.com/search/get/?type=1&s=${word}&limit=1`, res => {
                res.on("data", chunk => {
                    try {
                        const id = JSON.parse(String(chunk))?.result?.songs?.[0]?.id;
                        if (id) {
                            if (session.group?.shareMusic) session.group.shareMusic("163", id);
                            if (session.friend?.shareMusic) session.friend.shareMusic("163", id);
                        } else session.reply("未找到歌曲：" + word, true);
                    } catch (e) {
                        logger.error("请求歌曲API遇到错误：");
                        logger.error(e);
                    }
                });
            }).on("error", (e) => {
                logger.error(e);
            })
        } else if (session.raw_message.startsWith('加歌')) {
            const word = session.raw_message.replace("加歌", "").trim();
            if (!word) return;
            this.songList.push(word);
            storage.setItem('list', JSON.stringify(this.songList));
            session.reply('加歌成功!', true);
        }
    }
}

module.exports = Song;
