if (!Date.now) Date.now = function() { return new Date().getTime(); };

function init() {
	var renderer, scene, pointLight, camera, controls, stats, clock, geometry;
	var composer, effectHBlur, effectVBlur, width, height;
	
	function Settings() {
		this.cameraFOV = 50.0;
		this.cameraDistance = 400.0;
		this.cameraDistanceMin = 50.0;
		this.cameraDistanceMax = 500.0;
		
		this.charactersNum = 26;
		
		this.statsenabled = true;
	}
	var settings = new Settings();

	var GUISettings = {
		spaceSize: 500,
		particleScale: 0.04,
		particlesPerCharacterNum: 1000, // 200
		useSingleGeometry: true,
		postProcessingEnabled: false,
		tiltshift: 4.0
	};
	
	Trace.init({ showLineNumbers: true });
	jQuery('#trace').css('color', '#888');
	jQuery('#trace').css('top', '45px');
	
	if(settings.statsenabled) {
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		$('body').append(stats.domElement);
	}
	
	clock = new THREE.Clock();
	
	var container = document.createElement( 'div' );
	document.body.appendChild( container );
	
	if( Detector.webgl ){
		renderer = new THREE.WebGLRenderer({
			alpha: true,
			clearAlpha: 1,
			sortObjects: false
		});
		// renderer.setClearColor( 0xBBBBBB, 1 );
		
	} else {
		renderer = new THREE.CanvasRenderer();
	}
	
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );
	
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x000000, 1, 1500 );
	
	scene.add( new THREE.AmbientLight( 0x444444 ) );

	pointLight = new THREE.PointLight(0xFFFFFF);
	pointLight.position.x = 0.0;
	pointLight.position.y = 0.0;
	pointLight.position.z = 1000.0;
	pointLight.intensity = 1.0;
	// pointLight.distance = 1000.0;
	scene.add(pointLight);
	
	camera = new THREE.PerspectiveCamera(settings.cameraFOV, window.innerWidth / window.innerHeight, 1, 3000);
	camera.position.x = 0.0;
	camera.position.y = 0.0;
	camera.position.z = settings.cameraDistance;
	scene.add(camera);

	initPostprocessing();
	initGUI();
	
	controls = new THREE.TrackballControls( camera, renderer.domElement );
	controls.rotateSpeed = 0.5; // 1.0
	controls.zoomSpeed = 1.0;
	controls.panSpeed = 0.25;

	controls.noRotate = false;
	controls.noZoom = false;
	controls.noPan = true;

	controls.staticMoving = false;
	controls.dynamicDampingFactor = 0.2;

	controls.minDistance = settings.cameraDistanceMin;
	controls.maxDistance = settings.cameraDistanceMax;
	
	controls.keys = []; // [ 65 // A, 83 // S, 68 // D ]; // [ rotateKey, zoomKey, panKey ]
	controls.enabled = true;

	var g = new THREE.BoxGeometry( 10, 10, 2 );
	var m = new THREE.MeshBasicMaterial( {  color: 0xff0000, transparent: true} );
	var cube = new THREE.Mesh( g, m );
	cube.position.z = 0;
	scene.add( cube );
	
	/*
	var geometry = new THREE.BufferGeometry(); // create a simple square shape. We duplicate the top left and bottom right
	geometry.fromGeometry(g);
	var material = new THREE.MeshBasicMaterial( { map: map, color: 0xffffff, transparent: true,  wireframe: false, shading: THREE.FlatShading, side: THREE.DoubleSide } );
	var mesh = new THREE.Mesh( geometry, material );
	// mesh.scale.multiplyScalar(10);
	scene.add(mesh);
	*/
	
	
	/*
	var map = THREE.ImageUtils.loadTexture( "sprite0.png" );
	var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff, fog: false } );
	var sprite = new THREE.Sprite( material );
	sprite.position.set( 10, 0, 100 );
	sprite.scale.multiplyScalar( 10 );
	scene.add(sprite);
	*/
	
	
	/*
	var parameters = {
		size: 5,
		height: 0,
		curveSegments: 1,

		// font: "helvetiker",
		font: "raleway",
		weight: "normal",
		style: "normal",

		bevelThickness: 3,
		bevelSize: 1.5,
		bevelEnabled: false,

		material: 0,
		extrudeMaterial: 0
	};

	// extruded text:
	// var textGeometry = new THREE.TextGeometry( "a", parameters );
	
	// flat text:
	var geometries = [];
	for(var i = 0; i < settings.charactersNum; i++) {
		var textShapes = THREE.FontUtils.generateShapes( String.fromCharCode(97 + i), parameters );
		geometries[i] = new THREE.ShapeGeometry( textShapes );
	}
	var textMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: false,  wireframe: false, shading: THREE.FlatShading, side: THREE.DoubleSide });
	*/
	
	var letters;
	var materials = [];
	var size = 256;
	var mesh;
	var singleGeometry;

	for(var i = 0; i < settings.charactersNum; i++) {
		//create image
		var text = String.fromCharCode(97 + i);
		var bitmap = document.createElement('canvas');
		var context = bitmap.getContext('2d');
		bitmap.width = bitmap.height = size;
		context.font = '200 200px Raleway';
		var charWidth = context.measureText(text).width;
		context.clearRect(0,0,bitmap.width,bitmap.height);
		// context.fillStyle = 'red';
		// context.fillRect(0, 0, bitmap.width, bitmap.height);
		context.fillStyle = 'white';
		context.fillText(text, (bitmap.width - charWidth) / 2, 175);
		var texture = new THREE.Texture(bitmap);
		texture.needsUpdate = true;
		materials[i] = new THREE.MeshBasicMaterial({ map : texture, transparent: true, blending: THREE.AdditiveBlending, shading: THREE.FlatShading, depthTest: false, side: THREE.DoubleSide });
	}

	createParticles();

	// var singleGeometryBuffered = new THREE.BufferGeometry();
	// singleGeometryBuffered.fromGeometry(singleGeometry);
	
	window.addEventListener( 'resize', onWindowResize, false );
	onWindowResize();

	function createGeometry() {
		geometry = new THREE.PlaneGeometry(size * GUISettings.particleScale, size * GUISettings.particleScale);
	}

	function createParticles() {
		var timeStart = Date.now();

		createGeometry();

		if(mesh !== undefined) {
			scene.remove(mesh);
		}
		if(letters !== undefined) {
			for(var i = 0; i < letters.length; i++) {
				scene.remove(letters[i]);
			}
		}
		singleGeometry = new THREE.Geometry();
		letters = [];
		var c = 0;
		for(var l = 0; l < settings.charactersNum; l++) {
			for(var i = 0; i < parseInt(GUISettings.particlesPerCharacterNum); i++) {
				if(GUISettings.useSingleGeometry) {
					letters[c] = {};
					letters[c].position = new THREE.Vector3();
					letters[c].position.x = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
					letters[c].position.y = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
					letters[c].position.z = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
					
					letters[c].rotation = new THREE.Euler( 0, Math.random() * Math.PI * 2.0, 0, 'XYZ' );
					letters[c].rotationSpeedY = 0.2 + Math.random() * 1.0;
					
					var m = new THREE.Matrix4();
					m.makeRotationFromEuler ( letters[c].rotation );
					m.setPosition( letters[c].position );

					singleGeometry.merge(geometry, m, l);

				} else {
					// letters[c] = new THREE.Mesh( geometries[l], textMaterial ); // shapes
					letters[c] = new THREE.Mesh(geometry, materials[ l ]); // bitmap texture
					
					letters[c].position.x = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
					letters[c].position.y = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
					letters[c].position.z = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
				
					letters[c].rotation.y = Math.random() * Math.PI * 2.0;
					letters[c].rotationSpeedX = Math.random() * 0.1;
					letters[c].rotationSpeedY = 0.2 + Math.random() * 1.0;

					scene.add( letters[c] );

				}
				
				c++;
			}

		}

		if(GUISettings.useSingleGeometry) {
			mesh = new THREE.Mesh( singleGeometry, new THREE.MeshFaceMaterial(materials) );
			scene.add(mesh);
		}

		trace( letters.length + " letters created in " + (Date.now() - timeStart)  + " ms" );
	}
	
	function onWindowResize() {
		// trace("onWindowResize()");

		var viewportWidth = window.innerWidth;
		var viewportHeight = window.innerHeight;
		
		// $('#trace').css('height', (viewportHeight - 100) + 'px');
		
		camera.aspect = viewportWidth / viewportHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( viewportWidth, viewportHeight );

		if(typeof controls !== 'undefined') {
			controls.screen.width = viewportWidth;
			controls.handleResize();
		}
		
		render();
	}
	
	function rotateY(vector, angle) {
		var cosAngle = Math.cos(angle);
		var sinAngle = Math.sin(angle);
		var xRotated = (vector.x * cosAngle) + (vector.z * sinAngle);
		var zRotated = (vector.x * -sinAngle) + (vector.z * cosAngle);
		vector.x = xRotated;
		vector.z = zRotated;
		return vector;

	}
	
	function render() {
		var delta = clock.getDelta();
		delta = Math.min(delta, 0.1);

		for(var i = 0; i < letters.length; i++) {
			// letters[i].visible = false;
			
			letters[i].position.x += 1 * delta;
			letters[i].position.y -= 10 * delta;

			letters[i].rotation.y += letters[i].rotationSpeedY * delta;
			
			if(GUISettings.useSingleGeometry) {
				for(var j = 0; j < 4; j++) {
					var vertex = singleGeometry.vertices[i * 4 + j];
					//vertex.x += 1 * delta;
					//vertex.y -= 10 * delta;
					vertex.copy(geometry.vertices[j]);
					//vertex.applyAxisAngle( new THREE.Vector3(0,1,0), letters[i].rotation.y );
					rotateY(vertex, letters[i].rotation.y);
					vertex.add( letters[i].position );
					// vertex.applyEuler( letters[i].rotation );

				}
			}
			
			if(letters[i].position.y < -GUISettings.spaceSize/2) {
				// letters[i].position.x = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;
				// letters[i].position.y = GUISettings.spaceSize/2 + Math.random() * GUISettings.spaceSize/4 - Math.random() * GUISettings.spaceSize/8;
				// letters[i].position.z = Math.random() * GUISettings.spaceSize - GUISettings.spaceSize/2;

				letters[i].position.y += GUISettings.spaceSize;
			}
			
			//if(singleGeometry.vertices[i * 4].y < -GUISettings.spaceSize/2) {
			//	for(var v = i * 4; v < (i * 4) + 4; v++) {
			//		singleGeometry.vertices[v].y += GUISettings.spaceSize;
			//	}
			//}
			
		}
		singleGeometry.verticesNeedUpdate = true;
		
		pointLight.position = camera.position;
		
		if ( GUISettings.postProcessingEnabled ) {
			camera.lookAt( scene.position );
			composer.render( 0.1 );

		} else {
			renderer.render( scene, camera );

		}
	
		if(typeof controls !== 'undefined') {
			controls.update();
		}
		
	}
	
	function animate() {
		requestAnimationFrame(animate);

		if(typeof stats !== 'undefined') stats.update();
		
		render();
	}
	animate();

	function initPostprocessing() {
	
		composer = new THREE.EffectComposer( renderer );
		composer.addPass( new THREE.RenderPass( scene, camera ) );

		width = window.innerWidth || 2;
		height = window.innerHeight || 2;
		
		/*
		effectHBlur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
		effectVBlur = new THREE.ShaderPass( THREE.VerticalBlurShader );
		effectHBlur.uniforms[ 'h' ].value = 2 / width;
		effectVBlur.uniforms[ 'v' ].value = 2 / height;
		composer.addPass( effectVBlur );
		*/
		
		effectHBlur = new THREE.ShaderPass( THREE.HorizontalTiltShiftShader );
		effectHBlur.uniforms[ 'r' ].value = 0.5;
		
		effectVBlur = new THREE.ShaderPass( THREE.VerticalTiltShiftShader );
		effectVBlur.uniforms[ 'r' ].value = 0.5;
		
		composer.addPass( effectHBlur );
		composer.addPass( effectVBlur );
		effectVBlur.renderToScreen = true;
	
	}

	function updateShaders() {
		effectHBlur.uniforms[ 'h' ].value = GUISettings.tiltshift / width;
		effectVBlur.uniforms[ 'v' ].value = GUISettings.tiltshift / height;
	}

	function initGUI() {

		var gui = new dat.GUI({ width: 400 });

		gui.add(GUISettings, 'spaceSize', 10, 1000).onChange( createParticles );
		gui.add(GUISettings, 'particleScale', 0.0, 1.0).onChange( createParticles );
		gui.add(GUISettings, 'particlesPerCharacterNum', 1, 5000).onChange( createParticles );
		gui.add(GUISettings, 'useSingleGeometry').onChange( createParticles );
		gui.add(GUISettings, 'postProcessingEnabled');
		gui.add(GUISettings, 'tiltshift', 0.0, 10.0).onChange( updateShaders );

		updateShaders();

	}
	
}

$(window).load(function() {

	init();

});

