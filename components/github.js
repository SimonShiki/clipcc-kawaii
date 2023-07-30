const { Octokit } = require("@octokit/rest");
const LocalStorage = require('node-localstorage').LocalStorage;
const storage = new LocalStorage('./github');
const config = require('../config.json');
const logger = require('../util/logger.js');

const featureTemplate = (id, request) => {
    return (
`**(🤖 本 issue 由机器人生成)**   
**ID: ${id}**   
**请求人: ${request.from}**   
## ✨ 具体描述  - Description
${request.content}
## 🤔 请求原因 - Reason
${request.reason}   


**PS: 如想实现该功能，请在 ClipCC 官方交流群中为该功能进行投票。如投票人数超过 8 人且超过三分之二的人支持该功能，则自动加入开发计划当中。**
`);
};

const bugTemplate = (id, request) => {
    return (
`**(🤖 本 issue 由机器人生成)**   
**ID: ${id}**   
**请求人: ${request.from}**   
## 🐛 具体描述  - Description
${request.content}
## 👟 触发步骤 - Step
${request.step}
`);
};

const isPlanning = (agree, refuse) => {
    if ((agree + refuse) < 8) return false;
    if ((agree / (agree + refuse)) < (2 / 3)) return false;
    return true;
};

class Database {
    constructor () {
        this.cache = [];
        try {
            const data = JSON.parse(storage.getItem('database'));
            if (data === null) this.cache = [];
            else this.cache = data;
        } catch (e) {
            storage.setItem('database', '[]');
        }
    }
    
    read (pos) {
        return this.cache[pos];
    }
    
    add (raw) {
        this.cache.push(raw);
        storage.setItem('database', JSON.stringify(this.cache));
        return this.cache.length - 1;
    }
    
    rewrite (pos, raw) {
        this.cache[pos] = raw;
        storage.setItem('database', JSON.stringify(this.cache));
    }
}

class Github {
    constructor (client) {
        this.client = client;
        this.status = {};
        this.request = {};
        this.database = new Database();
        this.octokit = new Octokit({
            auth: config.ghp
        });
    }
    
    isReply (message) {
        return message[0].type === 'at' && message[0].qq == config.qq;
    }
    
    parseContent (message) {
        if (message[0].type === 'text') return message[0].text.trim();
        else throw new Error('invalid type');
    }
    
    async entry (session, type) {
        // 指令
        if (session.raw_message === '查看用法') {
            return session.reply('功能请求 - 提出功能请求，通过投票的方式来决定是否实现与实现优先级\n漏洞汇报 - 汇报别针社区的漏洞\n查看列表 - 列出所有漏洞/功能请求\n\n以上内容均会同步至 https://github.com/Clipteam/clip-community 的 issue 区，直接创建的 issue 将不被受理。\n⚠️如有安全性问题请直接联系管理员，不要继续通过机器人提交');
        }
        
        if (session.raw_message === '查看列表') {
            return session.reply('https://github.com/Clipteam/clip-community/issues?q=is%3Aopen+is%3Aissue');
        }
    
        if (session.raw_message === '功能请求') {
            if (type === 'group') return session.reply('请通过私聊/临时会话提交', true);
            this.status[session.user_id] = 'feature_requesting_title';
            this.request[session.user_id] = {
                type: 'feature',
                from: session.user_id,
                agree: [],
                refuse: []
            };
            return session.reply('请用一句话描述你的需求(直接发送即可)', true);
        }
        
        if (session.raw_message === '漏洞汇报') {
            if (type === 'group') return session.reply('请通过私聊/临时会话提交', true);
            this.status[session.user_id] = 'bug_reporting_title';
            this.request[session.user_id] = {
                type: 'bug',
                from: session.user_id
            };
            return session.reply('请用一句话描述你遇到的漏洞(直接发送即可)', true);
        }
        
        if (session.raw_message.startsWith('投票 ')) {
            const args = session.raw_message.split(' ');
            const original = this.database.read(args[1]);
            if (!original) return session.reply('请求不存在！', true);
            if (original.type !== 'feature') return session.reply('该请求并非功能请求!', true);
            if (isPlanning(original.agree.length, original.refuse.length)) return session.reply('尘埃落定啦...', true);
            
            const issue_data = await this.octokit.issues.get({
                owner: 'Clipteam',
                repo: 'clip-community',
                issue_number: original.issue,
            })

            if(issue_data.data.locked || issue_data.data.state !== 'open') {
                return session.reply('该请求不能投票惹~', true);
            }

            if (args[2] === '支持') {
                if (original.agree.indexOf(session.user_id) === -1 && original.refuse.indexOf(session.user_id) === -1) {
                    original.agree.push(session.user_id);
                } else return session.reply('你已经投票过惹', true);
            }
            else if (args[2] === '反对') {
                if (original.agree.indexOf(session.user_id) === -1 && original.refuse.indexOf(session.user_id) === -1) {
                    original.refuse.push(session.user_id);
                } else return session.reply('你已经投票过惹', true);
            } else return session.reply('请回复 支持 或 反对');
            this.database.rewrite(args[1], original);
            
            session.reply(`你为 ${original.title} (详情请访问 https://github.com/Clipteam/clip-community/issues/${original.issue}) 投出了宝贵的一票！`, true);
            await this.octokit.rest.issues.createComment({
                owner: 'Clipteam',
                repo: 'clip-community',
                issue_number: original.issue,
                body: `## 🫧 当前状态\n### 支持: ${original.agree.length}\n### 反对: ${original.refuse.length}`,
            });
            if (isPlanning(original.agree.length, original.refuse.length)) {
                session.reply('🥳 功能请求已正式通过！');
                try {
                    await this.octokit.rest.issues.removeLabel({
                        owner: 'Clipteam',
                        repo: 'clip-community',
                        issue_number: original.issue,
                        name: 'voting'
                    });
                    await this.octokit.rest.issues.addLabels({
                        owner: 'Clipteam',
                        repo: 'clip-community',
                        issue_number: original.issue,
                        labels: ['pending']
                    });
                } catch (e) {
                    session.reply('为啥不能标记为 planning 捏？这里现场 @Shiki');
                    console.log(e);
                }
            }
            return;
        }
        // 输入模式
        if (!this.status.hasOwnProperty(session.user_id)) return;
        if(type === 'group') return;
        // if (!this.isReply(session.message)) return;
        
        // 解析输入内容
        let parsedContent = '';
        try {
            parsedContent = this.parseContent(session.message);
        } catch (e) {
            return session.reply('输入类型不合法，请重新输入', true);
        }
        
        // -----------
        if (this.status[session.user_id] === 'feature_requesting_title') {
            this.request[session.user_id].title = parsedContent;
            this.status[session.user_id] = 'feature_requesting_content';
            return session.reply('请具体描述你的需求内容', true);
        }
        if (this.status[session.user_id] === 'feature_requesting_content') {
            this.request[session.user_id].content = parsedContent;
            this.status[session.user_id] = 'feature_requesting_reason';
            return session.reply('请具体描述你的请求原因', true);
        }
        if (this.status[session.user_id] === 'feature_requesting_reason') {
            this.request[session.user_id].reason = parsedContent;
            delete this.status[session.user_id];
            session.reply('提交成功！后台处理中...', true);
            console.log(this.request[session.user_id]);
            const requestid = this.database.add(this.request[session.user_id]);
            const issue = await this.octokit.rest.issues.create({
                owner: 'Clipteam',
                repo: 'clip-community',
                title: this.request[session.user_id].title,
                body: featureTemplate(requestid, this.request[session.user_id]),
                labels: ['feature', 'voting']
            });
            const edited = this.database.read(requestid);
            edited.issue = issue.data.number;
            this.database.rewrite(requestid, edited);
            this.client.sendGroupMsg(config.ccgroup, `有新的 ID 为 ${requestid} 的功能请求：${this.request[session.user_id].title}\n(详情请访问 https://github.com/Clipteam/clip-community/issues/${issue.data.number})\n如需支持该功能的实现，请发送"投票 [请求 ID] [支持/反对]"`);
            return;
        }
        
        // -----------
        if (this.status[session.user_id] === 'bug_reporting_title') {
            this.request[session.user_id].title = parsedContent;
            this.status[session.user_id] = 'bug_reporting_content';
            return session.reply('请具体描述你遇到的问题', true);
        }
        if (this.status[session.user_id] === 'bug_reporting_content') {
            this.request[session.user_id].content = parsedContent;
            this.status[session.user_id] = 'bug_reporting_step';
            return session.reply('请具体描述触发过程', true);
        }
        if (this.status[session.user_id] === 'bug_reporting_step') {
            this.request[session.user_id].step = parsedContent;
            delete this.status[session.user_id];
            session.reply('提交成功！后台处理中...', true);
            console.log(this.request[session.user_id]);
            const requestid = this.database.add(this.request[session.user_id]);
            const issue = await this.octokit.rest.issues.create({
                owner: 'Clipteam',
                repo: 'clip-community',
                title: this.request[session.user_id].title,
                body: bugTemplate(requestid, this.request[session.user_id]),
                labels: ['bug', 'pending']
            });
            const edited = this.database.read(requestid);
            edited.issue = issue.data.number;
            this.database.rewrite(requestid, edited);
            return;
        }
    }
    
    onGroupMessage (session) {
        this.entry(session, 'group');
    }
    
    onPrivateMessage (session) {
        this.entry(session);
    }
}

module.exports = Github;