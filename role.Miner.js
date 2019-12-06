/*
 * ROLE: MINER
 *
 * A miner harvests energy from a source and drops it where it sits. 
 * It remains in a fixed position, except to move into position after spawning.
 * The goal of a miner is to extract all energy available from a source in the most 
 * efficient way possible.
 *
 * To capture all energy from a source, you need to average 10 units per tick. WORK 
 * harvests at 2 units per tick, so I need about 5 work body parts on a source. 
 * Because of time lost by moving into place, I should round up to 6.
 * The body composition of a miner is fixed so a single individual can extract all energy 
 * from a source before it resets.
 *
 * A miner's seat value specifies the exact position it should sit at.
 *
 */

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
