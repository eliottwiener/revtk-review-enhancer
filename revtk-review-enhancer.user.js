// ==UserScript==
// @name         Reviewing the Kanji - Review Enhancer
// @namespace    http://eliott.pw/
// @version      0.1
// @description  Allow some basic customization of the card appearance in reviews.
// @author       Eliott Wiener
// @include      http://kanji.koohii.com/review*
// @grant        none
// ==/UserScript==
var revtkreviewenhancer = (function(){
	"use strict";

	var add_image,
	add_link,
	add_text,
	build_enhancements,
	card_state_changed,
	configs_key,
	current_config_key,
	default_configs,
	default_fonts,
	destroy_enhancements,
	expand_template,
	first_call,
	get_configs,
	get_current_config,
	get_current_config_name,
	gothic_fonts,
	initialize,
	log,
	logging,
	ready,
	readyp,
	set_current_config_name,
	save_config,
	stringify_fonts,
	template_data,
	template_var_mapping,
	update_functions,
	update_template_data,
	version,
	wait;

	version = 0.1;

	logging = true;
	log = function(message){
		if(logging){
			console.log("revtk-review-enhancer: " + message);
		}
	};

	log("started");

	// Got this list from the CSS on beta.jisho.org
	gothic_fonts = [
		"HiraKakuPro-W3",
		"Hiragino Kaku Gothic Pro W3",
		"Hiragino Kaku Gothic Pro",
		"ヒラギノ角ゴ Pro W3",
		"メイリオ",
		"Meiryo",
		"游ゴシック",
		"YuGothic",
		"ＭＳ Ｐゴシック",
		"MS PGothic",
		"ＭＳ ゴシック",
		"MS Gothic",
		"sans",
		"sans-serif"
	];

	default_fonts = [
		"Hiragino Mincho Pro",
		"ヒラギノ明朝 Pro W3",
		"ＭＳ 明朝",
		"ＭＳ Ｐ明朝",
		"serif"
	];

	stringify_fonts = function(fonts){
		// Unlike chrome, firefox does not
		// automatically join and quote an
		// array passed to font-family.
		var string = "'";
		string += fonts.join("','");
		string += "'";
		return string;
	};

	template_var_mapping = {
		"fn": "frame_number",
		"hk": "heisig_keyword",
		"kj": "kanji",
		"sc": "stroke_count",
		"ud": "unicode_codepoint_dec",
		"uh": "unicode_codepoint_hex",
		"ub": "unicode_codepoint_bin",
		"ue": "uri_encoded",
	};

	default_configs = {
		"SVG strokes + jisho link":	{
			"contents": [
				[
					{
						"type": "image",
						"url_template": "https://cdn.rawgit.com/KanjiVG/kanjivg/r20140816/kanji/0%uh.svg",
						"alt_template": "%kj",
						"alt_font": "KanjiStrokeOrders",
						"flex_grow": 10
					},
				],
				[
					{
						"type": "link",
						"url_template": "http://beta.jisho.org/search/%ue%20%23kanji",
						"text_template": "Look up %kj on beta.jisho.org",
						"font": stringify_fonts(gothic_fonts),
						"font_size": "12px"
					}
				]
			]
		},

		"Default-like":	{
			"contents": [
				[
					{
						"type": "text",
						"template": "%kj",
						"font": stringify_fonts(default_fonts),
						"font_size": "15em"
					},
				]
			]
		},

		"Gothic font": {
			"contents": [
				[
					{
						"type": "text",
						"template": "%kj",
						"font": stringify_fonts(gothic_fonts),
						"font_size": "30em"
					}
				]
			]
		},

		"KanjiStrokeOrders font": {
			"contents": [
				[
					{
						"type": "text",
						"template": "%kj",
						"font": "KanjiStrokeOrders",
						"font_size": "30em"
					}
				]
			]
		},

		"Template variables": {
			"contents": Object.keys(template_var_mapping).map(function(k){
				return [
					{
						"type": "text",
						"template": template_var_mapping[k] + " (" + k + "): %" + k,
						"font": default_fonts,
						"font_size": "12px"
					}
				];
			})
		}
	};
	configs_key = "revtk_review_enhancer_configs";
	current_config_key = "revtk_review_enhancer_current_config";
	//if(true || !localStorage[configs_key]){
		localStorage[configs_key] = JSON.stringify(default_configs);
	//}
	get_configs = function(){
		return JSON.parse(localStorage[configs_key]);
	};
	//if(true || !localStorage[current_config_key]){
		localStorage[current_config_key] = "Template variables" || Object.keys(get_configs())[0];
	//}
	get_current_config_name = function(){
		return localStorage[current_config_key];
	};
	get_current_config = function(){
		return get_configs()[get_current_config_name()];
	};
	set_current_config_name = function(config_name){
		localStorage[current_config_key] = config_name;
	};
	save_config = function(config_name, config_contents){
	}

	update_functions = [];

	update_template_data = function(){
		var data,
		frame_number,
		heisig_keyword,
		kanji,
		stroke_count,
		unicode_codepoint_dec,
		unicode_codepoint_hex,
		unicode_codepoint_bin,
		uri_encoded,
		data = window.rkKanjiReview.oReview.getFlashcardData();
		frame_number = data.framenum;
		heisig_keyword = data.keyword.replace(/[^>]*>(.*?)<\/a>$/,"$1");
		kanji = data.kanji;
		stroke_count = data.strokecount;
		unicode_codepoint_dec = kanji.charCodeAt(0);
		unicode_codepoint_hex = unicode_codepoint_dec.toString(16);
		unicode_codepoint_bin = unicode_codepoint_dec.toString(2);
		uri_encoded = encodeURIComponent(kanji);
		template_data = {
			"frame_number": frame_number,
			"heisig_keyword": heisig_keyword,
			"kanji": kanji,
			"stroke_count": stroke_count,
			"unicode_codepoint_dec": unicode_codepoint_dec,
			"unicode_codepoint_hex": unicode_codepoint_hex,
			"unicode_codepoint_bin": unicode_codepoint_bin,
			"uri_encoded": uri_encoded
		};
	};
	expand_template = function(template){
		var expanded_template = template;
		Object.keys(template_var_mapping).map(function(v){
			expanded_template = expanded_template.replace("%"+v, template_data[template_var_mapping[v]]);
		});
		log("expanded template: '" + template + "' -> '" + expanded_template + "'");
		return expanded_template;
	};

	add_text = function(text_config){
		var text = document.createElement("span");
		text.style.fontFamily = text_config.font;
		text.style.textAlign = "center";
		text.style.fontSize = text_config.font_size;
		text.lang = "ja";
		document.getElementById("enhancements").appendChild(text);
		update_functions.push(function(){
			text.textContent = expand_template(text_config.template);
		});
	};

	add_link = function(link_config){
		var link = document.createElement("a");
		link.style.fontFamily = link_config.font;
		link.lang = "ja";
		link.style.textAlign = "center";
		link.style.fontSize = link_config.font_size;
		link.target = "_blank";
		link.className = "JsKeywordLink"; // YUI dark magic
		document.getElementById("enhancements").appendChild(link);
		update_functions.push(function(){
			link.href = expand_template(link_config.url_template);
			link.textContent = expand_template(link_config.text_template);
		});
	};

	add_image = function(image_config){
		var image = document.createElement("img");
		image.style.fontFamily = image_config.alt_font;
		image.style.display = "inline";
		image.style.flexGrow = image_config.flex_grow;
		image.lang = "ja";
		document.getElementById("enhancements").appendChild(image);
		update_functions.push(function(){
			image.src = expand_template(image_config.url_template);
			image.alt = expand_template(image_config.alt_template);
		});
	};

	initialize = function(){
		var enhancements, config_select;
		log("initialize");
		enhancements = document.createElement("div");
		//.framenum", "strokecount.map(function(x){
			//document.getElementById(x).style.visibility="visible";
		//});
		enhancements.id = "enhancements";
		enhancements.style.alignItems = "stretch";
		enhancements.style.display = "flex";
		enhancements.style.flexDirection = "column";
		enhancements.style.height = "100%";
		enhancements.style.justifyContent = "center";
		enhancements.style.visibility = "hidden";
		enhancements.style.width = "100%";
		config_select = document.createElement("select");
		config_select.id = "config_select";
		config_select.style.display = "inline";
		Object.keys(get_configs()).map(function(config_name){
			var option = document.createElement("option");
			option.textContent = option.value = config_name;
			config_select.appendChild(option);
		});
		config_select.value = get_current_config_name();
		config_select.onchange = function(){
			log("config chosen: " + config_select.value);
			set_current_config_name(config_select.value);
			destroy_enhancements();
			build_enhancements();
		};
		document.getElementById("uiFcOptions").appendChild(config_select);
		document.getElementById("kanjibig").style.display = "none";
		document.getElementById("uiFcMain").appendChild(enhancements);
		build_enhancements();
	};

	card_state_changed = function(){
		log("card state changed - updating");
		if(window.rkKanjiReview.oReview.getFlashcardState()){
			document.getElementById("enhancements").style.visibility = "visible";
		} else {
			document.getElementById("enhancements").style.visibility = "hidden";
		}
		update_template_data();
		update_functions.map(function(f){f.call();});
	};

	destroy_enhancements = function(){
		log("destroying enhancements");
		var enhancements = document.getElementById("enhancements");
		while(enhancements.firstChild){
			enhancements.removeChild(enhancements.firstChild);
		}
		update_functions = [];
	};

	build_enhancements = function(){
		log("building enhancements");
		get_current_config().contents.map(function(row){
			row.map(function(i){
				if(i.type === "image"){
					add_image(i);
				} else if(i.type === "text"){
					add_text(i);
				} else if(i.type === "link"){
					add_link(i);
				}
			});
		});
		card_state_changed();
		log("enhancements built");
	};

	first_call = true;
	ready = function(){
		log("ready");
		var orig = window.rkKanjiReview.oReview.setFlashcardState;
		window.rkKanjiReview.oReview.setFlashcardState = function(e){
			orig.call(this,e);
			if(first_call){
				initialize();
				first_call = false;
			}
			card_state_changed();
		};
	};
	readyp = function(){
		log("checking if ready");
		return window.rkKanjiReview.oReview;
	};
	wait = function(check, callback){
		if(check()){
			callback();
		} else {
			window.setTimeout(wait, 500, check, callback);
		}
	};
	wait(readyp, ready);
}());
