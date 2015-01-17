/******************\
|  4D Tic Tac Toe  |
| @author Anthony  |
| @version 0.2     |
| @date 2015/01/16 |
| @edit 2015/01/16 |
\******************/

var TicTacToe4D = (function() {
    /**********
     * config */
    var dims = [800, 450]; //[width, height]
    var cellSize = 1; //how wide each cell is
    var plankThickness = 0.04; //how thick the barrier planks are
    var pieceColors = [0xFF0000, 0x0000FF];
    var D = 3; //number of dimensions
    var S = 3; //side length
    var canvSel = '#canvas';

    /*************
     * constants */
    var CNTR = 0.5*S - 1; //constant that helps center the board

    /*********************
     * working variables */
    var scene, camera, controls, renderer;
    var gameState = [];
    var playerTurn = 0;

    /******************
     * work functions */
    function init4DTicTacToe() {
        //misc working vars
        for (var xi = 0; xi < S; xi++) {
            gameState.push([]);
            for (var yi = 0; yi < S; yi++) {
                gameState[xi].push([]);
                for (var zi = 0; zi < S; zi++) {
                    gameState[xi][yi].push(-1);
                }
            }
        }

        //misc setup
        $s('#x').max = S-1;
        $s('#y').max = S-1;
        $s('#z').max = S-1;

        //set up the three.js scene
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, dims[0]/dims[1], 0.1, 1000);
        
        controls = new THREE.OrbitControls(camera, $s(canvSel));
        
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(dims[0], dims[1]);
        renderer.setClearColor(0xF0FAFC);
        $s(canvSel).appendChild(renderer.domElement);
        
        camera.position.x = -3.2, camera.position.y = 1.1, camera.position.z = 2.3;
        camera.rotation.x = -0.5, camera.rotation.y = -0.9, camera.rotation.z = -0.4;

        addLight(0x888888, [-100, 100, -100]);
        addLight(0x888888, [-100, 100, 100]);
        addLight(0x888888, [100, 100, -100]);
        addLight(0x888888, [100, 100, 100]);
        addLight(0x888888, [0, -100, 0]);
        
        //add the tic tac toe board
        addBoardGeometry();

        //add the axes
        drawAxes();

        //event listeners
        $s('#make-move').addEventListener('click', function() {
            makeMove([
                parseInt($s('#y').value),
                parseInt($s('#z').value),
                parseInt($s('#x').value)
            ]); //axes are in this order for weird reasons...
        });

        //initial rendering
        render();
    }
    obj.init = init4DTicTacToe;

    function render() {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    /***********
     * objects */

    /********************
     * helper functions */
    function makeMove(coords) {
        //spot not already taken
        if (
            coords[0] >= 0 && coords[0] < S &&
            coords[1] >= 0 && coords[1] < S &&
            coords[2] >= 0 && coords[2] < S &&
            gameState[coords[0]][coords[1]][coords[2]] === -1
        ) {
            gameState[coords[0]][coords[1]][coords[2]] = playerTurn;
            placePiece(coords, playerTurn);
            //player = 0 or 1 so this toggles playerTurn
            playerTurn = 1 - playerTurn;
            $s('#move-error').innerHTML = '';
            $s('#curr-player').className = 'color-'+playerTurn;
            $s('#curr-player').innerHTML = 'Player '+(playerTurn+1);
        } else {
            $s('#move-error').innerHTML = 'Invalid move!';
        }
    }

    function placePiece(coords, player) {
        var material =  new THREE.MeshLambertMaterial({
            color: pieceColors[player], shading: THREE.FlatShading,
            transparent: true, opacity: 0.8
        });
        var geometry = new THREE.SphereGeometry(0.2*cellSize, 16, 16);
        var ball = new THREE.Mesh(geometry, material);
        ball.position.x = cellSize*(coords[0]-1)-0.5*(S-3);
        ball.position.y = cellSize*(coords[1]-1)-0.5*(S-3);
        ball.position.z = cellSize*(coords[2]-1)-0.5*(S-3);
        scene.add(ball);
    }

    function drawAxes() {
        var xAxis = getPlank(0xFFFF00, {
            x: S*cellSize, y: plankThickness, z: plankThickness
        });
        var yAxis = getPlank(0x00FFFF, {
            x: plankThickness, y: S*cellSize, z: plankThickness
        });
        var zAxis = getPlank(0xFF00FF, {
            x: plankThickness, y: plankThickness, z: S*cellSize
        });
        xAxis.position.y = -0.5*S*cellSize;
        xAxis.position.z = -0.5*S*cellSize;
        yAxis.position.x = -0.5*S*cellSize;
        yAxis.position.z = -0.5*S*cellSize;
        zAxis.position.x = -0.5*S*cellSize;
        zAxis.position.y = -0.5*S*cellSize;
        scene.add(xAxis);
        scene.add(yAxis);
        scene.add(zAxis);
    }

    function addBoardGeometry() {
        var dims = ['x', 'y', 'z'];
        var others = [['y', 'z'], ['x', 'z'], ['x', 'y']];
        for (var di = 0; di < D; di++) {
            for (var ai = 0; ai < S-1; ai++) {
                for (var bi = 0; bi < S-1; bi++) {
                    var sizes = {};
                    sizes[dims[di]] = S*cellSize,
                    sizes[others[di][0]] = plankThickness,
                    sizes[others[di][1]] = plankThickness
                    var plank = getPlank(0x777777, sizes);
                    plank.position[dims[di]] = 0;
                    plank.position[others[di][0]] = cellSize*ai-cellSize*CNTR;
                    plank.position[others[di][1]] = cellSize*bi-cellSize*CNTR;
                    scene.add(plank);
                }
            }
        }
    }

    function getPlank(clr, sizes) {
        var material =  new THREE.MeshLambertMaterial({
            color: clr, shading: THREE.FlatShading
        });
        var geometry = new THREE.BoxGeometry(sizes.x, sizes.y, sizes.z);
        var plank = new THREE.Mesh(geometry, material);
        return plank;
    }

    function addLight(color, pos) {
        var l1 = new THREE.PointLight(color);
        l1.position.set(pos[0], pos[1], pos[2]);
        scene.add(l1)
    }

    function $s(id) { //for convenience
        if (id.charAt(0) !== '#') return false;
        return document.getElementById(id.substring(1));
    }

    function getRandInt(low, high) { //output is in [low, high)
        return Math.floor(low + Math.random()*(high-low));
    }

    function round(n, places) {
        var mult = Math.pow(10, places);
        return Math.round(mult*n)/mult;
    }

    return {
        init: init4DTicTacToe,
        gameState: gameState
    };
})();

window.addEventListener('load', TicTacToe4D.init);