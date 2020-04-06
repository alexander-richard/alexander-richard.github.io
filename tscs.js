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

// process object
function Process() {
  this.pID = processes.length;
  this.ok_ctr = 0;
  this.color = "black";
  this.queue = new Array(0);
  this.request = false;
  this.cs_usage = 0;
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
function Message( to, type, timestamp ) {
  this.to = to;
  this.type = type; // 'req' or 'rep'
  this.timestamp = timestamp; // timestamp object
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
  // Removes an element from the document
  var element = document.getElementById(elementId);
  element.parentNode.removeChild(element);
}


/**
 * gets the selected value from the specified radio form
 */
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
 * Sleep function to be used in the loop function.
 */
const pause = (time) => {
  return new Promise(resolve => setTimeout(resolve, time))
}

/**
 * The function called when the 'Start Simulation' button is pressed.
 * It creates all the required global variables, and calls loop() to
 * start the simulation.
 */
function start() {
  // disable the dropdown and start button
  document.getElementById("nump").disabled=true;
  document.getElementById("start_sim").disabled=true;


  if (started == true) {
    return;
  }
  started = true;

  var speed = radio_form_val( document.getElementById('sform'), 'speed' );
  if (speed == null) {
    alert('Please select the speed of the simulation');
    return;
  }

  // record the number of processes and animation speed
  sim_speed = speed;
  pnum = document.getElementById('nump').value;
  
  for (i = 0; i < pnum; i++) {
    releases.push(-1);
  }

  // add the next button if the simulation speed is Step
  if (sim_speed == 0) {
    addElement('control', 'p', 'next_btn', '<button class="button_nxt" onclick="stop()" id="nxt_btn">Step</button>');
  } else if (sim_speed == 2) {
    sim_speed = 20;
  } else {
    sim_speed = 7;
  }

  createProcesses();
  createChannels();

  draw(1);

  if (sim_speed == 0) {
    play = false;
  }

  loop();
  
}

/**
 * An asynchronous function to pause the simulation for a
 * certain amount of time based on the sim_speed variable.
 * 
 * sim_speed is specified by the fast, slow, and step radio
 * buttons.
 */
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

/**
 * Toggles the play variable to step through the simulation.
 */
function stop() {
  if (play) {
    play = false;
  } else {
    play = true;
    loop();
  }
}

/**
 * Pushes pnum process objects to the processes array.
 */
function createProcesses() {
  for (i = 0; i < pnum; i++) {
    processes.push( new Process() );
  }
}


/**
 * Creates a 2d array of channels with the 
 * row being the process at the start of the channel and
 * the column being the receiving process.
 */
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

/**
 * Function to broadcast a message object to every process.
 */
function broadcast(pID, type, timestamp) {
  for (i = 0; i < pnum; i++) {
    if (i != pID) {
      // push broadcast onto the channel's queue
      channels[pID][i].fifo_queue.push(new Message(i, type, timestamp));
      channels[i][pID].fifo_queue.push(new Message(i, type, timestamp));
    }
  }
}

/**
 * Function that sets a process to request the critical section
 * for a specified ammount of clock cycles.
 */
function request_cs(pID, time) {
  if (processes[pID].request == true) {
    return;
  }
  var timestamp = new Timestamp(pID, counter);
  //requests.push(pID);

  processes[pID].request = true;
  processes[pID].cs_usage = time;
  processes[pID].queue.push(timestamp);
  processes[pID].color = "red";

  //send out request msgs to every other process
  broadcast(pID, 'req', timestamp);

}

/**
 * Function that corrects issues with the fifo queues
 * and makes them act correctly.
 */
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

/**
 * Function that sorts the process queues by timestamp.
 */
function sort_process_queue() {
  for ( i = 0; i < pnum; i++ ) {      
    processes[i].queue.sort(function compare(a, b) {
  
      // sort by timestamp
      if (a.time < b.time) {
        return -1;
      }
      if (a.time > b.time) {
        return 1;
      }

      // if equal, sort by ID
      if (a.pID < b.pID) {
        return -1;
      }
      if (a.pID > b.pID) {
        return 1;
      }

      return 0;
    });
  }
}


/**
 * Function that handles the color, direction, and transmission
 * of messages from the FIFO queue to the channel, and then to
 * the process on the other end.
 */
function handle_channels() {
  // sort the queue
  var dir;

  for ( i = 0; i < pnum; i++ ) {
    for ( j = 0; j < pnum; j++ ) {
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
          if (channels[i][j].msg == null) {
            continue;
          }

          // apply mssg
          if ( channels[i][j].msg.type === 'req' ) {

            
            // check if timestamp is in CS - remove if it is, add if it is not
            if (processes[j].queue.length != 0) {
              if (processes[j].queue[0].pID == i) {
                processes[j].queue.splice(0, 1);
              } else {
                processes[j].queue.push( channels[i][j].msg.timestamp );
              }

            } else {
              processes[j].queue.push( channels[i][j].msg.timestamp );
            }

            // if process is requesting cs, respond
            if (processes[i].request == true) {
              channels[i][j].fifo_queue.push( new Message( i, 'res', new Timestamp( j, counter ) ) );
              channels[j][i].fifo_queue.push( new Message( i, 'res', new Timestamp( j, counter ) ) );
            }   
            
          } else { // 'res'
            processes[j].ok_ctr++;
          }

          // clear channel
          channels[i][j].in_use = -1;
          channels[j][i].in_use = -1;
          channels[i][j].msg = null;
          channels[j][i].msg = null;
          channels[i][j].color = "black";
          channels[j][i].color = "black";

          
        }

         if ( channels[i][j].in_use == -1 && channels[i][j].fifo_queue.length != 0) {
          if (dir == i) { // look at later!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            continue;
          }

          channels[i][j].msg = channels[i][j].fifo_queue[0];
          channels[j][i].msg = null;  

          // remove the first elements of the queues
          channels[i][j].fifo_queue.splice(0, 1);
          channels[j][i].fifo_queue.splice(0, 1);
          channels[i][j].in_use = j;
          channels[j][i].in_use = j;


          if (channels[i][j].msg.type === 'req') {
            channels[i][j].color = 'orange';
          } else if (channels[i][j].msg.type === 'res'){
            channels[i][j].color = 'purple';
          }
        }
      }
    }
  } 
}

/**
 * Function that handles each process, their color, 
 * tracks acknowledgements, and aquires/releases the
 * critical section.
 */
function handle_process() {
  for (i = 0; i < pnum; i++) {
    if (processes[i].color === 'blue') {
      processes[i].request = false;
      processes[i].color = 'black';
      processes[i].ok_ctr = 0;

    } else if (processes[i].ok_ctr == pnum - 1 && processes[i].queue[0].pID == i) {
      processes[i].color = 'green';
      processes[i].ok_ctr = 0;
      continue;

    } else if ( processes[i].cs_usage == 0 && processes[i].color === 'green' && processes[i].request == true) {
      processes[i].color = 'blue';
      processes[i].ok_ctr = 0;
      processes[i].queue.splice(0, 1);
      broadcast(i, 'req', new Timestamp(i, counter));
    }
  }
}

/**
 * Function that tracks how much time a process has
 * left in the critical section.
 */
function cooldown() {
  for (i = 0; i < pnum; i++) {
    if (processes[i].color === 'green') {
      if (processes[i].cs_usage != 0) {
        processes[i].cs_usage--;
      }
    }
  }
}

/**
 * Selects a random number between 0 and 9 to
 * determine the next process that will request
 * the critical section and for how long.
 */
function random_req() {
  var rand = Math.floor( Math.random() * 10 );
  return rand;
}

/**
 * The heartbeat of the simulation, it calls the other 
 * functions to keep the simulation running.
 */
async function tick() {
  sort_channel_queue();

  sort_process_queue();

  handle_process();

  handle_channels();


  var next_req = random_req();
  var next_time = random_req();
  if (next_req < pnum) {
    request_cs(next_req, next_time);
  }
  
  cooldown();
  draw(0);
}

/**
 * Function that draws the title and my name to the canvas
 * before the simulation begins.
 */
function splash() {
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  ctx.font = "40px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Timestamp Based Critical Section Algorithm", 110, 400);
  ctx.font = "20px Arial";
  ctx.fillText("Created by Alexander Richard", 350, 430);

  // create image here so it has time to load
  var img = new Image();
  img.src = 'iconfinder_access-time_326483.png';
  ctx.drawImage(img, 10, 10, 32, 32);
}

/**
 * Function that draws all of the elements of the simulation
 * to the canvas.
 */
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

  var legw = 230;
  var legh = 22;

  ctx.fillStyle = "red";
  ctx.fillRect(legw, legh, 20, 9);
  ctx.fillText("Enter", legw + 30, 30);

  ctx.fillStyle = "green";
  ctx.fillRect(legw, legh + 20, 20, 9);
  ctx.fillText("Critical Section", legw + 30, 50);

  ctx.fillStyle = "blue";
  ctx.fillRect(legw, legh + 40, 20, 9);
  ctx.fillText("Exit", legw + 30, 70);

  ctx.fillStyle = "black";
  ctx.fillRect(legw, legh + 60, 20, 9);
  ctx.fillText("Remainder", legw + 30, 90);

  ctx.strokeStyle = "orange";
  ctx.fillStyle = "orange";
  ctx.beginPath();
  ctx.moveTo(legw, legh + 85);
  ctx.lineTo(legw + 20, legh + 85);
  ctx.stroke();
  ctx.fillText("Request", legw + 30, 110);

  ctx.strokeStyle = "purple";
  ctx.fillStyle = "purple";
  ctx.beginPath();
  ctx.moveTo(legw, legh + 105);
  ctx.lineTo(legw + 20, legh + 105);
  ctx.stroke();
  ctx.fillText("Ack", legw + 30, 130);

  // note section
  ctx.font = "5px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("CS Time is the time a process needs to spend in a critical section.", legw - 65, 315);
  ctx.fillText("Ack's is the count of how many acknowlegements have been received.", legw - 65, 322);

  // return to the previous font
  ctx.font = "10px Arial";

  if (pnum == 2) {
    // dimentions
    var wl = 130;
    var wr = wl + 75;
    var h = 190;

    //queues

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(wl - 67, h - 9, 50, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(wl - 65, (h + 2) + ((10 + 3) * i));
      ctx.lineTo(wl - 65 + 45, (h + 2) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.lineWidth = 1.5;
    ctx.fillStyle = "black";
    

    ctx.fillText("Ack's: " + processes[0].ok_ctr, wl - 65, h - 10);
    ctx.fillText("CS Time: " + processes[0].cs_usage, wl - 65, h - 20);
    ctx.fillText("Queue:", wl - 65, h);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[0].queue.length && i < 4; i++) {
      ctx.fillText('PID ' + processes[0].queue[i].pID + ' at ' + processes[0].queue[i].time, wl - 65, (h + 12) + (i * (10 + 3)));
    }
    ctx.font = "10px Arial";

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(wr + 18, h - 9, 50, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(wr + 20, (h + 2) + ((10 + 3) * i));
      ctx.lineTo(wr + 20 + 45, (h + 2) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.lineWidth = 1.5;
    ctx.fillStyle = "black";
    ctx.fillText("Ack's: " + processes[1].ok_ctr, wr + 20, h - 10);
    ctx.fillText("CS Time: " + processes[1].cs_usage, wr + 20, h - 20);
    ctx.fillText("Queue:", wr + 20, h);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[1].queue.length && i < 4; i++) {
      ctx.fillText('PID ' + processes[1].queue[i].pID + ' at ' + processes[1].queue[i].time, wr + 20, (h + 12) + (i * (10 + 3)));
    }
    ctx.font = "10px Arial";

    // channels

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
    ctx.fillStyle = "white";
    ctx.fillText("P0", wl - 6, h + 3.5);

    ctx.fillStyle = "white";
    ctx.fillText("P1", wr - 6, h + 3.5);

  } else if (pnum == 3) {
    // dimensions
    var wl = 125;
    var wr = wl + 75;
    var mid = (wl + wr) / 2;
    var hb = 175;
    var ht = hb - 50;

    //queues

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(wl - 67, hb - 9, 50, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(wl - 65, (hb + 2) + ((10 + 3) * i));
      ctx.lineTo(wl - 65 + 45, (hb + 2) + ((10 + 3) * i));
      ctx.stroke();
    }
    
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "black";
    

    ctx.fillText("Ack's: " + processes[0].ok_ctr, wl - 65, hb - 10);
    ctx.fillText("CS Time: " + processes[0].cs_usage, wl - 65, hb - 20);
    ctx.fillText("Queue:", wl - 65, hb);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[0].queue.length && i < 4; i++) {
      ctx.fillText('PID ' + processes[0].queue[i].pID + ' at ' + processes[0].queue[i].time, wl - 65, (hb + 12) + (i * (10 + 3)));
    }
    ctx.font = "10px Arial";

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(mid - 67, ht - 44, 50, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(mid - 65, (ht - 33) + ((10 + 3) * i));
      ctx.lineTo(mid - 65 + 45, (ht - 33) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.lineWidth = 1.5;
    ctx.fillStyle = "black";
    
    ctx.fillText("Ack's: " + processes[1].ok_ctr, mid - 65, ht - 45);
    ctx.fillText("CS Time: " + processes[1].cs_usage, mid - 65, ht - 55);
    ctx.fillText("Queue:", mid - 65, ht - 35);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[1].queue.length && i < 4; i++) {
      ctx.fillText('PID ' + processes[1].queue[i].pID + ' at ' + processes[1].queue[i].time, mid - 65, (ht - 23) + (i * (10 + 3)));
    }
    ctx.font = "10px Arial";

    

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(wr + 18, hb - 9, 50, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(wr + 20, (hb + 2) + ((10 + 3) * i));
      ctx.lineTo(wr + 20 + 45, (hb + 2) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.lineWidth = 1.5;
    ctx.fillStyle = "black";

    ctx.fillText("Ack's: " + processes[2].ok_ctr, wr + 20, hb - 10);
    ctx.fillText("CS Time: " + processes[2].cs_usage, wr + 20, hb - 20);
    ctx.fillText("Queue:", wr + 20, hb);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[2].queue.length && i < 4; i++) {
      ctx.fillText('PID ' + processes[2].queue[i].pID + ' at ' + processes[2].queue[i].time, wr + 20, (hb + 12) + (i * (10 + 3)));
    }
    ctx.font = "10px Arial";

    // draw channels

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
    ctx.fillStyle = "white";
    ctx.fillText("P0", wl - 6, hb + 3.5);

    ctx.fillStyle = "white";
    ctx.fillText("P1", mid - 6, ht + 3.5);

    ctx.fillStyle = "white";
    ctx.fillText("P2", wr - 6, hb + 3.5);

  } else { // 4 processes
    // canvas variables
    var th = 110;
    var lw = 70;
    var rw = lw + 85;
    var bh = th + 95;

    //queues and stats

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(lw - 67, th - 9, 50, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(lw - 65, (th + 2) + ((10 + 3) * i));
      ctx.lineTo(lw - 65 + 45, (th + 2) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.fillStyle = "black";
    ctx.fillText("Ack's: " + processes[0].ok_ctr, lw - 65, th - 10);
    ctx.fillText("CS Time: " + processes[0].cs_usage, lw - 65, th - 20);
    ctx.fillText("Queue:", lw - 65, th);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[0].queue.length && i < 4; i++) {
      ctx.fillText('PID ' + processes[0].queue[i].pID + ' at ' + processes[0].queue[i].time, lw - 65, (th + 12) + (i * (10 + 3)));
    }
    ctx.font = "10px Arial";

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(rw + 18, th - 9, 50, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(rw + 20, (th + 2) + ((10 + 3) * i));
      ctx.lineTo(rw + 20 + 45, (th + 2) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.fillStyle = "black";
    ctx.fillText("Ack's: " + processes[1].ok_ctr, rw + 20, th - 10);
    ctx.fillText("CS Time: " + processes[1].cs_usage, rw + 20, th - 20);
    ctx.fillText("Queue:", rw + 20, th);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[1].queue.length && i < 4; i++) {
      
      ctx.fillText('PID ' + processes[1].queue[i].pID + ' at ' + processes[1].queue[i].time, rw + 20, (th + 12) + (i * (10 + 3)));
    }
    ctx.font = "10px Arial";

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(lw - 67, bh - 9, 50, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(lw - 65, (bh + 2) + ((10 + 3) * i));
      ctx.lineTo(lw - 65 + 45, (bh + 2) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.fillStyle = "black";
    ctx.fillText("Ack's: " + processes[2].ok_ctr, lw - 65, bh - 10);
    ctx.fillText("CS Time: " + processes[2].cs_usage, lw - 65, bh - 20);
    ctx.fillText("Queue:", lw - 65, bh);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[2].queue.length && i < 4; i++) {
      
      ctx.fillText('PID ' + processes[2].queue[i].pID + ' at ' + processes[2].queue[i].time, lw - 65, (bh + 12) + (i * (10 + 3)));
    }
    ctx.font = "10px Arial";

    // queue aesthetics
    ctx.fillStyle = "lightblue";
    ctx.fillRect(rw + 18, bh - 9, 50, 65);
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 0.5;
    for (i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(rw + 20, (bh + 2) + ((10 + 3) * i));
      ctx.lineTo(rw + 20 + 45, (bh + 2) + ((10 + 3) * i));
      ctx.stroke();
    }

    ctx.fillStyle = "black";
    ctx.fillText("Ack's: " + processes[3].ok_ctr, rw + 20, bh - 10);
    ctx.fillText("CS Time: " + processes[3].cs_usage, rw + 20, bh - 20);
    ctx.fillText("Queue:", rw + 20, bh);

    ctx.font = "8px Arial";
    for (i = 0; i < processes[3].queue.length && i < 4; i++) {
      
      ctx.fillText('PID ' + processes[3].queue[i].pID + ' at ' + processes[3].queue[i].time, rw + 20, (bh + 12) + (i * (10 + 3)));
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
    ctx.fillStyle = "white";
    ctx.fillText("P0", lw - 6, th + 3);

    ctx.fillStyle = "white";
    ctx.fillText("P1", rw - 6, th + 3);

    ctx.fillStyle = "white";
    ctx.fillText("P2", lw - 6, bh + 3);

    ctx.fillStyle = "white";
    ctx.fillText("P3", rw - 6, bh + 3);

  }
  
}