exports.run = (bot, message, args) => {
    if (!args.length) return console.error("Must specify at least one command!");

    for (const cmd of args) {
        const cmdFile = bot.commands.get(cmd.toLowerCase()) || bot.commands.get(bot.aliases.get(cmd.toLowerCase()));

        if (!cmdFile || cmdFile.default) continue;

        bot.commands.delete(cmdFile.name.toLowerCase());

        if (cmdFile.aliases) for (const alias of cmdFile.aliases) bot.aliases.delete(alias);
    }
};

exports.name = "delcmd";
exports.type = "utility";
exports.description = "Deletes a specified command or group of commands.";
exports.use = [
    [ "command name or names", true ]
];
exports.default = true;
