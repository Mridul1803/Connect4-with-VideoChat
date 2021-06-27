// const socket = io('/');
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer();

const myVideo = document.createElement('video')
myVideo.muted = true;

let myVideoStream;

let username = prompt('Enter your name : ');

for( let i=7; i>=0; --i)
{
    let row = $(`<div class='row row-${i}'></div>`);
    for( let j=0; j<=7; ++j)
    {
        row.append( $(`<div class="cell row-${i}-col-${j}"></div>`) );
    }
    $('.cell-container').append(row);
}


const peers={}
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream =>{
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    myPeer.on('call', call=>{
        call.answer(stream); 

        const video = document.createElement('video');
        call.on('stream', userVideoStream=>{
            addVideoStream(video, userVideoStream);
        })
    })

    socket.on('user-connected', userId =>{
        connectToNewUser(userId, stream)
    })
})

socket.on('user-disconnected', userId=>{
    if(peers[userId])
        peers[userId].close();
})

myPeer.on('open', id=>{
    socket.emit('join-room', ROOM_ID, id, username);
})

function connectToNewUser(userId, stream){
    const call = myPeer.call( userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream( video, userVideoStream )
    })
    call.on('close', ()=>{
        video.remove();
    })

    peers[userId] = call
}

function addVideoStream(video, stream){
    video.srcObject = stream
    video.addEventListener('loadedmetadata', ()=>{
        video.play();
    })
    videoGrid.appendChild(video);
}

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      setUnmuteButton();
    } else {
      setMuteButton();
      myVideoStream.getAudioTracks()[0].enabled = true;
    }
  };
  
  const setMuteButton = () => {
    const html = `<span class="material-icons mic-on">mic</span>`;
    document.querySelector(".mic-button").innerHTML = html;
  };
  
  const setUnmuteButton = () => {
    const html = `<span class="material-icons mic-off">mic_off</span>`;
    document.querySelector(".mic-button").innerHTML = html;
  };

const muteUnmuteVideo = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getVideoTracks()[0].enabled = false;
      setUnmuteVideoButton();
    } else {
      setMuteVideoButton();
      myVideoStream.getVideoTracks()[0].enabled = true;
    }
  };
  
  const setMuteVideoButton = () => {
    const html = '<span class="material-icons video-on">videocam</span>';
  
    document.querySelector(".video-button").innerHTML = html;
  };
  
  const setUnmuteVideoButton = () => {
    const html = '<span class="material-icons video-on">videocam_off</span>';
  
    document.querySelector(".video-button").innerHTML = html;
  };


//GRID CREATION
let grid = new Array(8);
for( let i=0; i<grid.length; ++i)
{
    grid[i] = new Array(8);
}
let gameEnded = false;
let turn=true;
let myturn = true;
let turnCount=0;
let colHeight = [];
let lastMove = {};
let undoAllowed = false;

createNewGrid();
function createNewGrid()
{
    for(let i=0; i<grid.length; ++i)
    {
        for( let j=0; j<grid.length; ++j)
        {
            grid[i][j] = '-';
        }
    }
    for(let i=0; i<grid.length; ++i)
    {
        colHeight[i] = 0;
    }
}

// console.log(colHeight);

$('.cell').click( function(){

    let clickedCol = $(this).attr('class').split(" ")[1].split("-")[3];

    if( myturn && !gameEnded && colHeight[clickedCol] < 8 )
    {
        // console.log(turnCount);
        let tokenHeight = colHeight[clickedCol];
        let addedToken = $(`<div class='token'></div>`);

        // console.log(turn);
        if(turn)
        {
            addedToken.addClass('yellow-token');
            grid[ tokenHeight][clickedCol] = 'y';
        }
        else
        {
            addedToken.addClass('red-token');
            grid[ tokenHeight][clickedCol] = 'r';
        }

        $(`.row-${tokenHeight}-col-${clickedCol}`).append( addedToken );
        let temp = turn?'y':'r';
        myturn = false;
        socket.emit( "move", { clickedCol, tokenHeight, temp } )
        
        colHeight[clickedCol]++;
        ++turnCount;
        turn = !turn;
        undoAllowed = true;
        $('.undo-btn').css('cursor','pointer')

        updateLastMove( tokenHeight, Number(clickedCol) );
        
        if( checkforwin( tokenHeight, parseInt(clickedCol) ) )
        {
            gameEnded = true;
            let winnerModal;
            socket.on( 'user-win', function(userlist){
                
                winnerModal = `<div class='modal-container' >
                                    <div class='winner-modal' >
                                        <div class='modal-text' >
                                            <span class='' >CONGRATULATIONS 😍🤩🎉!!</span>
                                            <span> ${ turn ? userlist[1].username : userlist[0].username} won </span>
                                        </div>
                                        <div class='modal-buttons' >
                                            <div class='button play-again-button' >PLAY AGAIN</div>
                                        </div>
                                    </div>
                                </div>`
            } )
            setTimeout(() => {
                    $('.container').append(winnerModal);
                
                $('.play-again-button').click( function(){
                    createNewGrid();
                    $('.token').remove();
                    $('.highlightedCells').removeClass('highlightedCells');
                    gameEnded = false;
                    turnCount = 0;
                    turn = true;
                    myturn = true;
                    socket.emit('play-again');
                } )
            }, 700);
            socket.emit( "win", winnerModal);
        }
        // else if( turnCount == 64 )
        // {
        //     gameEnded = true;
        //     let drawModal = `<div class='modal-container' >
        //                             <div class='draw-modal' >
        //                                 <div class='modal-text' >
        //                                     <span class='' >OOPS !! Game ended in a DRAW 😕</span>
        //                                 </div>
        //                                 <div class='modal-buttons' >
        //                                     <div class='button play-again-button' >PLAY AGAIN</div>
        //                                 </div>
        //                             </div>
        //                         </div>`
        //     setTimeout(() => {
        //         $('.container').append(drawModal);
        //         $('.modal-container').click( function(){
        //             $('.modal-container').remove();
        //         } )

        //         $('.play-again-button').click( function(){
        //             createNewGrid();
        //             $('.token').remove();
        //             gameEnded = false;
        //             turnCount = 0;
        //         } )

        //     }, 700);   
        // }
    }
} )

function updateLastMove(row, col)
{
    lastMove.row = row;
    lastMove.col = col;
    lastMove.color = turnCount%2==0 ?'r' : 'y';
}

$('.undo-btn').click( function(){
    if(undoAllowed)
    {
        let {row, col, color} = lastMove;
        grid[row][col] = '-';
        $( `.row-${row}-col-${col} .token` ).remove();
        --turnCount;
        colHeight[col]--;
        myturn = !myturn;
        turn = !turn;
        undoAllowed = false;
        $('.undo-btn').css('cursor', 'not-allowed');
        let newobj = {row, col, color};
        socket.emit( 'undo', newobj );
    }
} )

//undo redo
//reset
$('.reset-btn').click( function(){
    let resetModal = `<div class='modal-container' >
                        <div class='reset-modal' >
                            <div class='modal-text' >
                                <span> Are you sure ? Your current progress would be lost. </span>
                            </div>
                            <div class='modal-buttons' >
                                <div class='button reset-button' >RESET</div>
                                <div class='button cancel-button' > CANCEL </div>
                            </div>
                        </div>
                    </div>`
    $('.container').append(resetModal);

    $('.reset-button').click( function(){
        createNewGrid();
        $('.token').remove();
        gameEnded = false;
        turnCount = 0;
        turn = true;
        myturn = true;
        $('.highlightedCells').removeClass('highlightedCells');
        $('.modal-container').remove(); 
        socket.emit('play-again');
    } )
    
    $('.cancel-button').click( function(){
        $('.modal-container').remove();
    } )
    
} )

$('.add-btn').click( function(){
    prompt('Copy this link to invite friends !', `${ $(location).attr('href') }`);
} )

function checkforwin( row, col )
{
    let winningCells = [];
    
    let token = $(`.row-${row}-col-${col}`).children()[0];

    let count = 0;
    let color = grid[row][col];

    //vertically down
    winningCells.push( {row:row, column:col} );
    for( let i=row-1; i>=0; --i)
    {
        if( grid[i][col] == color )
        {
            ++count;
            winningCells.push( {row:i, column:col} );
        }    
        else
            break;
    }

    if(count==3)
    {
        // console.log(winningCells);
        highlightCells(winningCells);
        return true;
    }
    else{
        count=0;
    }

    //horizontally left
    for( let j=col-1; j>=0; --j)
    {
        if( grid[row][j] == color )
            ++count;
        else
            break;
    }

    //horizontally right
    for( let j=col+1; j<=grid.length; ++j)
    {
        if( grid[row][j] == color )
            ++count;
        else
            break;
    }

    if(count==3)
        return true;
    else
        count=0;

    //diagonally top-right
    for( let i=row+1,j=col+1; i<grid.length && j<grid.length; ++j, ++i)
    {
        if( grid[i][j] == color )
            ++count;
        else
            break;
    }
    //diagonally bottom-left
    for( let i=row-1,j=col-1; i>=0 && j>=0; --j, --i)
    {
        if( grid[i][j] == color )
            ++count;
        else
            break;
    }

    if( count==3 )
        return true;
    else
        count=0;


    //diagonally top-left
    for( let i=row+1,j=col-1; i<grid.length && j>=0; --j, ++i)
    {
        if( grid[i][j] == color )
            ++count;
        else
            break;
    }
    //diagonally bottom-right
    for( let i=row-1,j=col+1; i>=0 && j<grid.length; ++j, --i)
    {
        if( grid[i][j] == color )
            ++count;
        else
            break;
    }

    if(count==3)
        return true;
    else
        count=0;

    return false;
}

function highlightCells(winningCells)
{
    for( let i=0; i<winningCells.length; ++i )
    {
        $(`.row-${winningCells[i].row}-col-${winningCells[i].column}`).addClass('highlightedCells')
    }
    socket.emit('highlight', winningCells);
}