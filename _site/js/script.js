////////// Do not remove below! //////////
// initates pym!
var pymChild = new pym.Child();
////////// Do not remove above! //////////

// Initial Script (remove below and replace)


// DEFINE VARIABLES
// Define size of map group
// Full world map is 2:1 ratio
/*w = 3000;
h = 1500;*/
var w = parseInt(d3.select("#master_container").style("width")),
	h = w / 2;
// variables for catching min and max zoom factors
var minZoom;
var maxZoom;
// variable for catching geoData
var geoData = null;

// DEFINE FUNCTIONS/OBJECTS
// Define map projection
var projection = d3
	.geoMercator()
	.center([0, 20]) // set centre to further North as we are cropping more off bottom of map
	.scale([w / (2 * Math.PI)]) // scale to fit group width
	.translate([w / 2, h / 2]) // ensure centered in group
;

// Define map path
var path = d3
	.geoPath()
	.projection(projection);

// Create function to apply zoom to countriesAll
function zoomed() {
	t = d3
		.event
		.transform;
	countriesAll
		.attr("transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")");
}

// Define map zoom behaviour
var zoom = d3
	.zoom()
	.on("zoom", zoomed);

function getTextBox(selection) {
	selection
		.each(function(d) {
			d.bbox = this
				.getBBox();
		});
}

// Function that calculates zoom/pan limits and sets zoom to default value
function initiateZoom() {
	// Define a "minzoom" whereby the "world" is as small possible without leaving white space at top/bottom or sides
	minZoom = Math.max($("#map").width() / w, $("#map").height() / h);
	// set max zoom to a suitable factor of this value
	maxZoom = 3 * minZoom;
	// set extent of zoom to chosen values
	// set translate extent so that panning can't cause map to move out of viewport
	zoom
		.scaleExtent([minZoom, maxZoom])
		.translateExtent([[0, 0], [w, h]]);
	// define X and Y offset for centre of map to be shown in centre of holder
	midX = ($("#map").width() - minZoom * w) / 2;
	midY = ($("#map").height() - minZoom * h) / 2;
	// change zoom transform to min zoom and centre offsets
	svg.call(zoom.transform, d3.zoomIdentity.translate(midX, midY).scale(minZoom));
}

// zoom to show a bounding box, with optional additional padding as percentage of box size
function boxZoom(box, centroid, paddingPerc) {
	minXY = box[0];
	maxXY = box[1];
	// find size of map area defined
	zoomWidth = Math.abs(minXY[0] - maxXY[0]);
	zoomHeight = Math.abs(minXY[1] - maxXY[1]);
	// find midpoint of map area defined
	zoomMidX = centroid[0];
	zoomMidY = centroid[1];
	// increase map area to include padding
	zoomWidth = zoomWidth * (1 + paddingPerc / 100);
	zoomHeight = zoomHeight * (1 + paddingPerc / 100);
	// find scale required for area to fill svg
	maxXscale = $("svg").width() / zoomWidth;
	maxYscale = $("svg").height() / zoomHeight;
	zoomScale = Math.min(maxXscale, maxYscale);
	// handle some edge cases
	// limit to max zoom (handles tiny world)
	zoomScale = Math.min(zoomScale, maxZoom);
	// limit to min zoom (handles large world and world that span the date line)
	zoomScale = Math.max(zoomScale, minZoom);
	// Find screen pixel equivalent once scaled
	offsetX = zoomScale * zoomMidX;
	offsetY = zoomScale * zoomMidY;
	// Find offset to centre, making sure no gap at left or top of holder
	dleft = Math.min(0, $("svg").width() / 2 - offsetX);
	dtop = Math.min(0, $("svg").height() / 2 - offsetY);
	// Make sure no gap at bottom or right of holder
	dleft = Math.max($("svg").width() - w * zoomScale, dleft);
	dtop = Math.max($("svg").height() - h * zoomScale, dtop);
	// set zoom
	svg
		.transition()
		.duration(500)
		.call(
			zoom.transform,
			d3.zoomIdentity.translate(dleft, dtop).scale(zoomScale)
		);
}

// on window resize
$(window).resize(function() {
	//console.log("resized");
	// Resize SVG
	svg
		.attr("width", $("#map").width())
		.attr("height", $("#map").height());
	initiateZoom();
});

// create an SVG
var svg = d3
	.select("#map")
	.append("svg")
	.attr("id", "map_container")
	// set to the same size as the "map-holder" div
	.attr("width", $("#map").width())
	.attr("height", $("#map").height())
	// add zoom functionality
	.call(zoom);

// get map data
var topoUrl = "data/world-topo.json"; // full world map
var countriesUrl = "data/export-countries.json"; // list of export countries

d3.queue()
	.defer( d3.json, topoUrl )
	.defer( d3.json, countriesUrl )
	.await ( drawMap );

function drawMap( error, topology, expCountries ) {
	if ( error ) throw error;

	// populate geoData variable created on load
	geoData = topojson.feature( topology, topology.objects.world );

	console.log( "geoData", geoData );

	//Bind data and create one path per geoData feature
	var countriesAll = svg.append( "g" ).attr( "id", "countries" );

	// add a background rectangle
	countriesAll
		.append( "rect" )
		.attr( "x", 0 )
		.attr( "y", 0 )
		.attr( "width", w )
		.attr( "height", h );

	// draw a path for each feature/country
	var world = countriesAll
		.selectAll( "path" )
		.data( geoData.features )
		.enter()
		.append( "path" )
		.attr( "d", path )
		.attr( "id", function( d ) {
			return d.id;
		})
		.attr( "class", "country" );

	// select all countries by class
	var highlights = svg.select( "#countries" )
		.selectAll( ".country" );

	// add container for all labels
	var countryLabels = svg.append( "g" ).attr( "id", "labels" );

	// Add a label group to each feature/country. This will contain the country name and a background rectangle
	countryLabels.selectAll( "g" )
		.data( geoData.features )
		.enter()
		.append( "g" )
		.attr( "class", "countryLabel" )
		.attr( "id", function( d ) {
			return "label-" + d.id;
	});

	// loop through keys in export list
	for ( var key in expCountries ) {
		// console.log( "NAME: " + expCountries[key]["countryName"] );

		// loop through country paths
		highlights.each( function() {
			d3.select( this );

			// compare element id to keys
			if ( this.id == key ) {
				// console.log( this.id + " SAME AS " + key );

				// add highlight color
				this.classList.add( "country-on" );
			};
		});

		// loop through country labels and text for name
		countryLabels.each( function() {
			name = d3.select( this ).selectAll( ".countryLabel" );
			console.log( name.id );
/*
			if ( this.id == "label-" + key ) {
				console.log( this.id );
				d3.select(this).append( "text" )
				.data( expCountries[key] )
				.attr( "class", "countryName" )
				.style( "text-anchor", "middle" )
				.attr( "dx", 0 )
				.attr( "dy", 0 )
				.text( function( d ) {
					return d.countryName;
				})
				.call( getTextBox );
			}*/
		});
		// add the text to the label group showing country name
// 		// countryLabels
// 		// 	.append("text")
// 		// 	.attr("class", "countryName")
// 		// 	.style("text-anchor", "middle")
// 		// 	.attr("dx", 0)
// 		// 	.attr("dy", 0)
// 		// 	.text(function(d) {
// 		// 		return d.countryName;
// 		// 	})
// 		// 	.call(getTextBox);
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
	}
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
// 		// 	.call(getTextBox);
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
// 			.attr("width", w)
// 			.attr("height", h);

// 		// draw a path for each feature/country
// 		world = countriesAll
// 			.selectAll("path")
// 			.data(geoData.features)
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