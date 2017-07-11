const Command = require("../command.js");
const path = require("path");
const fs = require("fs");

class NewCommand extends Command {
    constructor(client) {
        super(client, {
            name: "newcmd",
            type: "utility",
            description: "Adds a new command.",
            use: [
                [ "command name or names", true ]
            ]
        });

        this.default = true;
    }

    run(message, args) {
        if (!args.length) return console.error("No new commands specified!");

        const dir = path.join(process.cwd(), this.client._commandsDir);

        for (const cmd of args) {
            const fileDir = path.join(dir, cmd);

            if (!fs.existsSync(fileDir)) continue;

            const Command = require(fileDir);

            const command = new Command(this.client);

            this.client.commands.set(command.name.toLowerCase(), command);

            if (command.aliases) {
                for (const alias of command.aliases) {
                    if (this.client.aliases.has(alias)) {
                        console.error(`Command ${command.name} has duplicate alias ${alias}!`);
                        continue;
                    }
                    this.client.aliases.set(alias, command.name.toLowerCase());
                }
            }

            delete require.cache[require.resolve(fileDir)];
        }
    }
}

module.exports = NewCommand;
