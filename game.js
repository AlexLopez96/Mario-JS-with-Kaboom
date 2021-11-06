kaboom({
    global: true,
    fullscreen: true,
    scale: 1.5,
    debug: true,
    clearColor: [0,0,0,1],
})

const PLAYER_SPEED = 120
const MUSHROOM_SPEED = 80
const ENEMY_SPEED = -20
const JUMP_FORCE = 395
const BIGGIFY_TIMER = 6
const FALL_DEATH = 400
let isJumping = true

//Sprites
loadRoot('https://i.imgur.com/')
loadSprite('coin', 'wbKxhcd.png')
loadSprite('enemy', 'KPO3fR9.png')
loadSprite('brick', 'pogC9x5.png')
loadSprite('block', 'M6rwarW.png')
loadSprite('mario', 'Wb1qfhK.png')
loadSprite('mushroom', '0wMd92p.png')
loadSprite('surprise', 'gesQ1KP.png')
loadSprite('unboxed', 'bdrLpi6.png')
loadSprite('pipe-top-left', 'ReTPiWY.png')
loadSprite('pipe-top-right', 'hj2GK4n.png')
loadSprite('pipe-bottom-left', 'c1cYSbt.png')
loadSprite('pipe-bottom-right', 'nqQ79eI.png')

loadSprite('blue-block', 'fVscIbn.png')
loadSprite('blue-brick', '3e5YRQd.png')
loadSprite('blue-steel', 'gqVoI2b.png')
loadSprite('blue-evil-shroom', 'SvV4ueD.png')
loadSprite('blue-surprise', 'RMqCc1G.png')

//Scene layers
scene("game", ({level, score}) => {
    layers(['bg', 'obj', 'ui'], 'obj')

    //Map design
    const maps = [
        [
            '=                                                    ',
            '=                                                    ',
            '=                                                    ',
            '=                                                    ',
            '=                                                    ',
            '=                                                    ',
            '=                                                    ',
            '=          ?  =*=?=                                  ',
            '=                                                    ',
            '=                                 -+                 ',
            '=                        ^   ^    ()                 ',
            '====================================   ==============',
        ],
        [
            '£                                       £',
            '£                                       £',
            '£                                       £',
            '£                                       £',
            '£                                       £',
            '£        @@@@@@              x x        £',
            '£                          x x x        £',
            '£                        x x x x  x   -+£',
            '£               z   z  x x x x x  x   ()£',
            '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
        ]
    ]


    const levelConfig = { //Definition of the sprites of the level
        width: 20, //20px
        height: 20, //20px

        //Defining the sprites of the char
        '=': [sprite('block'), solid()], 
        '$': [sprite('coin'), 'coin'],
        '?': [sprite('surprise'), solid(), 'coin-surprise'],
        '*': [sprite('surprise'), solid(), 'mushroom-surprise'],
        '}': [sprite('unboxed'),solid()],
        '(': [sprite('pipe-bottom-left'),solid(), scale(0.5)],
        ')': [sprite('pipe-bottom-right'),solid(), scale(0.5)],
        '-': [sprite('pipe-top-left'),solid(), scale(0.5) , 'pipe'],
        '+': [sprite('pipe-top-right'),solid(), scale(0.5), 'pipe'],
        '^': [sprite('enemy'), solid(), 'dangerous'], 
        '#': [sprite('mushroom'), solid(), 'mushroom', body()], 
        '!': [sprite('blue-block'), solid(), scale(0.5)],
        '£': [sprite('blue-brick'), solid(), scale(0.5)],
        'z': [sprite('blue-evil-shroom'), solid(), scale(0.5), 'dangerous'],
        '@': [sprite('blue-surprise'), solid(), scale(0.5), 'coin-surprise'],
        'x': [sprite('blue-steel'), solid(), scale(0.5)],

    }
    
    const gameLevel = addLevel(maps[level], levelConfig) 

    const scoreLabel = add([
        text(score),
        pos(width()/2,6),
        layer('ui'),
        {
            value: score,
        }

    ])

    add([text('Level: ' + parseInt(level+1)), pos(40,6)]) //Title of the level we are in

    function big(){
        let timer = 0
        let isBig = false

        return{
            update(){
                if (isBig){
                    timer -= dt() //Delta time (Time since the game last updated)
                    if(timer <= 0){
                        this.smallify() //Mario gets small
                    }
                }
            },
            isBig(){
                return isBig
            },
            smallify(){
                this.scale = vec2(1)
                timer = 0
                isBig = false
            },
            biggify(time){
                this.scale = vec2(2)
                timer = time
                isBig = true
            }

        }

    }

    const player = add([
        sprite('mario'),solid(),
        pos(30,0),
        body(), //Adding gravity to the sprite
        big(),
        origin('bot')
    ])

    action('mushroom', (m) =>{
        m.move(MUSHROOM_SPEED,0)
    })
    action('dangerous', (d) => {
        d.move(ENEMY_SPEED,0)
    })

    //If Mario collides with the head with an object 'coin-surprise', a coin spawns, destroys the object and spawns the 'unboxed' sprite
    player.on("headbump", (obj) => {
        if (obj.is('coin-surprise')) {
          gameLevel.spawn('$', obj.gridPos.sub(0, 1))
          destroy(obj)
          gameLevel.spawn('}', obj.gridPos.sub(0,0))
        }
    })

    //If Mario collides with the head with an object 'mushroom-surprise', a mushroom spawns, destroys the object and spawns the 'unboxed' sprite
    player.on("headbump", (obj) => {
        if (obj.is('mushroom-surprise')) {
          gameLevel.spawn('#', obj.gridPos.sub(0, 1))
          destroy(obj)
          gameLevel.spawn('}', obj.gridPos.sub(0,0))
        }
    })

    //If Mario collides with a mushroom it gets bigger for 'BIGIFFY_TIMER' time
    player.collides('mushroom', (m) => {
        destroy(m)
        player.biggify(BIGGIFY_TIMER)
    })

    //If Mario collides with a coin it increases the score label
    player.collides('coin', (c) => {
        destroy(c)
        scoreLabel.value++
        scoreLabel.text = scoreLabel.value
    })

    //If Mario collides with an enemy and he's jumping it kills the enemy, otherwise Mario dies and the game finishes
    player.collides('dangerous', (d) => {
        if(isJumping){
            destroy(d)
        }else{
            go('lose', {score: scoreLabel.value})
        }
    })

    //If Mario collides with the top of a 'pipe' goes to the next level
    player.collides('pipe', () => {
        keyPress('down', () => {
            go('game', {
                level: (level +1) % maps.length, //In order to loop the maps we use '%' on the maps.length
                score: scoreLabel.value
            })
        })
    })

    //Changing the state of te jumping variable if the player is touching the ground
    player.action(() => {
        if(player.grounded()){
            isJumping = false
        }
    })

    //If Mario falls off the level he dies
    player.action(() => {
        camPos(player.pos) //Cam position sets a camera position so we set it always on the player's position
        if(player.pos.y >= FALL_DEATH){
            go('lose', {score: scoreLabel.value})
        }
    })


    //Movement
    keyDown('left', () => {
        player.move(-PLAYER_SPEED, 0) //Move player at MOVE_SPEED speed of the X axis
    })

    keyDown('right', () => {
        player.move(PLAYER_SPEED, 0)
    })

    keyDown('up', () =>{
        if(player.grounded()){ //Only if the player is on the ground can jump
            isJumping = true
            player.jump(JUMP_FORCE)
        }
    })


})

//Lose scene
scene('lose', ({ score }) => {
    add([text(score, 32), origin('center'), pos(width()/2, height()/2)])
})

//Game start
start("game", { level : 0, score: 0 })