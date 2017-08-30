const {Client, Collection, Permissions} = require("discord.js");
const {inspect, promisify} = require("util");
const fs = require("fs");
const path = require("path");
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const util = require("./utils.js");

class SimpleClient extends Client {
    /**
     * @typedef {Object} SimpleClientOptions
     * @property {string} configDir - The optional directory of a config file.
     * @property {string} token - The token used for logging in.
     * @property {Array<string>} owners - The ID of the bot owners.
     * @property {string} prefix - The command prefix for the bot.
     * @property {string} suffix - The command suffix for the bot.
     * @property {string} game - The game to set on starting the bot.
     * @property {string} commandsDir - The relative path to the commands directory.
     * @property {boolean} basUseResponse - If the bot should display how to use an improperly called command.
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

        this._loadConfig(options);

        /**
         * General utilities.
         * @member {Object}
         * @public
         */
        this.utils = util;

        this._validateConfig();

        this.once('ready', () => {
            this.utils.log(`Logged in as ${this.user.tag}!`);
            this.utils.log(`Ready to serve in ${this.guilds.size} guild${this.guilds.size === 1 ? "" : "s"}!`);

            if (!this.user.bot) {
                this.utils.log("Selfbot detected.");
                this._owners = [this.user.id];
            }

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
        readdir(path.join(__dirname, "commands")).then(files => {
            for (const file of files) {
                const Command = require(path.join(__dirname, "commands", file));
                const cmd = new Command(this);

                this.commands.set(cmd.name, cmd);

                if (cmd.aliases) for (const alias of cmd.aliases) this.aliases.set(alias, cmd.name);

                if (this._debug) this.utils.log(`Loaded ${cmd.name}!`);

                delete require.cache[require.resolve(path.join(__dirname, "commands", file))];
            }
        }).catch(this.utils.error);

        return this;
    }

    /**
     * Loads the commands from the provided commands directory.
     * @method loadCommands
     * @returns {SimpleClient}
     */
    loadCommands() {
        const dir = path.join(process.cwd(), this._commandsDir);

        readdir(dir).then(files => {
            for (const file of files) {
                const Command = require(path.join(dir, file));
                const cmd = new Command(this);

                this.commands.set(cmd.name, cmd);

                if (cmd.aliases) {
                    for (const alias of cmd.aliases) {
                        if (this.aliases.has(alias)) {
                            this.utils.error(`Command ${cmd.name} has duplicate alias ${alias}!`);
                            continue;
                        }
                        this.aliases.set(alias, cmd.name);
                    }
                }
                if (this._debug) this.utils.log(`Loaded ${cmd.name}!`);

                delete require.cache[require.resolve(path.join(dir, file))];
            }
        }).then(() => this.utils.log(`Loaded ${this.commands.size} commands.`)).catch(this.utils.error);

        return this;
    }

    /**
     * Logs the client into Discord.
     * @method login
     * @override
     * @returns {Promise<string>}
     */
    login() {
        return super.login(this.token).catch(err => {
            this.utils.error(err);
            this.utils.error("There was an error on login.");
            this.utils.error("Please validate your token.");
            process.exit(1);
        });
    }

    /**
     * @private
     * @returns {string}
     */
    [inspect.custom](depth) {
        const user = this.user ? `${this.user.tag} (ID: ${this.user.id})` : null;

        return depth > 0 ? `SimpleClient {
  User: ${user},
  Guilds: { ${this.guilds.size} },
  Channels: { ${this.channels.size} },
  Users: { ${this.users.size} },
  Commands: { ${this.commands.size} }
}` : "[Object]";
    }

    /**
     * Internal message handler for both MESSAGE_CREATE and MESSAGE_UPDATE
     * @method _processMessage
     * @private
     */
    async _processMessage(...params) {
        if (params.length === 2 && params[0].content === params[1].content) return;

        const message = params[params.length - 1];

        if ((!this.user.bot && message.author.id !== this.user.id) || message.author.bot) return;

        let command, content;

        if (this.prefix) {
            if (!message.content.startsWith(this.prefix)) return;

            [command = "", ...content] = message.content.substring(this.prefix.length).split(/ +/);
        } else if (this.suffix) {
            if (!message.content.endsWith(this.suffix)) return;

            content = message.content.split(/ +/);
            command = content.pop().substr(0, -this.suffix.length);
        }
        command = command.toLowerCase();

        const cmd = this.commands.get(command) || this.commands.get(this.aliases.get(command));

        if (!cmd) return;
        else if ((cmd.guildOnly || cmd.permissions) && !message.guild) return;
        else if (cmd.ownerOnly && !this._owners.includes(message.author.id)) return;

        if (cmd.permissions) {
            const perms = cmd.permissions.filter(perm => Object.keys(Permissions.FLAGS).includes(perm));
            let missing;

            if (this.user.bot) {
                missing = perms.filter(perm => !message.member.hasPermission(perm));

                if (missing.length) return message.channel.send(`To run this command, you need the following permissions: \`\`\`\n${missing.join(", ")}\n\`\`\``);
            }
            missing = perms.filter(perm => !message.guild.me.hasPermission(perm));

            if (missing.length) return message.channel.send(`To run this command, I need the following permissions: \`\`\`\n${missing.join(", ")}\n\`\`\``);
        }

        if (cmd.throttle(message.author.id)) return message.channel.send(`To run this command, you need to cool down, you're going too fast.`);

        const args = await this.utils.parseArgs(message, content, cmd.use);

        if (Array.isArray(args)) {
            const use = cmd.use.map(a => a.required ? `<${a.name}>` : `[${a.name}]`);

            if (this._badUseResponse) message.reply(`Improperly ordered or missing args! Proper use: \`\`\`\n${this.prefix ? `${this.prefix}${cmd.name} ` : ""}${use.join(" ")}${this.suffix ? ` ${cmd.name}${this.suffix}` : ""}\n\`\`\``);

            return;
        }

        try {
            await cmd.run(message, args);
        } catch (err) {
            this.utils.error(err);
            message.channel.send(`There was an error running the ${cmd.name} command. \`\`\`xl\n${err}\`\`\``);
        }
    }

    /**
     * Loads configuration data.
     * @method _loadConfig
     * @param {SimpleClientOptions} options - The options for the client.
     * @private
     */
    async _loadConfig(options) {
        let data;

        if (options.configDir) {
            const dir = path.isAbsolute(options.configDir) ? options.configDir : path.join(process.cwd(), options.configDir);

            if (!fs.existsSync(dir)) throw new Error(`Simple-Discord - No config found at ${dir}. Is this path correct?`);

            const {ext} = path.parse(dir);

            if (!ext || ext !== ".json") throw new TypeError("Simple-Discord - Config file extention type is expected to be json.");

            data = JSON.parse(await readFile(dir));
        } else {
            data = options;
        }

        this.token = data.token;

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
        this.suffix = !this.prefix && data.suffix ? data.suffix : null;

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
         * Boolean representation if the bot should display how to use a command when one is called improperly.
         * @member {boolean}
         * @private
         */
        this._badUseResponse = !!options.badUseResponse;

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
    }

    /**
     * Validates the provided configuration options.
     * @method _validateConfig
     * @throws {Error|TypeError|RangeError}
     * @private
     */
    _validateConfig() {
        if (!this.token) throw new Error("Simple-Discord - Please provide a login token.");

        if (typeof this.token !== "string") throw new TypeError("Simple-Discord - Your token must be a string.");

        if (!this.prefix && !this.suffix) throw new Error("Simple-Discord - A prefix or a suffix is required.");

        if (this.prefix && typeof this.prefix !== "string") throw new TypeError("Simple-Discord - Your prefix must be a string.");
        if (this.suffix && typeof this.suffix !== "string") throw new TypeError("Simple-Discord - Your suffix must be a string.");

        if (this._game && typeof this._game !== "string") throw new TypeError("Simple-Discord - The start game must be a string if one is desired.");

        if (!Array.isArray(this._owners)) throw new TypeError("Simple-Discord - options.owners must be an array.");

        if (this._owners.length < 1) throw new RangeError("Simple-Discord - You must specify at least one owner ID.");

        if (!this._commandsDir) throw new Error("Simple-Discord - A commands directory is required.");

        if (typeof this._commandsDir !== "string") throw new TypeError("Simple-Discord - The command directory must be a string.");

        if (path.isAbsolute(this._commandsDir)) throw new Error(`Simple-Discord - ${this._commandsDir} is an absolute path. Please provide a relative path.\n\nFor example, a relative path from ${path.join("C:", "samples")} to ${path.join("C:", "samples", "text.txt")} would be ${[".", "text.txt"].join(path.sep)}`);
    }
}

module.exports = SimpleClient;
