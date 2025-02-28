import * as express from "express";
const app = express();

import path = require('path');

import { REST, Routes, SlashCommandBuilder} from "discord.js"

import { Client, Events, GatewayIntentBits } from "discord.js"

import ejs from "ejs";
import { register } from "module";

import enviornment = require("dotenv");
enviornment.config();


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



function mapPlayers(players: string[], matchups: boolean[], matchupsPlayed: number) {
    let mappedPlayers: string[][] = [players, []];
    let rowCursor = 1;
    
    for (let i = 0; i <= matchupsPlayed; i++) {
        if (mappedPlayers[rowCursor].length >= mappedPlayers[rowCursor-1].length/2){
            rowCursor++;
            mappedPlayers.push([]);
        }
        if (matchups[i]) {
        mappedPlayers[rowCursor].push(
          mappedPlayers[rowCursor - 1][mappedPlayers[rowCursor].length * 2 + 1]
        );
        } else {
        mappedPlayers[rowCursor].push(
          mappedPlayers[rowCursor - 1][mappedPlayers[rowCursor].length * 2]
        );
        }
    }

    console.log(mappedPlayers)
    return mappedPlayers;

}

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
        .addIntegerOption(
            option =>
            option.setName("players")
            .setDescription("The number of players in the bracket")
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
              "Bracket created at " + "http://localhost:8080/brackets/" + id
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


            const message = await interaction.followUp({content: "Join by reacting 🤚\nStart early by reacting ➡️ (only the owner)", fetchReply: true});
            
            await message.react("🤚");
            await message.react("➡️")

            bracketThreads.push({
                bracketId: id,
                messageId: message.id
            });
            
            break; 
    }
});

bot.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    console.log(user.username)

    const bracketThread = bracketThreads.find(thread => thread.messageId === reaction.message.id);
    const bracket = brackets.find(bracket => bracket.id == bracketThread.bracketId);
    bracket.players.push(user.username);
    bracket.matchups.push(false);

    reaction.message.channel.isSendable() && reaction.message.channel.send(`<@${user.id}> has joined the bracket.`);

})

bot.login(token);

