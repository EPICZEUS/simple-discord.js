const Command = require("../command.js");

class Exit extends Command {
    constructor(client) {
        super(client, {
            name: "exit",
            type: "utility",
            description: "Exits the process gracefully.",
            ownerOnly: true
        });

        this.default = true;
    }

    run() {
        this.client.utils.log("Bot shutting down.");
        process.exit();
    }
}

module.exports = Exit;
