
var map;
var rsvr;
var btsvr;
var timerID;
var markers = [[],[]];
var degrees;
var bz = 42;

if (window.location.hostname == 'localhost') {
	rsvr  = 'engine/';
	btsvr = 'bt/';
} else {
	rsvr  = 'https://api.bustracker.mx/engine/';
	btsvr = '../bt/';
}

var stop_image_black	= btsvr + 'img/stop25.png';
var stop_image_gray		= btsvr + 'img/stop25_gray.png';
var bus_image			= btsvr + 'img/bus.png'; //_lipu_'+bz+'.png';
var prog_bus			= btsvr + 'img/prog_bus_25.png';

function initMap() {
	// Create a map object and specify the DOM element for display.
	  var mapOptions = {
		zoom: 13,
		scrollwheel: false,
		center: {"lat": 25.659711, "lng": -100.078793}
	  };
	  map = new google.maps.Map(document.getElementById('map'), mapOptions);
}



function initRoute(route, route_coordinates, drawR = true) {
	// Load Route
	if(drawR) drawRoute(map, route_coordinates);
	// Load Buses by XML
	drawMarkers(map, 1, rsvr + 'get_xml.php?type=bus&route=' + route, bus_image, false);
	// Load Stops by XML, solo el type stops puede no llevar imagen !importante
	drawMarkers(map, 0, rsvr + 'get_xml.php?type=stops&route=' + route, 'stop', true);
}


function fillRouteInfo(routeInfo) {
	document.getElementById('routeInfo').innerHTML = routeInfo;
}



// Dibuja la Ruta
function drawRoute(map, route_coordinates) {
	deleteMarkers(0);
	deleteMarkers(1);
	degrees = 0;
	var flightPlanCoordinates = JSON.parse(route_coordinates);
	//var flightPlanCoordinates = JSON.parse('[{"lat": 25.980696, "lng": -100.157428},{"lat": 25.983501, "lng": -100.160715}]');
	var flightPath = new google.maps.Polyline({
	  path: flightPlanCoordinates,
	  geodesic: true,
	  strokeColor: '#0000FF',
	  strokeOpacity: 0.8,
	  strokeWeight: 2
	});
	//runSnapToRoad(flightPath.getPath());
	flightPath.setMap(map);
	var bounds = new google.maps.LatLngBounds();
	//var i;
	for (var i = 0; i < flightPlanCoordinates.length; i++) {
	  bounds.extend(flightPlanCoordinates[i]);
	}
	map.fitBounds(bounds);
}


// Dibuja Paradas y Carros sobre la ruta
function drawMarkers(map, mks, markers_url, image, createTable) {
	
	var infoWindow = new google.maps.InfoWindow;
	downloadUrl(markers_url, function(data) {
		
		var xml 	= data.responseXML;
		var markers_out = xml.documentElement.getElementsByTagName('marker');
		
		if (createTable) {
			var tr;
			var td;
			var tblh = document.getElementById('infoLeftH');
			tblh.innerHTML = '';
			var dant = 0;
			var di = 0;
		}
		
		if( markers[mks].length > 0 )	create_markers = false;
		else							create_markers = true;
		
		var i = 0;
		var pq = '';
		Array.prototype.forEach.call(markers_out, function(markerElem) {
			var marker  = '';
			var id 		= markerElem.getAttribute('id');
			var name 	= markerElem.getAttribute('name');
			var address = markerElem.getAttribute('address');
			var type 	= markerElem.getAttribute('type');
			var done	= markerElem.getAttribute('done');
			var deg     = markerElem.getAttribute('degrees');
			var point 	= new google.maps.LatLng( parseFloat(markerElem.getAttribute('lat')), parseFloat(markerElem.getAttribute('lng')));

			var infowincontent 	= document.createElement('div');
			var strong 			= document.createElement('strong');
			strong.textContent 	= name
			infowincontent.appendChild(strong);
			infowincontent.appendChild(document.createElement('br'));

			var text = document.createElement('text');
			text.textContent = address
			infowincontent.appendChild(text);
			
			var img;
			if (image == 'stop') {
				if( done == 1)
					img = stop_image_gray;
				else
					img = stop_image_black;
			} else {
				if (deg != 0) degrees = deg;
				img = {
					url: image,
					anchor: new google.maps.Point(bz/2, bz/2),
				};
				/*
				img = {
					url: RotateIcon
						.makeIcon(image)
						.setRotation({deg: parseInt(degrees) + 270})
						.getUrl(),
					anchor: new google.maps.Point(bz/2, bz/2),
				};
				*/
			}
			
			if (create_markers)	markers[mks][i] = createMarker(mks, point, img);
			else 				markers[mks][i] = changeMarker(markers[mks][i], point, img);
			
			marker = markers[mks][i];
			
			google.maps.event.clearListeners(marker, 'click');
			marker.addListener('click', function() {
				infoWindow.setContent(infowincontent);
				infoWindow.open(map, marker);
			});
			
			if (createTable) {
				if( done == 0 && (dant == 1 || i == 0) ) di = i;
				dant = done;
				
				tr = tblh.insertRow();
				td = tr.insertCell();
				td.appendChild(document.createTextNode(i+1));
				td = tr.insertCell();
				td.appendChild(document.createTextNode(name));
				td = tr.insertCell();
				td.appendChild(document.createTextNode(''));
				td = tr.insertCell();
				td.appendChild(document.createTextNode(address));
			}
			
			i++;
		});
		
		if (createTable) {
			tblh.rows[di].cells[2].style = "width: 40px; height: 25px; background-image: url("+prog_bus+"); background-repeat: no-repeat;";
			document.getElementById('infoLeft').innerHTML = document.getElementById('infoLeftH').innerHTML;
		}
	});
}



function createMarker(mks, point, image) {
	var marker = new google.maps.Marker({
		map: map,
		position: point,
		icon: image,
		label: ''
	});
	return marker;
}



function changeMarker(marker, point, image) {
	marker.setIcon(image);
	marker.setPosition(point);
	return marker;
}



function fillInfo(model, driver, speed, last_pos, last_gprs) {
		
	document.getElementById('info').innerHTML = 
		'Operador: ' + driver + '<br \>' + 
		'Velocidad: ' + speed + ' Km/hr <br \>' + 
		'Modelo: ' + model + '<br \>' + 
		'Ult. POS: ' + last_pos + '<br \>' + 
		'Ult. GPRS: ' + last_gprs; 
}



function downloadUrl(url, callback) {
	var request = window.ActiveXObject ?
		new ActiveXObject('Microsoft.XMLHTTP') :
		new XMLHttpRequest;
	request.onreadystatechange = function() {
	  if (request.readyState == 4) {
		request.onreadystatechange = doNothing;
		callback(request, request.status);
	  }
	};
	request.open('GET', url, true);
	request.send(null);
}


// Adds a marker to the map and push to the array.
function addMarker(location, mks) {
	var marker = new google.maps.Marker({
		position: location,
		map: map
	});
	markers[mks].push(marker);
}


// Sets the map on all markers in the array.
function setMapOnAll(map,mks) {
	for (var i = 0; i < markers[mks].length; i++) {
		markers[mks][i].setMap(map);
	}
}


// Removes the markers from the map, but keeps them in the array.
function clearMarkers(mks) {
	setMapOnAll(null, mks);
}


// Shows any markers currently in the array.
function showMarkers(mks) {
	setMapOnAll(map, mks);
}


// Deletes all markers in the array by removing references to them.
function deleteMarkers(mks) {
	clearMarkers(mks);
	markers[mks] = [];
}


// No borrar
function doNothing() {}

	

// Icon Rotation
var RotateIcon = function(options){
    this.options = options || {};
    this.rImg = options.img || new Image();
    this.rImg.src = this.rImg.src || this.options.url || '';
    this.options.width = this.options.width || this.rImg.width || bz/2;
    this.options.height = this.options.height || this.rImg.height || bz/2;
    var canvas = document.createElement("canvas");
    canvas.width = this.options.width;
    canvas.height = this.options.width;
    this.context = canvas.getContext("2d");
    this.canvas = canvas;
};


RotateIcon.makeIcon = function(url) {
    return new RotateIcon({url: url});
};


RotateIcon.prototype.setRotation = function(options){
    var canvas = this.context,
        angle = options.deg ? options.deg * Math.PI / 180:
            options.rad,
        centerX = this.options.width/2,
        centerY = this.options.height/2;

    canvas.clearRect(0, 0, this.options.width, this.options.height);
    canvas.save();
    canvas.translate(centerX, centerY);
    canvas.rotate(angle);
    canvas.translate(-centerX, -centerY);
    canvas.drawImage(this.rImg, 0, 0);
    canvas.restore();
    return this;
};


RotateIcon.prototype.getUrl = function(){
    return this.canvas.toDataURL('image/png');
};












































