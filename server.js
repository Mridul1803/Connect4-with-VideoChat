const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const {v4: uuidV4} = require('uuid')

let port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'))

let userlist = [];

app.get('/', (req, res)=>{
    res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res)=>{
    res.render( 'room', {roomId : req.params.room } )
})

io.on('connection', socket=>{
  let uid;
    socket.on('join-room', (roomId, userId, username)=>{
        
      let newobj = {id:userId, username:username};
      userlist.push( newobj );
      
        // console.log(roomId, userId);
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', ()=>{
            userlist = userlist.filter((user)=>{
              return user.id != userId;
            })
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
        })

      })

    socket.on( "userconnected", function(username){
      // console.log('hi');
    } )

    socket.on( 'move', function( obj){
        socket.broadcast.emit( 'yourturn', obj );
    } )

    socket.on( 'win', function(winnerModal){
      let tempobj = {winnerModal, userlist};
      // console.log(userlist)
      socket.broadcast.emit( 'win-modal', tempobj );
      socket.emit( 'user-win', userlist );
    } )

    socket.on( 'highlight', function(winningCells){
      socket.broadcast.emit( 'highlight-cells', winningCells );
    } )

    socket.on('play-again', function(){
      socket.broadcast.emit( 'playagain' );
    })

    socket.on('undo', function(lastmove){
      socket.broadcast.emit('undo-move', lastmove);
    })
})

server.listen(port);