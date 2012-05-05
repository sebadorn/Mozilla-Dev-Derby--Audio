
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


// TODO: remove these comments

/* Chrome; Opera; Firefox
 *
 * C O F autoplay
 * C O F buffered
 * C O F controls
 * C O F currentSrc
 *   O   currentStyle
 * C O F currentTime
 * C O   dataset
 * C O F defaultMuted
 * C O   defaultPlaybackRate
 * C O   dir
 * C O F duration
 * C O F ended
 * C O F load
 * C O F loop
 * C O F muted
 * C O F networkState
 * C O F paused
 * C O   playbackRate
 * C O   played
 * C O F preload
 * C O F readyState
 * C O F seekable
 * C O F seeking
 * C O F volume
 * C O F play
 * C O F pause
 * C O F canPlayType
 * C   F initialTime
 * C     startTime
 * C     controller
 * C     mediaGroup
 *
 *     F mozAutoplayEnabled
 *     F mozChannels
 *     F mozSampleRate
 *     F mozFrameBufferLength
 *     F mozLoadFrom
 *     F mozFragmentEnd
 *     F mozSetup
 *     F mozCurrentSampleOffset
 *     F mozRequestFullScreen
 * C     webkitRequestFullScreen
 * C     webkitVideoDecodedByteCount
 * C     webkitPreservesPitch
 * C     webkitHasClosedCaptions
 * C     webkitClosedCaptionsVisible
 * C     webkitAudioDecodedByteCount
 *
 * C O F HAVE_METADATA
 * C O F HAVE_CURRENT_DATA
 * C O F HAVE_FUTURE_DATA
 * C O F HAVE_ENOUGH_DATA
 * C O F HAVE_NOTHING
 * C O F NETWORK_NO_SOURCE
 * C O F NETWORK_EMPTY
 * C O F NETWORK_IDLE
 * C O F NETWORK_LOADING
 *
 *   O   onreadystatechange
 *   O F onloadstart
 *   O F onprogress
 *   O F onsuspend
 *   O F onstalled
 *   O   onloadend
 *   O F onemptied
 *   O F onplay
 *   O F onpause
 *   O F onloadedmetadata
 *   O F onloadeddata
 *   O F onwaiting
 *   O F onplaying
 *   O F onseeking
 *   O F onseeked
 *   O F ontimeupdate
 *   O F onended
 *   O F oncanplay
 *   O F oncanplaythrough
 *   O F onratechange
 *   O F ondurationchange
 *   O F onvolumechange
 *     F onreset
 *
 *     F onmozfullscreenchange
 *     F onmozfullscreenerror
 */