import * as THREE from 'three';
import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'dat.gui';
import ImageRotator from './imageRotator';
import ImageCropper, { BoundingBox } from './imageCropper';


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
// Super circular dependency checkkk.
imageCropper.imageRotator = imageRotator;
imageRotator.croppedCanvas = imageCropper.croppedCanvas;
document.body.appendChild(imageCropper.croppedCanvas);

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

const downloadAnchor = document.createElement("a");
downloadAnchor.innerHTML = "Download Data";
downloadAnchor.href = "#";

div2.appendChild(filePicker);
div2.appendChild(downloadAnchor);

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

type FileData = {
    faceBoundingBox: BoundingBox;
    faceRotation: THREE.Euler;
}
const fileAlignmentData: Record<string, FileData> = {};

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
        const nameOfFile = files.item(oldFileIndex)?.name.split(".")[0]
        fileAlignmentData[nameOfFile] = {
            faceBoundingBox: imageCropper.boundingBox,
            faceRotation: camera.rotation,
        };

        const blob = new Blob([JSON.stringify(fileAlignmentData)], {type: 'application/json'});
        const url = window.URL.createObjectURL(blob);
        downloadAnchor.href = url;
        downloadAnchor.download = `alignmentData_${Object.keys(fileAlignmentData).length}_images.json`;

        imageCropper.boundingBox = null;
        var reader = new FileReader();

        reader.onload = (event: ProgressEvent<FileReader>) => {
            imageRotator.setImageSource(event.target.result as string);
        };

        reader.readAsDataURL(files.item(fileIndex));
        }
    oldFileIndex = fileIndex;

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

// DOWNLOAD
// // Download the camera orientation