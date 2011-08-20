// JavaScript Document
const requestTimeout = 1000 * 2;
const api_uri = 'http://tepco-usage-api.appspot.com/latest.json';
const api_uri_quick = 'http://tepco-usage-api.appspot.com/quick.txt';

const intervalMin = 10;
const hot_color = [208, 0, 24, 255];
const fine_color = [255, 114, 21, 255];
const calm_color = [15, 0, 204, 255];
const lost_color = [190, 190, 190, 255];
const hot_icon = 'images/icon_red.png';
const fine_icon = 'images/icon_on.png';
const calm_icon = 'images/icon_off.png';
const lost_icon = 'images/icon_off.png';
const cnect_msg ="接続中";
const err_msg = "電力メーターにアクセスできませんでした";
const teiden_ex = "計画停電実施中";
const teiden_no = "計画停電未実施";
const graph_length = 255;
const graph_height = 22;
const graph_ofx = 2;
const graph_ofy = 2;
const button_ofx = 4;
const snap_step = 5;
var background_graph;
var graph_button;
const drawcurrentGraph = false;
var Config = {
hot_th:80,
calm_th:40,
show_number_on_badge:true
};

var tepco_status = {
year:2011,
month:1,
day:1,
hour:0,
min:0,
sec:0,
entryfor:'2011-01-01 00:00:00',
capacity:5000,
capacity_updated:'2011-01-01 00:00:00', 
capacity_peak_period:12, 
forecast_peak_usage:1500,
forecast_peak_period:1,
forecast_peak_updated:'2011-01-31 00:00:00', 
usage:1000,
usage_updated:'2011-07-01 03:00:48',
saving:false,
forecast:0
};
function loadConfigVal(){
	if (localStorage.TepcoMeterConfig) {
		Config = JSON.parse(localStorage.TepcoMeterConfig);
	}
}
function getQuickMeter(drawGraph){
	showConnect();
	getMeterValQuick(drawGraph);
}

function getMeterValQuick(drawGraph){
	var xhr = new XMLHttpRequest();
	var abortTimerId = setTimeout(function() {
		setIconLost();
		showError();
		xhr.abort();  // synchronously calls onreadystatechange
	}, requestTimeout);
	xhr.open('GET', api_uri_quick, true);
	xhr.onreadystatechange = function(){ 
		if (xhr.readyState === 4 && xhr.status === 200){
			clearTimeout(abortTimerId);
			loadConfigVal();
			//HH:MM,XXXX,YYYY
			var vals = xhr.responseText.split(",");
			var time_val = vals[0].split(":");
			tepco_status.hour =  parseInt(time_val[0],10);
			tepco_status.min =  parseInt(time_val[1],10);
			tepco_status.usage = parseInt(vals[1],10);
			tepco_status.capacity = parseInt(vals[2],10);
			updateTepcoUsage(drawGraph);
		}
	}
	xhr.send(null);
}
function getMeterVal(drawGraph){
	showConnect();
	var xhr = new XMLHttpRequest();
	var abortTimerId = setTimeout(function() {
		setIconLost();
		showError();
		xhr.abort();
		  // synchronously calls onreadystatechange
	}, requestTimeout);
	xhr.open('GET', api_uri, true);
	xhr.onreadystatechange = function(){ 
		if (xhr.readyState === 4 && xhr.status === 200){
			clearTimeout(abortTimerId);
			loadConfigVal();
			var current_data = JSON.parse(xhr.responseText);
			tepco_status = current_data;
		
			var update_time_data = tepco_status.usage_updated.split(" ");
			var date_time = update_time_data[0].split("-");
			var up_time = update_time_data[1].split(":");
		console.log("date"+	date_time[1] );
		console.log("dateParseInt"+	parseInt(date_time[1]),10 );
			update_time = new Date(parseInt(date_time[0],10),parseInt(date_time[1],10),parseInt(date_time[2],10),
			parseInt(up_time[0],10),parseInt(up_time[1],10) - new Date().getTimezoneOffset(),parseInt(up_time[2],10));

			tepco_status.year =update_time.getYear() + 1900;
			tepco_status.month = update_time.getMonth();
			tepco_status.day = update_time.getDate();
						tepco_status.hour = update_time.getHours();
			tepco_status.min =  update_time.getMinutes();
			tepco_status.sec = update_time.getSeconds();

			getMeterValQuick(drawGraph);
		}
	}
	xhr.send(null);
}
function updateTepcoUsage(drawNewData){
	updateConnectionStatus(tepco_status);
	if(drawNewData){
		loadImgAndDrawGraph(tepco_status);
		updateConnectionTime(tepco_status);
		$("#mbx").hide("0");
		$("#wrap").fadeIn("fast");	
		updateUsage(tepco_status);
	}
}


function loadImgAndDrawGraph(tepco_stat){
	background_graph = new Image();
	background_graph.src = "images/graph_back.png";
	background_graph.onload = function(){
		drawCurrentGraph(tepco_stat);
	}
}

function drawCurrentGraph(tepco_stat){
	
	var canvas = document.getElementById("currentGraph");
	var ctx = canvas.getContext("2d");
	var ptn = ctx.createPattern(background_graph,"no-repeat");
	var low = 0;
	var mid = 0;
	var high = 0;
	var ratio = Math.round((tepco_stat.usage * 100) / tepco_stat.capacity);
	if( ratio > Config.hot_th){
		high = ratio - Config.hot_th;
		mid = (Config.hot_th - Config.calm_th);
		low = Config.calm_th;
	}else if(ratio > Config.calm_th){
		mid = ratio - Config.calm_th;
		low = Config.calm_th;
	}else{
		low = ratio;	
	}
	var low_wid = graph_length * low / 100;
	var mid_wid = graph_length * mid / 100
	var high_wid = graph_length * high / 100
   	ctx.fillStyle = ptn;
	ctx.fillRect(0,0,canvas.width,canvas.height);
	ctx.fillStyle = "rgba(124,217,70,0.6)";
	ctx.fillRect (graph_ofx, graph_ofy, low_wid, graph_height);
	ctx.fillStyle = "rgba(252,206,68,0.6)";
	ctx.fillRect (low_wid + graph_ofx, graph_ofy, mid_wid, graph_height);
	ctx.fillStyle = "rgba(204,15,12,0.6)";
	ctx.fillRect (low_wid + mid_wid + graph_ofx, graph_ofy,high_wid, graph_height);
}
function updateConnectionTime(tepco_stat){
	var month = parseInt(tepco_stat.month,10);
	var day = parseInt(tepco_stat.day,10);
	var hour =  parseInt(tepco_stat.hour,10);
	var min =  parseInt(tepco_stat.min,10);
	
	var dataUpdateTime = new String();
	dataUpdateTime = "東京電力の電力使用状況 " + month + "月" + day + "日" + hour + "時" + min + "分更新";
	$("#dataUpdateTime").html(dataUpdateTime);
	
}
function updateConnectionStatus(tepco_stat){
	var ratio = Math.round((tepco_stat.usage * 100) / tepco_stat.capacity);
	if( ratio > Config.hot_th){
		setIconHot();
	}else if(ratio > Config.calm_th){
		setIconFine();
	}else{
		setIconCalm();
	}
	if(Config.show_number_on_badge){
		chrome.browserAction.setBadgeText({text:String(Math.round(ratio))});
	}else{
		chrome.browserAction.setBadgeText({text:""});
	}
}
function setIconHot() {
	chrome.browserAction.setIcon({path:hot_icon});
	chrome.browserAction.setBadgeBackgroundColor({color:hot_color});
}
function setIconFine() {
	chrome.browserAction.setIcon({path:fine_icon});
	chrome.browserAction.setBadgeBackgroundColor({color:fine_color});
}
function setIconCalm() {
	chrome.browserAction.setIcon({path:calm_icon});
	chrome.browserAction.setBadgeBackgroundColor({color:calm_color});
}
function setIconLost() {
	chrome.browserAction.setIcon({path:lost_icon});
 	chrome.browserAction.setBadgeBackgroundColor({color:lost_color});
	chrome.browserAction.setBadgeText({text:"?"});
}
function showConnect(){
	$("#msg").css("color","#000");
	$("#msg").html(cnect_msg);
}
function showError(){
	$("#msg").css("color","#000");
	$("#msg").html(err_msg);
}
function updateUsage(tepco_stat){
	
	$("#usage").html(tepco_stat.usage.toString());
	$("#capacity").html(tepco_stat.capacity.toString());
	var ratio = Math.round((tepco_stat.usage * 100) / tepco_stat.capacity);
	$("#pe").html(Math.round(ratio).toString());
	
	if( ratio > Config.hot_th){
		$("#tx").css("background-color","#CC0F0C");
		$("#tx").css("color","#fff");
		$("#usb").css("border-bottom","1px solid #fff");
		$("#rt").css("border-left","1px solid #fff");
	}else if(ratio > Config.calm_th){
		$("#tx").css("background-color","#FCCE44");
		$("#tx").css("color","#000");
		$("#usb").css("border-bottom","1px solid #000");
		$("#rt").css("border-left","1px solid #000");
	}else{
		$("#tx").css("background-color","#7CDA46");
		$("#tx").css("color","#000");
		$("#usb").css("border-bottom","1px solid #000");
		$("#rt").css("border-left","1px solid #000");
	}
	
	if(tepco_stat.saving){
		$("#tdb").css("background-color","#CC0F0C");
		$("#tdb").css("color","#fff");
		$("#teiden").html(teiden_ex);
	}else{
		$("#tdb").css("background-color","#A9E7AD");
		$("#tdb").css("color","#000");
		$("#teiden").html(teiden_no);
	}
}