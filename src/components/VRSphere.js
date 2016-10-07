import React, { Component } from 'react';
import { SphereGeometry, MeshBasicMaterial, Vector3 } from 'three';
import { Object3D, Mesh } from '../../react-three/src/ReactTHREE';

export default class VRSphere extends Component {
    render() {
        const geometry = new SphereGeometry(100, 8);
        const material = new MeshBasicMaterial({color: 0xffff00});

        return (
            <Object3D quaternion={this.props.quaternion} position={this.props.position}>
                <Mesh position={new Vector3(0, 0, 0)} geometry={geometry} material={material} />
            </Object3D>
        );
    }
}
