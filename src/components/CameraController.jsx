// CameraController.jsx
import {useContext, useEffect} from 'react';
import {FollowCamera, Vector3} from '@babylonjs/core';
import { GameObjectContext } from '../contexts/GameObjectContext';


export const CameraController = ({playerMesh}) => {
    const { scene, engine } = useContext(GameObjectContext);
    useEffect(() => {
        if(!scene || !playerMesh) return;
        console.log("CameraController: scene is ready", scene);
        const existingCamera = scene.getCameraByName("transitional-camera");
        console.log("CameraController: existing camera", existingCamera);

        if(existingCamera) {
            existingCamera.dispose();
        }

        const camera = new FollowCamera("main-camera", new Vector3(0, 5, -50), scene);
        camera.radius = 40; // distance from the target
        camera.heightOffset = 5; // height offset from the target
        camera.rotationOffset = 180; // rotation offset from the target
        camera.cameraAcceleration = 0.5; // acceleration of the camera

        camera.lockedTarget = playerMesh; // target to follow
        scene.activeCamera = camera; // set the camera as the active camera
        camera.attachControl(scene.getEngine().getRenderingCanvas(), true); // attach the camera to the canvas
        console.log("CameraController: main-camera created and attached to canvas", scene.activeCamera);

        return () => {
            camera.dispose(); // dispose the camera when the component is unmounted
        };
    },[scene, playerMesh])


    return null;
}