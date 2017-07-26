const Command = require("../command.js");

class Ping extends Command {
    constructor(client) {
        super(client, {
            name: "ping",
            type: "utility",
            description: "Displays the overall ping."
        });

        this.default = true;
    }

    run(message) {
        return message.channel.send("Pinging...").then(msg => {
            return msg.edit("Calculated Ping```\n" +
                "Websocket:       " + Math.round(this.client.ping) + "ms\n" +
                "Response Time:   " + (msg.createdTimestamp - message.createdTimestamp) + "ms\n```"
            );
        });
    }
}

module.exports = Ping;
