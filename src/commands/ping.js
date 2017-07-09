exports.run = (client, message) => {
    message.channel.send("Pinging...").then(msg => {
        return msg.edit("Calculated Ping```\n" +
            "Websocket:       " + Math.round(client.ping) + "ms\n" +
            "Response Time:   " + (msg.createdTimestamp - message.createdTimestamp) + "ms\n```"
        );
    }).catch(console.error);
};

exports.name = "ping";
exports.type = "utility";
exports.description = "Displays the overall ping.";
