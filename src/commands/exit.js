const Command = require("../command.js");

class ExitCommand extends Command {
    constructor(client) {
        super(client, {
            name: "restart",
            type: "utility",
            description: "Exits the process gracefully and lets pm2 turn it back on.",
            ownerOnly: true
        });

        this.default = true;
    }

    run() {
        console.log("Bot shutting down.");
        process.exit();
    }
}

module.exports = ExitCommand;
