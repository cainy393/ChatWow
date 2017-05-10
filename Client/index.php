<?if(!isset($_SERVER['HTTPS'])||$_SERVER['HTTPS']==""){header("Location: https://DogeChat.com/");exit();}?>
<!DOCTYPE html>
<html>
<head>
<title>DogeChat - Earn FREE DogeCoins for chatting with fellow shibes!</title>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="style.css" rel="stylesheet" />
<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css">
<link rel="icon" type="image/icon" href="favicon.ico">
</head>
<body>
<nav class="navbar navbar-default navbar-static-top" role="navigation">
<div class="container-fluid">
<div class="navbar-header">
<button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
<span class="sr-only">Toggle navigation</span>
<span class="icon-bar"></span>
<span class="icon-bar"></span>
<span class="icon-bar"></span>
</button>
<div class="navbar-brand"><img src="logo.png" height="24" />ogeChat</div>
</div>
<div id="menu-bar" class="navbar-collapse collapse navbar-right hidden">
<ul class="nav navbar-nav">
<li class="dropdown">
<a href="#" class="dropdown-toggle" data-toggle="dropdown">Style <span class="caret"></span></a>
<ul class="dropdown-menu" role="menu">
<li><a href="#" data-toggle="modal" data-target="#modal-colors">Chat Colors</a></li>
<li class="dropdown-header">Theme</li>
<li data-theme="0" class="active"><a href="#" onclick="setTheme(0)">Light</a></li>
<li data-theme="1"><a href="#" onclick="setTheme(1)">Dark</a></li>
</ul>
</li>
<li class="dropdown">
<a href="#" class="dropdown-toggle" data-toggle="dropdown">Menu <span class="caret"></span></a>
<ul class="dropdown-menu" role="menu">
<li><a href="#" data-toggle="modal" data-target="#modal-info">Info</a></li>
<li><a href="#" data-toggle="modal" data-target="#modal-rooms">Popular Rooms</a></li>
<li><a href="#" data-toggle="modal" data-target="#modal-deposit">Deposit</a></li>
<li><a href="#" data-toggle="modal" data-target="#modal-withdraw">Withdraw</a></li>
</ul>
</li>
<li><a href="#" id="logout-btn">Logout</a></li>
</ul>
</div>
</nav>
<div id="banner">
Welcome, <span id="username-text">Guest</span>! Balance: <span id="balance">0</span> DogeCoin | Users online: <span id="online">0</span> | Price of 1k DogeCoins: <span id="ticker">0 BTC - 0 USD</span> | <a href="#" onclick="joinPM('admin')">Advertise with us!</a>
</div>
<div class="sidebar">
<h4>Rooms</h4>
<form id="join-form">
<div class="input-group">
<input type="text" class="form-control" id="join-input" />
<span class="input-group-btn">
<input type="submit" class="btn btn-info" value="Join" />
</span>
</div>
</form>
<ul class="nav nav-pills nav-stacked" id="room-list">
</ul>
<h4>Users</h4>
<form id="pm-form">
<div class="input-group">
<input type="text" class="form-control" id="pm-input" />
<span class="input-group-btn">
<input type="submit" class="btn btn-info" value="PM" />
</span>
</div>
</form>
<ul class="nav nav-pills nav-stacked" id="pm-list">
</ul>
</div>
<div class="bar">
<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle" style="display:block;width:468px;height:60px;margin:auto" data-ad-client="ca-pub-1294194605216925" data-ad-slot="7864595595"></ins>
<script>
(adsbygoogle = window.adsbygoogle || []).push({});
</script>
</div>
<div class="chat-area">
<h1>Welcome to DogeChat!</h1>
<p>Welcome to a friendly community of chatters who are all fans of the infamous DogeCoin. By chatting here you will meet some wonderful people and have the chance of winning <b>FREE DogeCoins just for chatting</b>.</p>
<p>If you already have an account you can log in below, otherwise you can register - its free and easy!</p>
<div class="col-sm-6 col-md-5 col-lg-4">
<h3>Register</h3>
<form id="register-form">
<div class="form-group">
<label>Username</label>
<input type="text" id="register-user" class="form-control" placeholder="Enter username" />
</div>
<div class="form-group">
<label>Email</label>
<input type="email" id="register-email" class="form-control" placeholder="Enter email" />
</div>
<div class="form-group">
<label>Password</label>
<input type="password" id="register-pass" class="form-control" placeholder="Enter password" />
</div>
<input type="submit" class="btn btn-success btn-block" id="register-btn" value="Register" />
</form>
</div>
<div class="col-sm-6 col-md-5 col-lg-4">
<h3>Login</h3>
<form id="login-form">
<div class="form-group">
<label>Username</label>
<input type="text" id="login-user" class="form-control" placeholder="Enter username" />
</div>
<div class="form-group">
<label>Password</label>
<input type="password" id="login-pass" class="form-control" placeholder="Enter password" />
</div>
<input type="submit" class="btn btn-success btn-block" id="login-btn" value="Login" />
</form>
</div>
</div>
<div class="chat-bar">
<div class="input-group">
<input type="text" class="form-control" id="chat-input" />
<span class="input-group-btn">
<button class="btn btn-success" id="chat-btn">Send</button>
</span>
</div>
</div>
<div class="modal fade" id="modal-deposit">
<div class="modal-dialog">
<div class="modal-content">
<div class="modal-header">
<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
<h4 class="modal-title">Deposit DogeCoins</h4>
</div>
<div class="modal-body">
<ol>
<li>Below is your personal wallet address that will never change. You can deposit to this address any time and save it to your contacts for future reference. You should begin by sending some DogeCoins here.</li>
<code id="deposit-address"></code>
<br />
<li>After sending some DogeCoins to the above address, and once the transaction has at least 1 confirmation, you can click the button below to credit any pending coins to your balance.</li>
<button class="btn btn-success" onclick="socket.emit('deposit');">I have a confirmation!</button>
</ol>
</div>
</div>
</div>
</div>
<div class="modal fade" id="modal-withdraw">
<div class="modal-dialog">
<div class="modal-content">
<div class="modal-header">
<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
<h4 class="modal-title">Withdraw DogeCoins</h4>
</div>
<div class="modal-body">
<p>You may withdraw a minimum of 100 DogeCoins. You will incur a 10 DogeCoin transaction fee on withdrawal. Please ensure you enter you address correctly.</p>
<form id="withdraw-form">
<div class="form-group">
<label for="amount">Amount</label>
<input type="number" class="form-control" name="amount" id="amount-input" min="100" placeholder="Amount in DogeCoins" />
</div>
<div class="form-group">
<label name="address">DogeCoin Address</label>
<input type="text" class="form-control" name="address" id="address-input" placeholder="e.g. DGiwY6FZzGYgy5SvJp5Bty8Vga6FChJKCB" />
</div>
<br />
<input type="submit" class="btn btn-info" id="withdraw-btn" value="Withdraw" />
</form>
</div>
</div>
</div>
</div>
<div class="modal fade" id="modal-info">
<div class="modal-dialog modal-lg">
<div class="modal-content">
<div class="modal-body">
<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
<h2>Welcome to DogeChat!</h2>
<p><b>NOTICE: We've had a couple issues recently, it's all because we're working on making everything more secure for your own sake. You'll have to register AGAIN (sorry) but it's for the best. You'll be reimbursed DogeCoins at request.</b></p> 
<p>This is a site where you can chat along with like-minded shibes and also exchange DogeCoins with each other using your on-site balance.</p>
<p>Furthermore you can even earn <b>FREE DogeCoin rewards</b> just for being here and chatting. Auto-tips are given away to people periodically in the chat, so be sure to be active and contributing useful conversation to grab yours.</p>
<p><b>This is site is not a faucet</b>, though. We're here primarily to chat, not earn. If you are caught posting non-constructive comments or anything that breaks our rules you can have your earning privileges removed at any time.</p>
<h2>Helpful Info</h2>
<p>Different users sometimes have different coloured names. This is because they are some sort of moderation staff. Moderators will appear <span class="text-danger">red</span> and admins will appear <span class="text-primary">blue</span>.
<p>Different users sometimes have different coloured messages. This does NOT mean they are a mod. Anyone can purchase chat colours to make their messages look pretty and to contribute to this site. Please see the style menu for more.</p>
<h2>Rules</h2>
<ol>
<li>Respect other users and what they say</li>
<li>Do as you are told by moderators - their word is final</li>
<li>Do not spam, post ref-links or beg for DogeCoins</li>
<li>#Main is a child-friendly room - nothing that is NSFW</li>
</ol>
</div>
</div>
</div>
</div>
<div class="modal fade" id="modal-rooms">
<div class="modal-dialog">
<div class="modal-content">
<div class="modal-header">
<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
<h4 class="modal-title">Popular Rooms</h4>
</div>
<div class="modal-body">
<ul>
<li><a href="#" onclick="$('#modal-rooms').modal('hide');joinRoom('main');">#Main</a> - This is the water-cooler of DogeChat. Anyone and everyone is welcome to have a chat about general stuff</li>
<li><a href="#" onclick="$('#modal-rooms').modal('hide');joinRoom('dogecoin');">#DogeCoin</a> - For chatting about DogeCoin specific stuff we have a room all about DogeCoins!</li>
<li><a href="#" onclick="$('#modal-rooms').modal('hide');joinRoom('bot');">#Bot</a> - (Coming soon!) Fancy having some fun? Come look at our interactive chat bot with tonnes of cool features!</li>
<li><a href="#" onclick="$('#modal-rooms').modal('hide');joinRoom('arena');">#Arena</a> - (Coming soon!) Go head-to-head in a one-on-one battle with fellow chatters in the arena, with the chance to win DogeCoins!</li>
</ul>
</div>
</div>
</div>
</div>
<div class="modal fade" id="modal-colors">
<div class="modal-dialog">
<div class="modal-content">
<div class="modal-header">
<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
<h4 class="modal-title">Chat Colors</h4>
</div>
<div class="modal-body">
<p>You can purchase colors for you messages to appear in for 3000 DogeCoin below. Simply chose a 3-digit hexadecimal color code and click purchase.</p>
<p>Bare in mind that this website has a light and dark theme so you should make sure you chose a color that can be read whilst using either theme.</p>
<form id="color-form">
<div class="input-group">
<input class="form-control" type="text" value="f33" id="input-color" />
<span class="input-group-btn">
<input class="btn btn-info" type="submit" value="Purchase!" />
</span>
</div>
</form>
<div class="color-sample pull-left" style="margin: 20px 0; background-color: #eee; padding: 5px; border-top-left-radius: 5px; border-bottom-left-radius: 5px; color: #f33;">Light Theme</div>
<div class="color-sample pull-left" style="margin: 20px 0; background-color: #333; padding: 5px; border-top-right-radius: 5px; border-bottom-right-radius: 5px; color: #f33;">Dark Theme</div>
<div class="clearfix"></div>
<p>Select which colour you wish to use from below.</p>
<div id="my-colors"></div>
</div>
</div>
</div>
</div>
<audio id="mentioned-audio" src="notify.wav" preload="auto"></audio>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script src="//cdn.socket.io/socket.io-1.0.0.js"></script>
<script src="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>
<script src="script.js"></script>
<script>
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-54149989-1', 'auto');
ga('send', 'pageview');
</script>
</body>
</html>
