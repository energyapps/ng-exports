////////// Do not remove below! //////////
// initates pym!
var pymChild = new pym.Child();
////////// Do not remove above! //////////

// Initial Script (remove below and replace)

// ***** DEFINE GLOBAL VARIABLES ***** //
// variables for size of map group: full world map is 2:1 ratio
var masterW = parseInt( d3.select( "#master_container" ).style( "width" ) ),
	masterH = masterW / 2;

// variables for min/max and total years
var minYr = 2015,
	maxYr = 2018;

// variables for range of years
var years,
	yearsArray = []; // object with multidimensional arrays listing countries/yr

// variables for loop functions
var l = 1, // first item in sequence
	play, // animation + speed
	num = ( maxYr - minYr ) + 1, // number of iterations, i.e. years (to be populated with the range function)
	m = 1, // play/pause variable
	thisYr = minYr; // current year variable for animation

// variables for changing text
var totalDiv = document.getElementById( "totalDiv" );

// variables for catching min and max zoom factors
var minZoom,
	maxZoom,
	geoData, // variable for catching geoData
	countriesAll, // variable for catching all mapped countries (world)
	highlights; // variable for catching export countries by code

// variable for color scale
var colors = d3.scaleOrdinal()
	.domain( [ "country", "country-on", "labels" ] )
	.range( [ "#FFFFFF", "#8BCC00", "#12769e" ] );

// DOE Green #8BCC00 / rgb(139,204,0)
// DOE Light Blue 226 #19A9E2 / rgb(25,169,226)
// DOE Pink #E7227E
// Map Water Blue #e6ebed
// Tomato #FF6347
// Neon Blue #00eeee

// ***** DEFINE GLOBAL FUNCTIONS ***** //
// function to fill in range of years (from min to max, inclusive)
function range( start, end ) {
	years = Array( end - start + 1 ).fill().map( ( _, idx ) => start + idx );

	years.forEach( function( val ) {
		yearsArray[ val ] = [];
	} );
}
// run range function
range( minYr, maxYr );

// ***** FUNCTIONS TO ANIMATE BUTTONS/MAP DATA ***** //
// function to play on initial load
function start() {
	// console.log( "START: l = ", l, "num = ", num );

	if ( play != "undefined" ) {
		clearInterval( play );
	};

	if ( l === num ) {
		l -= ( num );
	};

	play = setInterval( mechanic, 1000 );
	// console.log( "thisYr on start:", thisYr );

	changeColor( thisYr );
}

function clickYear( e ) {
	// swith play/pause button to play
	if ( m === 1 ) {
		$( '.rpt2 span img' ).attr( 'src', 'img/mediaButtons_play.png' );
		m -= 1;
	};
	// clear loop variable and reset
	clearInterval( play );

	// remove active class from other year button
	$( '.year' ).removeClass( 'activea' );
	// add active class to this year button
	$( this ).addClass( 'activea' );

	// set l to match the button id
	l = Number( $( this ).attr( "idnum" ) );

	// set thisYr to the button datayear
	thisYr = Number( $( this ).attr( "datayear" ) );
	// console.log( "thisYr on enter:", thisYr );

	// RUN THE FUNCTION TO SWITCH COUNTRIES HIGHLIGHTED HERE
	changeColor( thisYr );
}

function pause() {
	if ( m === 0 && l != num ) {
		$( '.rpt2 span img' ).attr( 'src', 'img/mediaButtons_pause.png' );
		m += 1;
		play = setInterval( mechanic, 1000 );

	} else if ( m === 1 && l != num ) {
		$( '.rpt2 span img' ).attr( 'src', 'img/mediaButtons_play.png' );
		m -= 1;
		clearInterval( play );

		// console.log( 'you cleared the interval in "pause"' );
	} else {
		$( '.rpt2 span img' ).attr( 'src', 'img/mediaButtons_pause.png' );
		l = 0;
		play = setInterval( mechanic, 1000 );

		// console.log( 'end of loop' );
	}
}

// Function to play each cycle
function mechanic() {
	l += 1;

	rebuildLoop( l );

	if ( l === num ) {
		$( '.rpt2 span img' ).attr( 'src', 'img/mediaButtons_redo.png' );
		clearInterval( play );
	}
}

// Function to rebuild the loop at the end of each cycle
function rebuildLoop( l ) {
	// Add next and next and next color to li tags
	if ( l === 1 ) {
		$( '.year' ).removeClass( 'activea' );
		$( '.year:first-child' ).addClass( 'activea' );
		// console.log( "-------thisYr on reset:", thisYr );
	} else {
		$( '.activea' ).next().addClass( 'activea2' );
		$( '.year' ).removeClass( 'activea' );
		$( '.activea2' ).addClass( 'activea' );
		$( '.activea' ).removeClass( 'activea2' );
		// console.log( "thisYr on switch:", thisYr );
	};
	// console.log( 'rebuildloop is at: ' + l );

	// set thisYr to the active button datayear
	thisYr = Number( $( ".activea" ).attr( "datayear" ) );
	// pass year variable to highlight countries
	changeColor( thisYr );
}

function changeColor( thisYr ) {
	// reset fill color to default for all countries first
	highlights.style( "fill", function() {
		// use color scale variable
		return colors( "country" );
	} );

	// select subarray based on current year variable
	var yrCountries = yearsArray[ thisYr ];

	// loop through that year's array and pass country code
	yrCountries.forEach( function( code ) {
		// select country path by id using code
		var colorChange = d3.select( "#" + code );

		// change fill color for selected path
		colorChange.style( "fill", function() {
			// use color scale variable
			return colors( "country-on" );
		} );
	} );
}

function showLabelRollover( elem ) {
	// add a mouseover action to show name label for country
	elem.on( "mouseover", function( d ) {
			d3.select( "#label-" + d.id )
				.style( "display", "block" );
		} )
		.on( "mouseout", function( d ) {
			d3.select( "#label-" + d.id )
				.style( "display", "none" );
		} );
}

// ***** OTHER FUNCTIONS ***** //
// Find and populate element bounds
function getBounds( selection ) {
	selection.each( function( d ) {
		// d.bbox = this.getBBox();
		d.bbox = this.getBoundingClientRect();
	} );
}

// Find and populate element center
function getCenter( selection ) {
	selection.each( function( d ) {
		d.centroid = [ path.centroid( d )[ 0 ] - 25, path.centroid( d )[ 1 ] - 5 ];
	} );
}

// **** Add actions to buttons for each year ***** //
// action for year buttons
$( '.year' ).click( clickYear );

// action for play/pause button
$( '.rpt2' ).click( pause );

// ***** DEFINE MAP + PROJECTION ***** //
var projection = d3
	.geoMercator()
	.center( [ 0, 20 ] ) // set centre to further North as we are cropping more off bottom of map to account for Antarctica
	.scale( [ masterW / ( 2 * Math.PI ) ] ) // scale to fit group width
	.translate( [ masterW / 2, masterH / 2 ] ) // ensure centered in group
;

// Define map path
var path = d3
	.geoPath()
	.projection( projection );

// ***** ZOOM FUNCTIONS ***** //
// Function to apply zoom to countriesAll
function zoomed() {
	t = d3
		.event
		.transform;
	countriesAll
		.attr( "transform", "translate(" + [ t.x, t.y ] + ")scale(" + t.k + ")" );
}

// Define map zoom behavior
var zoom = d3
	.zoom()
	.on( "zoom", zoomed );

// Function to calculate zoom/pan limits and sets zoom to default value
function initiateZoom() {
	// Define a "minzoom" whereby the "world" is as small possible without leaving white space at top/bottom or sides
	minZoom = Math.max( $( "#map_container" ).width() / masterW, $( "#map_container" ).height() / masterH );
	// set max zoom to a suitable factor of this value
	maxZoom = 3 * minZoom;
	// set extent of zoom to chosen values
	// set translate extent so that panning can't cause map to move out of viewport
	zoom
		.scaleExtent( [ minZoom, maxZoom ] )
		.translateExtent( [ [ 0, 0 ], [ masterW, masterH ] ] );
	// define X and Y offset for centre of map to be shown in centre of holder
	midX = ( $( "#map_container" ).width() - minZoom * masterW ) / 2;
	midY = ( $( "#map_container" ).height() - minZoom * masterH ) / 2;
	// change zoom transform to min zoom and centre offsets
	svg.call( zoom.transform, d3.zoomIdentity.translate( midX, midY ).scale( minZoom ) );
}

// zoom to show a bounding box, with optional additional padding as percentage of box size
function boxZoom( box, centroid, paddingPerc ) {
	minXY = box[ 0 ];
	maxXY = box[ 1 ];
	// find size of map area defined
	zoomWidth = Math.abs( minXY[ 0 ] - maxXY[ 0 ] );
	zoomHeight = Math.abs( minXY[ 1 ] - maxXY[ 1 ] );
	// find midpoint of map area defined
	zoomMidX = centroid[ 0 ];
	zoomMidY = centroid[ 1 ];
	// increase map area to include padding
	zoomWidth = zoomWidth * ( 1 + paddingPerc / 100 );
	zoomHeight = zoomHeight * ( 1 + paddingPerc / 100 );
	// find scale required for area to fill svg
	maxXscale = $( "svg" ).width() / zoomWidth;
	maxYscale = $( "svg" ).height() / zoomHeight;
	zoomScale = Math.min( maxXscale, maxYscale );
	// handle some edge cases
	// limit to max zoom (handles tiny world)
	zoomScale = Math.min( zoomScale, maxZoom );
	// limit to min zoom (handles large world and world that span the date line)
	zoomScale = Math.max( zoomScale, minZoom );
	// Find screen pixel equivalent once scaled
	offsetX = zoomScale * zoomMidX;
	offsetY = zoomScale * zoomMidY;
	// Find offset to centre, making sure no gap at left or top of holder
	dleft = Math.min( 0, $( "svg" ).width() / 2 - offsetX );
	dtop = Math.min( 0, $( "svg" ).height() / 2 - offsetY );
	// Make sure no gap at bottom or right of holder
	dleft = Math.max( $( "svg" ).width() - masterW * zoomScale, dleft );
	dtop = Math.max( $( "svg" ).height() - masterH * zoomScale, dtop );
	// set zoom
	svg
		.transition()
		.duration( 500 )
		.call(
			zoom.transform,
			d3.zoomIdentity.translate( dleft, dtop ).scale( zoomScale )
		);
}

// on window resize
$( window ).resize( function() {
	//console.log("resized");
	// Resize SVG
	svg
		.attr( "width", $( "#map_container" ).width() )
		.attr( "height", $( "#map_container" ).height() );
	initiateZoom();
} );

// ***** DRAW SVG ***** //
// create an SVG
var svg = d3
	.select( "#map_container" )
	.append( "svg" )
	.attr( "id", "map" )
	// set to the same size as the "map-holder" div
	.attr( "width", $( "#map_container" ).width() )
	.attr( "height", $( "#map_container" ).height() )
	// add zoom functionality
	.call( zoom );

// get map data
var topoUrl = "data/world-topo.json"; // full world map
var countriesUrl = "data/export-countries.json"; // list of export countries

d3.queue()
	.defer( d3.json, topoUrl )
	.defer( d3.json, countriesUrl )
	.await( drawMap );

function drawMap( error, topology, expCountries ) {
	if ( error ) throw error;

	// populate geoData variable created on load
	geoData = topojson.feature( topology, topology.objects.world ).features;
	// console.log( "geoData", geoData );

	//Bind data and create one path per geoData feature
	countriesAll = svg.append( "g" ).attr( "id", "countries" );

	// add a background rectangle
	countriesAll
		.append( "rect" )
		.attr( "x", 0 )
		.attr( "y", 0 )
		.attr( "width", masterW )
		.attr( "height", masterH );

	// draw a path for each feature/country
	countriesAll.selectAll( "path" )
		.data( geoData )
		.enter()
		.append( "path" )
		.attr( "d", path )
		.attr( "id", function( d ) {
			return d.id;
		} )
		.attr( "class", "country" )
		.style( "fill", function( d ) {
			return colors( "country" );
		} )
		// call function to get center
		.call( getCenter );

	// select all countries by class
	highlights = countriesAll.selectAll( ".country" )
		// call function to get bounds
		.call( getBounds );

	// call function to show labels on rollover of highlighted countries
	highlights.call( showLabelRollover );

	// add container for all labels
	var countryLabels = svg.append( "g" ).attr( "id", "labels" );

	// Add a label group to each feature/country. This will contain the country name and a background rectangle
	countryLabels.selectAll( "g" )
		.data( geoData )
		.enter()
		.append( "g" )
		.attr( "class", "countryLabel" )
		.attr( "id", function( d ) {
			return "label-" + d.id;
		} )
		.attr( "transform", function( d ) {
			// console.log( d.centroid );
			// adjust vertical center for outlier countries
			if ( d.centroid[ 1 ] - d.bbox.height < -100 ) {
				// console.log( key, "<-100", countryCenter[ 1 ] - d.bbox.height );
				d.centroid[ 1 ] = d.centroid[ 1 ] + 80;
			} else if ( d.centroid[ 1 ] - d.bbox.height < 70 ) {
				// console.log( key, "<70", countryCenter[ 1 ] - d.bbox.height );
				d.centroid[ 1 ] = d.centroid[ 1 ] + 10;
			};
			return ( "translate(" + d.centroid + ")" )
		} );

	var names = countryLabels.selectAll( ".countryLabel" )
		// call function to show labels on rollover
		.call( showLabelRollover );

	// add a background rectangle the same size as the text
	var nameBg = names.append( "rect" )
		.attr( "class", "labelBg" )
		.style( "fill", function( d ) {
			return colors( "labels" );
		} );

	// loop through keys in export list
	for ( var key in expCountries ) {
		var rawYears = expCountries[ key ][ "lngYear" ],
			parseYears = [ key, rawYears.match( /(\d[\d\.]*)/g ) ];

		parseYears[ 1 ] = parseYears[ 1 ].map( n => parseInt( n ) );

		// loop through array to filter years
		for ( i = 0; i < parseYears[ 1 ].length; i++ ) {
			// loop through year range (from min to max)
			for ( y = minYr; y <= maxYr; y++ ) {
				// compare year to parsed years
				if ( y == parseYears[ 1 ][ i ] ) {
					// if numbers match, push country id to corresponding year array
					yearsArray[ y ].push( parseYears[ 0 ] );
				}
			}
		}

		// loop through country labels and text for name
		names.each( function( d ) {
			if ( this.id == "label-" + key ) {
				var thisName = expCountries[ key ][ "countryName" ];

				// add the text to the label group showing country name
				var name = d3.select( this )
					.append( "text" )
					.attr( "id", function( d ) {
						return thisName;
					} )
					.attr( "class", "countryName" )
					.style( "text-anchor", "middle" )
					.text( function( d ) {
						return thisName;
					} )
					.call( getBounds );

				// move background rect to match center
				var box = d3.select( this )
					.select( ".labelBg" )
					.attr( "width", function( d ) {
						return d.bbox.width + 10;
					} )
					.attr( "height", function( d ) {
						return d.bbox.height + 6;
					} )
					.attr( "x", -5 )
					.attr( "y", -6 );

				name.attr( "x", function( d ) {
						return d.bbox.width / 2;
					} )
					.attr( "y", function( d ) {
						return d.bbox.height / 2;
					} );
			}
		} );
	}

	// initial run
	start();

	/*d3.select( window ).on( 'resize', resize );
	$( '.rpt2' ).click( function( e ) {
		pause();
	} );*/

	// Do something on keystroke of escape....escape == 27.
	$( document ).keyup( function( e ) {
		if ( e.keyCode == 27 ) {
			d3.selectAll( ".tool" ).remove();
		}
	} );
}