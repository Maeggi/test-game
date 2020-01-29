var siteWidth = $( window ).width();
var siteHeight = $( window ).height();
var host = window.document.location.host.replace(/:.*/, '');
let ENDPOINT = location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + location.port : '');

class Game extends Phaser.Scene {

    constructor() {
        super("Game");
    }

    init() {
        this.room = null;
        this.roomJoined = false;
        this.cursors = null;
        this.players = {};
        this.player = null;
        this.bullets = {};
        this.map;
        this.controls = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false,

            item4: false,
            item3: false,
            item2: false,
            item1: false,

            leave: false
        };
    }

    preload() {
        this.load.image('background', 'assets//map.png');
        this.load.image('tank', 'assets/tankBody-blue.png');
        this.load.image('head', 'assets/tankHead-blue.png');
    }

    create() {

        this.client = new Colyseus.Client(ENDPOINT);

        this.background = this.add.image(0, 0, 'background').setOrigin(0);
        this.cameras.main.setBounds(0, 0, 2400, 2400);

        this.authenticate();

        this.keys = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            ctrl: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL),

            one: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
            two: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
            three: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
            four: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR)
        };

        this.mouse = this.input.activePointer;

        this.scale.on('resize', this.resize, this);
    }

    update(time, delta) {

        if (this.player) {

            let mngle = Phaser.Math.Angle.Between(this.player.sprite.x-14, this.player.sprite.y-14, this.mouse.x + this.cameras.main.scrollX, this.mouse.y + this.cameras.main.scrollY);
            mngle += 1.6; //Fix

            this.controls.left = !!(this.keys.left.isDown || this.wasd.left.isDown);

            this.controls.right = !!(this.keys.right.isDown || this.wasd.right.isDown);

            this.controls.up = !!(this.keys.up.isDown || this.wasd.up.isDown);

            this.controls.down = !!(this.keys.down.isDown || this.wasd.down.isDown);

            //Sende Move
            if (this.roomJoined) {
                this.room.send(['move', {
                    left: this.controls.left,
                    right: this.controls.right,
                    up: this.controls.up,
                    down: this.controls.down,
                    mangle: mngle
                }]);
            }
        }

    }

    addPlayer(data) {
        let sprite = this.physics.add.sprite(data.x, data.y, "tank").setOrigin(0.5,0.5).setDisplaySize(40,40);
        sprite.rotation = 0.2
        sprite.velocity = 0

        let head = this.physics.add.sprite(data.x, data.y, "head").setOrigin(0.5,34/41);
        head.depth = 10;

        this.player = {};
        this.player.head = head;
        this.player.sprite = sprite;
        this.cameras.main.startFollow(this.player.sprite);
        this.player.head = head;
    }

    addOhter(data, sid) {
        let id = sid;
        let sprite = this.physics.add.sprite(data.x, data.y, "tank").setOrigin(0.5,0.5).setDisplaySize(40,40);
        sprite.rotation = 0.2
        sprite.velocity = 0

        let head = this.physics.add.sprite(data.x, data.y, "head").setOrigin(0.5,34/41);
        head.depth = 10;

        this.players[id] = {};
        this.players[id].head = head;
        this.players[id].sprite = sprite;
        this.players[id].head = head;
    }

    resize (gameSize, baseSize, displaySize, resolution)
    {
        var width = gameSize.width;
        var height = gameSize.height;

        this.cameras.resize(width, height);

        this.background.setSize(width, height);
    }

    async authenticate() {
        var self = this;

        this.roomJoined = true;


        this.room = await this.client.joinOrCreate("tank");

        this.room.onStateChange.once((state) => {
            console.log("this is the first room state!", state);
        });

        this.room.onStateChange((state) => {

        });

        this.room.state.players.onAdd = (player, sessionId) => {

            console.log('add new player')
            if (sessionId === this.room.sessionId) {
                //Add Me
                this.addPlayer(player)
            }else{
                //Add Other
                this.addOhter(player, sessionId)
            }

            //Update
            player.onChange = function (changes) {
                if (sessionId === self.room.sessionId) {
                    //Update Me
                    changes.forEach(change => {
                        if (change.field == "rotation") {
                            self.player.head.rotation = change.value;
                        } else if (change.field == "x") {
                            self.player.sprite.x = change.value;
                            self.player.head.x = change.value;
                        } else if (change.field == "y") {
                            self.player.sprite.y = change.value;
                            self.player.head.y = change.value;
                        } else if (change.field == "angle") {
                            self.player.sprite.rotation = change.value;
                        }
                    });
                }else{
                    //Update Other
                    changes.forEach(change => {
                        if (change.field == "rotation") {
                            self.players[sessionId].head.rotation = change.value;
                        } else if (change.field == "x") {
                            self.players[sessionId].sprite.x = change.value;
                            self.players[sessionId].head.x = change.value;
                        } else if (change.field == "y") {
                            self.players[sessionId].sprite.y = change.value;
                            self.players[sessionId].head.y = change.value;
                        } else if (change.field == "angle") {
                            self.players[sessionId].sprite.rotation = change.value;
                        }
                    });
                }
            }

        }
    }

}

var config = {
    type: Phaser.CANVAS,
    width: siteWidth,
    height: siteHeight,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game',
        width: '100%',
        height: '100%'
    },
    render: {
        clearBeforeRender: false,
        desynchronized: true,
        preserveDrawingBuffer: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: Game
};

var game = new Phaser.Game(config);