const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const { title } = require("process");

const app=express();
const server=http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players={};
let currentPlayer="W";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
    res.render("index",{title:"Chess Game"});
});

io.on("connection",function(uniquesocket){
    console.log("connected");
    
    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }else if(!players.black){
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }else{
        uniquesocket.emit("spectatorRole");
    }
    
    uniquesocket.on("disconnect",function(){
        if(uniquesocket.id===players.white){
            delete players.white;
        }else{
            delete players.black;
        }
    })
});

uniquesocket.on("move",(move)=>{
    try{
        if(chess.turn()=="w" && uniquesocket.id!=players.white) return;
        if(chess.turn()=="b" && uniquesocket.id!=players.black) return;

        const result = chess.move(move);
        if(result){
            currentPlayer=chess.turn();
            io.emit("move",move);
            io.emit("boardstate",chess.fen());
        }else{
            console.log("Invalid move : ", move);
            uniquesocket.emit("Invalid move : ",move);
        }
    }catch(err){//engine fails to process the move 
        console.log(err);
        uniquesocket.emit("Invalid move : ",move);
    }
})




server.listen(3000, function (){
    console.log("listening on port 3000");
});
