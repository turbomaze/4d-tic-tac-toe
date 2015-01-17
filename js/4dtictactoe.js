/******************\
|  4D Tic Tac Toe  |
| @author Anthony  |
| @version 0.1     |
| @date 2015/01/16 |
| @edit 2015/01/16 |
\******************/

var TicTacToe4D = (function() {
    /**********
     * config */
    var dims = [800, 450]; //[width, height]
    var cellSize = 1; //how wide each cell is
    var plankThickness = 0.1; //how thick the barrier planks are
    var D = 3; //number of dimensions
    var S = 3; //side length
    var canvSel = '#canvas';

    /*************
     * constants */

    /*********************
     * working variables */
    var scene;
    var camera;
    var controls;
    var renderer;

    /******************
     * work functions */
    function init4DTicTacToe() {
        //set up the three.js scene
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, dims[0]/dims[1], 0.1, 1000);
        
        controls = new THREE.OrbitControls(camera, $s(canvSel));
        
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(dims[0], dims[1]);
        $s(canvSel).appendChild(renderer.domElement);
        
        camera.position.x = -3.2, camera.position.y = 1.1, camera.position.z = 2.3;
        camera.rotation.x = -0.5, camera.rotation.y = -0.9, camera.rotation.z = -0.4;

        addLight(0xCCCCCC, [-100, 200, 100]);
        addLight(0x888888, [100, 200, 100]);
        addLight(0x666666, [0, -200, 100]);
        
        //add the tic tac toe board
        addBoardGeometry();

        var material =  new THREE.MeshLambertMaterial({
            color:0x00FF00, shading: THREE.FlatShading
        });
        var geometry = new THREE.SphereGeometry(0.2, 16, 16);
        var ball = new THREE.Mesh(geometry, material);
        ball.position.x = 0;
        ball.position.y = 0;
        ball.position.z = 0;
        scene.add(ball);

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
    function addBoardGeometry() {
        function getPlank(clr, sizes) {
            var material =  new THREE.MeshLambertMaterial({
                color: clr, shading: THREE.FlatShading
            });
            var geometry = new THREE.BoxGeometry(sizes.x, sizes.y, sizes.z);
            var plank = new THREE.Mesh(geometry, material);
            return plank;
        }

        var dims = ['x', 'y', 'z'];
        var others = [['y', 'z'], ['x', 'z'], ['x', 'y']];
        for (var di = 0; di < D; di++) {
            for (var ai = 0; ai < S-1; ai++) {
                for (var bi = 0; bi < S-1; bi++) {
                    var sizes = {};
                    sizes[dims[di]] = S*cellSize,
                    sizes[others[di][0]] = plankThickness,
                    sizes[others[di][1]] = plankThickness
                    var plank = getPlank(0x00FF00, sizes);
                    plank.position[dims[di]] = 0;
                    plank.position[others[di][0]] = cellSize*ai-cellSize/2;
                    plank.position[others[di][1]] = cellSize*bi-cellSize/2;
                    scene.add(plank);
                }
            }
        }
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
        init: init4DTicTacToe
    };
})();

window.addEventListener('load', TicTacToe4D.init);