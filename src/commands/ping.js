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
            const ping = msg.createdTimestamp - message.createdTimestamp;

            return msg.edit(`P${"o".repeat(ping / 50)}ng!\`\`\`
Websocket:       ${Math.round(this.client.ping)}ms
Response Time:   ${ping}ms\n\`\`\``
            );
        });
    }
}

module.exports = Ping;
