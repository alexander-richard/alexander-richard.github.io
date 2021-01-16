const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');

cvs.width = window.innerWidth / 1.7;
cvs.height = window.innerHeight / 1.25;

window.addEventListener('resize', function () {
  cvs.width = window.innerWidth / 1.7;
  cvs.height = window.innerHeight / 1.25;
  ring_x = cvs.width / 2.5;
  ring_y = cvs.height / 2;
  ring_rad = cvs.height / cvs.width * 300;
  arrange_nodes(ring_x, ring_y, ring_rad);
});

cvs.addEventListener('click', function(event) {
  // ensure simulation start flag is triggered
  if (!start_flag) {
    return;
  }
  
  /**
   * Firefox compatibility error
   * Fix from https://miloq.blogspot.com/2011/05/coordinates-mouse-click-canvas.html
   */
  if (event.pageX != undefined && event.pageY != undefined) {
    var x = event.pageX,
      y = event.pageY;
  } else {
    var x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  

      x = x - cvs.offsetLeft;
      y = y - cvs.offsetTop;

  for (let i = 0; i < node_array.length; i++) {
    if (mouse_collision(node_array[i], x, y, (1 / node_array.length) * 200)) {
      if (node_array[i].color != CALL_ELECTION) {
        node_array[i].initiate_election();
      }
      
    }
  }
});

cvs.addEventListener('contextmenu', function(event) {
  event.preventDefault();

  // ensure simulation start flag is triggered
  if (!start_flag) {
    return;
  }
  
  /**
   * Firefox compatibility error
   * Fix from https://miloq.blogspot.com/2011/05/coordinates-mouse-click-canvas.html
   */
  if (event.pageX != undefined && event.pageY != undefined) {
    var x = event.pageX,
      y = event.pageY;
  } else {
    var x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  

      x = x - cvs.offsetLeft;
      y = y - cvs.offsetTop;

  for (let i = 0; i < node_array.length; i++) {
    if (mouse_collision(node_array[i], x, y, (1 / node_array.length) * 200)) {
      toggle_crashed_node(node_array[i]);
    }
  }
});

function mouse_collision(node, mouse_x, mouse_y, offset) {
  if (mouse_x > node.x - offset
  &&  mouse_x < node.x + offset
  &&  mouse_y > node.y - offset
  &&  mouse_y < node.y + offset) {
    return true;
  } else {
    return false;
  }
}

function load_credits() {
  c.font = "40px Arial";
  c.fillText("Bully Leader Election Simulation", cvs.width / 5, window.innerHeight / 3);

  c.font = "30px Arial";
  c.fillText("Created by Alexander Richard", (cvs.width / 5) + 70, (window.innerHeight / 3) + 40);
}

function reset_button() {
  location.reload();
  return false;
}

function toggle_crashed_node(node) {
  if (node.color == CRASHED) {
    node.color = RUNNING_PROCESS;
    node.initiate_election();
    node.draw();

  } else {
    node.color = CRASHED;
    node.leader = -1;
    node.draw();
  }
}

function sleep(interval) {
  return new Promise(resolve => setTimeout(resolve, interval));
}

const BECOME_LEADER = 'red';
const CALL_ELECTION = 'blue';
const RUNNING_PROCESS = 'black';
const CRASHED = 'grey';

const MSG_ELECTION = 0;
const MSG_LEADER = 1;
const MSG_BULLY = 2;

const node_array = [];

const TIMEOUT_LEADER = 10;

var start_flag = false;
var pause_flag = false;

var ring_x = cvs.width / 2.5; // x value for the center of the ring
var ring_y = cvs.height / 2; // y value for the center of the ring
var ring_rad = cvs.height / cvs.width * 300; // radius of the ring

var simulation_speed = 1000;

function set_timing_interval(interval) {
  if (interval == -1) {
    document.getElementById("step_button").disabled = false;
    pause_flag = true;
  } 
  
  simulation_speed = interval;
}

function step() {
  pause_flag = false;
}

function check_negatives (input) {
  for (let i = 0; i < input.length; i++) {
    if (input[i] < 0) {
      return true;
    }
  }
  return false;
}

function check_repeat_ids (input) {
  let seen = [];
  for (let i = 0; i < input.length; i++) {
    if (seen.includes(input[i])) {
      return true;
    }
    seen.push(input[i]);
  }
  return false;
}

function parse_input() {
  let no_of_nodes = document.getElementById("structInput").value;

  // check the speed setting
  if (document.getElementById("fast").checked) {
    set_timing_interval(500);
  } else if (document.getElementById("slow").checked) {
    set_timing_interval(1000);
  } else if (document.getElementById("step").checked) {
    set_timing_interval(-1);
  } else {
    alert("Error - Please Select a Speed for the Simulation");
    return;
  }

  // lock in the speed settings
  document.getElementById("fast").disabled = true;
  document.getElementById("slow").disabled = true;
  document.getElementById("step").disabled = true;
  document.getElementById("start_button").disabled = true;
  
  start_flag = true;
  init_simulation(no_of_nodes);
}

/*
 * type: 0 - election; 1 - leader; 2 - bully
 */
class Message {
  constructor(type, payload, start_node, end_node) {
    this.type = type;
    this.payload = payload;
    this.startX = start_node.x;
    this.startY = start_node.y;
    this.endX = end_node.x;
    this.endY = end_node.y;
    this.start_node = start_node;
    this.end_node = end_node;
  }

  draw = () => {
    let label = null;
    if (this.type == 0) {
      label = "Election";
    } else if (this.type == 1) {
      label = "Leader";
    } else { // type == 2
      label = "OK";
    }

    // change the dimentions of the line to avoid hitting the nodes
    let new_startX = 0;
    let new_startY = 0;
    let new_endX = 0;
    let new_endY = 0;
    let radius =  (1 / node_array.length) * 200;
    let x_adjust_r = false;
    let x_adjust_l = false;
    let y_adjust_t = false;
    let y_adjust_b = false;


    // X direction
    if (this.endX < this.startX) { // end <- start
        if (this.startX - this.endX < radius * 2) {
            new_startX = this.startX;
            new_endX = this.endX;
            y_adjust_b = true;

        } else {
            new_startX = this.startX - radius;
            new_endX = this.endX + radius;
        }
        
    } else if (this.startX < this.endX) { // start -> end
        if (this.endX - this.startX < radius * 2) {
            new_startX = this.startX;
            new_endX = this.endX;
            y_adjust_t = true;

        } else {
            new_startX = this.startX + radius;
            new_endX = this.endX - radius;
        }
        
    } else { // inline
        new_startX = this.startX;
        new_endX = this.endX;

        if (this.endY < this.startY) {
            y_adjust_b = true;
        } else {
            y_adjust_t = true;
        }
    }

    // Y direction
    if (this.endY < this.startY) { // start below end
        if (this.startY - this.endY < radius * 2) {
            new_startY = this.startY;
            new_endY = this.endY;
            x_adjust_r = true;

        } else {
            new_startY = this.startY - radius;
            new_endY = this.endY + radius;
        }
        

    } else if (this.startY < this.endY) { // start above end
        if (this.endY - this.startY < radius * 2) {
            new_startY = this.startY;
            new_endY = this.endY;
            x_adjust_l = true;

        } else {
            new_startY = this.startY + radius;
            new_endY = this.endY - radius;
        }
        
    } else { // inline
        new_startY = this.startY;
        new_endY = this.endY;

        if (this.endX < this.startX) {
            x_adjust_l = true;
        } else {
            x_adjust_r = true;
        }
    }

    // adjustments so the lines dont touch the nodes
    if (x_adjust_r) {
        new_startX = new_startX + radius / 2;
        new_endX = new_endX - radius / 2;
        x_adjust_r = false;
    }
    if (x_adjust_l) {
        new_startX = new_startX - radius / 2;
        new_endX = new_endX + radius / 2;
        x_adjust_l = false;
    }

    if (y_adjust_b) {
        new_startY = new_startY - radius / 2;
        new_endY = new_endY + radius / 2;
        y_adjust_t = false;
    }

    if (y_adjust_t) {
        new_startY = new_startY + radius / 2;
        new_endY = new_endY - radius / 2;
        y_adjust_b = false;
    }

    // draw the message lines
    c.strokeStyle = "black";
    c.beginPath();
    c.moveTo(new_startX, new_startY);
    c.lineTo(new_endX, new_endY);
    c.stroke();

    // draw the arrows
    let arrow_len = 20;
    let arrow_angle = 60 * (Math.PI / 180);
    let rise = new_startY - new_endY;
    let run = new_endX - new_startX;

    // calculate the angle between the axis and the line
    let alpha = Math.atan(rise/run);  
    let delta = (Math.PI / 2) - alpha;

    // calculate the angle between the axis and the arrow end point
    let beta = (arrow_angle / 2) - alpha;
    delta = delta - (arrow_angle / 2);

    // determine the x and y offset for the arrow lines
    let y_offset_t = arrow_len * Math.sin(beta);
    let x_offset_t = arrow_len * Math.cos(beta);
    let y_offset_b = arrow_len * Math.cos(delta);
    let x_offset_b = arrow_len * Math.sin(delta);

    if (new_startX <= new_endX) {
      c.beginPath();
      c.moveTo(new_endX, new_endY);
      c.lineTo(new_endX - x_offset_t, new_endY - y_offset_t);
      c.stroke();

      c.beginPath();
      c.moveTo(new_endX, new_endY);
      c.lineTo(new_endX - x_offset_b, new_endY + y_offset_b);
      c.stroke();
    } else if (new_endX < new_startX) {
      c.beginPath();
      c.moveTo(new_endX, new_endY);
      c.lineTo(new_endX + x_offset_t, new_endY + y_offset_t);
      c.stroke();

      c.beginPath();
      c.moveTo(new_endX, new_endY);
      c.lineTo(new_endX + x_offset_b, new_endY - y_offset_b);
      c.stroke();
  }
    

    // determine how much to rotate the context before drawing the label
    let dx = new_startX - new_endX;
    let dy = new_startY - new_endY;
    let angle = Math.atan2(dy, dx);

    if (new_startX < new_endX && new_startY > new_endY || new_startX < new_endX && new_startY < new_endY) {
        dx = new_endX - new_startX;
        dy = new_endY - new_startY;
        angle = Math.atan2(dy, dx);
    }

    // rotate the context
    c.save();    

    // draw the label
    let font_size = 150 / node_array.length;
    c.font = font_size + "px Arial";
    if (label == "OK") {
        dx = new_endX - new_startX;
        dy = new_endY - new_startY;
        angle = Math.atan2(dy, dx);

        if (new_startX > new_endX && new_startY > new_endY || new_startX > new_endX && new_startY < new_endY) {
            dx = new_startX - new_endX;
            dy = new_startY - new_endY;
            angle = Math.atan2(dy, dx);
        }

        c.translate(((new_startX + new_endX) / 2), ((new_startY + new_endY) / 2));
        c.rotate(angle);
        c.fillText(label, -15, -10);

    } else {
        
        c.translate(((new_startX + new_endX) / 2), ((new_startY + new_endY) / 2));
        c.rotate(angle);
        c.fillText(label, -40, -10);
    }

    //restore the context
    c.restore();

  }
}

// enqeue with push and dequeue with shift (TODO: delete this comment)
function send_message_to_higher (type, payload, start_node) {
    let mssg = null;
    for (let i = 0; i < start_node.higher_ids.length; i++) {
        mssg = new Message(type, payload, start_node, start_node.higher_ids[i]);
        if (start_node.higher_ids[i].color == CRASHED && type == MSG_LEADER) {
            continue;
        }
        mssg.draw();
        if (start_node.higher_ids[i].color == CRASHED) {
            continue;
        }
        start_node.higher_ids[i].message_queue.push(mssg);
    }
}

function send_message_to_lower (type, payload, start_node) {
    let mssg = null;
    for (let i = 0; i < start_node.lower_ids.length; i++) {
        mssg = new Message(type, payload, start_node, start_node.lower_ids[i]);
        if (start_node.lower_ids[i].color == CRASHED && type == MSG_LEADER) {
            continue;
        }
        mssg.draw();
        if (start_node.lower_ids[i].color == CRASHED) {
            continue;
        }
        start_node.lower_ids[i].message_queue.push(mssg);
    }
}

function send_message (type, payload, start_node, end_node) {
    if (end_node.color == CRASHED) {
        return;
    }
    let mssg = null;
    mssg = new Message(type, payload, start_node, end_node);
    mssg.draw();
    end_node.message_queue.push(mssg);

}

class Node {
    constructor(id, index) {
      this.id = id;
      this.index = index;
      this.x = null;
      this.y = null;
      this.color = RUNNING_PROCESS;
      this.running = false;
      this.election = false;
      this.leader = -1;
      this.message_queue = [];
      this.leader_timer = 0;
      this.sent_election = false;

      // timer and flag to ping the leader
      this.check_leader_timer = 0;
      this.leader_reply_timer = 0;
      this.sent_leader_check = false;
  
      this.lower_ids = [];
      this.higher_ids = [];
    }
  
    initiate_election = () => {
      if (this.leader == this.id || this.color == CRASHED) {
        return;
      }
  
      this.color = CALL_ELECTION;
      this.running = true;
      this.election = true;
      this.draw();
    }
  
    determine_msg_priority = () => {
      if (this.message_queue.length <= 1) {
        return;
      }
  
      let highest_pri = new Message(MSG_ELECTION, -1);
  
      for (let i=0; i < this.message_queue.length; i++) {
        if (this.message_queue[i].type == MSG_LEADER) {
          if (highest_pri.type == MSG_ELECTION) {
            highest_pri = this.message_queue[i];
          } else if (this.message_queue[i].payload >= highest_pri.payload) {
            highest_pri = this.message_queue[i];
          }
        } else {
          if (highest_pri.type == MSG_ELECTION && highest_pri.payload <= this.message_queue[i].payload) {
            highest_pri = this.message_queue[i];
          }
        }
      }
  
      this.message_queue = [highest_pri];
    }
  
    run = () => {
      if (this.color == CRASHED) {
        return 0;
      }

      // move this under leader reply timer if it causes timing bugs
      if (this.leader_reply_timer == 5 && this.leader != this.id) {
        this.initiate_election();
      }

      if (this.sent_leader_check && this.leader != this.id) {
        this.leader_reply_timer++;
      }

      // move this under leader check timer if it causes timing bugs
      if (this.check_leader_timer == 15 && this.leader != this.id) {
        send_message(MSG_ELECTION, this.id, node_array[this.index], node_array[this.leader - 1]);
        this.sent_leader_check = true;
      }

      if (this.leader != -1 && this.leader != this.id) {
          this.check_leader_timer++;
      }

      if (this.leader_timer == TIMEOUT_LEADER) {
        this.color = BECOME_LEADER;
        this.leader = this.id;
        this.leader_timer = 0;
        this.counting_to_leader = false;
        this.check_leader_timer = 0;
        this.leader_reply_timer = 0;
        this.sent_leader_check = false;

        send_message_to_higher(MSG_LEADER, this.id, node_array[this.index]);
        send_message_to_lower(MSG_LEADER, this.id, node_array[this.index]);
        
        return 0;
      }

      if (this.counting_to_leader == true) {
          this.leader_timer++;
      } else {
          this.leader_timer = 0;
      }

      if (this.election) {
        this.election = false;
        this.counting_to_leader = true;
        send_message_to_higher(MSG_ELECTION, this.id, node_array[this.index]);
        
      } else if (this.message_queue.length == 0) {
        if ( this.sent_leader_check) {
          return 0;
        } else {
          return 1;
        }
      } 
      
  
      if (this.message_queue.length != 0) {
        let msg = this.message_queue.shift();

        if (msg.type == MSG_ELECTION) {
            if (msg.start_node.id < this.id) {
                send_message(MSG_BULLY, this.id, node_array[this.index], msg.start_node);
            }

            if (this.leader != this.id) {
                this.counting_to_leader = true;
            }

            if (!this.sent_election) {
                send_message_to_higher(MSG_ELECTION, this.id, node_array[this.index]);
                this.sent_election = true;
                this.color = CALL_ELECTION;
            }

        } else if (msg.type == MSG_LEADER) {
            this.leader = msg.payload;
            this.color = RUNNING_PROCESS;
            this.check_leader_timer = 0;
            this.leader_reply_timer = 0;
            this.sent_leader_check = false;
        } else { // MSG_BULLY
            this.counting_to_leader = false;
            this.sent_election = false;
            this.color = RUNNING_PROCESS;
            if (msg.start_node.id == this.leader) {
                this.check_leader_timer = 0;
                this.leader_reply_timer = 0;
                this.sent_leader_check = false;

            }
        }
      }

      return 0;
    }

    draw_node_identifier = () => {
      c.strokeStyle = 'black';
      c.fillStyle = 'black';
      c.beginPath();
      let node_rad = (1 / node_array.length) * 200
      if (node_rad >= 40) {
        node_rad = 40;
      }
      c.arc(this.x, this.y, node_rad + 5, 0, 2 * Math.PI);
      c.stroke();
      
    }
  
    draw = () => {
      c.strokeStyle = 'black';
      c.fillStyle = this.color;
      c.beginPath();
      let node_rad = (1 / node_array.length) * 200
      if (node_rad >= 40) {
        node_rad = 40;
      }
      c.arc(this.x, this.y, node_rad, 0, 2 * Math.PI);
      c.fill(); // stroke() for lines
  
      // add the labels
      let font_size = 150 / node_array.length;
      if (font_size > 40) {
        font_size = 40;
      }
      c.font = font_size + "px Arial";
      c.strokeStyle = 'white';
      c.fillStyle = 'white';
      c.fillText(this.id, this.x - (c.measureText(this.id).width / 2), this.y+(font_size/3));
      c.strokeStyle = 'black';
      c.fillStyle = 'black';
   
      // ********** QUEUE DEBUGGING SECTION (uncomment to debug) ************
      // add the messages
      font_size = 150 / node_array.length;
      c.font = toString(font_size) + "px Arial";
  
      let msg_offset = -1;
  
      if (this.x < ring_x) {
        msg_offset = -150;
      } else {
        msg_offset = 70;
      }
  
      c.strokeStyle = 'black';
      c.fillStyle = 'black';
      
      c.beginPath();
      if (this.message_queue.length == 0) {
        c.rect(this.x + msg_offset, this.y + 2, 80, 0 - font_size);
        c.stroke();
      }
  
      
      if (this.message_queue.length != 0) {
        if (this.message_queue[0].type == MSG_ELECTION) {
          c.rect(this.x + msg_offset, this.y + 3, c.measureText("E: " + this.payload).width / 2, 0 - font_size);
          c.stroke();
          c.fillText('E: ' + this.message_queue[0].payload, this.x + msg_offset, this.y);
        } else if (this.message_queue[0].type == MSG_LEADER) {
          c.rect(this.x + msg_offset, this.y + 3, c.measureText("L: " + this.payload).width / 2, 0 - (font_size));
          c.stroke();
          c.fillText('L: ' + this.message_queue[0].payload, this.x + msg_offset, this.y);
        } else { // Bully
          c.rect(this.x + msg_offset, this.y + 3, c.measureText("L: " + this.payload).width / 2, 0 - (font_size));
          c.stroke();
          c.fillText('B: ' + this.message_queue[0].payload, this.x + msg_offset, this.y);
        }
      } 
      // ********** END OF QUEUE DEBUGGING SECTION ************

      c.font = "15px Arial";
      if (this.leader == -1) {
        c.fillText("Leader: None", this.x + msg_offset - 10, this.y + 15);
      } else {
        c.fillText("Leader: " + this.leader, this.x + msg_offset - 10, this.y + 15);
      }

      c.fillText("Leader Timer: " + this.leader_timer, this.x + msg_offset - 10, this.y);      
      c.fillText("Check Leader: " + this.check_leader_timer, this.x + msg_offset - 10, this.y + 30);  
      c.fillText("Leader Timeout: " + this.leader_reply_timer, this.x + msg_offset - 10, this.y + 45);  
    }
  }

function init_simulation(no_of_nodes) {
    for (let i = 0; i < no_of_nodes; i++) {
        node_array.push(new Node(i + 1, i));
    }

    // sort the nodes into higher or lower categories
    for (let i = 0; i < no_of_nodes; i++) {
        for (let j = 0; j < no_of_nodes; j++) {
            if (j == i) {
                continue;
            } else if (node_array[j].id < node_array[i].id) {
                node_array[i].lower_ids.push(node_array[j]);
            } else {
                node_array[i].higher_ids.push(node_array[j]);
            }
        }
    }

    arrange_nodes(ring_x, ring_y, ring_rad);

    start_simulation();
}

function create_animation(k) {
    let font_size = 150 / node_array.length;
    c.font = toString(font_size) + "px Arial";

    // draw the legend
    let legend_offset_x = cvs.width - 250;
    let legend_offset_y = 30;
    c.font = "23px Arial";
    c.fillText("Elected Leader", legend_offset_x, legend_offset_y + 10);
    c.fillText("Requesting an Election", legend_offset_x, legend_offset_y + 40);
    c.fillText("Crashed", legend_offset_x, legend_offset_y + 70);

    c.fillStyle = BECOME_LEADER;
    c.fillRect(legend_offset_x - 50, legend_offset_y + 10, 40, -20);

    c.fillStyle = CALL_ELECTION;
    c.fillRect(legend_offset_x - 50, legend_offset_y + 40, 40, -20);

    c.fillStyle = CRASHED;
    c.fillRect(legend_offset_x - 50, legend_offset_y + 70, 40, -20);

    // draw the nodes
    for (var e = 0; e < node_array.length; e++) {
        node_array[e].draw();
    }
}

async function start_simulation() {
    c.clearRect(0, 0, cvs.width, cvs.height);
    create_animation(0);
    let election = null;
    let next = -1;
    let skip = -1;

  
    for(let k = 0;;k++) {      
      await sleep(10);
  
      // run through all processes
      for (let i = 0; i < node_array.length; i++) {
        node_array[i].draw_node_identifier();
        skip = node_array[i].run();
  
        if (simulation_speed != -1 && skip == 0) {
          await sleep(simulation_speed);
        } else if (pause_flag){
          while (pause_flag && skip == 0) {
            await sleep(5);
          }
          pause_flag = true;
        }
        
        c.clearRect(0, 0, cvs.width, cvs.height);
        create_animation(k);
        
      }
    }
  }
  
  function arrange_nodes(x, y, r) {
    for (let i = 0; i < node_array.length; i++) {
      node_array[i].x = (x + r * Math.cos((2 * Math.PI) * i/node_array.length))
      node_array[i].y = (y + r * Math.sin((2 * Math.PI) * i/node_array.length))
    }
  }