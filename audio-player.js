
/**
 * @class AudioPlayer
 */
var AudioPlayer = ( function() {

	// private
	var _self,
		_player,				// HTML5 audio
		_ctrls = new Object();	// Control elements for player


	/**
	 * Constructor
	 * @param {String} playerId
	 */
	function AudioPlayer( playerId ) {
		this.landscape;

		_player = document.getElementById( playerId );
		_self = this;

		initControls();
		registerEventsToLog();

		_player.addEventListener( "timeupdate", this.updateProgress );
		_player.addEventListener( "ended", this.updateProgress );
	}


	/**
	 *
	 */
	initControls = function() {
		var controlSets = document.querySelectorAll( ".ctrls" );

		for( var i = 0; i < controlSets.length; i++ ) {
			if( controlSets[i].dataset.player == _player.id ) {
				_ctrls.wrapper = controlSets[i];
				break;
			}
		}

		if( _ctrls.wrapper ) {
			var wrapper_style = window.getComputedStyle( _ctrls.wrapper, null );
			_ctrls.wrapper.width = parseInt( wrapper_style.getPropertyValue( "width" ) );

			_ctrls.play = _ctrls.wrapper.querySelector( ".play" );
			_ctrls.play.addEventListener( "click", _self.play );
		}
	};


	/**
	 * Adds listeners for a lot of events that shall be logged.
	 */
	registerEventsToLog = function() {
		var registerEvents = [
			"play", "pause", "ended", "emptied",
			"loadstart", "progress", "stalled", "suspend",
			"loadedmetadata", "loadeddata", "waiting", "playing",
			"seeking", "seeked", "canplay", "canplaythrough",
			"ratechange", "durationchange", "volumechange"
		];

		for( var i = 0; i < registerEvents.length; i++ ) {
			_player.addEventListener(
				registerEvents[i],
				function( e ) { console.log( e.type ); }
			);
		}
	};


	/**
	 *
	 * @param {Event} event
	 */
	AudioPlayer.prototype.updateProgress = function( event ) {
		var ct = event.target.currentTime, // seconds, float value
			d = event.target.duration;

		if( event.type == "ended" ) {
			d = Math.ceil( d );
			ct = d;
			_self.landscape.updateTimer( ct, d );
		}
		else {
			_self.landscape.updateTimer( ct, d );
		}
	};


	/**
	 *
	 * @param {Object} landscape Visualization of the audio progress.
	 */
	AudioPlayer.prototype.setProgressPanel = function( landscape ) {
		this.landscape = landscape;
	};


	/**
	 * Play audio if not playing.
	 * If already playing, pause it.
	 */
	AudioPlayer.prototype.play = function() {
		if( _player.paused ) {
			_player.play();
			_self.landscape.startLoop();
			_ctrls.play.textContent = "pause";
		}
		else {
			_self.pause();
		}
	};


	/**
	 * Pause.
	 */
	AudioPlayer.prototype.pause = function() {
		_player.pause();
		_self.landscape.stopLoop();
		_ctrls.play.textContent = "play";
	};


	/**
	 * Change volume.
	 */
	AudioPlayer.prototype.volume = function( level ) {
		_player.volume = level;
	};


	return AudioPlayer;


} )();

