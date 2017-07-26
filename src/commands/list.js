const Command = require("../command.js");
const {RichEmbed} = require("discord.js");

class List extends Command {
    constructor(client) {
        super(client, {
            name: "list",
            type: "utility",
            description: "Lists all commands of a specified type",
            use: [
                ["type or 'types'", true]
            ],
            aliases: [
                "ls"
            ]
        });

        this.default = true;
    }

    run(message, args) {
        const embed = new RichEmbed();
        const type  = args[0].toLowerCase();

        if (!type) return message.channel.send("No type was provided.");

        if (type === "types") {
            const types = [];

            this.client.commands.forEach(a => a.type && !types.includes(a.type) ? types.push(a.type) : undefined);

            embed.setTitle("Types")
                .setDescription(types.sort().join("\n"))
                .setColor(24120);

            return (this.client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))({embed});
        }
        const list = this.client.commands.filter(a => a.type === type);

        if (!list) return message.channel.send(`No commands of ${type}`);
        embed.setTitle(type.replace(/^(.)/, l => l.toString().toUpperCase()))
            .setDescription(list.map(a => a.name).sort().join("\n"))
            .setColor(24120);

        return (this.client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))({embed});
    }
}

module.exports = List;
