
/**
 * @class Playlist
 */
var Playlist = ( function() {

	var _layer = { canvas: null, ctx: null },
		_tracks,
		_currentTrack = 0,

		_metaDataLoaded = 0,
		_animateInterval,

		_mouseDown = false,
		_oldClient = { x: 0, y: 0 },
		_translate = { x: 0, y: 0 },

		_points = new Array(),

	// HTML/CSS thingies with infos/controls
		_vol = {
			container: null,
			ele: new Array()
		},
		_bubble = {
			container: null,
			title: null,
			artist: null
		},
		_display = {
			container: null,
			title: null,
			artist: null,
			time: null
		},

	// FPS measurement
		_lastTime,
		_frameTime = 0,
		_thisLoop,
		_lastLoop = new Date,
		_intervalFPS,
		_displayFPS,

	// "Constants"
		CONF = {
			PLAYER_ID: "player_",
			// [px] Radius of the circles.
			RADIUS: 10,
			ARC_END: Math.PI * 2,
			// Start point for first circle
			START: {
				X: ~~( window.innerWidth / 2 ),
				Y: ~~( window.innerHeight / 1.1 )
			},
			// [px] Width of the connections.
			CONN_WIDTH: 4,
			// [px] How far away a coordinate can be from the
			// connection and still be registered as "hit".
			ERR_MARGIN: 10,
			// [px] Minimum length of a track.
			BASE_LENGTH: 100,

			COLOR: {
				CIRCLE_FILL: "rgb( 104, 125, 142 )",
				CIRCLE_HOVER: "rgb( 250, 250, 250 )",
				UNPLAYED: "rgba( 200, 200, 200, 0.2 )",
				PLAYED: "rgba( 215, 237, 63, 0.8 )",
				CURSOR_HINT: "rgba( 20, 20, 20, 0.4 )",
				NOISE: "rgba( 160, 160, 160, 0.1 )"
			},

			BG_STARS_MAX_RADIUS: 3,

			LOOP_INTERVAL: 40,
			FPS_INTERVAL: 1000,
			FPS_FILTER: 10
		};


	/**
	 * Constructor.
	 * @param {String} canvasId
	 * @param {Array} tracks
	 */
	function Playlist( canvasId, tracks ) {
		_tracks = tracks;

		// Our playground
		_layer.canvas = document.getElementById( canvasId );
		_layer.ctx = _layer.canvas.getContext( "2d" );
		canvasResize( _layer.canvas );
		_layer.width = _layer.canvas.width;
		_layer.height = _layer.canvas.height;

		// Add audio players for tracks
		addAudio( _tracks );

		// Prepare volume controls.
		initVol();
		// Prepare tooltip DOMElement for information to the tracks
		initBubble();
		// Always displayed info area for current track
		initInfoDisplay();

		// FPS
		_displayFPS = document.getElementById( "fps" );

		// Move with mouse
		_layer.canvas.addEventListener( "mousedown", observeMouseButtons, false );
		_layer.canvas.addEventListener( "mouseup", observeMouseButtons, false );
		_layer.canvas.addEventListener( "mousemove", move, false );

		// Resize canvas if window is resized.
		window.addEventListener( "resize", function( e ) {
			canvasResize( _layer.canvas );
		}, false );
	};


	/**
	 *
	 * @param {int} x X coordinate to search at.
	 * @param {int} y Y coordinate to search at.
	 * @return {Object|bool} Index and point or false if no point found.
	 */
	var findPoint = function( x, y ) {
		for( var i = 0; i < _points.length; i++ ) {
			// No need for too much perfection, checking if the
			// cursor is inside the circle bounding box suffices.
			if( x >= _points[i].x - CONF.RADIUS
					&& x <= _points[i].x + CONF.RADIUS
					&& y >= _points[i].y - CONF.RADIUS
					&& y <= _points[i].y + CONF.RADIUS ) {
				return { index: i, point: _points[i] };
			}
		}
		return false;
	};


	/**
	 * Checks if the cursor is (roughly) on the line between two points.
	 * @param {int} x X coordinate to search at.
	 * @param {int} y Y coordinate to search at.
	 * @return {Object|bool} The track that is represented by the connection.
	 */
	var findConnection = function( x, y ) {
		var p = { x: x, y: y },
			prog = { x: 0, y: 0 };

		for( var i = 0; i < _points.length - 1; i++ ) {
			if( PlMath.isPointInBox( _points[i], _points[i + 1], p )
					&& PlMath.isPointOnLine( _points[i], _points[i + 1], p, CONF.ERR_MARGIN ) ) {
				// How far would that be a progress in the track
				prog.x = ( p.x - _points[i].x ) / ( _points[i + 1].x - _points[i].x );
				prog.y = ( p.y - _points[i].y ) / ( _points[i + 1].y - _points[i].y );

				return {
					track: _tracks[i],
					progress: ( prog.x + prog.y ) / 2
				};
			}
		}
		return false;
	};


	/**
	 * Resize the given canvas to window dimensions.
	 * @param {DOMElement} canvas
	 */
	var canvasResize = function( canvas ) {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	};



	// AUDIO


	/**
	 * Add audio elements.
	 * @param {Array} tracks List of all the tracks with title, artist and file.
	 */
	var addAudio = function( tracks ) {
		var audio;

		for( var i = 0; i < tracks.length; i++ ) {
			audio = document.createElement( "audio" );
			audio.addEventListener( "loadedmetadata", loadedMetaData, false );
			audio.addEventListener( "ended", endedPlayNext, false );
			audio.id = CONF.PLAYER_ID + i;
			audio.preload = "metadata";
			audio.src = tracks[i].file;
			audio.volume = 1.0;
			audio.setAttribute( "data-title", tracks[i].title );
			audio.setAttribute( "data-artist", tracks[i].artist );
			_tracks[i].dom = audio;
			_tracks[i].index = i;
			_tracks[i].cursorOnTrack = false;
			_tracks[i].cursorOnStart = false;

			document.body.appendChild( audio );
		}
	};


	/**
	 * Receives events of type "loadedmetadata" of audio elements.
	 * If all metadata is available, the tracks can be drawn.
	 * @param {Event} event
	 */
	var loadedMetaData = function( event ) {
		if( ++_metaDataLoaded == _tracks.length ) {
			for( var i = 0; i < _tracks.length; i++ ) {
				// DOM access is expensive, so take the needed - and
				// unchanging - values now, for easy access later.
				_tracks[i].duration = _tracks[i].dom.duration;
				// Take the random value now, so it doesn't
				// change later with every re-draw.
				_tracks[i].rand = Math.random();
			}

			// Remove "please wait" message
			document.getElementById( "loading" ).style.display = "none";

			// Start animation loop!
			draw();
			startLoop();
		}
	};


	/**
	 * Play the next one after a track has ended.
	 * @param {Event} event
	 */
	var endedPlayNext = function( event ) {
		var id = event.target.id.replace( CONF.PLAYER_ID, "" ),
			next = parseInt( id ) + 1;

		if( next < _tracks.length ) {
			toggleTrack( _tracks[next] );
		}
	};


	/**
	 * Play or pause given track, depending on its status.
	 * @param {Object} track Track to toggle.
	 * @param {boolean} keepPlaying Don't toggle between states. Just play.
	 */
	var toggleTrack = function( track, keepPlaying ) {
		if( keepPlaying || track.dom.paused ) {
			// Stop all other tracks
			for( var i = 0; i < _tracks.length; i++ ) {
				if( i != track.index ) {
					_tracks[i].dom.pause();
					_tracks[i].dom.currentTime = 0.0;
				}
			}
			// Play selected track
			track.dom.play();
			_currentTrack = track.index;
		}
		else {
			track.dom.pause();
		}
	};


	/**
	 * Jump to the position in the track given by the progress.
	 * @param {Object} track The track to seek in.
	 * @param {float} progress Value between 0.0 and 1.0.
	 */
	var trackSeek = function( track, progress ) {
		track.dom.currentTime = track.dom.duration * progress;
		toggleTrack( track, true );
	};


	/**
	 * Sets volume for all tracks.
	 * @param {float} vol New volume. Has to be a value between 0.0 and 1.0.
	 */
	var setVolume = function( vol ) {
		if( vol < 0 || vol > 1 ) {
			return;
		}

		for( var i = 0; i < _tracks.length; i++ ) {
			_tracks[i].dom.volume = vol;
		}
	};



	// GRAPHICAL INTERFACE


	/**
	 * Receiving function for mouse button events.
	 * @param {MouseEvent} event
	 */
	var observeMouseButtons = function( event ) {
		if( event.type == "mousedown" && event.which == 1 ) {
			var m = {
					x: event.clientX - _translate.x,
					y: event.clientY - _translate.y
				},
				s = findPoint( m.x, m.y ),
				c = findConnection( m.x, m.y );

			_mouseDown = true;

			if( s && s.index < _tracks.length ) {
				toggleTrack( _tracks[s.index] );
			}
			else if( c ) {
				trackSeek( c.track, c.progress );
			}
		}
		else {
			_mouseDown = false;
			_oldClient.x = 0;
		}
	};


	/**
	 * Receiving function for mouse move events.
	 * @param {MouseEvent} event
	 */
	var move = function( event ) {
		// Move canvas
		if( _mouseDown ) {
			if( _oldClient.x == 0 ) {
				_oldClient.x = event.clientX;
				_oldClient.y = event.clientY;
				return;
			}
			_translate.x -= ( _oldClient.x - event.clientX );
			_translate.y -= ( _oldClient.y - event.clientY );
			_oldClient.x = event.clientX;
			_oldClient.y = event.clientY;
		}

		// Show additional info/control elements if over track
		else {
			var m = {
					x: event.clientX - _translate.x,
					y: event.clientY - _translate.y
				},
				s = findPoint( m.x, m.y ),
				c = findConnection( m.x, m.y );

			hideBubble();
			for( var i = 0; i < _tracks.length; i++ ) {
				_tracks[i].cursorOnTrack = false;
				_tracks[i].cursorOnStart = false;
			}

			if( s && s.index < _tracks.length ) {
				displayBubble( _tracks[s.index], s.point )
			}
			else if( c ) {
				c.track.cursorOnTrack = c.progress;
			}
		}
	};


	/**
	 * Prepare volume control.
	 */
	var initVol = function() {
		var li, l, v;

		_vol.container = document.getElementById( "vol" );
		l = _vol.container.children.length;

		for( var i = 0; i < l; i++ ) {
			li = _vol.container.children[i];
			v = ( i + 1 ) / l; // Volume level between 0.1 and 1.0

			li.setAttribute( "data-vol", v );
			li.className = "on";
			li.title = "Vol: " + v;
			li.addEventListener( "click", function( e ) {
				setVolume( e.target.getAttribute( "data-vol" ) );
				updateVolView( e.target );
			}, false );

			_vol.ele[_vol.ele.length] = li;
		}
	};


	/**
	 * Update view of volume control bars.
	 * @param {Object} t Triggered volume control element.
	 */
	var updateVolView = function( t ) {
		var ve;

		for( var i = 0; i < _vol.ele.length; i++ ) {
			ve = _vol.ele[i];
			if( ve.getAttribute( "data-vol" ) <= t.getAttribute( "data-vol" ) ) {
				ve.className = "on";
			}
			else {
				ve.className = "off";
			}
		}
	};


	/**
	 * Prepare tooltip bubble, that will show information
	 * about the orb, the cursor hovers over.
	 */
	var initBubble = function() {
		_bubble.container = document.getElementById( "trackinfo" );
		_bubble.title = document.getElementById( "ti-title" );
		_bubble.artist = document.getElementById( "ti-artist" );
	};


	/**
	 * Shows the tooltip bubble.
	 * @param {Object} track Information about the track.
	 * @param {Object} point Position of the point.
	 */
	var displayBubble = function( track, point ) {
		if( track == null ) {
			return;
		}

		track.cursorOnStart = true;

		var pos = {
				x: point.x + CONF.RADIUS + 10 + _translate.x,
				y: point.y - CONF.RADIUS * 2 + _translate.y
			};

		_bubble.title.textContent = track.title;
		_bubble.artist.textContent = track.artist;

		_bubble.container.style.left = pos.x + "px";
		_bubble.container.style.top = pos.y + "px";
		_bubble.container.style.display = "inline-block";
	};


	/**
	 * Hides the tooltip bubble.
	 */
	var hideBubble = function() {
		_bubble.container.style.display = "none";
	};


	/**
	 * Prepare info display.
	 */
	var initInfoDisplay = function() {
		_display.container = document.getElementById( "display" );
		_display.title = document.getElementById( "d-title" );
		_display.artist = document.getElementById( "d-artist" );
		_display.time = document.getElementById( "d-time-ellapsed" );
	};


	/**
	 * Updates the info in the display about the
	 * current title, artist and playing progress.
	 * @param {Object} track Track that is currently played.
	 */
	var infoDisplayUpdate = function( track ) {
		if( !track ) {
			return;
		}
		// Reducing re-draws by hiding the element, then changing
		// it and then showing it again. Otherwise the browser
		// would have to re-draw it for each text change.
		_display.container.style.display = "none";

		_display.title.textContent = track.title;
		_display.artist.textContent = track.artist;
		_display.time.textContent = PlFormat.time(
			track.dom.currentTime, track.duration
		);

		_display.container.style.display = "block";
	};


	/**
	 * Display the measured FPS.
	 */
	var measureFPS = function() {
		_displayFPS.textContent = ( CONF.FPS_INTERVAL / _frameTime ).toFixed( 1 );
	};



	// DRAWING


	/**
	 * Draw tracks.
	 */
	var draw = function() {
		var s = {				// First start point center
				x: CONF.START.X,
				y: CONF.START.Y
			},
			e = { x: 0, y: 0 },	// End point center
			d = { x: 0, y: 0 },	// Distance between start and end point
			rnd;

		// Clear canvas
		_layer.canvas.width = _layer.canvas.width;

		//drawBackgroundNoise();
		_points = new Array();

		// Move canvas around
		_layer.ctx.translate( _translate.x, _translate.y );

		// Background nosie
		drawBgNoise();

		// Connections
		_layer.ctx.save();
		for( var i = 0; i < _tracks.length; i++ ) {
			_points[_points.length] = { x: s.x, y: s.y, track: _tracks[i] };
			e.x = s.x;
			e.y = s.y - ~~( _tracks[i].duration ) - CONF.BASE_LENGTH;

			rnd = 30 + _tracks[i].rand * 30;			// Rotation between 30~60deg
			rnd *= Math.PI / 180;						// [deg] -> [rad]
			rnd *= ( _tracks[i].rand < 0.5 ) ? -1 : 1;	// Maybe rotate in other direction
			e = PlMath.rotatePoint( e, s, rnd );	// Rotate

			drawConnection( s, e, i );

			// New start point is the previous end point
			s.x = e.x;
			s.y = e.y;
		}
		_layer.ctx.restore();

		// One last point to close the last track of
		_points[_points.length] = { x: e.x, y: e.y, track: null };

		// Points. Drawing them now so they are on top of the connections
		for( var j = 0; j < _points.length; j++ ) {
			drawPoint( _points[j] );
		}
	};


	/**
	 * Draw the connection/track between two points.
	 * @param {Object} s Start point center coordinates.
	 * @param {Object} e End point center coordinates.
	 * @param {int} i Iteration.
	 */
	var drawConnection = function( s, e, i ) {
		var x = _layer.ctx;

		x.beginPath();
		x.lineWidth = CONF.CONN_WIDTH;

		x.strokeStyle = ( i < _currentTrack ) ? CONF.COLOR.PLAYED : CONF.COLOR.UNPLAYED;

		x.moveTo( s.x, s.y );
		x.lineTo( e.x, e.y );
		x.stroke();
		x.closePath();

		// Draw progress of currently played track
		if( !_tracks[i].dom.paused || i == _currentTrack ) {
			var pc = _tracks[i].dom.currentTime / _tracks[i].duration,
				t = {
					x: s.x + ( e.x - s.x ) * pc,
					y: s.y + ( e.y - s.y ) * pc
				};

			x.beginPath();
			x.lineWidth = CONF.CONN_WIDTH;
			x.strokeStyle = CONF.COLOR.PLAYED;

			x.moveTo( s.x, s.y );
			x.lineTo( t.x, t.y );

			x.stroke();
			x.closePath();
		}

		// Show where the progress bar would jump to
		// if the user would click now.
		if( _tracks[i].cursorOnTrack ) {
			var pc = _tracks[i].cursorOnTrack,
				t = {
					x: s.x + ( e.x - s.x ) * pc,
					y: s.y + ( e.y - s.y ) * pc
				};

			x.beginPath();
			x.lineWidth = CONF.CONN_WDITH;
			x.strokeStyle = CONF.COLOR.CURSOR_HINT;

			x.moveTo( s.x, s.y );
			x.lineTo( t.x, t.y );

			x.stroke();
			x.closePath();
		}
	};


	/**
	 * Draw a circle.
	 * @param {Object} p Point center coordinates.
	 */
	var drawPoint = function( p ) {
		// Style
		_layer.ctx.beginPath();
		if( p.track && p.track.cursorOnStart ) {
			_layer.ctx.fillStyle = CONF.COLOR.CIRCLE_HOVER;
		}
		else {
			_layer.ctx.fillStyle = CONF.COLOR.CIRCLE_FILL;
		}

		_layer.ctx.moveTo( p.x + CONF.RADIUS, p.y );
		_layer.ctx.arc( p.x, p.y, CONF.RADIUS, 0, CONF.ARC_END, false );

		_layer.ctx.fill();
		_layer.ctx.closePath();
	};


	/**
	 * It's supposed to look like faint little stars
	 * in the background. Not sure if it does.
	 */
	var drawBgNoise = function() {
		var c = _layer.ctx,
			rnd, x, y, r,
			sx = 7,
			sy = 6,
			w = _layer.width / sx,
			h = _layer.height / sy,
			wt = w / 1.4,
			ht = w / 1.4,
			stars = sx * sy;

		c.fillStyle = CONF.COLOR.NOISE;

		for( var i = 0; i < stars; i++ ) {
			rnd1 = _tracks[i % _tracks.length].rand;
			rnd2 = _tracks[( i + 2 ) % _tracks.length].rand;
			x = ( i % sx ) * w + rnd1 * wt - _translate.x;
			y = ( i % sy ) * h + rnd2 * ht - _translate.y;
			r = ( rnd1 * rnd2 * 100 * i ) % CONF.BG_STARS_MAX_RADIUS + 1

			c.moveTo( x, y );
			c.arc( x, y, r, 0, CONF.ARC_END, false );
		}

		c.fill();
	};


	/**
	 * Animation loop.
	 */
	var loop = function() {
		infoDisplayUpdate( _tracks[_currentTrack] );
		draw();

		// Measure FPS
		var thisFrameTime = ( _thisLoop = new Date ) - _lastLoop;
		_frameTime += ( thisFrameTime - _frameTime ) / CONF.FPS_FILTER;
		_lastLoop = _thisLoop;
	};


	/**
	 * Start the animation loop.
	 */
	var startLoop = function() {
		_animateInterval = setInterval( loop, CONF.LOOP_INTERVAL );
		_intervalFPS = setInterval( measureFPS, CONF.FPS_INTERVAL );
	};


	/**
	 * Stop the animation loop.
	 */
	var stopLoop = function() {
		clearInterval( _animateInterval );
		clearInterval( _intervalFPS );
		_displayFPS.textContent = "0";
	};


	return Playlist;

} )();