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
  
  var x = event.pageX,
      y = event.pageY;

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
  c.fillText("Ring Leader Election Simulation", cvs.width / 5, window.innerHeight / 3);

  c.font = "30px Arial";
  c.fillText("Created by Alexander Richard", (cvs.width / 5) + 70, (window.innerHeight / 3) + 40);
}

function reset_button() {
  location.reload();
  return false;
}

function get_crashed_node_index(id) {
  for (let i = 0; i < crashed_array.length; i++) {
    if (crashed_array[i] == id) {
      return i;
    }
  }
}

function toggle_crashed_node(node) {
  if (node.color == CRASHED) {
    node.color = RUNNING_PROCESS;
    node.predecessor.successor = node;
    node.successor.predecessor = node;
    node.crashed_successor_id = node.predecessor.crashed_successor_id;
    node.successor_crash = node.predecessor.successor_crash;
    node.predecessor.crashed_successor_id = -1;
    node.predecessor.successor_crash = false;
    crashed_array.splice(get_crashed_node_index(node.id));
    node.initiate_election();
    node.draw();

  } else {
    node.color = CRASHED;
    node.predecessor.crashed_successor_id = node.id;
    node.predecessor.successor_crash = true;
    node.predecessor.successor = node.successor
    node.successor.predecessor = node.predecessor
    crashed_array.push(node.id);
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

const node_array = [];

var crashed_array = [];

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
  var unparsed_structure = document.getElementById("structInput").value;
  var parsed_structure = unparsed_structure.split(", ");

  if (parsed_structure.length < 3) {
    alert("Error - Please Enter at Least Three Processes");
    return;
  }

  if (check_negatives(parsed_structure)) {
    alert("Error - Please Enter Non-Negative Process ID's");
    return;
  }

  if (check_repeat_ids(parsed_structure)) {
    alert("Error - Please Enter Different ID Numbers");
    return;
  }

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
  
  start_flag = true;
  init_simulation(parsed_structure);
}

/*
 * type: 0 - election; 1 - leader
 */
class Message {
  constructor(type, payload) {
    this.type = type;
    this.payload = payload;
  }
}

class Node {
  constructor(id, predecessor=null, successor=null) {
    this.id = id;
    this.x = null;
    this.y = null;
    this.color = RUNNING_PROCESS;
    this.predecessor = predecessor;
    this.successor = successor;
    this.running = false;
    this.election = false;
    this.leader = -1;
    this.message_queue = [];
    this.successor_crash = false;
    this.crashed_successor_id = -1;
  }

  send_message = (message) => {
    this.successor.message_queue.push(message);
    this.message_queue.splice(0, this.message_queue.length);
  }

  initiate_election = () => {
    if (this.leader == this.id || this.color == CRASHED) {
      return;
    }

    this.color = CALL_ELECTION;
    this.running = true;
    this.election = true;
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
    if (this.election && this.message_queue.length == 0) {
      this.election = false;
      this.send_message(new Message(MSG_ELECTION, this.id));
    } else if (this.message_queue.length == 0) {
      return 1;
    }

    if (this.message_queue.length != 0) {
      var msg = this.message_queue.shift();

      if (this.successor_crash) {
        if (msg.payload == this.crashed_successor_id) {
          this.initiate_election();
          this.successor_crash = false;
          this.crashed_successor_id = -1;
          return;
        }
      }

      if (msg.type == MSG_LEADER) {
        if (msg.payload != this.id) {
          this.color = RUNNING_PROCESS;
          this.send_message(new Message(MSG_LEADER, msg.payload));
        }
        this.leader = msg.payload;
        this.running = false;
        
      } else {
        if (msg.payload > this.id) {
          this.send_message(new Message(MSG_ELECTION, msg.payload));
        } else if (msg.payload < this.id && this.running == false) {
          this.send_message(new Message(MSG_ELECTION, this.id));
          this.running = true;
        } else if (msg.payload == this.id) {
          this.color = BECOME_LEADER;
          this.leader = this.id;
          this.send_message(new Message(MSG_LEADER, this.id));
        }
      }
    }
    this.message_queue = [];
    return 0;
  }

  draw = () => {
    c.strokeStyle = 'black';
    c.fillStyle = this.color;
    c.beginPath();
    c.arc(this.x, this.y, (1 / node_array.length) * 200, 0, 2 * Math.PI);
    c.fill(); // stroke() for lines

    // add the labels
    let font_size = 150 / node_array.length;
    c.font = font_size + "px Arial";
    c.strokeStyle = 'white';
    c.fillStyle = 'white';
    c.fillText(this.id, this.x - (c.measureText(this.id).width / 2), this.y+(font_size/3));

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
      if (this.message_queue[0].type == 0) {
        c.rect(this.x + msg_offset, this.y + 3, c.measureText("E: " + this.payload).width / 2, 0 - font_size);
        c.stroke();
        c.fillText('E: ' + this.message_queue[0].payload, this.x + msg_offset, this.y);
      } else {
        c.rect(this.x + msg_offset, this.y + 3, c.measureText("L: " + this.payload).width / 2, 0 - (font_size));
        c.stroke();
        c.fillText('L: ' + this.message_queue[0].payload, this.x + msg_offset, this.y);
      }
    }
  }
}

function init_simulation(ring_structure) {
  var len = ring_structure.length;
  for (var i = 0; i < len; i++) {
    if (node_array.length == 0) {
      node_array.push(new Node(parseInt(ring_structure[0])))
    } else {
      node_array.push(new Node(parseInt(ring_structure[i]), node_array[i-1]));
    }
  }

  node_array[0].predecessor = node_array[node_array.length - 1];
  for (var i = 0; i < len; i++) {
    if (i == node_array.length - 1) {
      node_array[i].successor = node_array[0];
    } else {
      node_array[i].successor = node_array[i+1];
    }
  }

  arrange_nodes(ring_x, ring_y, ring_rad);

  start_simulation();
}

function create_animation(k) {
  let font_size = 150 / node_array.length;
  c.font = toString(font_size) + "px Arial";
  //c.fillText("Iteration: " + k, 20, 30); // uncomment to debug

  // draw the legend
  let legend_offset_x = cvs.width - 220;
  let legend_offset_y = 30;
  c.font = "23px Arial";
  c.fillText("Running Node", legend_offset_x, legend_offset_y + 20);
  c.fillText("Elected Leader", legend_offset_x, legend_offset_y + 50);
  c.fillText("Running for Election", legend_offset_x, legend_offset_y + 80);
  c.fillText("Crashed Node", legend_offset_x, legend_offset_y + 110);

  c.fillStyle = RUNNING_PROCESS;
  c.fillRect(legend_offset_x - 50, legend_offset_y + 20, 40, -20);

  c.fillStyle = BECOME_LEADER;
  c.fillRect(legend_offset_x - 50, legend_offset_y + 50, 40, -20);

  c.fillStyle = CALL_ELECTION;
  c.fillRect(legend_offset_x - 50, legend_offset_y + 80, 40, -20);

  c.fillStyle = CRASHED;
  c.fillRect(legend_offset_x - 50, legend_offset_y + 110, 40, -20);


  // draw the connections
  c.strokeStyle = 'rgba(0, 0, 0, 1)';
  c.beginPath();
  c.arc(ring_x, ring_y, ring_rad, 0, 2 * Math.PI);
  c.stroke();

  // draw the nodes
  for (var e = 0; e < node_array.length; e++) {
    node_array[e].draw();
  }
}

function is_crashed(id) {
  for (let i = 0; i < crashed_array.length; i++) {
    if (crashed_array[i] == id) {
      return true;
    }
  }

  return false;
}

function next_election() {
  let next = Math.floor(Math.random() * node_array.length);

  if (crashed_array.length == node_array.length) {
    return -1;
  }

  // randomly generate a new node for an election until a non-crashed node without an incoming message is chosen
  for(let i = 0; is_crashed(node_array[next].id); i++) {
    // after 10 attempts, exit
    if (i == 9 || node_array[next].message_queue.length != 0) {
      return -1;
    }

    next = Math.floor(Math.random() * node_array.length);
  }

  return next;
}


async function start_simulation() {
  c.clearRect(0, 0, cvs.width, cvs.height);
  create_animation(0);
  let election = null;
  let next = -1;
  let skip = -1;

  for(let k = 0;;k++) {      
    // decide if an election should occur this round:
    election = Math.floor(Math.random() * Math.floor(3));

    // start an election on the first turn and make it random after that
    if (election == 1 && k > 0) {
      next = next_election();

      if (next != -1) {
        node_array[next].initiate_election();
      }
      
    } else if (k == 0) {
      node_array[Math.floor(Math.random() * node_array.length)].initiate_election();
    }

    // run through all processes
    for (let i = 0; i < node_array.length; i++) {
      skip = node_array[i].run();

      if (simulation_speed != -1 && skip == 0) {
        await sleep(simulation_speed);
      } else {
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
