const http=require('http');
const express=require("express");
const socketio=require("socket.io");


const PORT=process.env.PORT || 5000;
const users={}
const router=require("./router");
const {encryptMsg,decryptMsg}=require('./encrypt');


const app=express();
const server=http.createServer(app);
const io=socketio(server,{
    cors:{
        origin:["https://messagmee.netlify.app","http://localhost:3000"],
        methods: ["GET", "POST"]
        
    }
});

io.on('connection',(socket)=>{
    socket.on("userSignIn",(incomingData)=>{
        let data=JSON.parse(decryptMsg(incomingData))
        users[data.uid]=socket.id;
    })

    socket.on("disconnect",()=>{
        for(const id in users){
            if(users[id]===socket.id){
                delete users[id];
            }
        }
        io.emit("friendSignOut",encryptMsg(JSON.stringify({...users})))
    })

    socket.on("friend-online",(incomingData)=>{
        let data=JSON.parse(decryptMsg(incomingData))
        let userId=users[data.id];
        if(userId===undefined || userId===null){
            socket.emit("friend-online-res",encryptMsg(JSON.stringify({status:false})))
        }
        else{
            socket.emit("friend-online-res",encryptMsg(JSON.stringify({status:true})))
        }
    })
    socket.on("message",(incomingData)=>{
        let decryptedData=JSON.parse(decryptMsg(incomingData))
        let data=JSON.parse(decryptMsg(decryptedData.extra));
        let recevierId=data.to;
        let recevierSocketId=users[recevierId];
        if(recevierSocketId!==undefined && recevierSocketId !==null){
            io.to(recevierSocketId).emit("private-message",incomingData); 
        }
        let senderId=data.from;
        let senderSocketId=users[senderId];
        if(senderSocketId!==undefined && senderSocketId!==null){
            io.to(senderSocketId).emit("message-sent",encryptMsg(JSON.stringify({...data})));
        }
           
    })
    socket.on("receive-msg",(incomingData)=>{
        let decryptedData=JSON.parse(decryptMsg(incomingData))
        let data=JSON.parse(decryptMsg(decryptedData.extra))
        let senderId=data.to;
        let senderSocketId=users[senderId];
        (senderSocketId!==undefined && senderSocketId!==null) && io.to(senderSocketId).emit("receive-private-msg",incomingData);
    })
    
    socket.on("group-msg",(incomingData)=>{
        let decryptedData=JSON.parse(decryptMsg(incomingData))
        let data=JSON.parse(decryptMsg(decryptedData.extra));
        data.to.forEach((recevierId)=>{
            if(users[recevierId]!==undefined && users[recevierId]!==null){
                let recevierSocketId=users[recevierId]
                io.to(recevierSocketId).emit("private-group-msg",incomingData)
            }
        })
        let senderSocketId=users[data.from];
        if(senderSocketId!==undefined && senderSocketId!==null){
            io.to(senderSocketId).emit("group-msg-sent",encryptMsg(JSON.stringify({status:true,...data})))
        }
        
    })
    
    socket.on("receive-private-group-msg",(incomingData)=>{
        let decryptedData=JSON.parse(decryptMsg(incomingData))
        let data=JSON.parse(decryptMsg(decryptedData.extra));
        let senderSocketId=users[data.id]
        if(senderSocketId!==null && senderSocketId!==undefined){
            io.to(senderSocketId).emit("group-msg-receive",incomingData);
        }
    })
    socket.on("new-group",(incomingData)=>{
        let decryptedData=JSON.parse(decryptMsg(incomingData))
        let data=JSON.parse(decryptMsg(decryptedData.extra));
        let recevierSocketId=users[data.to];
        if(recevierSocketId!==null && recevierSocketId!==undefined){
            io.to(recevierSocketId).emit("new-group-msg",incomingData);
        }
    })
    socket.on("admin-msg",(incomingData)=>{
        let decryptedData=JSON.parse(decryptMsg(incomingData))
        let data=JSON.parse(decryptMsg(decryptedData.extra));
        let recevierSocketId=users[data.recevrId];
        if(recevierSocketId!==null && recevierSocketId!==undefined){
            io.to(recevierSocketId).emit("sent-admin-msg",incomingData);
        }
    })
    
})


app.use(router);


server.listen(PORT,()=>console.log(`Server has started on ${PORT}...`))