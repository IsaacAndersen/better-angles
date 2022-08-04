import * as THREE from 'three';
import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'dat.gui';

// TODO: does it make the most sense to write this as a class?
const screenshot = require('../images/m2.jpeg');

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


// A materal that displays the outline
const outlineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.05,
});

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

const images = compassRingParams
    .slice(0, 1)
    .map(makeImage);
    

scene.add(...images);

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

const div2 = document.createElement("div");
div2.style.width = "150px";
div2.style.height = "150px";
div2.style.background = "orange";
div2.style.color = "white";
div2.style.position = "absolute";
div2.style.bottom = "0px";
div2.style.right = "10 px";

let files: FileList = null;
const filePicker = document.createElement("input");
filePicker.type = "file";
filePicker.name = "filePicker";
filePicker.id = "getFile";
filePicker.multiple = true;
filePicker.onchange = (event: any) => {
    files = event.target.files;
}

div2.appendChild(filePicker);

document.body.appendChild(div);
document.body.appendChild(div2);

const fileObject = {
    fileNumber: -1,
};

// Make a GUI
const gui = new GUI()
const cameraFolder = gui.addFolder('Camera')
cameraFolder.add(fileObject, 'fileNumber', -1, files?.length ?? 0)
cameraFolder.open()

const toDegrees = (radians: number) => {
    return radians * (180 / Math.PI);
}

let oldFileIndex = fileObject.fileNumber;

export const animate = () => {
	requestAnimationFrame( animate );

	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();

    cameraFolder.__controllers[0].max(filePicker?.files?.length ?? 0);
    cameraFolder.__controllers[0].updateDisplay();
    const azimuthDegrees = toDegrees(controls.getAzimuthalAngle());
    const polarDegrees = toDegrees(controls.getPolarAngle());
    div.innerHTML = `azimuthal angle: ${azimuthDegrees.toFixed(3)}<br> polar angle: ${polarDegrees.toFixed(3)}<br>camera angle y: ${toDegrees(camera.rotation.y).toFixed(3)}<br> camera angle x: ${toDegrees(camera.rotation.x).toFixed(3)}`;
    const fileIndex = fileObject.fileNumber;
    if (fileIndex !== oldFileIndex && files.item(fileIndex)) {
        // Download the camera orientation
        const blob = new Blob([JSON.stringify(camera.rotation)], {type: 'application/json'});
        // (B) CREATE DOWNLOAD LINK
        var url = window.URL.createObjectURL(blob);
        var anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = files.item(fileIndex).name.split(".")[0] + ".json";
        // (C) Force download
        anchor.click();
        window.URL.revokeObjectURL(url);
        var reader = new FileReader();
        var imgtag = document.getElementById("myImage") as HTMLImageElement;

        reader.onload = (event: ProgressEvent<FileReader>) => {
            imgtag.src = event.target.result as string;
            images[0].children.forEach((child, _) => {
                const mesh = (<THREE.Mesh> child);
                // mesh.geometry.scale(ratio, 1, 1);

                const material = mesh.material as THREE.MeshBasicMaterial;
                const newTexture = new THREE.Texture(imgtag);
    
                if (child.name === "back") {
                    texture.center = new THREE.Vector2(0.5, 0.5);
                    texture.rotation = Math.PI;
                }
    
                material.map = newTexture;
                material.map.needsUpdate = true;
            });
        };

        reader.readAsDataURL(files.item(fileIndex));
        }
    oldFileIndex = fileIndex;

    // div.innerHTML += `<br>ratio: ${ratio}`;

	renderer.render( scene, camera );

}

window.addEventListener("keydown", (event) => {
    event.preventDefault();
    console.log("woah");
    console.log(fileObject.fileNumber);
    console.log(event.key);
    if (event.key === "ArrowLeft") {
        fileObject.fileNumber = (fileObject.fileNumber - 1 + files.length) % files.length;
    }
    if (event.key === "ArrowRight") {
        fileObject.fileNumber = (fileObject.fileNumber + 1) % files.length;
    }
    console.log('new number')
    console.log(fileObject.fileNumber);
    return;
});

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}