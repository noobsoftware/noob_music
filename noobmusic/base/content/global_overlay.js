Components.utils.import("resource://gre/modules/PlacesUtils.jsm",this);
//Components.utils.import("resource://gre/modules/XPCOMUtils.jsm", this);
Components.utils.import("resource://gre/modules/Services.jsm", this);
Components.utils.import("resource://gre/modules/FileUtils.jsm", this);

Components.utils.import("resource:///modules/PlacesUIUtils.jsm", this);

//Components.utils.import("resource://gre/modules/FileUtils.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm", this);
//Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
//Components.utils.import("resource://gre/modules/PluralForm.jsm");

var Ci = Components.interfaces;
var Cc = Components.classes;
var Cu = Components.utils;


const { require } = Cu.import("resource://gre/modules/commonjs/toolkit/require.js", {})

//Cu.import("resource://gre/modules/Services.jsm");


var music_app = {
	test_function: function() {
		//console.log('test_function');
		/*var jsmediatags = window.jsmediatags;
		jsmediatags.read("http://192.168.1.2/nasa.mp3", {
			onSuccess: function(tag) {
				//console.log(tag);
			},
			onError: function(error) {
				//console.log(error);
			}

		});*/
		alert('test');
	},
	pause: function() {
		this.$audio_player[0].pause();
	},
	is_playing: false,
	$audio_player: null,
	init_audio: function() {

		//var file = new FileUtils.File("/Users/siggi/song.wav");

		// Content type hint is useful on mobile platforms where the filesystem
		// would otherwise try to determine the content type.
		/*var channel = NetUtil.newChannel(file);
		channel.contentType = "application/json";

		NetUtil.asyncFetch(channel, function(inputStream, status) {
			alert(status);
		});*/


		var branch = this;
		branch.$audio_player = $('.audio_player').first(); //branch.$main.find
		branch.$audio_player.on('play', function(e) {
			//branch.pause_windows();
			branch.is_playing = true;
		});
		branch.$audio_player.on('pause', function(e) {
			branch.is_playing = false;
		});
		branch.$audio_player.on('canplaythrough', function(e) {
			var duration = branch.$audio_player[0].duration;
			branch.controls.$seeker_container.find('.total_duration').html(branch.controls.to_minutes(duration));
			if(branch.controls.perform_set_length) {
				branch.controls.save_set_length(duration);
			}
		});
		branch.$audio_player.on('ended', function(e) {
			branch.is_playing = false;
			var query = "SELECT plays FROM library WHERE id = "+branch.controls.currently_playing_id;
			var statement = branch.sql.createStatement(query);
			var plays = 0;
			if(statement.executeStep()) {
				plays = statement.row.plays;
			}
			plays += 1;
			var insert_values = {
				id: branch.controls.currently_playing_id,
				plays: plays,
				last_played: 'CURRENT_TIMESTAMP'
			};

			var insert_statement = branch.local_data.statement.generate(insert_values, "library");
			insert_statement.executeStep();

			var item_offset = branch.playlist.table.map(function(e) {
                return e.id;
            }).indexOf(branch.controls.currently_playing_id);

            branch.playlist.table[item_offset].plays = plays;
            branch.playlist.sort();

			branch.playlist.play_next();
		});
	},
	download: {
		download_url: function(url) {
			var name = url.split('/');
			name = name[name.length-1];
			var file_name = name.replace(/[^\w\s]/gi, '');
			$('.download_container').first().html("<html:a download='"+file_name+"' href='"+url+"' class='download_url_button'>download</html:a>");
			$('.download_container').first().find('.download_url_button').first()[0].click();
		}
	},
	controls: {
		$play_button: null,
		$previous_button: null,
		$next_button: null,
		$volume_slider: null,
		$controls: null,
		$seeker_slider: null,
		$seeker_container: null,
		seeker_value_changing: false,
		$total_duration: null,
		$current_duration: null,
		duration_subtraction_interlope: false,
		$controls_container: null,
		$song_info: null,
		toggle_play: function() {
			var branch = this;
			branch.$play_button.trigger('click');
		},
		init: function() {
			////console.log('controls_init');
			var branch = this;
			branch.$controls = $('.controls').first();
			branch.$play_button = branch.$controls.find('.play_button').first(); //branch.parent.$main.find
			//branch.$audio_player = branch.parent.$audio_player;
			branch.$play_button.click(function() {
				////console.log(branch.parent.is_playing);
				/*if(branch.current_play_id == null) {
					var selected_id = branch.root.playlist.get_first_selected_id();
					if(selected_id != null) {
						branch.play(selected_id, false);

					}
				}*/
				//if(branch.parent.is_playing) {
				if(!branch.parent.$audio_player[0].paused) {
					branch.parent.$audio_player[0].pause();
				} else {
					branch.parent.$audio_player[0].play();
				}
			});

			branch.$controls_container = $('.controls_container').first();
			branch.$song_info = branch.$controls_container.find('.song_info').first();

			branch.$volume_slider = branch.$controls.find('.volume_slider').first();
			branch.$volume_slider.on('change', function(e) {
				var value = $(this).val();
				branch.parent.$audio_player[0].volume = value/100;
			});
			branch.$seeker_container = $('.seeker').first();
			branch.$seeker_slider = branch.$seeker_container.find('.seeker_slider').first();
			branch.$seeker_slider.mousedown(function(e) {
				branch.user_seek_in_progress = true;
			});
			branch.$seeker_slider.mouseup(function(e) {
				branch.user_seek_in_progress = false;
			});
			branch.$seeker_slider.on('change', function(e) {
				if(branch.user_seek_in_progress) {
					branch.seeker_value_changing = true;
					var value = $(this).val();
					branch.parent.$audio_player[0].currentTime = branch.parent.$audio_player[0].duration*value/10000;
					branch.seeker_value_changing = false;
				}
			});
			branch.$total_duration = branch.$seeker_container.find('.total_duration').first();
			branch.$total_duration.click(function() {
				if(branch.duration_subtraction_interlope) {
					branch.duration_subtraction_interlope = false;
				} else {
					branch.duration_subtraction_interlope = true;
				}
			});
			branch.$next_button = branch.$controls.find('.next_button').first();
			branch.$previous_button = branch.$controls.find('.previous_button').first();

			branch.$next_button.click(function() {
				branch.parent.is_playing = false;
				branch.root.playlist.play_next();
			});
			branch.$previous_button.click(function() {
				branch.parent.is_playing = false;
				branch.root.playlist.play_previous();
			});
			branch.$current_duration = branch.$seeker_container.find('.current_duration');

			//branch.set_audio("file:///users/siggi/song.wav");

			setTimeout(function() {
				branch.update_seeker();
			}, 1000);
		},
		user_seek_in_progreess: false,
		update_seeker: async function() {
			var branch = this;
			if(typeof branch.parent.$audio_player[0] !== 'undefined' && !branch.seeker_value_changing) {
				var duration = branch.parent.$audio_player[0].duration;
				var current_time = branch.parent.$audio_player[0].currentTime;
				var seeker_value = parseInt((current_time/duration)*10000);
				branch.$seeker_slider[0].value = seeker_value;
				branch.$current_duration.html(branch.to_minutes(current_time));

				if(branch.duration_subtraction_interlope) {
					var subtracted_value = duration-current_time;
					branch.$total_duration.html(branch.to_minutes(subtracted_value));
				}
			}
			//branch.$seeker_slider.val(seeker_value);
			setTimeout(function() {
				branch.update_seeker();
			}, 250);
		},
		to_minutes: function(seconds, format) {
			var minutes = parseInt(seconds/60);
			var remainder = parseInt(seconds-(minutes*60));
			if((remainder+"").length == 1) {
				remainder = "0"+remainder;
			}
			if(typeof format !== 'undefined') {
				return minutes+':'+remainder;
			}	
			return minutes+'&#58;'+remainder;
		},
		set_audio: function(url, perform_play) {
			var branch = this;
			if(url.indexOf('file:///') != 0) {
				url = 'file:///'+url;
			}
			var file_type = url.split('.');
			file_type = file_type[file_type.length-1];
			var mime_type = ""; //"audio/mpeg";
			switch(file_type) {
				case 'mp3':
					//mime_type "audio/mp3";
					break;
				case 'wav':
					mime_type = "audio/wav";
					break;
				/*case 'aif':
					mime_type "audio/aiff";
					break;*/
				case 'ogg':
					mime_type = "audio/ogg";
					break;
				case 'flac':
					mime_type = "audio/flac";
					break;
			}
			branch.parent.$audio_player.attr('type', mime_type);
			branch.parent.$audio_player.attr('src', url);
			//branch.parent.$audio_player.html("");
			//if(perform_play !== false) {
				branch.parent.$audio_player.on('canplay.autoplay', function(e) {
					branch.$play_button.trigger('click');
					$(this).off('canplay.autoplay');
				});
			//}
		},
		save_set_length: function(duration) {
			duration = this.to_minutes(duration, true);
			var branch = this;
			var insert_values = {
				id: branch.currently_playing_id,
				track_length: duration.toString()
			};
			var insert_statement = branch.root.local_data.statement.generate(insert_values, "library");
			insert_statement.executeStep();
			branch.perform_set_length = false;
			var song_index = branch.root.playlist.store_table.map(function(e) {
				return e.id;
			}).indexOf(branch.currently_playing_id);
			if(song_index != -1) {
				branch.root.playlist.store_table[song_index].length = duration;
				branch.root.playlist.sort();
			}
		},
		perform_set_length: false,
		data: [],
		currenty_playing_id: null,
		play: function(id, perform_play) {
			if(typeof perform_play === 'undefined') {
				perform_play = true;
			}
			var branch = this;
			/*if(branch.parent.is_playing) {
				branch.parent.is_playing = false;
			}*/
			branch.root.playlist.current_play_id = id;
			if(branch.root.playlist.last_load_id != null && branch.root.playlist.last_load_id != -1) {
				var insert_values = {
					id: branch.root.playlist.last_load_id,
					last_played_song_id: id
				};
				var insert_statement = branch.root.local_data.statement.generate(insert_values, "playlists");
				insert_statement.executeStep();
			}
			var song_index = branch.root.playlist.store_table.map(function(e) {
				return e.is_playing;
			}).indexOf(true);
			if(song_index != -1) {
				branch.root.playlist.store_table[song_index].is_playing = false;
			}
			var song_index_table = branch.root.playlist.table.map(function(e) {
				return e.is_playing;
			}).indexOf(true);
			if(song_index_table != -1) {
				branch.root.playlist.table[song_index_table].is_playing = false;
			}
			song_index = branch.root.playlist.store_table.map(function(e) {
				return e.id;
			}).indexOf(id);

			song_index_table = branch.root.playlist.table.map(function(e) {
				return e.id;
			}).indexOf(id);

			if(song_index_table != -1) {
				branch.root.playlist.table[song_index_table].is_playing = true;
			}
			if(song_index != -1) {
				branch.root.playlist.store_table[song_index].is_playing = true;
			}
			branch.root.playlist.sort();

			branch.currently_playing_id = id;
			var query = "SELECT * FROM library WHERE id = :id";

			var statement = branch.root.sql.createStatement(query);
			statement.params.id = id;
			/*while(statement.executeStep()) {
				id = statement.row.id;
			}*/
			branch.data = [];
			statement.executeAsync({
				handleResult: function(aResultSet) {
					//var counter = 0;
					for(var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow()) {
						var title = row.getResultByName("title");
						if(title == null || title.length == 0) {
							title = row.getResultByName("relative_filepath").split('/');
							title = title[title.length-1];
						}
						var song_object = {
							id: row.getResultByName("id"),
							order: 0,
							title: title,
							artist: row.getResultByName("artist"),
							album: row.getResultByName("album"),
							year: row.getResultByName("year"),
							track: row.getResultByName("track"),
							genre: row.getResultByName("genre"),
							length: row.getResultByName("length"),
							size: row.getResultByName("size"),
							plays: row.getResultByName("plays"),
							last_played: row.getResultByName("last_played"),
							date_added: row.getResultByName("date_added"),
							tags: row.getResultByName("tags"),
							rating: row.getResultByName("rating"),
							check_value: row.getResultByName("check_value"),
							relative_filepath: row.getResultByName("relative_filepath")
						};

						var collected_info = row.getResultByName("info_collected");
						if(!collected_info) {
							//branch.root.settings.library.index.read_info(id);
						}

						branch.data.push(song_object);
						//counter++;
					}
					////console.log(branch.data);

				},
				
				handleError: function(aError) {
					////console.log("Error: " + aError.message);
				},
				
				handleCompletion: function(aReason) {
					if(aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {
						////console.log("Query canceled or aborted!");
					} else {
						/*branch.table = branch.data;
						branch.tree.view = branch.tree_view(branch.table);
						branch.reset_order();
						branch.sort(); //{ id: "order" }*/
						var info_string = branch.data[0].title+' - '+branch.data[0].artist+' - '+branch.data[0].album;
						branch.$song_info.attr('value', info_string);
						if(branch.data[0].length == null || branch.data[0].length == '') {
							branch.perform_set_length = true;
						}
						branch.set_audio("file://"+branch.root.settings.properties.library_location_input+branch.data[0].relative_filepath.split('#').join('%23'), perform_play);
					}
				}
			});
		}
	},
	toolbar: {
		$toolbar: null,
		timeout: null,
		init: function() {
			var branch = this;
			branch.$toolbar = $('.toolbar#main_toolbar').first();

			branch.$toolbar.find('.main_view_button').click(function() {
				branch.root.views.change_views("home");
				$('.library_button').first().trigger('click');
				//$('#prompt').val('home').trigger('keyup');
			});
			branch.$toolbar.find('.settings_button').click(function() {
				branch.root.views.change_views("settings");
				//$('#prompt').val('settings').trigger('keyup');
			});

			branch.$toolbar.find('#search').first().keyup(function() {
				clearTimeout(branch.timeout);
				var value = $(this).val();
				branch.timeout = setTimeout(function() {
					if(value.trim().length > 0) {
						branch.root.playlist.filter(value);
					} else {
						branch.root.playlist.restore_playlist();
					}
				}, 300);
			});


		}
	},
	prompt: {
		$prompt: null,
		timeout: null,
		init: function() {
			var branch = this;
			branch.$prompt = $('#prompt').first();
			branch.$prompt.keyup(function() {
				clearTimeout(branch.timeout);
				branch.timeout = setTimeout(function() {
					branch.response();
				}, 1500);
			});
		},
		response: function() {
			var branch = this;
			var value = branch.$prompt.val().trim().toLowerCase();
			if(value == "") {
				return;
			}
			switch(value) {
				case 'home':
					branch.root.views.change_views("home");
					break;
				case 'settings':
					branch.root.views.change_views("settings");
					break;
				default:
					branch.root.download.download_url(value);
					break;
			}

			branch.$prompt.val("");
		}
	},
	views: {
		change_views: function(selector) {
			$('.current_view').hide();
			$('#view_container > #'+selector).first().addClass('current_view').show();
		}
	},
	local_data: {
		init: function() {
			var branch = this;
			var create_table_command = "CREATE TABLE IF NOT EXISTS settings (\
				id INTEGER primary key autoincrement,\
				property_name TEXT,\
				property_value TEXT );\
				\
				CREATE TABLE IF NOT EXISTS library (\
				id INTEGER primary key autoincrement,\
				relative_filepath TEXT,\
				title TEXT,\
				artist TEXT,\
				album TEXT,\
				year TEXT,\
				comment TEXT,\
				track TEXT,\
				genre TEXT,\
				pictures TEXT,\
				lyrics TEXT,\
				length TEXT,\
				track_length TEXT,\
				size TEXT,\
				plays INTEGER,\
				last_played DATETIME,\
				date_added DATETIME DEFAULT CURRENT_TIMESTAMP,\
				tags TEXT,\
				rating INTEGER,\
				check_value BOOLEAN,\
				info_collected BOOLEAN );\
				\
				CREATE TABLE IF NOT EXISTS playlists (\
				id INTEGER primary key autoincrement,\
				name TEXT,\
				parent_id INTEGER default -1,\
				is_folder BOOLEAN,\
				sort_resource TEXT,\
				sort_direction TEXT,\
				last_played_song_id INTEGER ); \
				\
				CREATE TABLE IF NOT EXISTS playlist_songs (\
				id INTEGER primary key autoincrement,\
				playlist_id INTEGER,\
				song_id INTEGER,\
				song_order INTEGER ); \
				\
				CREATE TABLE IF NOT EXISTS numrand (\
				id INTEGER primary key autoincrement,\
				particle_x double,\
				particly_y double,\
				particle_y double,\
				particle_direction double,\
				phase_0 integer,\
				phase_1 integer,\
				phase_2 integer,\
				phase_3 integer,\
				phase_4 integer,\
				phase_5 integer,\
				phase_6 integer,\
				phase_7 integer,\
				phase_8 integer,\
				phase_9 integer,\
				phase_10 integer,\
				phase_11 integer,\
				phase_12 integer );\
				"
				;

			this.root.sql.executeSimpleSQL(create_table_command);
			this.table_structure_update.set_table_structure(create_table_command);	
		},
		statement: {
			last_insert_id_value: null,
			generate: function(values, table, force_insert) {
				var branch = this;
				branch.last_insert_id_value = null;
				if(typeof force_insert === 'undefined') {
					force_insert = false;
				}
				var statement = "";
				var id = null;
				if(force_insert && typeof values.id !== 'undefined') {

				}
				/*
				vantar
				*/
				var unset_params = [];
				if(typeof values.id !== 'undefined' && !force_insert) {
					id = values.id;
					delete values.id;
					statement += "UPDATE "+table+" SET ";
					var counter = 0;
					for(var i in values) {
						if(counter > 0) {
							statement += ", ";
						}
						if(values[i] == 'CURRENT_TIMESTAMP') {
							statement += i+" = CURRENT_TIMESTAMP";
							unset_params.push(i);
						} else {
							statement += i+" = :"+i;
						}
						counter++;
					}
					statement += " WHERE id = :id";
				} else {
					statement += "INSERT INTO "+table+" (";
					var counter = 0;
					for(var i in values) {
						if(counter > 0) {
							statement += ", ";
						}	
						statement += i;
						counter++;
					}
					counter = 0;
					statement += ") VALUES (";
					for(var i in values) {
						if(counter > 0) {
							statement += ", ";
						}
						if(values[i] == "CURRENT_TIMESTAMP") {
							unset_params.push(i);
							statement += values[i];
						} else {
							statement += ":"+i;
						}
						counter++;
					}
					statement += ")";
				}
				for(var i in unset_params) {
					delete values[unset_params[i]];
				}
				//////console.log(statement);
				var command = branch.root.sql.createStatement(statement);
				for(var i in values) {
					//////console.log(i);
					command.params[i] = values[i];
				}
				if(id != null) {
					command.params.id = id;
					branch.last_insert_id_value = id;
				}
				return command;
			},
			last_insert_id: function(table) {
				var branch = this;
				if(branch.last_insert_id_value != null) {
					return branch.last_insert_id_value;
				}
				var query = "SELECT id FROM "+table+" ORDER BY id DESC LIMIT 1";
				var statement = branch.root.sql.createStatement(query);
				statement.executeStep();
				var id = statement.row.id;
				return id;
			}
		},
		table_structure_update: {
			set_table_structure: function(create_table_command) {
				////console.log('SET TABLE STRUCTURE CALLED');
				var branch = this;
				var split = create_table_command.split('CREATE TABLE IF NOT EXISTS');
				for(var x in split) {
					var table = split[x];
					if(table.trim().length > 0) {
						var table_name;
						var paranthesis_index = table.indexOf('(');
						table_name = table.substring(0, paranthesis_index-1).trim();

						var column_query =  "DROP TABLE IF EXISTS table_info; CREATE TEMPORARY TABLE table_info as SELECT * FROM pragma_table_info('"+table_name+"');"

						branch.root.sql.executeSimpleSQL(column_query);
						var column_query = "SELECT name FROM table_info;";
						var statement = branch.root.sql.createStatement(column_query);
						//statement.params.table_name = table_name;
						/*statement.executeAsync({
							handleResult: function(aResultSet) {*/

						var counter = 0;
						var column_result = [];



						//for(var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow()) {
						while(statement.executeStep()) {
							let row = statement.row;
							var column_result_object = {
								name: row.name//.getResultByName("name")
							};
							column_result.push(column_result_object);	
						}

						var alter_statements = [];
						var columns = table.substring(paranthesis_index+1);
						columns = columns.substring(0, columns.lastIndexOf(');')).trim();
						var column_split = columns.split(',');
						//////console.log(column_result);
						for(var i in column_split) {
							var column_value = column_split[i];
							var column_definition = column_value.trim();
							var column_value_split = column_definition.split(' ');
							var column_name = column_value_split[0].trim();
							//////console.log(column_name);
							var column_found = false;
							for(var j in column_result) {
								var column_item = column_result[j];
								if(column_item.name.toLowerCase().trim() == column_name.toLowerCase().trim()) {
									column_found = true;
								}
							}
							if(!column_found) {
								alter_statements.push("ALTER TABLE "+table_name+" ADD COLUMN "+column_definition+";");
							}
						}

						for(var i in alter_statements) {
							////console.log(alter_statements[i]);
							branch.root.sql.executeSimpleSQL(alter_statements[i]);
						}
						
							/*},
							
							handleError: function(aError) {
								////console.log("Error: " + aError.message);
							},
							
							handleCompletion: function(aReason) {
								if(aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {
									////console.log("Query canceled or aborted!");
								}
							}
						});*/
						//var column_result = 
					}
				}
			}
		},
	},
	loading: {
		$loading_screen: null,
		init: function() {
			this.$loading_screen = $('.loading_screen').first();
			this.$main_wrap = $('.main_wrap').first();
		},
		display: function(callback, no_loading_text) {
			var branch = this;
			this.$loading_screen.children().each(function() {
				$(this).hide();
			});
			if(!this.$main_wrap.first().hasClass('blur')) {
				this.$main_wrap.first().addClass('blur');
				if(typeof no_loading_text === 'undefined') {
					this.$loading_screen.find('.loading_text').first().show();
				}
				this.$loading_screen.css({
					'display': 'unset'
				}).animate({
					'opacity': 1
				}, 750, 'easeInOutCubic', function() {
					if(typeof callback !== 'undefined') {
						callback();
					}
				});
			}
		},
		hide: function(callback) {
			var branch = this;
			branch.$loading_screen.animate({
				'opacity': 0
			}, 750, 'easeInOutQuint', function() {
				$(this).css({
					'display': 'none'
				});
				if(typeof callback !== 'undefined') {
					callback();
				}
				branch.$loading_screen.find('.loading_text').first().hide();
				branch.$main_wrap.first().removeClass('blur');
			});
		},
		delete_dialog: function(yes_callback) {
			this.display(undefined, true);
			var branch = this;
			this.$loading_screen.find('.delete_dialog').show();
			this.$loading_screen.find('.delete_button').click(function() {
				yes_callback();
				branch.hide();
				branch.$loading_screen.find('.delete_dialog').hide();
				branch.$loading_screen.find('.delete_button').off('click').unbind('click');
			});
			this.$loading_screen.find('.cancel_button').click(function() {
				branch.hide();
				branch.$loading_screen.find('.delete_dialog').hide();
				branch.$loading_screen.find('.cancel_button').off('click').unbind('click');
			});
		}
	},
	settings: {
		$settings_main_container: null,
		init: function() {
			var branch = this;
			branch.$settings_main_container = $('#view_container .settings_main_container').first();
			branch.library.init();
			branch.get_values();
		},
		properties: {},
		get_values: function() {
			var branch = this;
			var query = "SELECT * FROM settings";
			var statement = branch.root.sql.createStatement(query);
			statement.executeAsync({
				handleResult: function(aResultSet) {
					for(var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow()) {
						var property = row.getResultByName("property_name");
						var value = row.getResultByName("property_value");
						if(property.indexOf('input') != -1) {
							branch.$settings_main_container.find('#'+property).val(value);
							//branch.properties[property] = value;
						} else if(property.indexOf('_checkbox') != -1) {
							var bool_value = (value == 1 ? true : false);
							branch.$settings_main_container.find('#'+property).attr('checked', bool_value);
							switch(property) {
								case 'use_numrand_checkbox':
									branch.root.numrand.disabled = !bool_value;
									break;
							}
						}
						branch.properties[property] = value;
					}
				}
			});
		},
		library: {
			$library_settings: null,
			init: function() {
				var branch = this;
				branch.$library_settings = branch.parent.$settings_main_container.find('#library_settings').first();
				var $choose_folder_button_library = branch.$library_settings.find('#choose_folder_button_library').first();
				var $library_location_input = branch.$library_settings.find('#library_location_input').first();
				$choose_folder_button_library.click(function() {
					var nsIFilePicker = Components.interfaces.nsIFilePicker;
					var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
					fp.init(window, "Select a Folder", nsIFilePicker.modeGetFolder); //nsIFilePicker.modeOpen
					var res = fp.show();
					if (res != nsIFilePicker.returnCancel){
						var file = fp.file;
						$library_location_input.val(file.path);
					}

				});

				var $save = branch.$library_settings.find('#save_button').first();
				$save.click(function() {
					var query = "DELETE FROM settings WHERE property_name = 'library_location_input'";
					branch.root.sql.executeSimpleSQL(query);

					var insert_values = {
						property_name: 'library_location_input',
						property_value: $library_location_input.val()
					};
					var statement = branch.root.local_data.statement.generate(insert_values, "settings");
					statement.executeStep();

					branch.index.perform_index($library_location_input.val());
				});

				branch.$library_settings.find('.use_numrand_checkbox').click(function() {
					var $this = $(this);
					var value = false;
					if($this.attr('checked') == 'true') {
						value = true;
					}
					var query = "DELETE FROM settings WHERE property_name = 'use_numrand_checkbox'";
					branch.root.sql.executeSimpleSQL(query);
					var insert_values = {
						property_name: 'use_numrand_checkbox',
						property_value: value
					};
					var statement = branch.root.local_data.statement.generate(insert_values, "settings");
					statement.executeStep();
				});

				branch.$library_settings.find('.clean_button').first().click(function() {
					branch.index.clean_library();
				});
			},
			index: {
				files: [],
				current_index: 0,
				library_path: null,
				clean_library: function() {
					var branch = this;
					branch.root.loading.display(function() {
						var library_path = branch.parent.parent.properties.library_location_input;
						branch.library_path = library_path;
						var query = "SELECT * FROM library";
						var statement = branch.root.sql.createStatement(query);
						while(statement.executeStep()) {
							relative_filepath = statement.row.relative_filepath;
							var absolute_path = library_path+relative_filepath;
							var id = statement.row.id;

							var file = new FileUtils.File(absolute_path);
							if(!file.exists()) {
								////console.log('remove_file: '+absolute_path);
								/*var delete_query = "SELECT * FROM library WHERE relative_path = :relative_path;
								var delete_statement = branch.root.sql.createStatement(delete_query);
								delete_statement.params.relative_path */
								var delete_query = "DELETE FROM library WHERE id = "+id;
								var delete_statement = branch.root.sql.createStatement(delete_query);
								delete_statement.executeStep();
								delete_query = "DELETE FROM playlist_songs WHERE song_id = "+id;
								var delete_statement = branch.root.sql.createStatement(delete_query);
								delete_statement.executeStep();

							}
						}
						branch.root.loading.hide();
					});
				},
				perform_index: function(library_path) {
					var branch = this;
					branch.root.loading.display(function() {
						branch.library_path = library_path;
						var files = branch.index_library(library_path);
						//console.log('number of files');
						//console.log(files.length);

						//var files = ["file:///Volumes/Backup/itunes_latest/01 A Day Wit The Homiez.mp3"];
						branch.files = files;
						branch.current_index = 0;
						branch.read_m3u();
					});
				},
				addition_index: function(files, callback) {
					var branch = this;
					var result_files = [];
					for(var x in files) {
						var file = new FileUtils.File(files[x]);
						if(file.isDirectory()) {
							result_files.push(...this.index_library(file.path));
						} else {
							result_files.push(files[x]);
						}
					}
					var library_path = branch.parent.parent.properties.library_location_input;
					branch.library_path = library_path;
					branch.files = result_files;
					branch.current_index = 0;
					if(typeof callback !== 'undefined') {
						branch.read_callback = callback;
					}
					branch.root.loading.display(function() {
						branch.read_m3u();
					});
				},
				read_callback: null,
				read_info: function(id) {
					var branch = this;
					var query = "SELECT * FROM library WHERE id = "+id;
					var statement = branch.root.sql.createStatement(query);
					//statement.params.relative_path = relative_path;
					var relative_path = null;
					while(statement.executeStep()) {
						relative_path = statement.row.relative_filepath;
					}

					var query = "SELECT property_value FROM settings WHERE property_name = 'library_location_input'";
					var statement = branch.root.sql.createStatement(query);
					//statement.params.relative_path = relative_path;
					var library_location = null;
					while(statement.executeStep()) {
						library_location = statement.row.property_value;
					}
					branch.library_path = library_location;


					var file = branch.library_path;
					if(branch.library_path.split('').reverse()[0] != '/') {
						file += "/";
					}
					file += relative_path;
					if(relative_path != null) {
						jsmediatags.read('file://'+file, {
							onSuccess: function(tag) {
								var insert_values = {
									relative_filepath: relative_path,
									/*rating: 0,
									check_value: 1,
									tags: "",
									plays: 0*/
								};
								if(typeof tag.tags.title !== 'undefined' && tag.tags.title != null) {
									insert_values.title = tag.tags.title;
								}
								if(typeof tag.tags.artist !== 'undefined' && tag.tags.artist != null) {
									insert_values.artist = tag.tags.artist;
								}
								if(typeof tag.tags.album !== 'undefined' && tag.tags.album != null) {
									insert_values.album = tag.tags.album;
								}
								if(typeof tag.tags.year !== 'undefined' && tag.tags.year != null) {
									insert_values.year = tag.tags.year;
								}
								if(typeof tag.tags.genre !== 'undefined' && tag.tags.genre != null) {
									insert_values.genre = tag.tags.genre;
								}
								if(typeof tag.tags.TLEN !== 'undefined' && tag.tags.TLEN != null) {
									insert_values.track_length = tag.tags.TLEN.data.toString();
								}
								if(typeof tag.size !== 'undefined' && tag.size != null) {
									insert_values.size = tag.size;
								}
								if(typeof tag.tags.TRCK !== 'undefined' && tag.tags.TRCK != null) {
									insert_values.track = tag.tags.TRCK.data.toString();
								}
								//if(id != null) {
								insert_values.id = id;
								insert_values.info_collected = true;
									/*delete insert_values.tags;
									delete insert_values.rating;
									delete insert_values.check_value;
									delete insert_values.plays;*/
								//}
								var statement = branch.root.local_data.statement.generate(insert_values, "library");
								statement.executeStep();
								branch.root.playlist.reload_playlist(true);
							},
							onError: function(error) {
								/*var insert_values = {
									relative_filepath: relative_path,
									rating: 0,
									check_value: 1,
									tags: "",
									plays: 0
								};
								if(id != null) {
								} else {
									var statement = branch.root.local_data.statement.generate(insert_values, "library");
									statement.executeStep();
								}*/
								////console.log(error);
								//branch.current_index++;
								//branch.read_m3u();
							}
						});
					}
				},
				read_m3u: function() {
					var branch = this;
					if(this.current_index >= this.files.length) {
						branch.root.loading.hide();
						if(typeof branch.read_callback !== 'undefined' && branch.read_callback !== null) {
							branch.read_callback(this.files);
							branch.read_callback = null;
						}
						return;
					}
					var file = this.files[this.current_index];
					var jsmediatags = window.jsmediatags;
					var relative_path = file.split(branch.library_path)[1];
					var query = "SELECT id FROM library WHERE relative_filepath = :relative_path";
					var statement = branch.root.sql.createStatement(query);
					statement.params.relative_path = relative_path;
					var id = null;
					while(statement.executeStep()) {
						id = statement.row.id;
					}
					//console.log('track_id: ');
					//console.log(id);
					/*try {
						jsmediatags.read('file://'+file, {
							onSuccess: function(tag) {
								var insert_values = {
									relative_filepath: relative_path,
									rating: 0,
									check_value: 1,
									tags: "",
									plays: 0
								};
								if(typeof tag.tags.title !== 'undefined' && tag.tags.title != null) {
									insert_values.title = tag.tags.title;
								}
								if(typeof tag.tags.artist !== 'undefined' && tag.tags.artist != null) {
									insert_values.artist = tag.tags.artist;
								}
								if(typeof tag.tags.album !== 'undefined' && tag.tags.album != null) {
									insert_values.album = tag.tags.album;
								}
								if(typeof tag.tags.year !== 'undefined' && tag.tags.year != null) {
									insert_values.year = tag.tags.year;
								}
								if(typeof tag.tags.genre !== 'undefined' && tag.tags.genre != null) {
									insert_values.genre = tag.tags.genre;
								}
								if(typeof tag.tags.TLEN !== 'undefined' && tag.tags.TLEN != null) {
									insert_values.track_length = tag.tags.TLEN.data.toString();
								}
								if(typeof tag.size !== 'undefined' && tag.size != null) {
									insert_values.size = tag.size;
								}
								if(typeof tag.tags.TRCK !== 'undefined' && tag.tags.TRCK != null) {
									insert_values.track = tag.tags.TRCK.data.toString();
								}
								if(id != null) {
									insert_values.id = id;
									delete insert_values.tags;
									delete insert_values.rating;
									delete insert_values.check_value;
									delete insert_values.plays;
								}
								var statement = branch.root.local_data.statement.generate(insert_values, "library");
								statement.executeStep();
								branch.current_index++;
								branch.read_m3u();
							},
							onError: function(error) {
								var insert_values = {
									relative_filepath: relative_path,
									rating: 0,
									check_value: 1,
									tags: "",
									plays: 0
								};
								if(id != null) {
								} else {
									var statement = branch.root.local_data.statement.generate(insert_values, "library");
									statement.executeStep();
								}
								////console.log(error);
								branch.current_index++;
								branch.read_m3u();
							}
						});
					} catch(error) {
						var insert_values = {
							relative_filepath: relative_path,
							rating: 0,
							check_value: 1,
							tags: "",
							plays: 0
						};
						if(id != null) {
						} else {
							var statement = branch.root.local_data.statement.generate(insert_values, "library");
							statement.executeStep();
						}
						////console.log(error);
						branch.current_index++;
						branch.read_m3u();
					}*/
					var insert_values = {
						relative_filepath: relative_path,
						rating: 0,
						check_value: 1,
						tags: "",
						plays: 0
					};
					var statement = branch.root.local_data.statement.generate(insert_values, "library");
					statement.executeStep();
					branch.current_index++;
					branch.read_m3u();
					/*NetUtil.asyncFetch(files[0], function(inputStream, status) {
						if(!Components.isSuccessCode(status)) {
							// Handle error!
							return;
						}

						// The file data is contained within inputStream.
						// You can read it into a string with
						var data = NetUtil.readInputStreamToString(inputStream, inputStream.available());
						//////console.log(data);
						new jsmediatags.Reader(new Blob([data]))
						.read({
							onSuccess: (tag) => {
								////console.log('Success!');
								////console.log(tag);
							},
							onError: (error) => {
								////console.log('Error');
								////console.log(error);
							}
						});
					});*/
					
				},
				get_extension: function(path) {
					var split = path.split('.');
					var extension = split[split.length-1];
					return extension;
				},
				accepted_extensions: [
					"mp3",
					"wav",
					"flac",
					"ogg",
					//"aac",
					//"aiff",
					//"alac",
					//"m4a",
					//"wma"
				],
				index_library: function(library_path) {
					var file = new FileUtils.File(library_path);
					var entries = file.directoryEntries;
					var files = [];
					while(entries.hasMoreElements()) {
						var entry = entries.getNext();
						entry.QueryInterface(Components.interfaces.nsIFile);
						var extension = this.get_extension(entry.path).toLowerCase();
						if(entry.isFile() && this.accepted_extensions.indexOf(extension) != -1) {
							files.push(entry.path);
						} else if(entry.isDirectory()) {
							files.push(...this.index_library(entry.path));
						}
					}
					return files;
				}
			},
		},
	},
	playlist: {
		sidebar: {
			$playlist_side_container: null,
			$playlist_sidebar: null,
			init: function() {
				this.$playlist_sidebar = $('.playlist_sidebar').first();
				this.$playlist_side_container = this.$playlist_sidebar.find('.playlist_side_container').first();

				var branch = this;

				branch.$playlist_side_container.on('drop', function(ev) {
					ev.preventDefault();
					if(ev.originalEvent.dataTransfer.mozGetDataAt("text/plain", 0) == 'songs') {
						var selection = branch.root.playlist.get_selected();
						/*for(var x in selection) {
							var song_id = selection[x];
							branch.add_to_playlist(song_id, id);
							branch.root.playlist.reload_playlist();
						}*/
						branch.new_playlist(selection);
					} else if(ev.originalEvent.dataTransfer.mozGetDataAt("text/plain", 0) == 'playlists') {

					} else {
						////console.log('File(s) dropped');

						// Prevent default behavior (Prevent file from being opened)
						ev.originalEvent.dataTransfer.dropEffect = 'copy';
						//ev.originalEvent.dataTransfer.setDragImage(branch.root.copy_image, 25, 25);
						ev = ev.originalEvent;

						var paths = [];

						if(ev.dataTransfer.items) {
							// Use DataTransferItemList interface to access the file(s)
							for(var i = 0; i < ev.dataTransfer.items.length; i++) {
								// If dropped items aren't files, reject them
								if(ev.dataTransfer.items[i].kind === 'file') {
									var file = ev.dataTransfer.items[i].getAsFile();
									/*////console.log(file);
									////console.log(file.path);
									////console.log('... file[' + i + '].name = ' + file.name);*/
									var path = file.mozFullPath;
									paths.push(path);
								}
							}
						}
						var library_folder = branch.root.settings.properties.library_location_input;
						var in_library_folder = true;
						for(var x in paths) {
							if(paths[x].indexOf(library_folder) != 0) {
								in_library_folder = false;
							}
						}
						if(!in_library_folder) {
							alert('please place the songs/folder in your library folder, then you can add them to your library by copying to playlist sidebar or reindexing your library.');
						} else {
							branch.root.settings.library.index.addition_index(paths, function(file_paths) {
								branch.new_playlist(null, file_paths);
							});
						}
						/* else {
							// Use DataTransfer interface to access the file(s)
							for (var i = 0; i < ev.dataTransfer.files.length; i++) {
								////console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
							}
						}*/
					}
				}).on('dragover', function(e) {
					e.preventDefault();
				});
				branch.load();
				branch.$library_button = branch.$playlist_sidebar.find('.library_button');
				branch.$library_button.first().click(function() {
					branch.root.playlist.load();
					branch.last_selected = null;
					branch.$playlist_side_container.find('.selected').removeClass('selected');
					$(this).addClass('selected');
				});
				branch.$playlist_sidebar.find('.add_playlist_button').first().click(function() {
					branch.edit_playlist();
				});
				branch.$playlist_sidebar.find('.folder_playlist_button').first().click(function() {
					branch.edit_playlist(undefined, undefined, true);
				});
				branch.$playlist_sidebar.find('.trash_button').first().click(function() {

				}).on('dragover', function(e) {
					e.preventDefault();
				}).on('drop', function(e) {
					e.preventDefault();

					if(e.originalEvent.dataTransfer.mozGetDataAt("text/plain", 0) == 'songs') {
						var selected_songs = branch.root.playlist.get_selected();
						if(branch.root.playlist.last_load_id != null && branch.root.playlist.last_load_id != -1) {
							for(var x in selected_songs) {
								var query = "DELETE FROM playlist_songs WHERE playlist_id = "+branch.root.playlist.last_load_id+" AND song_id = "+selected_songs[x];
								var statement = branch.root.sql.createStatement(query);
								statement.executeStep();
							}
							branch.root.playlist.reload_playlist(true);
						} else if(branch.root.playlist.last_load_id != -1) {
							for(var x in selected_songs) {
								var query = "DELETE FROM library WHERE id = "+selected_songs[x];
								var statement = branch.root.sql.createStatement(query);
								statement.executeStep();
							}
							branch.root.playlist.reload_playlist(true);
						}
					} else if(e.originalEvent.dataTransfer.mozGetDataAt("text/plain", 0) == 'playlists') {
						var playlist_id = e.originalEvent.dataTransfer.mozGetDataAt('text/plain', 1);
						branch.root.loading.delete_dialog(function() {
							var query = "DELETE FROM playlists WHERE id = "+playlist_id;
							var statement = branch.root.sql.createStatement(query);
							statement.executeStep();
							branch.load();
						});
					}
				});
				branch.init_edit_playlist();
			},
			currently_editing_playlist: null,
			currently_editing_playlist_is_folder: false,
			init_edit_playlist: function() {
				var branch = this;
				branch.parent.$save_playlist_button.click(function() {
					var name = branch.parent.$playlist_name.val();
					var insert_values;
					var id = branch.currently_editing_playlist;
					if(typeof id === 'undefined' || id == null) {
						insert_values = {
							name: name,
							parent_id: -1,
							is_folder: branch.currently_editing_playlist_is_folder
						};				
					} else {
						insert_values = {
							id: id,
							name: name
						};
					}
					var statement = branch.root.local_data.statement.generate(insert_values, "playlists");
					statement.executeStep();
					branch.root.loading.hide(function() {
						branch.parent.$new_playlist_container.hide();
						branch.currently_editing_playlist = null;
						branch.currently_editing_playlist_is_folder = false;
						branch.load();
					});
				});
			},
			edit_playlist: function(id, name, is_folder) {
				var branch = this;
				if(typeof is_folder !== 'undefined' && is_folder === true) {
					branch.currently_editing_playlist_is_folder = is_folder;
				}
				if(typeof id !== 'undefined') {
					branch.currently_editing_playlist = id;
					branch.parent.$playlist_name.val(name);
				}
				branch.root.loading.display(function() {
					branch.parent.$new_playlist_container.show();
				}, true);
			},
			load_playlist: function(id) {
				var branch = this;
				branch.$playlist_side_container.find('#'+id).trigger('click');
			},
			last_selected: null,
			load: function(parent_id, $container) {
				////console.log('call load');
				var branch = this;
				if(typeof parent_id === 'undefined') {
					parent_id = -1;
					branch.last_selected = branch.$playlist_side_container.find('.selected').attr('id');
					branch.$playlist_side_container.html("");
					$container = branch.$playlist_side_container;
				} else {
					$container = $container.find('.children').first();
				}
				var query = "SELECT * FROM playlists WHERE parent_id = :parent_id";
				var statement = branch.root.sql.createStatement(query);
				statement.params.parent_id = parent_id;
				while(statement.executeStep()) {
					var row = statement.row;
					var folder_prefix = "";
					if(statement.row.is_folder === 1) {
						folder_prefix = " - ";
					}
					$container.append("\
						<vbox class='playlist' id='"+row.id+"'>\
							<label>"+folder_prefix+statement.row.name+"</label>\
							<vbox class='children'></vbox>\
						</vbox>");
					var $playlist_item = branch.$playlist_side_container.find('#'+statement.row.id).first();
					var is_folder = statement.row.is_folder;
					branch.load(row.id, $playlist_item);
					(function(id, name, is_folder){
						$playlist_item.click(function(e) {
							e.stopPropagation();
							/*if(e.metaKey) {
								var new_tab = window.open("chrome://browser/content/music.xul");
								var $new_tab = $(new_tab.document).ready(function() {
									new_tab.music_app.loaded_callbacks.push(function() {

										new_tab.music_app.playlist.sidebar.load_playlist(id);
									});
								
								});
							} else {*/
								document.title = name;
								if(!is_folder) {
									branch.root.playlist.load(id);
								} else {
									branch.root.playlist.load_folder(id);
								}
								var $this = $(this);
								branch.$playlist_side_container.find('.selected').removeClass('selected');
								branch.$library_button.removeClass('selected');
								$this.addClass('selected');
							//}
						}).attr('draggble', 'true').on('dragstart', function(e) {
							e.stopPropagation();
							e.originalEvent.dataTransfer.mozSetDataAt("text/plain", 'playlists', 0);
							e.originalEvent.dataTransfer.mozSetDataAt("text/plain", id, 1);
						}).on('dragover', function(e) {
							$(this).addClass('drag_over');
							e.preventDefault();
						}).on('dragleave', function(e) {
							$(this).removeClass('drag_over');
							e.preventDefault();
						}).on('drop', function(e) {
							$(this).removeClass('drag_over');
							e.stopPropagation();
							e.preventDefault();
							if(e.originalEvent.dataTransfer.mozGetDataAt('text/plain', 0) == 'playlists') {
								var playlist_id = e.originalEvent.dataTransfer.mozGetDataAt('text/plain', 1);
								if(is_folder) {
									var query = "UPDATE playlists SET parent_id = "+id+" WHERE id = "+playlist_id;
									var statement = branch.root.sql.createStatement(query);
									statement.executeStep();
									branch.load();
								} else {
									var query = "SELECT library.id FROM library, playlists, playlist_songs WHERE library.id = playlist_songs.song_id AND playlist_songs.playlist_id = playlists.id AND playlists.id = :playlist_id";
									////console.log(query);

									var statement = branch.root.sql.createStatement(query);
									statement.params.playlist_id = playlist_id;
									while(statement.executeStep()) {
										var row = statement.row;
										branch.add_to_playlist(row.id, id);
									}
									//branch.load();
									branch.root.playlist.reload_playlist();
								}
							} else if(e.originalEvent.dataTransfer.mozGetDataAt('text/plain', 0) == 'songs') {
								var selection = branch.root.playlist.get_selected();
								for(var x in selection) {
									var song_id = selection[x];
									branch.add_to_playlist(song_id, id);
								}
								//branch.root.playlist.reload_playlist();
							} else {
								e.originalEvent.dataTransfer.dropEffect = 'copy';
								//ev.originalEvent.dataTransfer.setDragImage(branch.root.copy_image, 25, 25);
								
								var ev = e.originalEvent;

								var paths = [];

								if(ev.dataTransfer.items) {
									// Use DataTransferItemList interface to access the file(s)
									for(var i = 0; i < ev.dataTransfer.items.length; i++) {
										// If dropped items aren't files, reject them
										if(ev.dataTransfer.items[i].kind === 'file') {
											var file = ev.dataTransfer.items[i].getAsFile();
											/*////console.log(file);
											////console.log(file.path);
											////console.log('... file[' + i + '].name = ' + file.name);*/
											var path = file.mozFullPath;
											paths.push(path);
										}
									}
								}
								var library_folder = branch.root.settings.properties.library_location_input;
								var in_library_folder = true;
								for(var x in paths) {
									if(paths[x].indexOf(library_folder) != 0) {
										in_library_folder = false;
									}
								}
								if(!in_library_folder) {
									alert('please place the songs/folder in your library folder, then you can add them to your library by copying to playlist sidebar or reindexing your library.');
								} else {
									branch.root.settings.library.index.addition_index(paths, function(file_paths) {
										branch.add_paths_to_playlist(id, file_paths, library_folder);
										branch.root.playlist.reload_playlist(true);
									});
								}
							}

						}).on('dblclick', function(e) {
							branch.edit_playlist(id, name);
						});
						if(id == branch.last_selected) {
							$playlist_item.addClass('selected');
							document.title = name;
						}
					})(row.id, row.name, is_folder);
				}

			},
			add_paths_to_playlist: function(playlist_id, paths, library_folder) {
				var branch = this;
				//console.log(paths);
				for(var x in paths) {
					var path = paths[x];
					path = path.split(library_folder)[1];
					var query = "SELECT id FROM library WHERE relative_filepath = :relative_path";
					var statement = branch.root.sql.createStatement(query);
					statement.params.relative_path = path;
					////console.log(path);

					var song_id = null;
					while(statement.executeStep()) {
						song_id = statement.row.id;
					}
					//console.log('song_id');
					//console.log(song_id);
					if(song_id != null) {
						branch.add_to_playlist(song_id, playlist_id);
						//console.log('add to playlist');
					}
				}
				//branch.root.playlist.reload_playlist(playlist_id);
			},
			new_playlist: function(ids, paths) {
				var branch = this;
				var insert_values = {
					name: 'untitled playlist',
					parent_id: -1,
					is_folder: 0
				};

				var statement = branch.root.local_data.statement.generate(insert_values, "playlists");
				statement.executeStep();
				var id = branch.root.local_data.statement.last_insert_id("playlists");
				////console.log('playlist_id: ');
				////console.log(id);
				var library_folder = branch.root.settings.properties.library_location_input;

				if(typeof paths !== 'undefined' && paths != null) {
					//console.log(paths);
					for(var x in paths) {
						var path = paths[x];
						path = path.split(library_folder)[1];
						var query = "SELECT id FROM library WHERE relative_filepath = :relative_path";
						var statement = branch.root.sql.createStatement(query);
						statement.params.relative_path = path;
						////console.log(path);

						var song_id = null;
						while(statement.executeStep()) {
							song_id = statement.row.id;
						}
						//console.log('song_id');
						//console.log(song_id);
						if(song_id != null) {
							branch.add_to_playlist(song_id, id);
							//console.log('add to playlist');
						}
					}
				} else {
					for(var x in ids) {
						var song_id = ids[x];
						branch.add_to_playlist(song_id, id);
					}
				}
				branch.load();
			},
			add_to_playlist: function(song_id, playlist_id, not_perform_reload) {
				var branch = this;
				var query = "SELECT COUNT(*) as count FROM playlist_songs WHERE playlist_id = :playlist_id AND song_id = :song_id";
				var statement = branch.root.sql.createStatement(query);
				statement.params.song_id = song_id;
				statement.params.playlist_id = playlist_id;
				var count = null;
				while(statement.executeStep()) {
					count = statement.row.count;
				}
				if(count == 0 || count == null) {
					var insert_values = {
						playlist_id: playlist_id,
						song_id: song_id
					};
					var statement = branch.root.local_data.statement.generate(insert_values, "playlist_songs");
					statement.executeStep();
				}
				if(typeof branch.root.playlist.playlist_store_tables[playlist_id] !== 'undefined') {
					delete branch.root.playlist.playlist_store_tables[playlist_id];
				}
				/*if(typeof not_perform_reload === 'undefined') {
					branch.root.playlist.reload_playlist(playlist_id);
				}*/
			},
		},
		$playlist_view: null,
		custom_event: function(eventName, element, data) {
			//'use strict';
			var event;
			data = data || {};
			if (document.createEvent) {
			    event = document.createEvent("HTMLEvents");
			    event.initEvent(eventName, true, true);
			} else {
			    event = document.createEventObject();
			    event.eventType = eventName;
			}

			event.eventName = eventName;
			event = $.extend(event, data);

			if (document.createEvent) {
			    element.dispatchEvent(event);
			} else {
			    element.fireEvent("on" + event.eventType, event);
			}
		},
		song_info: {
			$edit_song_info_container: null,
			init: function() {
				var branch = this;
				branch.$edit_song_info_container = branch.parent.$playlist_view.find('#edit_song_info_container').first();
				branch.$edit_song_info_container.find('.song_info_apply_button').first().click(function() {
					var set_values = {

					};
					var selected_items = branch.parent.get_selected(true);
					branch.$edit_song_info_container.find('.song_info_value').each(function() {
						var $this = $(this);
						var disabled_attribute = $this.attr('disabled');
						if(typeof disabled_attribute === 'undefined' || disabled_attribute == null || disabled_attribute.trim().length == 0) {
							var id = $this.attr('id');
							var value = $this.val();
							if(value.trim().length > 0) {
								set_values[id] = value;
							}
						}
					});
					var checked_checkbox = branch.$edit_song_info_container.find('.song_info_checkbox').first();
					if(checked_checkbox.attr('checked') == "true") {
						set_values.check_value = true;
					}
					var tags = "";
					branch.$edit_song_info_container.find('.tag_checkbox').each(function() {
						var $this = $(this);
						if($this.attr('checked') == "true") {
							////console.log($(this).attr('id'));
							tags += $(this).attr('id')+",";
						}
					});
					if(selected_items.length == 1) {
						set_values.tags = tags;
					}
					for(var x in selected_items) {
						var item = selected_items[x];
						for(var i in set_values) {
							item[i] = set_values[i];
						}
						if(item.rating != null) {
							item.rating = parseInt(item.rating);
						}
						var insert_values = {...item};
						if(selected_items.length == 1) {
							insert_values.tags = tags;
						}
						////console.log(tags);
						delete insert_values.order;
						delete insert_values.is_playing;
						var statement = branch.root.local_data.statement.generate(insert_values, "library");
						statement.executeStep();

					}
					branch.parent.sort();
				});
				branch.$edit_song_info_container.find('.song_info_cancel_button').first().click(function() {
					branch.load();
				});
				branch.$edit_song_info_container.find('.read_song_info_button').first().click(function() {
					if(branch.current_info_id != null) {
						branch.root.settings.library.index.read_info(branch.current_info_id);
					}
				});
			},
			current_info_id: null,
			load: function() {
				var branch = this;
				var selected_items = branch.parent.get_selected(true);
				var tags;
				var check_value;
				branch.$edit_song_info_container.find('.song_info_value').val('');
				branch.$edit_song_info_container.find('.song_info_checkbox').removeAttr('checked');
				branch.$edit_song_info_container.find('.tag_checkbox').removeAttr('checked');
				if(selected_items.length == 1) {
					branch.$edit_song_info_container.find('#title').first().removeAttr('disabled');
					branch.$edit_song_info_container.find('.tag_checkbox').attr('disabled', 'false');
					for(var x in selected_items[0]) {
						var $input = branch.$edit_song_info_container.find('#'+x);
						if($input.length > 0) {
							$input.val(selected_items[0][x]);
						}
					}
					tags = selected_items[0].tags;
					check_value = selected_items[0].check_value;
					branch.current_info_id = selected_items[0].id;
				} else {
					branch.current_info_id = null;
					branch.$edit_song_info_container.find('#title').first().val('multiple items selected').attr('disabled', 'true');
					branch.$edit_song_info_container.find('.tag_checkbox').attr('disabled', 'true');
					var item = selected_items[0];
					var same_info = {...item};
					for(var x in selected_items) {
						var compare_item = selected_items[x];
						for(var i in compare_item) {
							if(item[i] != compare_item[i]) {
								//same_info[i] = item[i];
								delete same_info[i];
							}
						}
					}
					for(var x in same_info) {
						var $input = branch.$edit_song_info_container.find('#'+x);
						if($input.length > 0) {
							$input.val(selected_items[0][x]);
						}
					}
					////console.log('same_info');
					////console.log(same_info);
					if(typeof same_info.tags !== 'undefined') {
						tags = same_info.tags;
					}
					if(typeof same_info.check_value !== 'undefined') {
						check_value = same_info.check_value;
					}
				}
				if(typeof tags !== 'undefined') {
					if(tags.indexOf(',') != -1) {
						var split = tags.split(',');
						branch.$edit_song_info_container.find('.tags_container').find('.tag_checkbox').removeAttr('checked');
						for(var x in split) {
							if(split[x].length > 0) {
								branch.$edit_song_info_container.find('.tags_container').find('#'+split[x]).first().attr('checked', 'true');
							}
						}
					}
				}
				if(typeof check_value !== 'undefined') {
					branch.$edit_song_info_container.find('.song_info_checkbox').first().attr('checked', 'true');
				}
			}
		},
		$new_playlist_container: null,
		$playlist_name: null,
		$save_playlist_button: null,
		init: function() {
			var branch = this;
			branch.$playlist_view = $('.playlist_view').first();

			/*setTimeout(function() {
				branch.root.controls.$controls.parent().find('.song_info').first().css({
					'display': 'flex'
				});
			}, 8000);*/

			var $playlist_listbox = branch.$playlist_view.find('.playlist_listbox').first();

			/*$playlist_listbox.find('listitem').each(function() {
				$(this).click(function(e) {
					////console.log('click');
					e.stopPropagation();
					e.preventDefault();*/
					//$playlist_listbox[0].addItemToSelection(this);
					/*return false;
				});
			});*/

			//$playlist_listbox[0].currentIndex = last_index;		//----vip----
			
			var $tree = branch.$playlist_view.find('#tree').first();
			var $tree_children = $tree.find('#tree_children').first();

			branch.$tree = $tree;
			branch.tree = $tree[0];
			branch.$tree_children = $tree_children;
			branch.init_playlist();
			if(branch.root.loaded_callbacks.length == 0) {
				branch.load();
			}

			branch.song_info.init();

			branch.$tree.on('select', function(e) {
				////console.log('select');
				branch.song_info.load();
			});

			branch.$new_playlist_container = $('.loading_screen').find('.new_playlist_container').first();
			branch.$playlist_name = branch.$new_playlist_container.find('#playlist_name').first();
			branch.$save_playlist_button = branch.$new_playlist_container.find('.save_playlist_button').first();

			branch.sidebar.init();
			branch.$controls = $('.controls').first();
			branch.$controls.find('.move_after_button').first().click(function() {
				if(branch.$tree.attr('sortResource') == 'order' && branch.$tree.attr('sortDirection') == 'ascending') {
					////console.log('click');
					var item_offset = branch.table.map(function(e) {
		                return e.id;
		            }).indexOf(branch.root.controls.currently_playing_id)+1;
		            var selected_indicies = branch.get_selected(true);
		            for(var x in selected_indicies) {
						var index = branch.table.indexOf(selected_indicies[x]);
						branch.table.splice(index, 1);
					}
					////console.log(selected_indicies);
					var counter = 0;
					for(var x in selected_indicies) {
						branch.table.splice(item_offset+counter, 0, selected_indicies[x]);
						counter++;
					}
					branch.reset_order();
					var sort_values = [];
					for(var x in selected_indicies) {
						sort_values.push(selected_indicies[x].id);
					}
					branch.sort(false, sort_values);
				} else {
					alert('you most order the playlist by song order to alter the order of the playlist');
				}
			});
			branch.$controls.find('.continue_playlist_button').first().click(function() {
				if(typeof branch.last_load_id != 'undefined' && branch.last_load_id != null && branch.root.playlist.last_load_id != -1) {
					var query = "SELECT * FROM playlists WHERE id = "+branch.last_load_id;
					var statemment_query = branch.root.sql.createStatement(query);
					if(statemment_query.executeStep()) {
						var last_played_song_id = statemment_query.row.last_played_song_id;
						/*var item_offset = branch.table.map(function(e) {
			                return e.id;
			            }).indexOf(last_played_song_id);
			            //if(item_offset >= branch.table.length
			            //var next_song = branch.table[
			            branch.current_play_index = item_offset;*/
			            branch.current_play_id = last_played_song_id;
			            branch.play_next();
			        }
				}
			});
			branch.$controls.find('.scroll_to_button').first().click(function() {
				//var current_id = branch.root.controls.currently_playing_id;
				var item_offset = branch.table.map(function(e) {
	                return e.id;
	            }).indexOf(branch.root.controls.currently_playing_id);
	            var box_object = branch.tree.boxObject;
	            box_object.scrollToRow(item_offset);
	            //console.log(box_object);
			});
			branch.$controls.find('.loop_button').first().click(function() {
				var $this = $(this);
				if(!$this.hasClass('toggled_on')) {
					$this.addClass('toggled_on');
					branch.loop = true;
				} else {
					$this.removeClass('toggled_on');
					branch.loop = false;
				}
			});
			branch.$edit_song_info = branch.$playlist_view.find('#edit_song_info_container').first();
			branch.$controls.find('.info_button').first().click(function() {
				var $this = $(this);
				if(!$this.hasClass('toggled_on')) {
					$this.addClass('toggled_on');
					branch.$edit_song_info.fadeIn('slow');
				} else {
					$this.removeClass('toggled_on');
					branch.$edit_song_info.fadeOut('slow');
					
				}
			});
			branch.$controls.find('.shuffle_button').first().click(function() {
				branch.table = branch.root.numrand.reorder_list(branch.table);
				branch.store_table = branch.table;
				/*if(branch.root.controls.currently_playing_id != null) {
					var playing_index = branch.table.map(function(i) {
						return i.id;
					}).indexOf(branch.root.controls.currently_playing_id);
					var list_reordered = branch.table.splice(playing_index, 1);
					list_reordered.push(...branch.table);
					branch.table = list_reordered;
				}*/
				branch.reset_order();
				branch.sort({ id: 'order' }, null, true);
			});
			branch.$controls.find('.shuffle_options').first().click(function() {
				var result = branch.root.gradient.order();
				branch.table = result;
				branch.reset_order();
				branch.sort({ id: 'order' }, null, true);
			});
			branch.call_save_order();
		},
		data: [],
		table: null,
		load_folder: function(id, sub_call, is_folder) {
			var branch = this;
			var query = "SELECT * FROM playlists WHERE parent_id = "+id;
			var statement = branch.root.sql.createStatement(query);
			var ids;
			if(is_folder) {
				ids = [];
			} else {
				ids = [id];
			}
			////console.log('parent_id: '+id);
			////console.log(ids);
			while(statement.executeStep()) {
				var sub_id = statement.row.id;
				ids = ids.concat(this.load_folder(sub_id, true, (statement.row.is_folder == 1 ? true : false)));
			}
			if(typeof sub_call === 'undefined') {
				var union_query = "";
				var counter = 0;
				for(var x in ids) {
					var query_id = ids[x];
					if(counter > 0) {
						union_query += " UNION ";
					}
					union_query += "SELECT library.*, playlist_songs.song_order FROM library, playlists, playlist_songs WHERE library.id = playlist_songs.song_id AND playlist_songs.playlist_id = playlists.id AND playlists.id = "+query_id;
					counter++;
				}
				//console.log(union_query);
				this.load(id, union_query);
			} else {
				return ids;
			}
		},
		reload_playlist: function(reload_all, load_id) {
			var branch = this;
			/*if(typeof load_id !== 'undefined') {
				this.load(load_id, undefined, true);
			} else {*/
				/*if(this.last_load_id != null) {
					this.load(this.last_load_id);
				}*/
				//$("#search").first().val("");
				if(typeof reload_all !== 'undefined') {
					if(this.last_load_id != null && branch.root.playlist.last_load_id != -1) {
						this.load(this.last_load_id, undefined, true);
					} else {
						this.load(undefined, undefined, true);
						//branch.parent.sidebar.$library_button.trigger('click');
					}
				} else {
					this.sort(null);
				}
			//}
			$("#search").first().trigger('keyup');
		},
		last_load_id: null,
		playlist_store_tables: {},
		last_top_row: null,
		load: function(id, send_query, force_reload) {
			var branch = this;
			var statement;
			if(id == branch.last_load_id) {
				branch.last_top_row = branch.get_top_visible_row();
			} else {
				branch.last_top_row = null;
			}
			if(branch.last_load_id != null && branch.root.playlist.last_load_id != -1) {
				var insert_values = {
					id: branch.last_load_id,
					sort_direction: branch.$tree.attr('sortDirection'),
					sort_resource: branch.$tree.attr('sortResource')
				};
				statement = branch.root.local_data.statement.generate(insert_values, "playlists");
				statement.executeStep();
				branch.playlist_store_tables[branch.root.playlist.last_load_id] = branch.store_table;
			}
			if(typeof id != 'undefined' && id != null) {
				var state_query = "SELECT * FROM playlists WHERE id = "+id;
				var state_statement = branch.root.sql.createStatement(state_query);
				state_statement.executeStep();
				var sort_direction = state_statement.row.sort_direction;
				var sort_resource = state_statement.row.sort_resource;
				if(sort_direction != null && sort_resource != null) {
					branch.$tree.attr('sortResource', sort_resource);
					branch.$tree.attr('sortDirection', sort_direction);
				}
			}

			if(typeof id === 'undefined') {
				document.title = 'library';
				branch.last_load_id = null;
			} else {
				branch.last_load_id = id;
			}

			if(typeof branch.playlist_store_tables[branch.root.playlist.last_load_id] !== 'undefined' && typeof force_reload === 'undefined') {
				branch.store_table = branch.playlist_store_tables[branch.root.playlist.last_load_id];
				branch.table = branch.store_table;
				branch.sort(null, null, true, false);
			} else {
				var query = "SELECT * FROM library";
				if(typeof id !== 'undefined') {
					query = "SELECT library.*, playlist_songs.song_order FROM library, playlists, playlist_songs WHERE library.id = playlist_songs.song_id AND playlist_songs.playlist_id = playlists.id AND playlists.id = :id ORDER BY playlist_songs.song_order ASC";
					if(typeof send_query !== 'undefined') {
						query = send_query;
						branch.last_load_id = -1;
					}
				}

				statement = branch.root.sql.createStatement(query);
				if(typeof id !== 'undefined' && typeof send_query === 'undefined') {
					statement.params.id = id;
				}	
				/*while(statement.executeStep()) {
					id = statement.row.id;
				}*/
				branch.data = [];
				statement.executeAsync({
					handleResult: function(aResultSet) {
						//var counter = 0;
						for(var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow()) {
							var title = row.getResultByName("title");
							if(title == null || title.length == 0) {
								title = row.getResultByName("relative_filepath").split('/');
								title = title[title.length-1];
							}
							var song_object = {
								id: row.getResultByName("id"),
								order: 0,
								title: title,
								artist: row.getResultByName("artist"),
								album: row.getResultByName("album"),
								year: row.getResultByName("year"),
								track: row.getResultByName("track"),
								genre: row.getResultByName("genre"),
								length: row.getResultByName("track_length"),
								size: row.getResultByName("size"),
								plays: row.getResultByName("plays"),
								last_played: row.getResultByName("last_played"),
								date_added: row.getResultByName("date_added"),
								tags: row.getResultByName("tags"),
								rating: row.getResultByName("rating"),
								check_value: (row.getResultByName("check_value") == 1 ? true : false),
								relative_filepath: row.getResultByName("relative_filepath")
							};
							if(typeof id !== 'undefined') {
								song_object.order = row.getResultByName('song_order');
							}
							song_object.is_playing = false;

							branch.data.push(song_object);
							//counter++;
						}

					},
					
					handleError: function(aError) {
						console.log("Error: " + aError.message);
					},
					
					handleCompletion: function(aReason) {
						if(aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {

							console.log("Query canceled or aborted!");
						} else {
							branch.last_sort_column = null;
							branch.table = branch.data;
							branch.store_table = branch.table;
							branch.tree.view = branch.tree_view(branch.table);
							branch.reset_order(false);
							var reset_order_cancel;
							if(typeof send_query === 'undefined') {
								reset_order_cancel = true;
							}
							if(typeof id === 'undefined') {
								reset_order_cancel = false;
							}
							branch.sort(null, null, true, reset_order_cancel); //{ id: "order" }
						}
					}
				});
			}

		},
		last_selection: null,
		playlist_dblclick_in_progress: false,
		current_play_index: -1,
		current_play_id: null,
		play_next: function(next_play_index) {
			var branch = this;
			if(branch.table.length == 0) {
				return;
			}
			if(typeof next_play_index === 'undefined') {
				branch.current_play_index = branch.table.map(function(e) {
	                return e.id;
	            }).indexOf(branch.current_play_id);
			} else {
				branch.current_play_index = next_play_index;
			}
			branch.current_play_index++;
			if(branch.current_play_index >= branch.table.length) {
				branch.current_play_index = 0;
				if(branch.loop) {
					var id = branch.table[branch.current_play_index].id;
					if(branch.table[branch.current_play_index].check_value) {
						branch.root.controls.play(id);
					} else {
						branch.play_next(-1);
					}
				}	
				return;
			}
			if(typeof branch.table[branch.current_play_index] !== 'undefined') {
				var id = branch.table[branch.current_play_index].id;
				if(branch.table[branch.current_play_index].check_value === true) {
					branch.root.controls.play(id);
				} else {
					branch.play_next(branch.current_play_index);
				}
			}
		},
		play_previous: function() {
			var branch = this;
			branch.current_play_index = branch.table.map(function(e) {
                return e.id;
            }).indexOf(branch.current_play_id);
			branch.current_play_index--;
			if(branch.current_play_index < 0) {
				branch.current_play_index = branch.table.length-1;
				/*if(branch.loop) {
					var id = branch.table[branch.current_play_index].id;
					branch.root.controls.play(id);
					return;
				}*/
				return;	
			}
			var id = branch.table[branch.current_play_index].id;
			if(branch.table[branch.current_play_index].check_value) {
				branch.root.controls.play(id);
			} else {
				branch.play_previous();
			}
		},
		play_timeout: null,
		init_playlist: function() {
			var branch = this;
			/*if(typeof id === 'undefined') {

			}*/
			//branch.tree.sortResource = 'description';
			branch.$tree.find('treecol').each(function() {
				var $this = $(this);
				$this.click(function() {
					branch.sort(this);
				});
			});
			/*branch.$tree.on('select', function(e) {
				////console.log(e);
			});*/
			branch.$tree_children.on('dblclick', function(e) {
				//if(!e.shiftKey && !e.ctrlKey) {
				//branch.playlist_dblclick_in_progress = true;

				/*e.preventDefault();
				e.stopPropagation();
    			e.stopImmediatePropagation();
    			branch.tree.stopEditing();

				var row = {}, column = {}, part = {};
				var box_object = branch.tree.boxObject;
				box_object.getCellAt(e.clientX, e.clientY, row, column, part);
				////console.log(row);
				var id = branch.table[row.value].id;
				branch.current_play_index = row.value;
				////console.log(id);
				//var filepath = branch.tree.view.getCellValue(row.value, 16);
				branch.root.controls.play(id);
				return false;*/
				//clearTimeout(branch.play_timeout);
				clearTimeout(branch.play_timeout);
				branch.play_timeout = setTimeout(function() {
					if(!e.shiftKey && !e.metaKey) {
						var row = {}, column = {}, part = {};
						var box_object = branch.tree.boxObject;
						box_object.getCellAt(e.clientX, e.clientY, row, column, part);
						if(row.value != -1 && (column.value.id == 'order' || column.value.id == 'is_playing')) {
							////console.log(row);
							var id = branch.table[row.value].id;
							branch.current_play_index = row.value;
							branch.current_play_id = id;
							////console.log(id);
							//var filepath = branch.tree.view.getCellValue(row.value, 16);
							branch.root.controls.play(id);
						}
					}
				}, 350);
			});
			branch.$tree_children.on('click', function(e) {
				clearTimeout(branch.play_timeout);
				branch.play_timeout = setTimeout(function() {
					if(!e.shiftKey && !e.metaKey) {
						var row = {}, column = {}, part = {};
						var box_object = branch.tree.boxObject;
						box_object.getCellAt(e.clientX, e.clientY, row, column, part);
						if(row.value != -1 && (column.value.id == 'order' || column.value.id == 'is_playing')) {
							////console.log(row);
							var id = branch.table[row.value].id;
							branch.current_play_index = row.value;
							branch.current_play_id = id;
							////console.log(id);
							//var filepath = branch.tree.view.getCellValue(row.value, 16);
							branch.root.controls.play(id);
						}
					}
				}, 350);
				//if(!branch.playlist_dblclick_in_progress) {
					/*var row = {}, column = {}, part = {};
					var box_object = branch.tree.boxObject;
					box_object.getCellAt(e.clientX, e.clientY, row, column, part);
					////console.log(row);
					////console.log(column);
					var last_selection = {
						row: row,
						column: column
					};

					if(!e.shiftKey && !e.metaKey) {
						if(branch.last_selection != null && last_selection.row.value == branch.last_selection.row.value) {
							branch.tree.startEditing(row.value, column.value);
						}
					}
					branch.last_selection = last_selection;*/
				/*} else {
					branch.tree.stopEditing();
				}
				branch.playlist_dblclick_in_progress = false;*/
			});

			branch.$tree_children.on('dragstart', function(e) {
				////console.log('dragstart');
				var dt = e.originalEvent.dataTransfer;
				var selected_indicies = branch.get_selected();
				if(selected_indicies.length == 0) {
					return false;
				}

				

				e.originalEvent.dataTransfer.setDragImage(branch.root.copy_image, 25, 25);
				dt.mozSetDataAt("text/plain", "songs", 0);
				dt.dropEffect = "move";
				//nsDragAndDrop.startDrag(event, abResultsPaneObserver);
			}).on('dragover', function(e) {
 				e.preventDefault();
				e.originalEvent.dataTransfer.dropEffect = 'move';
			}).on('drop', function(e) {
				if(e.currentTarget == branch.$tree_children[0] && branch.$tree.attr('sortResource') == 'order' && branch.$tree.attr('sortDirection') == 'ascending') {
					/*var nodes = document.getAnonymousNodes(branch.tree);
					var tree_stack = nodes[1];
					var $scrollbar = $(tree_stack).find(':nth-child(1)').first();
					//nodes = document.getAnonymousNodes(tree_stack);
					//////console.log(tree_stack);
					//alert($scrollbar[0]);
					nodes = document.getAnonymousNodes($scrollbar[0]);
					//////console.log(nodes);
					var scrollbar = nodes[1];
					//alert($(scrollbar).attr('curpos'));
					var scroll_offset = parseInt($(scrollbar).attr('curpos'));

					var offset = branch.$tree_children.offset();
					var cursor_x = e.originalEvent.clientX - offset.left;
					var cursor_y = e.originalEvent.clientY - offset.top;
					var item_offset = Math.floor((cursor_y+scroll_offset)/18);*/
					var selected_indicies = branch.get_selected(true);

					var sort_direction = branch.$tree.attr('sortDirection');
					if(sort_direction == 'descending') {
						item_offset = branch.tree.view.rowCount-item_offset;
						if(item_offset < 0) {
							item_offset = 0;
						}
						selected_indicies = selected_indicies.reverse();
					}


					var row = {}, column = {}, part = {};
					var box_object = branch.tree.boxObject;
					box_object.getCellAt(e.clientX, e.clientY, row, column, part);

					var item_offset = row.value;
					////console.log('offset row: ');
					////console.log(item_offset);


					var below_count = 0;
					for(var x in selected_indicies) {
						var index = branch.table.indexOf(selected_indicies[x]);
						branch.table.splice(index, 1);
						if(index < item_offset) {
							below_count++;
						}
					}

					item_offset -= below_count;

					var counter = 0;
					for(var x in selected_indicies) {
						/*var set_item_offset = item_offset;
						if(selected_indicies[x] < item_offset) {
							set_item_offset -= selected_indicies.length;
						}*/
						branch.table.splice(item_offset+counter, 0, selected_indicies[x]);
						counter++;
					}
					branch.reset_order();
					var sort_values = [];
					for(var x in selected_indicies) {
						sort_values.push(selected_indicies[x].id);
					}
					branch.sort(false, sort_values);
				}
				e.preventDefault();
			});

			

			//branch.$tree_children[0].scrollTop = 15;
		},
		save_order_timeout: null,
		reset_order: function(save) {
			var branch = this;
			if(typeof save === 'undefined') {
				save = true;
			}	
			var counter = 1;
			for(var x in this.table) {
				this.table[x].order = counter;
				counter++;
			}
			if(save) {
				branch.save_order(branch.last_load_id, branch.store_table);
				/*var branch = this;
				clearTimeout(this.save_order_timeout);
				this.save_order_timeout = setTimeout(function() {
					if(!branch.save_order_in_progress) {
						branch.save_order(branch.last_load_id, branch.table);
					} else {
						branch.save_order_interrupt = true;
						clearTimeout(this.save_order_timeout);
						branch.save_order_timeout = setTimeout(function() {
							if(!branch.save_order_in_progress) {
								branch.save_order(branch.last_load_id, branch.table);
							}
						}, 250);
					}
				}, 250);*/
			}
		},
		call_save_order_timeout: null,
		call_save_order: function() {
			var branch = this;
			//console.log('call');
			//console.log(branch.last_load_id);
			/*if(branch.last_load_id != null && branch.last_load_id != -1) {
				branch.save_order(branch.last_load_id, branch.store_table);
			} else {
				clearTimeout(branch.call_save_order_timeout);
				branch.call_save_order_timeout = setTimeout(function() {
					branch.call_save_order();
				}, 250);
			}*/
		},
		save_order_in_progress: false,
		save_order_interrupt: false,
		save_order: function(last_load_id, table) {
			var branch = this;
			branch.save_order_in_progress = true;
			if(last_load_id != null && last_load_id != -1) {
				//console.log('inside');
				/*var query = "DELETE FROM playlist_songs WHERE playlist_id = "+branch.last_load_id;
				var statement = branch.root.sql.createStatement(query);
				statement.executeStep();*/

				//for(var x in branch.table) {
				var index = 0;
				var playlist_id = last_load_id;
				var run_save_order = function(x) {
					var id = table[x].id;
					var order = table[x].order;
					/*var insert_values = {
						song_id: parseInt(id),
						song_order: parseInt(order),
						playlist_id: parseInt(branch.last_load_id)
					};*/
					/*var query = "DELETE FROM playlist_songs WHERE song_id = "+id+" AND playlist_id = "+branch.last_load_id;
					////console.log(query);
					var statement = branch.root.sql.createStatement(query);
					statement.executeStep();*/
					//statement = branch.root.local_data.statement.generate(insert_values, "playlist_songs");
					var query = "UPDATE playlist_songs SET song_order = :song_order WHERE song_id = :song_id AND playlist_id = :playlist_id";
					var statement = branch.root.sql.createStatement(query);
					statement.params.song_id = parseInt(id);
					statement.params.playlist_id = parseInt(playlist_id);
					statement.params.song_order = parseInt(order);
					statement.executeAsync({handleCompletion: function(a_reason) {
						index += 1;
						/*if(!branch.save_order_interrupt && index < table.length) {
							setTimeout(function() {*/
								run_save_order(index);
							/*}, 5);
						} else {
							branch.save_order_in_progress = false;
							//branch.save_order_interrupt = false;
							clearTimeout(branch.call_save_order_timeout);
							branch.call_save_order_timeout = setTimeout(function() {
								branch.call_save_order();
							}, 250);
						}*/
					}});
				};
				if(table.length > 0) {
					run_save_order(index);
				}
			}
		},
		get_top_visible_row: function() {
			return this.tree.treeBoxObject.getFirstVisibleRow();
		},
		set_top_visible_row: function(topVisibleRow) {
			return this.tree.treeBoxObject.scrollToRow(topVisibleRow);
		},
		prepare_for_comparison: function(value, index_of) {
			if(typeof index_of !== 'undefined' && (typeof value === 'string' || typeof value === 'number')) {
				return (value+'').toLowerCase();
			} else if(typeof value === 'string') {
				return value.toLowerCase();
			}
			if(typeof index_of !== 'undefined') {
				return "";
			}
			return value;
		},
		store_table: null,
		restore_playlist: function() {
			var branch = this;
			if(branch.store_table != null) {
				var selection = branch.get_selected();
				branch.table = branch.store_table;
				branch.sort(null, selection, true);
				branch.scroll_to_selection(selection);
			}
		},
		scroll_to_selection: function(selection) {
			var branch = this;
			if(typeof selection === 'undefined') {
				selection = branch.get_selected();
			}
			if(selection.length > 0) {
				var first_id = selection[0];
				var item_offset = branch.table.map(function(e) {
					return e.id;
				}).indexOf(first_id);
				var box_object = branch.tree.treeBoxObject//branch.tree.boxObject;
		        box_object.scrollToRow(item_offset);
		    }
		},
		filter: function(value) {
			var branch = this;
			//branch.root.playlist.restore_playlist();
			var data = branch.store_table;
			//
			var selection = branch.get_selected();
			branch.table = [];
			//console.log(selection);
			data.forEach(function(element) {
				for(var i in element) {
					if(branch.prepare_for_comparison(element[i], true).indexOf(value) != -1) {
						branch.table.push(element);
						break;
					}
				}
			});
			branch.sort(null, selection, true);
		},
		tree_view: function(table) {
			var branch = this;
			function tree_view(table, branch) {
				this.branch = branch;
				this.rowCount = table.length;
				this.getCellText = function(row, col) {
					return table[row][col.id];
				};
				this.getCellValue = function(row, col) {
					return table[row][col.id];
				};
				/*this.getCellValueById = function(row, col) {
					return table[row][col];
				};*/
				this.setTree = function(treebox) {
					this.treebox = treebox;
				};
				this.isEditable = function(row, col) {
					return col.editable;
				};
				this.setCellText = function(row, col, value) {
					var id = table[row].id;
					var insert_values = {
						id: id
					};
					if(col.id == 'rating') {
						value = parseInt(value);
					}
					insert_values[col.id] = value;
					var statement = this.branch.root.local_data.statement.generate(insert_values, "library");
					statement.executeStep();
					table[row][col.id] = value;
					this.branch.sort();
				};
				this.setCellValue = function(row, col, value) {
					var id = table[row].id;
					var insert_values = {
						id: id
					};
					if(col.id == 'rating') {
						value = parseInt(value);
					} else if(col.id == 'check_value') {
						if(value == 'true') {
							value = true;
						} else {
							value = false;
						}
					}
					insert_values[col.id] = value;
					var statement = this.branch.root.local_data.statement.generate(insert_values, "library");
					statement.executeStep();
					table[row][col.id] = value;
					this.branch.sort();
				};
				this.isContainer = function(row){ return false; };
				this.isSeparator = function(row){ return false; };
				this.isSorted = function(){ return false; };
				this.getLevel = function(row){ return 0; };
				this.getImageSrc = function(row,col){ return null; };
				this.getRowProperties = function(row,props){};
				this.getCellProperties = function(row,col,props){};
				this.getColumnProperties = function(colid,col,props){};
				this.cycleHeader = function(col, elem) {};
			}

			return new tree_view(table, branch);
		},
		select_all: function() {
			var branch = this;
			branch.tree.view.selection.rangedSelect(0, branch.table.length-1, false);
		},
		get_first_selected_id: function() {
			var branch = this;
			var selection = this.get_selected();
			if(selection.length == 0) {
				if(branch.table.length > 0) {
					return branch.table[0].id;
				}
				return null;
			} else {
				return selection[0];
			}
		},
		get_selected: function(return_object) {
			var branch = this;
			var start = new Object();
			var end = new Object();
			var numRanges = branch.tree.view.selection.getRangeCount();

			var selected_indicies = [];

			for(var t = 0; t < numRanges; t++){
				branch.tree.view.selection.getRangeAt(t,start,end);
				for(var v = start.value; v <= end.value; v++){
					if(typeof branch.table[v] !== 'undefined') {
						if(typeof return_object !== 'undefined') {
							selected_indicies.push(branch.table[v]);
						} else {
							selected_indicies.push(branch.table[v].id);
						}
					}
					//selected_indicies.push(v);
					//alert("Item " + v + " is selected.");
				}
			}
			return selected_indicies;
		},
		last_sort_column: null,
		sort: function(column, sort_values, force_ascending, first_load) {
			var branch = this;
			var top_visible_row = branch.get_top_visible_row();
			console.log(top_visible_row);
			if(branch.last_top_row != null) {
				top_visible_row = branch.last_top_row;
				console.log(branch.last_top_row);
				branch.last_top_row = null;
			}
			//var selected_rows = branch.tree.getSelectedRows();
			////console.log(branch.tree);

			var selected_indicies = [];
			if((typeof sort_values === 'undefined' || sort_values === null)) { //&& $('#search').first().val().trim().length == 0
				var start = new Object();
				var end = new Object();
				var numRanges = branch.tree.view.selection.getRangeCount();


				for (var t = 0; t < numRanges; t++){
					branch.tree.view.selection.getRangeAt(t,start,end);
					for (var v = start.value; v <= end.value; v++){
						selected_indicies.push(branch.table[v].id);
						//selected_indicies.push(v);
						//alert("Item " + v + " is selected.");
					}
				}
				////console.log(branch.tree.currentIndex);
			} else {
				selected_indicies = sort_values;
			}

			var column_name;
			var order = branch.tree.getAttribute("sortDirection") == "ascending" ? 1 : -1;
			
			//if the column is passed and it's already sorted by that column, reverse sort
			if(column === null && branch.last_sort_column != null) {
				column = branch.last_sort_column;
			}
			if(column) {
				branch.last_sort_column = column;
				column_name = column.id;
				if (branch.tree.getAttribute("sortResource") == column_name) {
					order *= -1;
				}
			} else {
				column_name = branch.tree.getAttribute("sortResource");
			}
			if(typeof force_ascending !== 'undefined' && force_ascending != null) {
				order = 1;
			}

			function column_sort(a, b) {
				if(a[column_name] == null || (typeof a[column_name] === 'string' && branch.prepare_for_comparison(a[column_name]).trim().length == 0)) return 1 * order;
				if(branch.prepare_for_comparison(a[column_name]) > branch.prepare_for_comparison(b[column_name])) return 1 * order;
				if(branch.prepare_for_comparison(a[column_name]) < branch.prepare_for_comparison(b[column_name])) return -1 * order;
				//tie breaker: name ascending is the second level sort
				if(column_name != "album") {
					if(a["album"] == null || branch.prepare_for_comparison(a["album"]).trim().length == 0) return 1 * order;
					if(branch.prepare_for_comparison(a["album"]) > branch.prepare_for_comparison(b["album"])) return 1;
					if(branch.prepare_for_comparison(a["album"]) < branch.prepare_for_comparison(b["album"])) return -1;
					if(column_name != "track") {
						if(a["track"] == null || branch.prepare_for_comparison(a["track"]).trim().length == 0) return 1 * order;
						if(branch.prepare_for_comparison(a["track"]) > branch.prepare_for_comparison(b["track"])) return 1;
						if(branch.prepare_for_comparison(a["track"]) < branch.prepare_for_comparison(b["track"])) return -1;
					}
				}
				return 0;
			}
			branch.table.sort(column_sort);
			if(column_name != 'order' && (typeof first_load === 'undefined' || first_load == false)) {
				branch.reset_order();
			}
			//setting these will make the sort option persist
			branch.tree.setAttribute("sortDirection", order == 1 ? "ascending" : "descending");
			//branch.tree.setAttribute("sortResource", column_name);
			branch.tree.view = branch.tree_view(branch.table);


			//if(typeof column === 'undefined') {
			branch.$tree.attr('sortResource', column_name);
			column_name = branch.tree.getAttribute("sortResource");
			//}
			/*$tree_children.children().each(function() {
				alert(this);
				$(this).attr('draggable', 'true');
				$(this).on('dragstart', function(event) {
					//nsDragAndDrop.startDrag(event, abResultsPaneObserver);
					event.originalEvent.dataTranfser.mozSetDataAt('text/plain', 'song', 0);
					event.stopPropagation();
				});
			});*/
			//set the appropriate attributes to show to indicator
			var cols = branch.tree.getElementsByTagName("treecol");
			for(var i = 0; i < cols.length; i++) {
				cols[i].removeAttribute("sortDirection");
			}

			//document.getElementById(column_name).setAttribute("sortDirection", order == 1 ? "ascending" : "descending");
			if(column_name != null && column_name != "") {
				branch.$tree.find('#'+column_name).first()[0].setAttribute("sortDirection", order == 1 ? "ascending" : "descending");
			}

			branch.set_top_visible_row(top_visible_row);
			//console.log(selected_indicies);
			for(var x in selected_indicies) {
				var index = branch.table.map(function(e) {
	                return e.id;
	            }).indexOf(selected_indicies[x]);
	            if(index != -1) {
					branch.tree.view.selection.rangedSelect(index, index, true);
				}
			}
			/*if(branch.table.length == branch.store_table.length) {
				branch.store_table = branch.table;
				console.log('set branch store table as table');
			}
			console.log(branch.table.length);
			console.log(branch.store_table.length);*/
			//document.getElementById(column_name).setAttribute("sortDirection", order == 1 ? "ascending" : "descending");
		}
	},
	tags: {
		$tags_container: null,
		init: function() {
			this.$tags_container = $('.tags_container');
			var colors = this.generate();

			var $a = this.$tags_container.find('.tags_container_a');
			var $b = this.$tags_container.find('.tags_container_b');
			$a.html("");
			$b.html("");

			for(var x in colors) {
				if(x > 7) {
					break;
				}
				var value = "<checkbox class='tag_checkbox' id='"+x+"' label='"+colors[x].name+"' style='background-color:hsl("+colors[x].color+"); color:hsl("+colors[x].color+")' />";
				if(x < 4) {
					$a.append(value);
				} else {
					$b.append(value);
				}
			}
		},	
		generate: function() {
			var colors = [];
			var s = 60;
			var l = 50;
			var h = 0;
			var counter = 0;
			while(h < 360) {
				h = (counter*40);
				colors.push({
					color: h+","+l+"%,"+s+"%",
					name: 'tag '+counter
				});
				counter += 1;
			}
			return colors;
		}
	},
	color: {
		blend_colors: function() {
		    var args = [].prototype.slice.call(arguments);
		    var base = [0, 0, 0, 0];
		    var mix;
		    var added;
		    while (added = args.shift()) {
		        if(typeof added[3] === 'undefined') {
		            added[3] = 1;
		        }
		        // check if both alpha channels exist.
		        if(base[3] && added[3]) {
		            mix = [0, 0, 0, 0];
		            // alpha
		            mix[3] = 1 - (1 - added[3]) * (1 - base[3]);
		            // red
		            mix[0] = Math.round((added[0] * added[3] / mix[3]) + (base[0] * base[3] * (1 - added[3]) / mix[3]));
		            // green
		            mix[1] = Math.round((added[1] * added[3] / mix[3]) + (base[1] * base[3] * (1 - added[3]) / mix[3]));
		            // blue
		            mix[2] = Math.round((added[2] * added[3] / mix[3]) + (base[2] * base[3] * (1 - added[3]) / mix[3]));

		        } else if(added) {
		            mix = added;
		        } else {
		            mix = base;
		        }
		        base = mix;
		    }

		    return mix;
		},
		rgb_to_hsv: function(r, g, b) {	//Nota HSV og H1+H2 / 2 = new_hue fyrir multiple tags
		    if(arguments.length === 1) {
		        g = r.g, b = r.b, r = r.r;
		    }
		    var max = Math.max(r, g, b), min = Math.min(r, g, b),
		        d = max - min,
		        h,
		        s = (max === 0 ? 0 : d / max),
		        v = max / 255;

		    switch (max) {
		        case min: h = 0; break;
		        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
		        case g: h = (b - r) + d * 2; h /= 6 * d; break;
		        case b: h = (r - g) + d * 4; h /= 6 * d; break;
		    }

		    return {
		        h: h,
		        s: s,
		        v: v
		    };
		}
	},
	assign_root: function(path) {
		var root = this;
		function assign_root(object) {
			var statement = 'var obj = '+object+';';
			eval(statement);
			if(typeof obj.inherit !== 'undefined' && typeof obj.inherit === 'string') {
				root.functions.inherit(obj.inherit, obj);	
			}
			for(var x in obj) {
				if(typeof obj[x] === 'object' && obj[x] != null && typeof obj[x].length === 'undefined' && 
					x != 'root' && x != 'parent' && typeof obj[x].context === 'undefined') {
					obj[x].root = root;
					obj[x].parent = obj;
					obj[x].obj_id = x;//object.substr(object.lastIndexOf('.')+1, object.length-1);
					var str = object + '.' + x;
					assign_root(str);	
				}
			}
		}
		if(typeof path === 'undefined') {
			assign_root("root");
		} else {
			assign_root(path);
		}
	},
	//$sidebar: null,
	copy_image: null,
	loaded_callbacks: [],
	init: function() {
		////console.log('init');
		this.assign_root();
		
		jQuery.fn.extend({getPath:function(){for(var t,i=this;i.length;){var e=i[0],a=e.localName;if(!a)break;a=a.toLowerCase();var n=i.parent();if(n.children(a).length>1){var l=n.children().index(e)+1;l>1&&(a+=":nth-child("+l+")")}t=a+(t?">"+t:""),i=n}return t}});
		
		var branch = this;
		var main = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIWebNavigation)
                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                   .rootTreeItem
                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIDOMWindow);
		
		this.gBrowser = main.gBrowser;
		
		var $main = $(main.document);		   
		this.$main = $main;
		this.main = main;
				
		this.easings.init();
		
		//this.init_sidebars();

		var c = $('#mycanvas').first()[0];//document.getElement("CANVAS");
		var ctx = c.getContext("2d");

		var grd = ctx.createRadialGradient(50, 50, 0, 90, 60, 50);
		grd.addColorStop(0, "#0c3");
		grd.addColorStop(1, "transparent");

		// Fill with gradient
		ctx.fillStyle = grd;
		ctx.fillRect(10, 10, 150, 100); 
		
		branch.copy_image = c;
		
		var file = FileUtils.getFile("ProfD", ["noob_music.sqlite"]);
		var db = Services.storage.openDatabase(file);	
		
		this.sql = db;
		
		//this.init_db();
		this.local_data.init();

		this.init_audio();
		this.controls.init();

		this.playlist.init();
		this.toolbar.init();
		this.prompt.init();
		this.settings.init();
		this.loading.init();
		this.tags.init();
		branch.numrand.init();
		branch.gradient.init();
		//this.init_windows();
		window.music_app = branch;
		window.pause_playback = function(index) {
			if(index == null || branch.current_window_index != index) {
				branch.pause();
			}
		};
		for(var x in this.loaded_callbacks) {
			this.loaded_callbacks[x]();
		}
		//alert(window.document.pause);
		////console.log(window.document.pause);

		//this.test_function();
		//setTimeout(function() {
		//}, 1200);
		//this.numrand.save_state();
		/*setTimeout(function() {
			var number = branch.numrand._string(1);
			alert(number);
		}, 5000);*/
		/*this.form_data.base_init();
		this.form_data.init();*/
	},
	current_window_index: null,
	pages: Array(),
	init_windows: function() {
		var main_index = 0;
		var main = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIWebNavigation)
                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                   .rootTreeItem
                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIDOMWindow);
		this.main = main;
		
		while(typeof this.main[main_index] !== 'undefined') {
			//var url = this.main[main_index].document.URL;
			//this.pages[url] = $(this.main[main_index].document);
			if(this.main[main_index].document == window.top.contentDocument) {
				//console.log(this.main[main_index]);
				this.current_window_index = main_index;
			}
			main_index++;	
		}
		/*if(typeof this.pages["chrome://formdraft/content/form_data.xul"] !== 'undefined') {
			this.$sidebar = this.pages["chrome://formdraft/content/form_data.xul"];
		}*/
	},
	pause_windows: function() {
		/*var main_index = 0;
		var main = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIWebNavigation)
                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                   .rootTreeItem
                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIDOMWindow);
		this.main = main;
		
		while(typeof this.main[main_index] !== 'undefined') {
			//var url = this.main[main_index].document.URL;
			//this.pages[url] = $(this.main[main_index].document);
			if(this.main[main_index] != window) {
				this.main[main_index].pause_playback(null);
			}
			main_index++;
		}*/


		/*var tabs = require("sdk/tabs");
		var { modelFor } = require("sdk/model/core");
		var { viewFor } = require("sdk/view/core");
		var tab_utils = require("sdk/tabs/utils");

		function list_tabs() {
			var tabs = require("sdk/tabs");
			for (let tab of tabs) {
				//alert(tab.url);
				map_high(tab);
			}
		}

		function map_high(tab) {
			// get the XUL tab that corresponds to this high-level tab
			var lowLevelTab = viewFor(tab);
			// now we can, for example, access the tab's content directly
			var browser = tab_utils.getBrowserForTab(lowLevelTab);
			if(!Object.is(browser.contentWindow, window)) {
				if(typeof browser.contentWindow.pause_playback !== 'undefined') {
					browser.contentWindow.pause_playback(null);
				}
			}
			// get the high-level tab back from the XUL tab
			var highLevelTab = modelFor(lowLevelTab);
			//console.log(highLevelTab.url);
		}

		list_tabs();*/
	},
	/*form_data: {
		list: Array(),
		window_list: Array(),
		initialized: false,
		active: false,
		toggle_sidebar: function() {
			var branch = this;
			toggleSidebar('viewFormDrafts');
			setTimeout(function() {
				branch.init();
				branch.active = true;
			}, 300);
		},
		current_base_url: null,
		base_init: function() {
			var branch = this;
			branch.current_base_url = window.top.gBrowser.contentWindow.location.href;
			//this.load();
			
			var load_callback = function(aEvent) {
				//alert('load');
				// test desired conditions and do something
				var doc = aEvent.originalTarget; // doc is document that triggered the event
        		var win = doc.defaultView; 
				// if (doc.nodeName != "#document") return; // only documents
				// if (win != win.top) return; //only top window.
				if(win.frameElement) return; // skip iframes/frames
				if((aEvent.originalTarget.nodeName == '#document') && (aEvent.originalTarget.defaultView.location.href == window.top.gBrowser.currentURI.spec) 
					&& win == window.top.gBrowser.contentWindow) {
					branch.current_base_url = window.top.gBrowser.contentWindow.location.href;
					branch.load();
				}
			};
			
			//$(window.top.gBrowser).on('load', load_callback);
			
			window.top.gBrowser.addEventListener("load", load_callback, true);
			
			var tabs = require('sdk/tabs');

			tabs.on('activate', function () {
				if(window.top != null) {
					branch.current_base_url = window.top.gBrowser.contentWindow.location.href;//window.top.gBrowser.contentWindow.location.host;
					branch.load();
				}
			});
		},
		init: function() {
			var branch = this;
			//if(typeof this.root.$sidebar === 'undefined') {
				this.root.init_sidebars();
			//}
			if(typeof this.root.$sidebar === 'undefined') {
				return false;	
			}
			//alert('1');
			
			
			var $form_drafts = this.root.$sidebar.find('#form_drafts').first();
			if($form_drafts.length == 0) { //|| typeof window.top.reading_list_initialized !== 'undefined'
				return false;	
			}
			//alert('init');
			var $save_draft_button = $form_drafts.find('#save_draft_button').first();
			var $clear_drafts_button = $form_drafts.find('#delete_drafts_button').first();
			
			$clear_drafts_button.click(function() {
				var statement = branch.root.sql.createStatement("DELETE FROM form_data WHERE url = :url");
				statement.params.url = branch.current_base_url;
				statement.executeAsync({
					handleCompletion: function(a_reason) {
						branch.load();
					}
				});
			});
			
			$save_draft_button.click(function() {
				var form_data = {};
				$(window.top.gBrowser.contentDocument).find(':input').each(function() {
					var path = $(this).getPath();
					
					form_data[path] = $(this).val();
				});
				var form_data_string = JSON.stringify(form_data);
					
				var statement_2 = branch.root.sql.createStatement("INSERT INTO form_data (url, form_data, created) VALUES (:url, :form_data, DATETIME());");
				statement_2.params.url = branch.current_base_url;
				statement_2.params.form_data = form_data_string;//branch.m_editor.textContent;
				statement_2.executeAsync({
					handleCompletion: function(a_reason) {
						branch.load();
					}
				});
			});
			branch.load();
		},
		load: function() {
			var branch = this;
			//alert(branch.current_base_url);
			if(typeof branch.root.$sidebar === 'undefined') {
				return false;	
			}
			var $form_drafts_content = branch.root.$sidebar.find('#form_drafts_content');
			$form_drafts_content.html("");
			var statement = branch.root.sql.createStatement("SELECT * FROM form_data WHERE url = :url ORDER BY id DESC");
			statement.params.url = branch.current_base_url;
			statement.executeAsync({
				handleResult: function(aResultSet) {
					var counter = 0;
					for(var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow()) {
						
						var id = row.getResultByName("id");
						var url = row.getResultByName("url");
						var form_data = row.getResultByName("form_data");
						var label = row.getResultByName("created");
						$form_drafts_content.append("<label class='draft_item' id='"+id+"' value='"+label+"' />"); //&#xee00; //
						
						var $form_data_item = $form_drafts_content.find('#'+id).first();
						(function(form_data) {
							$form_data_item.click(function() {
								var form_data_object = JSON.parse(form_data);
								for(var x in form_data_object) {
									$(window.top.gBrowser.contentDocument).find(x).val(form_data_object[x]);	
								}
							});
						}(form_data));
						
						counter++;
					}
				},
				
				handleError: function(aError) {
					////console.log("Error: " + aError.message);
				},
				
				handleCompletion: function(aReason) {
					if(aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {
						////console.log("Query canceled or aborted!");
					}
				}
			});
		}
	},*/
	gradient: {	//taka 2-7 laga hopa byrja a handahofskendum hop og rada eftir gradient, randomly flippa gradient
		tags: [],
		init: function() {
			this.tags = this.root.tags.generate();
		},
		order: function() {
			var branch = this;
			var start_tag_index = this.root.numrand._random(0, this.tags.length-1, 1)[0];
			var start_tag = this.tags[start_tag_index];

			var result = [];
			var pool = [...this.root.playlist.table];
			/*for(var x in this.tags) {
				branch.playlist.table.map(function(e) {
	                return e.id;
	            }).indexOf(branch.controls.currently_playing_id);
			}*/
			this.tags.push({
				name: 'no_color'
			});
			for(var x in this.tags) {
				this.tags[x].pool = [];
			}
			for(var x in pool) {
				var tags_split = []
				if(pool[x].tags.indexOf(',') != -1) {
					tags_split = pool[x].tags.split(',');
				}
				for(var i in tags_split) {
					if(tags_split[i].trim().length > 0) {
						this.tags[tags_split[i]].pool.push(pool[x]);
					}
				}
				if(tags_split.length == 0) {
					this.tags[this.tags.length-1].pool.push(pool[x]);
				}
			}

			while(pool.length > 0) {
				var take = this.root.numrand._random(4, 9, 1)[0];
				var take_count = take;
				var current_pool = this.tags[start_tag_index].pool;
				while(take_count > 0 && current_pool.length > 0) {
					var take_index = this.root.numrand._random(0, current_pool.length-1, 1)[0];
					var push_value = current_pool.splice(take_index, 1)[0];
					if(result.indexOf(push_value) == -1) {
						result.push(push_value);
					}
					take_count--;
					var pool_index = pool.map(function(e) {
						return e.id;
					}).indexOf(result[result.length-1].id);
					pool.splice(pool_index, 1);
				}
				start_tag_index++;
				if(start_tag_index >= this.tags.length) {
					start_tag_index = 0;
				}
			}
			return result;

		}
	},
	numrand: {
		//range: null,
		cylinders: null,
		init: function() {
			/*this.cylinders = [];
			this.construct_cylinders(13);
			////console.log(this.cylinders);
			this.get_state();*/
		},
		construct_cylinders: function(count) {
			var speed = this.prime_numbers(count);
			//////console.log(speed);
			var phase_offset = this.construct_phase_offset(count);
			speed = this.interlace(speed);
			phase_offset = this.interlace(phase_offset);


			phase_offset.push(0);
			speed.push(1);

			//////console.log(speed);
			//////console.log(phase_offset);
			function cylinder(phase_offset, speed, particle_position, radius, particle_direction) {
				if(typeof particle_position === 'undefined') {
					particle_position = [0, 0];
				}
				if(typeof radius === 'undefined') {
					radius = 50;
				}
				if(typeof particle_direction === 'undefined') {
					particle_direction = 60;
				}	
				this.speed = speed;
				this.phase_offset = phase_offset;
				this.borders = [];
				this.radius = radius;
				this.particle_position = particle_position;
				this.particle_direction = particle_direction;
				this.gap = [5, 5];

				this.get_phase_offset = function() {
					return this.phase_offset;
				};
				this.set_phase_offset = function(phase_offset) {
					this.phase_offset = phase_offset;
				};
				this.get_speed = function() {
					return this.speed;
				};
				this.set_speed = function(speed) {
					this.speed = speed;
				};
				this.get_current_direction = function() {
					return this.particle_direction;
				};
				this.get_current_position = function() {
					return this.particle_position;
				};
				this.set_direction = function(particle_direction) {
					this.particle_direction = particle_direction;
				};
				this.set_position = function(particle_position) {
					this.particle_position = particle_position;
				};
				this.get_direction = function(degree, direction_coordinates) {
					var long_side_direction = this.particle_direction+degree;
					var long_side_coordinates = this.degree_to_coordinates(long_side_direction);
					long_side_coordinates = this.reset_vector_length(long_side_coordinates, this.radius);

					var projection = this.projection(long_side_coordinates, direction_coordinates);

					var middle_vector = this.subtract_vector(this.particle_position, projection);
					var middle_sub = this.reset_distance(long_side_coordinates, 1/2);

					middle_vector = this.subtract_vector(this.particle_position, middle_sub);
					middle_vector = this.reverse_vector(middle_vector);
					direction_coordinates = [direction_coordinates[0], -direction_coordinates[1]];

					var reflection = this.reflection(this.reverse_vector(direction_coordinates), middle_vector);

					return this.coordinates_to_degree(reflection);
				};

				this.border_counter = 0;
				this.border_interlope = 0;

				this.within_borders = function() {
					var distance = Math.sqrt(Math.pow(this.particle_position[0], 2)+Math.pow(this.particle_position[1], 2));
					var reflect = 0;
					if(distance > this.radius) {
						reflect = 1;
					} else if(this.within_pivot()) {
						reflect = 2;
					}
					var fraction;
					if(reflect > 0) {
						var direction_coordinates = this.degree_to_coordinates(this.particle_direction);
						if(reflect == 1) {
							fraction = this.radius / distance;
							this.particle_position = this.reset_distance(this.particle_position, fraction);
						}

						var reflection;
						var left = this.get_direction(-90, direction_coordinates);
						var right = this.get_direction(+90, direction_coordinates);

						var left_size = this.degree_difference(this.particle_direction, left);
						var right_size = this.degree_difference(this.particle_direction, right);
						var angle = this.angle_between_vectors(this.reverse_vector(this.particle_position), this.reverse_vector(direction_coordinates));

						reflection = right;
						this.border_counter++;
						this.particle_direction = reflection;
					}
				}

				this.compare_vectors = function(u, v) {
					if(u[0] == v[0] && u[1] == v[1]) {
						return true;
					}
					return false;
				};

				this.angle_between_vectors = function(u, v) {
					if(this.compare_vectors(u, v)) {
						return 0;
					}
					var dot = this.dot_product(u, v);
					var u_distance = this.vector_distance(u);
					var v_distance = this.vector_distance(v);
					var division = u_distance+v_distance;
					var result = dot / division;
					result = Math.acos(result);
					result = result * 57.2957795;
					return result;
				};

				this.flip_vector = function(u) {
					var vector = array(u[0], -u[1]);
					return vector;
				};

				this.flip_x = function(u) {
					var vector = array(-u[0], u[1]);
					return vector;
				};
				this.degree_difference = function(deg1, deg2) {
					if(deg1 < 0) {
						deg1 + 360+deg1;
					}
					if(deg2 < 0) {
						deg2 = 360+deg2;
					}
					result = deg1 - deg2;
					return Math.abs(result);
				};
				this.reset_distance = function(point, fraction) {
					var vector = [point[0], point[1]];
					vector[0] *= fraction;
					vector[1] *= fraction;
					return vector;
				};
				this.reverse_vector = function(v) {
					var u = [-v[0], -v[1]];
					return u;
				};
				this.reset_vector_length = function(point, length) {
					var initial_length = this.vector_distance(point, [0,0]);
					var fraction = length/initial_length;
					var new_point = this.reset_distance(point, fraction);
					var new_distance = this.vector_distance(new_point, [0, 0]);
					return new_point;
				};
				this.dot_product = function(u, v) {
					return (u[0]*v[0])+(u[1]*v[1]);
				};
				this.projection = function(u, v) {
					var division = Math.pow(this.distance(v[0], v[1]), 2);
					if(division == 0) {
						return [0, 0];
					}
					var vector = [v[0], v[1]];
					var mult = this.dot_product(u, v) / division;
					vector[0] *= mult;
					vector[1] *= mult;
					return vector;
				};
				this.within_gap = function() {
					var particle_position = this.particle_position;
					var gap = this.gap;
					var projection = this.projection(particle_position, [gap[0], gap[1]]);
					var distance = this.vector_distance(this.particle_position, projection);

					var radial_position = this.vector_distance(this.particle_position, [0, 0]);
					if(distance < 0.3 && radial_position > 10 && radial_position < 40) {
						return true;
					}
					return false;
				};
				this.pivot_offset = 0;
				this.pivot_range = 1;
				this.pivot_width = 0.5;
				this.within_pivot = function() {
					var particle_position = this.particle_position;
					var pivot;
					if(this.pivot_offset == 0) {
						pivot = this.reverse_vector(this.gap);
					} else {
						var pivot_degree = this.pivot_offset+180;
						pivot = this.degree_to_coordinates(pivot_degree);
					}
					var projection = this.projection(particle_position, [pivot[0], pivot[1]]);
					var distance = this.vector_distance(this.particle_position, projection);
					var radial_position = this.vector_distance(this.particle_position, [0, 0]);
					if(distance < this.pivot_range && radial_position > (this.pivot_radial-this.pivot_width) && radial_position < (this.pivot_radial+this.pivot_width)) {
						return true;
					}
					return false;
				};

				/*this.within_pivot = function() {
					var particle_position = this.particle_position;
					var pivot;
					if(this.pivot_offset == 0) {
						pivot = this.reverse_vector(this.gap);
					} else {
						var pivot_degree = this.pivot_offset+180;
						pivot = this.degree_to_coordinates(pivot_degree);
					}
					var projection = this.projection(particle_position; [pivot[0], pivot[1]]);
					var distance = this.vector_distance(this.particle_position, projection);
					var radial_position = this.vector_distance(this.particle_position, [0, 0]);
					if(distance < this.pivot_range && radial_position > (this.pivot_radial-this.pivot_width
				};*/

				this.vector_distance = function(u, v) {
					if(typeof v === 'undefined') {
						v = [0, 0];
					}	
					return this.distance(u[0], u[1], v[0], v[1]);
				};
				this.vector_sum = function(u, value) {
					var vector = [u[0], u[1]];
					vector[0] += value;
					vector[1] += value;
					return vector;
				};
				this.add_vectors = function(u, v) {
					var vector = [u[0], u[1]];
					vector[0] += v[0];
					vector[1] += v[1];
					return vector;
				};
				this.distance = function(x_from, y_from, x_to, y_to) {
					if(typeof x_to === 'undefined') {
						x_to = 0;
					}
					if(typeof y_to === 'undefined') {
						y_to = 0;
					}	
					var value = Math.sqrt(Math.pow(x_from-x_to, 2)+Math.pow(y_from-y_to, 2));
					return value;
				}
				this.particle_distance = function(x, y) {
					//return this.distance(x, y, this.particle_position[0], this.particle_position[1]);
				};
				this.calculate_rotation = function() {
					var radian = (this.phase_offset)*0.0174532925;
					var x = Math.cos(radian)*50;
					var y = Math.sin(radian)*50;
					this.gap = [x, y];
					this.phase_offset += this.speed;
					if(this.phase_offset >= 360) {
						this.phase_offset = this.phase_offset - 360;
					}
				};
				this.normalize_vector = function(v) {
					var length = this.vector_distance(v, [0, 0]);
					var vector = [v[0], v[1]];
					vector[0] /= length;
					vector[1] /= length;
					return vector;
				};
				this.subtract_vector = function(u, v) {
					var vector = [u[0], u[1]];
					vector[0] -= v[0];
					vector[1] -= v[1];
					return vector;
				};
				this.sum_vector = function(u, v) {
					var vector = [u[0], u[1]];
					vector[0] += v[0];
					vector[1] += v[1];
					return vector;
				};
				this.stretch_vector = function(u, unit_value) {
					var vector = [u[0], u[1]];
					vector[0] *= unit_value;
					vector[1] *= unit_value;
					return vector;
				};
				this.reflection = function(d, n) {
					var n = [n[0], n[1]];
					n = this.normalize_vector(n);
					var dot = this.dot_product(d, n);
					dot = 2*dot;
					var stretch = this.stretch_vector(n, dot);
					var subtract = this.subtract_vector(d, stretch);
					return subtract;
				};
				this.coordinates_to_degree = function(v) {
					var rad = Math.atan2(v[1], v[0]);
					var deg = rad * (180 * Math.PI);
					return deg;
				};
				this.degree_to_coordinates = function(deg) {
					var radian = (deg)*0.0174532925;
					var x = Math.cos(radian);
					var y = Math.sin(radian);
					return [x, y];
				};
				this.radians = 0.0174532925;
				this.center = [0, 0];
				this.gap = [50, 0];
				this.pivot_radial = 25;
				this.step_increment = 1;
				this.translation_counter = 0;
				this.calculate_translation = function() {
					var in_gap = this.within_gap();
					while(!in_gap) {
						var translation = [Math.cos(this.particle_direction*this.radians)*this.step_increment, Math.sin(this.particle_direction*this.radians)*this.step_increment];
						//////console.log(this.particle_position);
						//////console.log(translation);
						this.particle_position[0] += translation[0];
						this.particle_position[1] += translation[1];
						this.within_borders();
						in_gap = this.within_gap();
						this.calculate_rotation();
						//////console.log(this.particle_position);
						/*return {
							particle_position: this.particle_position,
							particle_direction: this.particle_direction
						};*/
						/*this.translation_counter++;
						if(this.translation_counter > 1000) {
							return {
								particle_position: this.particle_position,
								particle_direction: this.particle_direction
							}; 
						}*/
					}
					return {
						particle_position: this.particle_position,
						particle_direction: this.particle_direction
					};
				};
				this.get_state = function() {
					return {
						direction: this.particle_direction,
						phase_offset: this.phase_offset
					};
				};

				this.calculate_rotation();	
			}

			var counter = 0;
			while(counter < count) { //+1 ---????
				this.cylinders.push(new cylinder(phase_offset[counter], speed[counter]));
				counter++;
			}


		},
		_string: function(digits) {
			var counter = 0;
			var result = "";
			while(counter < digits) {
				digit = this.run(359);
				result += digit;
				counter++;
			}
			return result;
		},
		range: 359,
		run: function() {
			this.run_simulation(0, null, null);
			return this.get_number();
		},
		save_state: function() {
			//////console.log('save_state');
			/*var branch = this;
			var query = "DELETE FROM numrand";
			var statement = branch.root.sql.createStatement(query);
			statement.executeStep();


			var position = this.get_position();

			var insert_values = {
				particle_x: position[0],
				particle_y: position[1],
				particle_direction: this.get_direction(),
			};
			for(var x in this.cylinders) {
				var cylinder = this.cylinders[x];
				insert_values["phase_"+x] = parseInt(cylinder.get_phase_offset());
			}
			//////console.log(insert_values);
			var insert_statement = this.root.local_data.statement.generate(insert_values, "numrand");
			insert_statement.executeStep();*/
		},
		get_state: function() {
			var branch = this;

			/*var query = "SELECT * FROM playlists WHERE parent_id = :parent_id";
			var statement = branch.root.sql.createStatement(query);
			statement.params.parent_id = -1;
			while(statement.executeStep()) {
				////console.log(statement.row.id);
			}
			return;*/

			/*var query = "DELETE FROM numrand";
			var statement = branch.root.sql.createStatement(query);
			statement.executeStep();*/

			var start_cylinder = this.cylinders[0];
			/*start_cylinder.particle_x = Math.random();
			start_cylinder.particle_y = Math.random();*/
			var query = "SELECT * FROM numrand";
			var statement = branch.root.sql.createStatement(query);
			//var row = null;
			if(statement.executeStep()) {
				////console.log('get_statement');
				//row = statement.row;
				start_cylinder.set_position([statement.row.particle_x, statement.row.particle_y]);
				start_cylinder.set_direction(statement.row.particle_direction);
				/*for(var x in this.cylinders) {
					this.cylinders[x].set_phase_offset(row["phase_"+x]);
				}*/
				this.cylinders[0].set_phase_offset(statement.row.phase_0);
				this.cylinders[1].set_phase_offset(statement.row.phase_1);
				this.cylinders[2].set_phase_offset(statement.row.phase_2);
				this.cylinders[3].set_phase_offset(statement.row.phase_3);
				this.cylinders[4].set_phase_offset(statement.row.phase_4);
				this.cylinders[5].set_phase_offset(statement.row.phase_5);
				this.cylinders[6].set_phase_offset(statement.row.phase_6);
				this.cylinders[7].set_phase_offset(statement.row.phase_7);
				this.cylinders[8].set_phase_offset(statement.row.phase_8);
				this.cylinders[9].set_phase_offset(statement.row.phase_9);
				this.cylinders[10].set_phase_offset(statement.row.phase_10);
				this.cylinders[11].set_phase_offset(statement.row.phase_11);
				this.cylinders[12].set_phase_offset(statement.row.phase_12);
				//this.cylinders[13].set_phase_offset(statement.row.phase_0);
			} else {
				start_cylinder.set_position([Math.random(), Math.random()]);
			}
			//start_cylinder.set_direction(Math.random());
		},
		prime_numbers: function(count) {
			var prime_numbers = [];
			var counter = 3;
			while(prime_numbers.length < count) {
				if(this.is_prime(counter)) {
					prime_numbers.push(counter);
				}
				counter++;
			}
			return prime_numbers;
		},
		is_prime: function(number) {
			//////console.log('prime check: '+number);
			for(var counter=2; counter<number; counter++) {
				//////console.log(counter);
				if(number % counter == 0) {
					return false;
				}
			}
			return true;
		},
		interlace: function(arr) {
			var split = this.array_split(arr);
			split[1] = split[1].reverse();
			var result = [];
			var counter = 0;
			for(var x in split[0]) {
				var item = split[0][x];
				result.push(item);
				if(typeof split[1][counter] !== 'undefined') {
					result.push(split[1][counter]);
				}
				counter++;
			}
			return result;
		},
		array_split: function(arr) {
			var split = Math.ceil(arr.length/2);
			var result = [[], []];
			for(var counter=0; counter<arr.length; counter++) {
				if(counter < split) {
					result[0].push(arr[counter]);
				} else {
					result[1].push(arr[counter]);
				}
			}
			return result;
		},
		construct_phase_offset: function(count) {
			var phase = 0;
			var phases = [];
			while(phases.length < count) {
				phases.push(phase);
				phase += 30;
				if(phase == 360) {
					phase = 0;
				}
			}
			return phases;
		},
		simluation_counter: 0,
		run_simulation: function(index, particle_position, particle_direction) {
			if(typeof index === 'undefined') {
				index = 0;
			}
			if(index < this.cylinders.length) {
				if(typeof particle_position !== 'undefined' && particle_position != null) {
					this.cylinders[index].set_position(particle_position);
				}
				if(typeof particle_direction !== 'undefined' && particle_direction != null) {
					this.cylinders[index].set_direction(particle_direction);
				}
				var result = this.cylinders[index].calculate_translation();
				//////console.log(result);
				//return result;
				return this.run_simulation(++index, result.particle_position, result.particle_direction);
			}
			this.cylinders[0].set_position(this.get_position());
			this.cylinders[0].set_direction(this.get_direction());
			return particle_position;
		},
		/*step_size: function() {
			var step_size = 3
		}*/
		get_number: function() {
			var phase = this.cylinders[this.cylinders.length-1].get_phase_offset();
			if(phase == 0) {
				return 0;
			}
			var number = Math.floor(phase/36);
			return number;
		},
		get_position: function() {
			return this.cylinders[this.cylinders.length-1].get_current_position();
		},
		get_first_position: function() {
			return this.cylinders[0].get_current_position();
		},
		get_direction: function() {
			return this.cylinders[this.cylinders.length-1].get_current_direction();
		},
		get_first_direction: function() {
			return this.cylinders[0].get_current_direction();
		},
		disabled: false,
		reorder_list: function(list) {
			var output_list = [];
			var count = list.length-1;
			//alert(count);
			while(count >= 0) {
				var numbers;
				//if(!this.disabled) {
					//numbers = this._random(0, count, 1);
					////console.log('numbers:');
					////console.log(numbers);
				//} else {
					numbers = [Math.floor(Math.random()*count)];
					console.log(numbers);
				//}
				////console.log(list[numbers[0]].id);
				output_list.push(list[numbers[0]]);
				list.splice(numbers[0], 1);
				count = list.length-1;
			}
			return output_list;
		},
		_random: function(start, stop, amount) {
			var results = [];
			var number = stop - start;
			var offset = start;
			var numbers = Math.floor(Math.random()*number);
			return [offset+numbers];
			var digits = (""+number).length;
			//alert(digits);
			var max_first_digit = (""+number).substr(0, 1);
			//////console.log(number);
			//////console.log(offset);
			//while(amount > 0) {
				/*var intermediate_results = this._string(digits);
				//////console.log("intermediate_results");
				//////console.log(intermediate_results);
				if(intermediate_results > number) {

				} else {
					results.push(intermediate_results);
					amount = amount - 1;
				}*/
				console.log('GENERATED');
				results.push(Math.floor(Math.random() * number) + 1);
				/*amount--;
			}*/
			for(var x in results) {
				var value = results[x];
				results[x] = parseInt(value)+parseInt(offset);
			}
			return results;
		}
			
	},
	easings_initialized: false,
	easings: {
		init: function() {
			var NEWTON_ITERATIONS = 4;
			var NEWTON_MIN_SLOPE = 0.001;
			var SUBDIVISION_PRECISION = 0.0000001;
			var SUBDIVISION_MAX_ITERATIONS = 10;
			
			var kSplineTableSize = 11;
			var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);
			
			var float32ArraySupported = typeof Float32Array === 'function';
			
			function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
			function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
			function C (aA1)      { return 3.0 * aA1; }
			
			function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }
			
			function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }
			
			function binarySubdivide (aX, aA, aB, mX1, mX2) {
			  var currentX, currentT, i = 0;
			  do {
				currentT = aA + (aB - aA) / 2.0;
				currentX = calcBezier(currentT, mX1, mX2) - aX;
				if (currentX > 0.0) {
				  aB = currentT;
				} else {
				  aA = currentT;
				}
			  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
			  return currentT;
			}
			
			function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
			 for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
			   var currentSlope = getSlope(aGuessT, mX1, mX2);
			   if (currentSlope === 0.0) {
				 return aGuessT;
			   }
			   var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
			   aGuessT -= currentX / currentSlope;
			 }
			 return aGuessT;
			}
			
			function LinearEasing (x) {
			  return x;
			}
			
			function bezier (mX1, mY1, mX2, mY2) {
			  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
			  }
			
			  
			
			  var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
			  for (var i = 0; i < kSplineTableSize; ++i) {
				sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
			  }
			
			  function getTForX (aX) {
				var intervalStart = 0.0;
				var currentSample = 1;
				var lastSample = kSplineTableSize - 1;
			
				for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
				  intervalStart += kSampleStepSize;
				}
				--currentSample;
				
				var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
				var guessForT = intervalStart + dist * kSampleStepSize;
			
				var initialSlope = getSlope(guessForT, mX1, mX2);
				if (initialSlope >= NEWTON_MIN_SLOPE) {
				  return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
				} else if (initialSlope === 0.0) {
				  return guessForT;
				} else {
				  return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
				}
			  }
			
			  return function BezierEasing (x) {
				if (x === 0 || x === 1) {
				  return x;
				}
				return calcBezier(getTForX(x), mY1, mY2);
			  };
			}
			
			
			var bezier_function = bezier(0.13, 0.88, 0.21, 0.88);
			
			var ease_x_2 = bezier(0.68, 0.04, 0.41, 0.67);
			
			
			var s_results_easing = bezier(0.79, 0.25, 0, 0.93);
			
			var teal = bezier(1, 0.21, 0.29, 0.47);
			var ease_in_out = bezier(1, 0.2, 0.2, 0.77);
			var ease_out = bezier(0.14, 0.47, 0.02, 0.77);
			var ease_out_x = bezier(0.17, 0.62, 0, 0.97);
			var ease_out_x_2 = bezier(0.02, 1, 0, 0.97);
			var ease_out_x_3 = bezier(0.02, 1, 0.76, 0.99);
			var ease_out_x_4 = bezier(0.64, 0.14, 0.23, 0.73);
			var ease_out_x_5 = bezier(0.76, 0.36, 0.26, 0.66);
			var ease_out_x_6 = bezier(0.31, 0.76, 0.35, 0.68);
			var ease_out_x_7 = bezier(0.09, 0.84, 0.48, 0.97);
						
			$.extend($.easing,
			{
				ease_x: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*bezier_function(t/=d)+b; 
				},
				ease_x_2: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*ease_x_2(t/=d)+b; 
				},
				x_results_easing: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*s_results_easing(t/=d)+b; 
				},
				teal: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*teal(t/=d)+b; 
				},
				ease_in_out: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*ease_in_out(t/=d)+b; 
				},
				ease_out: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*ease_out(t/=d)+b; 
				},
				ease_out_x: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*ease_out_x(t/=d)+b; //t/=d 
				},
				ease_out_x_2: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*ease_out_x_2(t/=d)+b; 
				},
				ease_out_x_3: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*ease_out_x_3(t/=d)+b; 
				},
				ease_out_x_4: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*ease_out_x_4(t/=d)+b; 
				},
				ease_out_x_5: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*ease_out_x_5(t/=d)+b; 
				},
				ease_out_x_6: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*ease_out_x_6(t/=d)+b; 
				},
				ease_out_x_7: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*ease_out_x_7(t/=d)+b; 
				},
				s_results_easing: function (x, t, b, c, d) {
				   //return c*(t/=d)*t + b;
				   return c*s_results_easing(t/=d)+b; 
				},
				ease_in_out_x: function (x, t, b, c, d) {
					if ((t/=d/2) < 1) return c/2*t*Math.pow(t, 1.5) + b;
					return c/2*((t-=2)*Math.pow(t, 1.5) + 2) + b;
				}
			});
		}
	}
};