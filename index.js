const { createClient } = require('icqq');
const config = require('./config.json');
const logger = require('./util/logger.js');
const components = {};
let guild = {};

logger.info(`
 _  __    ___        ___    ___ ___
| |/ /   / \\ \\      / / \\  |_ _|_ _|
| ' /   / _ \\ \\ /\\ / / _ \\  | | | |
| . \\  / ___ \\ V  V / ___ \\ | | | |
|_|\\_\\/_/   \\_\\_/\\_/_/   \\_\\___|___|
____________________

`);
logger.info('读取配置文件并尝试创建实例...');
if (config.debug_mode) {
    logger.warn('调试模式已开启！');
}
process.on("unhandledRejection", (reason, promise) => {
	logger.error('Unhandled Rejection at: ', promise, ' reason:', reason)
})

const client = createClient({
    log_level: config.debug_mode ? 'mark' : 'off',
    platform: config.platform,
    sign_api_addr: config.sign_api_addr
});

logger.info('初始化接口...');
initializeCoreApi();
if (config.use_guild) {
    logger.info('频道功能已启用！初始化相关 API 中');
    guild = GuildApp.bind(client);
    initializeGuildApi();
}

logger.info('尝试登录...');
login();

function login () {
    client.on('system.login.qrcode', function (e) {
        //扫码后按回车登录
        process.stdin.once('data', () => login())
    });
    client.on('system.login.slider', function (e) {
        logger.info('本次登录需要滑动验证码，请在验证后输入ticket并回车。');
        logger.info(e.url);
        process.stdin.once('data', (ticket) => {
            client.sliderLogin(ticket);
        });
    });
    client.on('system.login.device', function (e) {
        logger.info('请选择验证方式:(1：短信验证   其他：扫码验证)');
        process.stdin.once('data', (data) => {
            if (data.toString().trim() === '1') {
                client.sendSmsCode();
                logger.info('请输入手机收到的短信验证码:')
                process.stdin.once('data', (res) => {
                    client.submitSmsCode(res.toString().trim())
                });
            } else {
                logger.info('扫码完成后回车继续：' + e.url)
                process.stdin.once('data', () => {
                    client.login();
                });
            }
        });
    });
    client.login(config.qq, config.password);
    
    client.on('system.online', () => {
        logger.info('已登录!开始加载组件...');
        loadComponents();
    });
    
    client.on('system.login.error', (e) => {
        logger.error('登录时出现错误：' +  e.message);
        process.exit();
    });
    
    client.on('system.offline', (e) => {
        logger.error('账号下线：' +  e.message);
        process.exit();
    });
}

function initializeCoreApi () {
    client.on('message.group', async (e) => {
        for (const id in components) {
            try {
                if (components[id].onGroupMessage) components[id].onGroupMessage(e);
            } catch (e) {
                logger.error(e);
            }
        }
    });
    client.on('message.private', async (e) => {
        for (const id in components) {
            try {
                if (components[id].onPrivateMessage) components[id].onPrivateMessage(e);
            } catch (e) {
                logger.error(e);
            }
        }
    });
    client.on('request.friend', async (e) => {
        for (const id in components) {
            try {
                if (components[id].onRequestFriend) components[id].onRequestFriend(e);
            } catch (e) {
                logger.error(e);
            }
        }
    });
}

function initializeGuildApi () {
    client.on('guild.message', async (e) => {
        for (const id in components) {
            try {
                if (components[id].onGuildMessage) components[id].onGuildMessage(e);
            } catch (e) {
                logger.error(e);
            }
        }
    });
}

function loadComponents () {
    // 加载组件
    for (const componentId in config.components) {
        const name = config.components[componentId];
        try {
            const Component = require(`./components/${name}`);
            components[name] = new Component(client, guild);
            if (components[name].activate) components[name].activate();
            logger.info(`组件 ${name} 已被激活!`);
        } catch (e) {
            delete components[name];
            logger.error(`加载组件 ${name} 时发生错误:\n ${e}`);
        }
    }
}
