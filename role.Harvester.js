/*
 * ROLE: HARVESTER
 *
 * Harvests energy from a source and delivers it to the room's extensions, spawns, and 
 * towers.
 * When all structures are full, it will upgrade the controller.
 * Used mainly in low RCL rooms, and to reboot a room that has faultered.
 *
 */

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

         // load up our saved target
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
        return target;
            }
        }
    },

    target: function(creep, target) {
        // find targets
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
        return target;
 }

    
    },

    movement: function(creep, target) {
// deliver the energy

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

    },
};
