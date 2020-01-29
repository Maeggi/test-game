const colyseus = require('colyseus')
const schema = require('@colyseus/schema');
const Schema = schema.Schema;
const MapSchema = schema.MapSchema;
const type = schema.type;

class Player extends Schema {}
type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("number")(Player.prototype, "rotation");
type("number")(Player.prototype, "angle");

class Bullet extends Schema {}
type("number")(Bullet.prototype, "x");
type("number")(Bullet.prototype, "y");
type("number")(Bullet.prototype, "angle");
type("number")(Bullet.prototype, "speed_x");
type("number")(Bullet.prototype, "speed_y");
type("number")(Bullet.prototype, "index");



class State extends Schema {
    constructor() {
        super();

        this.players = new MapSchema();
        this.bullets = new MapSchema();
        this.nextPosition = 0;
        this.bullet_index = 0;
    }

    createPlayer(id) {
        this.players[id] = new Player();
        this.players[id].x = 300;
        this.players[id].y = 300;
        this.players[id].angle = 0.2;
        this.players[id].rotation = 0;
        this.players[id].velocity = 0;
    }

    getPlayer(id) {
        return this.players[id];
    }

    newPlayer(id) {
        return this.players[id];
    }

    removePlayer(id) {
        delete this.players[id];
    }

    newWrap(value, min, max) {
        var range = max - min;

        return (min + ((((value - min) % range) + range) % range));
    }

    movePlayer(id, movement) {
        let player = this.players[id];

        if (movement.left) {
            player.angle -= 0.04;
        }
        if (movement.up) {
            player.velocity += 0.1;
        }
        if (movement.right) {
            player.angle += 0.04;
        }
        if (movement.down) {
            player.velocity -= 0.1;
        }

        const x = Math.cos(player.angle)
        const y = Math.sin(player.angle)

        //Max Speed
        var kmh = 2.5;

        if (player.velocity > 0) {
            player.velocity -= 0.05

            if (player.velocity > kmh) {
                player.velocity = kmh
            }
        } else if (player.velocity < 0) {
            player.velocity += 0.05

            if (player.velocity < -kmh) {
                player.velocity = -kmh
            }
        }

        if (!Math.round(player.velocity * 100)) {
            player.velocity = 0
        }

        if (player.velocity) {
            player.x += x * player.velocity
            player.y += y * player.velocity
        }

        player.angle = this.newWrap(player.angle, -Math.PI, Math.PI);

        player.rotation = movement.mangle;
    }

}
type({
    map: Player
})(State.prototype, "players");
type({
    map: Bullet
})(State.prototype, "bullets");


exports.Tank = class extends colyseus.Room {

    constructor() {
        super()
        console.info('construct')
    }

    onCreate() {
        console.log("StateHandlerRoom created!");
        this.setState(new State());

        this.setSimulationInterval((deltaTime) => this.ServerGameLoop(deltaTime));
    }

    onJoin(client, options) {
        this.state.createPlayer(client.sessionId);
    }

    onMessage(client, message) {

        const [command, data] = message;

        if (command === "move") {
            this.state.movePlayer(client.sessionId, data);
        }
    }
    onLeave(client, consented) {
        this.state.removePlayer(client.sessionId);
    }

    onDispose() {}

    // Update the bullets 60 times per frame and send updates
    ServerGameLoop(deltaTime) {
        //Bullets not Insert
    }
}