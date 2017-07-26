const Command = require("../command.js");
const path = require("path");

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

    reload(name) {
        const dir = path.join(process.cwd(), this.client._commandsDir, name);

        try {
            delete require.cache[require.resolve(dir)];
            const Command = require(dir);

            const command = new Command(this.client);

            this.client.commands.set(name, command);

            console.info(`Reloaded ${name} successfully!`);
            this.success++;
        } catch (err) {
            console.error(`File failed to load: ${name}.`);
            console.error(err);
            this.failure++;
        } finally {
            delete require.cache[require.resolve(dir)];
        }
    }

    run(message, args) {
        this.success = 0;
        this.failure = 0;

        args = args.map(a => a.toLowerCase());

        if (args[0] === "all") {
            for (const [name] of this.client.commands.filter(file => !file.default)) this.reload(name);
        } else if (args.some(a => this.client.commands.has(a) || this.client.commands.has(this.client.aliases.get(a)))) {
            for (const cmd of args) {
                const command = this.client.commands.get(cmd) || this.client.commands.get(this.client.aliases.get(cmd));
                
                if (!command || command.default) continue;

                this.reload(command.name.toLowerCase());
            }
        }
        message.channel.send(`Reloaded ${this.success} command${this.success === 1 ? "" : "s"}, ${this.failure} failed.`);
    }
}

module.exports = ReloadCommand;
