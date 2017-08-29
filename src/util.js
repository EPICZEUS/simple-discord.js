const moment = require("moment");
const idReg = /(?:[@#][!&]?)?(\d{17,20})>?/;

let ctx;

try {
    const chalk = require("chalk");

    ctx = new chalk.constructor({enabled:true, level:2});
} catch (err) {
    // silent
}

function getTime() {
    return (" " + moment().format("LTS")).slice(-11);
}

class Util {
    static async log(...args) {
        if (ctx) console.log(getTime(), "|", ctx.grey("[LOG]"), ...args);
        else console.log(getTime(), "|", ...args);
    }
    
    static async warn(...args) {
        if (ctx) console.error(getTime(), "|", ctx.yellow("[WARN]"), ...args);
        else console.error(getTime(), "|", ...args);
    }

    static async error(...args) {
        if (ctx) console.error(getTime(), "|", ctx.red("[ERROR]"), ...args);
        else console.error(getTime(), "|", ...args);
    }

    static async parseArgs(message, cleanContent, use) {
        if (!use) return null;

        const args = {}, required = use.filter(a => a.required).map(a => a.name);
        let last = 0;

        for (let i = 0; i < use.length; i++) {
            const options = use[i];

            args[options.name] = null;

            if (options.type === "member") {
                const [, id] = idReg.exec(cleanContent[i]) || [];

                if (id) args[options.name] = message.guild.member(id) || await message.guild.fetchMember(id);
            } else if (options.type === "user") {
                const [, id] = idReg.exec(cleanContent[i]) || [];

                if (id) args[options.name] = message.client.users.get(id);
            } else if (options.type === "channel") {
                const [, id] = idReg.exec(cleanContent[i]) || [];

                if (id) args[options.name] = message.client.channels.get(id);
            } else if (options.type === "number") {
                args[options.name] = Number(cleanContent[i]);
            } else if (options.type === "string") {
                args[options.name] = options.single ? cleanContent[i] : cleanContent.slice(last).join(" ");
            }

            if (!args[options.name] && options.default) args[options.name] = options.default;

            if (args[options.name] && (args[options.name] !== options.default || (options.type === "number" && !isNaN(args[options.name])))) ++last;
        }

        if (!required.every(a => args[a] !== null)) return required;

        return args;
    }
}

module.exports = Util;
