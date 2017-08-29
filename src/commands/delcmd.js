const Command = require("../command.js");

class Del extends Command {
    constructor(client) {
        super(client, {
            name: "delcmd",
            type: "utility",
            use: [
                {
                    name: "name",
                    type: "string",
                    required: true
                }
            ],
            description: "Deletes a specified command or group of commands."
        });

        this.default = true;
    }

    run(message, args) {
        const commands = args.names.split(" ");

        for (const cmd of commands) {
            const cmdFile = this.client.commands.get(cmd.toLowerCase()) || this.client.commands.get(this.client.aliases.get(cmd.toLowerCase()));

            if (!cmdFile || cmdFile.default) continue;

            this.client.commands.delete(cmdFile.name.toLowerCase());

            if (cmdFile.aliases) for (const alias of cmdFile.aliases) this.client.aliases.delete(alias);
        }
    }
}

module.exports = Del;
