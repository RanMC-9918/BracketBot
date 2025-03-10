import * as express from "express";
const app = express();

import path = require('path');

import { REST, Routes, SlashCommandBuilder} from "discord.js"

import { Client, Events, GatewayIntentBits } from "discord.js"

import ejs from "ejs";
import { register } from "module";

import enviornment = require("dotenv");
import { match } from "assert";
enviornment.config();

const urlOrigin = process.env.origin || "http://localhost:8080";

const port = 8080;

interface bracket {
    id: number;
    title: string;
    players: string[];
    matchupsPlayed: number;
    matchups: boolean[];
    ownerId: string;
}

let brackets: bracket[] = [];

brackets.push({
  id: 1,
  title: "Collio",
  players: [
    "Player 1",
    "Player 2",
    "Player 3",
    "Player 4",
    "Player 5",
    "Player 6",
    "Player 7",
    "Player 8",
  ],
  matchupsPlayed: 6,
  matchups: [false, false, false, false, false, false, false],
  ownerId: '723619381958934569',
});


app.set('view engine', 'ejs');

app.use('/favicon.ico', express.static('views/images/favicon.ico'));

app.use(express.static(path.join(__dirname, "views")));

app.get("/", (req, res) => {
    res.render("home/index")   

})

app.get("/style.css", (req, res) => {
    res.sendFile(path.join(__dirname, "views/home/style.css"));
})


app.get("/brackets/:id", (req, res) => {
    const id = req.params.id;
    let index = -1;
    brackets.forEach((bracket, i) => {
        if(Number(id) === bracket.id){
            index = i;
            return;
        }
    })
    if(index === -1){
        res.status(404).render("couldnotfind/index");
        return;
    }
    else{
        res.render("brackets/index", {
            title: brackets[index].title,
            players: brackets[index].players,
            matchupsPlayed: brackets[index].matchupsPlayed,
            matchups: brackets[index].matchups,
            mappedPlayers: mapPlayers(brackets[index].players, brackets[index].matchups, brackets[index].matchupsPlayed)
        });
    }

})

//DISCORD

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

app.listen(port, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`Server is running http://localhost:8080`);
})



//DISCORD

const botID = "1345091131368673281";
const guildID = "1245922280991883294";
const token = process.env.TOKEN;

const rest = new REST().setToken(token);

const commands = [
    {
        name: "ping-dev",
        description: "mentions the developer.",
    },
    new SlashCommandBuilder()
        .setName("create-bracket")
        .setDescription("Creates a bracket")
        .addStringOption(
            option => 
            option.setName("title")
            .setDescription("The title of the bracket")
            .setRequired(true)
        )
]

const registerCommands = async () => {
    try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(
            Routes.applicationGuildCommands(botID, guildID),
            { body: commands },
        );

        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
}

registerCommands();

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

bot.on("ready", () => {
    console.log("Bot is ready.");
});

interface bracketThread {
    bracketId: number;
    messageId: string;
}

let bracketThreads: bracketThread[] = []

bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    switch (commandName) {
        case "ping-dev":
            await interaction.reply("@RanMC9918 hello");
            break;

        case "create-bracket":
            const id = Math.floor(Math.random() * 100000);

            
            await interaction.reply(
              "New bracket called *" + interaction.options.get("title").value + "* created at " + urlOrigin + "/brackets/" + id
              + "\nThank you for using our service."
            );

            brackets.push({
                id: id,
                title: String(interaction.options.get("title").value),
                players: [],
                matchupsPlayed: 0,
                matchups: [],
                ownerId: interaction.user.id
            });


            const message = await interaction.followUp({content: 
                "Join by reacting 🤚\nStart by reacting ➡️ (only the owner)"
                , fetchReply: true});
            
            await message.react("🤚");
            await message.react("➡️")

            bracketThreads.push({
                bracketId: id,
                messageId: message.id
            });

            console.log(brackets);
            
            break; 
    }
});

bot.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    console.log(user.username)

    if(reaction.emoji.name == "➡️"){

        const bracketThread = bracketThreads.find(
          (thread) => thread.messageId === reaction.message.id
        );

        const bracket = brackets.find(
          (bracket) => bracket.id == bracketThread.bracketId
        );

        if(user.id !== bracket.ownerId){
            reaction.message.channel.isSendable() &&
              reaction.message.channel.send(
                `<@${user.id}> You are not the owner of this bracket.`
              );
            return;
        }

        if(bracket.players.length < 2){

            bracket.players.push("Friend 1")
            bracket.players.push("Friend 2");
            bracket.players.push("Friend 3");
            bracket.players.push("Friend 4");

            bracket.matchups.push(false);
            bracket.matchups.push(false);
            bracket.matchups.push(false);
            bracket.matchups.push(false);

            // reaction.message.channel.isSendable() &&
            //   reaction.message.channel.send(
            //     `<@${user.id}> There needs to be at least 2 players in a bracket.`
            //   );
            // return;
        }

        if(bracket.matchupsPlayed > 0){
            reaction.message.channel.isSendable() &&
              reaction.message.channel.send(
                `<@${user.id}> The bracket has already started.`
              );
            return;
        }

        if(Math.log(bracket.players.length)/Math.log(2) % 1 !== 0){
            while(Math.log(bracket.players.length)/Math.log(2) % 1 !== 0){
                bracket.players.push("Bye");
                bracket.matchups.push(false);
            }
        }

        bracket.matchups.pop();
        runMatchup(bracket, reaction.message.channel);
        
    }

    if(reaction.emoji.name == "🤚"){

        const bracketThread = bracketThreads.find(
          (thread) => thread.messageId === reaction.message.id
        );

        const bracket = brackets.find(
          (bracket) => bracket.id == bracketThread.bracketId
        );

        if(bracket.players.includes(user.username)){
            reaction.message.channel.isSendable() &&
              reaction.message.channel.send(
                `<@${user.id}> You are already in the bracket.`
              );
            return;
        }

        if(bracket.matchupsPlayed > 0){
            reaction.message.channel.isSendable() &&
              reaction.message.channel.send(
                `<@${user.id}> The bracket has already started.`
              );
            return;
        }

        bracket.players.push(user.username);

        bracket.matchups.push(false);

        reaction.message.channel.isSendable() &&
            reaction.message.channel.send(
            `<@${user.id}> has joined the bracket.`
            );

    }

    


})

async function runMatchup(bracket:bracket, channel: any){
    if(!channel.isSendable()){
        return;
    }

    let map = mapPlayers(bracket.players, bracket.matchups, bracket.matchupsPlayed);

    await channel.send(`[Next Matchup](${urlOrigin}/brackets/${bracket.id})\n${getCurrentMatchup(map)[0]} vs ${getCurrentMatchup(map)[1]}`);
}

function getCurrentMatchup(mappedPlayers: string[][]){
    if (mappedPlayers.length > 1 && mappedPlayers[mappedPlayers.length-1].length == mappedPlayers[mappedPlayers.length-2].length/2) {
          return [mappedPlayers[mappedPlayers.length-1][0], mappedPlayers[mappedPlayers.length-1][1]]
    } 
    else { 
        return [mappedPlayers[mappedPlayers.length-2][2 * mappedPlayers[mappedPlayers.length-1].length],
          mappedPlayers[mappedPlayers.length-2][2 * mappedPlayers[mappedPlayers.length-1].length + 1]]
    }

}

function mapPlayers(
  players: string[],
  matchups: boolean[],
  matchupsPlayed: number
) {
  let mappedPlayers: string[][] = [players, []];
  let rowCursor = 1;

  if(matchupsPlayed === 0){
        return mappedPlayers;
}

  for (let i = 0; i <= matchupsPlayed; i++) {
    if (matchups[i]) {
      mappedPlayers[rowCursor].push(
        mappedPlayers[rowCursor - 1][mappedPlayers[rowCursor].length * 2 + 1]
      );
    } else {
      mappedPlayers[rowCursor].push(
        mappedPlayers[rowCursor - 1][mappedPlayers[rowCursor].length * 2]
      );
    }
    if (
      mappedPlayers[rowCursor].length >=
      mappedPlayers[rowCursor - 1].length / 2
    ) {
      rowCursor++;
      mappedPlayers.push([]);
    }
  }

  console.log(mappedPlayers);
  console.log(players);
console.log(matchups);
  console.log(matchupsPlayed);
  return mappedPlayers;
}

bot.login(token);

