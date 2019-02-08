

// Dibuja la Ruta
function bustracker(route) {

	if (typeof(timerID) !== 'undefined')
		clearInterval(timerID);

	initMap();
	jQuery.ajax({
			data:  {'type' : 'get_route', 'data':{'route' : route}},
			url:   rsvr + 'get_json.php',
			type:  'post',
			dataType: 'json',
			success:  function (response) { 
				if(response['route']) {
					initRoute(route, response['route']);
					fillRouteInfo(response['routeInfo']);
				} else {
					alert('La ruta seleccionada no es válida.');
				}
				
				timerID = setInterval(function() {
					initRoute(route, response['route'], false);
					}, 5000
				);
			}
	});
}


function runScript(e) {
	if (e.keyCode == 13) {
		bustracker(document.getElementById('route').value);
		return false;
	}
}


// Llena el selector de rutas
var $jq = jQuery.noConflict();
$jq(document).ready(function(){
	var deptid = $jq(this).val();
	$jq.ajax({
		url:  rsvr + 'get_json.php',
		type: 'post',
		data: {'type':'select_route', 'data':'{}'},
		dataType: 'json',
		success:function(response){
			var len = response.length;
			//$jq("#route").empty();
			for( var i = 0; i<len; i++){
				var id = response[i]['route'];
				var name = response[i]['r_des'];
				$jq("#route").append("<option value='"+id+"'>"+name+"</option>");
			}
		}
	});
	initMap();
});





