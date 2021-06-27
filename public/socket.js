socket.emit( "userconnected", username );

socket.on( 'yourturn', function(obj){
    let { clickedCol, tokenHeight, temp } = obj;

    let addedToken = $(`<div class='token'></div>`);

        if(temp=='y')
        {
            addedToken.addClass('yellow-token');
            grid[ tokenHeight][clickedCol] = 'y';
        }
        else
        {
            addedToken.addClass('red-token');
            grid[ tokenHeight][clickedCol] = 'r';
        }
    
    // turnCount++;
    $(`.row-${tokenHeight}-col-${clickedCol}`).append( addedToken );
    colHeight[clickedCol]++;
    turn = !turn;
    myturn =true;
} );

socket.on( 'win-modal', function({winnerModal, userlist}){
    setTimeout(() => {
            // console.log(list);
            winnerModal = `<div class='modal-container' >
                                <div class='winner-modal' >
                                    <div class='modal-text' >
                                        <span class='' >CONGRATULATIONS 😍🤩🎉!! ${ turn ? userlist[1].username : userlist[0].username} won </span>
                                    </div>
                                    <div class='modal-buttons' >
                                        <div class='button play-again-button' >PLAY AGAIN</div>
                                    </div>
                                </div>
                            </div>`
            $('.container').append(winnerModal);
        
        $('.play-again-button').click( function(){
            createNewGrid();
            $('.token').remove();
            $('.highlightedCells').removeClass('highlightedCells');
            gameEnded = false;
            turnCount = 0;
        } )
    }, 700);
} )

socket.on( 'highlight-cells', function(winningCells){
    for( let i=0; i<winningCells.length; ++i )
    {
        $(`.row-${winningCells[i].row}-col-${winningCells[i].column}`).addClass('highlightedCells')
    }
} )

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
socket.on('playagain', function(){
    createNewGrid();
    gameEnded = false;
    turnCount = 0;
    turn = true;
    myturn = true;
    $('.token').remove();
    $('.highlightedCells').removeClass('highlightedCells');
    $('.modal-container').remove();
})

socket.on( 'undo-move', function( lastmove ){
    let {row, col, clr} = lastmove;
    grid[row][col] = '-';
    $( `.row-${row}-col-${col} .token` ).remove();
    --turnCount;
    turn = !turn;
    colHeight[col]--;
    myturn = !myturn;
    undoAllowed = false;
    $('.undo-btn').css('cursor', 'not-allowed');
} )