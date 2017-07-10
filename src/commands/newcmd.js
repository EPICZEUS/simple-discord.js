const path = require("path");
const fs = require("fs");

exports.run = (bot, message, args) => {
    if (!args.length) return console.error("No new commands specified!");

    const dir = path.join(process.cwd(), bot._commandsDir);

    for (const cmd of args) {
        const fileDir = path.join(dir, cmd);

        if (!fs.existsSync(fileDir)) continue;

        const cmdFile = require(fileDir);

        bot.commands.set(cmdFile.name.toLowerCase(), cmdFile);

        if (cmdFile.aliases) {
            for (const alias of cmdFile.aliases) {
                if (bot.aliases.has(alias)) {
                    console.error(`Command ${cmdFile.name} has duplicate alias ${alias}!`);
                    continue;
                }
                bot.aliases.set(alias, cmdFile.name.toLowerCase());
            }
        }

        delete require.cache[require.resolve(fileDir)];
    }
};

exports.name = "newcmd";
exports.type = "utility";
exports.description = "Adds a new command.";
exports.use = [
    [ "command name or names", true ]
];
exports.default = true;
