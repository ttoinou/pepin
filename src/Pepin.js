/*
 * Pepin Media Player - Antoine Dornstetter
 * 
 *   src/Pepin.js
 *     - Handles global application state
 *     - External API
 *     - User can extend Pepin's sidebar
 *     - Also handles keyboard shortcuts
 *     - Create Pellicule object from Medias
 *
 *
 *   todo:
 *     - Finish API
 *     - Remove most jQuery calls
 *     - Move medias handling from Collection.vue to Pepin.js
 */

import Vue from 'vue'
import Util from './Util.js'
import Pellicule from './Pellicule.js'
import Media from './Media.js'

import PepinProjection from './components/Projection.vue'
import PepinVue from './components/Vue.vue'
import PepinNote from './components/Note.vue'
import PepinOverlay from './components/Overlay.vue'
import PepinToolbar from './components/Toolbar.vue'
import PepinCollection from './components/Collection.vue'
import PepinFullscreenTransition from './components/FullscreenTransition.vue'
import PepinHelp from './components/Help.vue'

import Lang from './Lang.js'

export default {

  Vue: Vue,

  CreatePepinObject: function(opt){
    var pepinElement = opt.pepinElement;
    var options = opt.options;
    var $ = opt.$;
    var screenfull = opt.screenfull;
    var props = Util.IsUndef(opt.props) ? [] : opt.props;
    var medias = opt.medias;

    var Return = {

      el   : pepinElement,

      components : { PepinProjection , PepinVue , PepinNote , PepinOverlay , PepinToolbar , PepinCollection , PepinFullscreenTransition , PepinHelp },

      props: [
          'help-modal-id',
          'hide-logo',
          'default-fps',
          'disable-shortcuts',
          'sidebar-id',
          'lang',
          'show-media-name',
          'show-notes',
          'edit-notes',
          'open-help',
          'video-sticky-notes',
      ].concat(props),

      data : {
        name:     'pepin',
        pepified: false,
        pepinAutoBroadcast : [
          'mediaNext',
          'mediaPrev',
          'mediasChanged',
          'updateZoom',
          'volume_update',
          'pbr_update',
          'scrub', // bug
          'scrubTo',
          'zoomAuto',
          'zoomVue',
          'noteMode',
          'noteDeleting',
          'videoStop',
          'updateNotes'
        ],
        lookForKeys: false,

        enableHelp: true,
        hasHelp: false,

        sidebar: false,
        playing: false,
        dimensions: {},
        pbrPower: 0,
        pbrPowerMin: -14,
        pbrPowerMax: 10,
        pbr: 1.0,
        pbrDt: 0,
        shiftKeyPressed: false,
        ctrlKeyPressed: false,
        altKeyPressed: false,
        Opened: false,
        OpenedFirstTime: false, // used to set DOM attributes (like dropdown height at first Pepin opening)
        fullscreen: false,
        HasPellicule: false,
        DisplayName: '',
        volume: 1.0,
        CurrentFrame: 0,
        videoLoop : false,

        volumeSV: new Util.StaticValue({
          Values: [ 0 , 1.0/3.0 , 2.0/3.0 , 1.0 ],
          ValueIndex: 3,
          Looping: false,
        },{
          'PepinEvent': new Util.SourceValue()
        }),

        noteViewing: false,
        noteEditing: false,
        noteColor: 'white',
        noteType: 'none',
        noteDeleting: false,
        noteEditingPermission: false,

        webkit: false,

        zoomLockState: 0, // 0 : no lock, 1 : one dimension lock (given by widthLock), 2 : two dimension lock
        widthLock: false, // false => heightLock

        currentMedia: null,
        defaultLang: 'fr',
        keysAction: []
      },

      computed: {

        addingNote: function(){
          return this.noteType != 'none' && this.noteType != 'delete' && this.noteEditingPermission;
        },

      },

      ready: function(){

        this.ready = true;
        this.$ = $;
        this.$Holder = this.$(this.$el);
        this.screenfull = screenfull;

        this.webkit = /webkit/.test(navigator.userAgent.toLowerCase());

        // configure props given in html
        var f = function(a,b){
          //console.log(Util.IsUndef(a),a,b, (Util.IsUndef(a) ? b : (a == 'true')));
          return Util.IsUndef(a) ? b : (a == 'true');
        };

        this.hideLogo = f(this.hideLogo,false);//  Util.IsUndef(this.hideLogo) ? false : (this.hideLogo == "true");
        this.defaultFps = parseFloat( this.defaultFps || "25.0" );
        this.showMediaName = f(this.showMediaName,true);// Util.IsUndef(this.showMediaName) ? true : (this.showMediaName == "true");
        this.disableShortcuts = f(this.disableShortcuts,false);//(this.disableShortcuts == "true") || false;
        this.lang = !Util.IsUndef(this.lang) && Lang.HasLanguage(this.lang) ? this.lang : this.defaultLang;
        this.noteViewing = f(this.showNotes , this.notesViewing);
        this.noteEditingPermission = f( this.editNotes , this.noteEditingPermission );
        this.enableHelp = f(this.openHelp , this.enableHelp );
        this.videoStickyNotes = f(this.videoStickyNotes,true);

          this.MediasBanque = [];
          this.GoyaveURLToID = {};

          // MediaObject to PepinID : unique ID in MediasBanque
          this.AddMedia = function(MediaObject){
              var e = this.GoyaveURLToID[MediaObject.URL];

              if( typeof e != 'undefined' ) {
                  return e;
              } else {
                var NewMedia = new Media(MediaObject,this.$);
                  NewMedia.IsAnnoted = !Util.IsUndef(NewMedia.Notes) && NewMedia.Notes.length > 0;

                  //console.log('add media',GoyaveObject.URL);
                  this.GoyaveURLToID[MediaObject.URL] = this.MediasBanque.length;
                  this.MediasBanque.push(NewMedia);


                  return this.MediasBanque.length-1;
              }
          };

          // PepinID to Media
          this.GetMedia = function(PepinID){
              var e = this.MediasBanque[PepinID];


              if( typeof e != 'undefined' && !!e.IsMedia ) {
                  return e;
              } else {
                  //console.log(e,PepinID);
                  console.log('media non trouvé..',e,PepinID);
                  return undefined;
              }
          };

          this.DomSearchKeyDirective = function(el){
            if( !Util.IsUndef(el.keyAction) && !el.keyProcessed )
            {
              el.keyProcessed = true;
              this.addKeyAction(el.keyAction);
            }

            for( var i in el.children )
            {
              this.DomSearchKeyDirective(el.children[i]);
            }
          };

          this.pepinPepify = function(pepin,dest){
            dest.pepin = pepin;
            dest.pepinResize = pepin.pepinResize.bind(pepin);
            dest.$ = pepin.$; // set jquery dependency
            dest.$Holder = dest.$(dest.$el);

            // bug here for pepin-help : dest.$el is ??????

            dest.pepinEvt = function(){
              this.pepin.$emit.apply( this.pepin, arguments);
            }.bind(dest);

            if( dest.lookForKeys )
            {
              pepin.DomSearchKeyDirective(dest.$el);
            }

            // todo : think about it
            // needed for vue to be referenced in overlay
            if( dest.pepinAdd )
            {
              dest.$parent[dest.name] = dest;
              dest.$parent['$'+dest.name] = this.$(dest.$el);
            }

            if( dest.pepinAutoBroadcast )
            {


              for( var i in dest.pepinAutoBroadcast )
              {
                //console.log(AutoBroadcast[i]);
                this.$on(dest.pepinAutoBroadcast[i],function(This,EvtName){ return function(){
                  var args = Util.toArray(arguments,0);


                  for( var j = args.length; j > 0 ; j-- )
                  {
                    args[j] = args[j-1];
                  }

                  args[0] = EvtName;
                  //console.log(EvtName,args.length,args);

                  //this.$broadcast.apply(this,toArray(arguments,1));
                  //var args = arguments.unshift(AutoBroadcast[i]);
                  //this.$broadcast.apply(This,args);
                  this.$broadcast.apply(This,args);
                }}(dest,dest.pepinAutoBroadcast[i]));
              }

            }


            dest.pepified = true;
            if( dest.pepinReady )
            {
              dest.pepinReady();
            }

          };

          this.pepinPepifyChildren = function(pepin){
            var name,children;

            for( var i in this.$children )
            {
              children = this.$children[i];
              name = children.name;

              if( !children.pepified )
              {
                pepin.pepinPepify(pepin,children);
              }

              //this[name] = children;
              //this['$'+name] = $(children.$el);

              if( children.pepinAdd )
              {
                pepin[name] = children;
                pepin['$'+name] = pepin.$(children.$el);
              }

              //console.log(this.name,name);

              pepin.pepinPepifyChildren.bind(children)(pepin);
            }

          };

          this.pepinPepify(this,this);
          this.pepinPepifyChildren(this);

          if( this.sidebarId )
          {
            this.overlay.setupSidebar($( '#'+this.sidebarId , this.$Holder ));
          }

          this.options = options;
          this.SetDurationAuto = options.SetDurationAuto || false;

          // set help before pepify for key directive
          this.hasHelp = !Util.IsUndef(this.help);
          this.enableHelp = this.enableHelp && this.hasHelp;
          this.help.enabled = this.enableHelp;

          if( this.hasHelp )
          {
            this.$Holder
              .bind('mouseover',this.pepin.help.mouseover.bind(this.pepin.help))
              .bind('mousemove',this.pepin.help.mousemove.bind(this.pepin.help))
            ;
          }

          if( !this.disableShortcuts )
          {
            
              $(document)
                .keydown(this.keydown.bind(this))
                .keyup(this.keyup.bind(this))
              ;
            
          }
          this.$(window)
            .resize(this.pepinResize)
            .blur(function(){
              this.ctrlKeyPressed = false;
              this.shiftKeyPressed = false;
              this.altKeyPressed = false;
            }.bind(this))
          ;

          // fullscreen
          this.$(document)
            .bind('fullscreenchange',this.$emit.bind(this,'fullscreenChange'))
          ;

          if( this.screenfull.enabled )
          {
            document.addEventListener(
              this.screenfull.raw.fullscreenchange,
              this.fullscreenChange.bind(this)
            );
            this.fullscreenChange();
          }


          this.volume_set( 1.0 );
          this.$emit('resize');
          this.$emit('zoomAutoEnable');
          this.$emit('changeNoteType',this.noteType);

          // hack
          // todo remove ?
          window.setTimeout(function(){
            this.collection.UpdatePepin();
            //this.LireMedias([[0]]);
          }.bind(this),50);

          window.requestAnimationFrame(this.raf);

          this.collection.AjouterMedias(medias);
          //console.log('Pepin is ready !');
      },

      methods: {
        pepinReady: function(){
        },

        /* Pepin API */

        sidebarOpen: function(){
          this.overlay.sidebarOpen();
        },

        sidebarClose: function(){
          this.overlay.sidebarClose();
        },

        /* Methods that can be overriden by the user of the library */
        onMediaChanged: function(NewMedia){
          console.log('The new current media selected in Pépin is : ',NewMedia);
        },

        onClose: function(){
        },

        onOpen: function(){
        },

        ExportNotesArray: function(){
          if( !Util.IsUndefOrNull( this.overlay.vue ) && !Util.IsUndefOrNull( this.collection ) )
          {
            var R = [];

            for( var i = 0 ; i < this.collection.Medias.length ; i++ )
            {
              R = R.concat(this.collection.Medias[i].Media.Notes || []);
            }

            return R;
          }
          else
          {
            return undefined;
          }
        },






        raf: function(){
          this.$emit('raf');

          window.requestAnimationFrame(this.raf);
        },

        addKeyAction: function(keyAction){
          //console.log(keyAction);
          this.keysAction.push(keyAction);
        },

        fullscreenChange: function(){
          //console.log('Am I fullscreen? ' + (screenfull.isFullscreen ? 'Yes' : 'No'));

          if( Util.XOR(this.screenfull.isFullscreen , this.fullscreen) )
          {
            this.$emit('fullscreenToggle');
          }
        },

        checkTargetNote: function(event,$target){
          return ($target || this.$(event.target)).hasClass('pepin-note-target');
        },

        checkTargetInput: function(event,$target){
          return $target.is('textarea') || $target.is('input');
        },

        acceptKeydown: function(event){
          var $target = this.$(event.target);
          return this.Opened && !this.checkTargetNote(event,$target) && !this.checkTargetInput(event,$target);
        },

        keydown: function(event){
          //console.log( 'key : ' + event.which );
          //console.log(this.checkTargetNote(event),event.key);
          //console.log(console.log(event.which),this.acceptKeydown(event));

          if( this.acceptKeydown(event) )
          {
            var code = event.keyCode || event.which;
            var k = String.fromCharCode(code).toUpperCase();
            //console.log(k,code);

            for( var i in this.keysAction )
            {
              var kA = this.keysAction[i];
              //console.log(kA.key,k,Util.IsUndef(kA.key));

              if( ( !Util.IsUndef     (kA.key)  && k == kA.key)
               || ( !Util.IsUndefOrNan(kA.code) && code == kA.code ) )
              {
                //console.log(this);
                kA.element.dispatchEvent( new Event('click') );
              }
            }

            switch( event.which )
            {
              case 38 : // top
                this.$emit('speedUp');
                break;
                
              case 40 : // bottom
                this.$emit('speedDown');
                break;

              case 16 : // Shift
                this.shiftKeyPressed = true;
                break;

              case 17 : // Ctrl
                this.ctrlKeyPressed = true;
                break;

              case 18 : // Alt
                this.altKeyPressed = true;
                break;
            }
          }
        },
        keyup: function(event){
          if( this.acceptKeydown(event) )
          {
            switch( event.which )
            {
              case 16 : // Shift
                this.shiftKeyPressed = false;
                break;

              case 17 : // Ctrl
                this.ctrlKeyPressed = false;
                break;

              case 18 : // Alt
                this.altKeyPressed = false;
                break;
            }
          }
        },

        GetCurrentFrame: function(){
          return this.CurrentFrame;
        },

        LireMedias: function(Medias_array){

          if( Medias_array.length <= 0 || Medias_array[0].length <= 0 )
          {
            // todo : rien à lire, blank
          }
          else
          {
            this.Pellicules = [];
            //console.log(Medias_array);

            for( var i in Medias_array )
            {
              var Medias = Medias_array[i];

              this.Pellicules.push(new Pellicule({
                Width: 1280,
                Height: 720,
                SetDurationAuto : true,
                FPS : this.defaultFps
              }));
              this.HasPellicule = true;
              // first Pellicule gives infos (VideoMode, dimensions...)

              // todo : here bug
              var Type = Medias[0].Type;

              //console.log(Medias);

              if( Type == Media.prototype.MEDIA_TYPE.MEDIA_VIDEO )
              {
                this.Pellicules[i].Type = Pellicule.prototype.PELLICULE_TYPE.PELLICULE_VIDEOS;

                this.Pellicules[i].start();

                for( var j = 0 ; j < Medias.length ; j++ )
                {
                  this.Pellicules[i]
                    .addVideo({
                      Media : Medias[j],
                        FrameIn : 0,
                        FrameOut : 1
                      })
                  ;
                }

              }
              else if( Type == Media.prototype.MEDIA_TYPE.MEDIA_IMAGE )
              {
                this.Pellicules[i].Type = Pellicule.prototype.PELLICULE_TYPE.PELLICULE_IMAGE;


                this.Pellicules[i].start();
                this.Pellicules[i].setImage(Medias[0]);
              }
                
            }

            this.Pellicule = this.Pellicules[0];

            if( this.Pellicule.Medias.length > 0 )
            {
              // the first media is the one concerned
              // this affects Notes, dimensions...
              this.SetCurrentMedia(this.Pellicule.Medias[0].Media);
              // bug for the first media loaded
            }

            this.$emit( 'startPellicules' );
          }
        },

        SetCurrentMedia: function( Media ){

          if( !Util.IsUndef(this.overlay.vue) )
          {
            this.overlay.vue.currentMediaID = Media.ID;
            //console.log("SetCurrentMedia !",Media.ID,this.overlay.vue.currentMediaID);
          }

          this.currentMedia = Media;
          this.widthLock = this.currentMedia.Ratio <= 1.0;

          this.onMediaChanged(Media);

        },

        Open: function(){
          this.$emit('open');
        },
        Close: function(){
          this.$emit('close');
        },

        pbrPower_set: function(pbrPower_new){
          this.pbrPower = pbrPower_new;

          if( Util.IsUndefOrNan( this.pbrPower ) )
          {
              this.pbr = 1.0;
              this.pbrPower = 0;
          }
          else
          {

            this.pbrPower = Math.min(Math.max(this.pbrPower,this.pbrPowerMin),this.pbrPowerMax);

            if( this.pbrPower == 5 )
            {
                this.pbr = 3;
            }
            else if( this.pbrPower == -5 )
            {
                this.pbr = 1.0/3;
            }
            else
            {
                this.pbr = Math.pow( 1.2599210498948731647672106072782 , this.pbrPower ); // 2^(1/3)
            }

            if( this.pbr > 1 )
            {
                this.pbr = Math.floor(this.pbr * 10 ) / 10;
            }
            else
            {
                this.pbr = 1.0 / (Math.floor( 1.0 / this.pbr * 10 ) / 10);
            }

          }

          this.pbrDt = 1000.0 / (this.pbr * this.Pellicule.FramesPerSeconds);

          //console.log('pbr_update');
          this.$emit('pbr_update');
        },

        volume_set: function(volume_new){
          this.volume = Math.min(Math.max(volume_new,0.0),1.0);
          this.$emit('volume_update');

        },

        pepinResize: function(){
          this.$emit('resize');
        },

        BroadcastZoomAuto: function(){
          this.$emit('zoomAuto',this.zoomLockState,this.widthLock);
        },

      },

      events: {

        raf: function(){
          this.$broadcast('raf');
          return true;
        },

        videoLoop: function(){
          this.videoLoop = !this.videoLoop;
        },

        play: function(){
          this.playing = true;
          this.$broadcast('play');
        },
        pause: function(){
          this.playing = false;
          this.$broadcast('pause');
        },
        playPause: function(){
          if( this.playing )
          {
            this.$emit('pause');
          }
          else
          {
            this.$emit('play');
          }
          return false;
        },

        speedUp: function(){
          this.pbrPower_set(this.pbrPower+1);
        },
        speedDown: function(){
          this.pbrPower_set(this.pbrPower-1);
        },

        zoomWheel: function(event){
          this.overlay.dragMousewheel(event,true);
        },

        zoomAutoEnable: function(){
          this.zoomLockState = 2;
          this.BroadcastZoomAuto();
        },
        zoomAutoDisable: function(){
          this.zoomLockState = 0;
          this.BroadcastZoomAuto();
        },
        zoomAutoToggle: function(){
          if( this.zoomLockState == 2 )
          {
            this.$emit('zoomAutoDisable');
          }
          else
          {
            this.$emit('zoomAutoEnable');
          }
        },

        dimensionLockToggle: function(){
          this.zoomLockState = (this.zoomLockState == 1) ? 0 : 1;
          this.BroadcastZoomAuto();
        },

        fullscreenToggle: function(){
          if( this.fullscreen )
          {
            this.$emit('fullscreenDisable');
          }
          else
          {
            this.$emit('fullscreenEnable');
          }
        },
        fullscreenRequestToggle: function(){
          this.screenfull.toggle();
          this.$emit('fullscreenToggle');
        },
        fullscreenChange: function(event){
          //console.log(event);
        },
        fullscreenEnable: function(){
          this.fullscreen = true;
          this.$broadcast('fullscreenEnable');
        },
        fullscreenDisable: function(){
          if( this.fullscreen )
          {
            this.fullscreen = false;

            if( this.Opened )
            {
              this.$broadcast('open');
            }

            this.$broadcast('fullscreenDisable');
          } 
        },

        export: function(){
          for( var i = 0 ; i < this.Pellicules.length ; i++ )
          {
            var URL = this.Pellicules[i].Medias[0].Media.URL;

            if( !Util.IsUndef(URL) )
            {
              window.open(URL);
            }
          }
        },

        dimensions: function(Dim){
          this.$broadcast('dimensions',Dim);
        },

        resize: function(){
          //console.log('resize');
          this.dimensions = this.overlay.Dimensions();
          this.$emit('dimensions',this.dimensions);
        },

        startPellicules: function(){
          this.VideoMode = this.Pellicule.VideoMode;
          this.pbrPower_set( 0 );
          this.DisplayName = this.Pellicule.DisplayName;
          this.$broadcast('pellicules_update');
          this.BroadcastZoomAuto();
        },

        pelliculeLoaded: function(i){
          //console.log(this.currentMedia.Duration);
          this.$broadcast('pelliculeLoaded',i);

          // import existing Notes from Medias
          if( !Util.IsUndef(this.overlay.vue) )
          {
            //console.log('videomode',this.VideoMode);
            //this.ImportNotes(this.currentMedia.Notes || []);
            //console.log(this.Pellicule.Medias);

            var M = this.Pellicule.Medias;
            var N = [];
            for( var i = 0 ; i < M.length ; i++ ){
              var notes = M[i].Media.Notes;
              if( !Util.IsUndef(notes) ){
                N = N.concat(notes);
              }
            }

            this.overlay.vue.ImportNotes(N);
            this.pepinEvt('updateNotes');
            
          }


          //this.videoEditMediaID = this.Pellicule.Medias[0].Media.ID;//
        },

        zoomCoeffUpdated: function(NewZoomCoeff){
          this.$broadcast('zoomCoeffUpdated',NewZoomCoeff);
        },

        frameUpdated: function(Frame){
          // bug : multiple call of frameUpdated

          //console.log('coucou',Frame);
          if( !Util.IsUndefOrNan(Frame) )
          {
            this.CurrentFrame = Frame;
          }

          this.$broadcast('frameUpdated',Frame);
        },

        open: function(){
          this.Opened = true;
          this.$Holder.addClass('pepin-opened');
          this.$broadcast('open');
          this.OpenedFirstTime = true;
          this.onOpen();
        },

        close: function(){
          this.Opened = false;
          this.$Holder.removeClass('pepin-opened');
          this.$broadcast('close');
          this.onClose();
        },

        helpToggle: function(){
          this.enableHelp = !this.enableHelp;
          this.$broadcast('helpToggle');
        },

        sidebarToggle: function(){
          this.$broadcast('sidebarToggle');
        },


        // Notes


        visuNoteToggle: function(){
          this.noteViewing = !this.noteViewing;
          this.pepinEvt('noteMode');
        },

        editNoteToggle: function(){
          this.noteEditing = !this.noteEditing;
          this.$emit('changeNoteType','none');
          this.pepinEvt('noteMode');
        },

        changeNoteType: function(type){
          this.noteType = type;

          this.$broadcast('changeNoteType',type);

          this.noteDeleting = this.noteType == 'delete';

          if(this.noteType != 'none' && !this.noteDeleting)
          {
            this.noteEditing = true;
            this.noteViewing = true;
          }

        },

        changeNoteColor: function(NewNoteColor){
          this.noteColor = NewNoteColor;
          this.$broadcast('changeNoteColor',NewNoteColor);
        },

      },

    };

    // options in Pepin about language and keyboard shortcuts 
    // are global (browser's window object) 

    Vue.directive('help',{
      bind: function(){
        this.el.hasHelp = true;
      },
      update: function(value){
        //console.log('bind',value);
        this.el.helpTip = value;
      }
    });

    Vue.directive('key',{
      bind: function(){
      },
      update: function(value){
        this.el.keyProcessed = false;
        
        var n;
        var key;
        var parent = false;

        if( value.code || value.key )
        {
          n = parseInt(value.code,10);
          key = value.key ? value.key.toUpperCase() : undefined;
          parent = value.parent || parent;
        }
        else
        {
          key = value.toUpperCase();
          n = parseInt(value,10);
        }

        this.el.tipKey = key || value.char;
        this.el.keyAction = {
            key : key,
            code : n,
            element : parent ? this.el.parentElement : this.el
        };

        //console.log(this.el.tipKey);
        //console.log(n,key);
        //console.log(n,key,parent,this.el.parentElement);
      }
    });


    return Return;
  }

}

