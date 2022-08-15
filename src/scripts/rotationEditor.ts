import * as THREE from 'three';
import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'dat.gui';
import ImageRotator from './imageRotator';
import ImageCropper from './imageCropper';


// Setup THREE.js scene
const renderer = new THREE.WebGLRenderer({
    antialias: true});
// TODO: Make the renderer smaller.
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x00ffff);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
camera.position.set( 20, 0, 0);
camera.lookAt(new Vector3(0, 0, 0));

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableZoom = false;
controls.update();

// Add the image to the scene.
const imageRotator = new ImageRotator();
scene.add(imageRotator.threeObject);

// Create an image cropper.
const imageCropper = new ImageCropper(imageRotator.image);

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
        var imgtag = imageRotator.image;

        reader.onload = (event: ProgressEvent<FileReader>) => {
            imgtag.src = event.target.result as string;
            imageRotator.imagePlane.children.forEach((child, _) => {
                const mesh = (<THREE.Mesh> child);
                // mesh.geometry.scale(ratio, 1, 1);

                const material = mesh.material as THREE.MeshBasicMaterial;
                const newTexture = new THREE.Texture(imgtag);
    
                if (child.name === "back") {
                    newTexture.center = new THREE.Vector2(0.5, 0.5);
                    newTexture.rotation = Math.PI;
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
    requestAnimationFrame( animate );
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