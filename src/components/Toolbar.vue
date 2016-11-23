<script>
import Util from '../Util.js'
import Pellicule from '../Pellicule.js'
import Media from '../Media.js'
var Vue = require('vue')

export default {

  props: [
    { name : 'colors' , type : Array , default : function(){ return ['white' , 'darkgreen' , 'blue' , 'red' , 'black']} },
    { name : 'shapes' , type : Array , default : function(){ return ['none' , 'point' , 'freehand' , 'circle' , 'ellipse', 'square', 'rect' , 'delete']} },
  ],
  
  data: function () {
    return {
      name: 'toolbar',
      pepinAdd: true,
      pepified: false,
      pepinAutoBroadcast: [
        'raf'
      ],
      lookForKeys: true,

      Animating: false,
      Opened: false,
      TC_String: "00:00:00:00",
      Frames_String: "0",
      ModeVideo: false,
      VolumeState: 3,
      VolumeCoeff: 1.0,
      DureeAnimation: 500,
      HauteurMax: 48,
      ZoomAuto: true,
      ZoomStateInit: 2,
      ZoomState: 2,
      zoomString: '',
      volumeString: '',
      pbrString: '',
      FrameModeTC: false,
      framesTcFocus: false,

      DropdownAnimationDuration: 100,
    }
  },

  computed: {
  },

  ready: function(){
  },

  methods: {

    // ready after jQuery dependency
    pepinReady: function(){

      this.$Holder = this.$(this.$el);

      this.$('.Volume3',this.$Holder).mousewheel(this.volumeWheel.bind(this));
      this.$('.Vitesse',this.$Holder).mousewheel(this.pbrWheel.bind(this));
      this.$('.Zoom',this.$Holder).mousewheel(this.zoomWheel.bind(this));
      //this.$('.FramesTC',this.$Holder).mousewheel(this.framesWheel.bind(this));

      this.$FramesTC_Input = 
          this.$('.FramesTC input',this.$Holder)
              .mousewheel(this.framesWheel.bind(this))
      ;

      this.pepin.noteColor = this.colors[0];
    },

    SetDropdown: function(){
      Vue.nextTick(function(){

        var $ = this.$;

        this.$('.Dropdown',this.$Holder)
          .data('This',this)
          .each(function(){
            var Drop = $($('.Drop2',this).get(0));

            Drop.parent().show();
            Drop.data('This',$(this).data('This'))

            //console.log('height',Drop.height());

            $(this)
                .data('Hauteur',Drop.height())
                .data('This',$(this).data('This'))
                .data('Elem',Drop)
                .mouseenter(function(){

                  //console.log($(this).data('Hauteur'));

                    $(this)
                        .data('Elem')
                        .stop()
                        .animate({
                            height: $(this).data('Hauteur')
                        },$(this).data('This').DropdownAnimationDuration)
                    ;
                })
                .mouseleave(function(){
                    $(this)
                        .data('Elem')
                        .stop()
                        .animate({
                            height: 0
                        },$(this).data('This').DropdownAnimationDuration)
                    ;
                })
            ;
  
            Drop
                .css('height',0)
                .css('opacity',1.0)
            ;

        });

      }.bind(this));
    },

    visuNoteToggle: function(){
      this.pepinEvt('visuNoteToggle');
    },

    editNoteToggle: function(){
      this.pepinEvt('editNoteToggle');
    },


    volume_dispatch: function(){
        this.pepin.volume_set( this.VolumeCoeff );
    },

    playPause: function(){
      if( this.ModeVideo ){
          this.pepinEvt('playPause');
      }
    },

    scrubNext: function(){
      if( this.ModeVideo ){
        this.pepinEvt('scrub',1);
      }
    },

    scrubPrev: function(){
      if( this.ModeVideo ){
        this.pepinEvt('scrub',-1);
      }
    },
    
    pbrOriginal: function(){
      if( this.ModeVideo ){
        this.pepin.pbrPower_set( 0 );
      }
    },

    pbrWheel: function(event){
      this.pepinEvt('speed' + (event.deltaY > 0 ? 'Up': 'Down'));
    },

    zoomAutoClick: function(event){
      this.pepinEvt('zoomAutoToggle');
    },

    zoomClick: function(event){
      this.pepinEvt('zoomAutoDisable');
      this.ZoomState++;

      if( this.ZoomState >= 3 )
      {
          this.ZoomState = 0;
      }
      this.pepinEvt('updateZoom',this.zoomStateCoeff());
    },

    switchFrameMode: function(){
      this.FrameModeTC = !this.FrameModeTC;
    },

    volumeClick: function(event){

      this.VolumeState++;

      if( this.VolumeState >= 4)
      {
        this.VolumeState = 0;
      }

      this.VolumeCoeff = this.VolumeState * 1.0 / 3.0;

      this.volume_dispatch();
    },

    volumeWheel: function(event){
      this.VolumeCoeff += event.deltaY / 100.0 * 9.0;
      this.VolumeCoeff = Math.min(Math.max(this.VolumeCoeff,0.0),1.0);

      this.VolumeState = Math.round(this.VolumeCoeff * 3.0);

      this.volume_dispatch();
    },

    zoomWheel: function(event){
      this.pepinEvt('zoomWheel',event);
    },

    export: function(event){
      this.pepinEvt('export');
    },

    fullscreen: function(event){
      this.pepinEvt('fullscreenRequestToggle');
    },

    help: function(event){
      this.pepinEvt('helpToggle');
    },

    close: function(event){
      this.pepinEvt('close');
    },

    pepinResize: function(){
      this.pepinEvt('resize');
    },

    sidebarToggle: function(){
      this.pepinEvt('sidebarToggle');
    },

    videoLoop: function(){
      this.pepinEvt('videoLoop');
    },
                    
    zoomStateCoeff: function(){
        var x;

        switch( this.ZoomState )
        {
            case 1:
                x = 2.0;
                break;
            case 2:
                x = 0.5;
                break;
            default:
            case 0:
                x = 1.0;
                break;
        }

        return x;
    },

    FramesTC_Update: function(frame){
      if( !this.framesTcFocus )
      {
        if( !Util.IsUndefOrNan(frame) )
        {
          this.Frames_String = frame;
        }

        if( this.FrameModeTC && this.pepin.Pellicule )
        {
          this.TC_String = this.pepin.Pellicule.TCS.FramesToTC(this.Frames_String).String;
        }
        else
        {
          this.TC_String = "00:00:00:00";
          //this.TC_String = this.Pellicule.TCS.;
        }

        var val = this.FrameModeTC ? this.TC_String : this.Frames_String;

        if( val != this.$FramesTC_Input.val() )
        {
          //console.log('input framestc',val,this.$FramesTC_Input.val())
          this.$FramesTC_Input.val(val);
        }
        
      }
    },

    framesWheel: function(event){
        /*var $target = this.$(event.target);

        var f = Util.toInt($target.val());
        $target.val(f+event.deltaY).trigger('input');
*/
      this.pepinEvt('scrub',event.deltaY)
    },

    framesChange: function(event){
      //console.log(event);
      this.FramesTC_AskUpdate();
    },

    framesFocus: function(){
      this.framesTcFocus = true;
    },

    framesBlur: function(){
      this.framesTcFocus = false;
    },

    framesGoto: function(){
      this.framesTcFocus = false;
    },

    FramesTC_AskUpdate: function(event){
        //console.log('asking ' + this.$Frames_Input.val());
        var val = this.$FramesTC_Input.val();

        if( this.FrameModeTC && this.pepin.Pellicule )
        {
          var TC = this.pepin.Pellicule.TCS.StringToTC(val);
          //console.log(TC.String,val);
          val = this.pepin.Pellicule.TCS.TCToFrames(TC);
        }
        else
        {
          val = parseInt(val,10);
        }

        this.pepinEvt('scrubTo',val);

    },

    dimensionLockClick: function(){
      this.pepinEvt('dimensionLockToggle');
    },

    colorClick: function(){
      var i = 0;
      var s = this.pepin.noteColor;
      var l = this.colors.length;
      while( s != this.colors[i] && i < l )
      {
        i++;
      }

      if( s == this.colors[i] )
      {
        this.pepinEvt('changeNoteColor',this.colors[Util.Modulo(i+1,l)]);
      }
      
      //console.log('lol! ',i,l);
    },

    changeNoteColor: function(color){
      this.pepinEvt('changeNoteColor',color);
    },

    changeNoteType: function(type){
      this.pepinEvt('changeNoteType',type);
    },

  },

  events: {

    pbr_update: function(){
      var Pre = '';

      if( this.pepin.pbrPower < 0 )
      {
          Pre = '÷' + Util.formaterVitesse(1.0 / this.pepin.pbr);
      }
      else if(this.pepin.pbrPower > 0 )
      {
          Pre = '×' + Util.formaterVitesse(this.pepin.pbr);
      }
      else
      {
          Pre = '≡1';
      }

      this.pbrString = Pre + ' , '
        + Util.formaterFPS(
            this.pepin.pbr *
            this.pepin.Pellicule.FramesPerSeconds
        );
    },

    pellicules_update: function(){
      if( this.pepin.Pellicule.Type == Pellicule.prototype.PELLICULE_TYPE.PELLICULE_IMAGE )
      {
          this.ModeVideo = false;
          
          this.$('.Video',this.$Holder)
            .addClass('PepinOutils_Desactiver');
              
          this.$('.Video',this.$Holder).slideUp(400);
      }
      else
      {
          this.ModeVideo = true;
          this.$('.Video',this.$Holder)
            .removeClass('PepinOutils_Desactiver' );
              
          this.$('.Video',this.$Holder).slideDown(400);
      }
    },

    pelliculesLoaded: function(){
    },

    frameUpdated: function(){
      //console.log('frameupdated',this.pepin.GetCurrentFrame());
      this.FramesTC_Update(this.pepin.GetCurrentFrame());
    },


    zoomAutoEnable: function(){
      this.ZoomState = this.ZoomStateInit;
    },
    zoomAutoDisable: function(){
    },


    zoomCoeffUpdated: function(NewZoomCoeff){
      //console.log(NewZoomCoeff);
      this.zoomString = Util.toInt( (NewZoomCoeff*100).toFixed(0) ) + "%";
    },

    volume_update: function(){
      this.volumeString = Math.round(  this.pepin.volume * 100.0 )+'%';
    },


    changeNoteColor: function(NewNoteColor){
      this.noteColor = NewNoteColor;
      //console.log(this.noteColor);
    },

    open: function(){

      if( !this.Animating && !this.Opened )
      {
        this.Animating = true;
        this.$Holder
          .css('display','block')
          .animate({
            top: 0
          },{
            duration: this.DureeAnimation,
            step: this.pepinResize.bind(this),
            specialEasing: "easein",
            complete: function(){
              this.Opened = true;
              this.Animating = false;
            }.bind(this)
        });
      }

      if( !this.pepin.OpenedFirstTime )
      {
        this.SetDropdown();
      }

    },

    close: function(){

      if( !this.Animating && this.Opened )
      {
        this.Animating = true;
        this.$Holder
          .animate({
            top: -this.HauteurMax
          },{
            duration: this.DureeAnimation,
            step: this.pepinResize.bind(this),
            specialEasing: "easein",
            complete: function(){
              this.$Holder.css('display','none');
              this.Opened = false;
              this.Animating = false;
            }.bind(this)
        });
      }

    },


  }
}
</script>

<template>



<div class="component">
  <table><tr>
    <!--
        A Gauche
    -->
<td class="componentTd">
    <div class="Gauche Logo Icone"
      v-if="!$root.hideLogo"
      v-help="'$tb_logo£'"
    >
        <div class="Interieur">
        </div>
    </div>

    <div class="Nom Icone Gauche"
      v-on:click="sidebarToggle"
      :class="{'Selectionne': $root.sidebar}"
      v-help="'$tb_info£'"
      v-key="'S'"
    >
      <div class="Interieur">
      </div>
    </div>
    <!--
    <div class="Comparaison Desactiver Icone Gauche Dropdown" v-help="Modes de comparaisons">
        <div class="Interieur">
        </div>
        
        <div class="Drop"><div class="Drop2"><div>
            <div class="DropElem Comparaison_AB" v-help="Comparaison A OU B">Switch</div>
            <div class="DropElem Comparaison_Reglette" v-help="Comparaison A % B">Roue</div>
            <div class="DropElem Comparaison_Side" v-help="Comparaison A ET B">Side by Side</div>
        </div></div></div>

    </div>

-->

    <div class="ZoomAutoFull Icone Gauche"
      :class="{
        'ZoomAutoFull': $root.zoomLockState == 2,
        'ZoomAuto': $root.zoomLockState != 2,
        'Selectionne' : $root.zoomLockState == 2
      }"
      v-on:click="zoomAutoClick"
      v-help="'$tb_lock2£'"
      v-key="'K'"
    >
        <div class="Interieur">
        </div>
    </div>

    
    <div class="DimensionLock WidthLock Icone Gauche"
     :class="{
        'WidthLock_Enabled': $root.widthLock && $root.zoomLockState == 1, 'WidthLock': $root.widthLock,
        'HeightLock_Enabled': !$root.widthLock && $root.zoomLockState == 1, 'HeightLock': !$root.widthLock,
        'Selectionne' : $root.zoomLockState == 1
      }"
      v-on:click="dimensionLockClick"
      v-help="'$tb_lock1£'"
      v-key="'L'"
    >
        <div class="Interieur">
        </div>
    </div>


    <div class="Zoom Gauche Pourcentage"
      v-on:click="zoomClick"
      v-help="'$tb_zoom£'"
      v-key="'Z'"
    >
        <div class="Interieur">
        </div>
          <div class="Texte"><span>{{zoomString}}</span></div>
    </div>

</td>
<td class="componentTd center">

    <div class="Visu Icone Gauche"
      :class="{'Selectionne': $root.noteViewing}"
      v-on:click="visuNoteToggle"
      v-help="'$tb_noteViewing('+$root.noteEditingPermission+')£'"
      v-key="'N'"
    >
        <div class="Interieur">
        </div>
    </div>

    <div class="EditingNote Icone Gauche"
      :class="{'Selectionne': $root.noteEditing && $root.noteEditingPermission}"
      v-on:click="editNoteToggle"
      v-help="'$tb_noteEditing('+$root.noteEditingPermission+')£'"
      v-key="'E'"
      v-show="$root.noteEditingPermission"
    >
        <div class="Interieur">
        </div>
    </div>



    <div class="Icone Gauche Couleur Dropdown"
      v-show="$root.noteEditingPermission"
    >
        <div class="Interieur"
        >
          <div class="Carre2 Blanc"
             :style="{
                'background-color': $root.noteColor
              }"
            v-help="'$tb_noteColor£'"
            v-on:click="colorClick"
            v-key="{ code : 222 , char : '²' }"
          ></div>
        </div>

        <div class="Drop"><div class="Drop2"><div>
            <div v-for="color in colors" class="DropElem"
              v-on:click="changeNoteColor(color)"
            >
                <div class="Carre"
                 :style="{
                    'background-color': color
                  }"
                >
                  
                </div>
            </div>
        </div></div></div>
    </div>

    <div class="Icone Gauche"
      v-for="(index,shape) in shapes"
      :class="[$root.noteType == shape ? 'Selectionne' : '','shape-' + shape]"
      v-on:click="changeNoteType(shape)"
      v-help:="'$tb_note_'+shape+'£'"
      v-key="{ code : 49+index , char : ''+(1+index)+'' }"
      v-show="$root.noteEditingPermission"
    >
      <div class="Interieur">
      </div>
    </div>

</td>
<td class="componentTd center">


    <div class="Volume3 Droite Video Pourcentage"
     :class="{PepinOutils_Volume0: this.VolumeState == 0,PepinOutils_Volume1: this.VolumeState == 1,PepinOutils_Volume2: this.VolumeState == 2,PepinOutils_Volume3: this.VolumeState == 3}"
      v-on:click="volumeClick"
      v-key="'M'"
      v-help="'$tb_volume£'"
    >
        <div class="Interieur">
        </div>

          <div class="Texte"><span>{{volumeString}}</span></div>
        <!--
        <div class="Drop"><div class="Drop2"><div>
            Slider Volume
        </div></div></div>-->
    </div>

    <div class="Vitesse Droite Video"
      v-on:click="pbrOriginal"
      v-help="{ message : '$tb_speed£' , keys : ['&#8593;','&#8595;'] }"
      v-key="'R'"
    >
        <div class="Interieur">
        </div>
          <div class="Texte"><span>{{pbrString}}</span><small>FPS</small></div>
<!--
        <div class="Drop"><div class="Drop2"><div>
            Slider Vitesse
        </div></div></div>-->
    </div>

    <div class="FramesTC Droite Video"
      v-help="'$tb_timecode£'"
     :class="{ 'Frames': !this.FrameModeTC , 'Timecode': this.FrameModeTC }"
    >
        <div class="Interieur"
          v-on:click="switchFrameMode"
        >
        </div>

          <div class="Texte">
              <input type="text" value="00:00:00:00" size="13"
              v-on:focus="framesFocus"
              v-on:blur="framesBlur"
              v-on:input="framesChange"
              v-on:click="framesGoto" />
          </div>
        
    </div>

    <div
      class="VideoLoop Icone Droite Video"
      v-help="'$tb_loop£'"
      v-key="'B'"
      v-on:click="videoLoop"
      :class="{
        'Selectionne' : this.$root.videoLoop
      }"
    >
        <div class="Interieur">
        </div>
        
    </div>

    <div
      class="ImageSuiv Icone Droite Video"
      v-help="'$tb_next£'"
      v-key="{ code : '190' , char: ';' , key: ';' }"
      v-on:click="scrubNext"
    >
        <div class="Interieur">
        </div>
        
    </div>

    <div class="ImagePred Icone Droite Video"
      v-on:click="scrubPrev"
      v-help="'$tb_pred£'"
      v-key="{ code : '188' , char: ',' , key: ',' }"
    >
        <div class="Interieur">
        </div>
        
    </div>

    <div class="PlayPause Icone Droite Video"
      :class="{
        'Pause': !this.$root.playing,
        'Play': this.$root.playing,
        'Selectionne' : this.$root.playing
      }"
        v-on:click="playPause"
        v-help="'$tb_playpause£'"
        v-key="{ code : '32' , char: '$space£' }"
      >
        <div class="Interieur" >
        </div>
        
    </div>

</td>
<td class="componentTd">
    <!--
        A Droite
    -->

    <div class="Quitter Icone Droite"
      v-on:click="close"
      v-help="'$tb_exit£'"
      v-key="'Q'"
    >
        <div class="Interieur">
        </div>
    </div>

    <div class="Aide Icone Droite"
      v-on:click="help"
      :class="[$root.enableHelp ? 'Selectionne' : '' ]"
      v-help="'$tb_help£'"
      v-show="$root.hasHelp"
      v-key="'H'"
    >
        <div class="Interieur">
        </div>
    </div>

    <div class="Fullscreen Icone Droite"
      :class="[$root.fullscreen ? 'Selectionne' : '' ]"
      v-on:click="fullscreen"
      v-help="'$tb_fullscreen£'"
      v-key="'F'"
    >
        <div class="Interieur">
        </div>
    </div>

    <div class="Exporter Icone Droite"
      v-on:click="export"
      v-help="'$tb_download£'"
      v-key="'D'"
    >
        <div class="Interieur">
        </div>
    </div>

  </tr></table>

</div>

</template>

<style scoped lang="scss">
@import '../Colors.scss';

/*
 * Component
 */

.component
{
    width: 100%;
    left: 0;
    position: absolute;
    padding: 0;
    height: 48px;
    z-index: 750;
    top: -48px;
    position: fixed;
    display: none;
    border-bottom: 2px solid $darkblue;
    background-color: rgba($darkblue,0.5);
    color: #fff;
}

.componentTd > div
{
    height: 49px;
    width: auto;
    font-size: 16px;
    padding: 0 8px 0 0;
    margin: 0;
    border: 0;
    position: relative;
    background-size: 28px 28px;
    background-position: 6px 10px;
    background-repeat: no-repeat;
}

.componentTd > div.Gauche
{
    float: left;
}

.componentTd >div.Droite
{
    float: right;
}

.componentTd > div.Icone
{
    width: 40px;
    padding-right: 0;
}


.Interieur
{
    width: 40px;
    height: 48px;
    margin: 0;
    left: 0;
    top: 0;
    position: absolute;
    margin: 0;
}

.Texte
{
    margin: 14px 8px 14px 40px;
}

.Texte span
{
    font-size: 18px;
}


.Texte input
{
    font-size: 15px;
    letter-spacing: 2px;
    font-family: "Lucida Console",monospace;
    border: none;
    outline: none;
    text-align: right;
    color: #fff;
    background-color: rgba($blue,0.0);
}

.Video
{
}

.Video .Interieur
{
  top: 0;
}

.video-transition
{
  transition: all 0.5s ease;
  opacity: 1.0;
  top: 20px;
}

.video-enter,.video-leave
{
  opacity: 0.0;
  top: -48px;
}

/*
 * Hover & active
 */

.componentTd > div:hover
{
  filter: brightness(80%);
  -webkit-filter: brightness(80%);
  -moz-filter: brightness(80%);
  -o-filter: brightness(80%);
  -ms-filter: brightness(80%);
  cursor: pointer;
  background-color: rgba($blue,1.0);
}

.componentTd > div:active
{
  filter: brightness(60%);
  -webkit-filter: brightness(60%);
  -moz-filter: brightness(60%);
  -o-filter: brightness(60%);
  -ms-filter: brightness(60%);
  cursor: pointer;
  background-color: rgba($blue,0.5);
  background-position: 7px 11px;
}


/*
 * Dropdown
 */

.Dropdown
{
    position: relative;
}

.Drop
{
    position: absolute;
    z-index: 550;
    top: 49px;
    left: -2px;
    margin: 0;
    padding: 0;
    border: 2px solid #001;
    border-top: none;
    background-color: rgba($blue,1.0);
    display: block;
}


.Drop2
{
    overflow: hidden;
    display: block;
    padding: 0;
}

.Drop2 > div
{
    padding: 8px;
}

.DropElem
{
    width: auto;
    padding: 4px 8px;
    font-size: 18px;
}

.DropElem:hover
{
    text-decoration: underline;
}

.componentTd > div.Dropdown .DropElem:active
{
    filter: brightness(25%);
    -webkit-filter: brightness(25%);
    -moz-filter: brightness(25%);
    -o-filter: brightness(25%);
    -ms-filter: brightness(25%);
}


/*
.Texte:hover input
{
    background-color: rgba(255,255,255,1.0);
    color: rgba(32,32,48,1.0);
}
*/

/*
 * Specific properties
 */

.Vitesse .Texte
{
    width: 118px;
    text-align: center;
}


.Logo
{
    width: 127px !important;
}

.Logo > div.Interieur
{
    position: absolute;
    width: 127px !important;
    z-index: 80000;
    background-position: 0 0 !important;
    background-size: 127px 48px !important;
}


.FramesTC input
{
    width: 90px;
    letter-spacing: -1px;
}

.Pourcentage div.Texte
{
    text-align: right;
    width: 49px;
}












.component table
{
  width: 100%;
  height: 51px;
  padding: 0;
  margin: -3px 0 0 0;
  border-collapse: collapse;
}

.component table tr
{
  height: 48px;
  padding: 0;
  margin: 0;
}

.component table tr td
{
  height: 48px;
  padding: 0;
  margin: 0;
}

.component table td.center
{
  text-align: center;
}



/*
 * Color Drop
 */

.Couleur .Drop
{
    width: 38px;
}

.Couleur.Dropdown .DropElem
{
  position: relative;
  padding: 8px 8px 8px 32px;
  height: 24px;

  padding: 4px 4px 4px 0;
}

.Couleur.Dropdown .DropElem span
{
}


.Couleur .Carre
{
  width: 18px;
  height: 18px;
  padding: 0;
  border: 2px solid rgba($light,0.5);
  position: absolute;
  top: 8px;
  left: 0;

  top: 4px;
}


.Couleur .Carre2
{
  width: 18px;
  height: 18px;
  margin: 14px auto;
  padding: 0;
  border: 2px solid rgba($light,0.5);
}

.Icone.Selectionne
{
    filter: invert(100%);
    -webkit-filter: invert(100%);
    -moz-filter: invert(100%);
    -o-filter: invert(100%);
    -ms-filter: invert(100%);
    background-color: invert($gold);
}

.Icone.Selectionne:hover
{
    filter: invert(100%);
    -webkit-filter: invert(100%);
    -moz-filter: invert(100%);
    -o-filter: invert(100%);
    -ms-filter: invert(100%);
    background-color: rgba(invert($gold),0.8);
}

/*
 * Shape
 */

.shape-drawing
{
  width: 32px;
  height: 32px;
  position: absolute;
  top: 8px;
}

.shape-drawing2
{
  width: 32px;
  height: 32px;
  margin: 8px auto;
  padding: 0;
}

.Forme .Drop
{
    width: 48px;
}

.Forme.Dropdown .DropElem
{
  position: relative;
  height: 24px;
  padding: 8px 8px 8px 0;
}


/*
 * Images
 */


.Nom         { background-image: url(images/toolbar/info.png); }
.Comparaison { background-image: url(images/toolbar/ab.png); }
.Vitesse     { background-image: url(images/toolbar/speed.png); }
.Play        { background-image: url(images/toolbar/pause.png); }
.Pause       { background-image: url(images/toolbar/play.png); }
.ImagePred   { background-image: url(images/toolbar/imagepred.png); }
.Timecode    { background-image: url(images/toolbar/timecode.png); }
.Frames      { background-image: url(images/toolbar/frames.png); }
.ImageSuiv   { background-image: url(images/toolbar/imagesuiv.png); }
.Zoom        { background-image: url(images/toolbar/zoom.png); }
.Exporter    { background-image: url(images/toolbar/download.png); }
.Lien        { background-image: url(images/toolbar/link.png); }
.Quitter     { background-image: url(images/toolbar/close.png); }
.ZoomAuto    { background-image: url(images/toolbar/zoomauto.png); }
.ZoomAutoFull{ background-image: url(images/toolbar/zoomautofull.png); }
.Aide        { background-image: url(images/toolbar/aide.png); }
.Fullscreen  { background-image: url(images/toolbar/fullscreen.png); }
.VideoLoop  { background-image: url(images/toolbar/videoloop.png); }



.WidthLock  { background-image: url(images/toolbar/widthlock.png); }
.WidthLock_Enabled  { background-image: url(images/toolbar/widthlock_enabled.png); }

.HeightLock  { background-image: url(images/toolbar/heightlock.png); }
.HeightLock_Enabled  { background-image: url(images/toolbar/heightlock_enabled.png); }

.Visu        { background-image: url(images/toolbar/visu.png); }

.EditingNote        { background-image: url(images/toolbar/editing_notes.png); }

.Volume0     { background-image: url(images/toolbar/volume0.png); }
.Volume1     { background-image: url(images/toolbar/volume1.png); }
.Volume2     { background-image: url(images/toolbar/volume2.png); }
.Volume3     { background-image: url(images/toolbar/volume3.png); }

.shape-none { background-image: url(images/toolbar/shapenone.png); }
.shape-point { background-image: url(images/toolbar/point.png); }
.shape-circle { background-image: url(images/toolbar/circle.png); }
.shape-rect { background-image: url(images/toolbar/rectangle.png); }
.shape-square { background-image: url(images/toolbar/square.png); }
.shape-ellipse { background-image: url(images/toolbar/ellipse.png); }
.shape-freehand { background-image: url(images/toolbar/freehand.png); }
.shape-delete { background-image: url(images/toolbar/deletenote.png); }

.Logo > div.Interieur
{
    background-image: url(images/PepinLogo.png);
}

</style>
