const Discord = require('discord.js');
const ytdl = require('ytdl-core');
var fs = require("fs");

const botDetails = require('./botDetails.js');

var settings = JSON.parse(fs.readFileSync('./settings.json', 'utf8'));

const client = new Discord.Client();
const broadcast = client.createVoiceBroadcast();
const streamOptions = {seek: 0, volume: 0.1};
const halos = ["https://www.youtube.com/watch?v=sCxv2daOwjQ", "https://www.youtube.com/watch?v=svdR8_w1N0Y", "https://www.youtube.com/watch?v=vUBiRXXwqdI", "https://www.youtube.com/watch?v=mUD9dX0aNBs", "https://www.youtube.com/watch?v=7W5TvaBdNJc"];
const haloNames = ["test"];
const stream = ytdl(halos[0], {filter : 'audioonly'});
var i = 0;

function convertSeconds(seconds) {
	var secondsConv = seconds % 60;
	var mins = Math.floor(seconds / 60);
	var hours = Math.floor(mins / 60);

	return `${hours ? hours + ":": ""}${mins + ":" ? mins : ""}:${secondsConv ? secondsConv : ""}`;
}

function joinChannel(guildID) {
	client.channels.get(settings[guildID].voiceChannelID).join()
	.then(connection => {
		const dispatcher = connection.playBroadcast(broadcast);

		client.channels.get(settings[guildID].textChannelID).fetchMessage(settings[guildID].msgID)
		.catch(err => {
			return client.channels.get(settings[guildID].textChannelID).send("*loading...*");
		})
		.then(msg => {
			settings[msg.guild.id].msgID = msg.id;

			fs.writeFile("settings.json", JSON.stringify(settings, null, '\t'), 'utf8', err => {
				if (err) throw err;
			});

			ytdl.getInfo(halos[i], function(err, info) {
				var embed = new Discord.RichEmbed({});
					embed.setAuthor(info.title, info.thumbnail_url, undefined);
					embed.setColor("RED");
					embed.setTimestamp();
					embed.addField("__Duration (m:s)__", convertSeconds(info.length_seconds), false);
					embed.addField("__View count__", info.view_count.toLocaleString('en'), true);
					embed.addField("__User rating__", parseFloat(info.avg_rating).toFixed(2), true);

				msg.edit({embed: embed});
			})
		})
		.then(msg => console.log(`Updated description`))
		.catch(console.error);
		console.log(`Playing Halo ${haloNames[i]}`);
		
		dispatcher.on("end", end => {
			if(halos[++i]) repeat();
			else {
				i = 0;
				repeat();
			}
		});
	})
	.catch(err => {
		console.log(err);
	});
}


client.on('ready', () => {
	broadcast.playStream(stream);
client.user.setAvatar("D:\\Users\\louis\\Documents\\halo-bot.png");
	for(var guildID in settings) {
		console.log(settings[guildID].voiceChannelID);

		if(!client.channels.get(settings[guildID].textChannelID)) {
			delete settings[guildID]
			continue
		}

		if(!client.channels.get(settings[guildID].voiceChannelID)) {
			client.channels.get(settings[guildID].textChannelID).send(`Cannot find voice channel!`);
			continue
		};

		joinChannel(guildID);
	}
});

client.on('message', msg => {
	if(msg.content.startsWith("addchannel")) {
		if(settings[msg.guild.id]) {
			msg.channel.send(`A channel has already been set for this server!`);
			return;
		}

		if(!msg.member.voiceChannel) {
			msg.channel.send(`Please join a voice channel!`);
			return;
		}

		settings[msg.guild.id] = {
			"voiceChannelID": msg.member.voiceChannel.id,
			"textChannelID": "",
			"msgID": ""
		}

		msg.channel.send(`*loading*`)
		.then(msg => {
			settings[msg.guild.id].textChannelID = msg.channel.id;
			settings[msg.guild.id].msgID = msg.id;

			fs.writeFile("settings.json", JSON.stringify(settings, null, '\t'), 'utf8', err => {
				if (err) throw err;
			});

			joinChannel(msg.guild.id);
		})

	}
});


// login bot
client.login(botDetails.botToken)
.catch(() => {
	setTimeout(function() {
		process.exit();
	}, 10000);
});
