import React, { Component } from 'react';
import { Scene } from '../../react-three/src/ReactTHREE';
import THREE from 'three';
import VREffect from '../utils/VREffect';

export default class VRScene extends Component {
    scene() {
        return this.refs.scene;
    }

    componentDidMount() {
        // change how scene is rendered
        this._originalRenderScene = this.scene().renderScene;
        this.scene().renderScene = this.renderVRScene;
    }

    renderVRScene() {
        if (!this._vrRenderer) {
            this._vrRenderer = VREffect([ this.scene()._THREErenderer ]);
        }

        const renderVr = this.props.renderVR;
        if (renderVr) {
            // jumping into the internals of ReactTHREE.Scene
            this._vrRenderer.render(this.scene()._THREEObject3D, this.scene()._THREEcamera);
        } else {
            this._originalRenderScene();
        }
    }

    render() {
        return (<Scene ref="scene" { ...this.props } />);
    }
}
