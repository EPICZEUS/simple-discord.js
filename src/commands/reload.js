const path = require("path");

let success = 0, failure = 0;

function reload(bot, name) {
    const dir = path.join(process.cwd(), bot._commandsDir, name);

    try {
        delete require.cache[require.resolve(dir)];
        const cmdFile = require(dir);

        bot.commands.set(name, cmdFile);

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

exports.run = (bot, message, args) => {
    args = args.map(a => a.toLowerCase());

    if (args[0] === "all") {
        bot.commands.filter(file => !file.default).forEach(a => {
            reload(bot, a.name.toLowerCase());
        });
    } else if (args.some(a => bot.commands.has(a) || bot.commands.has(bot.aliases.get(a)))) {
        for (const cmd of args) {
            const cmdFile = bot.commands.get(cmd) || bot.commands.get(bot.aliases.get(cmd));
			
            if (!cmdFile || cmdFile.default) continue;

            reload(bot, cmdFile.name.toLowerCase());
        }
    }
    message.channel.send(`Reloaded ${success} command${success === 1 ? "" : "s"}, ${failure} failed.`);
    success = 0;
    failure = 0;
};

exports.name = "reload";
exports.type = "utility";
exports.description = "Reloads commands.";
exports.use = [
    ["`all` or list of commands", true]
];
exports.aliases = [
    "refresh"
];
exports.default = true;
