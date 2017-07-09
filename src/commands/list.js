const {RichEmbed} = require("discord.js");

exports.run = (client, message, args) => {
    const embed = new RichEmbed();
    const type  = args[0].toLowerCase();

    if (!type) return message.channel.send("No type was provided.");

    if (type === "types") {
        const types = [];

        client.commands.forEach(a => a.type && !types.includes(a.type) ? types.push(a.type) : undefined);

        embed.setTitle("Types")
            .setDescription(types.sort().join("\n"))
            .setColor(24120);

        return (client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))({embed}).catch(console.error);
    }
    const list = client.commands.filter(a => a.type === type);

    if (!list) return message.channel.send(`No commands of ${type}`);
    embed.setTitle(type.replace(/^(.)/, l => l.toString().toUpperCase()))
        .setDescription(list.map(a => a.name).sort().join("\n"))
        .setColor(24120);

    (client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))({embed}).catch(console.error);
};

exports.name = "list",
exports.type = "utility";
exports.description = "Lists all commands of a specified type";
exports.use = [
    ["type or 'types'", true]
];
exports.aliases = [
    "ls"
];
