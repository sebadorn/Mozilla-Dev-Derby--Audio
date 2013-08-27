# Mozilla Dev Derby: Audio

My entry for the [Mozilla Dev Derby](https://developer.mozilla.org/en-US/demos/devderby) in April 2012. The topic was *audio*.  
[Here is the submission.](https://developer.mozilla.org/en-US/demos/detail/star-sign-playlist)  

---

Visualizes the tracks of a playlist as connected points. Starting at the first, it will progress to play all songs in order. Starting or pausing a song is done by clicking its corresponding point. The connection between songs works as progress bar and can be used for seeking by simply clicking on it. They also correspond to the length of their song: long song = long connection.

Visualization is done with a canvas element, playback with audio. Some other elements like info bubbles or the volume control are container elements styled with CSS.

The chosen tracks are from the album [“Life's Path” by “Mindthings”](http://www.jamendo.com/en/list/a4219/life-s-path), available at Jamendo.com under CC BY-NC 2.0.

The web font used in the demo is [Dosis](https://www.google.com/webfonts/specimen/Dosis).

Tested in Firefox 11, Opera 11.62 and Chrome 18.
