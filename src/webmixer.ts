const http = require("http");
const os = require("os");
const fs = require("fs");
const osc = require("node-osc");
const yargs = require("yargs");
const websocket = require('ws');
const path = require("path");

const argv = yargs
    .command(
        "webmixer",
        "Webmixer transfers local OSC messages and provide a websocket bound frontend"
    )
    .option("records", {
        alias: "r",
        description: "Specifies the path to the records",
        type: "string",
    })
    .option("ip", {
        alias: "i",
        description: "Specifies the ip address",
        type: "string",
    })
    .option("name", {
        alias: "n",
        description: "Specifies the device name",
        type: "string",
    })
    .option("port", {
        alias: "p",
        description: "Specifies the listen port",
        type: "number",
    })
    .help()
    .alias("help", "h").argv;

const homedir = argv.records || require("os").homedir();

const port = argv.port || 8080;

//oscClient2 = new osc.Client( 'localhost', 9872 );

/**
 * http services
 **/
const httpserver = http.createServer(function (req, res) {
    // check if file is in local directory:
    if (req.url.startsWith("/rec") && req.url.endsWith(".wav")) {
        // download from local directory:
        if (fs.existsSync("." + req.url)) {
            const data = fs.readFileSync("." + req.url);
            res.writeHead(200);
            res.end(data);
            return;
        }
        // check in home directory:
        if (fs.existsSync(homedir + req.url)) {
            const data = fs.readFileSync(homedir + req.url);
            res.writeHead(200);
            res.end(data);
            return;
        }
        return "404 Not found";
    }
    const hosjs = fs.readFileSync(path.join(__dirname, '../assets/ovclient.js'));
    const hoscss = fs.readFileSync(path.join(__dirname, "../assets/ovclient.css"));
    const jackrec = fs.readFileSync(path.join(__dirname, "../assets/jackrec.html"));
    const ipaddr = argv.ip || os.hostname();
    let devname = argv.name || os.hostname();
    try {
        devname = fs.readFileSync("devicename");
    } catch (ee) {
    }
    res.writeHead(200, {"Content-Type": "text/html"});
    res.write("<!DOCTYPE HTML>\n");
    res.write('<html lang="en"><head><title>Mixer</title><style>');
    res.write(hoscss);
    res.write("</style>\n</head><body>\n");
    res.write("<h1>" + devname + '</h1>\n<div id="mixer">mixer</div>\n');
    res.write("<script>\n");
    res.write('start("ws://' + ipaddr + ':' + port + '");\n');
    res.write(hosjs);
    res.write("</script>\n");
    res.write(jackrec);
    res.end("</body></html>");
});
console.log("Serving records at " + homedir);


/**
 * Websocket service
 **/
const wss = new websocket.Server({server: httpserver});

const oscServer = new osc.Server(9000, "0.0.0.0");
const oscClient = new osc.Client("localhost", 9871);

wss.on("connection", function (socket) {
    function emit(event, payload, ...additionalPayloads) {
        const msg = JSON.stringify({e: event, d: [payload ? payload : null, ...additionalPayloads]});
        socket.send(msg);
    }

    socket.on('message', function (m) {
        try {
            const {e, d} = JSON.parse(m) as {
                e: string;
                d: any[]
            }
            switch (e) {
                case "config": {
                    oscClient.send("/status", socket.id + " connected");
                    oscServer.on("message", async function (msg) {
                        if (msg[0] === "/touchosc/scene") {
                            emit("scene", "scene");
                        }
                        if (
                            msg[0].startsWith("/touchosc/label") &&
                            !msg[0].endsWith("/color") &&
                            msg[1].length > 1
                        ) {
                            emit("newfader", msg[0].substr(15), msg[1]);
                        }
                        if (msg[0].startsWith("/touchosc/fader") && !msg[0].endsWith("/color")) {
                            emit("updatefader", msg[0], msg[1]);
                        }
                        if (msg[0].startsWith("/touchosc/level")) {
                            emit("updatefader", msg[0], msg[1]);
                        }
                        if (msg[0] === "/jackrec/start") emit("jackrecstart", "");
                        if (msg[0] === "/jackrec/stop") emit("jackrecstop", "");
                        if (msg[0] === "/jackrec/portlist") emit("jackrecportlist", "");
                        if (msg[0] === "/jackrec/port") emit("jackrecaddport", msg[1]);
                        if (msg[0] === "/jackrec/filelist") emit("jackrecfilelist", "");
                        if (msg[0] === "/jackrec/file") emit("jackrecaddfile", msg[1]);
                        if (msg[0] === "/jackrec/rectime") emit("jackrectime", msg[1]);
                        if (msg[0] === "/jackrec/error") emit("jackrecerr", msg[1]);
                    });
                    oscClient.send("/touchosc/connect", 16);
                    oscClient.send("/jackrec/listports");
                    oscClient.send("/jackrec/listfiles");
                    break;
                }
                case "message": {
                    const obj = d[0];
                    oscClient.send(obj);
                    break;
                }
                case "msg": {
                    const obj = d[0];
                    if (obj.value) {
                        oscClient.send(obj.path, obj.value);
                    } else {
                        oscClient.send(obj.path);
                    }
                    break;
                }
            }
        } catch (e) {
            console.warn("Could not process message: '" + m + "' Reason: " + e);
        }
    });
});


httpserver.listen(port);
console.log("Listening on port " + port);
