/* Variables */
var myRooms = [];
var myPMs = [];
var username = "";
var balance = 0;
var loggedIn = false;
var currentRoom = "";
var messages = {};
var unreadMessages = {};
var color = (getCookie('color') == "" ? "000" : getCookie('color'));
var smilies = ["smile", "tongue", "happy", "wink", "wow", "sad", "angry", "cool", "meh", "huh", "zzz", "flat"];
var smiliesToConvert = [["\\:\\)", "\\(\\:", "\\:\\-\\)", "\\=\\)", "\\(\\="], ["\\:P", "\\:p", "\\:\\-P", "\\=p", "\\=P"], ["\\:D", "\\:\\-D", "\\=D"], ["\\;\\)"], ["\\:o", "\\:O", "\\=O", "\\=o"], ["\\:\\(", "\\)\\:", "\\=\\(", "\\)\\="], ["\\>\\:\\(", "\\>\\=\\("], ["B\\)", "8\\)"], ["\\:/", "\\=/"], [], ["zzz"], ["\\:\\|", "\\;\\|"]];
var chatHistory = [];
var chatHistoryIndex = -1;
var usernames = [];
var ignored = (getCookie('ignored') == "" ? [] : getCookie('ignored').split(","));
var ads = [];
var active = true;
var flashing = 0;
var currentTitle = "";
var flashingTitle = "";


/* Socket.IO Events */
var socket = io.connect('https://chatwow.net:443', {secure: false, transport: ['websocket']});
socket.on("connect", function() {
	if (getCookie('session') != "") {
		socket.emit("loginsession", getCookie('session'));
	}
});
socket.on("disconnect", function() {
	window.location.reload();
});
socket.on('online', function(online) {
	usernames = online;
	$('#online').html(online.length);
});
socket.on("loggedin", function(data){
	loggedIn = true;
	setCookie('session', data.session);
	username = data.user.toLowerCase();
	buildColors(data.colors);
	$('#username-text').html(data.nice_name);
	$('#deposit-address').html(data.address);
	$('.chat-area').html('');
	$('#menu-bar').removeClass('hidden');
	setTimeout(function() {
		if (myRooms.indexOf("main") != -1) {
			changeRoom("main");
		}
	}, 1000);
	if (getCookie("rooms").length == 0) {
		socket.emit("join", "main");
	} else {
		var rooms = getCookie("rooms").split(",");
		for (var i = 0; i < rooms.length; i++) {
			if (rooms[i] != "") socket.emit("join", rooms[i]);
		}
	}
	$('#chat-input').keydown(function(e) {
		if(e.keyCode == 13){
			if (e.shiftKey) {
				$('#chat-input').val($('#chat-input').val() + " \\ ");
			} else {
				sendMessage();
			}
		} else if (e.keyCode == 38 && chatHistoryIndex < chatHistory.length - 1) {
			e.preventDefault();
			chatHistoryIndex++;
			$('#chat-input').val(chatHistory[chatHistoryIndex]);
		} else if (e.keyCode == 40) {
			e.preventDefault();
			if (chatHistoryIndex > 0) {
				chatHistoryIndex--;
				$('#chat-input').val(chatHistory[chatHistoryIndex]);
			} else if (chatHistoryIndex == 0) {
				chatHistoryIndex--;
				$('#chat-input').val('');
			}
		} else if (e.keyCode == 9) {
			e.preventDefault();
			var words = $('#chat-input').val().split(" ");
			var word = words[words.length - 1];
			if (word.substr(0, 1) == "#" && word.length > 1) {
				for (var i = 0; i < myRooms.length; i++) {
					if ("#" + myRooms[i].substr(0, word.length - 1) == word) {
						words[words.length - 1] = "#" + myRooms[i] + " ";
						$('#chat-input').val(words.join(" "));
					}
				}
			} else if (word.length > 0) {
				for (var i = 0; i < usernames.length; i++) {
					if (usernames[i].substr(0, word.length) == word) {
						words[words.length - 1] = usernames[i];
						if (words.length == 1) {
							words[words.length - 1] += ": "; 
						} else {
							words[words.length - 1] += " "; 
						}
						$('#chat-input').val(words.join(" "));
					}
				}
			}
		}
	})
	$('#chat-btn').click(function() {
		sendMessage();
	});
	$('#join-form').submit(function(e) {
		e.preventDefault();
		if ($('#join-input').val() != "") {
			room = $('#join-input').val().replace(/[\.,#!$%\^&\*?;{}=\_`~()]/g,"").split("<")[0].toLowerCase();
			joinRoom(room)
		}
		$('#join-input').val('');
	});
	$('#pm-form').submit(function(e) {
		e.preventDefault();
		if ($('#pm-input').val() != "") {
			joinPM($('#pm-input').val());
		}
		$('#pm-input').val('');
	});
	$('#withdraw-form').submit(function(e) {
		e.preventDefault();
		if (Number($("#amount-input").val()) >= 100 && $("#address-input").val() != "") {
			$('#withdraw-btn').attr('disabled', 'disabled');
			$('#withdraw-btn').val('Withdrawing...');
			setTimeout(function() {
				$('modal-withdraw').modal('hide');
				$('#withdraw-btn').removeAttr('disabled');
				$('#withdraw-btn').val('Withdraw');
			}, 2000);
			socket.emit("withdraw", {amount: $("#amount-input").val(), address: $("#address-input").val()});
		}
	});
});
socket.on("join", function(room) {
	if (room.indexOf(":") !== -1) {
		var users = room.split(":");
		var PM = (users[0] == username.toLowerCase()) ? users[1] : users[0];
		if (myPMs.indexOf(PM) === -1) {
			if (typeof messages[room] === 'undefined') messages[room] = [];
			myPMs.push(PM);
			myPMs.sort()
			buildRooms("pm", myPMs);
			changeRoom(room);
		}
	} else {
		if (myRooms.indexOf(room) === -1) {
			if (typeof messages[room] === 'undefined') messages[room] = [];
			myRooms.push(room);
			myRooms.sort();
			buildRooms("room", myRooms);
			changeRoom(room);
		}
	}
});
socket.on("chat", function(data) {
	if (ignored.indexOf(data.user) != -1) return;
	if (!active) {
		document.title = "ChatWOW | Unread Messages!";
	}
	var user = data.user.toLowerCase();
	for(var i in smilies){
		if(data.msg.indexOf(":" + smilies[i] + ":") != -1 ){
			data.msg = data.msg.replace(new RegExp("\\:" + smilies[i] + "\\:", "g"), "<i class='smiley " +smilies[i] + "' title='" + smilies[i] + "'></i>");
		}
	}
	if (data.msg.toLowerCase().indexOf(username.toLowerCase()) != -1 && data.user.toLowerCase() != username && data.user.substr(0, 1) != "*") {
		data.msg = "<b>" + data.msg + "</b>";
		if (!data.scrollback) {
			if (!active) {
				flashTitle("Mentioned in #" + data.room);
			}
		}
	}
	if (data.msg.indexOf("<b>") != -1 && !data.scrollback && (!active || data.room != currentRoom)) {
		$('#mentioned-audio')[0].load();
		$('#mentioned-audio')[0].play();
	}
	data.msg = " " + data.msg.replace(/>/g, "> ");
	if (data.msg.indexOf(" #") != -1) {
		message = data.msg.split(" ");
		for (var i = 0; i < message.length; i++) {
			if (message[i].substr(0, 1) == "#" && message[i].indexOf(">") == -1 && message[i].length > 1) {
				message[i] = '<a href="#" onclick="joinRoom(\'' + message[i].replace("#", "") + '\')">' + message[i] + '</a>';
			}
		}
		data.msg = message.join(" ").trim();
	}
	if (data.room.indexOf(":") != -1) {
		var users = data.room.split(":");
		var otherUser = (username == users[0] ? users[1] : users[0]);
		if (myPMs.indexOf(otherUser) == -1) {
			socket.emit("join", data.room);
		}
	}
	if (data.room != "") {
		messages[data.room].push(data);
		while (messages[data.room].length > 100) {
			messages[data.room].shift();
		}
		if (data.room == currentRoom) {
			displayMessage(data);
		} else {
			unreadMessages[data.room] = (unreadMessages[data.room] ? unreadMessages[data.room] : 0) + 1;
			$('[data-room="' + data.room + '"]>.badge').removeClass('hidden');
			$('[data-room="' + data.room + '"]>.badge').removeClass('mentioned');
			$('[data-room="' + data.room + '"]>.badge').html(unreadMessages[data.room]);
			if (data.msg.trim().substr(0, 3) == "<b>") {
				$('[data-room="' + data.room + '"]>.badge').addClass('mentioned');
			}
		}
	}
});
socket.on("balance", function(data) {
	if (typeof data.balance !== 'undefined') {
		balance = data.balance;
	} else {
		$('#modal-deposit').modal("hide");
		balance += Math.round(data.change);
		if (data.change > 0) {
			var credit = $('<span class="label label-success" style="margin: -2px 5px;">+' + data.change + '</span>');
			$('.navbar-header>.navbar-text').append(credit);
			credit.delay(2000).fadeOut(500);
		}
	}
	$('#balance').html(balance);
});
socket.on("kick", function(room) {
	quitRoom(room);
});
socket.on("msg", function(data) {
	displayAlert(data.type, data.message);
});
socket.on('price', function(data) {
	for (i in data) {
		if (data[i].price_base == "BTC" && data[i].exchange == "bter") {
			btc_price = Number((Number(data[i].price) * 1000).toFixed(5));
		} else if (data[i].price_base == "USD" && data[i].exchange == "bter") {
			usd_price = Number((Number(data[i].price) * 1000).toFixed(5));
		}
	}
	$('#ticker').html(btc_price + " BTC - " + usd_price + " USD");
});
socket.on('colors', function(data) {
	buildColors(data);
});


/* Interface Stuff */
function buildRooms(type, list) {
	$('#' + type + '-list').html('');
	for (var i = 0; i < list.length; i++) {
		var room = (type == "pm" ? [username, list[i]].sort().join(":") : list[i]);
		$('#' + type + '-list').append('<li><a class="room" onclick="changeRoom(\'' + room + '\')" data-room="' + room + '">' + list[i] + '<div class="badge pull-right hidden">0</div><span class="pull-right hidden" onclick="quitRoom(\'' + room + '\')">&times;</span></a></li>');
	}
	var allRooms = myRooms.slice();
	for (var i = 0; i < myPMs.length; i++) {
		allRooms.push([username, myPMs[i]].sort().join(":"));
	}
	setCookie("rooms", allRooms.join());
}
function buildColors(data) {
	var html = "";
	for(var i = 0; i < data.length; i++) {
		html += ', <span style="color: #' + data[i] + '" class="color" onclick="setColor(\'' + data[i] + '\')">' + data[i] + '</span>';
	}
	$('#my-colors').html(html.substr(2));
}
function changeRoom(room) {
	currentRoom = room;
	unreadMessages[room] = 0;
	document.title = (room.indexOf(":") == -1 ? "ChatWOW | #" + room : "ChatWOW | PM: " + (room.split(":")[0] == username ? room.split(":")[1] : room.split(":")[0]));
	$('.nav-pills>li.active>a>span').addClass('hidden');
	$('.nav-pills>li.active').removeClass('active');
	$('a[data-room="' + room + '"]').parent().addClass('active');
	$('a[data-room="' + room + '"]>span').removeClass('hidden');
	$('a[data-room="' + room + '"]>.badge').addClass('hidden');
	$('.chat-area').html('');
	for (var i = 0; i < messages[room].length; i++) {
		displayMessage(messages[room][i]);
	}
	$('#chat-input').focus();
}
function quitRoom(room) {
	if (room.indexOf(":") !== -1) {
		pm = (room.split(":")[0] == username ? room.split(":")[1] : room.split(":")[0])
		myPMs.splice(myPMs.indexOf(pm), 1);
		buildRooms("pm", myPMs);
		socket.emit("quitroom", {room: room});
	} else {
		myRooms.splice(myRooms.indexOf(room), 1);
		buildRooms("room", myRooms);
		socket.emit("quitroom", {room: room});
	}
	delete messages[room];
	changeRoom("");
}
function joinPM(pm) {
	if (!loggedIn) {
		displayAlert("danger", "Please login.");
		return;
	}
	pm = pm.replace(/[\.,#!$%\^&\*?;{}=\_`~()]/g, "").toLowerCase();
	room = [username, pm].sort().join(':');
	if (myPMs.indexOf(pm) != -1) {
		changeRoom(room);
	} else {
		socket.emit("join", room);
	}
}
if (getCookie("theme") == "1") {
	$('body').addClass("dark");
	$('[data-theme="0"]').removeClass("active");
	$('[data-theme="1"]').addClass("active");
}
$('#logout-btn').click(function(e) {
	e.preventDefault();
	delCookie("session");
	delCookie("rooms");
	window.location.reload();
});
$('#login-form').submit(function(e) {
	e.preventDefault();
	$('#login-btn').val('Logging in...');
	socket.emit('login', {user: $('#login-user').val(), pass: $('#login-pass').val()});
});
$('#register-form').submit(function(e) {
	e.preventDefault();
	console.log("Registering");
	$('#register-btn').val('Registering...');
	socket.emit('register', {user: $('#register-user').val(), pass: $('#register-pass').val(), email: $('#register-email').val()});
});
$('#color-form').submit(function(e) {
	e.preventDefault();
	socket.emit("buycolor", $('#input-color').val());
});
$('.chat-area').on('click', '.user', function(e) {
	joinPM($(this).html());
});
$('#input-color').keyup(function() {
	if ($('#input-color').val().length == 3) {
		$('.color-sample').css('color', '#' + $('#input-color').val());
	}
});
function displayMessage(msg) {
	var time = new Date(msg.timestamp).toTimeString().substr(0, 5);
	$('.chat-area').append('<div class="chat-line"><div class="user level-' + msg.level + '">'
			+ msg.user + '</div><div class="message">' 
			+ msg.msg.replace(" \\ ", "<br />").replace(" \\ ", "<br />") + '<small> '
			+ time + ' </small>'
			+ (msg.reward > 0 ? ' <span class="label label-' + (msg.user.toLowerCase() == username ? 'success' : 'default') + '">+' + msg.reward + '</span>' : '')
			+ '</div></div>');
	$('.chat-area')[0].scrollTop += $('.chat-area').children().last().height() + 1;
}
function displaySystemMessage(msg) {
	displayMessage({user: "*System", timestamp: new Date().toISOString(), color: "000", msg: msg});
}
function sendMessage() {
	var msg = $('#chat-input').val();
	chatHistory.unshift(msg);
	if (msg.substr(0, 4) == "/tip") {
		data = msg.split(" ");
		tip = {user: data[1], amount: data[2], room: currentRoom};
		if (data.length > 3) tip.message = data.slice(3).join(" ");
		socket.emit("tip", tip);
	} else if (msg.substr(0, 3) == "/pm" || msg.substr(0, 4) == "/msg" || msg.substr(0, 6) == "/query" || msg.substr(0, 2) == "/q") {
		var msg = msg.split(" ");
		var user = msg[1];
		var msg = msg.splice(2).join(" ");
		var room = [username, user].sort().join(":");
		joinRoom(room);
		socket.emit("chat", {room: room, msg: msg.trim(), color: color});
	} else if (msg.substr(0, 7) == "/ignore") {
		var params = msg.split(" ");
		if (params.length >= 2) {
			if (params[1].substr(0, 1) != "*" && ignored.indexOf(params[1]) == -1) {
				ignored.push(params[1]);
				setCookie("ignored", ignored.join());
			}
			displaySystemMessage("You are now ignoring: " + ignored.join(", ") + ".");
		}
	} else if (msg.substr(0, 9) == "/unignore") {
		var params = msg.split(" ");
		if (params.length >= 2) {
			if (ignored.indexOf(params[1]) != -1) {
				ignored.splice(ignored.indexOf(params[1]), 1);
				setCookie("ignored", ignored.join());
			}
			displaySystemMessage("You are now ignoring: " + ignored.join(", ") + ".");
		}
	} else if (msg.substr(0, 5) == "/help") {
		displaySystemMessage("/pm [user] [message] - Sends a PM to the specified user.<br />/tip [user] [amount] [optional message] - Tips the specified user from your DogeCoin balance.<br />/me [message] - Say something in the third person.<br />/ignore [user] - Ignore any further messages from the specified user.<br />/unignore [user] - Stops ignoring messages from the specified user.<br />/online - Lists online users.");
	} else {
		msg = " " + msg;
		for(var i = 0; i < smiliesToConvert.length; i++){
			for(var j = 0; j < smiliesToConvert[i].length; j++){
				msg = msg.replace(new RegExp(" " + smiliesToConvert[i][j], "g"), " :" + smilies[i] + ":");
			}
		}
		socket.emit("chat", {room: currentRoom, msg: msg.trim(), color: color});
	}
	$('#chat-input').val('');
}
function setColor(a) {
	color = a;
	$('#modal-colors').modal('hide');
	setCookie('color', a);
}
function setTheme(theme) {
	if (theme == 0) {
		$('body').removeClass("dark");
		$('[data-theme="1"]').removeClass("active");
		$('[data-theme="0"]').addClass("active");
	} else if (theme == 1) {
		$('body').addClass("dark");
		$('[data-theme="0"]').removeClass("active");
		$('[data-theme="1"]').addClass("active");
	}
	setCookie("theme", theme);
}
function joinRoom(room) {
	if (myRooms.indexOf(room) != -1 || myPMs.indexOf(room.split(":")[0]) != -1 || myPMs.indexOf(room.split(":")[1]) != -1) {
		changeRoom(room);
	} else {
		console.log("Joining room: " + room);
		socket.emit("join", room);
	}
}
function flashTitle(text) {
	flashingTitle = text;
	if (flashing == 0) {
		currentTitle = document.title;
		flashing = setInterval(function() {
			if (document.title == currentTitle) {
				document.title = flashingTitle;
			} else {
				document.title = currentTitle;
			}
		}, 500);
	}

}
function displayAlert(type, message) {
	var alert = $('<div class="alert alert-' + type + '">' + message + '</div>');
	$('body').append(alert);
	alert.delay(2000).fadeOut(500);
}


/* Utilities */
function setCookie(a,b){var d=new Date();d.setTime(d.getTime()+(365*24*60*60*1000));var expires="expires="+d.toGMTString();document.cookie=a+"="+b+"; "+expires;}
function delCookie(a){var d=new Date();d.setTime(d.getTime()-1);var expires="expires="+d.toGMTString();document.cookie=a+"=; "+expires;}
function getCookie(a){var b=a+"=";var ca=document.cookie.split(';');for(var i=0;i<ca.length;i++){var c=ca[i];while(c.charAt(0)==' ')c=c.substring(1);if(c.indexOf(b)!=-1)return c.substring(b.length,c.length);}return "";}
$(window).on("blur focus", function(e) {
	var prevType = $(this).data("prevType");
	if (prevType != e.type) {
		switch (e.type) {
			case "blur":
				active = false
				break;
			case "focus":
				active = true;
				clearInterval(flashing);
				flashing = 0;
				document.title = (currentRoom.indexOf(":") == -1 ? "ChatWOW | #" + currentRoom : "ChatWOW | PM: " + (currentRoom.split(":")[0] == username ? currentRoom.split(":")[1] : currentRoom.split(":")[0]));
				break;
		}
	}
	$(this).data("prevType", e.type);
})