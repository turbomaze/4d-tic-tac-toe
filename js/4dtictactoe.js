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

    /*************
     * constants */

    /*********************
     * working variables */

    /******************
     * work functions */
    function init4DTicTacToe() {

    }

    /***********
     * objects */

    /********************
     * helper functions */
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
});

window.addEventListener('load', TicTacToe4D.init);