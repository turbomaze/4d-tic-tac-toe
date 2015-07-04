/******************\
|  4D Tic Tac Toe  |
| @author Anthony  |
| @version 1.0     |
| @date 2015/01/16 |
| @edit 2015/07/03 |
\******************/

var TicTacToe4D = (function() {
    /**********
     * config */
    var dims = [800, 450]; //[width, height]
    var cellSize = 1; //how wide each cell is
    var plankThickness = 0.04; //how thick the barrier planks are
    var pieceColors = [0xFF0000, 0x0000FF];
    var D = 4; //number of dimensions
    var S = 3; //side length
    var spaceBetweenBoards = S+0.1;
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
                    gameState[xi][yi].push([]);
                    for (var wi = 0; wi < S; wi++) {
                        gameState[xi][yi][zi].push(-1);
                    }
                }
            }
        }

        //misc setup
        $s('#x').max = S-1;
        $s('#y').max = S-1;
        $s('#z').max = S-1;
        $s('#w').max = S-1;

        //set up the three.js scene
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, dims[0]/dims[1], 0.1, 1000);

        controls = new THREE.OrbitControls(camera, $s(canvSel));

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(dims[0], dims[1]);
        renderer.setClearColor(0xF0FAFC);
        $s(canvSel).appendChild(renderer.domElement);

        camera.position.x = -2.31;
        camera.position.y = 1.64;
        camera.position.z = 5.41;
        camera.lookAt(new THREE.Vector3(2.54, 0.64, 2.57));
        controls.target = new THREE.Vector3(2.54, 0.64, 2.57);

        addLight(0x888888, [-100, 100, -100]);
        addLight(0x888888, [-100, 100, 100]);
        addLight(0x888888, [100, 100, -100]);
        addLight(0x888888, [100, 100, 100]);
        addLight(0x888888, [0, -100, 0]);

        //draw all the boards
        for (var si = 0; si < S; si++) {
            //add a tic tac toe board
            addBoardGeometry(si*spaceBetweenBoards);

            //add the axes
            drawAxes(si*spaceBetweenBoards);
        }

        //draw the w axis
        var wAxis = getPlank(0x00FF00, {
            x: Math.sqrt(2)*S*S*cellSize,
            y: plankThickness, z: plankThickness
        });
        var diagOffset = (Math.sqrt(2)*S*S*cellSize-1)/4 + plankThickness;
        wAxis.position.x = diagOffset + 0.5*plankThickness;
        wAxis.position.y = -cellSize/2 - 0.5*S*cellSize;
        wAxis.position.z = diagOffset + 0.5*plankThickness;
        wAxis.rotation.y = -Math.PI/4;
        scene.add(wAxis);

        //event listeners
        $s('#make-move').addEventListener('click', function() {
            makeMove([
                parseInt($s('#x').value),
                parseInt($s('#y').value),
                parseInt($s('#z').value),
                parseInt($s('#w').value)
            ]); //axes are in this order for weird reasons...

            var possWinner = thereIsALine();
            if (possWinner !== -1) {
                setTimeout(function() {
                    alert('Player '+(possWinner+1)+' wins!');
                }, 10);
            }
        });

        //initial rendering
        render();
    }

    function render() {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    /***********
     * objects */

    /********************
     * helper functions */
    function thereIsALine(dimsIn, dimsOut) {
        //initially, you're searching the entire space, so you need to consider
        //every dimension; all of the dimension are in dimsIn and none are in
        //dimsOut
        if (arguments.length === 0) {
            dimsIn = [];
            for (var di = 0; di < D; di++) dimsIn.push(di);
            dimsOut = {};
        }
        if (dimsIn.length > 1) { //then you will have diagonals
            //every corner of a hypercube has coordinates that are either
            //the minimum or maximum possible value; otherwise they would
            //lie along an edge; therefore, they're essentially all possible
            //orderings of D many minimum/maximum coord values, like all the
            //binary vectors multiplied by the maximum coord value S-1
            //Example:
            //getBinVectorsUpTo(n=4, bits=3, 5) =>
            //    [[0,0,0], [0,0,5], [0,5,0], [0,5,5]]
            function getBinVectorsUpTo(n, bits, scale) {
                scale = scale || 1;
                var ret = [];
                for (var ai = 0; ai < n; ai++) {
                    var bin = ai.toString(2);
                    var vect = [];
                    for (var bi = 0; bi < bits-bin.length; bi++) {
                        vect.push(0);
                    }
                    for (var bi = 0; bi < bin.length; bi++) {
                        vect.push(scale*parseInt(bin.charAt(bi)));
                    }
                    ret.push(vect);
                }
                return ret;
            }

            //check the long diagonals of this space
            var corners = getBinVectorsUpTo(
                Math.pow(2, dimsIn.length-1), //# pairs of corners
                dimsIn.length, S-1
            );
            //what velocity must you move with to arrive at the corner opposite
            //to this one? Determining opposite corners is easy: given M = max and
            //m = min = 0 and corner coordinate C=(M,m,m,M,M), the opposite corner
            //is just M-C = (m,M,M,m,m)
            var cornerVels = [];
            for (var ci = 0; ci < corners.length; ci++) {
                var vel = []; //these velocities are D-dimensional
                for (var vi = 0; vi < corners[ci].length; vi++) {
                    vel.push(1 - 2*corners[ci][vi]/(S-1));
                }
                cornerVels.push(vel);
            }
            //the base coordinates to be iterated are the coordinates this
            //function holds constant, aka the coordinates in the dimsOut argument
            var baseCoords = [];
            for (var dim in dimsOut) baseCoords[dim] = dimsOut[dim];
            //now, go through all the corners
            for (var ci = 0; ci < corners.length; ci++) {
                var dc = baseCoords.slice(0); //coordinate of your starting corner
                for (var ii = 0; ii < dimsIn.length; ii++) {
                    dc[dimsIn[ii]] = corners[ci][ii];
                }
                var lineOwner = accessArr(gameState, dc);
                if (lineOwner !== -1) {
                    var everythingMatchedUp = true;
                    //apply the velocity S-1 times to arrive at the opposite
                    //corner, checking all the cells along the way to ensure
                    //they're all occupied by the same player
                    for (var si = 1; si < S; si++) {
                        for (var ii = 0; ii < dimsIn.length; ii++) {
                            dc[dimsIn[ii]] += cornerVels[ci][ii];
                        }
                        if (lineOwner !== accessArr(gameState, dc)) {
                            everythingMatchedUp = false;
                            break;
                        }
                    }
                    //if all of the cells matched up, someone won a long diagonal
                    if (everythingMatchedUp) return lineOwner;
                }
            }

            //remove a dimension and check the smaller dimensional space
            //imagine a 3x3x3; the only ways to win are: by a long diagonal,
            //which we've already checked, or inside of a 2D slice parallel to
            //the XY, YZ, or XY plane; there are S many slices for each dimension
            //a slice is defined as all possible points with one dimension's
            //coordinate held constant, so go through all dimensions and for each
            //dimension hold it constant for 0 ... S-1, recursing
            var foundALine = false;
            //dimsIn is the dimensions that are allowed to vary
            for (var ii = 0; ii < dimsIn.length; ii++) {
                //go through each dimension whose coordinates can vary and
                //choose one to hold constant
                var dmi = []; //dimsIn without ii
                for (var ai = 0; ai < dimsIn.length; ai++) {
                    if (ai !== ii) dmi.push(dimsIn[ai]);
                }
                //the dimension that is no longer in dimsIn must be added to
                //dimsOut because it must be held constant
                var dmo = {}; //dimsOut with ii
                for (var dim in dimsOut) {
                    dmo[dim] = dimsOut[dim];
                }
                //hold it constant for the value 0 to S-1
                for (var si = 0; si < S; si++) {
                    dmo[dimsIn[ii]] = si;
                    //recurse on this smaller dimensional space, knowing that
                    //diagonals will be taken care of automatically
                    foundALine = thereIsALine(dmi, dmo);
                    if (foundALine !== -1) break;
                }
                if (foundALine !== -1) break;
            }
            return foundALine;
        } else { //then you just need to check the line you've been given!
            var dc = [];
            for (var dim in dimsOut) { //all but one of the coordinates is held
                dc[dim] = dimsOut[dim];
            }
            dc[dimsIn[0]] = 0; //dimsIn[0] is the only dimension that can vary
            var lineOwner = accessArr(gameState, dc);
            if (lineOwner === -1) return -1;
            else {
                //this line is parallel to an edge of the hypercube, so just
                //check the rest of the points along it
                for (var si = 1; si < S; si++) {
                    dc[dimsIn[0]] = si;
                    if (lineOwner !== accessArr(gameState, dc)) return -1;
                }
                //if you haven't returned already then there must've been a winner
                return lineOwner;
            }
        }
    }

    function makeMove(coords) {
        //spot not already taken
        if (
            coords[0] >= 0 && coords[0] < S &&
            coords[1] >= 0 && coords[1] < S &&
            coords[2] >= 0 && coords[2] < S &&
            coords[3] >= 0 && coords[3] < S &&
            gameState[coords[0]][coords[1]][coords[2]][coords[3]] === -1
        ) {
            gameState[coords[0]][coords[1]][coords[2]][coords[3]] = playerTurn;
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

        ball.position.x += coords[3]*spaceBetweenBoards;
        ball.position.z += coords[3]*spaceBetweenBoards;

        scene.add(ball);
    }

    function drawAxes(offset) {
        var xAxis = getPlank(0xFFFF00, {
            x: S*cellSize, y: plankThickness, z: plankThickness
        });
        var yAxis = getPlank(0x00FFFF, {
            x: plankThickness, y: S*cellSize, z: plankThickness
        });
        var zAxis = getPlank(0xFF00FF, {
            x: plankThickness, y: plankThickness, z: S*cellSize
        });
        xAxis.position.x = offset + 0.5*plankThickness;
        xAxis.position.y = -0.5*S*cellSize;
        xAxis.position.z = offset + -0.5*S*cellSize;
        yAxis.position.x = offset + -0.5*S*cellSize;
        yAxis.position.y = 0.5*plankThickness;
        yAxis.position.z = offset + -0.5*S*cellSize;
        zAxis.position.x = offset + -0.5*S*cellSize;
        zAxis.position.y = -0.5*S*cellSize;
        zAxis.position.z = offset + 0.5*plankThickness;
        scene.add(xAxis);
        scene.add(yAxis);
        scene.add(zAxis);
    }

    function addBoardGeometry(offset) {
        //adds a D dimensional board s.t. D <= 3

        var dims = ['x', 'y', 'z'];
        var others = [['y', 'z'], ['x', 'z'], ['x', 'y']];
        for (var di = 0; di < Math.min(D, 3); di++) {
            for (var ai = 0; ai < S-1; ai++) {
                for (var bi = 0; bi < S-1; bi++) {
                    var sizes = {};
                    sizes[dims[di]] = S*cellSize;
                    sizes[others[di][0]] = plankThickness;
                    sizes[others[di][1]] = plankThickness;
                    var plank = getPlank(0x777777, sizes);
                    plank.position[dims[di]] = 0;
                    plank.position[others[di][0]] = cellSize*ai-cellSize*CNTR;
                    plank.position[others[di][1]] = cellSize*bi-cellSize*CNTR;
                    plank.position.x += offset;
                    plank.position.z += offset;
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

    function accessArr(arr, loc, idx) {
        idx = idx || 0;
        if (idx === loc.length-1) return arr[loc[idx]];
        else return accessArr(arr[loc[idx]], loc, idx+1);
    }

    function round(n, places) {
        var mult = Math.pow(10, places);
        return Math.round(mult*n)/mult;
    }

    return {
        init: init4DTicTacToe,
        thereIsALine: thereIsALine,
        gameState: gameState
    };
})();

window.addEventListener('load', TicTacToe4D.init);
