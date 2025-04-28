// PlayerController.jsx
import React, { useEffect, useRef, useContext, useState } from 'react';
import { MeshBuilder, TransformNode,StandardMaterial, Vector3, Scalar, Color3 } from '@babylonjs/core';
import { GameObjectContext } from '../contexts/GameObjectContext';
import { GRAVITY, PLAYER_SPEED, PLAYER_JUMP_FORCE, ROTATION_SPEED } from '../settings/const';

export const PlayerController = ({input, onPlayerCreated})=>{
   const { scene } = useContext(GameObjectContext);
   const [isFalling, setIsFalling] = useState(false);
   const playerRef = useRef(null);
   const velocityRef = useRef(new Vector3(0, 0, 0));

   useEffect(()=>{

    const player = MeshBuilder.CreateSphere("player", { diameter : 2 }, scene);
    player.position = new Vector3(0, 500, 0);

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

    if(onPlayerCreated) {
        onPlayerCreated(player);
    }


   }, [scene]);


   // Manage player movement
   useEffect(()=>{
    if(!scene || !playerRef.current) return;


    const updatePlayerMovement = () => {
        const { horizontal, vertical, jump } = input || { horizontal: 0, vertical: 0 };

        if(horizontal !==0){
        console.debug("horizontal", horizontal);
        playerRef.current.rotation.y += horizontal * ROTATION_SPEED
        }

        if(vertical !==0){
            const frontVector = new Vector3(
                Math.sin(playerRef.current.rotation.y),
                0,
                Math.cos(playerRef.current.rotation.y)
            )

            const moveDirection = frontVector.scale(vertical * PLAYER_SPEED);
            playerRef.current.position.addInPlace(moveDirection);
        }

        if(playerRef.current.position.y < 0) {
            setIsFalling(true);
            console.log("Player is falling!!!");
        }




        if (jump && playerRef.current.position.y < 1.2 && !isFalling) {
            velocityRef.current.y = PLAYER_JUMP_FORCE;
        }

          const deltaTime = scene.getEngine().getDeltaTime() / 1000; // Convert to seconds
          const newVelocityY = velocityRef.current.y + GRAVITY * deltaTime;
          velocityRef.current.y = Scalar.Lerp(velocityRef.current.y, newVelocityY, 0.1);
          playerRef.current.moveWithCollisions(velocityRef.current);


    }

    scene.registerBeforeRender(updatePlayerMovement);
    return () => {
        scene.unregisterBeforeRender(updatePlayerMovement);
    };
   }, [scene,input]);


    return null;
}