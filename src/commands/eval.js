const Discord = require("discord.js");
const Command = require("../command.js");
const {inspect} = require("util");

const embed = new Discord.RichEmbed();

function clean(str, reg) {
    return typeof str === "string" ? str.replace(/[`@]/g, "$&\u200b").replace(reg, "[SECRET]") : str;
}

class EvalCommand extends Command {
    constructor(client) {
        super(client, {
            name: "eval",
            type: "utility",
            description: "Evaluates code from a provided string.",
            use: [
                ["code", true]
            ],
            aliases: [
                "run"
            ],
            ownerOnly: true
        });

        this.default = true;
    }

    async run(message, args) {
        const client = this.client;
        const code = args.join(" ");
        const tokenReg = new RegExp(`${client.token}|${client.token.split("").reverse().join("")}`.replace(/\./g, "\\."), "g");

        if (!code) return console.log("No code provided!");

        console.log(code);

        const start = process.hrtime();

        try {
            let done = await eval(code);
            const hrDiff = process.hrtime(start);
            const end = (hrDiff[0] > 0 ? (hrDiff[0] * 1000000000) : 0) + hrDiff[1];

            console.log(done);

            if (typeof done !== "string") done = inspect(done, {depth:0});

            embed.setTitle("OUTPUT")
                .setDescription((done.length < 900 ? `\`\`\`js\n${clean(done, tokenReg)}\`\`\`` : "```\nPromise return too long.\nLogged to console.\n```"))
                .setFooter(`Runtime: ${(end / 1000).toFixed(3)}\u03bcs`, "https://cdn.discordapp.com/attachments/286943000159059968/298622278097305600/233782775726080012.png")
                .setColor(24120);

            return (client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))(`**INPUT:** \`${code}\``, {embed});
        } catch (err) {
            const hrDiff = process.hrtime(start);
            const end = (hrDiff[0] > 0 ? (hrDiff[0] * 1000000000) : 0) + hrDiff[1];

            console.error(err);
            embed.setTitle("<:panicbasket:267397363956580352>ERROR<:panicbasket:267397363956580352>")
                .setDescription(`\`\`\`xl\n${clean(err)}\`\`\`\n`)
                .setFooter(`Runtime: ${(end / 1000).toFixed(3)}\u03bcs`, "https://cdn.discordapp.com/attachments/286943000159059968/298622278097305600/233782775726080012.png")
                .setColor(13379110);

            (client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))(`**INPUT:** \`${code}\``, {embed}).catch(console.error);
        }
    }
}

module.exports = EvalCommand;
