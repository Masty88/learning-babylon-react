import React, { useEffect, useRef, useContext, useState } from 'react';
import { MeshBuilder, TransformNode, StandardMaterial, Vector3, Scalar, Color3 } from '@babylonjs/core';
import { GameObjectContext } from '../contexts/GameObjectContext';
import { GRAVITY, PLAYER_SPEED, PLAYER_JUMP_FORCE, ROTATION_SPEED } from '../settings/const';

export const PlayerController = ({ input, onPlayerCreated }) => {
  const { scene } = useContext(GameObjectContext);
  const [isFalling, setIsFalling] = useState(false);
  const playerRef = useRef(null);
  const velocityRef = useRef(new Vector3(0, 0, 0));

  // EFFET 1 : création du mesh (une seule fois)
  useEffect(() => {
    const player = MeshBuilder.CreateSphere("player", { diameter: 2 }, scene);
    player.position = new Vector3(0, 500, 0);

    const playerMaterial = new StandardMaterial("playerMaterial", scene);
    playerMaterial.diffuseColor = new Color3(0, 0, 10);
    player.material = playerMaterial;

    player.checkCollisions = true;

    // TransformNode enfant pour indiquer la direction du joueur
    const node = new TransformNode("playerNode", scene);
    node.parent = player;
    node.position = new Vector3(0, 0, 1);

    const square = MeshBuilder.CreateBox("square", { size: 0.5 }, scene);
    square.parent = node;

    playerRef.current = player;

    if (onPlayerCreated) {
      onPlayerCreated(player);
    }
  }, [scene]);

  // EFFET 2 : mouvement (se met à jour quand input change)
  useEffect(() => {
    if (!scene || !playerRef.current) return;

    const updatePlayerMovement = () => {
      const { horizontal, vertical, jump } = input || { horizontal: 0, vertical: 0 };

      // Rotation gauche/droite
      if (horizontal !== 0) {
        playerRef.current.rotation.y += horizontal * ROTATION_SPEED;
      }

      // Mouvement avant/arrière
      if (vertical !== 0) {
        const frontVector = new Vector3(
          Math.sin(playerRef.current.rotation.y),
          0,
          Math.cos(playerRef.current.rotation.y)
        );
        const moveDirection = frontVector.scale(vertical * PLAYER_SPEED);
        playerRef.current.position.addInPlace(moveDirection);
      }

      // Détection de chute
      if (playerRef.current.position.y < 0) {
        setIsFalling(true);
      }

      // Saut
      if (jump && playerRef.current.position.y < 1.2 && !isFalling) {
        velocityRef.current.y = PLAYER_JUMP_FORCE;
      }

      // Gravité avec Lerp
      const deltaTime = scene.getEngine().getDeltaTime() / 1000;
      const newVelocityY = velocityRef.current.y + GRAVITY * deltaTime;
      velocityRef.current.y = Scalar.Lerp(velocityRef.current.y, newVelocityY, 0.1);

      // Déplacement avec collisions
      playerRef.current.moveWithCollisions(velocityRef.current);
    };

    scene.registerBeforeRender(updatePlayerMovement);
    return () => {
      scene.unregisterBeforeRender(updatePlayerMovement);
    };
  }, [scene, input]);

  return null;
}