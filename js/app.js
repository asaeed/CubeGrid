/*

    more features:
    - squares of frogs combine to form bigger frogs
    - cubes colors form a message and turning from frogs to colors reveals it

*/

var ww = window.innerWidth;
var wh = window.innerHeight;

// frog colors
var colorBlue = '#339ce2';
var colorGreen = '#299f55';
var colorYellow = '#ffde1a';
var colorOrange = '#f58300';
var colorRed = '#de3e1c';

THREE.ImageUtils.crossOrigin = '';
var faceLogo = THREE.ImageUtils.loadTexture("./img/logo-black.jpg");

var boxSize = 50;
var gapSize = 5;

function init(){

    /* WEBGL RENDERER */
    renderer = new THREE.WebGLRenderer({canvas : document.getElementById('canvas'), antialias: true });
    renderer.setSize(ww,wh);
    renderer.shadowMapEnabled = true;

    /* SCENE */
    scene = new THREE.Scene();

    /* CAMERA */
    //camera = new THREE.PerspectiveCamera(50, ww/wh, 1, 10000);
    camera = new THREE.OrthographicCamera(ww/-2, ww/2, wh/2, wh/-2, 1, 10000);
    camera.position.set(0, 0, 500);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);


    /* LIGHT */
    light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(ww/2, wh/2, 250);
    scene.add(light);
    light.castShadow = false;

    var alight = new THREE.AmbientLight( 0xaaaaaa ); // soft white light
    scene.add(alight);

    createBoxes();

    animate();

    window.addEventListener("mousemove", mousemove);
}

var mouse= {};
function mousemove(e){
    vector = new THREE.Vector2();
    vector.set(
        2 * (e.clientX / ww) - 1,
        1 - 2 * (e.clientY / wh )
    );

    // light.position.x = e.clientX - ww/2;
    // light.position.y = wh/2 - e.clientY;

    raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(vector,camera);
    intersects = raycaster.intersectObjects(elements.children);
    if(intersects.length>0){
        var cube = intersects[0].object;
        
        // cubes go back and forth on z axis, requires perspective cam
        // if (!cube.tl.isActive()) {
        //     cube.tl
        //         .to(cube.position, 0.3, { z:-120 })
        //         .to(cube.position, 0.6, { z:-25, ease: Back.easeOut.config(6) });
        // }

        // cubes rotate
        if (!cube.tl.isActive()) {
            cube.tl
                .to(cube.rotation, 1, { z: cube.rotation.z-Math.PI, x: cube.rotation.x-Math.PI });
        }

    }   
}

function createBoxes(){
    
    elements = new THREE.Object3D();

    grid = { x: Math.floor(ww/boxSize), y: Math.floor(wh/boxSize) };
    rest = { x: ww%boxSize, y: wh%boxSize };

    var materialsArray = [
        new THREE.MeshFaceMaterial(createTextures(colorBlue)), 
        new THREE.MeshFaceMaterial(createTextures(colorGreen)),
        //new THREE.MeshFaceMaterial(createTextures(colorYellow)), 
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

var animate = function () {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

var getRandomInt = function(min, max) {
    var returnVal = Math.floor((Math.random() * max) + min);
    //console.log(returnVal);
    return returnVal;
};

var createTextures = function(color) {
    return [
       new THREE.MeshLambertMaterial({ map: faceLogo }),
       new THREE.MeshLambertMaterial({ map: faceLogo }),
       new THREE.MeshLambertMaterial({ color: color }),
       new THREE.MeshLambertMaterial({ map: faceLogo }),
       new THREE.MeshLambertMaterial({ color: color }),
       new THREE.MeshLambertMaterial({ map: faceLogo })
    ];
}

init();