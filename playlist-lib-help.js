
var PlMath = {


	/**
	 * Rotate a point.
	 * @param {Object} p Point to rotate.
	 * @param {Object} fixP Point to rotate around.
	 * @param {float} rad How much to rotate.
	 * @return {Object} Rotated point.
	 */
	rotatePoint: function( p, fixP, rad ) {
		var d = {
				x: p.x - fixP.x,
				y: p.y - fixP.y
			};
		p.x = fixP.x + d.x * Math.cos( rad ) - d.y * Math.sin( rad );
		p.y = fixP.y + d.x * Math.sin( rad ) + d.y * Math.cos( rad );

		return p;
	},


	/**
	 * Get the maximum and minimum values for x and y out of two given points.
	 * @param {Object} p1 Point with (x,y).
	 * @param {Object} p2 Point with (x,y).
	 * @return {Object} Maximum and minimum values for x and y.
	 */
	getMaxAndMin: function( p1, p2 ) {
		var pMax = { x: 0, y: 0 },
			pMin = { x: 0, y: 0 };

		if( p1.x > p2.x ) {
			pMax.x = p1.x;
			pMin.x = p2.x;
		}
		else {
			pMax.x = p2.x;
			pMin.x = p1.x;
		}

		if( p1.y > p2.y ) {
			pMax.y = p1.y;
			pMin.y = p2.y;
		}
		else {
			pMax.y = p2.y;
			pMin.y = p1.y;
		}

		return { pMax: pMax, pMin: pMin };
	},


	/**
	 * Test if a point is inside a box.
	 * @param {Object} p1 One of the two points defining the bounding box.
	 * @param {Object} p2 One of the two points defining the bounding box.
	 * @param {Object} t Point to test.
	 * @return {bool}
	 */
	isPointInBox: function( p1, p2, t ) {
		var m = PlMath.getMaxAndMin( p1, p2 );

		return t.x >= m.pMin.x && t.x <= m.pMax.x && t.y <= m.pMax.y && t.y >= m.pMin.y;
	},


	/**
	 * Test if a point is on a line.
	 * @param {Object} p1 Start point (x,y) of line.
	 * @param {Object} p2 End point (x,y) of line.
	 * @param {Object} t Point (x,y) to test.
	 * @param {int} error Acceptable error/distance between point and line.
	 * @return {bool}
	 */
	isPointOnLine: function( p1, p2, t, error ) {
		var line = { x: 0, y: 0, len: 0 },
			f = { x: 0, y: 0 },
			lambda,
			distance;

		line.x = p2.x - p1.x;
		line.y = p2.y - p1.y;
		line.len = Math.sqrt( line.x * line.x + line.y * line.y );

		line.x /= line.len;
		line.y /= line.len;

		lambda = ( t.x - p1.x ) * line.x + ( t.y - p1.y ) * line.y;
		f.x = p1.x + lambda * line.x;
		f.y = p1.y + lambda * line.y;

		distance = Math.sqrt( ( f.x - t.x ) * ( f.x - t.x ) + ( f.y - t.y ) * ( f.y - t.y ) );

		return distance <= error;
	}


};


var PlFormat = {


	/**
	 * Format time as "mm:ss/mm:ss".
	 * @param {float} current
	 * @param {float} duration
	 * @return {String}
	 */
	time: function( current, duration ) {
		var now = {
				mins: ~~( current / 60 ),
				secs: 0
			},
			total = {
				mins: ~~( duration / 60 ),
				secs: 0
			};

		now.secs = ~~( current - now.mins * 60 );
		total.secs = ~~( duration - total.mins * 60 );

		if( now.mins < 10 ) {
			now.mins = String( "0" + now.mins );
		}
		if( now.secs < 10 ) {
			now.secs = String( "0" + now.secs );
		}
		if( total.mins < 10 ) {
			total.mins = String( "0" + total.mins );
		}
		if( total.secs < 10 ) {
			total.secs = String( "0" + total.secs );
		}

		return now.mins + ":" + now.secs + "/" + total.mins + ":" + total.secs;
	}


};