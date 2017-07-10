const Command = require("../command.js");
const path = require("path");

let success = 0, failure = 0;

function reload(client, name) {
    const dir = path.join(process.cwd(), client._commandsDir, name);

    try {
        delete require.cache[require.resolve(dir)];
        const cmdFile = require(dir);

        client.commands.set(name, cmdFile);

        console.info(`Reloaded ${name} successfully!`);
        success++;
    } catch (err) {
        console.error(`File failed to load: ${name}.`);
        console.error(err);
        failure++;
    } finally {
        delete require.cache[require.resolve(dir)];
    }
}

class ReloadCommand extends Command {
    constructor(client) {
        super(client, {
            name: "reload",
            type: "utility",
            description: "Reloads commands.",
            use: [
                ["`all` or list of commands", true]
            ],
            aliases: [
                "refresh"
            ]
        });

        this.default = true;
    }

    run(message, args) {
        args = args.map(a => a.toLowerCase());

        if (args[0] === "all") {
            this.client.commands.filter(file => !file.default).forEach(a => {
                reload(this.client, a.name.toLowerCase());
            });
        } else if (args.some(a => this.client.commands.has(a) || this.client.commands.has(this.client.aliases.get(a)))) {
            for (const cmd of args) {
                const cmdFile = this.client.commands.get(cmd) || this.client.commands.get(this.client.aliases.get(cmd));
                
                if (!cmdFile || cmdFile.default) continue;

                reload(this.client, cmdFile.name.toLowerCase());
            }
        }
        message.channel.send(`Reloaded ${success} command${success === 1 ? "" : "s"}, ${failure} failed.`);
        success = 0;
        failure = 0;
    }
}

module.exports = ReloadCommand;
