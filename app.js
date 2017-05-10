var COLOR_PRICE	= 3000;

var fs			= require('fs')
  , options		= {key: fs.readFileSync('./ssl/ssl.key'), cert: fs.readFileSync('./ssl/ssl.crt'), ca: fs.readFileSync('./ssl/sub.class1.server.ca.pem')}
  , express		= require('express')
  , app			= express()
  , https 		= require('https').createServer(options, app)
  , http		= require('http').createServer(app).listen(80)
  , io			= require('socket.io').listen(https)
  , toobusy		= require('toobusy')
  , morgan		= require('morgan')
  , crypto		= require('crypto')
  , coinstring	= require('coinstring')
  , sfs			= require('spamcheck')
  , bcrypt		= require('bcrypt')
  , BlockIo		= require('block_io')
  , wallet		= new BlockIo('a37a-c4ba-aaf5-f9d1')
  , pin			= "xxxxxxxxxx"
  , sockets		= {}
  , online		= []
  , rooms		= require('./data.json')
  , blocked		= []
  , mutes		= {}
  , lastMessage = {}
  , tipNext		= false
  , mysql		= require("mysql")
  , pool		= mysql.createPool({
		host		: "localhost",
		user		: "root",
		password	: "xxxxxxxxx",
		database	: "shibechat"
    })
  , earnings	= [
		1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10,
		11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 25, 30, 40, 50, 100
	];


app.all('*', function(req, res, next) {
	if(req.secure) {
		return next();
	}
	res.redirect('https://'+req.host+req.url);
});

app.use(morgan('combined'));
app.use(function(req, res, next) {
	if (toobusy()) res.send(503, "Server is overloaded.");
	else next();
});
app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/static', express.static(__dirname + '/client'));
https.listen(443, function(){
  log('Listening on *:443');
});


io.sockets.on('connection', function (socket) {
	if (blocked.indexOf(socket.request.connection.remoteAddress) != -1 || typeof socket.request.connection.remoteAddress == "undefined" || socket.request.connection.remoteAddress == "") {
		log("Blocked connection: " + socket.request.connection.remoteAddress);
		return;
	}
	wallet.get_current_price({}, function(a, data) {
		if (typeof data !== 'undefined') socket.emit('price', data.data.prices);
	});
	socket.on('disconnect', function() {
		if (typeof socket.user != "undefined") {
			delete sockets[socket.user.name];
			if (online.indexOf(socket.user.name) != -1) {
				online.splice(online.indexOf(socket.user.name), 1);
				io.emit('online', online);
			}
			for (var i = 0; i < socket.user.rooms.length; i++) {
				if (typeof rooms[socket.user.rooms[i]] != "undefined") {
					rooms[socket.user.rooms[i]].users.splice(rooms[socket.user.rooms[i]].users.indexOf(socket.user.name), 0);
				}
			}
		}
	});
	socket.on('chat', function (data) {
		if (testValues([socket.user, data.room, data.msg, data.color])) {
			return;
		}
		if (typeof rooms[data.room] != "undefined" || data.room.indexOf(":") != -1) {
			if (data.room.indexOf(":") == -1) {
				if (rooms[data.room].kicks.indexOf(socket.user.name) != -1) {
					return;
				}
			}
			if (new Date() - lastMessage[socket.user.name] < 500 && socket.user.level < 1) {
				var time = new Date();
				time.setTime(time.getTime() + 30000);
				mutes[socket.user.name] = time;
				return;
			}
			lastMessage[socket.user.name] = new Date();
			data.msg = data.msg.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/'/g, "&#039;");
			if (data.msg.length > 1 && !(mutes[socket.user.name] > new Date())) {
				if (data.msg.substr(0, 6).toLowerCase() == "/topic" && (socket.user.level >= 2 || rooms[data.room].ops.indexOf(socket.user.name) != -1)) {
					rooms[data.room].topic = data.msg.substr(7);
					sendChat(socket, data.room, rooms[data.room].topic, 0, "*Topic");
				} else if (data.msg.substr(0, 5).toLowerCase() == "/kick" && (socket.user.level >= 2 || rooms[data.room].ops.indexOf(data.user.toLowerCase()) != -1)) {
					var user = data.msg.split(" ")[1].toLowerCase();
					if (rooms[data.room].kicks.indexOf(user) == -1) rooms[data.room].kicks.push(user);
					if (rooms[data.room].users.indexOf(user) != -1) rooms[data.room].users.splice(rooms[data.room].users.indexOf(user), 1);
					if (typeof sockets[user] != "undefined") {
						sockets[user].emit("kick", data.room);
						sockets[user].emit("msg", {type: "danger", message: "You have been kicked from #" + data.room + "."});
					}
				} else if (data.msg.substr(0, 7).toLowerCase() == "/unkick" && (socket.user.level >= 2 || rooms[data.room].ops.indexOf(data.user.toLowerCase()) != -1)) {
					var user = data.msg.split(" ")[1].toLowerCase();
					if (rooms[data.room].kicks.indexOf(user) != -1) rooms[data.room].kicks.splice(rooms[data.room].kicks.indexOf(user), 1);
				} else if (data.msg.substr(0, 5).toLowerCase() == "/dump" && socket.user.level >= 3) {
					socket.emit('chat', {msg: JSON.stringify(rooms[data.room], null, "\t"), user: "*System", timestamp: new Date().toISOString(), room: data.room});
				} else if (data.msg.substr(0, 7).toLowerCase() == "/online") {
					socket.emit('chat', {msg: online.slice(0, -1).join(", ") + " and " + online[online.length - 1], user: "*System", timestamp: new Date().toISOString(), room: data.room});
				} else if (data.msg.substr(0, 4).toLowerCase() == "/ops" || data.msg.substr(0, 5).toLowerCase() == "/list") {
					socket.emit("chat", {room: data.room, user: "*System", timestamp: new Date().toISOString(), color: "000", msg: "Room ops: " + rooms[data.room].ops.join(", ")});
				} else if (data.msg.substr(0, 3).toLowerCase() == "/op" && (socket.user.level >= 2 || rooms[data.room].ops.indexOf(data.user.toLowerCase()) != -1)) {
					var user = data.msg.split(" ")[1].toLowerCase();
					if (rooms[data.room].ops.indexOf(user) == -1) rooms[data.room].ops.push(user);
				} else if (data.msg.substr(0, 5).toLowerCase() == "/save" && socket.user.level >= 3) {
					save();
				} else if (data.msg.substr(0, 10).toLowerCase() == "/whitelist" && socket.user.level >= 2) {
					var user = data.msg.split(" ")[1].toLowerCase();
					var whitelist = Number(data.msg.split(" ")[2]);
					if (typeof sockets[user] != "undefined") sockets[user].user.whitelist = whitelist;
					query("UPDATE users SET whitelist = ? WHERE user = ?;", [whitelist, user]);
				} else if (data.msg.substr(0, 8).toLowerCase() == "/autotip" && socket.user.level >= 3) {
					tipNext = true;
				} else if (data.msg.substr(0, 6).toLowerCase() == "/level" && socket.user.level >= 3) {
					var user = data.msg.split(" ")[1].toLowerCase();
					var level = Number(data.msg.split(" ")[2]);
					if (typeof sockets[user] != "undefined") sockets[user].user.level = level;
					query("UPDATE users SET level = ? WHERE user = ?;", [level, user]);
				} else if (data.msg.substr(0, 5).toLowerCase() == "/mute" && socket.user.level >= 1) {
					var msg = data.msg.split(" ");
					var time = new Date();
					time.setTime(time.getTime() + 60000 * Number(msg[2]));
					mutes[msg[1].toLowerCase()] = time;
					sendChat(socket, data.room, '<span class="label label-danger">muted ' + msg[1] + ' for ' + Number(msg[2]) + ' minutes!' + (msg.length > 3 ? ' (' + msg.slice(3).join(" ") + ')' : '') + '</span>');
				} else if (data.msg.substr(0, 6).toLowerCase() == "/banip" && socket.user.level >= 2) {
					var msg = data.msg.split(" ");
					var time = new Date();
					time.setTime(time.getTime() + 86400000);
					mutes[msg[1].toLowerCase()] = time;
					sendChat(socket, data.room, '<span class="label label-danger">banned ' + msg[1] + (msg.length > 3 ? ' (' + msg.slice(3).join(" ") + ')' : '') + '</span>');
					query("UPDATE users SET `level` = -1 WHERE `user` = ?", [msg[1].toLowerCase()], function() {
						log("Banned " + msg[1]);
					});
					query("SELECT register_ip, latest_ip FROM users WHERE user = ?;", [msg[1]], function(rows) {
						if (blocked.indexOf(rows[0].register_ip) == -1) {
							blocked.push(rows[0].register_ip);
							log("Banned IP: " + rows[0].register_ip);
						}
						if (blocked.indexOf(rows[0].latest_ip) == -1) {
							blocked.push(rows[0].latest_ip);
							log("Banned IP: " + rows[0].latest_ip);
						}
						save();
					});
				} else if (data.msg.substr(0, 4).toLowerCase() == "/ban" && socket.user.level >= 2) {
					var msg = data.msg.split(" ");
					var time = new Date();
					time.setTime(time.getTime() + 86400000);
					mutes[msg[1].toLowerCase()] = time;
					sendChat(socket, data.room, '<span class="label label-danger">banned ' + msg[1] + (msg.length > 3 ? ' (' + msg.slice(3).join(" ") + ')' : '') + '</span>');
					query("UPDATE users SET `level` = -1 WHERE `user` = ?", [msg[1].toLowerCase()], function() {
						log("Banned " + msg[1]);
					});
				} else {
					data.msg = data.msg.substr(0, 300);
					if (tipNext && data.room == "main" && socket.user.whitelist >= 1) {
						tipNext = false;
						autoRewardTimer();
						var reward = earnings[Math.floor(Math.random() * earnings.length)];
						query("UPDATE users SET `balance` = `balance` + ? WHERE `user` = ?;", [reward, socket.user.name]);
						socket.emit('balance', {change: reward});
					} else {
						var reward = 0;
					}
					if (data.msg.substr(0, 3).toLowerCase() == "/me") {
						data.msg = "<i>" + socket.user.name + " " + data.msg.substr(3) + "</i>";
					} else if (data.msg.substr(0, 2).toLowerCase() == "/b" && socket.user.level >= 1) {
						data.msg = "<b>" + data.msg.substr(2) + "</b>";
					}
					var exp = /\b(https?|ftp|file):\/\/([-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
					if (socket.user.whitelist > 0) {
						data.msg = data.msg.replace(exp, '<a href="$1://$2" target="_blank">$2</a>');
					} else {
						data.msg = data.msg.replace(exp, '[Links may be malware!] $2');
					}
					var timestamp = new Date().toISOString();
					if (socket.user.colors.indexOf(data.color.toUpperCase()) == -1) {
						data.color = "000";
					} else if (data.color != "000") {
						data.msg = '<span style="color: #' + data.color + '">' + data.msg + ' </span>';
					}
					query("CALL addMessage(?, ?, ?, ?, ?, ?)", [data.room, socket.user.nice_name, timestamp, data.msg, reward, socket.user.level], function(rows) {
						if (data.room.indexOf(":") != -1) {
							var users = data.room.split(":");
							for (var i = 0; i < users.length; i++) {
								if (typeof sockets[users[i]] != 'undefined') sockets[users[i]].emit("chat", {user: socket.user.nice_name, room: data.room, msg: data.msg, timestamp: timestamp, reward: reward, level: socket.user.level});
							}
						} else {
							sendChat(socket, data.room, data.msg, reward);
						}
					});
				}
			}
		}
	});
	socket.on('tip', function(data) {
		if (testValues([socket.user])) {
			return;
		}
		if (typeof data.user != "undefined" && typeof data.amount != "undefined" && typeof data.room != "undefined") {
			data.amount = Number(data.amount);
			if ((data.amount < 10 && socket.user.level < 3) || isNaN(data.amount)) {
				socket.emit("msg", {type: "danger", message: "You may only tip an amount of at least 10 DogeCoins."});
			} else {
				query("SELECT balance FROM users WHERE user = ?;", [socket.user.name], function(rows) {
					if (data.amount > rows[0].balance && socket.user.level < 3) {
						socket.emit("msg", {type: "danger", message: "You do not have enough DogeCoins."});
					} else {
						query("UPDATE users SET `balance` = `balance` - ? WHERE user = ?;", [data.amount, socket.user.name], function() {
							query("UPDATE users SET `balance` = `balance` + ? WHERE user = ?;", [Math.round(data.amount * (socket.user.level < 3 ? 0.9 : 1)), data.user.toLowerCase()], function() {
								var message = '<span class="label label-success">has tipped ' + data.user + ' ' + data.amount + ' DogeCoins'
										+ (data.message ? ' (' + data.message + ')' : '') + '</span>';
								query("INSERT INTO messages (room, user, timestamp, msg) VALUES (?, ?, ?, ?)", [data.room, socket.user.name, new Date().toISOString(), message])
								if (typeof sockets[data.user.toLowerCase()] != 'undefined') sockets[data.user.toLowerCase()].emit("balance", {change: Math.round(data.amount * 0.9)});
								socket.emit("balance", {change: -data.amount});
								if (data.room.indexOf(":") != -1) {
									var users = data.room.split(":");
									for (var i = 0; i < users.length; i++) {
										if (typeof sockets[users[i]] != 'undefined') sockets[users[i]].emit("chat", {user: socket.user.nice_name, room: data.room, msg: message, timestamp: new Date().toISOString(), reward: 0, level: socket.user.level});
									}
								} else {
									sendChat(socket, data.room, message, 0);
								}
							});
						});
					}
				});
			}
		}
	});
	socket.on('login', function(data) {
		if (testValues([data.user, data.pass])) {
			return;
		}
		query("SELECT * FROM users WHERE `user` = ? && `level` >= 0;", [data.user], function(rows) {
			if (rows.length == 1) {
				if (bcrypt.compareSync(data.pass, rows[0].pass)) {
					authenticated(rows);
				} else {
					query("SELECT * FROM users WHERE `user` = ? AND `pass` = MD5(?) && level >= 0;", [data.user, data.pass], function(rows) {
						if (rows.length == 1) {
							query("UPDATE users SET `pass` = ? WHERE `user` = ?;", [bcrypt.hashSync(data.pass, 10), data.user]);
							authenticated(rows);
						} else {
							log("Unsuccessful login attempt: " + data.user);
							socket.emit('msg', {type: "danger", message: "Login failed! Username or password are incorrect."});
						}
					});
				}
			} else {
				log("Unsuccessful login attempt: " + data.user);
				socket.emit('msg', {type: "danger", message: "Login failed! Username incorrect."});
			}
		});
		function authenticated(rows) {
			var session = crypto.createHash('sha256').update(data.user + rows[0].pass + (Math.floor(Math.random()*9000000000)+1000000000).toString()).digest('hex');
			query("UPDATE users SET session = ?, latest_ip = ? WHERE id = ?", [session, socket.request.connection.remoteAddress, rows[0].id], function() {
				login(socket, {user: rows[0].user, session: session, address: rows[0].address, balance: rows[0].balance,
						level: rows[0].level, colors: rows[0].colors, whitelist: rows[0].whitelist, nice_name: data.user});
				query("UPDATE users SET nice_name = ? WHERE user = ?", [data.user, data.user.toLowerCase()]);
			});
		}
	});
	socket.on('loginsession', function(session) {
		if (testValues([session])) {
			return;
		}
		query("SELECT * FROM users WHERE `session` = ? AND level >= 0;", [session], function(rows) {
			if (rows.length == 1) {
				query("UPDATE users SET latest_ip = ? WHERE user = ?", [socket.request.connection.remoteAddress, rows[0].user], function() {
					login(socket, {user: rows[0].user, session: session, address: rows[0].address, balance: rows[0].balance, level: rows[0].level,
							colors: rows[0].colors, whitelist: rows[0].whitelist, nice_name: rows[0].nice_name});
				});
			} else {
				socket.emit('msg', {type: "danger", message: "Login failed! Invalid session."});
			}
		});
	});
	socket.on('register', function(data) {
		if (testValues([data.user, data.email, data.pass])) {
			return;
		}
		sfs.checkSpammer({ip: socket.request.connection.remoteAddress, email: data.email}, function(err, isSpammer) {
			if (err) log("Spam check error: " + err);
			if (isSpammer) {
				socket.emit("msg", {type: "danger", message: "You are listed as a spammer."});
			} else {
				if (/[^a-zA-Z0-9]/.test(data.user) || data.user.length < 4 || data.user.length > 20) {
					socket.emit('msg', {type: "danger", message: "Please specify an alphanumeric username between 4 and 20 characters, inclusive."});
				} else if (data.pass.length < 4 || data.pass.length > 20) {
					socket.emit('msg', {type: "danger", message: "Please specify a password between 4 and 20 characters, inclusive."});
				} else {
					query("SELECT * FROM users WHERE `user` = ?;", [data.user.toLowerCase()], function(rows) {
						if (rows.length > 0) {
							socket.emit('msg', {type: "danger", message: "An account with that username already exists."});
						} else {
							query("SELECT COUNT(*) FROM users WHERE register_ip = ?;", [socket.request.connection.remoteAddress], function(rows) {
								if (rows[0].count >= 2) {
									log("Attempt at registering too many accounts: " + socket.request.connection.remoteAddress);
									socket.emit('msg', {type: "danger", message: "You have registered too many accounts. Contact admin to dispute this."});
								} else {
									var session = crypto.createHash('sha256').update(data.user + rows[0].pass + (Math.floor(Math.random()*9000000000)+1000000000).toString()).digest('hex');
									wallet.get_address_by_label({'label': data.user.toLowerCase()}, function(a, res) {
										if (res.status == "success") {
											query("INSERT INTO users (user, nice_name, email, pass, session, address, register_ip) VALUES (?, ?, ?, ?, ?, ?, ?)", [data.user, data.user, data.email, bcrypt.hashSync(data.pass, 10), session, res.data.address, socket.request.connection.remoteAddress], function() {
												login(socket, {user: data.user.toLowerCase(), session: session, address: res.data.address, balance: 0, level: 0,
														colors: "000", whitelist: 0, nice_name: data.user});
												log("Registered new user: " + data.user);
											});
										} else {
											wallet.get_new_address({label: data.user.toLowerCase()}, function(a, res) {
												query("INSERT INTO users (user, nice_name, email, pass, session, address, register_ip) VALUES (?, ?, ?, ?, ?, ?, ?)", [data.user, data.user, data.email, bcrypt.hashSync(data.pass, 10), session, res.data.address, socket.request.connection.remoteAddress], function() {
													login(socket, {user: data.user.toLowerCase(), session: session, address: res.data.address, balance: 0, level: 0,
															colors: "000", whitelist: 0, nice_name: data.user});
													log("Registered new user: " + data.user);
												});
											});
										}
									});

								}
							});
						}
					});
				}
			}
		});
	});
	socket.on('join', function(room) {
		if (testValues([socket.user])) {
			return;
		}
		if (typeof room != "undefined") {
			if (room.indexOf(":") != -1) {
				var users = room.split(":");
				if (users[0] != socket.user.name && users[1] != socket.user.name) {
					socket.emit("msg", {type: "danger", message: "You do not have permission to join this room."});
					return;
				}
			} else {
				room = JSON.stringify(room).replace(/\W/g, "").toLowerCase();
				if (typeof rooms[room] != "undefined") {
					if (rooms[room].kicks.indexOf(socket.user.name) != -1) {
						socket.emit("msg", {type: "danger", message: "You are banned from this room!"});
						return;
					}
				} else {
					if (room.length < 3 || room.length > 20) {
						socket.emit('msg', {type: "danger", message: "Please specify a room name between 3 and 20 characters, inclusive."});
						return;
					} else {
						socket.emit("msg", {type: "success", message: "You are the owner of this room."});
						rooms[room] = {users: [], ops: [socket.user.name], kicks: []};
					}
				}
			}
			if (room == "modchat") {
				if (socket.user.level < 1) {
					socket.emit("msg", {type: "danger", message: "You do not have permission to join this room."});
					return;
				}
			}
			socket.emit("join", room);
			socket.user.rooms.push(room);
			if (room.indexOf(":") == -1) {
				if (rooms[room].users.indexOf(socket.user.name) == -1) rooms[room].users.push(socket.user.name);
				if (rooms[room].topic) socket.emit("chat", {user: "*Topic", room: room, msg: rooms[room].topic, timestamp: new Date().toISOString()});
			}
			query("SELECT * FROM messages WHERE `room` = ? ORDER BY `timestamp` DESC LIMIT 10;", [room], function(rows) {
				rows.reverse();
				for (var i = 0; i < rows.length; i++) {
					socket.emit('chat', {user: rows[i].user, room: rows[i].room, msg: rows[i].msg, timestamp: rows[i].timestamp, reward: rows[i].reward, scrollback: true, level: rows[i].level});
				}
			});
		}
	});
	socket.on("quit", function(room) {
		if (testValues([socket.user])) {
			return;
		}
		if (typeof room != "undefined") {
			room = room.replace(/[\.,#!$%\^&\*?;{}=\_`~()]/g, "").toLowerCase();
			if (typeof rooms[room] != "undefined" && room.indexOf(":") == -1) {
				if (rooms[room].users.indexOf(socket.user.name) != -1) rooms[room].users.splice(rooms[room].users.indexOf(socket.user.name), 1);
			}
		}
	});
	socket.on("deposit", function() {
		if (testValues([socket.user])) {
			return;
		}
		wallet.get_address_received({label: socket.user.name}, function(a, res) {
			var received = res.data.confirmed_received;
			query("SELECT credited FROM users WHERE user = ?", [socket.user.name], function(rows) {
				var credited = rows[0].credited;
				var amount = Math.floor(received - credited);
				if (amount > 0) {
					query("UPDATE users SET `credited` = (`credited` + ?), `balance` = (`balance` + ?) WHERE user = ?", [amount, amount, socket.user.name], function() {
						socket.emit("balance", {change: amount});
						log("Deposit of " + amount + " DogeCoins by " + socket.user.nice_name);
					});
				} else {
					socket.emit("msg", {type: "danger", message: "There is no pending balance at this time. Please ensure transactions have at least 1 confirmation."});
				}
			});
		});
	});
	socket.on("withdraw", function(data) {
		if (testValues([socket.user, data.address, data.amount])) {
			return;
		}
		if (!coinstring.isValid(data.address, 0x1E)) {
			socket.emit("msg", {type: "danger", message: "DogeCoin address is not valid."});
		} else {
			data.amount = Number(data.amount);
			query("SELECT balance FROM users WHERE user = ?", [socket.user.name], function(rows) {
				if (!isNaN(data.amount) && data.amount <= rows[0].balance && data.amount >= 100) {
					query("INSERT INTO transactions (user, address, amount) VALUES (?, ?, ?)", [socket.user.name, data.address, data.amount]);
					query("UPDATE users SET `balance` = `balance` - ? WHERE user = ?", [data.amount, socket.user.name], function() {
						wallet.withdraw({amount: (data.amount - 10), payment_address: data.address, pin: pin});
						socket.emit("balance", {change: -data.amount});
						socket.emit("msg", {type: "success", message: "Funds successfully withdrawn!"});
					});
				}
			});
		}
	});
	socket.on('buycolor', function(color) {
		if (typeof color != "string") {
			return;
		}
		color = color.toUpperCase();
		if (socket.user.colors.indexOf(color) != -1) {
			socket.emit('msg', {type: "danger", message: "You already own this color."});
			return;
		}
		if (!/^[0-9A-F]{3}$/.test(color)) {
			socket.emit('msg', {type: "danger", message: "Invalid color code."});
			return;
		}
		query("SELECT balance FROM users WHERE user = ?", [socket.user.name], function(rows) {
			if (rows[0].balance < COLOR_PRICE) {
				socket.emit('msg', {type: "danger", message: "You do not have enough DogeCoins."});
				return;
			}
			socket.user.colors.push(color);
			query("UPDATE users SET balance = `balance` - ?, colors = ? WHERE user = ?;", [COLOR_PRICE, socket.user.colors.join(), socket.user.name], function() {
				socket.emit("colors", socket.user.colors);
				socket.emit("balance", {change: -COLOR_PRICE});
				log(socket.user.nice_name + " purchased the colour #" + color);
				socket.emit("msg", {type: "success", message: "Successfully purchase color #" + color + "."});
			});
		});
	});
});


var login = function(socket, data) {
	if (online.indexOf(data.user) == -1) {
		online.unshift(data.user);
		io.emit('online', online);
	}
	data.colors = data.colors.split(',');
	socket.emit('loggedin', {session: data.session, user: data.user, nice_name: data.nice_name, address: data.address, colors: data.colors});
	socket.emit("balance", {balance: data.balance});
	socket.user = {name: data.user.toLowerCase(), nice_name: data.nice_name, session: data.session, level: data.level, colors: data.colors, whitelist: data.whitelist, rooms: []};
	sockets[data.user.toLowerCase()] = socket;
};
var sendChat = function(socket, room, message, reward, user) {
	var timestamp = new Date().toISOString();
	reward = (reward ? reward : 0);
	if (user) {
		var level = 0;
	} else {
		user = socket.user.nice_name;
		var level = socket.user.level;
	}
	if (typeof rooms[room] != "undefined") {
		for (var i = 0; i < rooms[room].users.length; i++) {
			if (typeof sockets[rooms[room].users[i]] != "undefined") sockets[rooms[room].users[i]].emit("chat", {user: user, room: room, msg: message, timestamp: timestamp, reward: reward, level: level});
		}
	}
};	


function autoRewardTimer() {
	setTimeout(function() {
		tipNext = true;
	}, Math.floor(Math.random() * 150000) + 300000);
}
autoRewardTimer();

setInterval(function() {
	wallet.get_current_price({}, function(a, data) {
		if (typeof data !== 'undefined') io.emit('price', data.data.prices);
	});
}, 150000)

process.on('uncaughtException', function(e) {
	console.log(e.stack);
});

function save(callback) {
	try {
		var stream = fs.createWriteStream("data.json", {
			flags: 'w'
		});
		stream.end(JSON.stringify(rooms));
		stream.on('finish', function() {
			log("Saved room data to file.");
			if (typeof callback == "function") callback();
		});
	} catch(err) {
		log("Error whilst saving data to file: " + err);
	}
}
function log(msg) {
	time = new Date().toISOString().replace("T", " ").slice(0, 16);
	console.log(time + " " + msg);
}
function query(query, data, callback) {
	pool.getConnection(function(err, con) {
		if (err) {
			console.log("MySQL Connection Error: " + err);
		} else {
			con.query(query, data, function(err, rows) {
				if (err) {
					console.log("MySQL Query Error: " + err);
				} else {
					con.release();
					if (typeof callback == 'function') callback(rows);
				}
			});
		}
	});
}
function testValues(values) {
	for (var i = 0; i < values.length; i++) {
		if (typeof values[i] == "undefined") {
			return true;
		}
	}
	return false;
}