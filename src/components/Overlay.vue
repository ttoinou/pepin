<script>
/*
 * Pepin Media Player - Antoine Dornstetter
 * 
 *   src/components/Overlay.vue
 *     - Global UI : previous/next media, timeline, help,
*          1D lock slider, fullscreen, sidebar, components dimensions
 *     - Global CSS (not scoped)
 *
 *
 *   todo:
 */
import Util from '../Util.js'
import Pellicule from '../Pellicule.js'
import Media from '../Media.js'

import PepinVue from './Vue.vue'

var Vue = require('vue')

export default {

  components: { PepinVue },

  data: function(){

    return {
      name: 'overlay',
      pepinAdd: true,
      pepified: false,
      pepinAutoBroadcast: [
        'raf',
        'noteMode',
        'noteDeleting',
        //'scrub', // bug
        'scrubTo',
        'frameUpdated'
      ],
      lookForKeys: true,

      vues: [],

      canDrag: false,
      dragging: false,
      stopped: false,
      zooming: 0,
      dragDropSize: 0,

      Opened: false,
      Animating: false,
      DureeAnimation: 500,
      fullscreenMargin: 48,

      // Timeline
      TimelineOpened: false,
      TimelineAnimating: false,
      TimelineDureeAnimation: 1200,
      TimelineHeight: 24,
      timelineProgress: 0,
      timelineNotes: {},
      showTimelineNotes: false,

      cuts: [],

      // Slider
      SliderOpened: false,
      SliderAnimating: false,
      SliderDureeAnimation: 1200,
      SliderHeight: 12,
      sliderBegin: 0,
      sliderEnd: 0,
      zoomAuto: 0,
      widthLock: false,

      mediaNextPrevWidth: 32,
      VueMargin: 0,
      MarginBottom: 2,


      PlayingBeforeScrubbing: false,
      Scrubbing: false,

      hasSidebar: false,
      sidebarAnimating: false,
      sidebarOpened: false,
      sidebarAnimationDuration: 500,
      sidebarWidth: 384,

      Dim: {
        CentreH: 1,
        CentreL: 1,
      },

      BackgroundZIndex: 550,
      BackgroundZIndexFull: 5000,
    };

  },

  ready: function(){
  },

  computed: {
  },
  
  methods: {
    // ready after jQuery dependency
    pepinReady: function(){
        // Overlay

        this.$Holder = this.$(this.$el);
        this.$Background2 = this.$('.pepin-background2',this.$Holder);
  
        this.$('.pepin-centerDrag',this.$Holder).mousewheel(this.dragMousewheel.bind(this));

        this.$Timeline = this.$('.pepin-timeline',this.$Holder);
        this.$Slider = this.$('.pepin-slider',this.$Holder);

        this.vues.push({
          pepin: this.pepin
        });

        //this.pepin.LireMedias([[0]]);
    },

 // Overlay

      TimelineOpen: function(){

          this.TimelineHasToBeOpen = true;

          if( this.TimelineAnimating )
          {
              this.$Timeline
                  .finish()
              ;
          }
          else
          {
              this.TimelineAnimating = true;
              this.$Timeline
                  .animate({
                      width: '100%'
                  },{
                      duration: this.TimelineDureeAnimation,
                      //step: this.pepinResize,
                      easing: 'easeOutBounce',
                      complete: function(This){return function(){
                          This.$Timeline.css({
                              'left' : 'auto',
                              'right': 0
                          });

                          This.TimelineOpened = true;
                          This.TimelineCallback();
                          This.pepinResize();
                      }}(this)
              });
          }

      },

      TimelineClose: function(){

          this.TimelineHasToBeOpen = false;

          if( this.TimelineAnimating )
          {
              //console.log(this.$Timeline);
              this.$Timeline
                  .finish()
              ;
          }
          else
          {
              this.TimelineAnimating = true;
              this.$Timeline
                  .animate({
                      width: 0
                  },{
                      duration: this.TimelineDureeAnimation,
                      //step: this.pepinResize,
                      easing: 'easeOutBounce',
                      complete: function(This){return function(){
                          This.$Timeline.css({
                              'right' : 'auto',
                              'left': '-2px'
                          });

                          This.TimelineOpened = false;
                          This.TimelineCallback();
                          This.pepinResize();
                      }}(this)
              });
          }

      },

      TimelineCallback: function(event){
          this.TimelineAnimating = false;
          //console.log('>>>>' + this.TimelineHasToBeOpen);

          if( this.TimelineHasToBeOpen && !this.TimelineOpened )
          {
              this.TimelineOpen();
          }
          else if( !this.TimelineHasToBeOpen && this.TimelineOpened )
          {
              this.TimelineClose();
          }
      },




      // Slider
      SliderOpen: function(){
          this.SliderHasToBeOpen = true;

          if( this.SliderAnimating )
          {
              this.$Slider
                  .finish()
              ;
          }
          else
          {
              this.SliderAnimating = true;
              this.$Slider
                  .animate({
                      width: '100%'
                  },{
                      duration: this.SliderDureeAnimation,
                      //step: this.pepinResize,
                      easing: 'easeOutBounce',
                      complete: function(This){return function(){
                          This.$Slider.css({
                              'left' : 'auto',
                              'right': 0
                          });

                          This.SliderOpened = true;
                          This.SliderCallback();
                          This.pepinResize();
                      }}(this)
              });
          }

      },

      SliderClose: function(){

          this.SliderHasToBeOpen = false;

          if( this.SliderAnimating )
          {
              //console.log(this.$Timeline);
              this.$Slider
                  .finish()
              ;
          }
          else
          {
              this.SliderAnimating = true;
              this.$Slider
                  .animate({
                      width: 0
                  },{
                      duration: this.SliderDureeAnimation,
                      //step: this.pepinResize,
                      easing: 'easeOutBounce',
                      complete: function(This){return function(){
                          This.$Slider.css({
                              'right' : 'auto',
                              'left': '-2px'
                          });

                          This.SliderOpened = false;
                          This.SliderCallback();
                          This.pepinResize();
                      }}(this)
              });
          }

      },

      SliderCallback: function(event){
          this.SliderAnimating = false;
          //console.log('>>>>' + this.SliderHasToBeOpen);

          if( this.SliderHasToBeOpen && !this.SliderOpened )
          {
              this.SliderOpen();
          }
          else if( !this.SliderHasToBeOpen && this.SliderOpened )
          {
              this.SliderClose();
          }
      },


      GetTotalFrames: function(){
          if( !this.pepin.Pellicule ){
              return 0;
          } else {
              return this.pepin.Pellicule.FrameCount - 1;
          }
      },
      
      Dimensions: function(){
        this.Dim.DocumentL = this.$Holder.width();
        this.Dim.DocumentH = this.$Holder.height();

        this.Dim.OutilsH = Util.Positive(!!this.pepin.$toolbar ? (this.pepin.$toolbar.height() + Util.toFloat(this.pepin.$toolbar.css('top'))) : 0.0);

        this.Dim.SelectionH = Util.Positive( !!this.pepin.$collection ? (this.pepin.$collection.height() + Util.toFloat(this.pepin.$collection.css('bottom'))) : 0.0 );

        this.Dim.CentreH = this.Dim.DocumentH - this.Dim.OutilsH - this.Dim.SelectionH;

        this.Dim.SidebarL = this.hasSidebar ? Util.Positive( this.$sidebar.width() + Util.toFloat(this.$sidebar.css('left')) ): 0;
        this.Dim.CentreL = this.Dim.DocumentL - this.Dim.SidebarL;

        this.Dim.CentreHaut = this.Dim.OutilsH;
        this.Dim.CentreGauche = this.Dim.SidebarL;

        this.Dim.VueGauche = this.mediaNextPrevWidth + this.VueMargin;
        this.Dim.VueL = this.Dim.CentreL - 2*this.mediaNextPrevWidth - 2*this.VueMargin;

        // always Timeline & Slider
        this.Dim.VueH = this.Dim.CentreH - 2*this.VueMargin - this.TimelineHeight - this.MarginBottom - this.SliderHeight;
        this.Dim.VueHaut = this.VueMargin + this.SliderHeight;

        this.Dim.DocumentHaut = 0;
        this.Dim.DocumentGauche = 0;

        return Util.CloneObject(this.Dim);
      },

      // Mousedown puis Mouseup direct => on ne fait pas pause, scrub, play mais juste scrub
      // Mousedown, Mousemove, puis Mouseup => on fait pause, scrub, play

      timelineMousedown: function(event){
          this.Scrubbing = true;
          this.FirstMousemove = false;
          this.PlayingBeforeScrubbing = this.playing;

          this.timelineMousemove(event);

          //console.log('down');
      },

      timelineMousemove: function(event){
          var dx = (event.clientX - this.$Timeline.offset().left) / this.TimelineWidth * (this.GetTotalFrames());

          if( this.Scrubbing )
          {

              // TODO: chrono < 200 ms
              if( this.PlayingBeforeScrubbing && !this.FirstMousemove && dx <= 1 )
              {
                  this.FirstMousemove = true;
                  //This.Ask_Pause();
              }

              //This.Ask_ScrubTo( Math.round( dx ) );
              this.$broadcast('scrubTo',Math.round( dx ));
          }

      },

      timelineMouseup: function(event){
          if( this.Scrubbing && this.PlayingBeforeScrubbing && this.FirstMousemove )
          {
              //console.log('overlay play');
              //This.Ask_Play();
          }

          //console.log('up');

          this.Scrubbing = false;
      },

      timelineMouseleave: function(event){
          if( this.Scrubbing && this.PlayingBeforeScrubbing )
          {
              //This.Ask_Play();
          }

          //console.log('leave');

          this.Scrubbing = false;
      },

      overlayMousemove: function(event){
        //console.log(event.layerY,event.pageY)
        if( this.pepin.fullscreen )
        {
            var y = event.clientY;
            var ProcheOutils = Math.abs(y) <= this.pepin.toolbar.HauteurMax + this.fullscreenMargin;
            var ProcheSelection = Math.abs(y-this.DocumentHauteur) <= this.pepin.collection.HauteurMax + this.fullscreenMargin;

            if( !this.pepin.collection.Opened && ProcheSelection )
            {
                this.pepin.collection.$emit('open');
            }
            else if( this.pepin.collection.Opened && !ProcheSelection )
            {
                this.pepin.collection.$emit('close');
            }

            if( !this.pepin.toolbar.Opened && ProcheOutils && this.Opened )
            {
              this.pepin.toolbar.$emit('open');
            }
            else if( this.pepin.toolbar.Opened && !ProcheOutils && this.Opened )
            {
              this.pepin.toolbar.$emit('close');
            }
        }

        this.vue.vueMousemove(event);

        //console.log(this.pepin.enableHelp);
      },

      dragMouseenter: function(event){
        this.vue.vueMouseenter(event);
      },

      dragMouseleave: function(event){
        /*if( this.$(event.target).hasClass('pepin-centerDrag') )
        {
          console.log(this.$(event.relatedTarget));
          this.vue.vueMouseleave(event);
        }*/
        this.vue.vueMouseleave(event);
      },

      dragMousedown: function(event){
        //console.log(event,this.canDrag,this.dragging);

        this.canDrag = this.vue.CanDrag();
        if( this.canDrag )
        {
          this.dragging = true;
        }

        event.preventDefault();
        return this.vue.vueMousedown(event);
      },

      dragMouseup: function(event){
        this.dragging = false;
        return this.vue.vueMouseup(event);
      },

      dragDblClick: function(event){
        this.vue.vueDblClick(event);
      },

      dragMousewheel: function(event,fromToolbar){
        // for cursor only
        this.zooming = event.deltaY;

        if( this.zoomAuto == 1 )
        {
          this.vue.slide(event.deltaY);
        }
        else
        {
          this.vue.vueMousewheel(event,fromToolbar);
        }

      },

      dragContextMenu: function(event){
        event.preventDefault();
      },

      mediaPrev: function(){
        this.pepinEvt('mediaPrev');
      },

      mediaNext: function(){
        this.pepinEvt('mediaNext');
      },

      setupSidebar: function($el){
        this.$sidebar = $el.addClass('pepin-sidebar');
        this.hasSidebar = true;
      },

      sidebarOpen: function(){
        if( this.hasSidebar )
        {
          if( !this.sidebarAnimating && !this.sidebarOpened )
          {
            this.sidebarAnimating = true;
            this.$sidebar
              .animate({
                left: 0
              },{
                duration: this.sidebarAnimationDuration,
                step: this.pepinResize,
                specialEasing: "easein",
                complete: function(){
                  this.sidebarOpened = true;
                  this.sidebarAnimating = false;
                  this.pepin.sidebar = true;
                }.bind(this)
          });
          }

        }
      },

      sidebarClose: function(){
        if( this.hasSidebar )
        {
          if( !this.sidebarAnimating && this.sidebarOpened )
          {
            this.sidebarAnimating = true;
            this.$sidebar
              .animate({
                left: -this.sidebarWidth
              },{
                duration: this.sidebarAnimationDuration,
                step: this.pepinResize,
                specialEasing: "easein",
                complete: function(){
                  this.sidebarOpened = false;
                  this.sidebarAnimating = false;
                  this.pepin.sidebar = false;
                }.bind(this)
            });
          }

        }
      },
  },

  events: {

    updateNotes: function(){
      if( !this.vue ){ return; }

      // hack : we have to wait one tick of VueJS
      Vue.nextTick(function(){

        this.timelineNotes = {};
        this.showTimelineNotes = this.pepin.VideoMode;

        // Export Current Notes in current Medias

        var Notes = this.vue.ExportNotes();
        //console.log('updating notes',Notes);

        // set Medias IDs
        var MediasIDs = {};
        var M = this.pepin.Pellicule.Medias;
        for( var i = 0 ; i < M.length ; i++ ){
          MediasIDs[M[i].Media.ID] = M[i].Media;
        }

        // clear all notes
        for( var i in MediasIDs ){
          //console.log('clearing notes',i);
          MediasIDs[i].Notes = [];
        }

        for( var i = 0 ; i < Notes.length ; i++ ){
          var note = Notes[i];

          // update note in Media object
          var id = note.MediaID;
          //console.log(id,Notes[i]);
          if( !Util.IsUndef(MediasIDs[id]) ){
            MediasIDs[id].Notes.push(note);
          }

          // update note in timeline
          if( this.pepin.VideoMode ){
            //var framePercent = note.PelliculeFrame / this.GetTotalFrames();
            var framePercent = this.pepin.Pellicule.GetPelliculeFrameWithID(note.Frame,note.MediaID) / this.GetTotalFrames();
            
            if( Util.IsUndef(this.timelineNotes[framePercent]) )
            {
              //this.timelineNotes.$set(framePercent,true);
              this.timelineNotes[framePercent] = true;
            }
          }
        }

      }.bind(this));
    },

    play: function(){
      this.stopped = false;
      return true;
    },

    videoStop: function(){
      if( this.pepin.VideoMode ){
        this.stopped = true;
      }
      return true;
    },

    zoomAuto: function(zoomAuto,widthLock){
      if( zoomAuto == 2 ){
        this.canDrag = false;
      }
      else{
        this.canDrag = this.vue.CanDrag();
      }

      this.zoomAuto = zoomAuto;
      this.widthLock = widthLock;

      if( zoomAuto == 1 ){
        this.SliderOpen();
      } else {
        this.SliderClose();
      }

      return true;
    },

    zoomVue: function(Vue_Origine,Vue_Zoom,Vue_Overview){
      var b,e;

      if( this.widthLock )
      {
        b = Vue_Overview.Min.y;
        e = Vue_Overview.Max.y;
      } else {
        b = Vue_Overview.Min.x;
        e = Vue_Overview.Max.x;
      }

      this.sliderBegin = 100.0 * Math.max(Math.min(b,0.999),0);
      this.sliderEnd = 100.0 * Math.max(Math.min(e,0.999),0);
    },

    zoomCoeffUpdated: function(NewZoomCoeff){
      this.dragDropSize = (256*NewZoomCoeff);
      
      return true;
    },

    dimensions: function(Dim){
      this.TimelineWidth = Dim.CentreL;
      this.DocumentHauteur = Dim.DocumentH;

      this.$sidebar.css({
          'height': Dim.CentreH + 'px',
          'top': Dim.CentreHaut + 'px'
      });

      return true;
    },

    pelliculeLoaded: function(i){
      this.showTimelineNotes = this.pepin.VideoMode;

      if( this.pepin.VideoMode && i == 0 )
      {
        //console.log(this.pepin.Pellicule.Cuts);

        var TotalWidth = this.pepin.Pellicule.FrameCount;
        //var j = 0;

        if( !Util.IsUndef(this.pepin.Pellicule.Cuts) )
        {
          for( var i = 0 ; i < this.pepin.Pellicule.Cuts.length ; i++ )
          {
            this.cuts.push({
              beginning: this.pepin.Pellicule.Cuts[i] / TotalWidth,
              duration: (this.pepin.Pellicule.CutsDuration[i]) / TotalWidth,
              odd: Util.Modulo(i , 2) == 1 //Modulo(i , 2) == 1 ? false: true
            });
            //j += this.pepin.Pellicule.Cuts[i+1];
          }
        }


        //console.log(this.cuts);
      }

      return true;
    },

    pellicules_update: function(){
      //console.log('loul',this.$children);
      this.cuts = [];

      if( this.pepin.VideoMode )
      {
        this.TimelineOpen();
      }
      else
      {
        this.TimelineClose();
        this.stopped = false;
      }

      return true;
    },

    frameUpdated: function(){
      // todo
      if( this.pepin.VideoMode )
      {
        this.timelineProgress = (this.pepin.GetCurrentFrame() / (this.GetTotalFrames()))*100.0;
      }

      return true;
    },

    sidebarToggle: function(){
      if( this.sidebarOpened )
      {
        this.sidebarClose();
      }
      else
      {
        this.sidebarOpen();
      }
    },

    open: function(){

      if( !this.Opened ){
          this.Opened = true;
          this.pepinResize();

          if( !this.Animating )
          {
              this.Animating = true;
              this.$('body').css('overflow','hidden');

              this.$Holder
                  .css('opacity',0)
                  .css('display','block')
                  .animate({
                      opacity: 1
                  },this.DureeAnimation,function(This){return function(){
                      This.Opened = true;
                      This.Animating = false;
                  }}(this))
              ;

              this.$Background2
                  .animate({
                      backgroundPositionY: 40,
                      backgroundPositionX: 40
                  },1000);
          }

      }

      return true;
    },

    close: function(CloseSelection){
      this.sidebarClose();

      if( this.Opened ){
          this.Opened = false;

          if( !this.Animating )
          {
              this.Animating = true;

              this.$('body').css('overflow','inherit');

              this.$Holder
                  .css('opacity',1.0)
                  .animate({
                      opacity: 0
                  },this.DureeAnimation,function(This){return function(){
                      This.Opened = false;
                      This.Animating = false;
                      This.$Holder.css('display','none')
                  }}(this))
              ;

              this.$Background2
                  .animate({
                      backgroundPositionY: 0,
                      backgroundPositionX: 0
                  });
          } 

      }

      return true;
    },
  }

}
</script>

<template>
<div class="pepin-overlay"
  v-on:mousemove="overlayMousemove"
>
  <div class="pepin-background1"></div>
  <div class="pepin-background2"></div>

    <div class="pepin-center"
     :style="{
        'height': $root.dimensions.CentreH+'px',
        'width': $root.dimensions.DocumentL+'px'
      }"
    >


<!-- , 'pepin-zoomingin': zooming > 0, 'pepin-zoomingout': zooming < 0 -->
        <div class="pepin-center2"
         :style="{
            'width': $root.dimensions.CentreL+'px',
            'left': $root.dimensions.CentreGauche+'px',
            'height': $root.dimensions.CentreH+'px',
            'top': $root.dimensions.CentreHaut+'px'
          }"
        >

            <div class="pepin-centerDrag"
               :class="{
                  'pepin-candrag': canDrag && !stopped,
                  'pepin-dragging': dragging && !stopped,
                  'pepin-stopped': stopped,
                  'pepin-cross': $root.addingNote,
                  'pepin-centerDrag-notes-editable': $root.noteEditing
                }"
               :style="{
                  'background-size': dragDropSize+'px',
                  'width': $root.dimensions.CentreL + 'px',
                  'left': 0,
                  'height': $root.dimensions.CentreH + 'px',
                  'top': 0
                }"
              v-on:mouseenter="dragMouseenter"
              v-on:mousedown="dragMousedown"
              v-on:contextmenu="dragContextMenu"
              v-on:mouseup="dragMouseup"
              v-on:mouseleave="dragMouseleave"
              v-on:dblclick="dragDblClick"
            >
            </div>

            <div class="pepin-name" v-show="$root.showMediaName">
              <span>{{ $root.DisplayName }}</span>
            </div>

            <div class="pepin-prev"
              v-on:click="mediaPrev"
            >
              <div class="PepinPred_Bouton"
                v-key="{ code : '37' , char : '&#8592;' , parent : true }"
                v-help="'$ov_pred£'"
              >
              </div>
            </div>

            <pepin-vue
              v-for="vue in vues"
              v-bind:vue-from-overlay="vue"
            >
            </pepin-vue>

            <div class="pepin-next"
             v-on:click="mediaNext"
            >
              <div class="PepinSuiv_Bouton"
                v-key="{ code : '39' , char : '&#8594;' , parent : true }"
                v-help="'$ov_next£'"
              >
              </div>
            </div>

            <div class="pepin-timeline"
              v-on:mousedown="timelineMousedown"
              v-on:mousemove="timelineMousemove"
              v-on:mouseup="timelineMouseup"
              v-on:mouseleave="timelineMouseleave"
            >
              <div class="pepin-timeline-notes"
                   v-for="framePercent in timelineNotes"
                   :style="{
                      left: $key*100.0 + '%',
                      opacity: showTimelineNotes ? '1' : '0'
                   }"
                >
              </div>
              <div class="pepin-cut"
                v-for="cut in cuts"
               :style="{
                  width: cut.duration*100+'%',
                  left: cut.beginning*100+'%',
                  opacity: cut.odd ? '1' : '0'
                }"
                >
              </div>
                <div class="pepin-progress"
               :style="{width: timelineProgress +'%'}">
                </div>
            </div>

            <div class="pepin-slider"
            >
                <div class="pepin-progress"
               :style="{
                  left: sliderBegin +'%',
                  width: (sliderEnd - sliderBegin) +'%',
                }">
                </div>
            </div>

        </div>

    </div>
  </div>
</div>
</template>

<style lang="scss">
@import '../Colors.scss';

.Pepin
{
  font-family: 'Arial';
  font-size: 16px;
  display: none;
}

.Pepin.pepin-opened
{
  display: block;
}

/* overlay.css */

.pepin-overlay
{
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 500;
    position: fixed;
    opacity: 0;
    color: $white;
    cursor: default;
    display: none;
}

.pepin-overlay > *
{
    z-index: 600;
}

.pepin-background1
{
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 550;
    position: fixed;
    background-color: $blue;
    opacity: 1.0;
}

.pepin-background2
{
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 600;
    position: fixed;
    background: url(images/overlay.png) repeat 0 0;
    /*backdrop-filter: blur(3px) grayscale(50%);*/
    opacity: 1.0;
}


.pepin-toolbar,.pepin-sidebar,.pepin-collection,.pepin-toolbar-Drop
{
    border: none;
    background-color: rgba($darkblue,0.7²5);
    height: auto;
    z-index: 700;
    color: $white;
}



.pepin-center
{
    width: 100%;
    left: 0;
    position: absolute;
    padding: 0;
}




.pepin-prev:hover,.pepin-next:hover
{
    filter: brightness(80%);
    -webkit-filter: brightness(80%);
    -moz-filter: brightness(80%);
    -o-filter: brightness(80%);
    -ms-filter: brightness(80%);
    cursor: pointer;
}

.pepin-prev:active,.pepin-next:active
{
    filter: brightness(60%);
    -webkit-filter: brightness(60%);
    -moz-filter: brightness(60%);
    -o-filter: brightness(60%);
    -ms-filter: brightness(60%);
    cursor: pointer;
}

.pepin-centerDrag
{
    position: absolute;
    z-index: 6000;
    background: none;
    display: block;
    opacity: 0.5;
    cursor: default;
}

.pepin-centerDrag-notes-editable
{
  z-index: 800;
}

.pepin-candrag
{
    /*background: url(images/dragdropbg.png) repeat center center;*/
    cursor: grab;
    /*cursor: -webkit-grab;*/
}

.pepin-dragging
{
    /*background: url(images/dragdropbg.png) repeat center center;*/
    cursor: grabbing;
    /*cursor:  -webkit-grabbing;*/
}

.pepin-centerDrag.pepin-zoomingin
{
    cursor: zoom-in;
    /*cursor: -webkit-zoom-in;*/
}

.pepin-centerDrag.pepin-zoomingout
{
    cursor: zoom-out;
    /*cursor: -webkit-zoom-out;*/
}

.pepin-centerDrag.pepin-cross
{
    cursor: crosshair;
    /*cursor: -webkit-crosshair;*/
}

.pepin-centerDrag.pepin-stopped
{
    cursor: pointer;
    opacity: 0.5;
    background: url(images/playvignette.png) center center no-repeat;
}

.pepin-centerDrag.pepin-stopped:hover
{
    opacity: 0.8;
    background: url(images/playvignettehover.png) center center no-repeat;
}


.pepin-center
{
    z-index: 700;
}


.pepin-center > div
{
    height: 100%;
    position: absolute;
    top: 0;
}


.pepin-prev,.pepin-next
{
    width: 32px;
    height: 100%;
    background-position: 4px 49%;
    background-repeat: no-repeat;
    position: absolute;
    z-index: 8000;
/*
    height: 32px;
    top: 49.1%;*/
}

.pepin-prev > div,.pepin-next > div
{
    height: 40px;
    width: 100%;
    position: absolute;
    top: calc(50% - 32px);
}

.pepin-prev
{
    left: 0;
    background-image: url(images/pred.png);
}

.pepin-next
{
    right: 0;
    background-image: url(images/suiv.png);
}

.pepin-prev:active
{
    background-position-left: 3px;
}

.pepin-next:active
{
    background-position-left: 5px;
}


/*
 * Timeline & Slider
 */

.pepin-timeline,.pepin-slider
{
    left: 0;
    width: 0%;
    position: absolute;
    background-color: $blue;
    z-index: 8000; /* above notes */
    border-right: 2px solid $darkblue;
}

.pepin-timeline
{
    height: 22px;
    bottom: 0;
    cursor: col-resize;
    border-top: 2px solid $darkblue;
}

.pepin-timeline-notes
{
  width: 8px;
  height: 8px;
  background-color: #fff;
  border-radius: 4px;
  top: 6px;
  position: absolute;
  z-index:550;
}

.pepin-progress
{
    height: 100%;
    left: 0;
    bottom: 0;
    width: 0%;
    position: relative;
    border-right: 2px solid $darkblue;
    border-left: 2px solid $darkblue;
    background-color: $gold;
    z-index:400;
    opacity: 1.0;
}

.pepin-slider
{
    height: 10px;
    top: 0;
    border-bottom: 2px solid $darkblue;
}

.pepin-name
{
  position: absolute;
  width: 100%;
  bottom: 24px;
  font-size: 1.4em;
  z-index: 800;
  font-weight: bold;
  letter-spacing: 1px;
  text-align: center;
  text-shadow:
   -1px -1px 0 $darkblue,  
    1px -1px 0 $darkblue,
   -1px  1px 0 $darkblue,
    1px  1px 0 $darkblue;
}

/* orange */
.pepin-cut
{
  height: 100%;
  background-color: $light;
  position: absolute;
  top: 0;
  z-index:450;
  opacity: 0.3;
}

/*
 * .pepin-sidebar
 */

.pepin-sidebar
{
    z-index: 700;
    width: 384px;
    left: -384px;
    position: fixed;
    border-right: 2px solid $darkblue;
    top: 0;
    overflow-y: scroll;
    opacity: 1.0;
}


.pepin-sidebar::-webkit-scrollbar-track,.pepin-scrollbar::-webkit-scrollbar-track
{
  -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
  background-color: $darkblue;
  border: 2px solid $darkblue;
  border-right: none;
}

.pepin-sidebar::-webkit-scrollbar,.pepin-scrollbar::-webkit-scrollbar
{
  width: 8px;
  background-color: rgba($darkblue,0.5);
  border: none;
}

.pepin-sidebar::-webkit-scrollbar-thumb,.pepin-scrollbar::-webkit-scrollbar-thumb
{
  background-color: $light;
  border: 2px solid $darkblue;
  border-right: none;
}




 /**
 * KEYS.css
 *
 * A simple stylesheet for rendering beautiful keyboard-style elements.
 *
 * Author:  Michael Hüneburg
 * Website: http://michaelhue.com/keyscss
 * License: MIT License (see LICENSE.txt)
 */

/* Base style, essential for every key. */
kbd, .key {
  display: inline;
  display: inline-block;
  min-width: 1em;
  padding: .6em .7em;
  font: normal .85em/1 "Lucida Grande", Lucida, Arial, sans-serif;
  text-align: center;
  text-decoration: none;
  -moz-border-radius: .3em;
  -webkit-border-radius: .3em;
  border-radius: .3em;
  border: none;
  cursor: default;
  -moz-user-select: none;
  -webkit-user-select: none;
  user-select: none;
}
kbd[title], .key[title] {
  cursor: help;
}

/* Dark style for display on light background. This is the default style. */
kbd, kbd.dark, .dark-keys kbd, .key, .key.dark, .dark-keys .key {
  background: darken($darkgold,5.0);
  /*background: -moz-linear-gradient(top, rgb(60, 60, 60), rgb(80, 80, 80));
  background: -webkit-gradient(linear, left top, left bottom, from(rgb(60, 60, 60)), to(rgb(80, 80, 80)));*/
  color: rgb(250, 250, 250);
  text-shadow: -1px -1px 0 rgb(70, 70, 70);
  -moz-box-shadow: inset 0 0 1px rgb(150, 150, 150), inset 0 -.05em .4em rgb(80, 80, 80), 0 .1em 0 rgb(30, 30, 30), 0 .1em .1em rgba(0, 0, 0, .3);
  -webkit-box-shadow: inset 0 0 1px rgb(150, 150, 150), inset 0 -.05em .4em rgb(80, 80, 80), 0 .1em 0 rgb(30, 30, 30), 0 .1em .1em rgba(0, 0, 0, .3);
  box-shadow: inset 0 0 1px rgb(150, 150, 150), inset 0 -.05em .4em rgb(80, 80, 80), 0 .1em 0 rgb(30, 30, 30), 0 .1em .1em rgba(0, 0, 0, .3);
}

/* Light style for display on dark background. */
kbd.light, .light-keys kbd, .key.light, .light-keys .key {
  background: rgb(250, 250, 250);
  background: -moz-linear-gradient(top, rgb(210, 210, 210), rgb(255, 255, 255));
  background: -webkit-gradient(linear, left top, left bottom, from(rgb(210, 210, 210)), to(rgb(255, 255, 255)));
  color:  rgb(50, 50, 50);
  text-shadow: 0 0 2px rgb(255, 255, 255);
  -moz-box-shadow: inset 0 0 1px rgb(255, 255, 255), inset 0 0 .4em rgb(200, 200, 200), 0 .1em 0 rgb(130, 130, 130), 0 .11em 0 rgba(0, 0, 0, .4), 0 .1em .11em rgba(0, 0, 0, .9);
  -webkit-box-shadow: inset 0 0 1px rgb(255, 255, 255), inset 0 0 .4em rgb(200, 200, 200), 0 .1em 0 rgb(130, 130, 130), 0 .11em 0 rgba(0, 0, 0, .4), 0 .1em .11em rgba(0, 0, 0, .9);
  box-shadow: inset 0 0 1px rgb(255, 255, 255), inset 0 0 .4em rgb(200, 200, 200), 0 .1em 0 rgb(130, 130, 130), 0 .11em 0 rgba(0, 0, 0, .4), 0 .1em .11em rgba(0, 0, 0, .9);
}

</style>
