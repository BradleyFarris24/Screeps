/*
 * ROLE: MULE
 *
 * Picks up dropped energy and brings it back to storage.
 * They will collect energy from containers if there is no dropped energy.
 *
 */

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
