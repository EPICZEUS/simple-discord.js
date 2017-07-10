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
     * @property {ThrottlingOptions} throttling - Options for throttling usages for the command.
     */
     
     /**
  	  * @typedef {Object} ThrottlingOptions
 	  * @property {number} usages - Maximum number of usages of the command allowed in the specified duration.
 	  * @property {number} duration - Amount of time to count the usages of the command within (in seconds).
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
        this.throttling = options.throttling;

        this._validateCommand();
        
        /**
         * Holds throttlings.
         * @type {Map<string, Snowflake>}
         * @private
         */
        this._throttling = new Map();
    }
    
    /**
	 * Keeps track if the user needs to be throttled, if necessary.
	 * @param {string} user - ID of the user
	 * @returns {boolean}
	 */
    throttle(user) {
        if (this.client._owners.includes(user)) return;
        
        const throttling = (this._throttling.has(user) ? this._throttling.get(user) : {dateline:Date.now(), lastusage:0, usages:0});
        
        if (throttling.dateline + (this.throttling.duration * 1000) < Date.now()) {
            throttling.dateline = Date.now();
            throttling.lastusage = 0;
            throttling.usages = 0;
        }
        
        if ((throttling.lastusage > 0 && (throttling.lastusage - throttling.dateline) / 1000) <= this.throttling.duration && throttling.usages >= this.throttling.usages) return true;
        
        throttling.lastusage = Date.now();
        throttling.usages++;
        
        this._throttling.set(user, throttling);
        
        return false;
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
        if (this.throttling && (typeof this.throttling.usages !== 'number' || typeof this.throttling.duration !== 'number')) throw new Error('Simple-Discord - Command throttling contains invalid parameters.');
    }

    /**
     * The command to be run.
     * @function run
     * @abstract
     * @param {Message} message - The discord.js message object.
     * @param {Array<any>} args - The command arguments.
     */
    run(message, args) { // eslint-disable-line no-unused-vars
        throw new TypeError(`Simple-Discord - The command file ${this.name} does not have a run function.`);
    }
}

module.exports = Command;
