
/*
 * 声明:该工具集依赖sea.js库。
 * 该工具用来打点。其对外暴露了三种可供使用的方法:setURL、viewPage和viewEvent。setURL用来设置要提交数据到服务器端的地址。其余两种方法用来执行真正的打点操作，它们都有且仅有一个必选参数（其为一个json对象，该json对象提供给的参数又分为必选和可选两种，具体参数详见相应函数内部的最开始位置。）
 * viewPage:用来对当前页面进行打点。
 * viewEvent:用来对页面中的一些事件进行打点。
 */

(function(){
  var Tool = {},//一些底层的工具函数集
  Hanlder = {},//业务处理函数集
  Track = null;

  Tool.request = function(param){
    var json = {
      url : param.url,
      data : param.data
    };
    if(typeof json.data != "string"){
      var data = json.data;
      var arr = [];

      for(var k in data){
        if(k === 'uri' || k === 'kws'){
          arr.push(k + "=" + encodeURIComponent(data[k]));
        }else{
          arr.push(k + "=" + data[k]);
        }
      }
      kv = arr.join('&');
    }else{
      kv = data;
    };
    if(img){
      img.src = json.url + "?" +kv+"&t=" + new Date().getTime();
    }else{
      var img = new Image();
      img.src = json.url + "?" +kv+"&t=" + new Date().getTime();
    }

  }
  //获取当前浏览器的内核类型及版本号。
  Tool.getBrowserInfo = function() {
    var agent = navigator.userAgent.toLowerCase();
    //alert("agent:"+agent);

    var regStr_ie = /msie [\d.]+;/gi;
    var regStr_ff = /firefox\/[\d.]+/gi
    var regStr_chrome = /chrome\/[\d.]+/gi;
    var regStr_saf = /safari\/[\d.]+/gi;
    var regStr_android = /android\s+[\d.]+/gi;
    var regStr_iphone = /version\/[\d.]+/gi;

    //Android
    if (agent.indexOf("android") > 0) {
      return agent.match(regStr_android)[0];
    }

    //Iphone
    if (agent.indexOf("iphone") > 0) {
      var version = "";
      var iphoneVersion = "iphone";

        if(agent.match(regStr_iphone) && agent.match(regStr_iphone)[0]) {
            version = agent.match(regStr_iphone)[0].replace("version","");
        }
       iphoneVersion = iphoneVersion + version;
      return iphoneVersion;
    }

    //IE
    if (agent.indexOf("msie") > 0) {
      return agent.match(regStr_ie)[0];
    }

    //firefox
    if (agent.indexOf("firefox") > 0) {
      return agent.match(regStr_ff)[0];
    }

    //Chrome
    if (agent.indexOf("chrome") > 0) {
      return agent.match(regStr_chrome)[0];
    }

    //Safari
    if (agent.indexOf("safari") > 0 && agent.indexOf("chrome") < 0) {
      return agent.match(regStr_saf)[0];
    }
  };

  //生成uuid。
  Tool.uuid = function (len, radix){
    var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
      var chars = CHARS, uuid = [], i;

      radix = radix || chars.length;

      if (len) {
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];

      }else {
        var r;
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';
        for (i = 0; i < 36; i++) {
          if (!uuid[i]) {
            r = 0 | Math.random()*16;
            uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
          }
        }
      }
      return uuid.join('');
  };

  //对cookie进行设置、获取和删除的工具集。
  Tool.cookie = {
    setCookie : function(name,value,path,domain){
        var Days = 3*365;
        var exp = new Date();
        exp.setTime(exp.getTime() + Days*24*60*60*1000);
        document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString() + ";path=" + path + ";domain=" + domain + ";";
    },
    getCookie : function(name){
        var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");

        if(arr=document.cookie.match(reg)){
          return unescape(arr[2]);
        }else{
          return null;
        }

    },
    delCookie : function(name){
        var exp = new Date();
        exp.setTime(exp.getTime() - 1);

        var cval=getCookie(name);
        if(cval!=null){
              document.cookie= name + "="+cval+";expires="+exp.toGMTString() + ";";
        }
    }
  };

  //用来对当前页面url后面的参数进行截取，其返回值为一个key\value的json对象。
  Tool.subUrlParams = function(char){//返回值为当前页面url后面的参数以属性、值方式显示的对象，没有任何值则返回null
    var isExistchar = char || undefined;//可选参数

    var json = null,//返回值
      URL=location.href;//当前url

    var URLParamsStr = "",//参数字符串
      URLParamsKVArr = [];//参数对

    if(URL.indexOf("?") == -1){
      return json;
    }

    if(isExistchar != undefined){
      URLParamsStr=URL.substring(URL.indexOf("?")+1,URL.indexOf(isExistchar));
    }else{
      URLParamsStr=URL.substring(URL.indexOf("?")+1);
    }

    if(URLParamsStr.indexOf("&") != -1){
      URLParamsKVArr = URLParamsStr.split("&");
    }else{
      URLParamsKVArr.push(URLParamsStr);
    }

    var jsonStr = "{",
      json = null;

    for(var i=0;i<URLParamsKVArr.length;i++){

      var arr = URLParamsKVArr[i].split("=");

      if(i != (URLParamsKVArr.length-1)){
        jsonStr += "'" + arr[0] + "':'" + arr[1] + "',";
      }else{
        jsonStr += "'" + arr[0] + "':'" + arr[1] + "'";
      }
    }
    jsonStr += "}";

    json = eval("("+jsonStr+")");

    return json;
  };

  //对PC端进行业务处理的分支。
  Hanlder.websiteHanlder = function(json){
    var data = {
      kid:"",
      src:"",
      uid:"",
      ref:"",
      kws:"",
      gid:"",
      vid:""
    };

    var self = this;
    var kid =  Tool.cookie.getCookie("_uc_id_");

    if(kid){
      data.kid = kid;//
    }else{
      kid = "_uc_id__" + Tool.uuid();
      Tool.cookie.setCookie("_uc_id_",kid, "/", ".tongbanjie.com");
      //Tool.cookie.setCookie("_uc_id_",kid, "/", "192.168.1.109");

      data.kid = kid;
    }


    if(window.hasOwnProperty("initParam")&&window.initParam.hasOwnProperty("kid")){
      if(!!window.initParam.kid){
        data.kid = window.initParam.kid;
      }
    }

    var src = Tool.cookie.getCookie("channel");
    if(src){
      data.src = src;
    }else{
      var utm_source = undefined;
      var URLParams = Tool.subUrlParams();

      if(URLParams){
        utm_source = URLParams.utm_source;
      };

      if(utm_source){
        Tool.cookie.setCookie("utm_source",utm_source, "/", ".tongbanjie.com");

        data.src = utm_source;
      }
    };

    var metas = document.getElementsByTagName("meta");

    for(var i = 0 ;i < metas.length ; i++){
      if(metas[i].name && metas[i].name == "keywords"){
        data.kws = metas[i].content;
      };
    }

    data.uid = json.uid;//
    data.gid = json.gid;//

    if(document.referrer){
      data.ref = document.referrer || "";
    }
    return data;
  };

  //对手机端进行业务处理的分支。
  Hanlder.phoneHanlder = function(json){
    var data = {
      kid:"",
      src:"",
      uid:"",
      ref:"",
      kws:"",
      gid:"",
      vid:""
    };

    var self = this;

    data.kid = json.deviceID + Tool.uuid(); //设备唯一标识客户端如何和webview里面保持一致
    data.uid = json.uid;
    data.gid = json.gid;
    data.vid = json.vid;

    if(window.hasOwnProperty("initParam")&&window.initParam.hasOwnProperty("kid")){
      if(!!window.initParam.kid){
        data.kid = window.initParam.kid;
      }
    }
  };

  //主业务逻辑
  Track = function(params){
    var json = {
      tid:params.tid,
      type:params.type
    }

    this.tid = json.tid;
    this.type = json.type;//其值为website、plugin等

    this.pid = Tool.uuid() + 10*Math.random();
    this.url = "//ta.tongbanjie.com/bi_tbj.gif";

  };

  Track.prototype.setURL = function(url){//
    this.url = url;
  };

  Track.prototype.pageView = function(param){//页面打点
    var json = {//调用该函数需要传递的参数集，其分为必选和可选两种
      lcm : param.lcm || "",//活动id
      deviceID : param.deviceID || "",//设备id
      uid : param.uid || "",//用户id
      gid : param.gid || "",//商品id
      vid : param.vid || ""//客户端版本号
    };

    //无法得到:net、ref
    var model={
      tid:"",//当前域标示，其值为500、900等等                     h
      kid:"",//设备号+uuid,PC上为_uc_id_    t c
      uat:"",//访问者使用的手机型号或者浏览器类型号
      sys:"",//系统版本号:内核版本号          c
      src:"",//本次请求的来源，仅PC上才有     c
      scr:"",//屏幕分辨率                     c
      lcm:"",//活动ID号                       h
      uid:"0",//user_id                       t
      uri:"",//当前url                        c
      ref:"",//父页面url                      t
      kws:"",//关键词，仅官网有、论坛等等才有 c
      gid:"",//产品id                         t
      pid:"",//当前页面id                     c
      net:"",//网络                           e
      vid:"",//客户端版本号                   t
      res:"",//预留字段
      log: "pv"
    };

    var self = this,
        data = null;

    model.tid = self.tid;

    // if(model.tid == 600){//600为手机端
    //   data = Hanlder.phoneHanlder(json);//kid、src、uid、uri、ref、kws、gid、vid
    // }else if(model.tid == 700 | model.tid == 800 | model.tid == 900 | model.tid == 950 model.tid == 500){
    //   data = Hanlder.websiteHanlder(json); //900为手机端，也进入此处！！！
    // };

    if(self.type == "website"){
      data = Hanlder.websiteHanlder(json);
    }else if(self.type == "plugin"){
      data = Hanlder.phoneHanlder(json);
    }

    model.kid = data.kid;
    model.sys = navigator.platform;
    model.uat = Tool.getBrowserInfo();
    model.src = data.src;
    model.scr = screen.width +" x "+screen.height;
    model.lcm = json.lcm;//h
    model.uid = data.uid;//t
    model.uri = location.href;
    model.ref = data.ref;
    model.kws = data.kws;
    model.gid = data.gid;
    model.vid = data.vid;
    model.pid = self.pid;

    Tool.request({
      url:self.url,
      type:"jsonp",
      data:model,
      success:function(result){
        alert("finsh");
      },
      error:function(result){

      }
    });
  };

  Track.prototype.eventView = function(param){//事件打点。注:事件打点依赖于页面打点。
    var json = {
      cat : param.cat,   //事件类别:从view，downloads,exit,enter,input中选一个。
      act : param.act,   //事件内容：即具体发生的事件，像click、tap等等。
      lab : param.lab || "",   //事件发生前按钮的值
      val : param.val || "",   //事件发生后按钮的值
      cva : param.cva || ""   //自定义值。
    };

    var model={
      log:"evt",
      tid:"",//域标示                    h
      cat:"",//事件类别                  h view，downloads,exit,enter,input
      act:"",//事件内容,即具体的事件     h
      lab:"",//事件对象
      val:"",//事件值
      cva:"",//用户自定义值              //
      pid:""//
    };

    var self = this;
    model.cat = json.cat;
    model.act = json.act;
    model.lab = json.lab;
    model.val = json.val;
    model.cva = json.cva;

    model.tid = self.tid;

    model.pid = self.pid;

    Tool.request({
      url:self.url,
      data:model
    });
  };

  var TBJ_TRACK = Track;

  if(typeof define =="function"){
    define(function(require, exports, module){
      module.exports = TBJ_TRACK;
    });
  }else{
    window.TBJ_TRACK = TBJ_TRACK;
  }
})();