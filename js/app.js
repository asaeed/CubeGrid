/*

    more features:
    - squares of frogs combine to form bigger frogs
    - cubes colors form a message and turning from frogs to colors reveals it
    - faces appear on some cubes
    - when a big cube is flipped, it breaks into smaller cubes

*/

var ww = window.innerWidth;
var wh = window.innerHeight;

// instantiated in init
var renderer, scene, camera, light, intersects;

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
//var grid = { x: 4, y: 4 };

var faceLogo = textureLoader.load('./img/logo-black.jpg', init);

function init() {

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

function createBoxes(){
    var materialsArray = [
        new THREE.MeshFaceMaterial(createTextures(colorBlue)), 
        new THREE.MeshFaceMaterial(createTextures(colorGreen)),
        new THREE.MeshFaceMaterial(createTextures(colorYellow)), 
        //new THREE.MeshFaceMaterial(createTextures(colorOrange)),
        //new THREE.MeshFaceMaterial(createTextures(colorRed))
    ];

    var geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    for (var x = 0; x < grid.x; x++) {
        for (var y = 0; y < grid.y; y++) {
            var material = materialsArray[getRandomInt(0, materialsArray.length)];
            var cube = new THREE.Mesh(geometry, material);
            cube.position.x = (boxSize*x)-ww/2 + gapSize*x;
            cube.position.y = (boxSize*y)-wh/2 + gapSize*y;
            cube.position.z = -20;
            //cube.castShadow = true;
            //cube.receiveShadow = true;
            cube.tl = new TimelineMax();
            cube.rotated = false;
            cube.cornerOfSquareOfSize = 0;
            elements.add(cube);
        }
    }

    scene.add(elements);
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

var createTextures = function(color) {
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
    intersects = raycaster.intersectObjects(elements.children);
    if (intersects.length>0){
        var cube = intersects[0].object;
        
        if (!cube.tl.isActive()) {

            // cubes go back and forth on z axis, requires perspective cam
            // cube.tl
            //     .to(cube.position, 0.3, { z:-120 })
            //     .to(cube.position, 0.6, { z:-25, ease: Back.easeOut.config(6) });

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
    console.log(squareArray);

    // starting with maxSize and going smaller, convert squares to bigger cubes
    for (var s = maxSize; s > 1; s--) {

    }

}

//init();