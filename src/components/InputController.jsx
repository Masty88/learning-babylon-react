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
            if (keys['ArrowLeft'] || keys['a']) horizontal -= 1;
            if (keys['ArrowRight'] || keys['d']) horizontal += 1;

            let vertical = 0;
            if (keys['ArrowUp'] || keys['w']) vertical += 1;
            if (keys['ArrowDown'] || keys['s']) vertical -= 1;

            const newInputValue = {
                horizontal,
                vertical,
            };

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