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
                [ "command file name or names", true ]
            ]
        });

        this.default = true;
    }

    run(message, args) {
        const dir = path.join(process.cwd(), this.client._commandsDir), success = [], failure = [];

        for (const cmd of args) {
            const file = path.parse(cmd).ext === ".js" ? cmd : cmd + ".js";
            const fileDir = path.join(dir, file);

            try {
                if (!fs.existsSync(fileDir)) throw new Error(`Simple-Discord - The command file ${fileDir} could not be found.`);

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

                success.push(command.name);
            } catch (err) {
                console.error(err);
                failure.push(cmd);
            } finally {
                if (fs.existsSync(fileDir)) delete require.cache[require.resolve(fileDir)];
            }
        }

        return (this.client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))(`Succeeded: ${success.length ? success.join(", ") : "None"}\nFailed: ${failure.length ? failure.join(", ") : "None"}`, {code:true});
    }
}

module.exports = NewCommand;
