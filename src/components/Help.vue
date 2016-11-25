<script>
import Util from '../Util.js'
import Lang from '../Lang.js'

var Vue = require('vue')

export default {

  data: function(){
    return {
      name: 'help',
      pepinAdd: true,
      pepified: false,
      pepinAutoBroadcast: [
      ],
      lookForKeys: false,

      message: '',
      x:0,
      y:0,
      step: 64,

      margin: 100,

      centerHeight: 0,
      centerLeft: 0,
      centerTop: 0,
      centerWidth: 600,
      enabled: false,

      tip: false
    }
  },
  
  ready: function(){
  },

  computed: {
    showCenter: function(){
      return this.enabled;
      //return this.center || this.message.length == 0;
    },

    showTip: function(){
      return this.tip && this.message.length > 0 && this.enabled;
    },
  },

  methods: {
    pepinReady: function(){
      this.$Center = this.$('.pepin-help-center',this.$Holder);
      this.$Tip = this.$('.pepin-help-tip',this.$Holder);

      this.$Center.html(Lang.TranslateExpression(Lang.TranslateExpression(this.$Center.html(),this.pepin.lang),this.pepin.lang));
    },

    mouseover: function(event){
      //console.log('event',event.originalEvent);
      var el = event.originalEvent.target;

      while( !Util.IsUndefOrNull(el) && Util.IsUndef(el.hasHelp) )
      {
        el = el.parentNode;
      }

      if( !Util.IsUndefOrNull(el) && !Util.IsUndef(el.hasHelp) )
      {
        this.selectElement(el);
        this.tipOpen();
      }
      else
      {
        this.tipClose();
      }

    },

    mousemove: function(event){
      if( !this.enabled || Util.IsUndef(this.element) ){ return; }

      var top = this.$element.offset().top - this.$(window).scrollTop();
      var left = this.$element.offset().left - this.$(window).scrollLeft();

      this.width = this.$Tip.outerWidth();
      this.x = left;

      if( this.x + this.width + this.margin >= this.documentW )
      {
        this.x = this.documentW - this.width - this.margin;
      }

      this.height = this.$Tip.outerHeight();
      this.y = top + this.$element.outerHeight();

      if( this.y + this.height + this.margin >= this.documentH )
      {
        //this.y = this.documentH - this.height - this.margin;
        this.y = top - this.height;
      }
      
      //console.log(this.x,this.y);

      if( this.showTip )
      {

        this
          .$Tip
          .stop()
          .animate({
            top: this.y+'px',
            left: this.x+'px',
            opacity: 1.0
          },100);
      }
    },

    selectElement: function(element){
      this.element = element;
      this.$element = this.$(this.element);
      var message;
      var shortcuts = [];
      var helpTip = this.element.helpTip;

      if( this.element.tipKey )
      {
        shortcuts.push(this.element.tipKey);
      }

      if( helpTip.keys )
      {
        for( var i in helpTip.keys )
        {
          shortcuts.push( helpTip.keys[i] );
        }

        message = helpTip.message;
      }
      else
      {
        message = helpTip;
      }

      //console.log(shortcuts);

      message = Lang.TranslateExpression(message,this.pepin.lang);

      if( shortcuts.length > 0 )
      {
        message += '<br /><p class="pepin-help-shortcuts">' + ( shortcuts.length == 1 ? Lang.TranslateExpression('$shortcut£',this.pepin.lang) : Lang.TranslateExpression('$shortcuts£',this.pepin.lang) );

        for( var i in shortcuts )
        {
          message += (i > 0 ? ' , ' : '' ) + '<kbd>' + Lang.TranslateExpression(shortcuts[i],this.pepin.lang) + '</kbd>';
        }

        message +=  '</p>';
      }

      this.message = message;
    },

    tipOpen: function(){
      this.tip = true;
      //this.center = false;
    },

    tipClose: function(){
      this.tip = false;
      this.$Tip.css('opacity',0);
      //this.center = true;
      //this.updateCenter();
      //console.log('close',this.showCenter);
    },

    updateHeight: function(){
      if( !Util.IsUndef(this.$Center) )
      {
        this.centerHeight = this.$Center.children('div').outerHeight();
      }
      //console.log(this.centerHeight);
    },

    updateCenter: function(){
    }
  },

  events: {

    helpToggle: function(){
      this.enabled = this.pepin.enableHelp;

      Vue.nextTick(function(){
        this.pepinEvt('resize');
      }.bind(this));
    },


    dimensions: function(Dim){
      this.updateHeight();

      this.documentH = Dim.DocumentH;
      this.documentW = Dim.DocumentL;
      this.centerTop = Dim.CentreHaut + Dim.CentreH - this.margin - this.centerHeight;
      this.centerLeft = (Dim.CentreL-this.centerWidth)/2.0 + Dim.CentreGauche;

      this.updateCenter();
    },

  }

}
</script>

<template>
<div class="pepin-help">

  <div class="pepin-helpdiv pepin-help-tip"
    v-show="showTip"
  >
    <span v-if="showTip" class="pepin-helptip-span">{{{ message }}}</span>
  </div>

  <div
    class="pepin-helpdiv pepin-help-center"
    v-show="showCenter"
    :style="{
      height: centerHeight+'px',
      width: centerWidth+'px',
      top: centerTop+'px',
      left: centerLeft+'px'
    }"
  >
    <div class="pepin-help-center-content">

    <p>$ov_center1£</p>
    <p>$ov_center2£</p>

    <center>
      Pepin v3.19.8
    </center>
    <br />

    </div>

  </div>

</div>
</template>

<style lang="scss">
@import '../Colors.scss';

.pepin-help
{
  font-weight: normal;
  cursor: default;
  font-size: 16px;
  letter-spacing: 0;
  border: 4px solid $darkblue;
}

.pepin-helpdiv
{
  opacity: 1.0;
  display: block;
  z-index: 9000;
  position: fixed;
  width: auto;
  height: auto;
  background-color: rgba($darkgold,0.8);
  padding: 16px;
  color: #fff;
  top: 0;
  left: 0;
  border: 2px solid $gold;
  border-radius: 8px;
  max-width: 300px;
}

.pepin-helpdiv *
{
  font-size: 16px;
  line-height: 120%;
  text-align: justify;
}

.pepin-helpdiv p
{
  text-indent: 0;
}

.pepin-help-center
{
  max-width: 600px;
  position: fixed;
  line-height: 150%;
}

.pepin-help-center-content *
{
  line-height: 150%;
}

.pepin-help-center-content center
{
  text-align: center;
}

.pepin-help-center-content ol
{
  margin-left: 0;
  padding-left: 48px;
}

.pepin-help-center-content ol li
{
  padding: 4px;
  margin: 0;
}

.pepin-helptip-span b 
{
  color: lighten($gold,30%);
  font-size: 110%;
}

.pepin-help p.pepin-help-shortcuts
{
  text-align: right;
  padding: 0;
  margin: 8px 0 0 0;
}

</style>