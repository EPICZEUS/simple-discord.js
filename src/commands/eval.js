const Discord = require("discord.js");
const Command = require("../command.js");
const moment = require("moment");
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

        return typeof str === "string" ? str.replace(/[`@]/g, "$&\u200b").replace(reg, "[SECRET]").replace(new RegExp(process.cwd().replace(/[.\\]/g, "\\$&"), "g"), ".") : str;
    }

    async run(message, args) {
        const client = this.client, embed = new Discord.RichEmbed();
        const code = args.join(" ");

        client.utils.log(code);

        let evaled, suffix;
        const start = process.hrtime();

        try {
            evaled = await eval(code);
            embed.setColor(24120);
            suffix = "**OUTPUT**: ";
        } catch (err) {
            evaled = err;
            embed.setColor(13379110);
            suffix = "**ERROR**: ";
        }
        const hrDiff = process.hrtime(start);
        let end = (hrDiff[0] * 1000000000) + hrDiff[1];

        let ending = this.endings[0], i = 0;
        
        while (this.endings[++i] && end > 1000) {
            end /= 1000;
            ending = this.endings[i];
        }

        client.utils[~suffix.indexOf("ERROR") ? "error" : "log"](evaled);

        if (typeof evaled !== "string") evaled = evaled instanceof Error ? evaled : inspect(evaled);

        if (evaled.length > 1800) {
            message = await (!client.user.bot ? message.edit.bind(message) : message.channel.send.bind(message.channel))("Uploading to gist, this may take a moment...");
            let id;
            
            try {
                ({id} = await post("https://api.github.com/gists").send({
                    public: true,
                    files: {
                        [`output_${message.author.id}_${moment().format("YYYY_MM_DD")}.js`]: {content:evaled}
                    }
                }).then(res => JSON.parse(res.text)));
            } catch (err) {
                client.utils.error(err);
            }
            suffix += id ? `[Gist created](https://gist.github.com/${id})` : "Failed to generate gist.";
        } else {
            suffix += `\`\`\`${~suffix.indexOf("ERROR") ? "xl" : "js"}\n${this.clean(evaled)}\n\`\`\``;
        }

        embed.setDescription(`**INPUT:** \`\`\`js\n${code}\n\`\`\`\n${suffix}`)
            .setFooter(`Runtime: ${end.toFixed(3)}${ending}`, "https://cdn.discordapp.com/attachments/286943000159059968/298622278097305600/233782775726080012.png");

        return (!client.user.bot ? message.edit.bind(message) : message.channel.send.bind(message.channel))({embed});
    }
}

module.exports = Eval;
