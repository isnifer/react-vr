import React, { Component } from 'react';
import { Euler, Vector3, Math} from 'three';
import { PerspectiveCamera } from '../../react-three/src/ReactTHREE';

const acceleration = 6500;
const easing = 4;
const wsAxis = 'z';
const adAxis = 'x';
const wsInverted = false;
const adInverted = false;
const MAX_DELTA = 0.2;
const direction = new Vector3(0, 0, 0);
const rotation = new Euler(0, 0, 0, 'YXZ');

export default class VRKeyboardCamera extends Component {
    loopState = {
        prevTime: window.performance.now(),
        keys: {},
        velocity: new Vector3(),
    }

    state = {
        cameraPosition: new Vector3(0,0,600),
        // cameraRotation: new Euler(0,0,0),
        lookat: new Vector3(0,0,0),
    }

    onKeyDown = event => {
        const { keys } = this.loopState;
        keys[event.keyCode] = true;
    }

    onKeyUp = event => {
        const { keys } = this.loopState;
        keys[event.keyCode] = false;
    }

    loop = () => {
        const time = window.performance.now();
        const delta = (time - this.loopState.prevTime) / 1000;
        const adSign = adInverted ? -1 : 1;
        const wsSign = wsInverted ? -1 : 1;
        const velocity = this.loopState.velocity;
        const keys     = this.loopState.keys;

        this.loopState.prevTime = time;

        if (delta > MAX_DELTA) {
            velocity[adAxis] = 0;
            velocity[wsAxis] = 0;
            return;
        }

        velocity[adAxis] -= velocity[adAxis] * easing * delta;
        velocity[wsAxis] -= velocity[wsAxis] * easing * delta;

        const position = this.state.cameraPosition;

        if (keys[65]) { velocity[adAxis] -= adSign * acceleration * delta; } // Left
        if (keys[68]) { velocity[adAxis] += adSign * acceleration * delta; } // Right
        if (keys[87]) { velocity[wsAxis] -= wsSign * acceleration * delta; } // Up
        if (keys[83]) { velocity[wsAxis] += wsSign * acceleration * delta; } // Down

        const movementVector = this.getMovementVector(delta, velocity, this.state.cameraRotation);

        const cameraPosition = this.state.cameraPosition.clone();
        cameraPosition.add(movementVector);
        this.setState({cameraPosition});
    }

    getMovementVector = (delta, velocity, elRotation, fly) => {
        direction.copy(velocity);
        direction.multiplyScalar(delta);
        if (!elRotation) {
            return direction;
        }
        if (!fly) {
            elRotation.x = 0;
        }
        rotation.set(Math.degToRad(elRotation.x), Math.degToRad(elRotation.y), 0);
        direction.applyEuler(rotation);
        return direction;
    }

    componentDidMount() {
        window.addEventListener('keydown', this.onKeyDown, false);
        window.addEventListener('keyup', this.onKeyUp, false);
        this.loopInterval = setInterval(this.loop, 10);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.onKeyDown, false);
        window.removeEventListener('keyup', this.onKeyUp, false);
        clearInterval(this.loopInterval);
    }

    render() {
        return (
            <PerspectiveCamera
                name={this.props.name}
                fov='75'
                aspect={this.props.width/this.props.height}
                near={1}
                far={5000}
                position={this.state.cameraPosition}
            />
        );
    }
}
