import * as express from "express";
const app = express();

import path = require('path');

import { REST, Routes } from "discord.js"

import { Client, Events, GatewayIntentBits } from "discord.js"

import ejs from "ejs";


const port = 8080;

interface bracket {
    id: number;
    title: string;
    players: string[];
    matchupsPlayed: number;
    matchups: boolean[];
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
  matchupsPlayed: 3,
  matchups: [false, false, false, false, false, false, false],
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
    return mappedPlayers;

}