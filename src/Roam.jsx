import React, { useEffect } from 'react'

import * as THREE from 'three';

import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import building from './building.gltf'
import { Sky } from 'three/examples/jsm/objects/Sky.js';

function Roam() {
  
    useEffect(() => {

        let camera, scene, renderer,
        light1, light2, light3, light4,
        object, stats,controls;

        const objects = [];

        let raycaster;

        let moveForward = false;
        let moveBackward = false;
        let moveLeft = false;
        let moveRight = false;
        let canJump = false;

        let prevTime = performance.now();
        const velocity = new THREE.Vector3();
        const direction = new THREE.Vector3();
        const vertex = new THREE.Vector3();
        const color = new THREE.Color();
        var model;





        let sky, sun;

        init();
        animate();

        function init() {

            camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
            camera.position.y = 10;

            scene = new THREE.Scene();
            scene.background = new THREE.Color( 0xffffff );
            // scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

            // const light = new THREE.HemisphereLight( 0xffffff, 0xffffff, 10 );
            // light.position.set( 0.5, 1, 0.75 );
            // scene.add( light );

            const sphere = new THREE.SphereGeometry( 15, 15, 15  );

            //lights

            light1 = new THREE.PointLight( 0xffffff, 5, 5000 );
            light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xfffbbb } ) ) );
            light1.position.set(50,200,50)
            scene.add( light1 );


            controls = new PointerLockControls( camera, document.body );

            const blocker = document.getElementById( 'blocker' );
            const instructions = document.getElementById( 'instructions' );

            instructions.addEventListener( 'click', function () {

                controls.lock();

            } );

            controls.addEventListener( 'lock', function () {

                instructions.style.display = 'none';
                blocker.style.display = 'none';

            } );

            controls.addEventListener( 'unlock', function () {

                blocker.style.display = 'block';
                instructions.style.display = '';

            } );

            scene.add( controls.getObject() );

            const onKeyDown = function ( event ) {

                switch ( event.code ) {

                    case 'ArrowUp':
                    case 'KeyW':
                        moveForward = true;
                        break;

                    case 'ArrowLeft':
                    case 'KeyA':
                        moveLeft = true;
                        break;

                    case 'ArrowDown':
                    case 'KeyS':
                        moveBackward = true;
                        break;

                    case 'ArrowRight':
                    case 'KeyD':
                        moveRight = true;
                        break;

                    case 'Space':
                        if ( canJump === true ) velocity.y += 350;
                        canJump = false;
                        break;

                }

            };

            const onKeyUp = function ( event ) {

                switch ( event.code ) {

                    case 'ArrowUp':
                    case 'KeyW':
                        moveForward = false;
                        break;

                    case 'ArrowLeft':
                    case 'KeyA':
                        moveLeft = false;
                        break;

                    case 'ArrowDown':
                    case 'KeyS':
                        moveBackward = false;
                        break;

                    case 'ArrowRight':
                    case 'KeyD':
                        moveRight = false;
                        break;

                }

            };

            document.addEventListener( 'keydown', onKeyDown );
            document.addEventListener( 'keyup', onKeyUp );

            raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

            let loader = new GLTFLoader();
            // loader.load(bottle,function (gltf) {
            //     scene.add(model)
            // })
            loader.load( building , function ( gltf ) {
                
                model = gltf.scene
                model.scale.set(3,3,3) 
                scene.add( model );
                renderer.render(scene,camera)
                
            }, undefined, function ( error ) {
                
                console.error( error );
                
            } );

            renderer = new THREE.WebGLRenderer( { antialias: true } );
            renderer.setPixelRatio( window.devicePixelRatio );
            renderer.setSize( window.innerWidth, window.innerHeight );
            document.body.appendChild( renderer.domElement );

            //

            sky = new Sky();
            sky.scale.setScalar( 450000 );
            scene.add( sky );
            sun = new THREE.Vector3();

            const effectController = {
                turbidity: 10,
                rayleigh: 3,
                mieCoefficient: 0.005,
                mieDirectionalG: 0.7,
                elevation: 2,
                azimuth: 180,
                exposure: renderer.toneMappingExposure
            };

            function guiChanged() {

                const uniforms = sky.material.uniforms;
                uniforms[ 'turbidity' ].value = effectController.turbidity;
                uniforms[ 'rayleigh' ].value = effectController.rayleigh;
                uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
                uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

                const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
                const theta = THREE.MathUtils.degToRad( effectController.azimuth );

                sun.setFromSphericalCoords( 1, phi, theta );

                uniforms[ 'sunPosition' ].value.copy( sun );

                renderer.toneMappingExposure = effectController.exposure;
                renderer.render( scene, camera );

            }


            guiChanged();

            window.addEventListener( 'resize', onWindowResize );

        }

        function onWindowResize() {

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize( window.innerWidth, window.innerHeight );

        }

        function animate() {

            requestAnimationFrame( animate );

            const time = performance.now();

            if ( controls.isLocked === true ) {

                raycaster.ray.origin.copy( controls.getObject().position );
                raycaster.ray.origin.y -= 10;

                const intersections = raycaster.intersectObjects( objects, false );

                const onObject = intersections.length > 0;

                const delta = ( time - prevTime ) / 1000;

                velocity.x -= velocity.x * 10.0 * delta;
                velocity.z -= velocity.z * 10.0 * delta;

                velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

                direction.z = Number( moveForward ) - Number( moveBackward );
                direction.x = Number( moveRight ) - Number( moveLeft );
                direction.normalize(); // this ensures consistent movements in all directions

                if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
                if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

                if ( onObject === true ) {

                    velocity.y = Math.max( 0, velocity.y );
                    canJump = true;

                }

                controls.moveRight( - velocity.x * delta );
                controls.moveForward( - velocity.z * delta );

                controls.getObject().position.y += ( velocity.y * delta ); // new behavior

                if ( controls.getObject().position.y < 10 ) {

                    velocity.y = 0;
                    controls.getObject().position.y = 10;

                    canJump = true;

                }

            }

            prevTime = time;

            renderer.render( scene, camera );

        }
    },[])

    return (
        <div className='container-fluid'>
            <div id="blocker">
                <div id="instructions">
                    <p style={{fontSize:"36px"}}>
                        Click to play
                    </p>
                    <p>
                        Move: WASD<br/>
                        Jump: SPACE<br/>
                        Look: MOUSE
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Roam