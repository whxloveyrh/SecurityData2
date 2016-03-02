IDG = window.IDG || {};

IDG.insiderReg ={
		
		url_param : "?json=",
		
	
		checkEmail : function(email) {
			if(email== undefined || ! email.length > 0){
				IDG.insiderReg.log("Invalid Email");
				return false;
			}
			var re = /^([\w-\+]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
		    return re.test(email);
		},
		
				
		validateFormData: function(formId){
			var returnVal=true;
			IDG.insiderReg.log("Validating Data")
			var emailAddress=decodeURIComponent($("#insider-register-form-full input[name=email]").val());
			$("#insider-register-form-full input[name=email]").val(emailAddress);
			if (! IDG.insiderReg.checkEmail(emailAddress)){
				IDG.insiderReg.log("Invalid email");
				//IDG.insiderReg.displayInputErrorField('email');
				returnVal= false;
			}
			var fieldDataObject=IDG.insiderReg.formData(formId);
			for(var key in fieldDataObject){ 
				if(fieldDataObject[key] == undefined || fieldDataObject[key].length <= 0 ){
					IDG.insiderReg.log("Invalid value for "+key);
					IDG.insiderReg.displayInputErrorField(key);
					$('.'+key+'-field .select2-choice').addClass('err-msg-grad');
					returnVal=false;
				}	
			}
			return returnVal;
		},
		
		// checks if log is enabled
		logEnabled:function(){
			if(window.console != undefined  && window.console.log !=undefined ){
				if(typeof(regDebugLog) !== 'undefined' && regDebugLog == true){
					return true
				}
			}
			return false;
		},
		
		// log data to console
		log: function(dataLog){
			if(dataLog != undefined){
				if(IDG.insiderReg.logEnabled()) {
					console.log(dataLog);
				}
			}
		},
		
		// submit the form to reg api
		submitForm:function(formId,apiUrl){
			$('#insider-popup.modal-box .modal-body .insider-register .loading-icon').css('display','block');
			$.ajax({ 
				method:"GET",
				crossDomain :true,
				url : apiUrl.concat(IDG.insiderReg.url_param)+IDG.insiderReg.jsonParam(formId),
				dataType:"json",
			}).done(function(data){
				IDG.insiderReg.log("form submit success")
				if(data.status == "success")
				 {
					IDG.insiderReg.handleSuccess(data);
				 }
				else if(data.status == "usernotfound"){
					IDG.insiderReg.handleNewUser(data)
				}
				else if(data.status == "incompletedata"){
					IDG.insiderReg.log(data.validationErrors);
					if(formId=='insider-register-form-short'){
						IDG.insiderReg.serverValidationShortForm();
					}else if(formId=='insider-register-form-full'){
						IDG.insiderReg.serverValidationMessages(data.validationErrors);
					}
				}
				return true;
			})
			.fail(function(data){
				//add error handling page if decided
				IDG.insiderReg.log(data);
				return false;
			});
		},
		
		// handle status value success returned in api call
		handleSuccess: function(data){
			var requestData={};
			var jsonObject=data.userData;
			requestData['def']='insider-reg-thankyou';
			for(var key in jsonObject){
				var keyValue='';
				if(jsonObject[key] && jsonObject[key] != 'null' ){
					keyValue=jsonObject[key];
				}
				requestData[key]=encodeURIComponent(keyValue);
			}
			IDG.insiderReg.displayNextStep(requestData);
			//window.location.reload();				
		},
		// handle case when user not found
		handleNewUser :function(data){
			var requestData={};
			
			requestData['def']='insider-reg-form-full';
			requestData['email']=encodeURIComponent(data.userData.email);
			IDG.insiderReg.displayNextStep(requestData);

		},
		
		// calls zip code reg service to get zip code detailed info
		zipService:function(){
			var pcVal=$("#insider-register-form-full input[name=postalCode]").val();
			if( !IDG.insiderReg.isEmpty(pcVal)){
				var zo={postalCode:pcVal};
				IDG.insiderReg.log("trigger zip service");
				var zipUrl= regApiUrl.concat("geodata/location/").concat(JSON.stringify(zo));
				IDG.insiderReg.callService(zipUrl,IDG.insiderReg.onZipSuccess,IDG.insiderReg.onZipFail,"json");
			}
		},
		
		jTService: function(){
			var jobtitle = $("#insider-register-form-full input[name=personalJobTitle]").val().replace(/(<([^>]+)>)/ig,"");
			$("#insider-register-form-full input[name=personalJobTitle]").val(jobtitle);
			jobtitle = jobtitle.replace(/\?/ig,"");
			jobtitle = jobtitle.replace(/#/ig,"");
			if(!IDG.insiderReg.isEmpty(jobtitle)){
				IDG.insiderReg.log("trigger job title service");
				var jtUrl= regApiUrl.concat("jobdata/").concat(jobtitle);
				IDG.insiderReg.callService(jtUrl,IDG.insiderReg.onJtSuccess,IDG.insiderReg.onJtFail,"json");
				
			}
		},
		
		formData:function(formId){
			var dataObject= {};
		    var id="#"+formId ;
		    var formElements = $(id).serializeArray();
		    $.each(formElements, function() {
			        if (dataObject[this.name] !== undefined) {
			            if (!dataObject[this.name].push) {
			            	dataObject[this.name] = [dataObject[this.name]];
			            }
			            dataObject[this.name].push(this.value || '');
			        } else {
			        	dataObject[this.name] = this.value || '';
			        }
			    });
		    if(brandCode){
		    	dataObject['brand']=brandCode;
		    }
			return dataObject;	
		},
		readJsonString : function(jsonString){
			IDG.insiderReg.log("read json string and create object");
				var obj = $.parseJSON(jsonString);
				return obj;
		},
		
		jsonParam :function(formId){
			var jsonParam=IDG.insiderReg.formData(formId);
				jsonParam['matchPhase']=IDG.insiderReg.stringValue($("#matchPhase").val());
				jsonParam['contentUrl']=IDG.insiderReg.stringValue(window.location.href);
				try{
					jsonParam['elqguid']=IDG.insiderReg.stringValue(GetElqCustomerGUID());
				}catch(err){
					IDG.insiderReg.log("error getting elg guid");
				}
				jsonParam['contentType']=IDG.insiderReg.stringValue(insiderContentType);
				var json=JSON.stringify(jsonParam);
				return encodeURIComponent(json);
			},
			
			stringValue: function(value){
				if(value != undefined && value != null){
					return value;
				}else{
					return '';
				}
			},
		
		callService:function(urlValue,onSuccess,onFail,dType){
			$.ajax({ 
				url : urlValue,
				method:"GET",
				timeout: 3000,	
				dataType:dType,
			}).done(onSuccess).fail(onFail);
		},
		
		
		onZipSuccess:function(data,status){
			try{
				var values=IDG.insiderReg.parseZipData(data);
				var value = values[0];
				IDG.insiderReg.log(value.city.concat("-").concat(value.state).concat("-").concat(value.country).concat("-").concat(value.postalCode));
				if( IDG.insiderReg.isEmpty(value.city)|| IDG.insiderReg.isEmpty(value.state) || IDG.insiderReg.isEmpty(value.country) ){
					IDG.insiderReg.showLocFields();
				}
				$("#insider-register-form-full input[name=city]").val(value.city);
				if(IDG.insiderReg.isEmpty(value.state)){
					$("#insider-register-form-full input[name=state]").val("Non-U.S.");
				}else{
					$("#insider-register-form-full input[name=state]").val(value.state);
				}	
				$("#country").val(value.country);
				$("#country").select2().trigger('change');	
			}catch(err){
				IDG.insiderReg.showLocFields();
			}
		},
		
		onZipFail:function(data,status){
			// show city and country fields
			$("#insider-register-form-full input[name=state]").val("Non-U.S.");
			$("#insider-register-form-full input[name=city]").val("");
			$("#country").val('');
			$("#country").select2().trigger('change');
			$('#country').select2({
		    	placeholder: "country",
		    	minimumResultsForSearch: Infinity,
		    	allowClear: true
		    });
			// display city and country fields only when postal code not
			// recognized as US
			IDG.insiderReg.showLocFields();
			
		},
		
		onJtSuccess: function(data){
			var values=IDG.insiderReg.parseJobData(data);
			var value=values[0];
			IDG.insiderReg.log(JSON.stringify(value));
			if(value !==undefined && value.matchphase =="NO_MATCH"){
				// show fields job position and function
				$("#matchPhase").val("NO_MATCH");
				IDG.insiderReg.showTooltipJobs();
				
				$("#companySize").select2('close'); //this successfully closes dropdown on company size
				IDG.insiderReg.companySizeFieldBlur(); // this initially blurs the field
				$('.insider-register.full form .info-bubble.jobs').css('display','block'); // this displays the info bubble
				
				// hide tool tip on click or select
				IDG.insiderReg.hideTooltipJobs();
				
				if (navigator.userAgent.match(/(iPad)/)) {
					$("#insider-register-form-full #full-submit").focus().addClass('focused');
				} else {
					$("#insider-register-form-full #jobPosition").focus();
				}

				IDG.insiderReg.companySizeFieldBlur();
			}
			else{
				// set Job Position Value
				if(! IDG.insiderReg.isEmpty(value.position)) {
					IDG.insiderReg.log("Setting job position "+value.position);
					$("#jobPosition").val(value.position);
					$("#jobPosition").select2().trigger('change');
				}else{
					// show job position field
					IDG.insiderReg.showTooltipJobs();
					
					$("#companySize").select2('close'); //this successfully closes dropdown on company size
					IDG.insiderReg.companySizeFieldBlur(); // this initially blurs the field
					$('.insider-register.full form .info-bubble.jobs').css('display','block'); // this displays the info bubble
					
					// hide tool tip on click or select
					IDG.insiderReg.hideTooltipJobs();
					
					if (navigator.userAgent.match(/(iPad)/)) {
						$("#insider-register-form-full #full-submit").focus().addClass('focused');
					} else {
						$("#insider-register-form-full #jobPosition").focus();
					}

					IDG.insiderReg.companySizeFieldBlur();
					// hide tool tip on click or select
					IDG.insiderReg.hideTooltipJobs();
				}	
				// set Job Function Value
				if(! IDG.insiderReg.isEmpty(value.jobFunction)){
					$("#jobFunction").val(value.jobFunction);
					$("#jobFunction").select2().trigger('change');
				}else{
					// show job function field
					IDG.insiderReg.showTooltipJobs();
					// hide tool tip on click or select
					IDG.insiderReg.hideTooltipJobs();
				}
				$("#matchPhase").val(value.matchphase);
			}
		},
		
		onJtFail: function(data){
			//set match pase and show missing fields 
			$("#matchPhase").val("NO_MATCH");
			IDG.insiderReg.showJTFields();
		},
		
		parseJobData: function(data) {
			var values = [];
			if (data != null) {
				var results = data.results;
				if (results.length > 0) {
					var result = results[0];
					var jobTitleData = { 
						position: result.jobTitleFacts.position, 
						jobFunction: result.jobTitleFacts.function,
						matchphase: result.matchPhase.type
					};
					values.push(jobTitleData);
				}			
			}
			return values;
		},
		
		parseZipData: function(data) {
			var values = [];
			if (data != null) {
				var results = data.results;
				if (results.length > 0) {
					var result = results[0];
					var locations = result.locations;
					var location = locations[0];
					var address = { 
						postalCode: location['postalCode'], 
						city: location['primaryCity'], 
						state: location['stateAbbreviation'], 
						country: 'United States of America' 
					};
					values.push(address);
				}			
			}
			return values;
		},
		
		
		formatPhone:function() {
			jQuery(function($){
				$("#insider-register-form-full input[name=phone]").mask("(999) 999-9999",{placeholder:" ", autoclear: false});
			});
		},

		formatUSZip:function() {
			jQuery(function($){
				$("#insider-register-form-full input[name=postalCode]").mask("99999?-9999",{placeholder:" "});
			});	
		},

		formatPostalCode: function(){
			jQuery(function($){
				$("#insider-register-form-full input[name=postalCode]").mask("a9a 9a9",{placeholder:" "});
			});
		},
		
		clearFormat:function() {
			$("#insider-register-form-full input[name=phone]").unmask();
			$("#insider-register-form-full input[name=postalCode]").unmask();
		},
		
		
		
		displayNextStep: function(requestData){
			$.get( "/napi/tile" 
					,requestData ,
					"html"
				).done(function(data) {
					$('#insider-popup .modal-body').empty();
					if(!$thm.deviceWidthAtLeast($thm.deviceBreakpoints.tablet)){
						$("html, body").animate({
				            scrollTop: 0
				        }, 700);
					}
					$('#insider-popup .modal-body').prepend(data).hide().fadeIn();			
				});
	
		},
		
		
		fullFormAttachEvents:function(){
			var inputFieldList=['firstName','lastName','company','address1','postalCode','city','phone','personalJobTitle'];
			var selectFieldList=['country','jobPosition','jobFunction','companySize','industry'];
			
			var selectArray = {'country': 'country', 'jobPosition': 'position', 'jobFunction': 'function', 'companySize': 'company size', 'industry': 'industry'};
			for(var key in selectArray)
			{
			  $('#'+key).select2({
					placeholder: selectArray[key],
					minimumResultsForSearch: Infinity,
					allowClear: true
				});
			};
				

			$('#insider-register-form-full').submit(function(e) {
				e.preventDefault();
					if(IDG.insiderReg.validateFormData('insider-register-form-full')){
					var regUrl=regApiUrl.concat("reg/").concat(brandCode).concat("/insider/").concat("200037121");
					IDG.insiderReg.submitForm('insider-register-form-full',regUrl);
				}	
			});
			
			
			$.each(inputFieldList,function(index,value){
				$("#insider-register-form-full input[name="+value+"]").focusout(function(){
					var fieldNameVal=$("#insider-register-form-full input[name="+value+"]").val();
					fieldNameVal = $.trim(fieldNameVal);
					if(fieldNameVal == undefined || fieldNameVal.length <= 0){		
						IDG.insiderReg.displayInputErrorField(value);			
						$('.'+value+'-field input').val('');
					} else {
						IDG.insiderReg.hideInputErrorField(value);
					}
				});
			});
			
			$.each(selectFieldList,function(index,value){
				$("#insider-register-form-full ."+value+"-field").on("select2-close select2-blur", function(e){
					var fieldVal=$("#insider-register-form-full #"+value +"").val();
					if(fieldVal == undefined || fieldVal.length <= 0){
						IDG.insiderReg.displaySelectError(value);
					} else {
						IDG.insiderReg.hideSelectError(value);
					}
				});
			});
			

			$('select').on('select2-focus', function(){
				$('.insider-register.full form .info-bubble.jobs').css('display','none');
				$("#insider-register-form-full #full-submit").removeClass('focused');
			});
			
			$("#insider-register-form-full input[name=postalCode]").focusout(function(){
				IDG.insiderReg.zipService();
			});
			$("#insider-register-form-full input[name=personalJobTitle]").focusout(function(){
				IDG.insiderReg.jTService();
			});

			$("#country").change(function(){	
				if ($(this).val() == "Canada") { 
					IDG.insiderReg.formatPostalCode();
					IDG.insiderReg.formatPhone();
					$('.insider-register form .us-disclaimer').css('display','none');
					$('.insider-register form .disclaimer').css('display','block');
					
					$("#insider-register-form-full input[name=phone]").focusout(function(){
						var phoneVal=$("#insider-register-form-full input[name=phone]").val();
						phoneVal = $.trim(this.value);			
						var reVal = new RegExp(/\(\d{3}\)[\s]\d{3}[-]\d{4}/);
						var match = reVal.test(phoneVal);
						if(phoneVal == undefined || phoneVal.length <= 0 || match == false){
							IDG.insiderReg.displayInputErrorField('phone');
						} else {
							IDG.insiderReg.hideInputErrorField('phone');
						}
					});
				} 
				else if ($(this).val() == "United States of America") { 
					IDG.insiderReg.formatUSZip();
					IDG.insiderReg.formatPhone();
					$('.insider-register form .us-disclaimer').css('display','block');
					$('.insider-register form .disclaimer').css('display','none');

					$("#insider-register-form-full input[name=phone]").focusout(function(){
						var phoneVal=$("#insider-register-form-full input[name=phone]").val();
						phoneVal = $.trim(this.value);			
						var reVal = new RegExp(/\(\d{3}\)[\s]\d{3}[-]\d{4}/);
						var match = reVal.test(phoneVal);
						if(phoneVal == undefined || phoneVal.length <= 0 || match == false){
							IDG.insiderReg.displayInputErrorField('phone');
						} else {
							IDG.insiderReg.hideInputErrorField('phone');
						}
					});

				}
				else {
					IDG.insiderReg.clearFormat();
					$('.insider-register form .disclaimer').css('display','none');
					$('.insider-register form .us-disclaimer').css('display','block');
				}	
			});
			
		},
		
		registerLinkEvent:function(tilesDef){
			var requestData={};
			requestData['def']=tilesDef;
			IDG.insiderReg.displayNextStep(requestData);
		},
		
		addInitFormEvents:function(){
			  $('#insider-register-form-short').submit(function(e) {
				// validate email
				  e.preventDefault();
				var emailAddress = $("#insider-register-form-short input[name=email]").val();
				if ( ! IDG.insiderReg.checkEmail(emailAddress)){
					// show error messages
					IDG.insiderReg.log("Invalid email");
					$('.email-field input').addClass('err-msg-grad');
					if(!$thm.deviceWidthAtLeast($thm.deviceBreakpoints.tablet)){
						$('.email-field .mob.err-msg').css('display','block');
					} else {
						$('.email-field .tab.err-msg').css('display','block');
					}
					return false;			
				}
					var regUrl=regApiUrl.concat("reg/").concat(brandCode).concat("/insider/").concat("200037121/email");
					IDG.insiderReg.submitForm("insider-register-form-short",regUrl);				
				
			});
			
		},
		
		addSignInEvents:function(){
			  $('#insider-signin-form').submit(function(e) {
				// validate email
				  e.preventDefault();
				var emailAddress = $("#insider-signin-form input[name=email]").val();
				if ( ! IDG.insiderReg.checkEmail(emailAddress)){
					// show error messages
					IDG.insiderReg.log("Invalid email");
					$('.insider-signin form span.err-msg').css({'display': 'block'});
					$('.insider-signin form > input').addClass('err-msg-grad');
					return false;			
				}
					var regUrl=regApiUrl.concat("reg/").concat(brandCode).concat("/insider/").concat("200037121/email");
					IDG.insiderReg.signIn("insider-signin-form",regUrl);				
					
			});
			
		},
		
		signIn:function(formId,apiUrl){
			 $('#insider-popup.modal-box .modal-body .insider-signin .loading-icon').css('display','block');
			$.ajax({ 
				method:"GET",
				url : apiUrl.concat(IDG.insiderReg.url_param)+IDG.insiderReg.jsonParam(formId),
				dataType:"json",
			}).done(function(data){
				IDG.insiderReg.log("form submit success")
				if(data.status == "success")
				 {
					IDG.insiderReg.addToken(brandName,data.userData.email,1,data.userData.firstName,data.userData.idgEid);
					$(".modal-overlay").fadeOut(600, function() {
						$(".modal-overlay").remove();
					});
					$("#insider-popup.modal-box").fadeOut(600,function(){
						//Chrome pulls from browser cache instead of fresh stuff
						if( navigator.userAgent.toLowerCase().indexOf('chrome') > -1 ){
							var splitexp = /(#|\?)/g;
					    	var newURL = window.location.href.split(splitexp)[0];
					    	if( (notEmptyArticle && isInsiderPremium) || (notEmptyMediaResource && isResourceInsiderPremium) ) {
					    		if(window.location.href.indexOf('?upd=') != -1 || window.location.href.indexOf('?nsdr=') != -1 ) {
						    		newURL = window.location.href.split("?")[0];
						    	}
					    		window.location.replace(newURL+ '?upd='+$.now());
					    	} else {
					    		window.location.replace(newURL);
					    	}
						} else {
							window.location.reload(true);
						}
					});
					//sign in success, load personalization
				 }
				else if(data.status == "usernotfound"){
					$('#insider-popup.modal-box .modal-body .insider-signin .loading-icon').css('display','none');
					//show message to register
					$('.insider-signin form > input').addClass('err-msg-grad');
					$('.insider-signin form .info-bubble').css('display','block');
					$('.insider-signin form span.err-msg').css('display','none');
					$('body').click(function() {
					  $('.insider-signin form .info-bubble').css('display','none');
					});
				}
				else if(data.status =='incompletedata'){
					$('#insider-popup.modal-box .modal-body .insider-signin .loading-icon').css('display','none');
					$('.insider-signin form span.err-msg').css({'display': 'block'});
					$('.insider-signin form > input').addClass('err-msg-grad');
				}
				return true;
			})
			.fail(function(data){
				alert("error occured"+data) 
				IDG.insiderReg.log(data);
				return false;
			});
			
		},
		
		addToken:function(brandName,email,tVal,fnm,id){
			if(brandName){			
				var data={};
				data['emailadd']=email;
				data['token']=tVal;
				if(fnm== undefined || fnm == null){
					fnm='';
				}
				data['fname']=fnm;
				data['id']=id;
				//var params=$.param(data);
				//var tUrl=IDG.insiderReg.tokenUrl(brandName.toLowerCase(),tokenPrefix,tokenSuffix).concat("?").concat(params);
				//IDG.insiderReg.log("token url "+tUrl);
				IDG.insiderReg.createCookie('nsdr','em='.concat(email).concat('|tkn=1|').concat('fnm=').concat(fnm),brandDomain);
				//IDG.insiderReg.callService(tUrl,IDG.insiderReg.aTokenSuccess,IDG.insiderReg.aTokenFail,"html");	
			}	
		},
		
		aTokenSuccess:function(data,status){
			IDG.insiderReg.log("token added succesfully"+status)
		},
		
		aTokenFail:function(data,status){
			IDG.insiderReg.log("add token failed"+status)
		},
		
		tokenUrl:function(key,prefix,suffix){
			var urlString='';
			if(prefix && suffix && key){
				urlString =prefix.concat(key).concat(suffix);
			}
			return urlString;
		},
		
		 
		stepReg: function(){
			var token=IDG.insiderReg.readCookie("nsdr");
			if(token){
				var tokenVals=IDG.insiderReg.readCookieProperty(token);
				if(tokenVals && tokenVals['tkn'] !=undefined && tokenVals['tkn']==0){
					IDG.insiderReg.log('starting step reg');
					var emailAdd=tokenVals['em'];
					IDG.insiderReg.submitStepReg(emailAdd);		
				}

			}
		},
		 
		
		submitStepReg: function(email){
			var regUrl=regApiUrl.concat("reg/").concat(brandCode).concat("/insider/").concat("200037121/email");
			$.ajax({ 
				method:"GET",
				crossDomain :true,
				url : regUrl.concat(IDG.insiderReg.url_param)+IDG.insiderReg.stepRegData(email),
				dataType:"json",
			}).done(function(data){
				IDG.insiderReg.log(data);
				IDG.insiderReg.addToken(brandName,data.userData.email,1,data.userData.firstName,data.userData.idgEid);
			})
			.fail(function(data){ 
				IDG.insiderReg.log(data);
				return false;
			});

		},
		
		stepRegData:function(email){
			var data={};
			data['email']=email;
			data['contentUrl']=IDG.insiderReg.stringValue(window.location.href);
			data['contentType']=IDG.insiderReg.stringValue(insiderContentType);
			try{
			data['elqguid']=IDG.insiderReg.stringValue(GetElqCustomerGUID());
			}catch(err){
				IDG.insiderReg.log("error gettng elq id");
			}
			var jsonData=JSON.stringify(data);
			return	encodeURIComponent(jsonData);
		},
		
		readCookieProperty:function(cookieValue){
			var returnVal={}; 
			if(typeof(cookieValue) !== 'undefined' && cookieValue.length > 0){
			if(cookieValue.indexOf('fnm=') <= -1){
				returnVal['fnm']='';
			}
			if(cookieValue.indexOf('id=') <= -1){
				returnVal['id']='';
			}
			var cValAr=	 cookieValue.split('|');
				$.each(cValAr,function(index,value){
					if(value.indexOf('=') > -1){
						var val=value.split('=');
						var key=decodeURIComponent(val[0]);
						var kval=decodeURIComponent(val[1]);
					}else{
						//handle old insider tokens 
						if(index == 0){
							var key='em';
							var kval=value;
						}
						if(index == 1){
							var key='tkn';
							var kval=value;
						}
					}
					returnVal[key]=kval;	
				});		 
			 }
			return returnVal;
		 },
		 
		//read cookie and returns value
			readCookie :function(cName){
				IDG.insiderReg.log("reading cookie :"+cName);
				return	$.cookie(cName)
			},
			
			personalize: function(){
				var token=IDG.insiderReg.readCookie("nsdr");
				if(token){
					var tokenVals=IDG.insiderReg.readCookieProperty(token);
					var firstName=tokenVals['fnm'];
					if (firstName != "") {
						firstName = ' '+firstName;
					}
					$("#person-first-name").html(firstName);
					if(!$thm.deviceWidthAtLeast($thm.deviceBreakpoints.tablet)){
						firstName=' Back'
					}
					$("#welcome-message div#insider-welcome").html('<span class="insider"></span> <a href="javascript://" onclick="">Welcome'+firstName+'! <i class="ss-icon ss-navigatedown"></i></a>');
					$('.insider-list').addClass('show-me');
				}
			},	
			
			//create cookie sets expiration to 90 days
			createCookie : function(name,value,domainName){
				$.cookie(name,value,{path:'/',domain:domainName,expires:90});

			},
			
			showLocFields:function(){
				$('.city-field, .country-field').css('display','block');
				$('.insider-register.full form .info-bubble.city').css('display','block');
				$('.city-field input').addClass('err-msg-grad');
				$('.country-field .select2-choice').addClass('err-msg-grad');
				// remove left-float class if city and country fields are displayed
				$('.input-wrap.phone-field').removeClass('left-float');
				$('.input-wrap.phone-field > input').blur();
				$('.phone-field span.err-msg').css('display','none');
				$('.phone-field input').removeClass('err-msg-grad');
				//hide tooltip for city / country
				$('html,body').click(function() {
					$('.insider-register.full form .info-bubble.city').css('display','none');
				});
				$('#jobPosition,#jobFunction,#companySize,#industry,#country').on("select2-focus", function(e) { 
					$('.insider-register.full form .info-bubble.city').css('display','none');
				});
			
			},
			
			showJTFields:function(){
				IDG.insiderReg.showTooltipJobs();
				$("#insider-register-form-full #jobPosition").focus();
				IDG.insiderReg.companySizeFieldBlur();
			},
			
			isEmpty:function(value){
				if(typeof(value) !== 'undefined' && value.trim().length > 0){
					return false;
				}
				return true;
			},
		
			logout:function(){
				var expdate = new Date();
				expdate.setTime(expdate.getTime() - 1);	
				$.cookie('nsdr','',{path:'/',domain:brandDomain,expires:expdate});
				//Chrome pulls from browser cache instead of fresh stuffs
				if( navigator.userAgent.toLowerCase().indexOf('chrome') > -1 ){
			    	var splitexp = /(#|\?)/g;
			    	var newURL = window.location.href.split(splitexp)[0];
			    	if( (notEmptyArticle && isInsiderPremium) || (notEmptyMediaResource && isResourceInsiderPremium) ) {
				    	if(window.location.href.indexOf('?upd=') != -1 || window.location.href.indexOf('?nsdr=') != -1 ) {
				    		newURL = window.location.href.split("?")[0];
				    	}
			    		window.location.replace(newURL+ '?upd='+$.now());
			    	} else {
			    		window.location.replace(newURL);
			    	}
				} else {
					window.location.reload(true);
				}
			},
			
			displayInputErrorField:function(fieldName){
				$('.'+fieldName +'-field span.err-msg').css('display','block');
				$('.'+fieldName+'-field input').addClass('err-msg-grad');
			},
			
			hideInputErrorField:function(fieldName){
				$('.'+fieldName +'-field span.err-msg').css('display','none');
				$('.'+fieldName+'-field input').removeClass('err-msg-grad');
			},
			
			displaySelectError:function(fieldName){
				$('.'+fieldName+'-field span.err-msg').css('display','block');
				$('.'+fieldName+'-field .select2-choice').addClass('err-msg-grad');
			},
			
			hideSelectError:function(fieldName){
				$('.'+fieldName+'-field span.err-msg').css('display','none');
				$('.'+fieldName+'-field .select2-choice').removeClass('err-msg-grad');
			},
			showTooltipJobs:function(){
				$('form .input-row.jobs').css('display','block');
				$('.insider-register.full form .info-bubble.jobs').css('display','block');
				$('.jobPosition-field .select2-choice').addClass('err-msg-grad');
				$('.jobFunction-field .select2-choice').addClass('err-msg-grad');
			},
			hideTooltipJobs:function(){
				$('html,body').click(function() {
					$('.insider-register.full form .info-bubble.jobs').css('display','none');
					$("#insider-register-form-full #full-submit").removeClass('focused');
				});
				$('#jobPosition,#jobFunction,#companySize,#industry').on("select2-focus", function(e) { 
					$('.insider-register.full form .info-bubble.jobs').css('display','none');
					$("#insider-register-form-full #full-submit").removeClass('focused');
				});
			},
			companySizeFieldBlur:function() {
				$("#insider-register-form-full .companySize-field").blur();
				$('.companySize-field span.err-msg').css('display','none');
				$('.companySize-field .select2-choice').removeClass('err-msg-grad');
			},
			
			serverValidationMessages : function(validationErrors){
				$.each(validationErrors,function(index,value){
					alert(value.propertyName +"-"+ value.validationRule)
					if(typeof(value.propertyName)!='undefined' && value.propertyName=='emailAddress'){
						IDG.insiderReg.displayInputErrorField('email');
					}else{
						IDG.insiderReg.displayInputErrorField(value.propertyName);
					}			
				});
			}, 
			
			serverValidationShortForm:function(){
				$('#insider-popup.modal-box .modal-body .insider-register .loading-icon').css('display','none');
				$('form.insider-register-form.short input').addClass('err-msg-grad');
				if(!$thm.deviceWidthAtLeast($thm.deviceBreakpoints.tablet)){
					$('form.insider-register-form.short .mob.err-msg').css('display','block');
				} else {
					$('form.insider-register-form.short .tab.err-msg').css('display','block');
				}
			},
			
};
