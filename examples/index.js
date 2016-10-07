import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BoxGeometry, TextureLoader, MeshBasicMaterial, Vector3, Quaternion} from 'three';
import { Object3D, Mesh, AmbientLight, PointLight } from '../react-three/src/ReactTHREE';
import { VRScene, VRKeyboardCamera, VRSphere } from '../src/index';

const assetpath = filename => `assets/${filename}`;
const boxgeometry = new BoxGeometry(200,200,200);
const cupcaketexture = new TextureLoader().load(assetpath('cupCake.png'));
const cupcakematerial = new MeshBasicMaterial({map: cupcaketexture});

const creamtexture = new TextureLoader().load(assetpath('creamPink.png'));
const creammaterial = new MeshBasicMaterial({map: creamtexture});

const w = window.innerWidth;
const h = window.innerHeight;

class Cupcake extends Component {
    render() {
        const position = this.props.position || new Vector3(0, 0, 0);
        return (
            <Object3D quaternion={this.props.quaternion} position={position}>
                <Mesh
                    position={new Vector3(0, -100, 0)}
                    geometry={boxgeometry}
                    material={cupcakematerial}
                />
                <Mesh
                    position={new Vector3(0, 100, 0)}
                    geometry={boxgeometry}
                    material={creammaterial}
                />
            </Object3D>
        );
    }
}

const KEY_CODES = {
    V: 86
};

class App extends React.Component {
    state = {
        cupcakePosition: new Vector3(100, 10, 10),
        renderVR: true,
        direction: 1,
    }

    onKeyDown = event => {
        if (event.keyCode === KEY_CODES.V) {
            this.setState({renderVR : !this.state.renderVR});
        }
    }

    componentDidMount() {
        this.interval = setInterval(() => {
            let direction = this.state.direction;
            const offset = 10 * direction;
            const cupcakePosition = this.state.cupcakePosition.clone().setZ(
                this.state.cupcakePosition.z + offset
            );

            if (this.state.cupcakePosition.z > 500) {
                direction = -1;
            } else if (this.state.cupcakePosition.z < 0) {
                direction = 1;
            }

            this.setState({direction, cupcakePosition});

        }, 20);

        window.addEventListener('keydown', this.onKeyDown, false);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
        window.removeEventListener('keydown', this.onKeyDown, false);
    }

    render() {
        const cupcakeProps = {
            position: new Vector3(0,0,0),
            quaternion: new Quaternion(),
        };

        return (
            <VRScene renderVR={this.state.renderVR} width={w} height={h} camera="maincamera">
                <VRKeyboardCamera width={w} height={h} name="maincamera" />
                <AmbientLight color={0xffffff} />
                <PointLight />
                <VRSphere {...cupcakeProps} />
                <VRSphere {...cupcakeProps} position={this.state.cupcakePosition} />
            </VRScene>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('content'));
