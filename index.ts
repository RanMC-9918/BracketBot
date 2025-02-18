import * as express from "express";
const app = express();

import path = require('path');

import { REST, Routes } from "discord.js"

import { Client, Events, GatewayIntentBits } from "discord.js"

import ejs from "ejs";


const port = 8080;


app.set('view engine', 'ejs');

app.use('/favicon.ico', express.static('views/images/favicon.ico'));

app.use(express.static(path.join(__dirname, "views")));

app.get("/", (req, res) => {
    res.render("home/index")   

})

app.get("/style.css", (req, res) => {
    res.sendFile(path.join(__dirname, "views/style.css"));
})

app.listen(port, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`Server is running http://localhost:8080`);
})
