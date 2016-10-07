/**
 * @author dmarcos / https://github.com/dmarcos
 * @author mrdoob / http://mrdoob.com
 *
 * WebVR Spec: http://mozvr.github.io/webvr-spec/webvr.html
 *
 * Firefox: http://mozvr.com/downloads/
 * Chromium: https://drive.google.com/folderview?id=0BzudLt22BqGRbW9WTHMtOWMzNjQ&usp=sharing#list
 *
 */

import { PerspectiveCamera, PerspectiveCamera, Matrix4} from 'three';

export default function VREffect(renderers, onError) {
    const _renderer = {};

    let vrHMD;
    let eyeTranslationL;
    let eyeFOVL;
    let eyeTranslationR;
    let eyeFOVR;

    function gotVRDevices(devices) {
        for (const i = 0; i < devices.length; i ++) {
            //if (devices[ i ] instanceof HMDVRDevice) {
            vrHMD = devices[ i ];

            if (vrHMD.getEyeParameters !== undefined) {

                const eyeParamsL = vrHMD.getEyeParameters('left');
                const eyeParamsR = vrHMD.getEyeParameters('right');

                eyeTranslationL = eyeParamsL.eyeTranslation;
                eyeTranslationR = eyeParamsR.eyeTranslation;
                eyeFOVL = eyeParamsL.recommendedFieldOfView;
                eyeFOVR = eyeParamsR.recommendedFieldOfView;

            } else {
                // TODO: This is an older code path and not spec compliant.
                // It should be removed at some point in the near future.
                eyeTranslationL = vrHMD.getEyeTranslation('left');
                eyeTranslationR = vrHMD.getEyeTranslation('right');
                eyeFOVL = vrHMD.getRecommendedEyeFieldOfView('left');
                eyeFOVR = vrHMD.getRecommendedEyeFieldOfView('right');
            }

            break; // We keep the first we encounter
        }

        if (vrHMD === undefined) {
            if (onError) {
                onError('HMD not available');
            }
        }

    }

    if (navigator.getVRDevices) {
        navigator.getVRDevices().then(gotVRDevices);
    } else {
        const recommendedFieldOfView = {
            upDegrees: 45.0,
            rightDegrees: 45.0,
            downDegrees: 45.0,
            leftDegrees: 45.0,
        };
        const _devices = [{
            getEyeParameters : function(eye) {
                const eyeVariants = {
                    left: {
                        recommendedFieldOfView: recommendedFieldOfView,
                        currentFieldOfView: recommendedFieldOfView,
                        minimumFieldOfView: recommendedFieldOfView,
                        maximumFieldOfView: recommendedFieldOfView,
                        eyeTranslation: {x: -0.03, y: 0, z: 0, w: 0 },
                        renderRect: {x: 0, y: 0, width: 960, height: 1080},
                    },
                    right: {
                        recommendedFieldOfView: recommendedFieldOfView,
                        currentFieldOfView: recommendedFieldOfView,
                        minimumFieldOfView: recommendedFieldOfView,
                        maximumFieldOfView: recommendedFieldOfView,
                        eyeTranslation: {x: 0.03, y: 0, z: 0, w: 0 },
                        renderRect: {x: 960, y: 0, width: 960, height: 1080},
                    }
                };

                return eyeVariants[eye];
            }
        }];

        gotVRDevices(_devices);
    }

    _renderer.scale = 1;
    _renderer.setSize = function(width, height) {
        renderers.forEach(function(renderer) {
            renderer.setSize(width, height);
        });
    };

    // fullscreen

    let isFullscreen = false;
    const canvas = renderers[0].domElement;
    const fullscreenchange = canvas.mozRequestFullScreen ?
        'mozfullscreenchange' : 'webkitfullscreenchange';

    document.addEventListener(fullscreenchange, function (event) {
        isFullscreen = document.mozFullScreenElement || document.webkitFullscreenElement;
    }, false);

    _renderer.setFullScreen = function (boolean) {
        if (vrHMD === undefined || isFullscreen === boolean) {
            return;
        }

        if (canvas.mozRequestFullScreen) {
            canvas.mozRequestFullScreen({vrDisplay: vrHMD});
        } else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen({vrDisplay: vrHMD});
        }
    };

    // render

    const cameraL = new PerspectiveCamera();
    const cameraR = new PerspectiveCamera();

    _renderer.render = (scene, camera) => {
        renderers.forEach(renderer => {
            if (vrHMD) {
                let sceneL;
                let sceneR;

                if (Array.isArray(scene)) {
                    sceneL = scene[ 0 ];
                    sceneR = scene[ 1 ];
                } else {
                    sceneL = scene;
                    sceneR = scene;
                }

                const size = renderer.getSize();
                size.width = size.width / 2;

                renderer.enableScissorTest(true);
                renderer.clear();

                if (camera.parent === null) {
                    camera.updateMatrixWorld();
                }

                cameraL.projectionMatrix = fovToProjection(eyeFOVL, true, camera.near, camera.far);
                cameraR.projectionMatrix = fovToProjection(eyeFOVR, true, camera.near, camera.far);

                camera.matrixWorld.decompose(cameraL.position, cameraL.quaternion, cameraL.scale);
                camera.matrixWorld.decompose(cameraR.position, cameraR.quaternion, cameraR.scale);

                cameraL.translateX(eyeTranslationL.x * _renderer.scale);
                cameraR.translateX(eyeTranslationR.x * _renderer.scale);

                // render left eye
                renderer.setViewport(0, 0, size.width, size.height);
                renderer.setScissor(0, 0, size.width, size.height);
                renderer.render(sceneL, cameraL);

                // render right eye
                renderer.setViewport(size.width, 0, size.width, size.height);
                renderer.setScissor(size.width, 0, size.width, size.height);
                renderer.render(sceneR, cameraR);

                renderer.enableScissorTest(false);

                return;

            }

            // Regular render mode if not HMD

            if (Array.isArray(scene)) {
                scene = scene[ 0 ];
            }

            renderer.render(scene, camera);
        });
    };

    function fovToNDCScaleOffset(fov) {
        const pxscale = 2.0 / (fov.leftTan + fov.rightTan);
        const pxoffset = (fov.leftTan - fov.rightTan) * pxscale * 0.5;
        const pyscale = 2.0 / (fov.upTan + fov.downTan);
        const pyoffset = (fov.upTan - fov.downTan) * pyscale * 0.5;
        return {
            scale: [pxscale, pyscale],
            offset: [pxoffset, pyoffset],
        };
    }

    function fovPortToProjection(fov, rightHanded, zNear, zFar) {
        rightHanded = rightHanded === undefined ? true : rightHanded;
        zNear = zNear === undefined ? 0.01 : zNear;
        zFar = zFar === undefined ? 10000.0 : zFar;

        const handednessScale = rightHanded ? - 1.0 : 1.0;

        // start with an identity matrix
        const mobj = new Matrix4();
        const m = mobj.elements;

        // and with scale/offset info for normalized device coords
        const scaleAndOffset = fovToNDCScaleOffset(fov);

        // X result, map clip edges to [-w,+w]
        m[ 0 * 4 + 0 ] = scaleAndOffset.scale[ 0 ];
        m[ 0 * 4 + 1 ] = 0.0;
        m[ 0 * 4 + 2 ] = scaleAndOffset.offset[ 0 ] * handednessScale;
        m[ 0 * 4 + 3 ] = 0.0;

        // Y result, map clip edges to [-w,+w]
        // Y offset is negated because this proj matrix transforms from world coords with Y=up,
        // but the NDC scaling has Y=down (thanks D3D?)
        m[ 1 * 4 + 0 ] = 0.0;
        m[ 1 * 4 + 1 ] = scaleAndOffset.scale[ 1 ];
        m[ 1 * 4 + 2 ] = - scaleAndOffset.offset[ 1 ] * handednessScale;
        m[ 1 * 4 + 3 ] = 0.0;

        // Z result (up to the app)
        m[ 2 * 4 + 0 ] = 0.0;
        m[ 2 * 4 + 1 ] = 0.0;
        m[ 2 * 4 + 2 ] = zFar / (zNear - zFar) * - handednessScale;
        m[ 2 * 4 + 3 ] = (zFar * zNear) / (zNear - zFar);

        // W result (= Z in)
        m[ 3 * 4 + 0 ] = 0.0;
        m[ 3 * 4 + 1 ] = 0.0;
        m[ 3 * 4 + 2 ] = handednessScale;
        m[ 3 * 4 + 3 ] = 0.0;

        mobj.transpose();

        return mobj;
    }

    function fovToProjection(fov, rightHanded, zNear, zFar) {
        const DEG2RAD = Math.PI / 180.0;
        const fovPort = {
            upTan: Math.tan(fov.upDegrees * DEG2RAD),
            downTan: Math.tan(fov.downDegrees * DEG2RAD),
            leftTan: Math.tan(fov.leftDegrees * DEG2RAD),
            rightTan: Math.tan(fov.rightDegrees * DEG2RAD)
        };

        return fovPortToProjection(fovPort, rightHanded, zNear, zFar);
    }

    return _renderer;
};
