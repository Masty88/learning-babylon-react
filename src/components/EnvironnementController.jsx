import React, { useEffect, useContext } from 'react';
import { MeshBuilder, HemisphericLight, Vector3, Color3, StandardMaterial } from '@babylonjs/core';
import { GameObjectContext } from '../contexts/GameObjectContext';

export const EnvironmentController = () => {
  const { scene } = useContext(GameObjectContext);

   const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0],
    [1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1],
    [1,1,0,0,0,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1],
    [1,1,1,1,0,1,0,0,1,0,1,1,0,0,1,0,1,0,1,1],
    [1,0,0,0,0,0,0,1,1,0,0,1,1,0,1,0,1,0,1,1],
    [1,0,1,1,1,1,1,1,0,0,1,1,1,0,1,0,1,0,0,1],
    [1,1,1,1,1,1,1,0,0,1,0,0,0,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,1,0,1,1,0,1,1,1,1,0,1,1,1,1],
    [1,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,0,1,0,0,0,1,1,1,0,0,1,1,1,0,1,1,1,0,0],
    [1,0,1,0,1,0,0,0,1,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,0,1,1,1,0,1,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,0,1,1,1,0,1,1,0,1,0,1,0,0,0,1,0,1],
    [1,0,0,0,1,0,1,0,1,1,0,1,0,1,1,1,1,1,0,1],
    [1,1,1,0,1,0,1,0,1,1,0,1,0,0,0,0,0,0,0,1],
    [1,1,1,0,0,0,1,0,0,0,0,0,1,1,1,1,1,1,1,1],
    [1,1,1,0,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1],
    [1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1]
  ];

  useEffect(() => {
    if (!scene) return;
    scene.collisionsEnabled = true
    const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    const groundMaterial = new StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
    ground.material = groundMaterial;
    ground.checkCollisions = true;

    createMaze(scene);

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  }, [scene]);

  function createMaze(scene) {
    maze.forEach((rows, z) => rows.forEach((isWall, x) => {
      if (!isWall) return;
      const wall = MeshBuilder.CreateBox("wall", {
        size: 4,
        height: 25,
      }, scene);
      wall.position.x = (x * 4) - 38;
      wall.position.z = (z * 4) - 38;
      wall.position.y = 12.5;
      wall.checkCollisions = true;
    }))
  }


  return null;
}