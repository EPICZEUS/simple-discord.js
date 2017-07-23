const Discord = require("discord.js");
const Command = require("../command.js");
const {inspect} = require("util");

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

        this.endings = ["\u03bcs", "ms", "s"];
        this.default = true;
    }

    async run(message, args) {
        const client = this.client, embed = new Discord.RichEmbed();
        const code = args.join(" ");
        const tokenReg = new RegExp(`${this.client.token}|${this.client.token.split("").reverse().join("")}`.replace(/\./g, "\\."), "g");

        if (!code) return console.log("No code provided!");

        console.log(code);

        const start = process.hrtime();

        try {
            let done = await eval(code);
            const hrDiff = process.hrtime(start);
            let end = (hrDiff[0] > 0 ? (hrDiff[0] * 1000000000) : 0) + hrDiff[1];

            let ending  = this.endings[0], i = 0;
            
            while (this.endings[i] && end > 1000) {
                end /= 1000;
                ending = this.endings[i++];
            }

            console.log(done);

            if (typeof done !== "string") done = inspect(done, {depth:0});

            embed.setDescription(`**INPUT:**\`${code}\`\n**OUTPUT:**` + (done.length < 900 ? `\`\`\`js\n${clean(done, tokenReg)}\`\`\`` : "```\nPromise return too long.\nLogged to console.\n```"))
                .setFooter(`Runtime: ${end.toFixed(3)}${ending}`, "https://cdn.discordapp.com/attachments/286943000159059968/298622278097305600/233782775726080012.png")
                .setColor(24120);

            return (client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))({embed});
        } catch (err) {
            const hrDiff = process.hrtime(start);
            let end = (hrDiff[0] > 0 ? (hrDiff[0] * 1000000000) : 0) + hrDiff[1];

            let ending = this.endings[0], i = 0;

            while (this.endings[i] && end > 1000) {
                end /= 1000;
                ending = this.endings[++i];
            }
            console.error(err);
            embed.setDescription(`**INPUT:** \`${code}\`\n<:panicbasket:267397363956580352>**ERROR**<:panicbasket:267397363956580352>\n\`\`\`xl\n${clean(err)}\`\`\`\n`)
                .setFooter(`Runtime: ${end.toFixed(3)}${ending}`, "https://cdn.discordapp.com/attachments/286943000159059968/298622278097305600/233782775726080012.png")
                .setColor(13379110);

            (client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))({embed}).catch(console.error);
        }
    }
}

module.exports = EvalCommand;
