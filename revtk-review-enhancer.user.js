// ==UserScript==
// @name         Reviewing the Kanji - Review Enhancer
// @namespace    http://eliott.pw/
// @version      0.1
// @description  Allow some basic customization of the card appearance in reviews.
// @author       Eliott Wiener
// @match        http://kanji.koohii.com/review*
// @grant        none
// ==/UserScript==

// Got this list from the CSS on beta.jisho.org
var gothic_fonts = [
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

var default_config = {
    "text": [
        {
            "template": "%k",
            "font": JSON.stringify(["KanjiStrokeOrders"].concat(gothic_fonts)),
            "enabled": false
        },
        {
            "template": "%k",
            "font": JSON.stringify(gothic_fonts),
            "enabled": false
        }
    ],
    "images": [
        {
            "url_template": "https://cdn.rawgit.com/KanjiVG/kanjivg/r20140816/kanji/0%uh.svg",
            "width": "50%",
            "height": "50%",
            "alt_template": "%k",
            "alt_font": JSON.stringify(["KanjiStrokeOrders"]),
            "enabled": true
        }
    ],
    "links": [
        {
            "url_template": "http://beta.jisho.org/search/%k%20%23kanji",
            "text_template": "Look up %k on beta.jisho.org",
            "font": JSON.stringify(gothic_fonts),
            "enabled": true
        }
    ]
};

var template_data;
var template_var_mapping = {
    "h": "keyword",
    "k": "kanji",
    "f": "frame",
    "ud": "unicode_codepoint_dec",
    "uh": "unicode_codepoint_hex"
};
var update_template_data = function(){
    var data = window.rkKanjiReview.oReview.getFlashcardData();
    var keyword = data["keyword"].replace(/>.*?<\/a>$/,/\1/);
    var kanji = data["kanji"];
    var frame = data["frameNum"];
    var unicode_codepoint_dec = kanji.charCodeAt(0);
    var unicode_codepoint_hex = unicode_codepoint_dec.toString(16);
    template_data = {
        "keyword": keyword,
        "kanji": kanji,
        "frame": frame,
        "unicode_codepoint_dec": unicode_codepoint_dec,
        "unicode_codepoint_hex": unicode_codepoint_hex
    }
};
var expand_template = function(template){
    var expanded_template = template;
    Object.keys(template_var_mapping).map(function(v){
        expanded_template = expanded_template.replace("%"+v, template_data[template_var_mapping[v]]);
    });
    return expanded_template;
};

var add_text = function(template, font){
    var text = document.createElement("span");
    text.style.fontFamily = font;
    text.lang = "ja";
    document.getElementById("text_box").appendChild(text);
    var update = function(){
        text.innerText = expand_template(template);
    };
    update_functions.push(update);
};

var add_link = function(url_template, text_template, font){
    var link = document.createElement("a");
    link.style.fontSize = "12px";
    link.style.fontFamily = font;
    link.target = "_blank";
    link.className = "JsKeywordLink"; // YUI dark magic
    document.getElementById("link_box").appendChild(link);
    var update = function(){
        link.href = expand_template(url_template);
        link.innerText = expand_template(text_template);
    };
    update_functions.push(update);
};

var add_image = function(url_template, alt_template, alt_font, width, height){
    var image = document.createElement("img");
    image.style.fontFamily = alt_font;
    image.style.width = width;
    image.style.height = height;
    image.style.display = "block";
    image.style.margin = "auto";
    document.getElementById("image_box").appendChild(image);
    var update = function(){
        image.src = expand_template(url_template);
        image.alt = expand_template(alt_template);
    };
    update_functions.push(update);
};

var initialize = function(){
    console.log("init");
    var kanjibig = document.getElementById("kanjibig")
    kanjibig.style.position = "initial !important";
	kanjibig.style.top = "0px !important";
    kanjibig.style.marginTop = "0px !important";
    var original_kanji = document.getElementsByClassName("fcData-kanji")[0];
    var card = original_kanji.parentNode;
    original_kanji.style.display = "none";
    var enhancements = document.createElement("div");
    enhancements.id = "enhancements";
    card.appendChild(enhancements);
    build_enhancements();
};

var destroy_enhancements = function(){
    enhancements.childNodes.map(function(x){x.remove()});
    update_functions = [];
};

var config;
var build_enhancements = function(){
    var enhancements = document.getElementById("enhancements");
    var image_box = document.createElement("div");
    image_box.id = "image_box";
    enhancements.appendChild(image_box);
    config["images"].map(function(i){
        if(i["enabled"]){
            add_image(i["url_template"], i["alt_template"], JSON.parse(i["alt_font"]), i["width"], i["height"]);
        }
    });
    var text_box = document.createElement("div");
    text_box.id = "text_box";
    enhancements.appendChild(text_box);
    config["text"].map(function(t){
        if(t["enabled"]){
            add_text(t["template"], JSON.parse(t["font"]));
        }
    });
    var link_box = document.createElement("div");
    link_box.id = "link_box";
    enhancements.appendChild(link_box);
    config["links"].map(function(l){
        if(l["enabled"]){
            add_link(l["url_template"], l["text_template"], JSON.parse(l["font"]));
        }
    });
};

var update_functions = [];
var card_state_changed = function(){
    update_template_data();
    update_functions.map(function(f){f.call();});
};

var config_key = "revtk_review_enhancer_config";
var configUpdated = function(){
    localStorage[config_key] = JSON.stringify(config);
    // re-init card display
};
var getConfig = function(){
    return JSON.parse(localStorage[config_key]);
};
var config = default_config; //getConfig() || default_config;

var first_call = true;
var orig = window.rkKanjiReview.oReview.setFlashcardState;
window.rkKanjiReview.oReview.setFlashcardState = function(e){
    orig.call(this,e);
    if(first_call){
        initialize();
        first_call = false;
    }
    card_state_changed();
};
