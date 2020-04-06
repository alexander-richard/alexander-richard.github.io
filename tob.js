// array of process IDs
var processes = new Array();

// array to keep track of how much time a cs is to be used
var cs_usage = new Array();

// array of processes requesting critical sections
var requests = new Array();

// array of channels between processes or critical sections
var channels = new Array();

// array of release commands
var releases = new Array();

// counter for the timing of the simulation
var counter = 0;

// flag to start/stop the simulation between steps
var step = false;

// number of processes
var pnum = -1;

// speed of the simulation
var sim_speed = -1;

// start/stop of the animation
var play = true;

// if animation has been started
var started = false;

// PRAM or TOB
var sim_type = -1;

//1.5% interest rate
var i_rate = 0.015;

// process object
function Process() {
  this.pID = processes.length;
  this.ok_ctr = 0;
  this.color = "black";
  this.queue = new Array(0);
  this.request = false;
  this.cs_usage = 0;
  this.balance = 50000;
  this.timestamps = new Array();
}

// channel object
function Channel( start, end ) {
  this.msg = null; // message currently in the channel
  this.start_pID = start;
  this.end_pID = end;
  this.color = "black";
  this.fifo_queue = new Array(0);
  this.in_use = -1; // specifies the direction of the channel - pID of destination
}

// Lamport Timestamp Object
function Timestamp( pID, time) {
  this.pID = pID;
  this.time = time;
}

// Message object
function Message( to, type, amt, timestamp ) {
  this.to = to;
  this.type = type; // 'req' or 'rep'
  this.timestamp = timestamp; // timestamp object
  this.amt = amt;
  this.acks = 0;
}

/**
 * Handler for changing the speed radio buttons. Sets the simulation
 * speed to the speed parameter.
 */
function set_speed(speed) {
  if (sim_speed == 0) {
    removeElement('next_btn');
  }
  sim_speed = speed;
  if (sim_speed == 0 && started) {
    addElement('control', 'p', 'next_btn', '<button class="button_nxt" onclick="stop()" id="nxt_btn">Step</button>');
  }
}

/**
 * Function to add an HTML element to the DOM.
 * 
 * Code for this function was taken from:
 * https://www.abeautifulsite.net/adding-and-removing-elements-on-the-fly-using-javascript
 */
function addElement(parentId, elementTag, elementId, html) {
  var p = document.getElementById(parentId);
  var newElement = document.createElement(elementTag);
  newElement.setAttribute('id', elementId);
  newElement.innerHTML = html;
  p.appendChild(newElement);
}

/**
 * Function to remove an HTML element from the DOM.
 * 
 * Code for this function was taken from:
 * https://www.abeautifulsite.net/adding-and-removing-elements-on-the-fly-using-javascript
 */
function removeElement(elementId) {
  var element = document.getElementById(elementId);
  element.parentNode.removeChild(element);
}

// gets the selected value from the radio form
function radio_form_val(form_id, id) {
  var val;

  var radios = form_id.elements[id];
  
  for (i = 0; i < radios.length; i++) {
      if ( radios[i].checked ) {
          val = radios[i].value;
          break;
      }
  }
  return val;
}

/**
 * helper function to pause the simulation for an amount of time
 */
const pause = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

/**
 * reset handler for changing the simulation radio buttons
 */
function to_reset() {
  if (started) {
    window.location.reload();
  }
}

// will build the first screen here and launch run, starting the simulation
function start() {
  // disable the dropdown and start button
  if (sim_speed != -1 && sim_type != -1) {
    document.getElementById("numsites").disabled=true;
    document.getElementById("start_sim").disabled=true;
  }

  var speed = radio_form_val( document.getElementById('sform'), 'speed' );
  if (speed == null) {
    alert('Please select the speed of the simulation');
    return;
  }

  var type = radio_form_val( document.getElementById('aform'), 'type' );
  if (type == null) {
    alert('Please select the algorithm to see in the simulation');
    return;
  }

  if (started == true) {
    return;
  }
  started = true;

  // record the number of processes and animation speed
  pnum = document.getElementById('numsites').value;
  sim_speed = speed;
  sim_type = type;

  for (i = 0; i < pnum; i++) {
    releases.push(-1);
  }

  if (sim_speed == 0) {
    addElement('control', 'p', 'next_btn', '<button class="button_nxt" onclick="stop()" id="nxt_btn">Step</button>');
  }

  createProcesses();
  createChannels();


  // draw the objects on the screen here
  draw(1);

  if (sim_speed == 0) {
    play = false;
  }

  loop();
  
}

async function loop() {
  while(true && play) {
    if (sim_speed == 0) {
      play = false;
    }
    
    tick();
    
    draw(0);
    counter++;
    await pause(sim_speed * 100);
    
  }
}

// function to pause the simulation
function stop() {
  if (play) {
    play = false;
  } else {
    play = true;
    loop();
  }
}

// creates the specified number of proccess objects
function createProcesses() {
  for (i = 0; i < pnum; i++) {
    processes.push( new Process() );
  } 
  
  // fill the timestamp arrays with 0 count values
  for (i = 0; i < pnum; i++) {
    for (j = 0; j < pnum; j++) {
      processes[i].timestamps[j] = 0;
    }
  }
}

// creates channels based on the algorithm
// 2D array - row - from, column - 2
function createChannels() {
  if (pnum > 1) {
    var temp;
    for ( i = 0; i < pnum; i++ ) {
      temp = new Array();
      for ( j = 0; j < pnum; j++) {
          temp.push( new Channel(i, j) );
      }
      channels.push(temp);
    }
  }
}

function broadcast(pID, type, amt, timestamp) {
  for (e = 0; e < pnum; e++) {
    if (e != pID) {
      // push broadcast onto the channel's queue
      channels[pID][e].fifo_queue.push(new Message(e, type, amt, timestamp));
      channels[e][pID].fifo_queue.push(new Message(e, type, amt, timestamp));

      if (counter > processes[e].timestamps[e]) {
          processes[e].timestamps[e] = counter;
      }
    }
  }
}

function create_trans(pID, time) {
  if (processes[pID].request == true) {
    return;
  }

  var timestamp;
  if (pID == 0) {
    timestamp = new Timestamp(pID, counter);
    processes[pID].queue.push(new Message(pID, 'Interest', -1, timestamp));

  } else {
    timestamp = new Timestamp(pID, counter);
    processes[pID].queue.push(new Message(pID, 'Withdraw', 1000, timestamp));

  }
  
  processes[pID].request = true;
  processes[pID].cs_usage = time;
  processes[pID].color = "red";

  //send out request msgs to every other process
  if (pID == 0) {
    broadcast(pID, 'Interest', -1, timestamp);
  } else {
    broadcast(pID, 'Withdraw', 1000, timestamp);
  }
}

function sort_channel_queue() {
  // sort queues by timestamp
  for ( i = 0; i < pnum; i++ ) {
    for ( j = 0; j < pnum; j++ ) {
      if ( i != j ) { // ignore process-themself channels
        
        channels[i][j].fifo_queue.sort(function compare(a, b) {
      
          // sort by timestamp
          if (a.timestamp.time < b.timestamp.time) {
            return -1;
          }
          if (a.timestamp.time > b.timestamp.time) {
            return 1;
          }
    
          // if equal, sort by ID
          if (a.timestamp.pID < b.timestamp.pID) {
            return -1;
          }
          if (a.timestamp.pID > b.timestamp.pID) {
            return 1;
          }
    
          return 0;
        });
      }
    }
  }
}

function sort_process_queue() {
  for ( i = 0; i < pnum; i++ ) {      
    processes[i].queue.sort(function compare(a, b) {
  
      // sort by timestamp
      if (a.timestamp.time < b.timestamp.time) {
        return -1;
      }
      if (a.timestamp.time > b.timestamp.time) {
        return 1;
      }

      // if equal, sort by ID
      if (a.timestamp.pID < b.timestamp.pID) {
        return -1;
      }
      if (a.timestamp.pID > b.timestamp.pID) {
        return 1;
      }

      return 0;
    });
  }
}

/**
 * Helper function to simulate counting of acks
 * before transaction is applied.
 */
function count_acks() {
  var master_queue = new Array();

  // add unique mssgs to the queue
  for (var i = 0; i < pnum; i++) {
    for (var j = 0; j < processes[i].queue.length; j ++) {
      var index = isIn(processes[i].queue[j], master_queue);

      // if its in the queue, increment the count
      if (index != -1) {
        master_queue[index][1]++;
      // else add it to the master queue
      } else {
        master_queue.push([processes[i].queue[j], 1]);
      }
    }
  }

  // increment the acks for the msgs in the process queues
  // if they are equal to pnum
  for (var m = 0; m < master_queue.length; m++) {
    if (master_queue[m][1] == pnum) {
      for (var i = 0; i < pnum; i++) {
        for (var j = 0; j < processes[i].queue.length; j++) {
          if (is_equal(processes[i].queue[j], master_queue[m][0])) {
            processes[i].queue[j].acks = pnum;
          }
        }
      }
    }
    
  }
}

/**
 * helper function to determine if a message object
 * is in the master queue.
 * 
 * returns the index of the message in the queue.
 */
function isIn(msg, queue) {
  for (var i = 0; i < queue.length; i++) {
    if (is_equal(msg, queue[i][0])) {
      return i;
    }
  }
  return -1;
}

/**
 * Helper function to determine if two msgs are
 * the same. Determined by message creator, timestamp, and type.
 */
function is_equal(msg1, msg2) {
  if (msg1.timestamp.time == msg2.timestamp.time) {
    if (msg1.type === msg2.type) {
      if (msg1.timestamp.pID == msg2.timestamp.pID) {
        return true;
      }
    }
  }
  return false;
}

function apply_trans() {
  if (sim_type == 0) {
    for (var i = 0; i < pnum; i++) {
      if (processes[i].queue.length == 0) {
        continue;
      } else {
        if (processes[i].queue[0].type === 'Withdraw') {
          processes[i].balance -= processes[i].queue[0].amt;
        } else if (processes[i].queue[0].type === 'Interest') {
          processes[i].balance += processes[i].balance * i_rate;
        }

        // remove transaction from process queue
        processes[i].queue.splice(0, 1);

      }

    }
    // else TOB
  } else {
    var max_ts_arr = create_max_arr();
    for (var i = 0; i < pnum; i++) {
      for (var j = 0; j < processes[i].queue.length; j++) {
        if (processes[i].queue[j].acks == pnum && processes[i].queue[j].timestamp.time <= max_ts_arr[i]) {
          if (processes[i].queue[j].type === 'Withdraw') {
            processes[i].balance -= processes[i].queue[0].amt;
            processes[i].queue.splice(j, 1);
          } else if (processes[i].queue[j].type === 'Interest') {
            processes[i].balance += processes[i].balance * i_rate;
            processes[i].queue.splice(j, 1);
          }
        }
      }
    }
  }
  return;
}

/**
 * This function creates an array of size pnum of 
 * the highest timestamp recorded for each process
 */
function create_max_arr() {
  var temp = new Array(pnum);
  for (var i = 0; i < pnum; i++) {
    temp[i] = Math.max.apply(Math, processes[i].timestamps);
  }
  return temp;
}


function handle_channels() {
  var dir;
  for ( var i = 0; i < pnum; i++ ) {
    for ( var j = 0; j < pnum; j++ ) {
      if ( i != j ) {
        dir = i;
        // case where queue is empty and channel is not in use
        if (channels[i][j].fifo_queue.length == 0 && channels[i][j].in_use == -1) {
          continue;
          
        }

        if (channels[i][j].fifo_queue.length != 0) {
          dir = channels[i][j].fifo_queue[0].to;
        }

        // case where channel is not empty - apply update and clear channel       
        if ( channels[i][j].in_use != -1 ) {
          
          // if the other direction is in use, skip this side
          if (!channels[i][j].msg) {
            continue;
          }

          if (sim_type == 1 && channels[i][j].msg.type === 'res') {
            for (k = 0; k < processes[j].queue.length; k++) {
              if (processes[j].queue[k].amt == channels[i][j].msg.amt && channels[i][j].msg.timestamp.time == processes[j].queue[k].timestamp.time && processes[j].queue[k].to == channels[i][j].msg.to) {
                processes[j].queue[k].acks++;
                processes[j].timestamps[i] = channels[i][j].msg.timestamp.time;
              }
            }
          }

          if ( channels[i][j].msg.type === 'Withdraw' ||  channels[i][j].msg.type === 'Interest') {
            
            if (processes[j].queue.length != 0) {
              if (processes[j].queue[0].pID == i) {
                processes[j].queue.splice(0, 1);
              } else {
                channels[i][j].msg.acks++;
                processes[j].queue.push( channels[i][j].msg);
                processes[j].timestamps[i] = channels[i][j].msg.timestamp.time;
                processes[j].timestamps[j] = channels[i][j].msg.timestamp.time;

              }

            } else {
              channels[i][j].msg.acks++;
              processes[j].queue.push( channels[i][j].msg);
              if (processes[j].timestamps[i] <= channels[i][j].msg.timestamp.time) {
                processes[j].timestamps[i] = channels[i][j].msg.timestamp.time;
              }
              if (processes[j].timestamps[j] <= channels[i][j].msg.timestamp.time) {
                processes[j].timestamps[j] = channels[i][j].msg.timestamp.time;
              }

            }


            // broadcast response msg to channel queues
            if (sim_type == 1) {
              //brd
              broadcast(j, 'res', channels[i][j].msg.amt, channels[i][j].msg.timestamp);
              
            } else {
              channels[i][j].fifo_queue.push( new Message( i, 'res', channels[i][j].msg.amt, new Timestamp( j, channels[i][j].msg.timestamp.time ) ) );
              channels[j][i].fifo_queue.push( new Message( i, 'res', channels[i][j].msg.amt, new Timestamp( j, channels[i][j].msg.timestamp.time ) ) );
            }

          } else { // 'res'
            processes[j].ok_ctr++;
          }
          
          // clear channel for next use
          channels[i][j].in_use = -1;
          channels[j][i].in_use = -1;
          channels[i][j].msg = null;
          channels[j][i].msg = null;
          channels[i][j].color = "black";
          channels[j][i].color = "black";
          
        }

         if ( channels[i][j].in_use == -1 && channels[i][j].fifo_queue.length != 0) {
          if (dir == i) {
            continue;
          }

          channels[i][j].msg = channels[i][j].fifo_queue[0];
          channels[j][i].msg = null;  

          // remove the first element of the queues
          channels[i][j].fifo_queue.splice(0, 1);
          channels[j][i].fifo_queue.splice(0, 1);
          channels[i][j].in_use = j;
          channels[j][i].in_use = j;


          if (channels[i][j].msg.type === 'Withdraw' ||  channels[i][j].msg.type === 'Interest') {
            channels[i][j].color = 'orange';
          } else if (channels[i][j].msg.type === 'res'){
            channels[i][j].color = 'purple';
          }
        }
      }
    }
  } 
}

function handle_process() {
  for (var i = 0; i < pnum; i++) {
    if (processes[i].color === 'red') {
      processes[i].color = 'black';
      processes[i].request = false;
    }
  }
}

// decides if a process will request a cs this round
function random_req() {
  
  // get random number between 0 and 9
  var rand = Math.floor( Math.random() * 15 );
  return rand;
}

// this is how the function runs, it calls all the other functions in one step
// it is called by pressing the button after run
async function tick() {
  apply_trans();

  handle_process();

  handle_channels();

  var next_time = random_req();
  var next_req = random_req();

  if (next_req < pnum) {
    create_trans(next_req, next_time);
    next_req = random_req();
  }
  
  if (sim_type == 1) {
    sort_channel_queue();
    sort_process_queue();
    count_acks();
  }

  draw(0);
}

function splash() {
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  ctx.font = "40px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Totally Ordered Broadcast Algorithm", 190, 400);
  ctx.font = "20px Arial";
  ctx.fillText("Created by Alexander Richard", 350, 430);

  var img = new Image();
  img.src = 'iconfinder_access-time_326483.png';
}

function draw(type) {
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");

  if (type == 1) {
    ctx.scale(3, 3);
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "10px Arial";
  ctx.lineWidth = 2;

  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  img = new Image();
  img.src = 'iconfinder_access-time_326483.png';
  ctx.drawImage(img, 10, 10, 32, 32);
  ctx.fillText(counter, 50, 35);

  ctx.font = "10px Arial";

  var legw = 210;
  var legh = 22;

  ctx.fillStyle = "red";
  ctx.fillRect(legw, legh, 20, 9);
  ctx.fillText("Send Transaction", legw + 30, 30);
  /*
  ctx.fillStyle = "Blue";
  ctx.fillRect(legw, legh + 20, 20, 9);
  ctx.fillText("End Transaction", legw + 30, 50);
  */

  ctx.strokeStyle = "orange";
  ctx.fillStyle = "orange";
  ctx.beginPath();
  ctx.moveTo(legw, legh + 25);
  ctx.lineTo(legw + 20, legh + 25);
  ctx.stroke();
  ctx.fillText("Update", legw + 30, 50);

  ctx.strokeStyle = "purple";
  ctx.fillStyle = "purple";
  ctx.beginPath();
  ctx.moveTo(legw, legh + 45);
  ctx.lineTo(legw + 20, legh + 45);
  ctx.stroke();
  ctx.fillText("Acknowledgement", legw + 30, 70);

  if (sim_type == 1) {
    // note section
    ctx.font = "5px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Local Time is the highest time recorded from recieved messages.", legw - 35, 322);
    ctx.font = "10px Arial";
  }

  if (pnum == 2) {
    // dimentions
    var wl = 130;
    var wr = wl + 75;
    var h = 170;

    //queues

    // offset for site stats
    var off0 = wl - 100;

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(off0 - 3, h - 19, 77, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(off0, (h - 8) + ((10 + 3) * i));
      ctx.lineTo(off0 + 70, (h - 8) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.fillStyle = "black";
    if (sim_type == 1) {
      ctx.fillText("Local Time: " + processes[0].timestamps[0], off0 - 3, h - 30);
    }
    ctx.fillText("Balance: $" + processes[0].balance.toPrecision(7), off0 - 3, h - 20);
    ctx.fillText("Queue:", off0, h - 10);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[0].queue.length && i < 4; i++) {
      if (sim_type == 1) {
        if (processes[0].queue[i].type === 'Interest') {
          ctx.fillText(processes[0].queue[i].type + ': 1.5% at ' + processes[0].queue[i].timestamp.time, off0, (h + 2) + (i * (10 + 3)));
        } else {
          ctx.fillText(processes[0].queue[i].type + ': $1k at ' + processes[0].queue[i].timestamp.time, off0, (h + 2) + (i * (10 + 3)));
        }
      } else {
        if (processes[0].queue[i].type === 'Interest') {
          ctx.fillText( processes[0].queue[i].type + ' ' + (i_rate * 100) + '%', off0, (h + 2) + (i * (10 + 3)) );
        } else {
          ctx.fillText( processes[0].queue[i].type + ' $' + processes[0].queue[i].amt, off0, (h + 2) + (i * (10 + 3)) );
        }
      }
      
    }
    ctx.font = "10px Arial";
    
    // offset for site stats
    var off1 = wr + 20;

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(off1 - 3, h - 19, 77, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(off1, (h - 8) + ((10 + 3) * i));
      ctx.lineTo(off1 + 70, (h - 8) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.fillStyle = "black";
    if (sim_type == 1) {
      ctx.fillText("Local Time: " + processes[1].timestamps[1], off1 - 3, h - 30);
    }
    ctx.fillText("Balance: $" + processes[1].balance.toPrecision(7), off1 - 3, h - 20);
    ctx.fillText("Queue:", off1, h - 10);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[1].queue.length && i < 4; i++) {
      if (sim_type == 1) {
        if (processes[1].queue[i].type === 'Interest') {
          ctx.fillText(processes[1].queue[i].type + ': 1.5% at ' + processes[1].queue[i].timestamp.time, off1, (h + 2) + (i * (10 + 3)));
        } else {
          ctx.fillText(processes[1].queue[i].type + ': $1k at ' + processes[1].queue[i].timestamp.time, off1, (h + 2) + (i * (10 + 3)));
        }
      } else {
        if (processes[1].queue[i].type === 'Interest') {
          ctx.fillText( processes[1].queue[i].type + ' ' + (i_rate * 100) + '%', off1, (h + 2) + (i * (10 + 3)) );
        } else {
          ctx.fillText( processes[1].queue[i].type + ' $' + processes[1].queue[i].amt, off1, (h + 2) + (i * (10 + 3)) );
        }
      }
      
    }
    ctx.font = "10px Arial";

    // channels
    ctx.lineWidth = 1.5;

    // 0 - 1
    ctx.strokeStyle = 'black';
    if (channels[1][0].in_use == 0) {
      ctx.strokeStyle = channels[1][0].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(wl + 15, h);
      ctx.lineTo(wl + 25, h - 10);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(wl + 15, h);
      ctx.lineTo(wl + 25, h + 10);
      ctx.stroke();

    } else if (channels[0][1].in_use == 1) {
      ctx.strokeStyle = channels[0][1].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(wr - 15, h);
      ctx.lineTo(wr - 25, h - 10);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(wr - 15, h);
      ctx.lineTo(wr - 25, h + 10);
      ctx.stroke();
    }
    
    // draw the line
    ctx.beginPath();
    ctx.moveTo(wl, h);
    ctx.lineTo(wr, h);
    ctx.stroke();

    // processes
    ctx.beginPath();
    ctx.arc(wl, h, 15, 0, 2 * Math.PI);
    ctx.fillStyle = processes[0].color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(wr, h, 15, 0, 2 * Math.PI);
    ctx.fillStyle = processes[1].color;
    ctx.fill();

    // labels
    ctx.font = "10px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Site 0", wl - 13, h + 3);

    ctx.fillStyle = "white";
    ctx.fillText("Site 1", wr - 13, h + 3);

  } else if (pnum == 3) {
    // dimensions
    var wl = 125;
    var wr = wl + 75;
    var mid = (wl + wr) / 2;
    var hb = 175;
    var ht = hb - 50;

    //queues

    // offset for site stats
    var off0 = wl - 70;

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(off0 - 3, hb + 40, 77, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(off0, (hb + 55) + ((10 + 3) * i));
      ctx.lineTo(off0 + 70, (hb + 55) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.fillStyle = "black";
    if (sim_type == 1) {
      ctx.fillText("Local Time: " + processes[0].timestamps[0], off0 - 3, hb + 28);
    }
    ctx.fillText("Balance: $" + processes[0].balance.toPrecision(7), off0 - 3, hb + 38);
    ctx.fillText("Queue:", off0, hb + 50);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[0].queue.length && i < 4; i++) {
      if (sim_type == 1) {
        if (processes[0].queue[i].type === 'Interest') {
          ctx.fillText(processes[0].queue[i].type + ': 1.5% at ' + processes[0].queue[i].timestamp.time, off0, (hb + 65) + (i * (10 + 3)));
        } else {
          ctx.fillText(processes[0].queue[i].type + ': $1k at ' + processes[0].queue[i].timestamp.time, off0, (hb + 65) + (i * (10 + 3)));
        }
      } else {
        if (processes[0].queue[i].type === 'Interest') {
          ctx.fillText( processes[0].queue[i].type + ' ' + (i_rate * 100) + '%', off0, (hb + 65) + (i * (10 + 3)) );
        } else {
          ctx.fillText( processes[0].queue[i].type + ' $' + processes[0].queue[i].amt, off0, (hb + 65) + (i * (10 + 3)) );
        }
      }
      
    }
    ctx.font = "10px Arial";

    // offset for site stats
    var off1 = wl - 70;

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(off1 - 3, ht - 35, 77, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(off1, (ht - 21) + ((10 + 3) * i));
      ctx.lineTo(off1 + 70, (ht - 21) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.fillStyle = "black";
    if (sim_type == 1) {
      ctx.fillText("Local Time: " + processes[1].timestamps[1], off1 - 3, ht - 47);
    }
    ctx.fillText("Balance: $" + processes[1].balance.toPrecision(7), off1 - 3, ht - 37);
    ctx.fillText("Queue:", off1, ht - 25);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[1].queue.length && i < 4; i++) {
      if (sim_type == 1) {
        if (processes[1].queue[i].type === 'Interest') {
          ctx.fillText(processes[1].queue[i].type + ': 1.5% at ' + processes[1].queue[i].timestamp.time, off1, (ht - 11) + (i * (10 + 3)));
        } else {
          ctx.fillText(processes[1].queue[i].type + ': $1k at ' + processes[1].queue[i].timestamp.time, off1, (ht - 11) + (i * (10 + 3)));
        }
      } else {
        if (processes[1].queue[i].type === 'Interest') {
          ctx.fillText( processes[1].queue[i].type + ' ' + (i_rate * 100) + '%', off1, (ht - 11) + (i * (10 + 3)) );
        } else {
          ctx.fillText( processes[1].queue[i].type + ' $' + processes[1].queue[i].amt, off1, (ht - 11) + (i * (10 + 3)) );
        }
      }
      
    }
    ctx.font = "10px Arial";

    // offset for site stats
    var off2 = wr - 10;

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(off2 - 3, hb + 40, 77, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(off2, (hb + 55) + ((10 + 3) * i));
      ctx.lineTo(off2 + 70, (hb + 55) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.fillStyle = "black";
    if (sim_type == 1) {
      ctx.fillText("Local Time: " + processes[2].timestamps[2], off2 - 3, hb + 28);
    }
    ctx.fillText("Balance: $" + processes[2].balance.toPrecision(7), off2 - 3, hb + 38);
    ctx.fillText("Queue:", off2, hb + 50);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[2].queue.length && i < 4; i++) {
      if (sim_type == 1) {
        if (processes[2].queue[i].type === 'Interest') {
          ctx.fillText(processes[2].queue[i].type + ': 1.5% at ' + processes[2].queue[i].timestamp.time, off2, (hb + 65) + (i * (10 + 3)));
        } else {
          ctx.fillText(processes[2].queue[i].type + ': $1k at ' + processes[2].queue[i].timestamp.time, off2, (hb + 65) + (i * (10 + 3)));
        }
      } else {
        if (processes[2].queue[i].type === 'Interest') {
          ctx.fillText( processes[2].queue[i].type + ' ' + (i_rate * 100) + '%', off2, (hb + 65) + (i * (10 + 3)) );
        } else {
          ctx.fillText( processes[2].queue[i].type + ' $' + processes[2].queue[i].amt, off2, (hb + 65) + (i * (10 + 3)) );
        }
      }
      
    }
    ctx.font = "10px Arial";

    // draw channels
    ctx.lineWidth = 1.5;


    // 0 - 2
    ctx.strokeStyle = 'black';
    if (channels[2][0].in_use == 0) {
      ctx.strokeStyle = channels[2][0].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(wl + 15, hb);
      ctx.lineTo(wl + 25, hb - 10);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(wl + 15, hb);
      ctx.lineTo(wl + 25, hb + 10);
      ctx.stroke();

    } else if (channels[0][2].in_use == 2) {
      ctx.strokeStyle = channels[0][2].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(wr - 15, hb);
      ctx.lineTo(wr - 25, hb - 10);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(wr - 15, hb);
      ctx.lineTo(wr - 25, hb + 10);
      ctx.stroke();
    }
    
    // draw the line
    ctx.beginPath();
    ctx.moveTo(wl, hb);
    ctx.lineTo(wr, hb);
    ctx.stroke();

    // 1 - 2
    ctx.strokeStyle = 'black';
    if (channels[2][1].in_use == 1) {
      ctx.strokeStyle = channels[2][1].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(mid + 9, ht + 11);
      ctx.lineTo(mid + 7, ht + 28);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(mid + 8, ht + 12);
      ctx.lineTo(mid + 25, ht + 14);
      ctx.stroke();

    } else if (channels[1][2].in_use == 2) {
      ctx.strokeStyle = channels[1][2].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(wr - 9, hb - 12);
      ctx.lineTo(wr - 7, hb - 28);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(wr - 8, hb - 12);
      ctx.lineTo(wr - 25, hb - 14);
      ctx.stroke();
    }

    // draw the line
    ctx.beginPath();
    ctx.moveTo(mid, ht);
    ctx.lineTo(wr, hb);
    ctx.stroke();
    
    // 0 - 1
    ctx.strokeStyle = 'black';
    if (channels[1][0].in_use == 0) {
      ctx.strokeStyle = channels[1][0].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(wl + 8, hb - 11);
      ctx.lineTo(wl + 7, hb - 26);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(wl + 8, hb - 11);
      ctx.lineTo(wl + 24, hb - 14);
      ctx.stroke();

    } else if (channels[0][1].in_use == 1) {
      ctx.strokeStyle = channels[0][1].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(mid - 8, ht + 11);
      ctx.lineTo(mid - 7, ht + 26);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(mid - 8, ht + 11);
      ctx.lineTo(mid - 24, ht + 14);
      ctx.stroke();
    }

    // draw the line
    ctx.beginPath();
    ctx.moveTo(mid, ht);
    ctx.lineTo(wl, hb);
    ctx.stroke();
    
    // draw processes
    ctx.beginPath();
    ctx.arc(wl, hb, 15, 0, 2 * Math.PI);
    ctx.fillStyle = processes[0].color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(mid, ht, 15, 0, 2 * Math.PI);
    ctx.fillStyle = processes[1].color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(wr, hb, 15, 0, 2 * Math.PI);
    ctx.fillStyle = processes[2].color;
    ctx.fill();

    //labels
    ctx.font = "10px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Site 0", wl - 13, hb + 3);

    ctx.fillStyle = "white";
    ctx.fillText("Site 1", mid - 13, ht + 3);

    ctx.fillStyle = "white";
    ctx.fillText("Site 2", wr - 13, hb + 3);

  } else { // 4 processes

    // canvas variables
    var th = 120;
    var lw = 120;
    var rw = lw + 85;
    var bh = th + 95;

    //queues and stats

    // offset for site stats
    var off0 = lw - 95;

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(off0 - 3, th - 20, 77, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(off0, (th - 8) + ((10 + 3) * i));
      ctx.lineTo(off0 + 70, (th - 8) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.fillStyle = "black";
    if (sim_type == 1) {
      ctx.fillText("Local Time: " + processes[0].timestamps[0], off0 - 3, th - 32);
    }
    
    ctx.fillText("Balance: $" + processes[0].balance.toPrecision(7), off0 - 3, th - 22);
    ctx.fillText("Queue:", off0, th - 10);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[0].queue.length && i < 4; i++) {
      if (sim_type == 1) {
        if (processes[0].queue[i].type === 'Interest') {
          ctx.fillText(processes[0].queue[i].type + ': 1.5% at ' + processes[0].queue[i].timestamp.time, off0, (th + 2) + (i * (10 + 3)));
        } else {
          ctx.fillText(processes[0].queue[i].type + ': $1k at ' + processes[0].queue[i].timestamp.time, off0, (th + 2) + (i * (10 + 3)));
        }
      } else {
        if (processes[0].queue[i].type === 'Interest') {
          ctx.fillText( processes[0].queue[i].type + ' ' + (i_rate * 100) + '%', off0, (th + 2) + (i * (10 + 3)) );
        } else {
          ctx.fillText( processes[0].queue[i].type + ' $' + processes[0].queue[i].amt, off0, (th + 2) + (i * (10 + 3)) );
        }
      }
    }

    // offset for site stats
    var off1 = rw + 20;

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(off1 - 3, th - 20, 77, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(off1, (th - 8) + ((10 + 3) * i));
      ctx.lineTo(off1 + 70, (th - 8) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.font = "10px Arial";
    ctx.fillStyle = "black";
    if (sim_type == 1) {
      ctx.fillText("Local Time: " + processes[1].timestamps[1], rw + 17, th - 32);
    }
    ctx.fillText("Balance: $" + processes[1].balance.toPrecision(7), rw + 17, th - 22);
    ctx.fillText("Queue:", rw + 20, th - 10);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[1].queue.length && i < 4; i++) {
      if (sim_type == 1) {
        if (processes[1].queue[i].type === 'Interest') {
          ctx.fillText(processes[1].queue[i].type + ': 1.5% at ' + processes[1].queue[i].timestamp.time, rw + 20, (th + 2) + (i * (10 + 3)));
        } else {
          ctx.fillText(processes[1].queue[i].type + ': $1k at ' + processes[1].queue[i].timestamp.time, rw + 20, (th + 2) + (i * (10 + 3)));
        }
      } else {
        if (processes[1].queue[i].type === 'Interest') {
          ctx.fillText(processes[1].queue[i].type + ' ' + (i_rate * 100) + '%', rw + 20, (th + 2) + (i * (10 + 3)));
        } else {
          ctx.fillText(processes[1].queue[i].type + ' $' + processes[1].queue[i].amt, rw + 20, (th + 2) + (i * (10 + 3)));
        }
      }
    }

    // offset for site stats
    var off2 = lw - 95;

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(off2 - 3, bh + 25, 77, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(off2, (bh + 37) + ((10 + 3) * i));
      ctx.lineTo(off2 + 70, (bh + 37) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.font = "10px Arial";
    ctx.fillStyle = "black";
    if (sim_type == 1) {
      ctx.fillText("Local Time: " + processes[2].timestamps[2], off2 - 3, bh + 13);
    }
      ctx.fillText("Balance: $" + processes[2].balance.toPrecision(7), off2 - 3, bh + 23);
    ctx.fillText("Queue:", off2, bh + 35);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[2].queue.length && i < 4; i++) {
      if (sim_type == 1) { 
        if (processes[2].queue[i].type === 'Interest') {
          ctx.fillText(processes[2].queue[i].type + ': 1.5% at ' + processes[2].queue[i].timestamp.time, off2, (bh + 47) + (i * (10 + 3)));
        } else {                                                                           
          ctx.fillText(processes[2].queue[i].type + ': $1k at ' + processes[2].queue[i].timestamp.time, off2, (bh + 47) + (i * (10 + 3)));
        }
      } else {
        if (processes[2].queue[i].type === 'Interest') {
          ctx.fillText(processes[2].queue[i].type + ' ' + (i_rate * 100) + '%', off2, (bh + 47) + (i * (10 + 3)));
        } else {
          ctx.fillText(processes[2].queue[i].type + ' $' + processes[2].queue[i].amt, off2, (bh + 47) + (i * (10 + 3)));
        }
      }
    }

    // offset for site stats
    var off3 = rw + 20;

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(off3 - 3, bh + 25, 77, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(off3, (bh + 37) + ((10 + 3) * i));
      ctx.lineTo(off3 + 70, (bh + 37) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.font = "10px Arial";
    ctx.fillStyle = "black";
    if (sim_type == 1) {
      ctx.fillText("Local Time: " + processes[3].timestamps[3], off3 - 3, bh + 13);
    }
      ctx.fillText("Balance: $" + processes[3].balance.toPrecision(7), off3 - 3, bh + 23);
    ctx.fillText("Queue:", rw + 20, bh + 35);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[3].queue.length && i < 4; i++) {
      if (sim_type == 1) {
        if (processes[3].queue[i].type === 'Interest') {
          ctx.fillText(processes[3].queue[i].type + ': 1.5% at ' + processes[3].queue[i].timestamp.time, rw + 20, (bh + 47) + (i * (10 + 3)));
        } else {
          ctx.fillText(processes[3].queue[i].type + ': $1k at ' + processes[3].queue[i].timestamp.time, rw + 20, (bh + 47) + (i * (10 + 3)));
        }
      } else {
        if (processes[3].queue[i].type === 'Interest') {
          ctx.fillText(processes[3].queue[i].type + ' ' + (i_rate * 100) + '%', rw + 20, (bh + 47) + (i * (10 + 3)));
        } else {
          ctx.fillText(processes[3].queue[i].type + ' $' + processes[3].queue[i].amt, rw + 20, (bh + 47) + (i * (10 + 3)));
        }
      }
    }

    // channels
    ctx.lineWidth = 1.5;

    // 0 - 1
    ctx.strokeStyle = 'black';
    if (channels[1][0].in_use == 0) {
      ctx.strokeStyle = channels[1][0].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(lw + 15, th);
      ctx.lineTo(lw + 25, th - 10);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(lw + 15, th);
      ctx.lineTo(lw + 25, th + 10);
      ctx.stroke();

    } else if (channels[0][1].in_use == 1) {
      ctx.strokeStyle = channels[0][1].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(rw - 15, th);
      ctx.lineTo(rw - 25, th - 10);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(rw - 15, th);
      ctx.lineTo(rw - 25, th + 10);
      ctx.stroke();
    }
    
    // draw the line
    ctx.beginPath();
    ctx.moveTo(lw, th);
    ctx.lineTo(rw, th);
    ctx.stroke();


    // 1 - 2
    ctx.strokeStyle = 'black';
    if (channels[1][2].in_use == 2) {
      ctx.strokeStyle = channels[1][2].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(lw + 10, bh - 11);
      ctx.lineTo(lw + 10, bh - 26);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(lw + 10, bh - 11);
      ctx.lineTo(lw + 25, bh - 11);
      ctx.stroke();

    } else if (channels[2][1].in_use == 1) {
      ctx.strokeStyle = channels[2][1].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(rw - 10, th + 11);
      ctx.lineTo(rw - 10, th + 26);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(rw - 10, th + 11);
      ctx.lineTo(rw - 25, th + 11);
      ctx.stroke();
    }

    // draw the line
    ctx.beginPath();
    ctx.moveTo(rw, th);
    ctx.lineTo(lw, bh);
    ctx.stroke();

    // 2 - 3
    ctx.strokeStyle = 'black';
    if (channels[3][2].in_use == 2) {
      ctx.strokeStyle = channels[3][2].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(lw + 15, bh);
      ctx.lineTo(lw + 25, bh - 10);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(lw + 15, bh);
      ctx.lineTo(lw + 25, bh + 10);
      ctx.stroke();

    } else if (channels[2][3].in_use == 3) {
      ctx.strokeStyle = channels[2][3].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(rw - 15, bh);
      ctx.lineTo(rw - 25, bh + 10);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(rw - 15, bh);
      ctx.lineTo(rw - 25, bh - 10);
      ctx.stroke();
    }

    // draw the line
    ctx.beginPath();
    ctx.moveTo(lw, bh);
    ctx.lineTo(rw, bh);
    ctx.stroke();


    // 1 - 3
    ctx.strokeStyle = 'black';
    if (channels[1][3].in_use == 3) {
      ctx.strokeStyle = channels[1][3].color;
      // draw left arrow
      ctx.beginPath();
      ctx.moveTo(rw, bh - 15);
      ctx.lineTo(rw - 10, bh - 25);
      ctx.stroke();
      // draw right arrow
      ctx.beginPath();
      ctx.moveTo(rw, bh - 15);
      ctx.lineTo(rw + 10, bh - 25);
      ctx.stroke();

    } else if (channels[3][1].in_use == 1) {
      ctx.strokeStyle = channels[3][1].color;
      // draw left arrow
      ctx.beginPath();
      ctx.moveTo(rw, th + 15);
      ctx.lineTo(rw - 10, th + 25);
      ctx.stroke();
      // draw right arrow
      ctx.beginPath();
      ctx.moveTo(rw, th + 15);
      ctx.lineTo(rw + 10, th + 25);
      ctx.stroke();
    }

    // draw the line
    ctx.beginPath();
    ctx.moveTo(rw, bh);
    ctx.lineTo(rw, th);
    ctx.stroke();

    // 0 - 2
    ctx.strokeStyle = 'black';
    if (channels[2][0].in_use == 0) {
      ctx.strokeStyle = channels[2][0].color;
      // draw left arrow
      ctx.beginPath();
      ctx.moveTo(lw, th + 15);
      ctx.lineTo(lw - 10, th + 25);
      ctx.stroke();
      // draw right arrow
      ctx.beginPath();
      ctx.moveTo(lw, th + 15);
      ctx.lineTo(lw + 10, th + 25);
      ctx.stroke();

    } else if (channels[0][2].in_use == 2) {
      ctx.strokeStyle = channels[0][2].color;
      // draw left arrow
      ctx.beginPath();
      ctx.moveTo(lw, bh - 15);
      ctx.lineTo(lw - 10, bh - 25);
      ctx.stroke();
      // draw right arrow
      ctx.beginPath();
      ctx.moveTo(lw, bh - 15);
      ctx.lineTo(lw + 10, bh - 25);
      ctx.stroke();
    }

    // draw the line
    ctx.beginPath();
    ctx.moveTo(lw, th);
    ctx.lineTo(lw, bh);
    ctx.stroke();

    // 0 - 3
    ctx.strokeStyle = 'black';
    if (channels[0][3].in_use == 3) {
      ctx.strokeStyle = channels[0][3].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(rw - 10, bh - 11);
      ctx.lineTo(rw - 10, bh - 26);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(rw - 10, bh - 11);
      ctx.lineTo(rw - 25, bh - 11);
      ctx.stroke();

    } else if (channels[3][0].in_use == 0) {
      ctx.strokeStyle = channels[3][0].color;
      // draw top arrow
      ctx.beginPath();
      ctx.moveTo(lw + 10, th + 11);
      ctx.lineTo(lw + 10, th + 26);
      ctx.stroke();
      // draw bottom arrow
      ctx.beginPath();
      ctx.moveTo(lw + 10, th + 11);
      ctx.lineTo(lw + 25, th + 11);
      ctx.stroke();
      
    }

    // draw the line
    ctx.beginPath();
    ctx.moveTo(lw, th);
    ctx.lineTo(rw, bh);
    ctx.stroke();
    

    // processes
    ctx.beginPath();
    ctx.arc(lw, th, 15, 0, 2 * Math.PI);
    ctx.fillStyle = processes[0].color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rw, th, 15, 0, 2 * Math.PI);
    ctx.fillStyle = processes[1].color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lw, bh, 15, 0, 2 * Math.PI);
    ctx.fillStyle = processes[2].color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rw, bh, 15, 0, 2 * Math.PI);
    ctx.fillStyle = processes[3].color;
    ctx.fill();

    // labels
    ctx.font = "10px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Site 0", lw - 13, th + 3);

    ctx.fillStyle = "white";
    ctx.fillText("Site 1", rw - 13, th + 3);

    ctx.fillStyle = "white";
    ctx.fillText("Site 2", lw - 13, bh + 3);

    ctx.fillStyle = "white";
    ctx.fillText("Site 3", rw - 13, bh + 3);

  }
  
}