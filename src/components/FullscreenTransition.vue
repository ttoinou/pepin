<script>
/*
 * Pepin Media Player - Antoine Dornstetter
 * 
 *   src/components/FullscreenTransition.vue
 *     - Create a transition when switching fullscreen
*          when placed in <pepin></pepin> 
 *
 */
import Util from '../Util.js'

export default {

  data: function(){
    return {
      name: 'fullscreen-transition',
      pepinAdd: false,
      pepified: false,
      lookForKeys: false,

      duration: 500
    }
  },
  
  ready: function(){
  },

  methods: {
    pepinReady: function(){
    },

    AnimateBG : function(){
      
      if( !Util.IsUndef(this.$Holder) )
      {

        this.$Holder
          .css({
            'opacity' : 1.0,
            'display' : 'block'
          })
          .animate({
            opacity: 0.0,
          },this.duration,function(){

            this.$Holder
              .css({
                opacity: 0.0,
                'display' : 'none'
              });

          }.bind(this));
      }

    },
  },

  events: {

    fullscreenEnable: function(){
      this.AnimateBG();
    },

    fullscreenDisable: function(){
      this.AnimateBG();
    },


  }

}
</script>

<template>
  <div class="pepin-fullscreen-transition"></div>
</template>

<style scoped lang="scss">
@import '../Colors.scss';

.pepin-fullscreen-transition
{
  opacity: 0.0;
  display: none;
  z-index: 10000;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: $darkblue;
}

</style>