const {Client, Collection, Permissions} = require("discord.js");
const path = require("path");
const fs   = require("fs");

let _token;

function validatePermissions(perm) {
    return Object.keys(Permissions.FLAGS).includes(perm);
}

class SimpleClient extends Client {
    /**
     * @typedef {Object} SimpleClientOptions
     * @property {string} configDir - The optional directory of a config file.
     * @property {string} token - The token used for logging in.
     * @property {Array<string>} owners - The ID of the bot owners.
     * @property {string} prefix - The command prefix for the bot.
     * @property {string} suffix - The command suffix for the bot.
     * @property {boolean} selfbot - If the bot is a selfbot.
     * @property {string} game - The game to set on starting the bot.
     * @property {string} commandsDir - The relative path to the commands directory.
     * @property {boolean} debug - Whether to enable additional logging.
     */

    /**
     * @class SimpleClient
     * @classdesc The SimpleDiscord client.
     * @extends Client
     * @param {SimpleClientOptions} options - The client options.
     */
    constructor(options = {}) {
        super(options);

        let data;

        if (options.configDir) {
            const dir = path.isAbsolute(options.configDir) ? options.configDir : path.join(process.cwd(), options.configDir);

            if (!fs.existsSync(dir)) throw new Error(`Simple-Discord - No config found at ${dir}. Is this path correct?`);

            const {ext} = path.parse(dir);

            if (ext && ext !== ".json") throw new TypeError("Simple-Discord - Config file extention type is expected to be json.");

            data = JSON.parse(fs.readFileSync(dir));
        } else {
            data = options;
        }

        _token = data.token;

        /**
         * The commands for the bot.
         * @type {Collection<string, Command>}
         * @public
         */
        this.commands = new Collection();

        /**
         * The command aliases.
         * @type {Collection<string, string>}
         * @public
         */
        this.aliases = new Collection();

        /**
         * The command prefix.
         * @member {string}
         * @public
         */
        this.prefix = data.prefix || null;
        
        /**
         * The command suffix.
         * @member {string}
         * @public
         */
        this.suffix = !this._prefix && data.suffix ? data.suffix : null;

        /**
         * Boolean respresentation of if this bot is a selfbot.
         * @member {boolean}
         * @private
         */
        this._selfbot = !!data.selfbot;

        /**
         * The game to be set on ready.
         * @member {string}
         * @private
         */
        this._game = data.game || null;

        /**
         * An array of owner ids for the bot.
         * @member {Array<string>}
         * @private
         */
        this._owners = data.owners;

        /**
         * Boolean representation of if there should be extra logging.
         * @member {boolean}
         * @private
         */
        this._debug = !!data.debug;

        /**
         * The directory for bot commands
         * @member {string}
         * @private
         */
        this._commandsDir = data.commandsDir || null;

        this._validateConfig();

        this.once('ready', () => {
            console.log(`Logged in as ${this.user.tag}!\nReady to serve in ${this.guilds.size} guild${this.guilds.size === 1 ? "" : "s"}!`);

            this.user.setGame(this._game);
        });

        this.on('message', this._processMessage);
        this.on('messageUpdate', this._processMessage);
    }

    /**
     * Loads the included commands from src/commands
     * @method loadDefaults
     * @returns {SimpleClient}
     */
    loadDefaults() {
        fs.readdir(path.join(__dirname, "commands"), (err, files) => {
            if (err) return console.error(err);

            for (const file of files) {
                const Command = require(path.join(__dirname, "commands", file));
                const cmd = new Command(this);

                this.commands.set(cmd.name, cmd);

                if (cmd.aliases) for (const alias of cmd.aliases) this.aliases.set(alias, cmd.name);

                if (this._debug) console.log(`Loaded ${cmd.name}!`);

                delete require.cache[require.resolve(path.join(__dirname, "commands", file))];
            }
        });

        return this;
    }

    /**
     * Loads the commands from the provided commands directory.
     * @method loadCommands
     * @returns {SimpleClient}
     */
    loadCommands() {
        const dir = path.join(process.cwd(), this._commandsDir);

        fs.readdir(dir, (err, files) => {
            if (err) return console.error(err);

            for (const file of files) {
                const Command = require(path.join(dir, file));
                const cmd = new Command(this);

                this.commands.set(cmd.name, cmd);

                if (cmd.aliases) {
                    for (const alias of cmd.aliases) {
                        if (this.aliases.has(alias)) {
                            console.error(`Command ${cmd.name} has duplicate alias ${alias}!`);
                            continue;
                        }
                        this.aliases.set(alias, cmd.name);
                    }
                }
                if (this._debug) console.log(`Loaded ${cmd.name}!`);

                delete require.cache[require.resolve(path.join(dir, file))];
            }
            console.log(`Loaded ${this.commands.size} commands.`);
        });

        return this;
    }

    /**
     * Logs the client into Discord.
     * @method login
     * @override
     * @returns {Promise<string>}
     */
    login() {
        return super.login(_token).catch(err => {
            console.error(err, "\nThere was an error on login.", "\nPlease validate your token.");
            process.exit(1);
        });
    }

    /**
     * Internal message handler for both MESSAGE_CREATE and MESSAGE_UPDATE
     * @method _processMessage
     * @private
     */
    async _processMessage(...params) {
        if (params.length === 2 && params[0].content === params[1].content) return;

        const message = params[params.length - 1];

        if ((this._selfbot && message.author.id !== this.user.id) || message.author.bot) return;

        let command, args;

        if (this.prefix) {
            if (!message.content.startsWith(this.prefix)) return;

            [command = "", ...args] = message.content.slice(this.prefix.length).split(/ +/);
        } else if (this.suffix) {
            if (!message.content.endsWith(this.suffix)) return;

            args = message.content.split(/ +/);
            command = args.pop().slice(0, -this.suffix.length);
        }
        command = command.toLowerCase();

        const cmdFile = this.commands.get(command) || this.commands.get(this.aliases.get(command));

        if (!cmdFile) return;

        if (cmdFile.guildOnly && message.channel.type !== "text") return;

        if (cmdFile.ownerOnly && !this._owners.includes(message.author.id)) return;

        if (cmdFile.permissions) {
            if (!message.guild) return;

            const perms = cmdFile.permissions.list.filter(validatePermissions);
            let missing = [];

            if (!this._selfbot) {
                for (const perm of perms) if (!message.member.hasPermission(perm)) missing.push(perm);

                if (missing.length) return message.channel.send(`To run this command, you need the following permissions: \`\`\`\n${missing.join(", ")}\n\`\`\``);
            }
            missing = [];

            for (const perm of perms) if (!message.guild.me.hasPermission(perm)) missing.push(perm);

            if (missing.length) return message.channel.send(`To run this command, I need the following permissions: \`\`\`\n${missing.join(", ")}\n\`\`\``);
        }

        if (cmdFile.throttle(message.author.id)) return message.channel.send(`To run this command, you need to cool down, you're going too fast.`);

        const minArgCount = cmdFile.use ? cmdFile.use.filter(a => a[1]).length : 0;

        if (args.length < minArgCount) message.channel.send(`The command ${cmdFile.name} has a minimum argument count of ${minArgCount}. Please provide proper arguments.`);

        try {
            await cmdFile.run(message, args);
        } catch (err) {
            console.error(err);
            message.channel.send(`There was an error running the ${cmdFile.name} command. \`\`\`xl\n${err}\`\`\`This shouldn't happen.`);
        }
    }

    /**
     * Validates the provided configuration options.
     * @method _validateConfig
     * @private
     */
    _validateConfig() {
        if (!_token) throw new Error("Simple-Discord - Please provide a login token.");

        if (typeof _token !== "string") throw new TypeError("Simple-Discord - Your token must be a string.");

        if (!this.prefix && !this.suffix) throw new Error("Simple-Discord - A prefix or a suffix is required.");

        if (this.prefix && typeof this.prefix !== "string") throw new TypeError("Simple-Discord - Your prefix must be a string.");
        else if (typeof this.suffix !== "string") throw new TypeError("Simple-Discord - Your suffix must be a string.");

        if (this._game && typeof this._game !== "string") throw new TypeError("Simple-Discord - The start game must be a string if one is desired.");

        if (!Array.isArray(this._owners)) throw new TypeError("Simple-Discord - options.owners must be an array.");

        if (this._owners.length < 1) throw new RangeError("Simple-Discord - You must specify at least one owner ID.");

        if (this._selfbot && this._owners.length > 1) throw new RangeError("Simple-Discord - A selfbot can only have one owner.");

        if (!this._commandsDir) throw new Error("Simple-Discord - A commands directory is required.");

        if (typeof this._commandsDir !== "string") throw new TypeError("Simple-Discord - The command directory must be a string.");

        if (path.isAbsolute(this._commandsDir)) throw new Error(`Simple-Discord - ${this._commandsDir} is an absolute path. Please provide a relative path.\n\nFor example, a relative path from ${path.join("C:", "samples")} to ${path.join("C:", "samples", "text.txt")} would be ${[".", "text.txt"].join(path.sep)}`);
    }
}

module.exports = SimpleClient;
