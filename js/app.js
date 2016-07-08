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
var renderer, scene, camera, light, intersects, materialsArray, faceMaterialsArray;
var lineMaterial;

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

var boxSize = 120;
var gapSize = 12;
var grid = { x: Math.floor(ww/boxSize), y: Math.floor(wh/boxSize) };
//var grid = { x: 5, y: 5 };

var imgLogo = textureLoader.load('./img/logo-black.jpg', init);
var faceArray = [
    textureLoader.load('./img/faces/kali.jpg', init),
    textureLoader.load('./img/faces/jesse.jpg', init),
    textureLoader.load('./img/faces/cha.jpg', init)
];

// faceArray[1].magFilter = THREE.NearestFilter;
// faceArray[1].minFilter = THREE.LinearMipMapLinearFilter;
// faceArray[2].magFilter = THREE.NearestFilter;
// faceArray[2].minFilter = THREE.LinearMipMapLinearFilter;

var imageCounter = 0;

function init() {

    // wait till all images load
    imageCounter++;
    if (imageCounter < 4) return;
    console.log('images loaded');

    //initWebSocket('10.119.93.151', 0, 0.5);
    //initWebSocket('localhost', 0.5, 1);

    initWebSocket('localhost', 0, 1);

    initScene();
    createBoxes();
    animate();

    //window.addEventListener('mousemove', onMouseMove, false);
    setInterval(onInterval, 8000);
    //window.addEventListener('click', onInterval, false);
}

var animate = function () {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

function initWebSocket(host, min, max) {
    ws = new WebSocket('ws://' + host + ':8181/');

    ws.onopen = function() {
      ws.send('{ type: "blob" }');
      console.log('Message is sent...');
    };

    ws.onmessage = function(e) {
      var data = JSON.parse(e.data);
      //console.log(data);
      drawBlobs(data, min, max);
    };

    ws.onclose = function() {
      console.log('Connection is closed...');
    };
}

function initScene() {
    /* WEBGL RENDERER */
    renderer = new THREE.WebGLRenderer({canvas : document.getElementById('canvas'), antialias: true });
    renderer.setSize(ww,wh);
    //renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    renderer.shadowMap.enabled = true;

    /* SCENE */
    scene = new THREE.Scene();

    /* CAMERA */
    //camera = new THREE.PerspectiveCamera(50, ww/wh, 1, 10000);
    camera = new THREE.OrthographicCamera(ww/-2, ww/2, wh/2, wh/-2, 1, 10000);
    camera.position.set(0, 0, 1000);
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

    faceMaterialsArray = [
        new THREE.MeshFaceMaterial(createFaceTextures(colorBlue, faceArray[0])),
        new THREE.MeshFaceMaterial(createFaceTextures(colorGreen, faceArray[1])),
        new THREE.MeshFaceMaterial(createFaceTextures(colorYellow, faceArray[2]))
    ];

    lineMaterial = new THREE.LineBasicMaterial({ color: '#de3e1c' });
}

function createBoxes() {
    var geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    for (var x = 0; x < grid.x; x++) {
        for (var y = 0; y < grid.y; y++) {
            var material = materialsArray[getRandomInt(0, materialsArray.length)];
            var cube = new THREE.Mesh(geometry, material);
            cube.type = 'cube';
            cube.coords = { x: x, y: y };
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

// helpers

var getRandomInt = function(min, max) {
    var returnVal = Math.floor((Math.random() * max) + min);
    //console.log(returnVal);
    return returnVal;
};

var coordsToIndex = function(x, y) {
    return grid.y * x + y;
};

var coordToPixels = function(x) {
    return -(boxSize * Math.floor(x)) - (gapSize * Math.floor(x));
};

function createTextures(color) {
    return [
       new THREE.MeshLambertMaterial({ color: color }),
       new THREE.MeshLambertMaterial({ color: 'black' }),
       new THREE.MeshLambertMaterial({ color: color }),
       new THREE.MeshLambertMaterial({ color: color }),
       new THREE.MeshLambertMaterial({ color: color }),  // starts on this one
       new THREE.MeshLambertMaterial({ map: imgLogo })  // lands on this one after rotating
    ];
}

function createFaceTextures(color, face) {
    return [
       new THREE.MeshLambertMaterial({ color: color }),
       new THREE.MeshLambertMaterial({ color: 'black' }),
       new THREE.MeshLambertMaterial({ color: color }),
       new THREE.MeshLambertMaterial({ color: color }),
       new THREE.MeshLambertMaterial({ color: color }),  // starts on this one
       new THREE.MeshLambertMaterial({ map: face })  // lands on this one after rotating
    ];
}

// events

function onMouseMove(e) {
    var cube = checkIntersect(e.clientX, e.clientY);
    if (cube)
        flipCube(cube);
}

function checkIntersect(x, y) {
    vector.set((x / ww) * 2 - 1, - (y / wh ) * 2 + 1);
    raycaster.setFromCamera(vector,camera);

    // check for intersects with planes (squares)
    intersects = raycaster.intersectObjects(elementsBig.children);
    if (intersects.length > 0)
        return intersects[0].object;

    // check for intersects with cubes in grid
    intersects = raycaster.intersectObjects(elements.children);
    if (intersects.length > 0)
        return intersects[0].object;

    return null;
}

function flipCube(cube) {
    if (cube.tl.isActive() || cube.isDisabled) return;

    if (cube.type == 'cube') {
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
    } else {
        // big squares rotate horizontally
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
                cube.flipsLeft -= 1;

                // once square has flipped to a few times, convert it back to cubes
                if (cube.flipsLeft == 0) {
                    elementsBig.remove(cube);

                    // enable cubes behind this square
                    var topLeftCorner = cube.topLeftCorner;
                    var s = cube.cubesWide;
                    for (var u = topLeftCorner.x; u < topLeftCorner.x+s; u++) {
                        for (var v = topLeftCorner.y-s+1; v < topLeftCorner.y+1; v++) {
                            var cubeInside = elements.children[coordsToIndex(u, v)];

                            // disable cube
                            cubeInside.isDisabled = false;

                            // animate to black side
                            cubeInside.tl.to(cubeInside.rotation, 0.4, { x: 0, y: 0, z: 0 });
                        }
                    }
                }
            }
        });
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
                        //console.log('cube disabled: ' + u + ', ' + v);
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
            var material = faceMaterialsArray[getRandomInt(0, faceMaterialsArray.length)];
            var square = new THREE.Mesh(geometry, material);
            square.position.x = (boxSize * topLeftCorner.x) + (gapSize * topLeftCorner.x) - ww/2 + (boxSize + gapSize) * (s-1) / 2;
            square.position.y = (boxSize * topLeftCorner.y) + (gapSize * topLeftCorner.y) - wh/2 - (boxSize + gapSize) * (s-1) / 2;
            square.position.z = 400;
            square.rotation.y = Math.PI/2;
            square.tl = new TimelineMax();
            square.rotated = true;
            square.type = 'square';
            square.cubesWide = s;
            square.topLeftCorner = topLeftCorner;
            square.flipsLeft = 5;
            elementsBig.add(square);

            square.tl.to(square.rotation, 1, { y: square.rotation.y+Math.PI/2 });
        }
    }
}

// size of incoming blob data
var bw = 480;
var bh = 360;
var lines = [];
var frameCounter = 0;
var pointCounter = 0;
var previousCubes = [];
var previousCubes1 = [];
var previousCubes2 = [];
var previousCubes3 = [];
var previousCubes4 = [];
function drawBlobs(data, min, max) {

    // skip frames
    //if (frameCounter > 1) frameCounter = 0;
    //else { frameCounter++; return; }

    //console.log(data);
    // remove old lines
    for (var h = 0; h < lines.length; h++) {
        scene.remove(lines[h]);
    }
    lines = [];

    var currentCubes = [];

    for (var i = 0; i < data.numBlobs; i++) {
        var blobPoints = data.blobs[i];
        var geometry = new THREE.Geometry();
        for (var j = 0; j < blobPoints.length; j++) {

            // skip points
            if (pointCounter > 1) pointCounter = 0;
            else { pointCounter++; continue; }

            //var x = blobPoints[j].x * ww/bw - ww/2;
            //var y = - blobPoints[j].y * wh/bh + wh/2 - 2;

            var rangeSize = ww*max - ww*min;
            var rangeMin = ww * min;

            var x = blobPoints[j].x * rangeSize/bw + rangeMin;
            var y = blobPoints[j].y * wh/bh;

            //var cube = checkIntersect(blobPoints[j].x * ww/bw, blobPoints[j].y * wh/bh);
            var cube = checkIntersect(x, y);

            if (cube && getRandomInt(0, 3) < 2 &&
                (previousCubes.indexOf(cube) == -1 &&
                previousCubes1.indexOf(cube) == -1 &&
                previousCubes2.indexOf(cube) == -1 &&
                previousCubes3.indexOf(cube) == -1 &&
                previousCubes4.indexOf(cube) == -1))
                flipCube(cube);
            currentCubes.push(cube);

            geometry.vertices.push(new THREE.Vector3(x - ww/2, -y + wh/2 - 2, 600));
        }

        previousCubes4 = previousCubes3;
        previousCubes3 = previousCubes2;
        previousCubes2 = previousCubes1;
        previousCubes1 = previousCubes;
        previousCubes = currentCubes;

        // draw contour
        lines.push(new THREE.Line(geometry, lineMaterial));
        scene.add(lines[i]);
    }
}
