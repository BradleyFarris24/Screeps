
Room.SpawnPlan = require('const.SpawnPlan'); 

// performs the spawnCreep() calls for a room
Room.prototype.doSpawn = function() {

    // get all the available spawns in this room
    var spawns = this.find(FIND_MY_SPAWNS, {
        filter: (spawn) => {
            return !spawn.spawning;
        }
    });
    console.log(spawns);
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


    // if all creeps die, spawn harvesters

    return false;

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
            if (hostiles.heal) {
                tower.attack(hostiles[0]);
            }
            // if my creeps are injured 
            if (creep.hits < creep.hitsMax) {
            tower.heal(creep, Powercreep);
        }
    }
};
