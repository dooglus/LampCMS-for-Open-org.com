/**
 *
 * License, TERMS and CONDITIONS
 *
 * This software is lisensed under the GNU LESSER GENERAL PUBLIC LICENSE (LGPL) version 3
 * Please read the license here : http://www.gnu.org/licenses/lgpl-3.0.txt
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 *
 * ATTRIBUTION REQUIRED
 * 4. All web pages generated by the use of this software, or at least
 * 	  the page that lists the recent questions (usually home page) must include
 *    a link to the http://www.lampcms.com and text of the link must indicate that
 *    the website's Questions/Answers functionality is powered by lampcms.com
 *    An example of acceptable link would be "Powered by <a href="http://www.lampcms.com">LampCMS</a>"
 *    The location of the link is not important, it can be in the footer of the page
 *    but it must not be hidden by style attibutes
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE FREEBSD PROJECT OR CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * This product includes GeoLite data created by MaxMind,
 *  available from http://www.maxmind.com/
 *
 *
 * @author     Dmitri Snytkine <cms@lampcms.com>
 * @copyright  2005-2011 (or current year) ExamNotes.net inc.
 * @license    http://www.gnu.org/licenses/lgpl-3.0.txt GNU LESSER GENERAL PUBLIC LICENSE (LGPL) version 3
 * @link       http://www.lampcms.com   Lampcms.com project
 * @version    Release: @package_version@
 *
 *
 */

/**
 * @todo some validation and just show alert on error!
 * 
 * @todo submit form via Ajax and on success when we get 'redirect' location in
 *       response we must clear local storage and redirect!
 * 
 * @todo setRequired(input, text) and use it to validate tags < 2, title < 10,
 *       body < 30 add validate()
 * 
 * @todo initEditor() must be a method which will: download all required
 *       external YUI2 scripts as well as the editor instantiation script
 *       itself! The instantiation script will require only the Y to be passed
 *       to constructor via Y.get() and then onSuccess of get() will init editor
 *       it will also look to see if there is oEditorConfig object on the page
 *       and if yes, then use it to decide which buttons to include
 * 
 */

if (top !== self) {
	alert('The URL ' + self.location.href
			+ ' cannot be viewed inside a frame.  You will be redirected.');
	top.location.href = self.location.href;
}

YUI({
	gallery : 'gallery-2010.08.18-17-12'
		}).use('node', 'event', 'gallery-storage-lite', 'gallery-overlay-extras', 'dd-plugin', 'yui2-editor', 'yui2-resize', 'yui2-animation', 'io-form', 'json', 'cookie', function(Y, result) {
	/**
	 * Dom Element of comment form
	 */
	var YAHOO = Y.YUI2, //
	dnd = false, //
	res = Y.one('#body_preview'), //
	write = function(str) {
		var d = new Date();
		str += ' :: ' + d.toTimeString();
		if(res) {res.set('innerHTML', str);};
	}, //
	saveToStorage = function() {
		Y.StorageLite.on('storage-lite:ready', function() {
			var html = editor.saveHTML();
			Y.StorageLite.setItem(getStorageKey(), html);
			write('Draft saved..');
		});
	}, //

	eForm = Y.one('.qa_form'), //
	/**
	 * Ask Form Textarea
	 */
	eAskTA, //
	/**
	 * Current reputation score
	 * of viewer
	 */
	reputation, //
	/**
	 * id of current viewer
	 */
	viewerId, // 
	/**
	 * Flag indicates viewer is moderator (or admin)
	 */
	bModerator, //
	/**
	 * Dom of Title input
	 */
	eInputTitle, //
	/**
	 * Dom of Tags input
	 */
	eInputTags, //
	/**
	 * Dom Div with instructions how to post tags
	 */
	eTagsHint, //
	/**
	 * Dom DIv with instructions how to post markdown
	 */
	eBodyHint, //
	/**
	 * Dom Div with hint on how to ask a question
	 */
	eTitleHint,
	/**
	 * Collection of elements that have com_hand class
	 */
	aComHand, //
	/**
	 * Object keeps track of votes for question. key is id, value number of
	 * clicks we can limit up to 8 vote clicks per resource, then we will simply
	 * NOT pass data to server.
	 * 
	 */
	oVotes = {}, // 
	/**
	 * YUI2 Editor object
	 */
	editor, //
	/**
	 * Facebook style alert modal
	 * 
	 * Modal popup, usually contains some small
	 * form or tools.
	 * It usually should be closed onSuccess
	 * of Ajax request
	 */
	oAlerter, //

	getStorageKey = function() {
		var formName;
		if (!eForm) {
			return null;
		}

		return eForm.get('name');

	}, //

	/**
	 * Each question/answer is allowed up to 4 up and down votes, after that
	 * user can click on votes buttons untill he's blue in the face, nothing
	 * will be sent to server.
	 * 
	 * @return bool true if limit has not been reached false if limit has been
	 *         reached.
	 */
	incrementVoteCounter = function(qid) {
		// Y.log('incrementVoteCounter', 'warn');
		// Y.log('oVotes: ' + $LANG.dump(oVotes));
		var ret;
		Y.log('qid: ' + qid, 'warn');
		if (!oVotes.hasOwnProperty(qid)) {
			// Y.log('no qid yet ', 'error');
			oVotes[qid] = 1;
			// Y.log('oVotes: ' + $LANG.dump(oVotes));
		} else {

			oVotes[qid] = (oVotes[qid] + 1);
			// Y.log('new count: ' + oVotes[qid]);
		}

		ret = (oVotes[qid] < 5);
		// Y.log('ret: ' + ret);
		return ret;
	}, //

	/**
	 * Get timezone offset based on user clock
	 * 
	 * @return number of secord from UTC time can be negative
	 */
	getTZO = function() {
		var tzo, nd = new Date();
		tzo = (0 - (nd.getTimezoneOffset() * 60));

		return tzo;
	}, //
	/**
	 * Get value of meta tag
	 * @param string metaName 
	 * @param bool asNode if true then return
	 * the Node representing <meta> element
	 * 
	 * @return mixed false if meta tag does not exist
	 * or string of meta element "content" or 
	 * YUI3 Node object if asNode (true) is passed
	 */
	getMeta = function(metaName, asNode){
		var ret, node = Y.one('meta[name=' + metaName +']');
		Y.log('meta node for meta ' + metaName+ ' is: ' + node);
		if(!node){
			return false;
		}
		
		if(asNode){
			return node;
		}
		
		return node.get('content');
	},
	
	/**
	 * Start Login with FriendConnect routine
	 * 
	 */
	initGfcSignup = function(){
		if (!google || !google.friendconnect) {
			Y.log('No google or google.friendconnect', 'error');
			return;
		}
		
		google.friendconnect.requestSignIn();
		
		return;
	},
	/**
	 * Handle click on thumbup/thumbdown link
	 * 
	 * @var object el YUI Node representing a vote link it has a href which
	 *      already includes the correct ID of question or answer
	 * 
	 */
	handleVote = function(el) {
		var id = el.get('id');

		switch (true) {
		case el.test('.thumbupon'):
			el.removeClass('thumbupon');
			el.addClass('thumbup');
			break;

		case el.test('.thumbup'):
			el.removeClass('thumbup');
			el.addClass('thumbupon');
			break;

		case el.test('.thumbdownon'):
			el.removeClass('thumbdownon');
			el.addClass('thumbdown');
			break;

		case el.test('.thumbdown'):
			el.removeClass('thumbdown');
			el.addClass('thumbdownon');

		}

		if (incrementVoteCounter(id)) {
			var request = Y.io(el.get('href'));
		}
	}, //
	/**
	 * Use Facebook UI to initiate
	 * promnt to post to user wall
	 * an invitation to join this site
	 */
	initFbInvite = function(target){
		if (!FB) {
			Y.log('No FB object', 'error');
			return;
		}

		var siteTitle = getMeta('site_title');
		var siteUrl = getMeta('site_url');
		var siteDescription = target.get('title');
		var caption = getMeta('site_description');
		Y.log('target title: ' + siteDescription);
		FB.ui({
			method : 'stream.publish',
			message : 'I joined this site with Facebook Connect button. You should check it out too',
			attachment : {
				name : siteTitle,
				caption : caption,
				description : siteDescription,
				href : siteUrl
			},
			action_links : [ {
				text : siteTitle,
				href : siteUrl
			} ],
			user_message_prompt : 'Invite your Facebook Friends to join this site'
		}, function(response) {
			if (response && response.post_id) {
				Y.log('Post was published to Wall');
			} else {
				Y.log('Post was not published to Walll', 'warn');
			}
		});
	}, //
	/**
	 * Handle form submit for
	 * forms inside the alerter (FB Overlay)
	 */
	handleModalForm = function(e){
		var form = e.currentTarget;
		e.halt();
		Y.log('handleModalForm el is: ' + form);
		var cfg = {
				method : 'POST',
				form : {
					id : form,
					useDisabled : true
				}
			};
			oAlerter.hide();
			oSL.modal.show();
			
			var request = Y.io('/index.php', cfg);
	},
	/**
	 * This function executes onClick on any link with class 'ajax'
	 */
	handleAjaxLinks = function(e) {
		var ancestor, res, restype, resID, fbappid, fbcookie, el = e.currentTarget;
		//alert('el is ' + el + '<br>id is: ' + el.get('id'));
		var id = el.get('id');
		e.halt();
		switch (true) {
		case el.test('.vote'):
			if(ensureLogin()){
				handleVote(el);
			}
			break;
			
		case el.test('.fbsignup'):
			initFBSignup();
			break;
			
		case el.test('.gfcsignin'):
			initGfcSignup();
			break;
			
		case el.test('.twsignin'):
			Twitter.startDance();
			break;
			
		case (id == 'gfcset'):
			google.friendconnect.requestSettings();
			break;
			
		case (id == 'gfcinvite'):
			google.friendconnect.requestInvite();
			break;
			
		case (id === 'fbinvite'):
			initFbInvite(el);
			break;
			
		case (id == 'twinvite'):
			oTweet = oSL.tweet.getInstance();
		    oTweet.show();
			break;
			
		case (id === 'logout'):
			if(FB){
				fbappid = getMeta('fbappid');
				FB.logout(function(response) {});
				if (fbappid) {
					fbcookie = "fbs_" + fbappid;
					Y.Cookie.remove(fbcookie);
				}
			}
		
			window.location.assign('/logout/');
			
			break;
			
		case el.test('.flag'):
			ancestor = el.ancestor("div.controls");
		if(ancestor){
		    restype = (ancestor.test('.question')) ? 'q' : 'a';
		    resID = ancestor.get('id');
		    resID = resID.substr(4);
		    showFlagForm({'rid' : resID, 'rtype' : restype});
			}
		
		   break;
		   
		case el.test('.retag'):
			ancestor = el.ancestor("div.controls");
		if(ancestor){
		    resID = ancestor.get('id');
		    resID = resID.substr(4);
		    showRetagForm(resID);
			}
		
		   break;
		   
		case el.test('.del'):
			ancestor = el.ancestor("div.controls");
			if(ancestor){
			    restype = (ancestor.test('.question')) ? 'q' : 'a';
			    resID = ancestor.get('id');
			    resID = resID.substr(4);
			    showDeleteForm({'rid' : resID, 'rtype' : restype});
				}
			
			break;
			
		case el.test('.btn_shred'):
			if(ensureLogin()){
				//alert('clicked on shred for user' + el.get('id'));
				showShredForm(el.get('id'));
			}
			break;
		
		}
	}, //

	

	// A function handler to use for successful requests:
	handleSuccess = function(ioId, o) {
		var scoreDiv, comDivID, eDiv, eRepliesDiv, sContentType = Y.Lang.trim(o.getResponseHeader("Content-Type"));
		if ('text/json; charset=UTF-8' !== sContentType) {
			alert('Invalid Content-Type header: ' + sContentType);
			return;
		}
		/**
		 * Check that we have o.responseText. Check that we have 'rcomment' in
		 * data after parsing json
		 * 
		 */
		if (o.responseText === undefined) {
			alert('No text in response');
			return;
		}

		Y.log('Content-Type: ' + sContentType, "info");

		Y.log("The success handler was called.  Id: " + ioId + ".", "info", "example");

		/**
		 * Parse json find 'replies' div under the comments div if not already
		 * exists then create one and append under comments div append div from
		 * response to 'replies' div scroll into view visually animate it
		 * (maybe)
		 */
		try {
			var data = Y.JSON.parse(o.responseText);
		} catch (e) {
			alert("Error parsing response object");
			return;
		}

		if (data.exception) {
			if(data.type && 'Lampcms\\MustLoginException' === data.type){
				ensureLogin(true);
			} else {
				alert(data.exception);
			}
			//return;
		}
		
		
		if (data.alert) {
			alert(data.alert);
			//return;
		}
		
		if(data.reload){
			if(data.reload > 0){
				Y.later(data.reload, this, function(){
					window.location.reload(true);
				});
			} else {
				window.location.reload(true);
			}
		}

		if (data.formError) {
			/**
			 * @todo write setFormError function to test if we have div with
			 *       form_err id then set its innerHTML otherwise just alert
			 *       error;
			 */
			Y.log('Form Error: ' + data.formError);
			alert(data.formError);
			return;
		}

		if (data.vote && data.vote.hasOwnProperty('v') && data.vote.rid) {
			Y.log(data.vote.rid);
			scoreDiv = Y.one('#score' + data.vote.rid);
			Y.log('scoreDiv ' + scoreDiv);

			if (scoreDiv) {
				scoreDiv.set('innerHTML', data.vote.v);
			}
		} else {

			if (data.redirect || data.answer) {
				Y.StorageLite.removeItem(getStorageKey());
				if (data.redirect) {
					alert('Question posted! Redirecting to <br><a href="' + data.redirect + '">' + data.redirect + '</a>');
					// redirect in 1 second
					Y.later(1000, this, function() {
						window.location.assign(data.redirect);
					});
				}

				/**
				 * This is an answer table, append it to end of answers div
				 * @todo update answers count, change collor
				 * scrollIntoView
				 */
				Y.one("#answers").append(data.answer);
			}
		}
	}, //

	handleFailure = function(ioId, o) {
		Y.log("The failure handler was called.  Id: " + ioId + ".", "info", "example");
		alert('Error occured. Server returned status ' + o.status + ' response: ' + o.statusText);
	};

	// Subscribe our handlers to IO's global custom events:
	Y.on('io:success', handleSuccess);
	Y.on('io:failure', handleFailure);
	/*
	 * Y.on('io:start', function(o) { oSL.modal.show(); });
	 */

	Y.on('io:complete', function(o) {
		oSL.modal.hide();
	});

	/**
	 * Submit question or answer form via ajax
	 */
	var MysubmitForm = function(e) {
			
		var mbody, title, tags, form = e.currentTarget;
		
		Y.log('form is: ' + form);
		// var title_d = Y.one("#title_d").get("value"); // wtf?

		title = form.one("#id_title");
		if (title && (10 > title.get("value").length)) {
			alert('Please enter a descriptive title at least 10 characters long');
			e.halt();
			return;
		}

		tags = form.one("#id_tags");
		if (tags && (1 > tags.get("value").length)) {
			alert('Enter between 1 and 5 tags, separated by spaces');
			e.halt();
			return;
		}

		mbody = getEditedText();
		/**
		 * Replace attribute "codepreview" to "code" this way the final text
		 * submitted to server will have "code" attribute. The reason for this
		 * is that we have 2 types of code preview: one in preview div during
		 * editing and another is actual content of the view question/answers
		 * page.
		 * 
		 * Since the HighlightAll executes every time the content of editor
		 * changes we don't want this to also highlight the actual code on the
		 * question/answers that are already on the page, thus we need 2
		 * separate code previews
		 */
		mbody = mbody.replace(/"codepreview"/g, '"code"');
		if (20 > mbody.length) {
			alert('Questions and answers must be at least 20 characters long');
			e.halt();
			return;
		}

		// editor.saveHTML();
		/**
		 * Instead of saveHTML() which will do cleanHTML yet again and will mess
		 * up our already cleaned body, we will just set the value of form's
		 * qbody textarea to the mbody which we already have and it's alread
		 * properly parsed, especially cleaned inside the 'pre' tags
		 */
		form.one("textarea[name=qbody]").set("value", mbody);
		/**
		 * Now run save to set the body of the form back from the editor into
		 * form
		 * 
		 * Maybe via set('value', html)? Will it work?
		 */
		/*
		 * e.halt(); return;
		 */
		Y.log('mbody: ' + mbody);

		var cfg = {
			method : 'POST',
			form : {
				id : form,
				useDisabled : true
			}
		};

		oSL.modal.show();
		var request = Y.io('/index.php', cfg);

		e.halt();
		return false;

	};

	aComHand = Y.all('.com_hand');

	// alert('Got com_hand ' + aComHand);
	if (aComHand && !aComHand.isEmpty()) {
		aComHand.on('focus', oSL.getQuickRegForm);
	} else {

		/**
		 * Instantiate editor
		 */
		editor = new YAHOO.widget.Editor('id_qbody', {
			dompath : true, // without dompath resize does not work
			width : '660px',
			height : '250px',
			autoHeight : true,
			extracss : 'pre { margin-left: 10px; margin-right: 10px; padding: 2px; background-color: #EEE; } ',
			animate : true,
			toolbar : {
				titlebar : 'Editor',
				buttons : [ {
					group : 'saveclear',
					label : 'Save / New',
					buttons : [ {
						type : 'push',
						label : 'Save',
						value : 'save'
					}, {
						type : 'push',
						label : 'New',
						value : 'clear'
					} ]
				}, {
					group : 'textstyle',
					label : 'Font Style',
					buttons : [ {
						type : 'push',
						label : 'Bold CTRL + SHIFT + B',
						value : 'bold'
					}, {
						type : 'push',
						label : 'Italic CTRL + SHIFT + I',
						value : 'italic'
					}, {
						type : 'push',
						label : 'Underline CTRL + SHIFT + U',
						value : 'underline'
					}, {
						type : 'push',
						label : 'Strike Through',
						value : 'strikethrough'
					} ]
				}, {
					type : 'separator'
				}, {
					group : 'blockquote',
					label : 'Quote',
					buttons : [ {
						type : 'push',
						label : 'Indent',
						value : 'indent',
						disabled : true
					}, {
						type : 'push',
						label : 'Outdent',
						value : 'outdent',
						disabled : true
					} ]
				}, {
					type : 'separator'
				}, {
					group : 'indentlist',
					label : 'Lists',
					buttons : [ {
						type : 'push',
						label : 'Create an Unordered List',
						value : 'insertunorderedlist'
					}, {
						type : 'push',
						label : 'Create an Ordered List',
						value : 'insertorderedlist'
					} ]
				}, {
					type : 'separator'
				}, {
					group : 'insertitem',
					label : 'Link',
					buttons : [ {
						type : 'push',
						label : 'HTML Link CTRL + SHIFT + L',
						value : 'createlink',
						disabled : true
					}

					]
				}, {
					type : 'separator'
				}, {
					group : 'undoredo',
					label : 'Undo/Redo',
					buttons : [ {
						type : 'push',
						label : 'Undo',
						value : 'undo',
						disabled : true
					}, {
						type : 'push',
						label : 'Redo',
						value : 'redo',
						disabled : true
					}

					]
				} ]
			}
		});

		editor.on('toolbarLoaded', function() {

			this.on('afterNodeChange', function(o) {

				preview();

			}, this, true);

			/*
			 * this.on('editorKeyUp', function() { preview(); });
			 */


			/**
			 * Listen to "Clear" button click
			 */
			editor.toolbar.on('clearClick', function() {
				if (confirm('Are you sure you want to reset the Editor?')) {
					editor.setEditorHTML('<br>');
					write('Editor content cleared..');
				}
			});
			editor.toolbar.on('saveClick', saveToStorage);
		});

		editor.on('editorContentLoaded', function() {
			var ec = editor.get('element_cont');

			resize = new YAHOO.util.Resize(ec.get('element'), {
				handles : [ 'b', 'br' ],
				autoRatio : true,
				proxy : true,
				setSize : false

			});
			resize.on('startResize', function() {
				this.hide();
				this.set('disabled', true);
			}, editor, true);
			resize.on('resize', function(args) {
				var h = args.height;
				var th = (this.toolbar.get('element').clientHeight + 2);
				var dh = (this.dompath.clientHeight + 1);
				var newH = (h - th - dh);
				this.set('width', args.width + 'px');
				this.set('height', newH + 'px');
				this.set('disabled', false);
				this.show();
			}, editor, true);
		});

		Y.later(5000, editor, function() {
			if (editor.editorDirty) {
				editor.editorDirty = null;
				saveToStorage();
			}
		}, {}, true);

		Y.StorageLite.on('storage-lite:ready', function() {
			var body = Y.one('#id_qbody');
			var editorValue = Y.StorageLite.getItem(getStorageKey());
			if (body && null !== editorValue && '' !== editorValue) {
				body.set('value', editorValue);
				write('Loaded content draft from Local Storage');
			} else {
				write('Editor ready');
			}

			editor.render();
		});

		/**
		 * Preview result html from editor
		 */
		var getEditedText = function() {
			var html = editor.getEditorHTML();
			html = editor.cleanHTML(html);
			
			return html;
		};

		var previewDiv = Y.one('#tmp_preview');

		var preview = function() {
			previewDiv = (previewDiv) ? previewDiv : null;
			if (previewDiv) {
				previewDiv.set('innerHTML', getEditedText());
			}

		};

		
	} // end if NOT com_hand, means if we going to use RTE
	
	var showFlagForm = function(o){
		var oAlert, form;
		if(ensureLogin()){
		form = '<div id="div_flag" style="text-align: left">'
+ '<form name="form_flag" id="id_flag" action="/index.php">'
+ '<input type="hidden" name="a" value="flagger">'
+ '<input type="hidden" name="rid" value="{rid}">'
+ '<input type="hidden" name="token" value="'+ getToken() +'">'
+ '<input type="hidden" name="qid" value="'+ getMeta('qid') +'">'
+ '<input type="hidden" name="rtype" value="{rtype}">'
+ '<input type="radio" name="reason" value="spam"><label> Spam</label><br>'
+ '<input type="radio" name="reason" value="inappropriate"><label> Inappropriate</label><br>'
+ '<hr>'
+ '<label for="id_note">Comments?</label>'
+ '<textarea name="note" cols="40" rows="2" style="display: block;"></textarea>'
+ '<input type="submit" class="btn" value="Report">'
+ '</form>'
+ '</div>';
		
		form = Y.Lang.sub(form, o);
		oAlert = getAlerter('<h3>Report to moderator</h3>');
	     oAlert.set("bodyContent", form);
	     oAlert.show(); 
		}
		
	};
	
	
	var showRetagForm = function(){
		var oAlert, form, oTags, sTags = '';
		if(2>1 || ensureLogin()){
			oTags = Y.all('td.td_question > div.tgs a');
			Y.log('oTags count: ' + oTags.size());
			oTags.each(function(){
				sTags += this.get('text') + ' ';
			});
			sTags = Y.Lang.trimRight(sTags);
			Y.log('sTags: ' + sTags);
			
		form = '<div id="div_flag" style="text-align: left">'
+ '<form name="form_flag" id="id_flag" action="/index.php">'
+ '<input type="hidden" name="a" value="retag">'
+ '<input type="hidden" name="token" value="'+ getToken() +'">'
+ '<input type="hidden" name="qid" value="'+ getMeta('qid') +'">'
+ '<hr>'
+ '<label for="id_note">At least one tag, max 5 tags separated by spaces</label>'
+ '<input type="text" class="ta1" size="40" name="tags" value="'+sTags+'" style="display: block;"></input>'
+ '<br>'
+ '<input type="submit" class="btn" value="Save">'
+ '</form>'
+ '</div>';
		
		oAlert = getAlerter('<h3>Edit Tags</h3>');
	     oAlert.set("bodyContent", form);
	     oAlert.show(); 
		}
		
	}
	
	var showDeleteForm = function(o){
		var oAlert, form, banCheckbox = '';
		if(ensureLogin()){
			if(isModerator()){
				banCheckbox = '<br><input type="checkbox" name="ban"><label> Ban poster</label><br>'
			}
			form = '<div id="div_del" style="text-align: left">'
				+ '<form name="form_del" id="id_del" action="/index.php">'
				+ '<input type="hidden" name="a" value="delete">'
				+ '<input type="hidden" name="rid" value="{rid}">'
				+ '<input type="hidden" name="token" value="'+ getToken() +'">'
				+ '<input type="hidden" name="qid" value="'+ getMeta('qid') +'">'
				+ '<input type="hidden" name="rtype" value="{rtype}">'
				+ '<hr>'
				+ '<label for="id_note">Reason for delete (optional)</label>'
				+ '<textarea name="note" cols="40" rows="2" style="display: block;"></textarea>'
				+ banCheckbox
				+ '<br><input type="submit" class="btn" value="Delete">'
				+ '</form>'
				+ '</div>';
						
						form = Y.Lang.sub(form, o);
						oAlert = getAlerter('<h3>Delete item</h3>');
					     oAlert.set("bodyContent", form);
					     oAlert.show(); 
		}
	};
	
	var showShredForm = function(uid){
		var id = uid.substr(5);
		Y.log('uid: ' +id);
		form = '<div id="div_del" style="text-align: left">'
			+ '<form name="form_shred" id="id_shred" action="/index.php">'
			+ '<input type="hidden" name="a" value="shred">'
			+ '<input type="hidden" name="uid" value="'+ id + '">'
			+ '<input type="hidden" name="token" value="'+ getToken() +'">'
			+ '<p>Shredding user will completely delete all posts made by the user<br>'
			+ 'as well as all user tags'
			+ '<br>It will also change user status to *deleted*'
			+ '<br>and ban all IP addresses ever used by that user</p>'
			+ '<p>Proceed only if you absolutely sure you want to do this'
			+ '<hr>'
			+ '<input type="submit" class="btn_shred" value="Shred">'
			+ '</form>'
			+ '</div>';
					
				oAlert = getAlerter('<h3>Shred User</h3>');
				oAlert.set("bodyContent", form);
				oAlert.show(); 
	};
	
	var setMeta = function(metaName, value){
		var node = getMeta(metaName);
		if(node && value){
			node.set('content', value);
		}
	};
	
	var ensureLogin = function(bForceAlert){
		var message;
		if(bForceAlert || !isLoggedIn()){
			message = '<div class="larger"><p>You must login to perform this action</p>'
			+ '<p>Please login or <a class="close" href="#" onClick=oSL.getQuickRegForm(); return false;>Click here to register</a></div>';

			getAlerter('Please Login').set("bodyContent", message).show();
		 	
		 	return false;
		}
		
		return true;
	};
	
	/**
	 * Get value of 'mytoken' meta tag which serves as a security token for form
	 * validation.
	 */
	var getToken = function() {		
		return getMeta('version_id');
	};
	
	/**
	 * Set (update) the value of meta name="mytoken" meta tag with the new value
	 */
	var setToken = function(val) {
		setMeta('version_id', val);
	};
	
	var getViewerId = function(){
		var uid;
		Y.log('looking for uid');
		if(!viewerId){
			Y.log('viewerId not set');
			uid = getMeta('session_uid');
			Y.log('uid: ' + uid);
			viewerId = (!uid) ? 0 : parseInt(uid);
		}
		
		return viewerId;
	};
	
	 /**
	 * Test to determine if page is being viewed by a logged in user a logged in
	 * user has the session-tid meta tag set to value of twitter userid
	 */
	var isLoggedIn = function() {
		
		var ret, uid = getViewerId();
		ret = (uid && (uid !== '') && (uid !== '0'));

		return ret;
	};
	
	
	
	/**
	 * Check if current viewer is moderator
	 * 
	 * @return bool true if moderator or admin
	 */
	var isModerator = function(){
		var role;
		if(!bModerator){
			role = getMeta('role');
			bModerator = (role && (('admin' == role)  || ('moderator' == role) ));
		}
		
		Y.log('isModerator: ' + bModerator);
		
		return bModerator;
	};
	
	/**
	 * Get reputation score of current viewer
	 * 
	 * @return int reputation score
	 */
	var getReputation = function(){
		var score;
		if(!reputation){
			score = getMeta('rep');
			reputation = (!score) ? 1 : parseInt(score, 10);	
		}
		
		return reputation;
	};
	
	/**
	 * Add <span> elements inside .contols
	 * only if viewer is moderator or 
	 * has enough reputation to use them
	 */
	var addAdminControls = function(){
		
		var controls = Y.all('div.controls');
		Y.log('controls ' + controls);
		if(controls){
			Y.log('adding adminControls');
			controls.each(function(){
				Y.log('this is: ' + this);
				if(this.test('.question')){
					if(2>1 || isModerator() || this.test('.uid-' + getViewerId()) || 2000 < getReputation()){
			         this.append(' | <span class="retag">retag</span>');
		            }
			 	}
				/**
				 * If is moderator or Owner of item,
				 * meaning controls has class uid-1234
				 * where 1234 is also id of viewer  + getViewerId()
				 */
				if(isModerator() || this.test('.uid-' + getViewerId())){
					this.append(' | <span class="edit">edit</span> | <span class="del">delete</span>');
				}
			});	
		}
		
	};

	
	/**
	 * Start the Facebook Login process
	 * using Facebook Javascript API
	 */
	var initFBSignup = function() {
		var fbPerms = getMeta('fbperms');
		if (!fbPerms) {
			fbPerms = '';
		}
		if (FB) {
			FB.login(function(response) {
				if (response.session) {
					Y.log('FB Signed in');
					if (response.perms) {
						// user is logged in and granted some
						// permissions.
						// perms is a comma separated list of granted
						// permissions
						// alert('Granted perms: ' + response.perms);
						window.top.location.reload(true);
					} else {
						// user is logged in, but did not grant any
						// permissions
					}
				} else {
					// user is not logged in
				}
			}, {
				perms : fbPerms
			});
		}

		return;
	};

	
	/**
	 * Get fbOverlay, reuse existing one
	 */
	var getAlerter = function(header){
		if(!oAlerter){
			oAlerter = new Y.Overlay({
				srcNode : '#fbOverlay',
				width : '500px',
				height : '300px',
				zIndex : 100,
				centered : true,
				constrain : true,
				render : true,
				visible : false,
				plugins : [ 

				{
					fn : Y.Plugin.OverlayModal
				}, {
					fn : Y.Plugin.OverlayKeepaligned
				}

				]

			});

			Y.one('#hide-fbOverlay').on('click', function(){oAlerter.hide();});
		}
		
		if(!header){
			header = 'Alert';
		}
		oAlerter.set("headerContent", '<h3>'+ header + '</h3>');
		
		return oAlerter;
	};
	
	var Twitter = {
			/**
			 * Popup window object
			 */
			popupWindow : null,


			/**
			 * Interval object There should be only one of this if we already have an
			 * interval then we should not start another login process OR clear previous
			 * interval first
			 */
			oInterval : null,

			/**
			 * Start the oAuth login process by opening the popup window
			 */
			startDance : function() {
				Y.log('1084 starting oAuth dance this is: ' + this, 'window'); // Object Twitter
				var popupParams = 'location=0,status=0,width=800,height=450,alwaysRaised=yes,modal=yes', mydomain = window.location.hostname;


				/**
				 * Prevent user from opening more than one Twitter oAuth popup windows.
				 * This is helpful when the already opened window has gone out of focus
				 * (turned into popunder) accedentally
				 * 
				 */
				if (this.popupWindow && !this.popupWindow.closed) {
					this.popupWindow.location.href = 'http://' + mydomain
							+ '/index.php?a=logintwitter';
					this.popupWindow.focus();
					return;
				}

				this.popupWindow = window.open('http://' + mydomain
						+ '/index.php?a=logintwitter', 'twitterWindow', popupParams);

				if (!this.popupWindow) {
					alert('Unable to open login window. Please make sure to disable popup blockers in your browser');
					return;
				}

				/**
				 * This is very important to cancel any already running intervaled jobs,
				 * otherwise the next one will override prev one but the job will still
				 * be running in the background, so it will never be cancelled,
				 * resulting in continuesly issuing asyncRequests to the server like
				 * crazy
				 * 
				 * This can happend when someone opens multiple browser windows by
				 * clickin on 'signin with twitter' several times
				 */
				if (this.oInterval) {
					// alert('1109 something is still running');
					window.clearInterval(this.oInterval);
					this.oInterval = null;
				}

				this.oInterval = window.setInterval(this.checkLogin, 500);
				Y.log('1085 this.oInterval ' + this.oInterval, 'warn');
			},

			/**
			 * This method is check via oInterval, every half a second to check if popup
			 * window has been closed on not. If popup has been closed then we assume
			 * that the first step in oAuth dance is done and can check with the server
			 * to see if session now has user object
			 */
			checkLogin : function() {
				Y.log('Checking login. this is ' + this, 'window'); // this is object Window

				var transaction, cObj;

				if (!Twitter.popupWindow || Twitter.popupWindow.closed) {

					Twitter.cancelIntervals();

					/**
					 * Now it just reload the page Simple, just like most other sites
					 * doing it.
					 * 
					 */
					window.location.reload(true);
				}
			},
			/**
			 * In case there are any jobs still running at intervals we must cancell the
			 * job and null the interval
			 * 
			 * This will also be called from the processLogin() method as well as from
			 * the checkLogin() when we detect that popup has been closed
			 */
			cancelIntervals : function() {

				Y.log('Cancellng pending intervals this: ' + this, 'window');
				if (this.oInterval) {
					Y.log(' 1131 killing interval');
					window.clearInterval(this.oInterval);
					this.oInterval = null;
				}
			},
			toString : function() {
				return 'object Twitter';
			}
		};
	
	
	Y.on('submit', MysubmitForm, '.qa_form');
	Y.on("click", handleAjaxLinks, ".ajax");
	Y.delegate("click", handleAjaxLinks, ".delegate");
	/**
	 * Listening the clicks on links inside #lastdiv
	 * allows us to dynamically add modals and panels
	 * to lastdiv and already subscriebed listeners will
	 * just work
	 */
	Y.delegate("click", handleAjaxLinks, "#qview-main", ".controls span"); //, "a"
	/**
	 * Any forms inside the alerter modal window will be
	 * handled by handleModalForm()
	 */
	Y.delegate("submit", handleModalForm, "#fbOverlay", 'form');
	/**
	 * Any links with class .close inside the alerter modal
	 * window will also cause the modal alerter to close
	 */
	Y.delegate("click", function(){Y.log('clicked close link');getAlerter().hide();}, "#fbOverlay", 'a.close');
	/**
	 * Replace default JS alert with out custom
	 * Fb looking alerter
	 */
	 window.alert = function(text) { 
		 var oAlert = getAlerter();
	     oAlert.set("bodyContent", text);
	     oAlert.show(); 
	 };
	 
	 

	 
	 if(Y.one('#regdiv')) {

			dnd = Y.Cookie.get("dnd");
			/**
			 * Don't show regform if use has 'dnd' (do not disturb) cookie
			 */
			if (!dnd) {
				oSL.Regform.getInstance().show();
			}
		}
	 
	 addAdminControls();

});
