/*
 * ROLE: BUILDER
 *
 * A builder constructs any construction sites first, in the order they were placed down.
 * When there are no construction sites, a builder will repair roads below 50% health.
 * When there are no other targets, a builder will repair walls (as that is how they are 
 * built up).
 *
 * Builders should only be spawned when there is a need for them.
 * Builders pull their energy from: 1. dropped energy 2. storage/containers 3. harvest it 
 * themselves from a source
 *
 * WORK == Builds a structure for 5 energy units per tick. Consumes that 5 energy.
 * WORK == Repairs a structure for 100 hits per tick consuming 1 energy unit per tick.
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
                    if (target == null) {
                        // if there are structures that need repair
                    var construc = creep.room.find(FIND_STRUCTUERS, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_CONTAINER ||
                                    structure.structureType == STRUCTURE_STORAGE)
                                    && structure.hits < structure.hitMax;
                        }
                    }).sort(function(a, b) { return a.hits - b.hits; });
                    if (construc.length > 0) {
                        target = construc[0];
                        creep.memory.target = target.id;
                        creep.memory.mode = 'repair';
                    }
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
