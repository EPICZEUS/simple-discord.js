const Command = require("../command.js");

class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: "ping",
            type: "utility",
            description: "Displays the overall ping."
        });

        this.default = true;
    }

    run(message) {
        message.channel.send("Pinging...").then(msg => {
            return msg.edit("Calculated Ping```\n" +
                "Websocket:       " + Math.round(this.client.ping) + "ms\n" +
                "Response Time:   " + (msg.createdTimestamp - message.createdTimestamp) + "ms\n```"
            );
        }).catch(console.error);
    }
}

module.exports = PingCommand;
