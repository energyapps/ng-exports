////////// Do not remove below! //////////
// initates pym!
var pymChild = new pym.Child();
////////// Do not remove above! //////////

// Initial Script (remove below and replace)

// DEFINE VARIABLES
// Define size of map group: full world map is 2:1 ratio
var masterW = parseInt( d3.select( "#master_container" ).style( "width" ) ),
	masterH = masterW / 2;

// variables for min/max years
var minYr = 2016,
	maxYr = 2019;

// variable for range of years as an object with multidimensional arrays
var yearsArray = [];

// function to fill in range of years (from min to max, inclusive)
function range( start, end ) {
	var years = Array( end - start + 1 ).fill().map( ( _, idx ) => start + idx );
	years.forEach( function( val, index, arr ) {
		yearsArray[ val ] = [];
	} );
}
// run range function
range( minYr, maxYr );

// variables for catching min and max zoom factors
var minZoom,
	maxZoom,
	geoData, // variable for catching geoData
	countriesAll, // variable for catching all mapped countries (world)
	highlights; // variable for catching export countries by code

// color scale
var colors = d3.scaleOrdinal()
	.domain( [ "country", "country-on", "labels" ] )
	.range( [ "#FFFFFF", "#8BCC00", "#12769e" ] );

// DOE Green #8BCC00 / rgb(139,204,0)
// DOE Light Blue 226 #19A9E2 / rgb(25,169,226)
// DOE Pink #E7227E
// Map Water Blue #e6ebed
// Tomato #FF6347
// Neon Blue #00eeee

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

// ***** ANIMATION FUNCTIONS ***** //
// begin looping stuff
var num = 4; // number of iterations, i.e. number of years
var i = 1; // which year you are on when you start
var play;

var m = 1;

function start() {
	if ( play != "undefined" ) {
		clearInterval( play );
	};

	if ( i === num ) {
		i -= ( num );
	};
	play = setInterval( mechanic, 1000 );
}

function pause() {
	if ( m === 0 && i != num ) {
		$( '.rpt2 span img' ).attr( 'src', 'img/mediaButtons_pause.png' );
		m += 1;
		play = setInterval( mechanic, 1000 );
		// clearInterval(play);
	} else if ( m === 1 && i != num ) {
		$( '.rpt2 span img' ).attr( 'src', 'img/mediaButtons_play.png' );
		m -= 1;
		clearInterval( play );
		// console.log( 'you cleared the interval in "pause"' )
	} else {
		// console.log( 'end of loop and restarting' )
		$( '.rpt2 span img' ).attr( 'src', 'img/mediaButtons_pause.png' ); //restart at the beginning??
		i = 0;
		play = setInterval( mechanic, 1000 );
		// here i want to reset the variables to i=0 m=0
	}
	// console.log( 'you hit pause at: ' + i )
}

// what to do each iteration
function mechanic() {
	i += 1;
	rebuildLoop( i );
	if ( i === num ) {
		$( '.rpt2 span img' ).attr( 'src', 'img/mediaButtons_redo.png' );
		clearInterval( play );
		// console.log( 'you cleared the interval by reaching the end of mechanic' )
	}
}

function rebuildLoop( i ) {
	// convaluted way to add next and next and next color to list.
	if ( i === 1 ) {
		$( '.year' ).removeClass( 'activea' );
		$( '.year:first-child' ).addClass( 'activea' )
	} else {
		$( '.activea' ).next().addClass( 'activea2' )
		$( '.year' ).removeClass( 'activea' );
		$( '.activea2' ).addClass( 'activea' );
		$( '.activea' ).removeClass( 'activea2' );
	};

	// console.log( 'rebuildloop is at: ' + i )
}

// initial run
// resize();
// start();

// d3.select( window ).on( 'resize', resize );
// $( '.rpt2' ).click( function( e ) {
// 	pause();
// } );

// Do something on keystroke of escape....escape == 27.
// $( document ).keyup( function( e ) {
// 	if ( e.keyCode == 27 ) {
// 		d3.selectAll( ".tool" ).remove();
// 	}
// } );

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

function showLabelRollover( elem ) {
	// add a mouseover action to show name label for country
	elem.on( "mouseover", function( d, i ) {
			d3.select( "#label-" + d.id )
				.style( "display", "block" );
		} )
		.on( "mouseout", function( d, i ) {
			d3.select( "#label-" + d.id )
				.style( "display", "none" );
		} );
}

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

		// loop through all country paths
		highlights.each( function() {
			// select each path element
			var colorChange = d3.select( this );
			// compare path element id to export country keys
			if ( this.id == key ) {
				// console.log( this.id + " SAME AS " + key );

				// if match, change color
				colorChange.style( "fill", function() {
					// use color scale variable
					return colors( "country-on" );
				} );
			};
		} );

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

				// move background rect to match
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
				// need to move box to align with text
				//.attr("transform", function() {
				// return "translate(" + tip_text + ")";
				// })
			}
		} );
	}

	console.log( yearsArray );
}

// highlight lng export countries
// d3.json( countriesUrl,
// 	function( error, expCountries ) {
// 		if ( error ) throw error;

// 		// console.log( expCountries );

// 		var highlights = svg.select( "#countries" )
// 			.selectAll( ".country" );
// 			// .data ( expCountries )

// 		highlights.each( function() {
// 				d3.select( this );
// 				console.log( this.id );
// 				// for ( var key in d ) {
// 				// 	console.log ( key );

// 				// 	if ( this.id == key ) {
// 				// 		console.log( this.id + " SAME AS " + key )
// 				// 	};
// 				// }
// 			});

// 		// // highlights.selectAll( "path" ).selectAll( ".country" );
//   //   		// .each( function() { this.__data__ = { id: this.id }; } );
//   //   		// .data( expCountries/*, function( d, i ) {
//   //   			for ( var key in d ) {
//   //   				return d[key];
//   //   			};
//   //   			// console.log( d[key] );
//   //   		// } */);
//   //   		// .text( function(d) { return d.text; } );

// 		// for ( var key in expCountries ) {
// 		// 	// console.log( "#" + key );
// 		// }

// 		// console.log( highlights );

// 		// console.log( "LABELS", d3.keys(expCountries) );
// 			// .attr("transform", function(d) {
// 			// 	return (
// 			// 		"translate(" + path.centroid(d)[0] + "," + path.centroid(d)[1] + ")"
// 			// 	);
// 			// })

// 			// add mouseover functionality to the label
// 			.on("mouseover", function(d, i) {
// 				d3.select(this).style("display", "block");
// 			})
// 			.on("mouseout", function(d, i) {
// 				d3.select(this).style("display", "none");
// 			})
// 			// add an onlcick action to zoom into clicked country
// 			.on("click", function(d, i) {
// 				d3.selectAll(".country").classed("country-on", false);
// 				d3.select("#country" + d.world.geometries.id).classed("country-on", true);
// 				boxZoom(path.bounds(d), path.centroid(d), 20);
// 			});
// 		// add the text to the label group showing country name
// 		// countryLabels
// 		// 	.append("text")
// 		// 	.attr("class", "countryName")
// 		// 	.style("text-anchor", "middle")
// 		// 	.attr("dx", 0)
// 		// 	.attr("dy", 0)
// 		// 	.text(function(d) {
// 		// 		return d.countryName;
// 		// 	})
// 		// 	.call(getBounds);
// 		/*// add a background rectangle the same size as the text
// 		countryLabels
// 			.insert("rect", "text")
// 			.attr("class", "countryLabelBg")
// 			.attr("transform", function(d) {
// 				return "translate(" + (d.bbox.x - 2) + "," + d.bbox.y + ")";
// 			})
// 			.attr("width", function(d) {
// 				return d.bbox.width + 4;
// 			})
// 			.attr("height", function(d) {
// 				return d.bbox.height;
// 			});*/

// 		/*//Bind data and create one path per geoData feature
// 		countriesAll = svg.append("g").attr("id", "map");
// 		// add a background rectangle
// 		countriesAll
// 			.append("rect")
// 			.attr("x", 0)
// 			.attr("y", 0)
// 			.attr("width", masterW)
// 			.attr("height", masterH);

// 		// draw a path for each feature/country
// 		world = countriesAll
// 			.selectAll("path")
// 			.data(geoData)
// 			.enter()
// 			.append("path")
// 			.attr("d", path)
// 			.attr("id", function(d, i) {
// 				return "country" + d.id;
// 				console.log(d.id);
// 			})
// 			.attr("class", "country")
// 			//      .attr("stroke-width", 10)
// 			//      .attr("stroke", "#ff0000")
// 			// add a mouseover action to show name label for feature/country
// 			.on("mouseover", function(d, i) {
// 				d3.select("#countryLabel" + d.id).style("display", "block");
// 			})
// 			.on("mouseout", function(d, i) {
// 				d3.select("#countryLabel" + d.id).style("display", "none");
// 			})
// 			// add an onclick action to zoom into clicked country
// 			.on("click", function(d, i) {
// 				d3.selectAll(".country").classed("country-on", false);
// 				d3.select(this).classed("country-on", true);
// 				boxZoom(path.bounds(d), path.centroid(d), 20);
// 			});

// 		initiateZoom();
// */	}
// );