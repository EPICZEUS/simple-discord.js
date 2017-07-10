const path = require("path");

module.exports = {
    Client: require(path.join(__dirname, "src", "client")),
    Command: require(path.join(__dirname, "src", "command"))
};
