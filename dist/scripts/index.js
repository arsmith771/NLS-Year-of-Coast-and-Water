var map;
var overlay; //current historic overlay node
var overlayLayers;
var baseLayer;
var baseLayers; // base layers include Bing and ESRI maps, and OpenStreetMap
var overlaySelected;
var opacity = 1;

var DEFAULT_LON = -4;
var DEFAULT_LAT = 58;
var DEFAULT_ZOOM = 6;
var photoID;

// necessary for use of Bing layers - generate your own at: https://msdn.microsoft.com/en-us/library/ff428642.aspx

	var BingapiKey = "AgS4SIQqnI-GRV-wKAQLwnRJVcCXvDKiOzf9I1QpUQfFcnuV82wf1Aw6uw5GJPRz";

	
proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");

	function loadOptions()
		{
		args = [];
		var hash = window.location.hash;
		if (hash.length > 0)
			{
			var elements = hash.split('&');
			elements[0] = elements[0].substring(1); /* Remove the # */
			for(var i = 0; i < elements.length; i++)
			{
			var pair = elements[i].split('=');
			args[pair[0]] = pair[1];
			}
		}
	}

	function setZoomLimit()
		{ 
		updateUrl();
		}

	function setPanEnd()
		{
		updateUrl();
		}

	function updateUrl()
		{
	
			if (photoID == undefined)
			{
			var centre = ol.proj.transform(map.getView().getCenter(), "EPSG:3857", "EPSG:4326");
			window.location.hash = "zoom=" + map.getView().getZoom()  + "&lat=" + centre[1].toFixed(4)  + "&lon=" + centre[0].toFixed(4); 
			}
			else
			{	
			var centre = ol.proj.transform(map.getView().getCenter(), "EPSG:3857", "EPSG:4326");
			window.location.hash = "zoom=" + map.getView().getZoom()  + "&lat=" + centre[1].toFixed(4)  + "&lon=" + centre[0].toFixed(4) + "&photo=" + photoID ; 
			}
		}



// From https://www.movable-type.co.uk/scripts/latlong-gridref.html NT261732
    function gridrefNumToLet(e, n, digits) {
        // get the 100km-grid indices
        var e100k = Math.floor(e / 100000),
        n100k = Math.floor(n / 100000);

        if (e100k < 0 || e100k > 6 || n100k < 0 || n100k > 12) return '';

        // translate those into numeric equivalents of the grid letters
        var l1 = (19 - n100k) - (19 - n100k) % 5 + Math.floor((e100k + 10) / 5);
        var l2 = (19 - n100k) * 5 % 25 + e100k % 5;

        // compensate for skipped 'I' and build grid letter-pairs
        if (l1 > 7) l1++;
        if (l2 > 7) l2++;
        var letPair = String.fromCharCode(l1 + 'A'.charCodeAt(0), l2 + 'A'.charCodeAt(0));

        // strip 100km-grid indices from easting & northing, and reduce precision
        e = Math.floor((e % 100000) / Math.pow(10, 5 - digits / 2));
        n = Math.floor((n % 100000) / Math.pow(10, 5 - digits / 2));

        Number.prototype.padLZ = function(w) {
            var n = this.toString();
            while (n.length < w) n = '0' + n;
            return n;
        }

        var gridRef = letPair + e.padLZ(digits / 2) + n.padLZ(digits / 2);

        return gridRef;
    }
	function gridrefLetToNum(gridref) {
	  // get numeric values of letter references, mapping A->0, B->1, C->2, etc:
	  var l1 = gridref.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
	  var l2 = gridref.toUpperCase().charCodeAt(1) - 'A'.charCodeAt(0);
	  // shuffle down letters after 'I' since 'I' is not used in grid:
	  if (l1 > 7) l1--;
	  if (l2 > 7) l2--;

	  // convert grid letters into 100km-square indexes from false origin (grid square SV):
	  var e = ((l1-2)%5)*5 + (l2%5);
	  var n = (19-Math.floor(l1/5)*5) - Math.floor(l2/5);

	  // skip grid letters to get numeric part of ref, stripping any spaces:
	  gridref = gridref.slice(2).replace(/ /g,'');

	  // append numeric part of references to grid index:
	  e += gridref.slice(0, gridref.length/2);
	  n += gridref.slice(gridref.length/2);

	  // normalise to 1m grid, rounding up to centre of grid square:
	  switch (gridref.length) {
		case 2: e += '5000'; n += '5000'; break;
	    case 4: e += '500'; n += '500'; break;
	    case 6: e += '50'; n += '50'; break;
	    case 8: e += '5'; n += '5'; break;
	    // 10-digit refs are already 1m
	  }

	  return [e, n];
	}

	
// the base map layers


	var osm = new ol.layer.Tile({
	  	title: 'Modern OpenStreetMap',
        	visible: false,
	  	source: new ol.source.OSM()
	});

// ESRI World Layers

	var esri_world_topo = new ol.layer.Tile({
		title: 'Modern World Topographic',
        	visible: false,
		    source: new ol.source.XYZ({
			          attributions: [
			            new ol.Attribution({ html: 'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer">ArcGIS</a>'})
			          ],
			              url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
			                  'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
	      	})
	    });

	var esri_world_imagery = new ol.layer.Tile({
		title: 'Modern World Imagery',
        	visible: false,
		    source: new ol.source.XYZ({
			          attributions: [
			            new ol.Attribution({ html: 'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer">ArcGIS</a>'})
			          ],
			              url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
			                  'World_Imagery/MapServer/tile/{z}/{y}/{x}'
	      	})
	    });

// historic 1900s OS layer


	var OS1900sGBback =  new ol.layer.Tile({
	            title: 'Ordnance Survey 1900s',
		    extent: ol.proj.transformExtent([-14.169172,49.205882,4.393046,61.483786], 'EPSG:4326', 'EPSG:3857'),
		    source: new ol.source.XYZ({
			          attributions: [
			            new ol.Attribution({html: '<a href=\'https://maps.nls.uk/\'>National Library of Scotland Historic Maps</a>'})
			          ],
			          urls:[
			            'https://nls-0.tileserver.com/fpsUZbqQLWLT/{z}/{x}/{y}.jpg',
			            'https://nls-1.tileserver.com/fpsUZbqQLWLT/{z}/{x}/{y}.jpg',
			            'https://nls-2.tileserver.com/fpsUZbqQLWLT/{z}/{x}/{y}.jpg',
			            'https://nls-3.tileserver.com/fpsUZbqQLWLT/{z}/{x}/{y}.jpg'
			          ],
				minZoom: 1,
				maxZoom: 16

		}),
          });



// an array of the base layers listed above

	var overlayLayers = [ esri_world_topo, esri_world_imagery, osm ];

// set default layers to be visible

	esri_world_topo.setVisible(true);

	OS1900sGBback.setVisible(true);


// sets up the base layers as a set of radio buttons

	var overlaylayerSelect = document.getElementById('overlaylayerSelect');
	    for (var x = 0; x < overlayLayers.length; x++) {
	            var checked = (overlayLayers[x].getVisible()) ? "checked" : "";
	            overlaylayerSelect.innerHTML += '<p><input type="radio" name="base" id="overlayRadio'+ overlayLayers[x].get('title') + 
			'" value="' + x + '" onClick="switchoverlayLayer(this.value)" ' + checked + '><span>&nbsp;' + overlayLayers[x].get('title') + '</span></p>';
	}


        setResults();


// the original blue circles for the points

            var circle_symbol = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({
                        color: 'rgba(102,102,255, 0.8)',
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(21, 20, 60, 0.9)',
                        width: 2
                    })
                })
            });

// hover style for the circles

            var hoverStyle = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 10,
                    fill: new ol.style.Fill({
                        color: 'rgba(179,179,255, 0.8)',
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(21, 20, 60, 0.9)',
                        width: 2
                    })
                })
            });

// the golden circle selected style 

             var selectedStyle = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 12,
                    fill: new ol.style.Fill({
                        color: 'rgba(248,211,141,0.9)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0,0,0,0.8)',
                        width: 3
                    })
                })
            });



var function_icon_size = function(feature, resolution) {
       var geometry = feature.getGeometry();
	if(resolution> 400) {
		new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		    anchor: [60, 60],
		    anchorXUnits: 'pixels',
		    anchorYUnits: 'pixels',
		    scale: 0.4,
		    opacity: 0.75,
		 //   size: [20,20],
		    src: 'http://geo.nls.uk/maps/mackinnon/img/icon_selected.png'
		  }))
		});
	}
	else if(resolution<400) {
		new ol.style.Style({

			image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
			    anchor: [60, 60],
			    anchorXUnits: 'pixels',
			    anchorYUnits: 'pixels',
			    scale: 0.2,
			    opacity: 0.75,
			 //   size: [20,20],
			    src: 'http://geo.nls.uk/maps/mackinnon/img/icon_selected.png'
			  }))
		});
               }
}


// the marker icon style for the Thomas Annan photos 

	   var iconStyle = new ol.style.Style({
		  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		    anchor: [60, 60],
		    anchorXUnits: 'pixels',
		    anchorYUnits: 'pixels',
		    scale: 0.2,
		    opacity: 1,
		 //   size: [20,20],
		    src: 'http://geo.nls.uk/maps/mackinnon/img/icon_default.png'
		  }))
		});


	   var iconStyle_selected = new ol.style.Style({
		  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		    anchor: [60, 60],
		    anchorXUnits: 'pixels',
		    anchorYUnits: 'pixels',
		    scale: 0.2,
		    opacity: 1,
		    src: 'http://geo.nls.uk/maps/mackinnon/img/icon_selected.png'
		  }))
		});


// Mackinnon photos layer definition

		var mackinnon_json = new ol.layer.Vector({
		  title: "Mackinnon",
		  source: new ol.source.Vector({
		    url: 'https://geo.nls.uk/maps/mackinnon/scripts/mackinnon_gj.js',
    		    format: new ol.format.GeoJSON(),

		  }),
		visible: true,
	        style: iconStyle,
	//	  updateWhileAnimating: true,
	//	  updateWhileInteracting: true,
 	//	 style: function(feature, resolution) {
   	//	 iconStyle.getImage().setScale(map.getView().getResolutionForZoom(9) / resolution);
   	//	 return iconStyle;
	//	  }

	      });



loadOptions();

	var currentZoom = DEFAULT_ZOOM;
	var currentLat = DEFAULT_LAT;
	var currentLon = DEFAULT_LON;

	if (args['zoom'])
		{
		currentZoom = args['zoom'];
		}
	if (args['lat'] && args['lon'])
		{
		currentLat = parseFloat(args['lat']); /* Necessary for lat (only) for some reason, otherwise was going to 90-val. Very odd... */
		currentLon = parseFloat(args['lon']);
		}
	if (args['zoom'] && args['lat'] && args['lon'])
		{
		defaultLLZ = false;
		}
	if (args['photo'])
		{
		photoID = args['photo'];
		}


		var attribution = new ol.control.Attribution({
		  collapsible: true,
		  label: 'i',
		  collapsed: true,
		  tipLabel: 'Attributions'
		});

		var maxExtent = ol.proj.transformExtent([-9,54,2,61], 'EPSG:4326', 'EPSG:3857');

		var map = new ol.Map({
		  target: document.getElementById('map'),
		  renderer: 'canvas',
		  controls: ol.control.defaults({ attributionOptions: { collapsed: true, collapsible: true }}),
		  interactions : ol.interaction.defaults({doubleClickZoom :false}),
		  layers: [OS1900sGBback, esri_world_topo, mackinnon_json ],
		  logo: false,
		  view: new ol.View({
		    center: ol.proj.transform([currentLon, currentLat], 'EPSG:4326', 'EPSG:3857'),
		    zoom: currentZoom,
		    minZoom: 6,
		    maxZoom: 10,
		    extent: maxExtent,
		  })
		});


updateUrl();




// Sets up an opacity slider on the overlay layer

   jQuery( document ).ready(function() {
	jQuery('#mapslider').slider({
	    reversed : true,
	    formater: function(value) {
	    opacity = value / 100;
	    map.getLayers().getArray()[1].setOpacity(opacity);
	    // overlay.layer.setOpacity(opacity);
	    return 'Opacity: ' + value + '%';
	  }
	});
    });


	$( "#mapslider" ).on( "slideStop", function() {
		opacity = $('input[id="mapslider"]').slider('getValue');
	});


// function to change the baseLayer

       function switchoverlayLayer(index) {
		map.getLayers().getArray()[1].setVisible(false);
		map.getLayers().removeAt(1);
		map.getLayers().insertAt(1,overlayLayers[index]);
		overlaySelected = overlayLayers[index];
	    	overlaySelected.setVisible(true);
		var newopacity = opacity / 100;
		map.getLayers().getArray()[1].setOpacity(newopacity);
	}


// add the OL ZoomSlider and ScaleLine controls

    map.addControl(new ol.control.ZoomSlider());
    map.addControl(new ol.control.ScaleLine({ units:'metric' }));

    map.removeInteraction(new ol.interaction.DoubleClickZoom({
		duration: 1000
		})
   	);	


// customised mouse position with lat/lon and British National Grid

    var mouseposition = new ol.control.MousePosition({
            projection: 'EPSG:4326',
            coordinateFormat: function(coordinate) {
	    // BNG: ol.extent.applyTransform([x, y], ol.proj.getTransform("EPSG:4326", "EPSG:27700"), 
		var coord27700 = ol.proj.transform(coordinate, 'EPSG:4326', 'EPSG:27700');
		var templatex = '{x}';
		var outx = ol.coordinate.format(coord27700, templatex, 0);
		var templatey = '{y}';
		var outy = ol.coordinate.format(coord27700, templatey, 0);
		NGR = gridrefNumToLet(outx, outy, 6);
		var hdms = ol.coordinate.toStringHDMS(coordinate);
		if ((outx  < 0) || (outx > 700000 ) || (outy < 0) || (outy > 1300000 )) {
	        return '<strong>' + ol.coordinate.format(coordinate, '{x}, {y}', 4) + '&nbsp; <br/>&nbsp;' + hdms + ' &nbsp;'; 
		}
		else 
                { return '<strong>' + NGR + '</strong>&nbsp; <br/>' + ol.coordinate.format(coord27700, '{x}, {y}', 0) + 
			'&nbsp; <br/>' + ol.coordinate.format(coordinate, '{x}, {y}', 4) + '&nbsp; <br/>&nbsp;' + hdms + ' &nbsp;'; }
            	}
    });

    map.addControl(mouseposition);


// the featureOverlay for the selected vector features

            var selectedFeatures = [];

// function to unselect previous selected features

            function unselectPreviousFeatures() {
                var i;
                for(i=0; i< selectedFeatures.length; i++) {
                    selectedFeatures[i].setStyle(null);
                }
                selectedFeatures = [];
	        photoID = null;
		updateUrl();
            }


// function to unselect previous selected features

            function unselectPreviousFeaturesPointClick() {
                var i;
                for(i=0; i< selectedFeatures.length; i++) {
                    selectedFeatures[i].setStyle(null);
                }
                selectedFeatures = [];

            }



// function to select point features and display geoJSON information on them

	var highlightonhover = function(pixel) {	

		 var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
			              feature.setStyle([
			                     hoverStyle
			                ]);

		          selectedFeatures.push(feature);
		        }, {
		          hitTolerance: 1
		        });


							
	};



// function to select point features and display geoJSON information on them

	var displayFeatureInfo = function(pixel) {	

		 var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
			              feature.setStyle([
			                   //  selectedStyle
					     iconStyle_selected
			                ]);

		          selectedFeatures.push(feature);
		        }, {
		          hitTolerance: 1
		        });





			var info = document.getElementById('results');
				  if (selectedFeatures.length > 0) {

					photoID = selectedFeatures[0].get("Image");
					
					updateUrl();

					

					var resultsheader = "";
			
					if (selectedFeatures.length == 1)
				            resultsheader += '<p style="text-transform:uppercase;"><strong>1 photo of ' + selectedFeatures[0].get("Location") + '</strong><br>(click to view)</p>' +
				            '<div class = ""></div>';
					else if (selectedFeatures.length > 1)
			
				        resultsheader += '<p style="text-transform:uppercase;"><strong>' + selectedFeatures.length + ' photos of  ' + selectedFeatures[0].get("Location") + '</strong><br>(click to view)</p>' +
					'<div class = ""></div>';
			
				        setResultsheader(resultsheader);



					var results = "";
			                var k;
			                for(k=0; k< selectedFeatures.length; k++) {


					results += '<div id="' + selectedFeatures[k].get("Image") + '" class="resultslist" data-layerid="' + selectedFeatures[k].get("Image") + 
					'" ><strong>Location: '  + selectedFeatures[k].get("Location")  + '</strong><a class="" href="../images/' + selectedFeatures[k].get("Image") + '.jpg" data-fancybox="gallery" data-caption="'  + selectedFeatures[k].get("Caption")  + '"><img src="../images/' + selectedFeatures[k].get("Image") + '-thumb.jpg" alt="' + selectedFeatures[k].get("Caption") + '"  width="300"></a><p>'  + 
					selectedFeatures[k].get("Caption") + '</p></div>';

					results += '<div class = ""></div>';
			                }

					info.innerHTML = results;
				
				  } else {
					var resultsheader = "";
					resultsheader += '';
		        		setResultsheader(resultsheader);
				        info.innerHTML = 'No photos selected - please click on a blue marker to view photos.';
				  }

	};


function zoomtophoto(photoID)

	{

		var selectedFeatures1 = [];

		selectedFeatures1 = map.getLayers().getArray()[2].getSource().getFeatures();

		selectedFeatures = jQuery.grep(selectedFeatures1, function(n, i){
			 return n.get("Image") == photoID;
		});


				  if (selectedFeatures.length > 0) {

					var coords = selectedFeatures[0].getGeometry().getCoordinates();

					map.getView().animate({
						center: [coords[0] , coords[1] ],
						zoom: 8,
						duration: 1000
					});

		}

	}


// the main selection of features and popover on the URL having a point feature


	function getPhoto(photoID)  {
		unselectPreviousFeaturesPointClick();

		var selectedFeatures1 = [];

		selectedFeatures1 = map.getLayers().getArray()[2].getSource().getFeatures();

		selectedFeatures = jQuery.grep(selectedFeatures1, function(n, i){
			 return n.get("Image") == photoID;
		});

		
			var info = document.getElementById('results');
				  if (selectedFeatures.length > 0) {

					var coords = selectedFeatures[0].getGeometry().getCoordinates();

//					map.getView().animate({
//						center: [coords[0] , coords[1] ],
//						zoom: 8,
//						duration: 1000
//					});

					var pixel = map.getPixelFromCoordinate(coords);


				unselectPreviousFeaturesPointClick();

				var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
			              feature.setStyle([
			                    // selectedStyle
					     iconStyle_selected
			                ]);

			          selectedFeatures.push(feature);
				        }, {
			          hitTolerance: 1
			        });

					var resultsheader = "";
			
					if (selectedFeatures.length == 1)
				            resultsheader += '<p style="text-transform:uppercase;"><strong>1 photo of ' + selectedFeatures[0].get("Location") + '</strong><br>(click to view)</p>' +
				            '<div class = ""></div>';
					else if (selectedFeatures.length > 1)
			
				        resultsheader += '<p style="text-transform:uppercase;"><strong>' + selectedFeatures.length + ' photos of  ' + selectedFeatures[0].get("Location") + '</strong><br>(click to view)</p>' +
					'<div class = ""></div>';
			
				        setResultsheader(resultsheader);



					var results = "";
			                var k;
			                for(k=0; k< selectedFeatures.length; k++) {


					results += '<div id="' + selectedFeatures[k].get("Image") + '" class="resultslist" data-layerid="' + selectedFeatures[k].get("Image") + 
					'" ><strong>Location: '  + selectedFeatures[k].get("Location")  + '</strong><a class="" href="../images/' + selectedFeatures[k].get("Image") + '.jpg" data-fancybox="gallery" data-caption="'  + selectedFeatures[k].get("Caption")  + '"><img src="../images/' + selectedFeatures[k].get("Image") + '-thumb.jpg" alt="' + selectedFeatures[k].get("Caption") + '"  width="300"></a><p>'  + 
					selectedFeatures[k].get("Caption") + '</p></div>';

					results += '<div class = ""></div>';
			                }

					info.innerHTML = results;
				
				  } else {

					var resultsheader = "";
					resultsheader += '';
				        setResultsheader(resultsheader);
				        info.innerHTML = 'No photos selected - please click on a blue marker to view photos.';
				  }

	}

        map.on('singleclick', function(evt) {
		      var pixel = evt.pixel;
		      unselectPreviousFeatures();
		      displayFeatureInfo(pixel);

	});


		map.getLayers().getArray()[0].getSource().on('tileloadend', function() {
	
// safe to call map.getPixelFromCoordinate from now on as layer loaded
	
		if (photoID)
		if ((photoID !== null) && (photoID.length > 3)  )
		{
		// timedText(pointClicked);

		getPhoto(photoID);
		}
	     });


	map.on('moveend', setPanEnd);

	map.getView().on('change:resolution', setZoomLimit);






// the populates the results div on the right with default text 


	function setResults(str) {
	    if (!str) str = "<p>No photos selected - please click on a blue marker to view photos.</p>";
	    document.getElementById('results').innerHTML = str;
	}
	
	function setResultsheader(str) {
	    if (!str) str = "<p></p>";
	    document.getElementById('resultsheader').innerHTML = str;
	}


// change cursor to pointer whilst hovering over features

		var cursorHoverStyle = "pointer";
		var target = map.getTarget();
		
		//target returned might be the DOM element or the ID of this element dependeing on how the map was initialized
		//either way get a jQuery object for it
		var jTarget = typeof target === "string" ? jQuery("#"+target) : jQuery(target);
		
		map.on("pointermove", function (event) {
		    var mouseCoordInMapPixels = [event.originalEvent.offsetX, event.originalEvent.offsetY];
		
		    //detect feature at mouse coords
		    var hit = map.forEachFeatureAtPixel(mouseCoordInMapPixels, function (feature, layer) {
		        return true;
		    });
		
		    if (hit) {
		        jTarget.css("cursor", cursorHoverStyle);
		    } else {
		        jTarget.css("cursor", "");
		    }
		});
