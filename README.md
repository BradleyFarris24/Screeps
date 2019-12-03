// main.js
// Bradley Farris
// 12-2-19

require('proto.Room');
require('proto.Creep');

module.exports.loop = function () {

Game.extensions = require('ext.Game');

  for (var room of Game.extensions.myRooms()) {
        // spawn all the creeps we want to exist
        room.doSpawn();
        // activate the tower defenses
        room.defense();
    }

   for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        creep.act();
    }
    Game.extensions.cleanup();
}
module.exports = {

   // returns an array of all rooms I control
    myRooms: function() {
        // loop thru each room I have a spawn in.
        // using the Game.spawns array for cpu efficiency, but some rooms have more than
        // one spawn, so we need to make sure we don't run the same room twice.
        var myRooms = [];
        for (var spawnName in Game.spawns) {
            var spawn = Game.spawns[spawnName];
            var room = spawn.room;

   if (room.controller.level > 0 && myRooms.indexOf(room) < 0) {
                myRooms.push(room);
            }
        }

   return myRooms;
    },

   // removes stale items from memory
    cleanup: function() {
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
    },

};
Creep.roles = {
    "harvester": require('role.Harvester'),
    "builder": require('role.Builder'),
    "miner": require('role.Miner'),
    "charger": require('role.Charger'),
    "worshiper": require('role.Worshiper'),
    "mule": require('role.Mule'),
};

Creep.prototype.act = function() {

   // simply call the run method on this creep's role
    Creep.roles[this.memory.role].run(this);

};

Room.SpawnPlan = require('const.SpawnPlan');

// performs the spawnCreep() calls for a room
Room.prototype.doSpawn = function() {

    // get all the available spawns in this room
    var spawns = this.find(FIND_MY_SPAWNS, {
        filter: (spawn) => {
            return !spawn.spawning;
        }
    });
    // if no spawns are available, exit
    if (!spawns) return;

    // get the object that specifies our spawn plan for this room
    var spawnPlan = this.getSpawnPlan();
    if (!spawnPlan) return;

    // for our available spawns, create a creep if it can and should
    for (var spawn of spawns) {
        // execute the spawn plan
        for (var creepPlan of spawnPlan) {
            // create a name for this creep based on its role, given name, and room name
            var name = creepPlan.role + ' ' + creepPlan.midname + ' ' + this.name;
            // if this creep doesn't exist
            if (Game.creeps[name] == undefined) {
                // spawn the creep
                Creep.roles[creepPlan.role].create(
                    spawn,
                    name,
                    creepPlan.size,
                    creepPlan.args
                );
                // break will exit the inner most for loop, which we want to do because
                // we don't want to tell this spawn to create any other creeps when we've
                // just identified the next one to create
                break;
            }
        }
    }

};

// returns a list of creep plans depending on the room's RCL and energyCapacityAvailable
Room.prototype.getSpawnPlan = function() {

   var rcl = this.controller.level;
    var fullyBuiltEnergyCapacity =
        (CONTROLLER_STRUCTURES["extension"][rcl] * EXTENSION_ENERGY_CAPACITY[rcl]) +
        (CONTROLLER_STRUCTURES["spawn"][rcl] * SPAWN_ENERGY_CAPACITY);

   if (rcl == 0) {
        // we don't control this room, so don't spawn any creeps
        return [];
    }

   var effectiveRcl;
    if (this.energyCapacityAvailable < fullyBuiltEnergyCapacity) {
        // our room has been upgraded, but we haven't built all the extensions yet,
        // so use the plan from the prior RCL
        effectiveRcl = rcl - 1;
    } else {
        // room is fully built for this RCL, use the standard plan
        effectiveRcl = rcl;
    }

   // start with the generic spawn plan
    var spawnPlan = Room.SpawnPlan["generic"][effectiveRcl];

   // if we have any construction sites, include a builder
    if (this.find(FIND_MY_CONSTRUCTION_SITES).length > 0) {
        // concat() joins two arrays together
        spawnPlan = spawnPlan.concat(Room.SpawnPlan["builder"][effectiveRcl]);
    }

    // return the array with our master plan for this room
    return spawnPlan;
};

// controls the tower behavior
Room.prototype.defense = function() {
    // find any enemy creeps in this room
    var hostiles = this.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length > 0) {
        var username = hostiles[0].owner.username;
        console.log('User ' + username + ' spotted in room ' + this.name);
        // for all towers in this room
        var towers = this.find(FIND_MY_STRUCTURES, {
            filter: {structureType: STRUCTURE_TOWER}
        });
        for (var tower of towers) {
            // attack the first enemy creep we found
            tower.attack(hostiles[0]);
        }
    }
};

module.exports = {
    "generic": {
        0: null,
        1: [
            {
                role: "harvester",
                midname: "1",
                size: "xsmall",
                args: null,
            },
            {
                role: "harvester",
                midname: "2",
                size: "xsmall",
                args: null,
            },
            {
                role: "harvester",
                midname: "3",
                size: "xsmall",
                args: null,
            },
            {
                role: "harvester",
                midname: "4",
                size: "xsmall",
                args: null,
            },
            {
                role: "harvester",
                midname: "5",
                size: "xsmall",
                args: null,
            },
        ],
        2: [
            {
                role: "harvester",
                midname: "1",
                size: "small",
                args: null,
            },
            {
                role: "harvester",
                midname: "2",
                size: "small",
                args: null,
            },
            {
                role: "harvester",
                midname: "3",
                size: "small",
                args: null,
            },
            {
                role: "harvester",
                midname: "4",
                size: "small",
                args: null,
            },
            {
                role: "harvester",
                midname: "5",
                size: "small",
                args: null,
            },
            {
                role: "harvester",
                midname: "6",
                size: "small",
                args: null,
            },
        ],
        3: [
            {
                role: "harvester",
                midname: "1",
                size: "medium",
                args: null,
            },
            {
                role: "harvester",
                midname: "2",
                size: "medium",
                args: null,
            },
            {
                role: "harvester",
                midname: "3",
                size: "medium",
                args: null,
            },
            {
                role: "harvester",
                midname: "4",
                size: "medium",
                args: null,
            },
            {
                role: "harvester",
                midname: "5",
                size: "medium",
                args: null,
            },
            {
                role: "harvester",
                midname: "6",
                size: "medium",
                args: null,
            },
        ],
        4: [
            {
                role: "charger",
                midname: "1",
                size: "medium",
                args: null,
            },
            {
                role: "miner",
                midname: "1",
                size: null,
                args: {
                    "sim": {x: 34, y: 20}
                },
            },
            {
                role: "miner",
                midname: "2",
                size: null,
                args: {
                    "sim": {x: 42, y: 43}
                },
            },
            {
                role: "mule",
                midname: "1",
                size: "medium",
                args: null,
            },
            {
                role: "worshiper",
                midname: "1",
                size: "medium",
                args: null,
            },
            {
                role: "mule",
                midname: "2",
                size: "medium",
                args: null,
            },
            {
                role: "worshiper",
                midname: "2",
                size: "medium",
                args: null,
            },
        ],
        5: [
            {
                role: "charger",
                midname: "1",
                size: "large",
                args: null,
            },
            {
                role: "miner",
                midname: "1",
                size: null,
                args: {
                    "sim": {x: 34, y: 20}
                },
            },
            {
                role: "miner",
                midname: "2",
                size: null,
                args: {
                    "sim": {x: 42, y: 43}
                },
            },
            {
                role: "mule",
                midname: "1",
                size: "large",
                args: null,
            },
            {
                role: "worshiper",
                midname: "1",
                size: "large",
                args: null,
            },
            {
                role: "mule",
                midname: "2",
                size: "large",
                args: null,
            },
            {
                role: "worshiper",
                midname: "2",
                size: "large",
                args: null,
            },
        ],
        6: [
            {
                role: "charger",
                midname: "1",
                size: "xlarge",
                args: null,
            },
            {
                role: "miner",
                midname: "1",
                size: null,
                args: {
                    "sim": {x: 34, y: 20}
                },
            },
            {
                role: "miner",
                midname: "2",
                size: null,
                args: {
                    "sim": {x: 42, y: 43}
                },
            },
            {
                role: "mule",
                midname: "1",
                size: "xlarge",
                args: null,
            },
            {
                role: "worshiper",
                midname: "1",
                size: "xlarge",
                args: null,
            },
            {
                role: "mule",
                midname: "2",
                size: "xlarge",
                args: null,
            },
            {
                role: "worshiper",
                midname: "2",
                size: "xlarge",
                args: null,
            },
        ],
        7: [
            {
                role: "charger",
                midname: "1",
                size: "xlarge",
                args: null,
            },
            {
                role: "miner",
                midname: "1",
                size: null,
                args: {
                    "sim": {x: 34, y: 20}
                },
            },
            {
                role: "miner",
                midname: "2",
                size: null,
                args: {
                    "sim": {x: 42, y: 43}
                },
            },
            {
                role: "mule",
                midname: "1",
                size: "giant",
                args: null,
            },
            {
                role: "worshiper",
                midname: "1",
                size: "giant",
                args: null,
            },
            {
                role: "mule",
                midname: "2",
                size: "giant",
                args: null,
            },
            {
                role: "worshiper",
                midname: "2",
                size: "giant",
                args: null,
            },
        ],
        8: [
            {
                role: "charger",
                midname: "1",
                size: "xlarge",
                args: null,
            },
            {
                role: "miner",
                midname: "1",
                size: null,
                args: {
                    "sim": {x: 34, y: 20}
                },
            },
            {
                role: "miner",
                midname: "2",
                size: null,
                args: {
                    "sim": {x: 42, y: 43}
                },
            },
            {
                role: "mule",
                midname: "1",
                size: "max",
                args: null,
            },
            {
                role: "worshiper",
                midname: "1",
                size: "xlarge",
                args: null,
            },
        ],
    },
    "builder": {
        0: null,
        1: [
            {
                role: "builder",
                midname: "1",
                size: "xsmall",
                args: null,
            },
        ],
        2: [
            {
                role: "builder",
                midname: "1",
                size: "small",
                args: null,
            },
        ],
        3: [
            {
                role: "builder",
                midname: "1",
                size: "medium",
                args: null,
            },
        ],
        4: [
            {
                role: "builder",
                midname: "1",
                size: "large",
                args: null,
            },
        ],
        5: [
            {
                role: "builder",
                midname: "1",
                size: "xlarge",
                args: null,
            },
        ],
        6: [
            {
                role: "builder",
                midname: "1",
                size: "xlarge",
                args: null,
            },
        ],
        7: [
            {
                role: "builder",
                midname: "1",
                size: "xlarge",
                args: null,
            },
        ],
        8: [
            {
                role: "builder",
                midname: "1",
                size: "max",
                args: null,
            },
        ],
    }
};

module.exports = {

   create: function(spawn, creepName, size, args) {

   var bodies = {
            'xsmall': {
                energy: 250,
                def: [WORK,CARRY,MOVE,MOVE]
            },
            'small':  {
                energy: 550,
                def: [WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE]
            },
            'medium': {
                energy: 800,
                def: [WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]
            },
            'large': {
                energy: 1300,
                def: [WORK,WORK,WORK,WORK,WORK,WORK,
                    CARRY,CARRY,CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]
            },
            'xlarge': {
                energy: 1800,
                def: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]
            },
            'max':  {
                energy: 3200,
                def: [WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,
                    WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,
                    WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,
                    WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,
                    WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,
                    WORK,CARRY,MOVE]
            },
        };

   // do we have enough energy to create the requested size of unit?
        if (spawn.room.energyAvailable < bodies[size].energy) {
            return false;
        }

   var attrs = {role: 'builder', mode: 'pickup', target: null};

   var spawnResult = spawn.spawnCreep(bodies[size].def, creepName, {memory: attrs});
        if (spawnResult == OK) {
            console.log(spawn.name + ' new ' + size + ' creep: ' + creepName);
            return true;
      }

   return false;
    },

   run: function(creep) {

   // mode switching (pickup, build, repair)
        if (creep.memory.mode == 'pickup' && creep.carry.energy == creep.carryCapacity) {
            // when creep is full of energy, switch modes
            creep.memory.mode = null;
            creep.memory.target = null;
        } else if (creep.memory.mode != 'pickup' && creep.carry.energy == 0) {
            // when creep is out of energy, switch modes
            creep.memory.mode = 'pickup';
            creep.memory.target = null;
        }

   // load the saved target
        var target = null;
        if (creep.memory.target != null) {
            target = Game.getObjectById(creep.memory.target);
        }

   // ACTION FIRST
        target = this.action(creep, target);

   // TARGET ACQUISITION SECOND
        target = this.target(creep, target);

   // MOVEMENT THIRD
        this.movement(creep, target);

    },

   action: function(creep, target) {

   // because withdraw/repair will not update creep.carry within this tick, we must
   // keep track of the changes ourselves in order to perform the expected logic
        var creepCarryAmount = creep.carry[RESOURCE_ENERGY];
        var numWorkParts = _.filter(creep.body, function(part) {
            return part.type == WORK;
        }).length;

   // get energy actions
        if (creep.memory.mode == 'pickup' && target != null) {

   if (target instanceof Resource) {
   // picking up dropped energy
                var result = creep.pickup(target);
                switch(result) {
                    case ERR_NOT_IN_RANGE:
                        break;
                    case ERR_INVALID_TARGET:
                    case ERR_NOT_ENOUGH_RESOURCES:
                        // pile empty, so find another one
                        target = null;
                        creep.memory.target = null;
                        break;
                    case OK:
                        // picked up some energy. switch mode if we are full
                        creepCarryAmount += target.amount;
                        if (creepCarryAmount >= creep.carryCapacity) {
                            creep.memory.mode = 'build';
                        }
                        target = null;
                        creep.memory.target = null;
                        break;
                    default:
                        creep.say(result);
                        break;
                }

   } else if (target instanceof Source) {
                // mining an energy source
                var result = creep.harvest(target);
                switch(result) {
                    case ERR_NO_BODYPART:
                        // we've been damaged, kill ourself
                        creep.suicide();
                        break;
                    case ERR_NOT_ENOUGH_RESOURCES:
                    case ERR_NOT_IN_RANGE:
                        break;
                    case OK:
                        // picked up some energy. switch mode if we are full
                        creepCarryAmount += (numWorkParts * HARVEST_POWER);
                        if (creepCarryAmount >= creep.carryCapacity) {
                            creep.memory.mode = 'build';
                            target = null;
                            creep.memory.target = null;
                        }
                        break;
                    default:
                        creep.say(result);
                        break;
                }

   } else {

   var result = creep.withdraw(target, RESOURCE_ENERGY);
                switch(result) {
                    case ERR_NOT_IN_RANGE:
                        break;
                    case ERR_INVALID_TARGET:
                    case ERR_NOT_ENOUGH_RESOURCES:
                        target = null;
                        creep.memory.target = null;
                        break;
                    case OK:
                        creepCarryAmount = creep.carryCapacity;
                        creep.memory.mode = 'build';
                        target = null;
                        creep.memory.target = null;
                        break;
                    default:
                        creep.say(result);
                        break;
                }

   }

   }

   // build/repair a structure actions
        if (target != null && creepCarryAmount > 0) {

   if (creep.memory.mode == 'build') {

   // try to build the construction site
      var result = creep.build(target);
                switch (result) {
                    case ERR_NOT_IN_RANGE:
                        break;
                    case OK:
                        creepCarryAmount -= numWorkParts;
                        if (creepCarryAmount <= 0) {
                            creep.memory.mode = 'pickup';
                            target = null;
                            creep.memory.target = null;
                        } else {
                            // predict that this build blast finished the building, so
                            // that we can find a new target
                            if (target.progress + (numWorkParts * BUILD_POWER) >=
                                    target.progressTotal) {
                                target = null;
                                creep.memory.target = null;
                                //creep.say('fin');
                            }
                        }
                        break;
                    case ERR_INVALID_TARGET:
                        // we probably finished building something, so find a new target
                        target = null;
                        creep.memory.target = null;
                        break;
                    default:
                        creep.say(result);
                        break;
                }

   } else if (creep.memory.mode == 'repair') {

   // try to repair the target
                var result = creep.repair(target);
                switch (result) {
                    case ERR_NOT_IN_RANGE:
                        break;
                    case OK:
                        creepCarryAmount -= numWorkParts;
                        if (creepCarryAmount <= 0) {
                            creep.memory.mode = 'pickup';
                            target = null;
                            creep.memory.target = null;
                        } else {
                            // predict that this repair blast finished the repair, so that
                            // we can find a new target
                            if (target.hits + (numWorkParts * REPAIR_POWER) >=
                                    target.hitsMax) {
                                target = null;
                                creep.memory.target = null;
                                //creep.say('fin');
                            }
                        }
                        break;
                    case ERR_INVALID_TARGET:
                        // we probably finished repairing something, so find a new target
                        target = null;
                        creep.memory.target = null;
                        break;
                    default:
                        creep.say(result);
                        break;
                }

   }

   }

   return target;
   },

   target: function(creep, target) {
        // find targets

   if (creep.memory.mode == 'pickup' && target == null) {
            // find targets for getting energy

   // prefer to grab energy sitting on the ground, usually from someone dying.
   // only bother to grab piles that will afford us at least two full repair
   // blasts
            var numWorkParts = _.filter(creep.body, function(part) {
                return part.type == WORK;
            }).length;
            var droppedEnergy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                    filter: (resource) => {
                        return (resource.resourceType == RESOURCE_ENERGY &&
                                resource.amount >= (numWorkParts * 2));
                    }
            });
            if (droppedEnergy) {
                // remember the pile we are going to pull from
                target = droppedEnergy;
                creep.memory.target = target.id;
                creep.say('sweeping');
            } else {

   // find nearest containers/storage with energy in them
                var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_CONTAINER ||
                                structure.structureType == STRUCTURE_STORAGE)
                                && structure.store[RESOURCE_ENERGY] > creep.carryCapacity;
                    }
                });
                if (target != null) {
                    // remember the container we are going to pull from
                    creep.memory.target = target.id;
                } else {
                    // if we can't find any containers/storage to pull from, mine our own
                    // energy

   var source = null;
   if (creep.memory.source != null) {
   // gives this creep the ability to mine a specific source, if
   // defined in memory
   source = Game.getObjectById(creep.memory.source);
     }
             if (source == null) {
  // default to mining the first source
                        var sources = creep.room.find(FIND_SOURCES);
                        if (sources) {
                            source = sources[0];
                        }
                    }
                    // remember the source we are mining
                    target = source;
                    creep.memory.target = target.id;
                }
            }

   } else if (target == null) {
            // find build or repair targets

  // find everything needing to be built
            var constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (constructionSites.length > 0) {
                // build on the first site we find. I like to build construction sites in
                // the order I put them down, which this will do, instead of building the
                // closest ones first
                target = constructionSites[0];
                creep.memory.target = target.id;
                creep.memory.mode = 'build';
            } else {
                // no construction sites, see if any roads are below 50% health and need
                // repaired. sort by the weakest road first
                var roads = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType == STRUCTURE_ROAD
                                    && structure.hits < (structure.hitsMax / 2);
                        }
                }).sort(function(a, b) { return a.hits - b.hits; });
                if (roads.length > 0) {
                    target = roads[0];
                    creep.memory.target = target.id;
                    creep.memory.mode = 'repair';
                }

   if (target == null) {
                    // if there's nothing else to do, look for walls to build up. sort by
                    // the weakest wall first
                    var walls = creep.room.find(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_WALL ||
                                        structure.structureType == STRUCTURE_RAMPART)
                                        && structure.hits < structure.hitsMax;
                            }
                    }).sort(function(a, b) { return a.hits - b.hits; });
                    if (walls.length > 0) {
                        target = walls[0];
                        creep.memory.target = target.id;
                        creep.memory.mode = 'repair';
                    }
                }
            }

   }

   return target;
   },

   movement: function(creep, target) {

   if (creep.memory.mode == 'pickup' && target != null) {
            creep.moveTo(target);
        } else if ((creep.memory.mode == 'build' || creep.memory.mode == 'repair') &&
                    target != null &&
                    !creep.pos.inRangeTo(target, 3)) {
            creep.moveTo(target);
        } else if (target == null) {
            creep.memory.target = null;
        }

    },

};

module.exports = {

   create: function(spawn, creepName, size, args) {

   var bodies = {
            'xsmall': {
                energy: 300,
                def: [CARRY,CARRY,CARRY,MOVE,MOVE,MOVE]
            },
            'small':  {
                energy: 500,
                def: [CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]
            },
            // move at half speed now, needs roads
            'medium': {
                energy: 750,
                def: [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE]
            },
            'large':  {
                energy: 1300,
                def: [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                    CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]
            },
            'xlarge': {
                energy: 1800,
                def: [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                    CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                    CARRY,CARRY,CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]
            },
        };

   // do we have enough energy to create the requested size of unit?
        if (spawn.room.energyAvailable < bodies[size].energy) {
            return false;
        }

   var attrs = {role: 'charger', mode: 'pickup', target: null};

   var spawnResult = spawn.spawnCreep(bodies[size].def, creepName, {memory: attrs});
        if (spawnResult == OK) {
            console.log(spawn.name + ' new ' + size + ' creep: ' + creepName);
            return true;
       }

   return false;
    },

   run: function(creep) {

   // mode switching (pickup, dropoff)
        if (creep.memory.mode == 'pickup' && creep.carry.energy == creep.carryCapacity) {
            // when creep is full of energy, switch modes
            creep.memory.mode = 'dropoff';
            creep.memory.target = null;
        } else if (creep.memory.mode == 'dropoff' && creep.carry.energy == 0) {
            // when creep is out of energy, switch modes
            creep.memory.mode = 'pickup';
            creep.memory.target = null;
        }

   // load the saved target
        var target = null;
        if (creep.memory.target != null) {
            target = Game.getObjectById(creep.memory.target);
        }

   // keep track of how much this creep is carrying so we can perform the most
   // possible in one tick
        var creepCarryAmount = creep.carry[RESOURCE_ENERGY];
        var oldTargetId = null;

   // ACTION FIRST
        [target, creepCarryAmount, oldTargetId] =
            this.action(creep, target, creepCarryAmount, oldTargetId);

   // TARGET ACQUISITION SECOND
        target = this.target(creep, target, creepCarryAmount, oldTargetId);

   // MOVEMENT THIRD
        this.movement(creep, target);

   },

   action: function(creep, target, creepCarryAmount, oldTargetId) {

   if (creep.memory.mode == 'dropoff' && target != null) {

   var result = creep.transfer(target, RESOURCE_ENERGY);
            switch(result) {
                case ERR_NOT_IN_RANGE:
                    break;
                case ERR_NOT_ENOUGH_RESOURCES:
                    creep.memory.mode = 'pickup';
                    target = null;
                    creep.memory.target = null;
                    break;
                case ERR_INVALID_TARGET:
                case ERR_FULL:
                    target = null;
                    creep.memory.target = null;
                    break;
                case OK:
                    // prevent target lookup from picking the same structure we just
                    // filled up
                    oldTargetId = target.id;

   // switch to pickup if we emptied ourselves
                    if (target.energyCapacity) {
                        creepCarryAmount -= target.energyCapacity;
                        if (creepCarryAmount <= 0) {
                            creep.memory.mode = 'pickup';
                        }
                    }

   target = null;
   creep.memory.target = null;
                    break;
                default:
                    creep.say(result);
                    break;
            }

   }

   // refill on more resources
        if (creep.memory.mode == 'pickup' && target != null) {

   if (target instanceof Resource) {
                // picking up dropped energy
                var result = creep.pickup(target);
                switch(result) {
                    case ERR_NOT_IN_RANGE:
                        break;
                    case ERR_NOT_ENOUGH_RESOURCES:
                        // pile empty, so find another one next tick
                        target = null;
                        creep.memory.target = null;
                        break;
                    case OK:
                        creepCarryAmount += target.amount;
                        if (creepCarryAmount >= creep.carryCapacity) {
                            creep.memory.mode = 'dropoff';
                            creepCarryAmount = creep.carryCapacity;
                        }
                        target = null;
                        creep.memory.target = null;
                        break;
                    default:
                        creep.say(result);
                        break;
                }
            } else {
                // pulling from container or storage
                switch(creep.withdraw(target, RESOURCE_ENERGY)) {
                    case ERR_NOT_IN_RANGE:
                        break;
                    case ERR_NOT_ENOUGH_RESOURCES:
                        // this container is empty, so find another one next tick
                        target = null;
                        creep.memory.target = null;
                        break;
                    case OK:
                        creepCarryAmount += target.store[RESOURCE_ENERGY];
                        if (creepCarryAmount >= creep.carryCapacity) {
                            creep.memory.mode = 'dropoff';
                            creepCarryAmount = creep.carryCapacity;
                        }
                        target = null;
                        creep.memory.target = null;
                        break;
                    default:
                        creep.say(result);
                        break;
                }
            }

   }

   // return multiple variables so that target() can use them
        return [target, creepCarryAmount, oldTargetId];
    },

   target: function(creep, target, creepCarryAmount, oldTargetId) {

   if (creep.memory.mode == 'pickup' && target == null) {

   // if the storage is well off, pull from there
            if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 1000) {
                // if we're about to die, suicide instead of pulling from storage
                if (creep.ticksToLive < 20) {
                    creep.suicide();
                } else {
                    target = creep.room.storage;
                    creep.memory.target = target.id;
                }
            } else {

   // find all containers with energy in them
                // find the fullest container, b - a for desc order
                var containers = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_CONTAINER &&
                            structure.store[RESOURCE_ENERGY] > 0);
                    }
                }).sort(function(a, b) {
                    return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];
                });

   if (containers.length > 0) {
                    // remember the container we are going to pull from
                    target = containers[0];
                    creep.memory.target = target.id;
                } else {
                    // find the fullest pile
                    var droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                                filter: (resource) => {
                                    return (resource.resourceType == RESOURCE_ENERGY);
                                }
                        }).sort(function(a, b) { return b.amount - a.amount; });
                    if (droppedEnergy.length > 0) {
                        // remember the pile we are going to pull from
                        target = droppedEnergy[0];
                        creep.memory.target = target.id;
                    }
                }
            }

   } else if (creep.memory.mode == 'dropoff' && target == null) {

   // give towers priority
            target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_TOWER) &&
                                    structure.energy < structure.energyCapacity - 200 &&
                                    structure.id != oldTargetId;
                        }
            });

   // if no tower is asking for help, find the nearest structure that doesn't
            // have full energy
            if (target == null) {
                target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_EXTENSION ||
                                        structure.structureType == STRUCTURE_SPAWN) &&
                                        structure.energy < structure.energyCapacity &&
                                        structure.id != oldTargetId;
                            }
                });
            }

   // remember the structure we are filling up
            if (target != null) {
                creep.memory.target = target.id;
            } else if (creep.carry.energy < creep.carryCapacity) {

   // nowhere needs energy right now, so use the break to refill ourselves
                creep.memory.mode = 'pickup';
                // whenever we change mode, the target should be reset.
                // will do a real lookup next tick, but take a first step toward storage
                target = creep.room.storage;
                creep.memory.target = null;

   } else {

   // if we're about to die, drop our load back into storage
                if (creep.ticksToLive <= 20 && creep.room.storage) {
                    target = creep.room.storage;
                    creep.memory.target = target.id;
                } else {
                    // we have nothing to do
                    // go rest near the spawn
                    var spawns = creep.room.find(FIND_MY_STRUCTURES, {
                        filter: { structureType: STRUCTURE_SPAWN }
                    });

   if (spawns.length > 0) {
                        target = spawns[0];
                    }
                }

   }

   }

   return target;
    },

   movement: function(creep, target) {

   if (target != null) {
            creep.moveTo(target);
        }

    },

};

module.exports = {

   create: function(spawn, creepName, size, args) {

   var bodies = {
            'xsmall': {
                energy: 250,
                def: [WORK,CARRY,MOVE,MOVE]
            },
            'small':  {
                energy: 550,
                def: [WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE]
            },
            'medium': {
                energy: 800,
                def: [WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]
            },
            'large':  {
                energy: 1300,
                def: [WORK,WORK,WORK,WORK,WORK,WORK,
                    CARRY,CARRY,CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]
            },
            'xlarge': {
                energy: 1800,
                def: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]
            },
            'max':  {
                energy: 3200,
                def: [WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,
                    WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,
                    WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,
                    WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,
                    WORK,CARRY,MOVE,WORK,CARRY,MOVE,WORK,CARRY,MOVE,
                    WORK,CARRY,MOVE]
            },
        };

   // starting with the given size, step backwards until we find one we can afford
        // right now
        var sizes = ['xsmall', 'small', 'medium', 'large', 'xlarge', 'max'];
        for (i = sizes.indexOf(size); i >= 0; i--) {
            if (spawn.room.energyCapacity < bodies[size].energy) {
                if (i == 0) {
                    // we can't create even the smallest unit
                    return false;
                }
                size = sizes[i-1];
            }
        }

   var attrs = {role: 'harvester', mode: 'pickup', target: null};

   var spawnResult = spawn.spawnCreep(bodies[size].def, creepName, {memory: attrs});
        if (spawnResult == OK) {
            console.log(spawn.name + ' new ' + size + ' creep: ' + creepName);
            return true;
        }

   return false;
    },

   run: function(creep) {

   // mode switching (pickup, dropoff)
        if (creep.memory.mode == 'pickup' && creep.carry.energy == creep.carryCapacity) {
            // when creep is full of energy, switch modes
            creep.memory.mode = 'dropoff';
            creep.memory.target = null;
        } else if (creep.memory.mode == 'dropoff' && creep.carry.energy == 0) {
            // when creep is out of energy, switch modes
            creep.memory.mode = 'pickup';
            creep.memory.target = null;
        }

   if(creep.memory.mode == 'pickup') {
            // fill up with energy

   // prefer to pull from storage
            if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 0) {

   // move to the target
                creep.moveTo(creep.room.storage);

   // try to pull energy from from storage
                var result = creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
                switch(result) {
                    case ERR_NOT_IN_RANGE:
                    case OK:
                        break;
                    default:
                        creep.say(result);
                        break;
                }

   } else {
   // if creep can't pull from storage, mine energy from a source

   var source = null;
                if (creep.memory.source != null) {
                    // gives this creep the ability to mine a specific source, if defined
                    // in memory
                    source = Game.getObjectById(creep.memory.source);
                }
                if (source == null) {
                    // default to mining the first source
                    var sources = creep.room.find(FIND_SOURCES);
                    if (sources) {
                        source = sources[0];
                    }
                }

   if (source) {

   // move to the target
   creep.moveTo(source);

   // mine energy
                    var result = creep.harvest(source);
                    switch(result) {
                        case ERR_NO_BODYPART:
                            // we've been damaged, kill ourself
                            creep.suicide();
                            break;
                        case ERR_NOT_ENOUGH_RESOURCES:
                        case ERR_NOT_IN_RANGE:
                        case OK:
                            break;
                        default:
                            creep.say(result);
                            break;
                    }

   }

   }

   } else {
            // deliver the energy

   // load up our saved target
            var target = null;
            if (creep.memory.target != null) {
                target = Game.getObjectById(creep.memory.target);
            }

   if (target == null) {
                // if we don't have a target, find one
                target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER) &&
                                structure.energy < structure.energyCapacity;
                    }
                });

   // remember the structure we are filling up
                if (target != null) {
                    creep.memory.target = target.id;
                }
            }

   // transfer energy to target or move to it
            if (target != null) {

   // move to the target
                creep.moveTo(target);

   // attempt to pass over the energy
                var result = creep.transfer(target, RESOURCE_ENERGY);
                switch(result) {
                    case ERR_NOT_IN_RANGE:
                        break;
                    case ERR_NOT_ENOUGH_RESOURCES:
                        // if we have no energy to transfer, switch modes
                        creep.memory.mode = 'pickup';
                        creep.memory.target = null;
                        break;
                    case ERR_INVALID_TARGET:
                    case ERR_FULL:
                        // if the target was filled up or destroyed, find a new target
                        // next tick
                        creep.memory.target = null;
                        break;
                    case OK:
                        // after energy was transferred, we want to find a new target next
                        // tick
                        creep.memory.target = null;
                        break;
                    default:
                        creep.say(result);
                        break;
                }

   } else {
   // when their are no structures that need filling, upgrade the controller

   // transfer to controller or move to it
                var controller = creep.room.controller;

   // move to the target
                if (!creep.pos.inRangeTo(controller, 3)) {
                    creep.moveTo(controller);
                }

   var result = creep.upgradeController(controller);
                switch(result) {
                    case ERR_NOT_IN_RANGE:
                        break;
                    case ERR_NOT_ENOUGH_RESOURCES:
                        creep.memory.mode = 'pickup';
                        break;
                    case OK:
                        break;
                    default:
                        creep.say(result);
                        break;
                }

   return;

   }
   }

   }

};

module.exports = {

   create: function(spawn, creepName, size, args) {

   var body = {energy: 700, def: [WORK,WORK,WORK,WORK,WORK,WORK,MOVE,MOVE]};

   // do we have enough energy to create this unit?
        if (spawn.room.energyAvailable < body.energy) {
            return false;
        }

   // confirm that the miner args are properly set.
   // we expect it to be a dictionary where the keys are the room names where the
   // miner will live, and the values are objects with an x and y property.
        var roomName = spawn.room.name;
        if (!args[roomName]) {
            console.log('Error: mining seat not set for room ' + roomName);
            return false;
        }

   // determine where this miner should sit and which source it should harvest
        var seatPos = new RoomPosition(args[roomName].x, args[roomName].y, roomName);
        var source = seatPos.findClosestByRange(FIND_SOURCES);

   var attrs = {role: 'miner', seatPos: seatPos, target: source.id};

   var spawnResult = spawn.spawnCreep(body.def, creepName, { memory: attrs });
        if (spawnResult == OK) {
            console.log(spawn.name + ' new ' + size + ' creep: ' + creepName);
            return true;
        }
        console.log(spawnResult);

   return false;
    },

   run: function(creep) {

   // load the saved target, which should be a source
        var target = null;
        if (creep.memory.target != null) {
            target = Game.getObjectById(creep.memory.target);
        }

   // ACTION FIRST
        target = this.action(creep, target);

   // TARGET ACQUISITION SECOND
        target = this.target(creep, target);

   // MOVEMENT THIRD
        this.movement(creep, target);

   },

   action: function(creep, target) {

   creep.harvest(target);

   return target;
    },

   target: function(creep, target) {
        return target;
    },

   movement: function(creep, target) {

   var seatPos = new RoomPosition(
            creep.memory.seatPos.x,
            creep.memory.seatPos.y,
            creep.memory.seatPos.roomName
        );
        if (creep.pos != seatPos) {
            creep.moveTo(seatPos);
        }

  },

};

module.exports = {

   create: function(spawn, creepName, size, args) {

   var bodies = {
            'xsmall': {
                energy: 300,
                def: [CARRY,MOVE,CARRY,MOVE,CARRY,MOVE]
            },
            'small': {
                energy: 500,
                def: [CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE]
            },
            'medium': {
                energy: 800,
                def: [CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,
                    CARRY,MOVE,CARRY,MOVE,CARRY,MOVE]
            },
            'large': {
                energy: 1300,
                def: [CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,
                    CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,
                    CARRY,MOVE,CARRY,MOVE,CARRY,MOVE]
            },
            // 800 carry capacity matches up with link capacity
            'xlarge': {
                energy: 1600,
                def: [CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,
                    CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,
                    CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,
                    CARRY,MOVE]
            },
            'giant': {
                energy: 2000,
                def: [CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,
                    CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,
                    CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,
                    CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE]
            },
            'max':  {
                energy: 2500,
                def: [CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,
                    CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,
                    CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,
                    CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,
                    CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE]
            },
        };

   // do we have enough energy to create the requested size of unit?
        if (spawn.room.energyAvailable < bodies[size].energy) {
            return false;
        }

   var attrs = {role: 'mule', mode: 'pickup', target: null};

   var spawnResult = spawn.spawnCreep(bodies[size].def, creepName, {memory: attrs});
        if (spawnResult == OK) {
            console.log(spawn.name + ' new ' + size + ' creep: ' + creepName);
            return true;
        }

   return false;
    },

   run: function(creep) {

   // mode switching (pickup, dropoff)
        if (creep.memory.mode == 'pickup' && creep.carry.energy == creep.carryCapacity) {
            // when creep is full of energy, switch modes
            creep.memory.mode = 'dropoff';
            creep.memory.target = null;
        } else if (creep.memory.mode == 'dropoff' && creep.carry.energy == 0) {
            // when creep is out of energy, switch modes
            creep.memory.mode = 'pickup';
            creep.memory.target = null;
        }

   // load the saved target
        var target = null;
        if (creep.memory.target != null) {
            target = Game.getObjectById(creep.memory.target);
        }

   // keep track of how much this creep is carrying so we can perform the most
   // possible in one tick
        var creepCarryAmount = creep.carry[RESOURCE_ENERGY];

   // ACTION FIRST
        [target, creepCarryAmount] = this.action(creep, target, creepCarryAmount);

   // TARGET ACQUISITION SECOND
        target = this.target(creep, target, creepCarryAmount);

   // MOVEMENT THIRD
        this.movement(creep, target);

   },

   action: function(creep, target, creepCarryAmount) {

   // if we have a dropoff target, drop it off
        if (creep.memory.mode == 'dropoff' && target != null) {

   var result = creep.transfer(target, RESOURCE_ENERGY);
            switch(result) {
                case ERR_FULL:
                    // it's probably a link that is full, we'll just try again next tick
                    break;
                case ERR_NOT_IN_RANGE:
                    break;
                case OK:
                case ERR_NOT_ENOUGH_RESOURCES:

   // we are going to assume the transfer worked, and that we dumped all
   // of it
                    creepCarryAmount = 0;
                    creep.memory.mode = 'pickup';

   // if we happened to pick up some minerals, put those in storage too
                    if (creep.room.storage && target.id == creep.room.storage.id) {
                        for(var resourceType in creep.carry) {
                            creep.transfer(target, resourceType);
                        }
                    }

   if (creepCarryAmount <= 0) {
                        target = null;
                        creep.memory.target = null;
                    }

   break;
   default:
   creep.say(result);
   break;
            }

   }

   // refill on more resources
        if (creep.memory.mode == 'pickup' && target != null) {

   if (target instanceof Resource) {
                // picking up dropped energy
                var result = creep.pickup(target);
                switch(result) {
                    case ERR_NOT_IN_RANGE:
                        break;
                    case ERR_NOT_ENOUGH_RESOURCES:
                        // pile empty, so find another one next tick
                        target = null;
                        creep.memory.target = null;
                        break;
                    case OK:
                        creepCarryAmount += target.amount;
                        if (creepCarryAmount >= creep.carryCapacity) {
                            creep.memory.mode = 'dropoff';
                        }
                        target = null;
                        creep.memory.target = null;
                        break;
                    default:
                        creep.say(result);
                        break;
                }
            } else {
                // pulling from container
                switch(creep.withdraw(target, RESOURCE_ENERGY)) {
                    case ERR_NOT_IN_RANGE:
                        break;
                    case ERR_NOT_ENOUGH_RESOURCES:
                        // this container is empty, so find another one next tick
                        target = null;
                        creep.memory.target = null;
                        break;
                    case OK:
                        creepCarryAmount += target.store[RESOURCE_ENERGY];
                        if (creepCarryAmount >= creep.carryCapacity) {
                            creep.memory.mode = 'dropoff';
                            creepCarryAmount = creep.carryCapacity;
                        }
                        target = null;
                        creep.memory.target = null;
                        break;
                    default:
                        creep.say(result);
                        break;
                }
            }

        }

   // return multiple variables so that target() can use them
        return [target, creepCarryAmount];
    },

   target: function(creep, target, creepCarryAmount) {

   if (creep.memory.mode == 'pickup' && target == null) {

   // prefer to pick up the fullest pile of dropped energy within 10 spaces of us
   // wait until pile is at least 110 to save on cpu, so we don't call pickup()
   // on every tick
            var droppedEnergy = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 10, {
                    filter: (resource) => {
                        return (resource.amount >= creep.carryCapacity ||
                                resource.amount >= 110);
                    }
            }).sort(function(a, b) { return b.amount - a.amount; });

   if (droppedEnergy.length > 0) {
                // remember the pile we are going to pull from
                target = droppedEnergy[0];
                creep.memory.target = target.id;
            } else {
                // look for any dropped energy and pick up the biggest pile
                droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
                        filter: (resource) => {
                            return (resource.amount >= creep.carryCapacity ||
                                    resource.amount >= 110);
                        }
                }).sort(function(a, b) { return b.amount - a.amount; });

  if (droppedEnergy.length > 0) {
                    // remember the pile we are going to pull from
                    target = droppedEnergy[0];
                    creep.memory.target = target.id;
                } else {
                    // look for containers to empty

   // find all containers with energy in them
   // find the fullest container, b - a for desc order
                    var containers = creep.room.find(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_CONTAINER &&
                                        structure.store[RESOURCE_ENERGY] > 0);
                            }
                    }).sort(function(a, b) {
                        return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];
                    });

   if (containers.length > 0) {
                        // remember the container we are going to pull from
                        target = containers[0];
                        creep.memory.target = target.id;
                    }
                }

   }

   if (target == null) {
                // if there is no energy in the room, move towards the first source
                // do not save it as a target, so that we will interrupt this movement
                // when energy becomes available
                var source = creep.pos.findClosestByPath(FIND_SOURCES);
                if (source) {
                    target = source;
                } else {
                    creep.say('im lost');
                }
            }

   } else if (creep.memory.mode == 'dropoff' && target == null) {

   // take energy to storage in the room
            if (creep.room.storage) {
                target = creep.room.storage;
                creep.memory.target = target.id;
            }

   }

   return target;
    },

   movement: function(creep, target) {

   if (creep.memory.mode == 'pickup') {

   if (target) {
                creep.moveTo(target);
            } else {
                creep.memory.target = null;
            }

   } else if (creep.memory.mode == 'dropoff') {

   // we can usually see our dropoff target across rooms
            if (target) {
                creep.moveTo(target);
            } else {
                creep.memory.target = null;
            }

   }

   },

};

module.exports = {

   create: function(spawn, creepName, size, args) {

   var bodies = {
            'xsmall': {
                energy: 250,
                def: [WORK,CARRY,MOVE,MOVE]
            },
            'small': {
                energy: 550,
                def: [WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE]
            },
            'medium': {
                energy: 800,
                def: [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE]
            },
            'large': {
                energy: 1300,
                def: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE]
            },
            'larger': {
                energy: 1750,
                def: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    WORK,WORK,WORK,WORK,
                    CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE]
            },
            // once a room has reached level 8, it can only be upgraded max 15 per tick
            'xlarge': {
                energy: 1850,
                def: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    WORK,WORK,WORK,WORK,WORK,
                    CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE]
            },
            // so this is overkill to super speed up upgrading
            'giant': {
                energy: 2300,
                def: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    CARRY,CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE]
            },
            'max': {
                energy: 4250,
                def: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,
                    WORK,WORK,WORK,WORK,WORK,
                    CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,
                    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]
            },
        };

   // do we have enough energy to create the requested size of unit?
        if (spawn.room.energyAvailable < bodies[size].energy) {
            return false;
        }

   var attrs = {role: 'worshiper', mode: 'pickup', target: null};

   var spawnResult = spawn.spawnCreep(bodies[size].def, creepName, {memory: attrs});
        if (spawnResult == OK) {
            console.log(spawn.name + ' new ' + size + ' creep: ' + creepName);
            return true;
        }

   return false;
    },

   run: function(creep) {

   // mode switching (pickup, dropoff)
        if (creep.memory.mode == 'pickup' && creep.carry.energy == creep.carryCapacity) {
            // when creep is full of energy, switch modes
            creep.memory.mode = 'dropoff';
            creep.memory.target = null;
        } else if (creep.memory.mode == 'dropoff' && creep.carry.energy == 0) {
            // when creep is out of energy, switch modes
            creep.memory.mode = 'pickup';
            creep.memory.target = null;
        }

   // load the saved target
        var target = null;
        if (creep.memory.target != null) {
            target = Game.getObjectById(creep.memory.target);
        }

   // keep track of how much this creep is carrying so we can perform the most
   // possible in one tick
        var creepCarryAmount = creep.carry[RESOURCE_ENERGY];

   // ACTION FIRST
        [target, creepCarryAmount] = this.action(creep, target, creepCarryAmount);

   // TARGET ACQUISITION SECOND
        target = this.target(creep, target, creepCarryAmount);

   // MOVEMENT THIRD
        this.movement(creep, target);

   },

   action: function(creep, target, creepCarryAmount) {

  // because withdraw/upgrade will not update creep.carry within this tick, we must
  // keep track of its changes ourselves in order to perform the expected logic
        var numUpgradePerTick = _.filter(creep.body, function(part) {
            return part.type == WORK;
        }).length;

   // get energy
        if (creep.memory.mode == 'pickup' && target != null) {

   var result = creep.withdraw(target, RESOURCE_ENERGY);
            switch(result) {
                case ERR_NOT_IN_RANGE:
                    break;
                case ERR_NOT_ENOUGH_RESOURCES:
                    target = null;
                    creep.memory.target = null;
                    break;
                case OK:
                    // this might not be accurate, but I think that's ok
                    creepCarryAmount = creep.carryCapacity;
                    creep.memory.mode = 'dropoff';
                    break;
                default:
                    creep.say(result);
                    break;
            }

   }

   // upgrade controller
        if (creep.memory.mode == 'dropoff' && creep.room.controller != undefined) {

   var result = creep.upgradeController(creep.room.controller);
            switch(result) {
                case ERR_NOT_IN_RANGE:
                    break;
                case ERR_NOT_ENOUGH_RESOURCES:
                    creep.memory.mode = 'pickup';
                    target = null;
                    creep.memory.target = null;
                    break;
                case OK:
                    creepCarryAmount -= numUpgradePerTick;
                    break;
                default:
                    creep.say(result);
                    break;
            }

   }

   return [target, creepCarryAmount];
    },

   target: function(creep, target, creepCarryAmount) {

   // if we don't have enough energy to do a full upgrade charge next tick, get more
   // energy
        var numUpgradePerTick = _.filter(creep.body, function(part) {
            return part.type == WORK;
        }).length;
        if (creepCarryAmount <= numUpgradePerTick) {
            creep.memory.mode = 'pickup';
            target = null;
            creep.memory.target = null;
        }

   // find pickup target
        if (creep.memory.mode == 'pickup' && target == null) {

   if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 100) {
                // prefer to pull from storage

   target = creep.room.storage;
   creep.memory.target = target.id;

   } else if (!creep.room.storage ||
                    creep.room.storage.store[RESOURCE_ENERGY] <= 100) {
                // worshipers should only transfer our excesses, and those end up in
                // storage. do not pull from containers if storage is in the room

   // find all containers with energy in them
   // find the fullest container, b - a for desc order
                var containers = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_CONTAINER &&
                                    structure.store[RESOURCE_ENERGY] > 0);
                        }
                }).sort(function(a, b) {
                    return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];
                });
                if (containers.length > 0) {
                    // remember the container we are going to pull from
                    target = containers[0];
                    creep.memory.target = target.id;
                }

   }

   }

   return target;
    },

   movement: function(creep, target) {

   if (creep.memory.mode == 'pickup' && target != null) {
            creep.moveTo(target);
        } else if (creep.memory.mode == 'dropoff' &&
                !creep.pos.inRangeTo(creep.room.controller, 3)) {
            creep.moveTo(creep.room.controller);
        } else {
            creep.memory.target = null;
        }

    },

};
