import * as _ from "lodash";
import * as THREE from 'three';
import { Euler, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadImages, loadJson } from './jsonLoader';

const jsonData = loadJson();
const imageData = loadImages();

type ImageRotationData = {
    rotation: THREE.Euler;
    imageName: string;
    image: string;
    texture: THREE.Texture;
}

const imageRotationData = Object.keys(jsonData).map(key => {
    const data = jsonData[key] as any;
    const eulerAngle = new THREE.Euler(data["_x"], data["_y"], data["_z"], data["_order"]);
    const image = document.createElement("img");
    image.src = imageData[key]
    image.id = key;
    image.style.display = "none";
    document.body.appendChild(image);
    return {
        rotation: eulerAngle,
        imageName: key,
        image: imageData[key],
        texture: new THREE.Texture(image)
    }
});

console.log(jsonData);

Object.keys(jsonData).map(key => {
    const data = jsonData[key];
})

const getEulerDistance = (a: THREE.Euler, b: THREE.Euler) => {
    const x = Math.pow(a.x - b.x, 2);
    const y = Math.pow(a.y - b.y, 2);
    const z = Math.pow(a.z - b.z, 2);
    return Math.sqrt(x + y + z);
}


// TODO: does it make the most sense to write this as a class?
const image = document.createElement("img");
image.id = "myImage";
image.style.display = "none";
document.body.appendChild(image);


const renderer = new THREE.WebGLRenderer({
    antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
// scene.background = new THREE.Color(0x00ffff);

type PlaneParams = {
    rotation: THREE.Euler;
    color: THREE.Color;
};

const makeRing = (params: PlaneParams) => {
    const geometry = new THREE.TorusGeometry(5, 0.01, 64, 64);
    const material = new THREE.MeshBasicMaterial( { color: params.color, side: THREE.DoubleSide } );
    const mesh = new THREE.Mesh( geometry, material );
    mesh.rotation.copy(params.rotation);
    return mesh;
}

const texture = new THREE.Texture(image);
const textureBack = new THREE.Texture(image);
textureBack.flipY = false;
// Display an image on a plane
const makeImage = (params: PlaneParams) => {
    const geometry = new THREE.PlaneGeometry(10, 10);
    const geometryBack = new THREE.PlaneGeometry(10, 10);

    geometryBack.applyMatrix4( new THREE.Matrix4().makeRotationY( Math.PI ) );

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.copy(params.rotation);

    const materialBack = new THREE.MeshBasicMaterial({
        map: textureBack,
        side: THREE.FrontSide,
        transparent: true,
        opacity: 0.5,
    });
    materialBack

    const meshBack = new THREE.Mesh(geometryBack, materialBack);
    meshBack.rotation.copy(params.rotation);
    meshBack.name = "back";

    const image = new THREE.Group();
    image.add(mesh);
    image.add(meshBack);

    return image;
};

// Display an image on a sprite
const makeSprite = (params: PlaneParams) => {
    const map = new THREE.TextureLoader().load( 'sprite.png' );
    const material = new THREE.SpriteMaterial( { map } );
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(10, 10, 10);
    return sprite;
}

const compassRingParams: PlaneParams[] = [
    // Green => Rotation about X axis
    {rotation: new THREE.Euler(0, Math.PI / 2, 0, 'XYZ'), color: new THREE.Color(0x00ff00)},
    // Blue  => Rotation about Y axis
    {rotation: new THREE.Euler(0, 0, Math.PI / 2, 'XYZ'), color: new THREE.Color(0x0000ff)},
    // Red   => Rotation about Z axis
    {rotation: new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ'), color: new THREE.Color(0xff0000)},
];

compassRingParams
    .map(makeRing)
    .forEach(ring => { scene.add(ring) });

const sprite = compassRingParams
    .slice(0, 1)
    .map(makeSprite)[0];

// const secondSprite = compassRingParams
//     .slice(0, 1)
//     .map(makeSprite)[0];

scene.add(sprite);
// scene.add(secondSprite);

const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
scene.add( ambientLight );

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
const controls = new OrbitControls( camera, renderer.domElement );
controls.enableZoom = false;

//controls.update() must be called after any manual changes to the camera's transform
camera.position.set( 20, 0, 0);
camera.lookAt(new Vector3(0, 0, 0));
controls.update();

// display current angles
const div = document.createElement("div");
// TODO: Move to CSS style or something.
div.style.width = "150px";
div.style.height = "150px";
div.style.background = "red";
div.style.color = "white";
div.style.position = "absolute";
div.style.bottom = "0px";
div.style.left = (window.innerWidth - 160) + "px";
document.body.appendChild(div);


let lastImageName = "";
export const animate = () => {
	requestAnimationFrame( animate );
    // woah slow
    const sorted = imageRotationData.sort((a, b) => {
        return getEulerDistance(a.rotation, camera.rotation) - getEulerDistance(b.rotation, camera.rotation);
    })
    const closestData = sorted[0];
    // const secondClosest = sorted[1];

    const closestName = closestData.imageName;
    if (lastImageName !== closestName) {
        var imgtag = document.getElementById("myImage") as HTMLImageElement;
        imgtag.src = closestData.image;

        sprite.material.map = closestData.texture;
        sprite.material.opacity = 0.85;
        sprite.material.map.needsUpdate = true;

        // secondSprite.material.map = secondClosest.texture;
        // secondSprite.material.opacity = 0.5;
        // secondSprite.material.map.needsUpdate = true;
        
    }
    lastImageName = closestName;
	renderer.render( scene, camera );
}


window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}