const Command = require("../command.js");
const path = require("path");

class Reload extends Command {
    constructor(client) {
        super(client, {
            name: "reload",
            type: "utility",
            description: "Reloads commands.",
            use: [
                {
                    name: "names",
                    type: "string",
                    required: true
                }
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

            this.client.utils.log(`Reloaded ${name} successfully!`);
            this.success++;
        } catch (err) {
            this.client.utils.error(`File failed to load: ${name}.`);
            this.client.utils.error(err);
            this.failure++;
        } finally {
            delete require.cache[require.resolve(dir)];
        }
    }

    run(message, args) {
        this.success = 0;
        this.failure = 0;

        const commands = args.names.split(" ").map(a => a.toLowerCase());

        if (commands[0] === "all") {
            const commands = this.client.commands.filter(file => !file.default);

            for (const [name] of commands) this.reload(name);
        } else if (commands.some(a => this.client.commands.has(a) || this.client.commands.has(this.client.aliases.get(a)))) {
            for (const cmd of commands) {
                const command = this.client.commands.get(cmd) || this.client.commands.get(this.client.aliases.get(cmd));
                
                if (!command || command.default) continue;

                this.reload(command.name.toLowerCase());
            }
        }
        message.channel.send(`Reloaded ${this.success} command${this.success === 1 ? "" : "s"}, ${this.failure} failed.`);
    }
}

module.exports = Reload;
