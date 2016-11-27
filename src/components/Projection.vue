<script>
/*
 * Pepin Media Player - Antoine Dornstetter
 * 
 *   src/components/Projection.vue
 *     - Pellicule playing (video gapless playlist)
 *
 *
 *   todo:
 */
import Util from '../Util.js'
import Pellicule from '../Pellicule.js'
import Media from '../Media.js'

export default {

  props: ['projectionFromVue'],

  data: function () {
    return {
      name: 'projection',
      pepinAdd: false,
      pepified: false,
      lookForKeys: false,

      Frame: 0,
      HasPellicule: false,
      Playing: false,
      VideoMode: false,
      Loaded: false,
      Stopped: false,
      VideoFrame: 0,
      VideoIndex: 0,
      NextStop: false,
      NextCut: false,
      UpdateFrame_Interval: null,
      UseCanvas: false,
      bgUrl: '',

    }
  },

  ready: function(){
    this.Pellicule = this.projectionFromVue.Pellicule;
    this.HasPellicule = true;
    this.Loaded = this.Pellicule.Loaded;

    //console.log(this.Pellicule);

    this.pepin = this.projectionFromVue.pepin;

    this.IsMaster = this.projectionFromVue.IsMaster;
    this.ID = this.projectionFromVue.ID;

    this.pepin.pepinPepify(this.pepin,this);
    //console.log('pepified!');
  },

  methods: {

    GetVideosReady: function(){
      if( !this.pepified ) { console.log(this); return; }



      for( var i = 0 ; i < this.Videos.length ; i++ )
      {
        if( i != this.VideoIndex || this.Stopped )
        {
          this.$Videos[i].hide();

          //console.log(i);
          //this.Videos[i].play();

          if( i > this.VideoIndex || this.Stopped ){
            this.Videos[i].currentTime = this.Pellicule.GetVideoIn(i);
          }

          //console.log('hiding & pausing',i,this.Pellicule.GetVideoIn(i));
          this.Videos[i].pause();

/*
          this.Videos[i].play().then(function(This,i){ return function(){
            This.Videos[i].currentTime = This.Pellicule.GetVideoIn(i);
            This.Videos[i].pause();
            //console.log(This.Videos[i].currentTime);

          }}(this,i),function(){

          });
*/
        }
      }

      this.$Videos[this.VideoIndex].show();
    },

    ComputeFrameInfos: function(){
      this.VideoFrame = this.GetVideoFrame();
      this.Frame = this.GetFrame();

      // VideoIndex géré par le UpdateFrame
      //this.VideoIndex = this.Pellicule.GetVideoIndex( this.Frame );
    },

    ComputeFrameInfosFromFrame: function(NewFrame){
      this.Frame = NewFrame;
      //console.log(this.Pellicule);
      this.VideoIndex = this.Pellicule.GetVideoIndex( this.Frame );
      this.VideoFrame = this.Pellicule.GetVideoFrame( this.Frame , this.VideoIndex );
    },

    GetVideoFrame: function(){
        if( this.VideoIndex >= this.VideoCount )
        {
            return -1;
        }

        //console.log(this.Videos[ this.VideoIndex ].currentTime);
        //console.log(Util.Positive( this.Videos[ this.VideoIndex ].currentTime));
        /*var Y = Util.Positive( this.Videos[ this.VideoIndex ].currentTime );
        var R = this.Pellicule.TCS.SecondsToFrames(Y);
        console.log(Y,this.Pellicule.TCS.Options.FramesPerSeconds*Y,R,this.Pellicule.TCS.FramesRound(R));
        */
        return this.Pellicule.TCS.FramesRound(
          this.Pellicule.TCS.SecondsToFrames(
              Util.Positive( this.Videos[ this.VideoIndex ].currentTime )
            )
        );
    },

    GetFrame: function(){
        if( this.VideoIndex >= this.VideoCount )
        {
            return -1;
        }

        return this.Pellicule.GetPelliculeFrame( this.VideoFrame , this.VideoIndex );
    },

    GetCurrentFrame: function(){
        if( this.VideoMode )
        {
            return this.Frame;
        }
        else
        {
            //return -2;
            return this.Frame;
        }
    },

    Set_Rafraichissement: function(DT){
        if( this.Playing && this.HasPellicule )
        {
            this.Stop_UpdateFrame_Interval();
        }

        this.UpdateFrame_Interval_Rafraichissement = DT / 2.0;

        if( this.Playing && this.HasPellicule )
        {
            this.Set_UpdateFrame_Interval();
        }
    },

    Set_UpdateFrame_Interval: function(){
        if( this.VideoMode )
        {
            if( this.UpdateFrame_Interval != null )
            {
                this.UpdateFrame_Stop = false;
                //console.log('impossible de relancer updateframe...');
            }
            else
            {
              /*
                this.UpdateFrame_Interval = setInterval( function(){
                  this.$emit('updateFrame');
                }.bind(this), this.UpdateFrame_Interval_Rafraichissement );*/
            }
        }
    },

    Stop_UpdateFrame_Interval: function(){
      this.UpdateFrame_Stop = true;

      // La dernière frame s'affiche après avoir mis en pause
      window.setTimeout(function(){

          if( this.UpdateFrame_Stop )
          {
              //console.log('stoooping');
              this.$emit('updateFrame');
              //this.Do_UpdateFrame();
              clearInterval(this.UpdateFrame_Interval);
              this.UpdateFrame_Interval = null;
          }

      }.bind(this),200); // arbitraire
    },

    pepinReady: function(){

      this.$Holder = this.$(this.$el);


      // next line might be necessary..
      //this.$Holder.ready(function(){

        this.$VideosHolder =
          this.$('.Pepin_VideosHolder',this.$Holder)
        ;
        //console.log('ahah!',this.$VideosHolder);

      //}.bind(this));

      this.Pellicule.Do_Load(function(){
        //this.$parent.$emit( 'pelliculeLoaded' , this.ID );
        //console.log('lol',this.pepinEvt);
        this.pepinEvt( 'pelliculeLoaded' , this.ID );
      }.bind(this));
    },
  },

  events: {

    raf: function(){
      //console.log("projection raf");
      this.$emit('updateFrame');
      return true;
    },

    play: function(){
      if( !this.VideoMode ){ return; }

      if( this.Loaded )
      {
        this.Playing = true;
        this.Stopped = false;

        this.Set_UpdateFrame_Interval();
        //console.log(this.VideoIndex);

        this.Videos[ this.VideoIndex ].play();
        //console.log('go',this.VideoIndex,this.Videos[ this.VideoIndex ]);
      }
    },
    pause: function(){
      //console.log('pause asked');

      if( !this.VideoMode ){ return; }

      if( this.Loaded )
      {
        this.Videos[ this.VideoIndex ].pause();
        this.Playing = false;
        //console.log('pause');
        this.Stop_UpdateFrame_Interval();
      }
    },

    videoStop: function(){
      if( !this.pepified ) { return; }

      //console.log('videoStop video frame 0',this.Playing);
      this.Stopped = true;
      //console.log(this.pepinEvt,this.ID);
      this.pepinEvt('pause');
      this.Playing = false;
      this.VideoIndex = 0;
      this.Frame = 0;
      this.VideoFrame = 0;
      this.GetVideosReady();
    },


    scrub: function(NewRelativeFrame){
      //console.log('proj scrub ',NewRelativeFrame,this.GetCurrentFrame(),this.GetCurrentFrame()+NewRelativeFrame);

      if( this.IsMaster )
      {
        this.pepinEvt( 'scrubTo' , this.GetCurrentFrame() + NewRelativeFrame );
      }

      return false;
    },
    
    scrubTo: function(NewFrame){

      //console.log('scrub to ' + NewFrame);

      if( !this.VideoMode ){ return; }

      if( NewFrame < 0 )
      {
        NewFrame = 0;
      }

      this.ComputeFrameInfosFromFrame(NewFrame);

      var s = this.Pellicule.TCS.FramesToSeconds(this.VideoFrame);
      //console.log(s + ' , ' + this.VideoIndex);
      this.Videos[this.VideoIndex].currentTime = s;
      //console.log(this.Pellicule.TCS.FramesToSeconds(this.VideoFrame));

      this.GetVideosReady();

      if( this.Playing && this.Videos[this.VideoIndex].paused )
      {
        //console.log('continue playing!');
        this.Videos[this.VideoIndex].play();
      }

      //console.log('new frame is ',this.Frame,NewFrame);
      this.pepinEvt('frameUpdated',NewFrame);
      //this.Ask_FrameUpdated();
    },


    pelliculeLoaded: function(i){
      //console.log(this.Pellicule);
      //console.log(this.Pellicule.OriginalWidth,this.Pellicule.OriginalHeight);
      //console.log('pelliculeLoaded',this.Pellicule.DisplayName);

      // todo: clean pellicules loading
      if( i != this.ID ){ return; }

      //console.log('Projection Pellicule:',this.Pellicule.DisplayName);

      this.CurrentDuration = this.Pellicule.GetCurrentDuration( 0 );
      this.Loaded = true;
      this.HasPellicule = true;

      this.VideoMode = this.Pellicule.VideoMode;

      if( this.Pellicule.Type == Media.prototype.MEDIA_TYPE.MEDIA_VIDEO )
      {
          this.VideoCount = this.Pellicule.VideoCount;

          this.$Videos = [];
          for( var i = 0 ; i < this.VideoCount ; i++ )
          {
              this.$Videos.push(
                this.$(this.Pellicule.Videos[i].Media.Element[0])
                  .css({

                    display  :'none',
                    'z-index':i ,
                    width: '100%',
                    height: '100%',
                    top:'0',
                    left:'0',
                    position: 'absolute'
                  })
              );
          }


          this.Videos = [];
          this.$VideosHolder.empty();
          for( var i = 0 ; i < this.VideoCount ; i++ )
          {
              this.$VideosHolder.append( this.$Videos[i] );

              this.Videos.push(this.$Videos[i][0]);
              //this.Videos[i].volume = 0;
          }


          //this.pepinEvt('updatePbr');
          //this.pepinEvt('pbr_update');
          this.pepinEvt('videoStop');
          this.Frame = 0;
          this.VideoFrame = 0;
          this.GetVideosReady();

          // to remove
          //this.Ask_Play();
      }
      else if( this.Pellicule.Type == Media.prototype.MEDIA_TYPE.MEDIA_IMAGE)
      {
          this.Pellicule.Type = Pellicule.prototype.PELLICULE_TYPE.PELLICULE_IMAGE;
          this.VideoCount = 0;
          this.$Videos = [];

          //this.$Image = this.$(this.Pellicule.Image.Element[0]).width('100%').height('100%');

          //console.log(this.Pellicule.Image.ImgCanvas);
          this.UseCanvas = this.Pellicule.Image.ImgCanvas && this.pepin.webkit;
          this.bgUrl = 'url("' + this.Pellicule.Image.URL + '")';
          this.Stopped = false;
      }

    },


    volume_update: function(){
      if( !this.VideoMode ){ return; }
      
      for( var i = 0 ; i < this.VideoCount ; i++ )
      {
          this.Videos[i].volume = this.pepin.volume;
      }

    },

    pbr_update: function(){
      for( var i = 0 ; i < this.VideoCount ; i++ )
      {
          this.Videos[i].playbackRate = this.pepin.pbr;
      }
      //console.log(this);
      this.Set_Rafraichissement(this.pepin.pbrDt);
    },

    updateFrame: function(){

      if( !this.VideoMode ){ return; }
      //todo: mecanisme d'attente pour le cut et le stop basé sur le framerate / DT ?!

      if( this.NextStop )
      {
        //console.log('updateframe stop');

        if( this.pepin.videoLoop )
        {
          this.$emit('videoStop');
          this.pepinEvt('play');
        }
        else
        {
          this.pepinEvt('videoStop');
        }

        //this.Ask_Stop();
        this.NextStop = false;
      }
      else if( this.NextCut )
      {
        this.NextCut = false;

        this.Videos[this.VideoIndex+1].currentTime = 0.0;

        if( this.Playing )
        {
          this.Videos[this.VideoIndex+1].play();
        }
        
        this.$Videos[this.VideoIndex+1].show();

        this.Videos[this.VideoIndex].pause();
        this.$Videos[this.VideoIndex].hide();

        this.VideoIndex++;
        //this.GetVideosReady();
      }
      else 
      {
        this.ComputeFrameInfos();

        //console.log('videframe ' + this.VideoFrame + ' , frame infos ' + this.Pellicule.GetVideoLastFrame(this.VideoIndex));
        //console.log(this.Pellicule.GetVideoLastFrame(this.VideoIndex));
        if( this.VideoFrame >= this.Pellicule.GetVideoLastFrame(this.VideoIndex) )
        {
          if( this.VideoIndex >= this.Pellicule.GetLastVideoIndex() )
          {

            if( this.Playing )
            {
              this.NextStop = true;
            }

            this.NextCut = false;
          }
          else
          {
            this.NextStop = false;
            this.NextCut = true;
            //console.log('nextcut' + this.VideoFrame + ' ' + this.Pellicule.GetVideoLastFrame(this.VideoIndex) );
          }
        }
        else  
        {

        }
      }

      window.FRAME = this.Frame;
      //console.log('frame' , this.Frame);
      this.pepinEvt('frameUpdated',this.IsMaster ? this.Frame : undefined);
      //this.Ask_FrameUpdated();
    },

  }

}
</script>

<template>
<div class="component">
    <div class="Pepin_ImageHolder">
      <img v-if="UseCanvas" class="PepinImage" :src="Pellicule.Image.URL" />
      <div v-if="!UseCanvas" class="PepinImage" :style="{'background-image': bgUrl}" ></div>
    </div>
    <div class="Pepin_VideosHolder">
    </div>
</div>
</template>

<style scoped>
@import '../Colors.scss';

.component
{
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  position: absolute;
  overflow: hidden;
}

.Pepin_ImageHolder
{
    position: absolute;
    padding: 0;
    margin: 0;
    top:0;
    left:0;
    width: 100%;
    height: 100%;
}

.Pepin_ImageHolder img
{
  position: absolute;
  top:0;
  left:0;
  width: 100%;
  height: 100%;
  z-index: 300;
}

.Pepin_VideosHolder
{
    width: 100%;
    height: 100%;
    top:0;
    left:0;
    position: absolute;
}

.Pepin_VideosHolder video
{
    width: 100%;
    height: 100%;
    top:0;
    left:0;
    position: absolute;
}

div.PepinImage,img.PepinImage
{
  position: relative;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-size: 100% 100%;
  z-index: 300;
}

</style>