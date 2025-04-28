// PlayerController.jsx
import React, { useEffect, useRef, useContext } from 'react';
import { MeshBuilder, TransformNode,StandardMaterial, Vector3, Scalar, Color3 } from '@babylonjs/core';
import { GameObjectContext } from '../contexts/GameObjectContext';
import { GRAVITY, PLAYER_SPEED, PLAYER_JUMP_FORCE, ROTATION_SPEED } from '../settings/const';

export const PlayerController = ({input})=>{
   const { scene } = useContext(GameObjectContext);
   const playerRef = useRef(null);

   useEffect(()=>{

    const player = MeshBuilder.CreateSphere("player", { diameter : 2 }, scene);
    player.position = new Vector3(0, 1, 0);

    // player material
    const playerMaterial = new StandardMaterial("playerMaterial", scene);
    playerMaterial.diffuseColor = new Color3(0, 0, 10);
    player.material = playerMaterial;

    player.checkCollisions = true;

    const node = new TransformNode("playerNode", scene);
    node.parent = player;
    node.position = new Vector3(0, 0, 1);

    const square = MeshBuilder.CreateBox("square", { size: 0.5 }, scene);
    square.parent = node;
    playerRef.current = player;


   }, [scene]);

   useEffect(()=>{
    if(!scene || !playerRef.current) return;
    console.log("PlayerController: scene is ready");

    const updatePlayerMovement = () => {
        const { horizontal, vertical } = input || { horizontal: 0, vertical: 0 };

        if(horizontal !==0){
        console.debug("horizontal", horizontal);
        playerRef.current.rotation.y += horizontal * ROTATION_SPEED
        }
    }

    scene.registerBeforeRender(updatePlayerMovement);
    return () => {
        scene.unregisterBeforeRender(updatePlayerMovement);
    };
   }, [scene,input]);


    return null;
}