import {useContext, useEffect} from 'react'
import { FollowCamera, Vector3 } from '@babylonjs/core';
import { GameObjectContext } from '../contexts/GameObjectContext';

export const CameraController = ({playerMesh})=> {
    const { scene } = useContext(GameObjectContext);

    useEffect(()=>{
    if(!scene || !playerMesh) return;

        const existingCamera = scene.activeCamera;
        if(existingCamera) {
            existingCamera.dispose();
        }

    const camera = new FollowCamera("main-camera", new Vector3(0, 5, -50), scene);
    camera.radius = 40;           // distance du joueur
    camera.heightOffset = 5;      // hauteur au-dessus du joueur
    camera.rotationOffset = 180;  // derrière le joueur
    camera.cameraAcceleration = 0.5;

    camera.lockedTarget = playerMesh;
    scene.activeCamera = camera;
    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

    return () => {
      camera.dispose();
    };

    }, [scene, playerMesh])
}