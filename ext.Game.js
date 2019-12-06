
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
