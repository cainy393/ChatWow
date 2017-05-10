SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
CREATE DATABASE IF NOT EXISTS `shibechat` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `shibechat`;

DELIMITER //
CREATE PROCEDURE `addMessage`(
	IN rm VARCHAR(41),
	IN usern VARCHAR(20),
	IN timest TIMESTAMP,
	IN msg VARCHAR(500),
	IN reward INT(3),
	IN lvl INT(1)
)
BEGIN
	DECLARE msgCnt INT(2);
	INSERT INTO `messages` (`room`, `user`, `timestamp`, `msg`, `reward`, `level`) VALUES (rm, usern, timest, msg, reward, lvl);
	SELECT COUNT(*) INTO msgCnt FROM `messages` WHERE `room` = rm;
	IF msgCnt > 10 THEN
	SET msgCnt = msgCnt - 10;
	DELETE FROM `messages` WHERE `room` = rm ORDER BY `timestamp` LIMIT msgCnt;
	END IF;
END//
DELIMITER ;

CREATE TABLE IF NOT EXISTS `messages` (
	`id` int(11) NOT NULL,
	`user` varchar(20) NOT NULL,
	`msg` varchar(500) NOT NULL,
	`room` varchar(41) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`reward` int(3) NOT NULL DEFAULT '0',
	`level` int(1) NOT NULL DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 AUTO_INCREMENT=10001 ;

CREATE TABLE IF NOT EXISTS `transactions` (
	`id` int(5) NOT NULL,
	`user` varchar(20) NOT NULL,
	`amount` int(11) NOT NULL,
	`address` varchar(50) NOT NULL,
	`time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=latin1 AUTO_INCREMENT=10001 ;

CREATE TABLE IF NOT EXISTS `users` (
	`id` int(5) NOT NULL,
	`user` varchar(20) NOT NULL,
	`nice_name` varchar(20) NOT NULL,
	`email` varchar(200) NOT NULL,
	`level` int(1) NOT NULL DEFAULT '0',
	`whitelist` int(1) NOT NULL DEFAULT '0',
	`pass` varchar(60) NOT NULL,
	`session` varchar(64) NOT NULL,
	`balance` int(20) NOT NULL DEFAULT '0',
	`credited` int(20) NOT NULL DEFAULT '0',
	`address` varchar(50) NOT NULL,
	`colors` varchar(399) NOT NULL DEFAULT '000',
	`register_ip` varchar(15) NOT NULL,
	`latest_ip` varchar(15) NOT NULL
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=10001 ;


ALTER TABLE `messages`
 ADD PRIMARY KEY (`id`);

ALTER TABLE `transactions`
 ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `user` (`user`);


ALTER TABLE `messages`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=10001;
ALTER TABLE `transactions`
MODIFY `id` int(5) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=10001;
ALTER TABLE `users`
MODIFY `id` int(5) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=10001;