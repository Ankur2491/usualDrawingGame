var socket = io.connect("http://34.171.54.43:4000");
var showCanvas = false;
var showViewerCanvas = false;
var showcreateJoin = false;
var $joinRoom = $("#joinRoom");
var chosenWord;
var currentDrawer;
var secsRemaining;
var $roomJoinId = $("#roomJoinId")
function joinRoom() {
  let roomId = $("#roomJoinId").val();
  if (roomId == undefined || roomId.length == 0) {
    alert('please enter a room id to join!');
  }
  else {
    $("#joinRoom").hide();
    $("#createRoom").hide();
    // showCanvas = true;
    // setup();
    socket.emit('join_room', roomId, (data) => {
      if (data) {
        console.log('joined!!');
      }
    })
  }
}

function createRoom() {
  let roomId = $("#createRoomId").val();
  if (roomId == undefined || roomId.length == 0) {
    alert('please enter a valid room id!');
  }
  else {
    $("#createRoom").hide();
    $("#joinRoom").hide();
    // showCanvas = true;
    // setup();
    socket.emit('new_room', roomId, (data) => {
      if (data) {
        console.log("new room created");
      }
    });
  }
}

function startGame() {
  $("#startGame").hide();
  socket.emit('pick_drawer', $("#createRoomId").val(), (cb) => {
    console.log(cb);
  });
}

function setUserName() {
  let userName = $("#userName").val();
  if (userName == undefined || userName.length == 0) {
    alert('please enter a valid user name!');
  }
  else {
    socket.emit('new_user', userName, (data) => {
      if (data) {
        $("#createUser").hide();
        $("#joinRoom").show();
        $("#createRoom").show();
        alert("\"" + userName + "\" created successfully!!");
      }
    });

  }
}

function setup() {
  if (showCanvas) {
    createCanvas(710, 400);
    background(102);
    clearButton = createButton("clear");
    clearButton.mouseClicked(clearScreen);
  }
}

// function viewerSetup() {
//   if (showViewerCanvas) {
//     createCanvas(710, 400);
//     background(102);
//   }
// }

function draw() {
  if (mouseIsPressed === true && socket.id == currentDrawer) {
    // socket.emit('check_drawer', socket.id, (res) => {
    //   if (res) {
    socket.emit('drawing', [mouseX, mouseY, pmouseX, pmouseY])
    // console.log(mouseX, mouseY, pmouseX, pmouseY)
    stroke(255);
    line(mouseX, mouseY, pmouseX, pmouseY);
  }
  // });

}
function clearScreen() {
  if(socket.id == currentDrawer){
  clear();
  background(102);
  socket.emit("clearAll", {});
  }
}

function clearedFromServer() {
  clear();
  background(102);
}

function guessTheAnswer(e) {
  let str = e.target.value;
  if (chosenWord.toLowerCase() == str.toLowerCase()) {
    let html = `<p>You guessed it right!! <b style="color:green;">${chosenWord}</b> is the word!!</p><br/><p>Time Taken: ${45-secsRemaining} secs.</p>`
    $("#isCorrect").html(html);
    $("#isCorrect").show();
    let obj = {"userName":$("#userName").val(),"roomId": $("#roomJoinId")}
    socket.emit("correct_guess",obj);
  }
}

$(function () {
  $("#joinRoom").hide();
  $("#createRoom").hide();
  $('#roomArea').hide();
  $('#startGame').hide();
  $('#chooserArea').hide();
  $("#guessArea").hide();
  $("#isCorrect").hide();
  $("#wordDetails").hide();
  $("#correctGuesses").hide();
  $("#timer").hide();
  socket.on("setHost", (data) => {
    let roomId = $("#createRoomId").val() || $("#roomJoinId").val()
    let users = data['userRoom'][roomId];
    if (users && users.includes(socket.id)) {
      hostLabel = document.getElementById('hostLabel');
      hostLabel.innerHTML = '<p><b>Host:</b>' + data.socketName + '</p>';
    }
  });
  socket.on("currentUsers", (data) => {
    if (data.length <= 1) {
      $('#startGame').hide();
      $('#roomArea').hide();
    }
    else {
      var html = '';
      for (i = 0; i < data.length; i++) {
        html += '<li style="padding-right: 10em;" class="list-group-item chat-users">' + data[i] + '</li>';
      }
      $('#users').html(html)
      $('#roomArea').show();
    }
  })
  socket.on("start_game", (data) => {
    if (data == socket.id) {
      $('#startGame').show();
    }
  });
  socket.on("currentDrawer", (data) => {
    if(!showCanvas){
    showCanvas = true;
    setup();
    }
    currentDrawer = data.socketId;
    var html = '';
    if (data.socketId == socket.id) {
      html += '<p>Your Word::<b>' + data.word + '</b></p>';
      $("#chosenWord").html(html);
      $("#chooserArea").show()
      // showCanvas = true;
      // setup();
    }
    else {
      $("#guessArea").show();
      chosenWord = data.word;
      var html = '';
      html += `<p>Guess the word(${chosenWord.length} letters)</p>`
      $("#wordDetails").html(html);
      $("#wordDetails").show();
      // showCanvas = true;
      // setup();
    }
  });
  socket.on("receivedDoodle", (data) => {
    if (data[4] != socket.id) {
      stroke(255);
      line(data[0], data[1], data[2], data[3]);
    }
  })
  socket.on("clearedFromServer", (data) => {
    if (data != socket.id)
      clearedFromServer();
  })
  socket.on("winners", (data)=>{
    var html = '';
    for (i = 0; i < data.length; i++) {
      html += '<li style="color:green;" class="list-group-item chat-users">' + data[i] + '</li>';
    }
    $('#winners').html(html)
    $("#correctGuesses").show();
  })
  socket.on('timeRemaining', (secs)=>{
    if(secs>=0){
      secsRemaining = secs;  
      var html = `${secs} secs remaining`;
      $('#timer').html(html);
      $('#timer').show();
    }
    else{
      socket.emit("stop_timer",socket.id);
      $("#chosenWord").html('');
      $("#chooserArea").hide();
    }
  })
  socket.on('clearDrawer',(id)=>{
    clearScreen();
    if(id == socket.id){
      $("#chosenWord").html('');
      $("#chooserArea").hide();
      $("#correctGuesses").hide();
    }
    else{
      $("#guessArea").hide();
      $("#guessType").val("");
      $("#isCorrect").hide();
      $("#correctGuesses").hide();
    }
  })
});