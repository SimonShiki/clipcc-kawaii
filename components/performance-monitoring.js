const logger = require('../util/logger.js');
const os = require('os');
const config = require('../config.json');


class PerformanceMonitoring {
    onActivate () {
        logger.info('性能监控组件加载成功!');
        setTimeout(() => {
            this.monitoring();
        }, 1000)
    }

    monitoring() {
        const load = os.loadavg();
        // 五分钟平均load超0.6
        if (load > config.five_mins_average_load_limit) {
            logger.warn('当前系统负载过高，请及时处理！');
            boardcast('⚠ 服务器五分钟平均负载超限');
        }

    }

    async broadcast (message) {
        const fresh = message;
        for (const groupid of config.performance_work_group) {
            this.client.sendGroupMsg(groupid, fresh);
            logger.info('群聊' + groupid + '推送成功!');
            await this.sleep(1000);
        }
    }
}

module.exports = PerformanceMonitoring;