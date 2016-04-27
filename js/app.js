/*

    more features:
    - squares of frogs combine to form bigger frogs
    - cubes colors form a message and turning from frogs to colors reveals it
    - faces appear on some cubes
    - when a big cube is flipped, it breaks into smaller cubes

*/

var ww = window.innerWidth;
var wh = window.innerHeight;

// websocket
var ws;

// instantiated in init
var renderer, scene, camera, light, intersects, materialsArray;

// instantiate here
var elements = new THREE.Object3D();
var elementsBig = new THREE.Object3D();
var raycaster = new THREE.Raycaster();
var vector = new THREE.Vector2();
var textureLoader = new THREE.TextureLoader();

// frog colors
var colorBlue = '#339ce2';
var colorGreen = '#299f55';
var colorYellow = '#ffde1a';
var colorOrange = '#f58300';
var colorRed = '#de3e1c';

var boxSize = 50;
var gapSize = 5;
var grid = { x: Math.floor(ww/boxSize), y: Math.floor(wh/boxSize) };
//var grid = { x: 5, y: 5 };

var faceLogo = textureLoader.load('./img/logo-black.jpg', init);

function init() {
    initWebSocket();
    initScene();
    createBoxes();
    animate();

    window.addEventListener('mousemove', onMouseMove, false);
    //setInterval(onInterval, 4000);
    window.addEventListener('click', onInterval, false);
}

var animate = function () {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

function initWebSocket() {
    ws = new WebSocket("ws://localhost:8181/");

    ws.onopen = function() {
      ws.send("Message to send");
      console.log("Message is sent...");
    };

    ws.onmessage = function(e) {
      var data = JSON.parse(e.data);
      console.log(data);
    };

    ws.onclose = function() {
      console.log("Connection is closed...");
    };
}

function initScene() {
    /* WEBGL RENDERER */
    renderer = new THREE.WebGLRenderer({canvas : document.getElementById('canvas'), antialias: true });
    renderer.setSize(ww,wh);
    renderer.shadowMap.enabled = true;

    /* SCENE */
    scene = new THREE.Scene();

    /* CAMERA */
    //camera = new THREE.PerspectiveCamera(50, ww/wh, 1, 10000);
    camera = new THREE.OrthographicCamera(ww/-2, ww/2, wh/2, wh/-2, 1, 10000);
    camera.position.set(0, 0, 600);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);


    /* LIGHT */
    light = new THREE.DirectionalLight(0xffefef, 1.8);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);
    light.castShadow = false;

    light = new THREE.DirectionalLight( 0xffefef, 1.8 );
    light.position.set(-1, -1, -1).normalize();
    scene.add(light);
    light.castShadow = false;

    /* MATERIALS */
    materialsArray = [
        new THREE.MeshFaceMaterial(createTextures(colorBlue)),
        new THREE.MeshFaceMaterial(createTextures(colorGreen)),
        new THREE.MeshFaceMaterial(createTextures(colorYellow)),
        //new THREE.MeshFaceMaterial(createTextures(colorOrange)),
        //new THREE.MeshFaceMaterial(createTextures(colorRed))
    ];
}

function createBoxes() {
    var geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    for (var x = 0; x < grid.x; x++) {
        for (var y = 0; y < grid.y; y++) {
            var material = materialsArray[getRandomInt(0, materialsArray.length)];
            var cube = new THREE.Mesh(geometry, material);
            cube.position.x = (boxSize * x) + (gapSize * x) - ww/2;
            cube.position.y = (boxSize * y) + (gapSize * y) - wh/2;
            cube.position.z = -20;
            //cube.castShadow = true;
            //cube.receiveShadow = true;
            cube.tl = new TimelineMax();
            cube.isDisabled = false;
            cube.rotated = false;
            cube.cornerOfSquareOfSize = 0;
            elements.add(cube);
        }
    }

    scene.add(elements);
    scene.add(elementsBig);
    renderer.render(scene, camera);
}

/*

helpers

*/

var getRandomInt = function(min, max) {
    var returnVal = Math.floor((Math.random() * max) + min);
    //console.log(returnVal);
    return returnVal;
};

var coordsToIndex = function(x, y) {
    return grid.y * x + y;
};

function createTextures(color) {
    return [
       new THREE.MeshLambertMaterial({ color: color }),
       new THREE.MeshLambertMaterial({ color: 'black' }),
       new THREE.MeshLambertMaterial({ color: color }),
       new THREE.MeshLambertMaterial({ color: color }),
       new THREE.MeshLambertMaterial({ color: color }),  // starts on this one
       new THREE.MeshLambertMaterial({ map: faceLogo })  // lands on this one after rotating
    ];
}

/*

events

*/

function onMouseMove(e) {
    vector.set((e.clientX / ww) * 2 - 1, - (e.clientY / wh ) * 2 + 1);

    raycaster.setFromCamera(vector,camera);

    // check for intersects with cubes in grid
    intersects = raycaster.intersectObjects(elements.children);
    if (intersects.length > 0) {
        var cube = intersects[0].object;
        if (!cube.tl.isActive()) {

            if (cube.isDisabled) return;

            // cubes rotate diagonally
            cube.tl.to(cube.rotation, 1, {
                z: cube.rotation.z-Math.PI,
                x: cube.rotation.x-Math.PI,
                onComplete: function(a) {
                    // if it has rotated -(pi * 2), then reset to 0 - keeps numbers in control
                    var hasRotated = Math.ceil(this.target.x * 100) == -628;
                    if (hasRotated) {
                        this.target.x = 0;
                        this.target.z = 0
                    }

                    // toggle rotated flag
                    cube.rotated = !cube.rotated;
                }
            });
        }
    }

    // check for intersects with big cubes
    intersects = raycaster.intersectObjects(elementsBig.children);
    if (intersects.length > 0) {
        cube = intersects[0].object;
        if (!cube.tl.isActive()) {

            // big cubes rotate horizontally
            cube.tl.to(cube.rotation, 1, {
                y: cube.rotation.y-Math.PI,
                onComplete: function(a) {
                    // if it has rotated -(pi * 2), then reset to 0 - keeps numbers in control
                    var hasRotated = Math.ceil(this.target.x * 100) == -628;
                    if (hasRotated) {
                        this.target.x = 0;
                        this.target.z = 0
                    }

                    // toggle rotated flag
                    cube.rotated = !cube.rotated;
                }
            });
        }
    }
}

function onInterval() {
    var cubes = elements.children;
    var numRotated = 0;
    var i, iLeft, iBottom, iBottomLeft;
    var squareSize = 0;
    var maxSize = 0;
    var squareArray = [];

    //console.log(grid.x + ', ' + grid.y);

    // maximal square algorithm
    for (var x = 0; x < grid.x; x++) {
        for (var y = 0; y < grid.y; y++) {
            i = coordsToIndex(x, y);

            // initialize
            cubes[i].cornerOfSquareOfSize = 0;

            if (cubes[i].rotated) {
                numRotated++;
                //console.log(x + ', ' + y);

                // if cube is on bottom or left edge, 1 if rotated
                if (x == 0 || y == 0) {
                    cubes[i].cornerOfSquareOfSize = 1;
                    continue;
                }

                // for the remaining cubes, 0 if it's 0, else 1 + min of it's left/bottom/bottom-left neighbors
                iLeft = coordsToIndex(x-1, y);
                iBottom = coordsToIndex(x, y-1);
                iBottomLeft = coordsToIndex(x-1, y-1);
                squareSize = 1 + Math.min(cubes[iLeft].cornerOfSquareOfSize, cubes[iBottom].cornerOfSquareOfSize, cubes[iBottomLeft].cornerOfSquareOfSize);

                cubes[i].cornerOfSquareOfSize = squareSize;

                //console.log(iBottomLeft + '-' + iLeft + '-' + iBottom + ' -> ' + i);
                //console.log(cubes[iBottomLeft].cornerOfSquareOfSize + '-' + cubes[iLeft].cornerOfSquareOfSize + '-' + cubes[iBottom].cornerOfSquareOfSize + ' -> ' + cubes[i].cornerOfSquareOfSize);

                // keep track of maximum square size
                if (maxSize < squareSize)
                    maxSize = squareSize;

                // maintain data structure for big squares
                // [3] -> [{x:1, y:3}, {x:2, y:6}]
                if (squareSize > 1) {
                    if (typeof squareArray[squareSize] === 'undefined') squareArray[squareSize] = [];
                    squareArray[squareSize].push({ x: x, y: y });
                }
            }
        }
    }
    //console.log(numRotated);
    //console.log(maxSize);
    //console.log(squareArray);

    // starting with maxSize and going smaller, convert squares to bigger cubes
    for (var s = maxSize; s > 1; s--) {
    //for (var s = maxSize; s == maxSize; s--) { // temporarily deal with just largest size
        console.log('size: ' + s);
        var squaresOfOneSize = squareArray[s];

        for (var t = 0; t < squaresOfOneSize.length; t++) {
            var topRightCorner = squaresOfOneSize[t];
            //console.log(topRightCorner);
            var topLeftCorner = { x: topRightCorner.x - s + 1, y: topRightCorner.y };
            var skipSquare = false;

            // check cubes behind this square
            for (var u = topLeftCorner.x; u < topLeftCorner.x+s; u++) {
                for (var v = topLeftCorner.y-s+1; v < topLeftCorner.y+1; v++) {
                    var cube = cubes[coordsToIndex(u, v)];

                    // if already disabled, skip this big square
                    if (cube.isDisabled) {
                        console.log('cube disabled: ' + u + ', ' + v);
                        skipSquare = true;
                        break;
                    }
                }
                if (skipSquare) break;
            }
            if (skipSquare) continue;

            // disable cubes behind this square
            for (var u = topLeftCorner.x; u < topLeftCorner.x+s; u++) {
                for (var v = topLeftCorner.y-s+1; v < topLeftCorner.y+1; v++) {
                    var cube = cubes[coordsToIndex(u, v)];

                    // disable cube
                    cube.isDisabled = true;

                    // animate to black side
                    cube.tl.to(cube.rotation, 0.2, { y: cube.rotation.y+Math.PI/2 });
                }
            }

            // looks better as a square, not a cube
            var bigBoxSize = s * boxSize + (s-1) * gapSize;
            var geometry = new THREE.BoxGeometry(bigBoxSize, bigBoxSize, 1);
            var material = materialsArray[getRandomInt(0, materialsArray.length)];
            var square = new THREE.Mesh(geometry, material);
            square.position.x = (boxSize * topLeftCorner.x) + (gapSize * topLeftCorner.x) - ww/2 + (boxSize + gapSize) * (s-1) / 2;
            square.position.y = (boxSize * topLeftCorner.y) + (gapSize * topLeftCorner.y) - wh/2 - (boxSize + gapSize) * (s-1) / 2;
            square.position.z = 100;
            square.rotation.y = Math.PI/2;
            square.tl = new TimelineMax();
            square.rotated = true;
            elementsBig.add(square);

            square.tl.to(square.rotation, 1, { y: square.rotation.y+Math.PI/2 });
        }
    }
}
