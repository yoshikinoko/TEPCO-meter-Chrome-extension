// JavaScript Document
const requestTimeout = 1000 * 2;
const api_uri = 'http://tepco-usage-api.appspot.com/latest.json';
const intervalMin = 10;
const hot_color = [208, 0, 24, 255];
const fine_color = [255, 114, 21, 255];
const calm_color = [15, 0, 204, 255];
const lost_color = [190, 190, 190, 255];
const hot_icon = 'images/icon_red.png';
const fine_icon = 'images/icon_on.png';
const calm_icon = 'images/icon_off.png';
const lost_icon = 'images/icon_off.png';
const hot_th = 80;
const calm_th = 40;
const cnect_msg ="接続中";
const err_msg = "電力メーターにアクセスできませんでした";
const teiden_ex = "計画停電実施中";
const teiden_no = "計画停電未実施";

function getMeterVal(){
	showConnect();
		
	var xhr = new XMLHttpRequest();
	var abortTimerId = setTimeout(function() {
		setIconLost();
		showError();
		xhr.abort();  // synchronously calls onreadystatechange
	}, requestTimeout);
	xhr.open('GET', api_uri, true);
	xhr.onreadystatechange = function(){ 
		if (xhr.readyState === 4 && xhr.status === 200){
			clearTimeout(abortTimerId);
			var current_data = JSON.parse(xhr.responseText);
			updateConnectionStatus(current_data);
			updateUsage(current_data);
		}
	}
	xhr.send(null);
}
function updateConnectionStatus(tepco_stat){
	var ratio = (tepco_stat.usage * 100) / tepco_stat.capacity;
	if( ratio > hot_th){
		setIconHot();
	}else if(ratio > calm_th){
		setIconFine();
	}else{
		setIconCalm();
	}
	chrome.browserAction.setBadgeText({text:String(Math.round(ratio))});
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
	$("#msg").html(cnect_msg);
}
function showError(){
	$("#msg").html(err_msg);
}
function getJpUpdateTime(utc_entry_time){
var utc_entry = utc_entry_time.split(' ');
	var utc_ymd = utc_entry[0].split('-');
	var utc_hms = utc_entry[0].split(':');
	var entry_time = new Date(utc_ymd[0], utc_ymd[1],utc_ymd[2], utc_hms[0], utc_hms[1], utc_hms[2]);
	entry_time.setDate(entry_time.getDate()+9); 	
	return(entry_time);
}
function updateUsage(tepco_stat){
	
	$("#usage").html(tepco_stat.usage.toString());
	$("#capacity").html(tepco_stat.capacity.toString());
	var ratio = Math.round((tepco_stat.usage * 100) / tepco_stat.capacity);
	$("#pe").html(Math.round(ratio).toString());
	
	if( ratio > hot_th){
		$("#tx").css("background-color","#CC0F0C");
		$("#tx").css("color","#fff");
		$("#usb").css("border-bottom","1px solid #fff");
		$("#rt").css("border-left","1px solid #fff");
	}else if(ratio > calm_th){
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
	
	 $("#gimg").attr("src",crateGraphImageURL(tepco_stat));
	 
	var month = parseInt(tepco_stat.month);
	var day = parseInt(tepco_stat.day);
	var hour =  parseInt(tepco_stat.hour);
	var minutes = 0;
	var graph_alt= new String();
	graph_alt = "東京電力の電力使用状況 " + month + "月" + day + "日" + hour + "時" + minutes + "分現在";
	$("gimg").attr("alt",graph_alt);
	$("#mbx").hide("0");
	$("#wrap").fadeIn("fast");
}

function crateGraphImageURL(tepco_stat){
	var month = parseInt(tepco_stat.month);
	var day = parseInt(tepco_stat.day);
	var hour =  parseInt(tepco_stat.hour);
	var minutes = 0;
	var low = 0;
	var mid = 0;
	var high = 0;
	var ratio = (tepco_stat.usage * 100) / tepco_stat.capacity;
	if( ratio > hot_th){
		high = ratio - hot_th;
		mid = (hot_th - calm_th);
		low = calm_th;
	}else if(ratio > calm_th){
		mid = ratio - calm_th;
		low = calm_th;
	}else{
		low = ratio;	
	}
	var imgurl = new String();
	imgurl ="http://chart.apis.google.com/chart?chxs=0,000000,9.5,-0.3,_,FFFFFF&chxt=x&chbh=22,0,4&chs=268x63&cht=bhs&chco=7CDA3C"
	if(mid >0){
		imgurl +=",FCCE34";
	}
	if(high > 0){
		imgurl+=",CC0204"
	}
	imgurl += "&chds=0,100,0,100,0,93.333&chd=t:";
	imgurl += low.toString();
	if(mid > 0){
		imgurl += "|"+ mid.toString();
	}
	if(high > 0){
		imgurl += "|"+ high.toString();
	}
	imgurl += "&chg=10,0,0,0&chma=|3&chtt=%E6%9D%B1%E4%BA%AC%E9%9B%BB%E5%8A%9B%E3%81%AE%E9%9B%BB%E5%8A%9B%E4%BD%BF%E7%94%A8%E7%8A%B6%E6%B3%81+"+month.toString()+"%E6%9C%88"+day.toString()+"%E6%97%A5"+hour.toString()+"%E6%99%82"+minutes.toString()+"%E5%88%86%E7%8F%BE%E5%9C%A8+&chts=000000,11";
	return (imgurl);
}
