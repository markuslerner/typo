/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 * @author Markus Lerner / http://markuslerner.com
 */

if (!Date.now) {
   	Date.now = function() { return new Date().getTime(); };
}

THREE.PinchZoomControls = function ( object, domElement ) {

	var _this = this;

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;

	this.screen = { left: 0, top: 0, width: 0, height: 0 };

	this.noZoom = false;
	this.noPan = false;
	
	this.noDoubleClick = false;
	this.noDoubleTap = false;

	this.minDistance = 0;
	this.maxDistance = Infinity;

	// internals
	
	var EPS = 0.000001,

	_timeStampInputStart = 0,
	_executeDoubleClick = false,
	_inputPos = new THREE.Vector2(),
	
	_lastPosition = new THREE.Vector3(),
	_objectPositionStart = new THREE.Vector3(),
	
	_mouseDown = false,
	_mouse = new THREE.Vector2(),
	
	_touchZoomDistanceStart = 0,
	_touchZoomDistanceEnd = 0,

	_pinchZooming = false,
	_zoom = 1,
	
	_panStart = new THREE.Vector2(),
	_panEnd = new THREE.Vector2();

	// for reset
	this.position0 = this.object.position.clone();
	this.up0 = this.object.up.clone();

	// events
	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start'};
	var endEvent = { type: 'end'};


	// methods
	this.handleResize = function () {
		if ( this.domElement === document ) {
			this.screen.left = 0;
			this.screen.top = 0;
			this.screen.width = window.innerWidth;
			this.screen.height = window.innerHeight;

		} else {
			var box = this.domElement.getBoundingClientRect();
			// adjustments come from similar code in the jquery offset() function
			var d = this.domElement.ownerDocument.documentElement;
			this.screen.left = box.left + window.pageXOffset - d.clientLeft;
			this.screen.top = box.top + window.pageYOffset - d.clientTop;
			this.screen.width = box.width;
			this.screen.height = box.height;

		}

	};

	this.handleEvent = function ( event ) {
		if ( typeof this[ event.type ] == 'function' ) {
			this[ event.type ]( event );
		}

	};

	this.getMouseOnScreen = function ( pageX, pageY, vector ) {
		return vector.set(
			( pageX - _this.screen.left ) / _this.screen.width,
			( pageY - _this.screen.top ) / _this.screen.height
		);

	};

	this.update = function () {
		if(_zoom != 1.0 && !_this.noZoom) {
			var s = _this.object.position.z / _this.screen.height * 1.15; // TODO: to been cleaned up
		
			var zLast = _this.object.position.z;
			_this.object.position.z *= _zoom;
		
			if ( _this.object.position.z > _this.maxDistance ) {
				_this.object.position.z = _this.maxDistance;
			} else if ( _this.object.position.z < _this.minDistance ) {
				_this.object.position.z = _this.minDistance;
			}

			if(!_this.noPan) {
				_zoom = _this.object.position.z / zLast;
				_this.object.position.x -= (_mouse.x - 0.5) * _this.screen.width * s * (_zoom - 1);
				_this.object.position.y += (_mouse.y - 0.5) * _this.screen.height * s * (_zoom - 1);
			}
			_zoom = 1;
			
		}
		
		if(_pinchZooming && !_this.noZoom) {
			var zoom = _touchZoomDistanceStart / _touchZoomDistanceEnd;
		
			_this.object.position.z = _objectPositionStart.z * zoom;

			if ( _this.object.position.z > _this.maxDistance ) {
				_this.object.position.z = _this.maxDistance;
			} else if ( _this.object.position.z < _this.minDistance ) {
				_this.object.position.z = _this.minDistance;
			}
		}
		
		if(_mouseDown && !_this.noPan) {
			var s1 = _objectPositionStart.z / _this.screen.height * 1.15; // TODO: to been cleaned up
			
			var centerStart = new THREE.Vector2();
			centerStart.x = (_panStart.x - 0.5) * _this.screen.width * s1;
			centerStart.y = -(_panStart.y - 0.5) * _this.screen.height * s1;

			//this.cube.position.x = centerStart.x;
			//this.cube.position.y = centerStart.y;

			var s2 = _this.object.position.z / _this.screen.height * 1.15; // TODO: to been cleaned up
			
			var centerEnd = new THREE.Vector2();
			centerEnd.x = (_panEnd.x - 0.5) * _this.screen.width * s2;
			centerEnd.y = -(_panEnd.y - 0.5) * _this.screen.height * s2;

			//this.cube2.position.x = centerEnd.x;
			//this.cube2.position.y = centerEnd.y;

			_this.object.position.x = _objectPositionStart.x - (centerEnd.x - centerStart.x);
			_this.object.position.y = _objectPositionStart.y - (centerEnd.y - centerStart.y);
			
		}

		if ( _lastPosition.distanceToSquared( _this.object.position ) > EPS ) {
			_this.dispatchEvent( changeEvent );
			_lastPosition.copy( _this.object.position );
		}

	};

	this.reset = function () {
		_this.object.position.copy( _this.position0 );
		_this.object.up.copy( _this.up0 );

		_this.dispatchEvent( changeEvent );

		_lastPosition.copy( _this.object.position );

	};

	// listeners

	function mousedown( event ) {
		if ( _this.enabled === false ) return;
		
		event.preventDefault();
		// event.stopPropagation();
		
		if ( !_this.noPan ) {
			_objectPositionStart.copy( _this.object.position );
			_this.getMouseOnScreen( event.pageX, event.pageY, _panStart );
			_panEnd.copy(_panStart);
		}

		_mouseDown = true;
		
		if( !_this.noDoubleClick ) {
			_executeDoubleClick = _timeStampInputStart > 0 && Date.now() - _timeStampInputStart < 300;
			if(_executeDoubleClick) {
				var _inputPosCurrent = new THREE.Vector2();
				_this.getMouseOnScreen( event.pageX, event.pageY, _inputPosCurrent );
				var distance = _inputPosCurrent.distanceTo(_inputPos);
				if(distance > 0.01) {
					_executeDoubleClick = false;
				}
			}
		}
		
		_this.getMouseOnScreen( event.pageX, event.pageY, _inputPos );
		_timeStampInputStart = Date.now();
		
		document.addEventListener( 'mouseup', mouseup, false );
		_this.dispatchEvent( startEvent );

	}

	function mousemove( event ) {
		if ( _this.enabled === false ) return;

		// event.preventDefault();
		// event.stopPropagation();

		_this.getMouseOnScreen( event.pageX, event.pageY, _mouse );

		if ( _mouseDown && !_this.noPan ) {
			_this.getMouseOnScreen( event.pageX, event.pageY, _panEnd );
		}

	}

	function mouseup( event ) {
		if ( _this.enabled === false ) return;

		event.preventDefault();
		// event.stopPropagation();
		
		// zoom in on double click
		if( !_this.noZoom && !_this.noDoubleClick && _executeDoubleClick ) {
			_zoom -= 0.5;
		}

		_mouseDown = false;
		
		document.removeEventListener( 'mouseup', mouseup );
		_this.dispatchEvent( endEvent );

	}

	function mousewheel( event ) {
		if ( _this.enabled === false ) return;

		event.preventDefault();
		// event.stopPropagation();

		if( !_this.noZoom ) {
			var delta = 0;

			if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9
				delta = - event.wheelDelta / 400;
			} else if ( event.detail ) { // Firefox
				delta = event.detail / 30;
			}

			_zoom *= Math.pow(1 + Math.abs(delta)/2 , delta > 0 ? 1 : -1);
		
			_this.dispatchEvent( startEvent );
			_this.dispatchEvent( endEvent );
		}
	}

	function touchstart( event ) {
		// trace("touchstart() touches: " + event.touches.length );
		
		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				if( !_this.noPan ) {
					_objectPositionStart.copy( _this.object.position );
					
					_this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, _panStart );
					_panEnd.copy(_panStart);
				}
			
				if( !_this.noDoubleTap ) {
					_executeDoubleClick = _timeStampInputStart > 0 && Date.now() - _timeStampInputStart < 300;
					if(_executeDoubleClick) {
						var _inputPosCurrent = new THREE.Vector2();
						_this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, _inputPosCurrent );
						var distance = _inputPosCurrent.distanceTo(_inputPos);
						if(distance > 0.01) {
							_executeDoubleClick = false;
						}
					}
				}
		
				_this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, _inputPos );
				_timeStampInputStart = Date.now();
		
				break;

			case 2:
				if( !_this.noZoom ) {
					_objectPositionStart.copy( _this.object.position );
					
					var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
					var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
					_touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );
					_touchZoomDistanceEnd = _touchZoomDistanceStart;
					
					_this.getMouseOnScreen( (event.touches[0].pageX + event.touches[1].pageX) / 2, (event.touches[0].pageY + event.touches[1].pageY) / 2, _panStart );
					_panEnd.copy(_panStart);
					
				}
				
				break;

		}
		
		_mouseDown = event.touches.length > 0;
		_pinchZooming = event.touches.length > 1;

		_this.dispatchEvent( startEvent );

	}

	function touchmove( event ) {
		if ( _this.enabled === false ) return;

		event.preventDefault();
		// event.stopPropagation();

		if ( _mouseDown && !_this.noPan ) {
			_this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, _panEnd );
		}
		
		if( _pinchZooming && !_this.noZoom ) {
			var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
			var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
			_touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );
			
			_this.getMouseOnScreen( (event.touches[0].pageX + event.touches[1].pageX) / 2, (event.touches[0].pageY + event.touches[1].pageY) / 2, _panEnd );
		}

	}

	function touchend( event ) {
		// trace("touchend() touches: " + event.touches.length );
		
		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				// zoom in on double tap
				if( !_this.noZoom && !_this.noDoubleTap && _executeDoubleClick ) {
					_zoom -= 0.5;
				}
				
				if( !_this.noPan ) {
					_this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, _panStart );
					_panEnd.copy(_panStart);
					
					_objectPositionStart.copy( _this.object.position );
				}
				break;
				
		}
		
		_mouseDown = false; // event.touches.length > 0;
		_pinchZooming = false; // event.touches.length > 1;
		
		_this.dispatchEvent( endEvent );

	}

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

	this.domElement.addEventListener( 'mousedown', mousedown, false );

	this.domElement.addEventListener( 'mousewheel', mousewheel, false );
	this.domElement.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox

	this.domElement.addEventListener( 'touchstart', touchstart, false );
	this.domElement.addEventListener( 'touchend', touchend, false );
	this.domElement.addEventListener( 'touchmove', touchmove, false );

	document.addEventListener( 'mousemove', mousemove, false );
	
	this.handleResize();

	// force an update at start
	this.update();

};

THREE.PinchZoomControls.prototype = Object.create( THREE.EventDispatcher.prototype );
