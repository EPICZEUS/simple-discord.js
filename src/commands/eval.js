const Discord = require("discord.js");
const Command = require("../command.js");
const {inspect} = require("util");
const {post} = require("snekfetch");

class Eval extends Command {
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

        this.endings = ["ns", "\u03bcs", "ms", "s"];
        this.default = true;
    }

    clean(str) {
        const reg = new RegExp(`${this.client.token}|${this.client.token.split("").reverse().join("")}`, "g");

        return typeof str === "string" ? str.replace(/[`@]/g, "$&\u200b").replace(reg, "[SECRET]") : str;
    }

    async run(message, args) {
        const client = this.client, embed = new Discord.RichEmbed();
        const code = args.join(" ");

        client.utils.log(code);

        const start = process.hrtime();

        try {
            let done = await eval(code);
            const hrDiff = process.hrtime(start);
            let end = (hrDiff[0] > 0 ? (hrDiff[0] * 1000000000) : 0) + hrDiff[1];

            let ending = this.endings[0], i = 0;
            
            while (this.endings[++i] && end > 1000) {
                end /= 1000;
                ending = this.endings[i];
            }

            client.utils.log(done);

            if (typeof done !== "string") done = inspect(done, {depth:1});

            let suffix;

            if (done.length > 1800 && done.length < 400000) {
                message = await (client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))("Uploading to hastebin, this may take a moment...");

                suffix = `[Upload success!](${"https://hastebin.com/" + (await post("https://hastebin.com/documents").send(this.clean(done))).body.key + ".js"})`;
            } else if (done.length <= 1800) {
                suffix = `\`\`\`js\n${this.clean(done)}\n\`\`\``;
            } else {
                suffix = `\`\`\`xl\n${new RangeError("Result length too long. Logged in console.")}\n\`\`\``;
            }

            embed.setDescription(`**INPUT:** \`\`\`js\n${code}\n\`\`\`\n**OUTPUT:** ${suffix}`)
                .setFooter(`Runtime: ${end.toFixed(3)}${ending}`, "https://cdn.discordapp.com/attachments/286943000159059968/298622278097305600/233782775726080012.png")
                .setColor(24120);

            return (client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))({embed});
        } catch (err) {
            const hrDiff = process.hrtime(start);
            let end = (hrDiff[0] > 0 ? (hrDiff[0] * 1000000000) : 0) + hrDiff[1];

            let ending = this.endings[0], i = 0;

            while (this.endings[++i] && end > 1000) {
                end /= 1000;
                ending = this.endings[i];
            }
            client.utils.error(err);
            embed.setDescription(`**INPUT:** \`\`\`js\n${code}\n\`\`\`\n<:panicbasket:267397363956580352>**ERROR**<:panicbasket:267397363956580352>\n\`\`\`xl\n${this.clean(err)}\n\`\`\`\n`)
                .setFooter(`Runtime: ${end.toFixed(3)}${ending}`, "https://cdn.discordapp.com/attachments/286943000159059968/298622278097305600/233782775726080012.png")
                .setColor(13379110);

            return (client._selfbot ? message.edit.bind(message) : message.channel.send.bind(message.channel))({embed});
        }
    }
}

module.exports = Eval;
