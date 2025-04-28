import React, { useEffect, useState, useContext } from 'react';
import { Scalar } from '@babylonjs/core';
import { GameObjectContext } from '../contexts/GameObjectContext';
import { use } from 'react';

export const InputController = ({ onInputUpdated }) => {
    const { scene } = useContext(GameObjectContext);
    const [keys, setKeys] = useState({});
    const [inputValue, setInputValue] = useState({});

    useEffect(() => {
        const hadleeKeyDown = (e)=>{
            setKeys((prevKeys) => ({ ...prevKeys, [e.key]: true }));
        }

        const handleKeyUp = (e) => {
            setKeys((prevKeys) => ({ ...prevKeys, [e.key]: false }));
        }

        window.addEventListener('keydown', hadleeKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', hadleeKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };

    }, [])

    useEffect(() => {
        if(!scene) return;

        const processInput= ()=>{
            let horizontal = 0;
            if (keys['ArrowLeft'] || keys['a']) horizontal -= Scalar.Lerp(0, 1, 0.8);
            if (keys['ArrowRight'] || keys['d']) horizontal += Scalar.Lerp(0, 1, 0.8);

            let vertical = 0;
            if (keys['ArrowUp'] || keys['w']) vertical += Scalar.Lerp(0, 1, 0.3);
            if (keys['ArrowDown'] || keys['s']) vertical -= Scalar.Lerp(0, 1, 0.3);

            let jump = false;
            if (keys[' ']) jump = true;

            const newInputValue = {
                horizontal,
                vertical,
                jump,
            };

            console.group("InputController: processInput");
            console.log("horizontal", horizontal);
            console.log("vertical", vertical);
            console.log("jump", jump);
            console.groupEnd("InputController: processInput");
            setInputValue(newInputValue);

            if (onInputUpdated) {
                onInputUpdated(newInputValue);
            }
        }


        scene.registerBeforeRender(processInput);
        return () => {
            scene.unregisterBeforeRender(processInput);
        };

    }, [scene, keys])


    return null;
}