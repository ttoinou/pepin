<script>
/*
 * Pepin Media Player - Antoine Dornstetter
 * 
 *   src/components/Vue.vue ("Vue" means View in French)
 *     - Handle medias geometry : dimensions, drag & drop, zoom
 *     - AB(CDEF...) Comparisons
 *
 */
import Util from '../Util.js'
import Pellicule from '../Pellicule.js'
import Media from '../Media.js'

import PepinNote from './Note.vue'
import PepinProjection from './Projection.vue'

var Vue = require('vue')

var Point2D = Util.Point2D;
var Vue2D = Util.Vue2D;
var Vue2D_Statiques = Util.Vue2D_Statiques;
var Point2D_Statiques = Util.Point2D_Statiques;

export default {

  components: { PepinNote , PepinProjection },

  props: ['vueFromOverlay'],

  data: function () {
    return {
      name: 'vue',
      pepinAdd: true,
      pepified: false,
      pepinAutoBroadcast: [
        'play',
        'pause',
        'stop',
        //'scrub', // bug
        'scrubTo',
        'pelliculesLoaded',
        'volume_update',
        'pbr_update',
        'updateFrame',
        'zoomVue',
        'noteMode',
        'frameUpdated'
      ],
      lookForKeys: false,

      holderWidth: 0,
      holderHeight: 0,
      holderLeft: 0,
      holderTop: 0,
      OffsetGauche: 0,
      OffsetHaut: 0,
      Dragging: false,
      CenterBeforeDrag: new Point2D(),
      PointBeforeDrag: new Point2D(),
      DragDelta: new Point2D([0,0]),
      DragMin: new Point2D(),
      DragMax: new Point2D(),
      DragMinMaxMargePercent: 0.15,
      DragMinMaxDuration: 800,
      NextCenter: new Point2D(),
      NextCenter2: new Point2D(),

      editingNote: false,
      notes: [],

      projections: [],
      VideoMode: false,
      Loaded: false,
      Stopped: false,

      comparison: false,
      comparisonCenter: new Point2D({
        x: 0.5,
        y: 0.5
      }),
      comparisonCenterBeforeDrag: new Point2D(),
      comparisonCount: 1,
      comparisonAngle: -Math.PI/2.0,
      comparisonDragging: false,

      dimensionSlide: 0,
      dimensionSlideMax: 1,

      lastZoomCoeff: undefined,


      CenterDV_Modes: [{
          Name: "Drag",
          TransitionDuration: 20,
          SwitchDuration: 100,
          IncrementValue: 1.0,
      },{
          Name: "Center",
          TransitionDuration: 50,
          SwitchDuration: 100,
      }],
      CenterDV_Params: {
          DefaultValue: [0.0], // this.Vue_Origine.Centre
          Log: false,
          Dimensions: 1,
          Min: [-200],
          Max: [ 10000],
      },

      currentMediaID: -1
    }
  },


  ready: function(){
    this.pepin = this.vueFromOverlay.pepin;

    // hack
    /*window.setInterval(function(){
      //This.Vue_Espace_Update(This.Dim.VueL,This.Dim.VueH,This.Dim.VueGauche,This.Dim.VueHaut);
      this.UpdateZoomCenter();
    }.bind(this),10);*/

    this.Vue_Origine = null;
    this.Vue_Zoom = null;
    this.Vue_Espace = null;
    this.Vue_Page = null;
    this.Vue_Origine_Espace = null;

    this.ZoomDV = null;
    this.CenterDVX = null;
    this.CenterDVY = null;

    this.Vues_Setup();

    this.pepin.pepinPepify(this.pepin,this);
  },

  computed: {

    clipPathsPoints: function(){
      var R = [];
      var A;
      var Angle = Math.PI * 2.0 / ( 3.0 * this.comparisonCount );

      var MaxRayon = Math.sqrt(this.holderWidth*this.holderWidth + this.holderHeight*this.holderHeight) * 2;

      var Centre = [
        this.comparisonCenter.x * this.holderWidth,
        this.comparisonCenter.y * this.holderHeight,
      ];

      for( var i = 0 ; i < this.comparisonCount ; i++ )
      {
        A = [Centre];
        for( var j = 0 ; j < 4 ; j++ )
        {
          A.push([
            Centre[0] + MaxRayon * Math.cos( this.comparisonAngle + Angle * (3*i+j) ),
            Centre[1] + MaxRayon * Math.sin( this.comparisonAngle + Angle * (3*i+j) )
          ]);
        }
        R.push(A);
      }

      //console.log(R);

      return R;
    },

    // clipPaths for Firefox
    clipPathsFF: function(){
      var R = [];
      var A;

      for( var i in this.clipPathsPoints )
      {
        A = [];
        for( var j in this.clipPathsPoints[i] )
        {
          A.push(this.clipPathsPoints[i][j][0] + ' ' + this.clipPathsPoints[i][j][1]);
          //A.push(this.clipPathsPoints[i][j][0]/100. + ' ' + this.clipPathsPoints[i][j][1]/100.);
          //A.push(this.clipPathsPoints[i][j][0]/100. + '% ' + this.clipPathsPoints[i][j][1]+'%');
        }
        R.push(A.join(','));
      }

      console.log('ff',R);


      return R;
    },

    // clipPaths with values in pixels for Chrome
    clipPathsPX: function(){
      var R = [];
      var A;

      for( var i in this.clipPathsPoints )
      {
        A = [];
        for( var j in this.clipPathsPoints[i] )
        {
          A.push(this.clipPathsPoints[i][j][0] + 'px ' + this.clipPathsPoints[i][j][1] + 'px');
        }
        R.push(A.join(','));
      }

      console.log('chrome',R);

      return R;
    },
  },

  methods: {
    // ready after jQuery dependency
    pepinReady: function(){
    },

    ExportNotes: function(){
      var R = [];

      for( var i = 0 ; i < this.$children.length ; i++ )
      {
        var children = this.$children[i];

        if( children.name == 'note' && !children.hide )
        {
          //console.log(children.hide,children);
          R.push( children.export() );
        }
      }

      return R;
    },

    ImportNotes: function(NewNotes){
      //console.log('importNotes',NewNotes);
      this.notes = [];

      if( !NewNotes ){ return; }

      this.currentNote = -1;

      for( var i = 0 ; i < NewNotes.length ; i++ )
      {
        this.currentNote = this.notes.length;

        // noteFromVue
        this.notes.push({
          pepin: this.pepin,
          ID: this.currentNote,
          import: true,
          importData: NewNotes[i],
          PelliculeFrame: this.pepin.VideoMode ? this.Pellicule.GetPelliculeFrameWithID(NewNotes[i].Frame,NewNotes[i].MediaID) : -1
        });

      }

    },

    // Overlay play
    play: function(){
      this.pepinEvt('play');
    },

    autoZoomCoeffUpdate: function(){

      var NewH = this.Vue_Espace.Hauteur;
      var NewL = NewH * this.Vue_Origine.Aspect;

      if( NewL > this.Vue_Espace.Largeur )
      {
          NewL = this.Vue_Espace.Largeur;
          NewH = NewL / this.Vue_Origine.Aspect;
      }

      var AutoCoeff = NewL / this.Vue_Origine.Largeur;
      var CoeffW = this.Vue_Espace.Largeur/this.Vue_Origine.Largeur;
      var CoeffH = (this.Vue_Espace.Hauteur*this.Vue_Origine.Aspect)/this.Vue_Origine.Largeur;

      this.ZoomDV.ModeGotoValue('Auto',[AutoCoeff]);
      this.ZoomDV.ModeGotoValue('AutoW',[CoeffW]);
      this.ZoomDV.ModeGotoValue('AutoH',[CoeffH]);

      this.dimensionSlideMax = (this.pepin.widthLock ? this.Vue_Origine.Largeur: this.Vue_Origine.Hauteur) - (this.pepin.widthLock ? this.Vue_Espace.Largeur: this.Vue_Espace.Hauteur);

      //console.log('auto ',NewL / this.Vue_Origine.Largeur,this.Vue_Espace.Hauteur,this.Vue_Origine.Largeur);
      this.pepinEvt('autoZoomCoeffUpdate',this.ZoomDV.Modes['Auto'].GetValue()[0]);
      //this.AskFather([this.ZoomDV.Modes['Auto'].GetValue()[0]]);
    },


    Vues_Setup: function(){
        this.Vue_Origine = new Vue2D({
            Min: new Point2D({ x: 0 , y: 0 })
          , Max: new Point2D({ x: 1 , y: 1 })
        });
        this.Vue_Origine.VueDC_MaJ();

        this.Vue_Zoom = new Vue2D({
            Min: new Point2D({ x: 0 , y: 0 })
          , Max: new Point2D({ x: 1 , y: 1 })
        });
        this.Vue_Zoom.VueDC_MaJ();

        this.Vue_Espace = new Vue2D({
            Min: new Point2D({ x: 0 , y: 0 })
          , Max: new Point2D({ x: 1 , y: 1 })
        });
        this.Vue_Espace.VueDC_MaJ();

        this.Vue_Origine_Espace = new Vue2D({
            Min: new Point2D({ x: 0 , y: 0 })
            , Max: new Point2D({ x: 1 , y: 1 })
          });
        this.Vue_Origine_Espace.VueDC_MaJ();


        this.Vue_Page = new Vue2D({
            Min: new Point2D({ x: 0 , y: 0 })
          , Max: new Point2D({ x: 1 , y: 1 })
        });
        this.Vue_Page.VueDC_MaJ();


        this.Vue_Overview = new Vue2D({
            Min: new Point2D({ x: 0 , y: 0 })
          , Max: new Point2D({ x: 1 , y: 1 })
        });
        this.Vue_Overview.VueDC_MaJ();

        this.ZoomDV_Init();
        this.CenterDV_Init();
    },

    Vue_Origine_Update: function(L,H){
      //console.log('Vue_Origine_Update');

        if( L != this.Vue_Origine.Max.x || H != this.Vue_Origine.Max.y )
        {
          this.Vue_Origine.Min.x = 0;
          this.Vue_Origine.Min.y = 0;
          this.Vue_Origine.Max.x = L;
          this.Vue_Origine.Max.y = H;
          this.Vue_Origine.VueDC_MaJ();
          this.Vue_Zoom.Max.x = L;
          this.Vue_Zoom.Max.y = H;
          this.Vue_Zoom.VueDC_MaJ();
        }

        // todo: bug: have to init CenterDV
        // bug when going from an image to another with different dimensions
        // middle clicking mouse: center is not correct
        this.CenterDV_Init();
        this.CenterDVX.DefaultValue = [this.Vue_Origine.Centre.x || 0.0];
        this.CenterDVY.DefaultValue = [this.Vue_Origine.Centre.y || 0.0];

        this.$emit('zoomAuto',this.zoomAuto,this.widthLock);


        // initialize Espace ? buggy
        //this.Vue_Espace_Update(L,H,0,0);

        this.CenterDVX.ModeGotoValue('Center',[this.Vue_Origine.Largeur/2.0]);
        this.CenterDVY.ModeGotoValue('Center',[this.Vue_Origine.Hauteur/2.0]);

        this.CenterDVX.ModeGotoValue('Drag',[this.Vue_Origine.Largeur/2.0]);
        this.CenterDVY.ModeGotoValue('Drag',[this.Vue_Origine.Hauteur/2.0]);

        var MargeX = this.DragMinMaxMargePercent * this.Vue_Origine.Largeur;
        var MargeY = this.DragMinMaxMargePercent * this.Vue_Origine.Hauteur;


        this.DragMin = new Point2D({
          x: this.Vue_Origine.Min.x - MargeX,
          y: this.Vue_Origine.Min.y - MargeY
        });

        this.DragMax = new Point2D({
          x: this.Vue_Origine.Max.x + MargeX,
          y: this.Vue_Origine.Max.y + MargeY
        });
        
        //console.log(MargeX,MargeY,this.DragMin,this.DragMax);
    },

    Vue_Page_Update: function(L,H,Gauche,Haut){
        this.Vue_Page.Min.x = Gauche;
        this.Vue_Page.Min.y = Haut;

        this.Vue_Page.Max.x = L + Gauche;
        this.Vue_Page.Max.y = H + Haut;
        this.Vue_Page.VueDC_MaJ();
    },

    Vue_Espace_Update: function(L,H,Gauche,Haut){
        this.Vue_Espace.Min.x = Gauche;
        this.Vue_Espace.Min.y = Haut;

        this.Vue_Espace.Max.x = L + Gauche;
        this.Vue_Espace.Max.y = H + Haut;
        this.Vue_Espace.VueDC_MaJ();
    },

    ZoomUpdateHolder: function(){
        //console.log('zoom update holder ' ,  this.GetZoom(),this.ZoomDV.Mode);

        //console.log(this.Vue_Zoom.IsNothing(),this.Vue_Origine_Espace.IsNothing());

        this.lastZoomCoeff = this.GetZoom();
        this.Vue_Zoom.RayonInterieur = this.Vue_Origine.RayonInterieur * this.GetZoom();
        this.Vue_Zoom.Aspect = this.Vue_Espace.Aspect;
        this.Vue_Zoom.VueCRIA_MaJ();
        //console.log(this.Vue_Zoom.IsNothing(),this.Vue_Zoom);

        // Vue_Origine (dans Vue_Zoom) => Vue_Origine_Espace (dans Vue_Espace)
        this.Vue_Origine.ChangerRepere(
            this.Vue_Origine_Espace,
            this.Vue_Zoom,
            this.Vue_Espace
        );


        var fn = function(Centre,LargeurEntree,LargeurSortie){ return function(x){
            return (x-Centre)/LargeurEntree*LargeurSortie + Centre;
        }};

        var fnL = fn(
            this.Vue_Espace.Centre.x,
            this.Vue_Origine_Espace.Largeur,
            this.Vue_Origine.Largeur * this.GetZoom()
        );
        var fnH = fn(
            this.Vue_Espace.Centre.y,
            this.Vue_Origine_Espace.Hauteur,
            this.Vue_Origine.Hauteur * this.GetZoom()
        );

        this.Vue_Origine_Espace.Min.x = fnL(this.Vue_Origine_Espace.Min.x);
        this.Vue_Origine_Espace.Min.y = fnH(this.Vue_Origine_Espace.Min.y);

        this.Vue_Origine_Espace.Max.x = fnL(this.Vue_Origine_Espace.Max.x);
        this.Vue_Origine_Espace.Max.y = fnH(this.Vue_Origine_Espace.Max.y);

        this.Vue_Origine_Espace.VueDC_MaJ();

        // Vue_Espace (dans Vue_OrigineEspace) => Vue_Zoom (dans Vue_Origine)
        this.Vue_Espace.ChangerRepere(
            this.Vue_Zoom,
            this.Vue_Origine_Espace,
            this.Vue_Origine
        );

        //console.log(this.Vue_Origine.Aspect);
        //console.log(this.Vue_Origine_Espace.Aspect);
        //console.log(this.Vue_Origine_Espace.Min.x);

        //console.log(this.Vue_Origine_Espace.Largeur,this.holderWidth);
        if( this.Vue_Origine_Espace.Largeur != this.holderWidth ){ this.holderWidth = this.Vue_Origine_Espace.Largeur; }
        if( this.Vue_Origine_Espace.Hauteur != this.holderHeight ){ this.holderHeight = this.Vue_Origine_Espace.Hauteur; }
        
        this.holderLeft = this.Vue_Origine_Espace.Min.x;
        this.holderTop = this.Vue_Origine_Espace.Min.y;

        this.Vue_Zoom.ChangerRepere(
            this.Vue_Overview,
            this.Vue_Origine,
            this.Vue_Page
        );

        Vue2D_Statiques.IntersectionVues(this.Vue_Overview,this.Vue_Overview,this.Vue_Page);

        //console.log(this.Vue_Origine_Espace.Min.x);
        this.zoomVueEvent();

/*
        window.a = function(This){
          return function(){
            console.log(This.Vue_Origine_Espace.IsNothing());
            console.log(This.Vue_Origine_Espace);

            console.log(This.Vue_Zoom.IsNothing());
            console.log(This.Vue_Zoom);
            
            console.log(This.Vue_Espace.IsNothing());
            console.log(This.Vue_Espace);
            
            console.log(This.Vue_Origine.IsNothing());
            console.log(This.Vue_Origine);

        console.log(This.Vue_Origine_Espace.Centre);
        console.log(This.Vue_Zoom.Centre);

            return 'a() done';
          }
        }(this);*/
    },

    zoomVueEvent: function(){
      this.pepinEvt('zoomVue',this.Vue_Origine,this.Vue_Zoom,this.Vue_Overview,this.Vue_Origine_Espace);
    },

    SetEventImageXY: function(event){
      event.imageX = event.clientX - (this.Vue_Origine_Espace.Min.x + this.OffsetGauche);
      event.imageY = event.clientY - (this.Vue_Origine_Espace.Min.y + this.OffsetHaut);
    },

    vueMousemove: function(event){
      this.SetEventImageXY(event);

      if( this.pepin.addingNote && this.currentNote != -1 )
      {
        //console.log(this.currentNote);
        this.$broadcast('creationMouseMove',event,this.currentNote);
      }
      else
      {
        if( this.Dragging || this.comparisonDragging )
        {
          this.DragDelta.x = - event.clientX + this.PointBeforeDrag.x;
          this.DragDelta.y = - event.clientY + this.PointBeforeDrag.y;
          //console.log(this.PointBeforeDrag.x,this.PointBeforeDrag.y);
        }

        if( this.comparisonDragging )
        {
          this.comparisonCenter.x = this.comparisonCenterBeforeDrag.x - this.DragDelta.x/this.holderWidth;
          this.comparisonCenter.y = this.comparisonCenterBeforeDrag.y - this.DragDelta.y/this.holderHeight;
        }
        else
        {
          if( this.Dragging )
          {
              //console.log('move',this.DragDelta);
              this.DraggingUpdate();
          }

          // todo: transform into real events ?
          this.$broadcast('mouseMove',event);
        }
      }
    },
    
    vueMouseenter: function(){

    },
    
    vueMouseleave: function(event){
      //this.currentNote = -1;
      //this.EndDragging();

      // end note dragging
      //this.$broadcast('mouseUp',event);
    },
    
    vueMousedown: function(event){
      this.SetEventImageXY(event);

      var R = true;

      //console.log(this.addingNote);

      if( event.which == 1 )
      {
        this.PointBeforeDrag.x = event.clientX;
        this.PointBeforeDrag.y = event.clientY;
      }

      if( event.which == 1 && this.pepin.addingNote )
      {
        //console.log('adding note');
        //console.log(event.layerX,this.Vue_Origine_Espace.Min.x);
        this.currentNote = this.notes.length;

        var currentFrame = this.pepin.CurrentFrame;
        var MediaID = this.pepin.VideoMode ? this.Pellicule.GetVideoID(currentFrame) : this.currentMediaID;
        var PelliculeFrame,Frame;
        var Always = !!this.pepin.videoStickyNotes;
        var VideoNote = this.pepin.VideoMode && ( !Always || ( !this.Stopped && Always ) );

        //console.log(currentFrame,MediaID,PelliculeFrame);

        // noteFromVue
        this.notes.push({
          type: this.pepin.noteType,
          x: event.imageX / this.GetZoom(),
          y: event.imageY / this.GetZoom(),
          color: this.pepin.noteColor,
          pepin: this.pepin,
          ID: this.currentNote,
          MediaID: MediaID,
          Frame: VideoNote ? this.Pellicule.GetVideoFrame(currentFrame) : -1,
          PelliculeFrame: VideoNote ? currentFrame : -1
        });

        this.pepinEvt('updateNotes');

        Vue.nextTick(function(){
          this.zoomVueEvent();
          this.$broadcast('creationMouseDown',event,this.currentNote);
        }.bind(this));
      }
      else if( event.which == 1 && this.CanDrag() )
      {
        this.Dragging = true;

        if( !this.comparisonDragging )
        {
          this.Vue_Zoom.Centre.CopierDans(this.CenterBeforeDrag);
        }

        this.vueMousemove(event);
      }
      // Middle mouse
      else if( event.which == 2 && !this.comparisonDragging )
      {
        //console.log(this.CenterDVX.Modes['Center'].GetValue(),this.CenterDVY.Modes['Center'].GetValue());
        this.CenterDVX.ModeGotoValueFromMode('Drag','Center');
        this.CenterDVY.ModeGotoValueFromMode('Drag','Center');

        this.ZoomDV.ModeGotoValueFromMode('Wheel','Auto');
        this.ZoomUpdateHolder();
      }
      // right click
      else if( event.which == 3 && !this.comparisonDragging )
      {
        R = false;
        //console.log('prevent');
        event.preventDefault();
      }

      return R;
    },
    
    vueMouseup: function(event){
      this.currentNote = -1;

      var R = true;

      if( this.comparisonDragging )
      {
        this.comparisonDragging = false;
      }
      else
      {
        if( this.Dragging )
        {
            this.EndDragging();
        }

        //console.log(this.DragDelta,this.DragDelta.DistanceSquared());

        if( this.DragDelta.DistanceSquared() < 4 && !this.pepin.noteEditing )
        {
            //console.log('yeah');
            this.pepinEvt('playPause');
        }

        // todo: transform into real events ?
        this.$broadcast('mouseUp',event);
      }

      return R;
    },

    vueDblClick: function(event){
      //console.log(event.layerX,event.layerY);
    },

    DraggingUpdate: function(){

        this.CenterDVX.ModeGotoValue('Drag',[this.CenterBeforeDrag.x + this.DragDelta.x / this.GetZoom()]);
        this.CenterDVY.ModeGotoValue('Drag',[this.CenterBeforeDrag.y + this.DragDelta.y / this.GetZoom()]);

        //window.e = this.CenterBeforeDrag.y + this.DragDelta.y / this.GetZoom();
        //console.log(this.CenterDV.GetValue());

        this.ZoomUpdateHolder();
    },

    EndDragging: function(){
        if( this.Dragging )
        {

            this.Dragging = false;

            var Point = new Point2D([
                this.CenterDVX.GetValue()[0]
              , this.CenterDVY.GetValue()[0]
            ]);

            var NewPoint = Point2D_Statiques.max(Point,this.DragMin);
            NewPoint = Point2D_Statiques.min(NewPoint,this.DragMax);

            //console.log(Point,NewPoint,NewPoint.DistanceSquaredTo(Point));

            if( NewPoint.DistanceSquaredTo(Point) > 1 )
            {
                this.CenterDVX.ModeGotoValue('Drag',[NewPoint.x],this.DragMinMaxDuration);
                this.CenterDVY.ModeGotoValue('Drag',[NewPoint.y],this.DragMinMaxDuration);
            }

        }
    },

    comparisonCenterMousedown: function($event){
      this.comparisonDragging = true;
      this.comparisonCenter.CopierDans(this.comparisonCenterBeforeDrag);
      this.vueMousedown($event);
    },

    comparisonCenterMousemove: function($event){
      this.vueMousemove($event);
    },

    comparisonCenterMouseup: function(){
      this.comparisonDragging = false;
    },

    CanDrag: function(){
      return !this.Stopped
          && !this.Dragging
          && !this.ZoomDV.Modes['Auto'].On
          // && !this.ZoomDV.Modes['AutoW'].On  && !this.ZoomDV.Modes['AutoH'].On
      ;
    },

    ZoomDV_Init: function(){
        this.ZoomDV = new Util.DynamicValue([{
            Name: "Wheel",
            IncrementDuration: 250,
            TransitionDuration: 100,
            SwitchDuration: 100,
            /*Min: [1.0/8.0],
            Max: [8.0],*/
            Min: [1.0/16.0],
            Max: [8.0],
            IncrementLogValue: Math.sqrt(2.0),
            IncrementValue: 0.25,
        },{
            Name: "Auto",
            TransitionDuration: 40,
            SwitchDuration: 100,
        },{
            Name: "AutoW",
            TransitionDuration: 40,
            SwitchDuration: 100,
        },{
            Name: "AutoH",
            TransitionDuration: 40,
            SwitchDuration: 100,
        }
        ],{
            DefaultValue: [1.0],
            Log: true,
            Dimensions: 1,
            Min: [1.0/16.0],
            Max: [8.0],
        });
      //console.log(this.ZoomDV);
    },


    CenterDV_Init: function(){
      //console.log(this.Vue_Origine.Centre.x);
      this.CenterDV_Params.DefaultValue = [this.Vue_Origine.Centre.x || 0.0];
      this.CenterDVX = new Util.DynamicValue(this.CenterDV_Modes,this.CenterDV_Params);

      this.CenterDV_Params.DefaultValue = [this.Vue_Origine.Centre.y || 0.0];
      this.CenterDVY = new Util.DynamicValue(this.CenterDV_Modes,this.CenterDV_Params);

    },

    vueMousewheel: function(event){
      if( this.ZoomDV.Modes['Wheel'].On )
      {
        this.ZoomDV.Modes['Wheel'].Increment(event.deltaY);
      }
    },

    slide: function(deltaY){
      // vertical sliding: invert deltaY
      this['CenterDV' + ( this.pepin.widthLock ? 'Y': 'X')].Modes['Drag'].Increment(deltaY*300 * (this.pepin.widthLock ? -1: 1 ));
    },

    GetZoom: function(){
        //console.log(this.ZoomDV.GetValue());
        //return this.ZoomDV.GetValue();
        return this.ZoomDV.GetValue()[0];
    },

    /*
     * Centre mouvant
     */

    UpdateZoomCenter: function(){
        this.ZoomDV.UpdateValue();

        this.autoZoomCoeffUpdate();
        this.updateZoomCoeff();

        this.CenterDVX.UpdateValue();
        this.CenterDVY.UpdateValue();

        this.Vue_Zoom.Centre.x = this.CenterDVX.GetValue()[0];
        this.Vue_Zoom.Centre.y = this.CenterDVY.GetValue()[0];

        //console.log(this.CenterDVX.GetValue());
    },



    updateZoomCoeff: function(){
      // protection
      // todo: clean raf update if needed (Dynamic Value)
      //if( this.lastZoomCoeff != this.GetZoom() )
      {
        //console.log(this.lastZoomCoeff,this.GetZoom());
        this.pepinEvt('zoomCoeffUpdated',this.GetZoom());
      }
    },

  },

  events: {

    raf: function(){
      //console.log("vue raf");
      this.UpdateZoomCenter();
      return true;
    },

    play: function(){
      this.Stopped = false;
      return true;
    },

    noteDeleting: function(ID){
      this.$broadcast('noteDelete',ID);
      this.pepinEvt('updateNotes');
    },

    dimensions: function(Dim){
      // bug
      //if( !this.HasPellicule ){ return; }

      var H = Dim.VueL * (this.HasPellicule ? this.Pellicule.Ratio: 1.0);

      /*this.Dim = Dim;
      console.log(this.Dim);*/

      //console.log(Dim.VueL,Dim.VueH,Dim.VueGauche,Dim.VueHaut);
      this.Vue_Espace_Update(Dim.VueL,Dim.VueH,Dim.VueGauche,Dim.VueHaut);
      this.OffsetGauche = Dim.CentreGauche;
      this.OffsetHaut = Dim.CentreHaut;

      //console.log(this.OffsetHaut);
      //console.log(Dim);

      this.UpdateZoomCenter();

      return true;
    },

    updateZoom: function(NewZoomCoeff){
      this.ZoomDV.ModeGotoValue('Wheel',[NewZoomCoeff]);
    },

    zoomAuto: function(zoomAuto,widthLock){
      this.zoomAuto = zoomAuto;
      this.widthLock = widthLock;
      //console.log(zoomAuto,widthLock);

      if( zoomAuto == 2 )
      {
        this.ZoomDV.Switch('Auto');
        this.CenterDVX.Switch('Center');
        this.CenterDVY.Switch('Center');
      }
      else if( zoomAuto == 1 )
      {
        this.ZoomDV.Switch('Auto'+(this.pepin.widthLock ? 'W': 'H'));
        this['CenterDV' + (!this.pepin.widthLock ? 'Y': 'X')].Switch('Center');
        this['CenterDV' + ( this.pepin.widthLock ? 'Y': 'X')].Switch('Drag');
      }
      else
      {
        this.ZoomDV.Switch('Wheel');
        this.CenterDVX.Switch('Drag');
        this.CenterDVY.Switch('Drag');
      }

      this.UpdateZoomCenter();
    },

    zoomCoeffUpdated: function(){
      this.ZoomUpdateHolder();
    },

    pellicules_update: function(){
      this.$delete(this.projections);

      //console.log('pell upd');

      this.projections = [];
      for( var i = 0 ; i < this.pepin.Pellicules.length ; i++ )
      {
        // transmit to Projection Vue info
        this.projections.push({
          Pellicule: this.pepin.Pellicules[i],
          pepin: this.pepin,
          $: this.$,
          pepinEvt: this.pepinEvt,
          IsMaster: i == 0,
          ID: i
        });


      }

      //console.log(this.$children);

      // Pellicule info (dimensions) from the first pellicule
      this.Pellicule = this.pepin.Pellicules[0];
      this.Loaded = this.Pellicule.Loaded;


      this.comparisonCount = this.pepin.Pellicules.length;

      this.comparison = this.comparisonCount > 1;
    },

    pelliculeLoaded: function(i){
      //console.log(this.Pellicule);
      //console.log(this.Pellicule.OriginalWidth,this.Pellicule.OriginalHeight);
      //console.log('pelliculeLoaded',this.Pellicule.DisplayName);
      // Master Pellicule
      if( i == 0 )
      {
        this.Vue_Origine_Update(this.Pellicule.OriginalWidth,this.Pellicule.OriginalHeight);
        this.ZoomUpdateHolder();
        this.VideoMode = this.Pellicule.VideoMode;
        this.Stopped = this.VideoMode;
        this.Loaded = true;
      }

      this.$broadcast('pelliculeLoaded',i);
    },
  }
}
</script>

<template>
<div class="pepin-vue"
     :style="{
        width: holderWidth+'px',
        height: holderHeight+'px',
        left: holderLeft+'px',
        top: holderTop+'px'
      }"
  >
    <div class="pepin-vue-background" v-if="!VideoMode"></div>
    <div
       class="Pepin_EcranOverlay"
      v-on:click="play"
    ></div>

    <!-- Projections -->
      <!-- last answer from http://stackoverflow.com/questions/33816793/clip-path-doesnt-work-in-firefox-values
        => workaround² for Firefox is inline CSS props
      -->
    <pepin-projection v-for="projection in projections" v-bind:projection-from-vue="projection"
    v-bind:style="{
      '-webkit-clip-path': comparison ? 'polygon('+clipPathsPX[projection.ID]+')': '',
      'clip-path': comparison ? 'url(#pepinSvgPath'+this.projection.ID+')': '',
      'width' : '100%',
      'height' : '100%',
      'position': 'absolute'
    }"
    ></pepin-projection>

    <!-- Notes -->
    <pepin-note v-for="note in notes" v-bind:note-from-vue="note"></pepin-note>

    <div class="comparisonCenter"
     :style="{
        left: (comparisonCenter.x*100)+'%',
        top: (comparisonCenter.y*100)+'%',
      }"
      @mousedown="comparisonCenterMousedown"
      @mousemove="comparisonCenterMousemove"
      @mouseup="comparisonCenterMouseup"
      v-if="comparison"
    ></div>

    <!-- http://stackoverflow.com/questions/33816793/clip-path-doesnt-work-in-firefox-values
      workaround for Firefox
    -->
    <svg height="100%" width="100%">
        <defs>
            <clipPath v-for="projection in projections" :id="'pepinSvgPath'+projection.ID">
                <polygon :points="clipPathsFF[projection.ID]" />
            </clipPath>
        </defs>
    </svg>

</div>
</template>

<style scoped lang="scss">
@import '../Colors.scss';

.pepin-vue
{
    height: 100%;
    left: 32px;
    position: absolute;
}

.Pepin_EcranOverlay
{
    z-index: 350;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0px;
    left: 0px;
    cursor: pointer;
    margin-bottom: 39px;
    margin: 0;
    padding: 0;
}

.pepin-vue-background
{
  position: absolute;
  width: 100%;
  height: 100%;
  background-position: 0 0;
  background-repeat: repeat;
  background-image: url(images/transparent.png);
  z-index: 0;
}

.projections
{
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 400;
  position: absolute;
}

.comparisonCenter
{
  width: 20px;
  height: 20px;
  position: absolute;
  /*background: no-repeat 2px 2px url(images/comparison.png);*/
  background-color: rgba($darkgold,0.5);
  border: 2px solid $gold;
  border-radius: 11px;
  margin: -12px 0 0 -12px;
  z-index: 8000;
  cursor: move;
}

</style>