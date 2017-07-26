const moment = require("moment");

let chalk, ctx;

try {
    chalk = require("chalk");
    ctx = new chalk.constructor({enabled:true});
} catch (err) {
    // silent
}

module.exports = {
    log(...args) {
        if (ctx) console.log(((new Date().getHours() % 12) + 1 < 10 ? " " : "") + moment().format("LTS"), "|", ctx.grey("[LOG]"), ...args);
        else console.log(((new Date().getHours() % 12) + 1 < 10 ? " " : "") + moment().format("LTS"), "|", ...args);
    },
    warn(...args) {
        if (ctx) console.error(((new Date().getHours() % 12) + 1 < 10 ? " " : "") + moment().format("LTS"), "|", ctx.yellow("[WARN]"), ...args);
        else console.error(((new Date().getHours() % 12) + 1 < 10 ? " " : "") + moment().format("LTS"), "|", ...args);
    },
    error(...args) {
        if (ctx) console.error(((new Date().getHours() % 12) + 1 < 10 ? " " : "") + moment().format("LTS"), "|", ctx.red("[ERROR]"), ...args);
        else console.error(((new Date().getHours() % 12) + 1 < 10 ? " " : "") + moment().format("LTS"), "|", ...args);
    }
};
