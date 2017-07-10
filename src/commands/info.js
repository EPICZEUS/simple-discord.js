exports.run = (client, message, args = [""]) => {
    const cmdFile = client.commands.get(args[0].toLowerCase()) || client.commands.get(client.aliases.get(args[0].toLowerCase()));

    if (!cmdFile) return console.warn(`${args[0]} is not a valid command name or alias.`);

    const howTo = cmdFile.use ? cmdFile.use.map(use => use[1] ? `<${use[0]}>` : `[${use[0]}]`).join(" ") : "";
    const use = client.prefix ? `${client.prefix}${cmdFile.name} ${howTo}` : `${howTo ? `${howTo} ` : ""}${cmdFile.name}${client.suffix}`;

    (client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))(message.content, {embed: {
        title:       cmdFile.name.replace(/^./, l => l.toUpperCase()),
        description: cmdFile.description,

        fields: [{
            name:  "Usage",
            value: use
        },
        {
            name:  "Aliases",
            value: cmdFile.aliases ? cmdFile.aliases.join(", ") : "None"
        }],
        footer: {
            text: "<> - required, [] - optional"
        },
        color: 0x4d68cc
    }}).catch(console.error);
};

exports.name = "info";
exports.type = "general";
exports.description = "Displays info about the specified command.";
exports.use = [
    ["command or alias", true]
];
exports.aliases = [
    "help"
];
exports.default = true;
