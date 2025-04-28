// EnvironmentController.jsx
import React, { useEffect, useContext } from 'react';
import { MeshBuilder, HemisphericLight, Vector3, Color3, StandardMaterial } from '@babylonjs/core';
import { GameObjectContext } from '../contexts/GameObjectContext';
import { use } from 'react';

export const EnvironmentController = () => {
 const { scene } = useContext(GameObjectContext);

    useEffect(() => {
        if (!scene) return;
        console.log("EnvironmentController: scene is ready");
        const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
        const groundMaterial = new StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
        ground.material = groundMaterial;
        ground.checkCollisions = true;

        //create a light
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    }, [scene]);

    return null;
}