const config = require('../config.json');

class Yejun {
    constructor (client) {
        this.client = client;
    }
    
    onGroupMessage (session) {
        if (config.workgroup.includes(session.group_id) && config.rbq.includes(session.raw_message)) {
            this.client.setGroupBan(session.group_id, session.user_id, 60);
        }
    }
}

module.exports = Yejun;