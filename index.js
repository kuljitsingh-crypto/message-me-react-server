const http=require('http');
const express=require("express");
const socketio=require("socket.io");


const PORT=process.env.PORT || 5000;
const users={}
const router=require("./router");


const app=express();
const server=http.createServer(app);
const io=socketio(server,{
    cors:{
        origin:["https://messagme.netlify.app"],
        methods: ["GET", "POST"]
        
    }
});

io.on('connection',(socket)=>{
    socket.on("userSignIn",(data)=>{
        users[data.uid]=socket.id;
    })

    socket.on("friend-online",(data)=>{
        let userId=users[data.id];
        if(userId===undefined || userId===null){
            socket.emit("friend-online-res",{status:false})
        }
        else{
            socket.emit("friend-online-res",{status:true})
        }
    })
    socket.on("message",(data)=>{
        let recevierId=data.to;
        let recevierSocketId=users[recevierId];
        if(recevierSocketId!==undefined && recevierSocketId !==null){
            let senderId=data.from;
            let senderSocketId=users[senderId];
            io.to(senderSocketId).emit("message-sent",data);
            io.to(recevierSocketId).emit("private-message",data); 
        }
        
    })
    socket.on("receive-msg",(data)=>{

        let senderId=data.to;
        let senderSocketId=users[senderId];
        (senderSocketId!==undefined && senderSocketId!==null) && io.to(senderSocketId).emit("receive-private-msg",data);
    })
    
    socket.on("disconnect",()=>{
        for(const id in users){
            if(users[id]===socket.id){
                delete users[id];
            }
        }
        io.emit("friendSignOut",users)
    })
    socket.on("group-msg",(data)=>{
        data.to.forEach((recevierId)=>{
            if(users[recevierId]!==undefined && users[recevierId]!==null){
                let recevierSocketId=users[recevierId]
                io.to(recevierSocketId).emit("private-group-msg",{from:data.from,msgId:data.msgId,msgs:data.msgs,msgrName:data.msgrName,
                                                msgTime:data.msgTime,photoURL:data.photoURL,to:recevierId,grpId:data.grpId,isImg:data.isImg,
                                            imgUrl:data.imgUrl})
            }
        })
        let senderSocketId=users[data.from];
        io.to(senderSocketId).emit("group-msg-sent",{status:true,id:data.msgId})
    })
    socket.on("receive-private-group-msg",(data)=>{
        let senderSocketId=users[data.id]
        if(senderSocketId!==null && senderSocketId!==undefined){
            io.to(senderSocketId).emit("group-msg-receive",data);
        }
    })
    socket.on("new-group",(data)=>{
        let recevierSocketId=users[data.to];
        if(recevierSocketId!==null && recevierSocketId!==undefined){
            io.to(recevierSocketId).emit("new-group-msg",data);
        }
    })
    socket.on("admin-msg",(data)=>{
        let recevierSocketId=users[data.recevrId];
        if(recevierSocketId!==null && recevierSocketId!==undefined){
            io.to(recevierSocketId).emit("sent-admin-msg",data);
        }
    })
})


app.use(router);


server.listen(PORT,()=>console.log(`Server has started on ${PORT}...`))