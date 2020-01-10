// Topics covered:
// - loops: for/of loop, break
// - arrays: push()
// - object oriented: prototypes, classes
// - control structure: switch
// - role modes and targets saved to memory
// - action/target/movement pattern

require('proto.Room');
require('proto.Creep');

module.exports.loop = function () {

    // Game is not a class. it's an object that exists only inside the game loop. So
    // instead of adding functions to a prototype, we assign them directly to a new object
    // we've called "extensions" within the Game object.
    Game.extensions = require('ext.Game');

    // have each room we own perform their actions
    for (var room of Game.extensions.myRooms()) {
        // spawn all the creeps we want to exist
        room.doSpawn();
        // activate the tower defenses
        room.defense();
    }

    // have each creep execute their role
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        creep.act();
    }

    // clean up our memory
    Game.extensions.cleanup();

}

