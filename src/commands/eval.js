const Discord = require("discord.js");
const {inspect} = require("util");
const nano = require("nanoseconds");

const embed = new Discord.RichEmbed();

function clean(str, reg) {
    return typeof str == "string" ? str.replace(/[`@]/g, "$&\u200b").replace(reg, "[SECRET]") : str;
}

function handleError(client, message, code, err, time) {
    time = nano(process.hrtime(time));

    console.error(err);
    embed.setTitle("<:panicbasket:267397363956580352>ERROR<:panicbasket:267397363956580352>")
        .setDescription(`\`\`\`xl\n${clean(err)}\`\`\`\n`)
        .setFooter(`Runtime: ${(time / 1000).toFixed(3)}\u03bcs`, "https://cdn.discordapp.com/attachments/286943000159059968/298622278097305600/233782775726080012.png")
        .setColor(13379110);

    (client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))(`**INPUT:** \`${code}\``, {embed}).catch(console.error);
}

exports.run = (client, message, args) => {
    const code = args.join(" ");
    const tokenReg = new RegExp(`${client.token}|${client.token.split("").reverse().join("")}`.replace(/\./g, "\\."), "g");

    if (!code) return console.log("No code provided!");

    const start = process.hrtime();

    try {
        Promise.resolve(eval(code)).then(done => {
            const end = nano(process.hrtime(start));

            console.log(done);

            if (typeof done !== "string") done = inspect(done, {depth:0});

            embed.setTitle("OUTPUT")
                .setDescription((done.length < 900 ? `\`\`\`js\n${clean(done, tokenReg)}\`\`\`` : "```\nPromise return too long.\nLogged to console.\n```"))
                .setFooter(`Runtime: ${(end / 1000).toFixed(3)}\u03bcs`, "https://cdn.discordapp.com/attachments/286943000159059968/298622278097305600/233782775726080012.png")
                .setColor(24120);

            return (client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))(`**INPUT:** \`${code}\``, {embed});
        }).catch(err => {
            handleError(client, message, code, err, start);
        });
    } catch (err) {
        handleError(client, message, code, err, start);
    }
};

exports.name = "eval";
exports.type = "utility";
exports.description = "Evaluates code from a provided string.";
exports.use = [
    ["code", true]
];
exports.aliases = [
    "run"
];
exports.ownerOnly = true;
