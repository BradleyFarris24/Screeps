/*
 * ROLE: WORSHIPER
 *
 * A worshiper takes energy from storage or a container and uses it to upgrade the room's 
 * controller.
 * A worshiper should ideally be sedentary so it does not have to move between energy 
 * pickup and dropoff, thus upgrading the controller continuously every tick.
 *
 * WORK == Upgrades a controller for 1 energy unit per tick.
 *
 */

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
