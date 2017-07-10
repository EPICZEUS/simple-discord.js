const SimpleClient = require("./client.js");

class Command {
    /**
     * @typedef {Object} CommandOptions
     * @property {string} name - The command name.
     * @property {string} description - The command description.
     * @property {Array<Array<string, boolean>>} use - The command arguments.
     * @property {Array<string>} aliases - Aliases for the command.
     * @property {Array<string>} permissions - Permissions required to run the command.
     * @property {boolean} guildOnly - If the command can only be run in a guild.
     * @property {boolean} ownerOnly - If the command can only be run by a bot owner.
     */

    /**
     * @class
     * @classdesc A SimpleDiscord command.
     * @param {SimpleClient} client - The client object.
     * @param {CommandOptions} options - Options for the commands.
     */
    constructor(client, options) {
        this.client = client;
        this.name = options.name;
        this.type = options.type;
        this.description = options.description;
        this.use = options.use;
        this.aliases = options.aliases;
        this.permissions = options.permissions;
        this.guildOnly = !!options.guildOnly;
        this.ownerOnly = !!options.ownerOnly;

        this._validateCommand();
    }

    /**
     * Verifies the command configuration is valid.
     * @function _validateCommand
     * @private
     */
    _validateCommand() {
        if (!(this.client instanceof SimpleClient)) throw new TypeError("Simple-Discord - Command constructor parameter client must be the SimpleDiscord client.");

        if (!this.name) throw new Error("Simple-Discord - Command name is required.");
        if (!this.type) throw new Error("Simple-Discord - Command type is required.");
        if (!this.description) throw new Error("Simple-Discord - Command description is required.");
    }

    /**
     * The command to be run.
     * @function run
     * @abstract
     * @param {Message} message - The discord.js message object.
     * @param {Array<any>} args - The command arguments.
     */
    run(message, args) {} // eslint-disable-line no-unused-vars
}

module.exports = Command;
