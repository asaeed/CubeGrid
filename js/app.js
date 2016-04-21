/*

    more features:
    - squares of frogs combine to form bigger frogs
    - cubes colors form a message and turning from frogs to colors reveals it
    - faces appear on some cubes

*/

var ww = window.innerWidth;
var wh = window.innerHeight;

// instantiated in init
var renderer, scene, camera, light, elements, intersects;

// instantiate here 
var raycaster = new THREE.Raycaster();
var vector = new THREE.Vector2();

// frog colors
var colorBlue = '#339ce2';
var colorGreen = '#299f55';
var colorYellow = '#ffde1a';
var colorOrange = '#f58300';
var colorRed = '#de3e1c';

THREE.ImageUtils.crossOrigin = '';
var textureLoader = new THREE.TextureLoader();
var faceLogo = textureLoader.load("./img/logo-black.jpg");

var boxSize = 50;
var gapSize = 5;

function init(){

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

    window.addEventListener("mousemove", onMouseMove);
    setInterval(onInterval, 4000);
}

var animate = function () {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

function createBoxes(){
    elements = new THREE.Object3D();

    grid = { x: Math.floor(ww/boxSize), y: Math.floor(wh/boxSize) };
    rest = { x: ww%boxSize, y: wh%boxSize };

    var materialsArray = [
        new THREE.MeshFaceMaterial(createTextures(colorBlue)), 
        new THREE.MeshFaceMaterial(createTextures(colorGreen)),
        new THREE.MeshFaceMaterial(createTextures(colorYellow)), 
        //new THREE.MeshFaceMaterial(createTextures(colorOrange)),
        //new THREE.MeshFaceMaterial(createTextures(colorRed))
    ];

    var geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    //var material = new THREE.MeshFaceMaterial(textures);
    for(var i=0;i<grid.y;i++) {
        for(var j=0;j<grid.x;j++) {
            var material = materialsArray[getRandomInt(0, materialsArray.length)];
            cube = new THREE.Mesh(geometry, material);
            cube.position.x = (boxSize*j)-ww/2 + gapSize*j;
            cube.position.y = (boxSize*i)-wh/2 + gapSize*i;
            cube.position.z = -25;
            cube.castShadow = true;
            cube.receiveShadow = true;
            cube.tl = new TimelineMax();
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
    vector.set(
        2 * (e.clientX / ww) - 1,
        1 - 2 * (e.clientY / wh )
    );

    raycaster.setFromCamera(vector,camera);
    intersects = raycaster.intersectObjects(elements.children);
    if(intersects.length>0){
        var cube = intersects[0].object;
        
        if (!cube.tl.isActive()) {

            // cubes go back and forth on z axis, requires perspective cam
            // cube.tl
            //     .to(cube.position, 0.3, { z:-120 })
            //     .to(cube.position, 0.6, { z:-25, ease: Back.easeOut.config(6) });

            // cubes rotate diagonally
            cube.tl.to(cube.rotation, 1, { z: cube.rotation.z-Math.PI, x: cube.rotation.x-Math.PI });
        }
    }   
}

function onInterval() {
    console.log('interval');
}

init();