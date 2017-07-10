exports.run = () => {
    console.log("Bot shutting down.");
    process.exit();
};

exports.name = "restart";
exports.type = "utility";
exports.description = "Exits the process gracefully and lets pm2 turn it back on.";
exports.ownerOnly = true;
exports.default = true;
